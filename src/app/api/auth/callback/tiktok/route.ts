import { NextResponse, NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { TikTokService } from '@/services/tiktok/TikTokService';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr'; // Use ssr client for user session

// Function to create a Supabase client with SERVICE_ROLE privileges
// IMPORTANT: Use this client ONLY for operations requiring elevated permissions (like Vault)
const createAdminClient = () => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
        throw new Error('Supabase URL or Service Role Key is missing from environment variables.');
    }

    return createClient(supabaseUrl, serviceRoleKey, {
        auth: {
            // Required for service role client
            autoRefreshToken: false,
            persistSession: false,
        },
    });
};


export async function GET(request: NextRequest) {
    const cookieStore = cookies();
    const url = new URL(request.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');

    // TODO: Add state validation (compare received state with one stored in session/cookie)
    // if (!state || state !== storedState) { return NextResponse.redirect(new URL('/error?message=Invalid+state', request.url)); }

    if (!code) {
        console.error('TikTok callback error: No code parameter found.');
        // Redirect to an error page or settings page with an error message
        return NextResponse.redirect(new URL('/settings?error=tiktok_connection_failed', request.url));
    }

    const tiktokService = new TikTokService();
    const supabaseServerClient = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll();
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) => {
                        cookieStore.set(name, value, options);
                    });
                },
            },
        }
    );

    try {
        // 1. Get current user session
        const { data: { user }, error: userError } = await supabaseServerClient.auth.getUser();
        if (userError || !user) {
            console.error('TikTok callback error: User not authenticated.', userError);
            return NextResponse.redirect(new URL('/login?error=auth_required', request.url));
        }
        const userId = user.id;

        // 2. Exchange code for tokens
        const tokenResponse = await tiktokService.exchangeCodeForToken(code);

        // 3. Get TikTok user info
        const tikTokUserInfo = await tiktokService.getUserInfo(tokenResponse.access_token);

        // 4. Create Supabase admin client for Vault operations
        const supabaseAdmin = createAdminClient();

        // 5. Store tokens in Vault
        // Store Access Token
        const { data: accessTokenSecret, error: accessTokenError } = await supabaseAdmin.rpc('vault.create_secret', {
            secret: tokenResponse.access_token,
            name: `tiktok_access_token_${userId}`,
            description: `TikTok access token for user ${userId}`
        });
        if (accessTokenError) throw new Error(`Failed to store access token in Vault: ${accessTokenError.message}`);
        const accessTokenSecretId = accessTokenSecret?.id; // Extract the secret ID
        if (!accessTokenSecretId) throw new Error('Vault did not return an ID for the access token secret.');

        // Store Refresh Token (if it exists)
        let refreshTokenSecretId = null;
        if (tokenResponse.refresh_token) {
            const { data: refreshTokenSecret, error: refreshTokenError } = await supabaseAdmin.rpc('vault.create_secret', {
                secret: tokenResponse.refresh_token,
                name: `tiktok_refresh_token_${userId}`,
                description: `TikTok refresh token for user ${userId}`,
                // Optionally set expiry based on refresh_expires_in
            });
            if (refreshTokenError) throw new Error(`Failed to store refresh token in Vault: ${refreshTokenError.message}`);
            refreshTokenSecretId = refreshTokenSecret?.id;
            if (!refreshTokenSecretId) throw new Error('Vault did not return an ID for the refresh token secret.');
        }

        // 6. Calculate token expiry timestamp
        const now = new Date();
        const expiresAt = tokenResponse.expires_in
            ? new Date(now.getTime() + tokenResponse.expires_in * 1000)
            : null;

        // 7. Prepare data for platform_connections table
        const connectionData = {
            user_id: userId,
            platform: 'tiktok',
            platform_user_id: tikTokUserInfo.open_id,
            platform_username: tikTokUserInfo.display_name,
            access_token_secret_id: accessTokenSecretId,
            refresh_token_secret_id: refreshTokenSecretId,
            token_expires_at: expiresAt?.toISOString(),
            scopes: tokenResponse.scope?.split(',') ?? [],
            metadata: {
                avatar_url: tikTokUserInfo.avatar_url,
                profile_deep_link: tikTokUserInfo.profile_deep_link,
                union_id: tikTokUserInfo.union_id, // Store Union ID if available
                // Add other relevant info if needed
            },
            is_active: true,
            last_synced_at: null, // Mark as not synced yet
        };

        // 8. Upsert connection using the USER'S client (handles RLS correctly)
        // We upsert in case the user is reconnecting the same platform account
        const { error: upsertError } = await supabaseServerClient
            .from('platform_connections')
            .upsert(connectionData, { onConflict: 'user_id, platform' }) // Upsert based on user and platform uniqueness
            .select()
            .single();

        if (upsertError) {
            console.error('TikTok callback error: Failed to upsert platform connection', upsertError);
            // Attempt to delete the secrets created in Vault if DB upsert fails
            try {
                await supabaseAdmin.rpc('vault.delete_secret', { secret_id: accessTokenSecretId });
                if (refreshTokenSecretId) {
                    await supabaseAdmin.rpc('vault.delete_secret', { secret_id: refreshTokenSecretId });
                }
            } catch (cleanupError) {
                console.error('Failed to cleanup Vault secrets after DB upsert error:', cleanupError);
            }
            throw upsertError; // Rethrow original error
        }

        // 9. Redirect user back to settings page (or wherever appropriate)
        return NextResponse.redirect(new URL('/settings?success=tiktok_connected', request.url));

    } catch (error: any) {
        console.error('Error during TikTok OAuth callback:', error);
        // Redirect to an error page or settings page with a generic error message
        return NextResponse.redirect(new URL(`/settings?error=tiktok_connection_failed&message=${encodeURIComponent(error.message)}`, request.url));
    }
} 