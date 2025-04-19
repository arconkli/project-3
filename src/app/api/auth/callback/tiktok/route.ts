import { NextRequest } from 'next/server';
import { TikTokService } from '@/services/tiktok/TikTokService';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const code = searchParams.get('code');
        const error = searchParams.get('error');
        const errorDescription = searchParams.get('error_description');

        if (error) {
            return Response.redirect(`${process.env.NEXTAUTH_URL}/settings?error=${encodeURIComponent(errorDescription || error)}`);
        }

        if (!code) {
            return Response.redirect(`${process.env.NEXTAUTH_URL}/settings?error=No authorization code received`);
        }

        const tiktokService = new TikTokService();
        
        // Exchange code for access token
        const accessToken = await tiktokService.getAccessToken(code);
        
        // Get user info
        const tikTokUser = await tiktokService.getUserInfo(accessToken);

        // Get current user from session
        const supabase = createClient(
            process.env.SUPABASE_URL!,
            process.env.SUPABASE_ANON_KEY!
        );

        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session?.user) {
            return Response.redirect(`${process.env.NEXTAUTH_URL}/settings?error=No authenticated user found`);
        }

        // Store TikTok account
        const account = await tiktokService.storeTikTokAccount(
            session.user.id,
            tikTokUser,
            accessToken
        );

        // Fetch and store initial videos
        const { videos } = await tiktokService.getVideos(accessToken);
        await tiktokService.storeVideos(account.id, videos);

        return Response.redirect(`${process.env.NEXTAUTH_URL}/settings?success=TikTok account connected`);
    } catch (error) {
        console.error('TikTok authentication error:', error);
        return Response.redirect(
            `${process.env.NEXTAUTH_URL}/settings?error=${encodeURIComponent(error instanceof Error ? error.message : 'Failed to connect TikTok account')}`
        );
    }
} 