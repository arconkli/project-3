import { TikTokUser, TikTokVideoList, TikTokTokenResponse } from './types';

// Base URL for the TikTok API
const API_BASE_URL = 'https://open.tiktokapis.com/v2';

export class TikTokService {
    private readonly clientKey: string;
    private readonly clientSecret: string;
    private readonly redirectUri: string;

    constructor() {
        // Ensure environment variables are loaded using Vite/Node conventions
        this.clientKey = process.env.VITE_PUBLIC_TIKTOK_CLIENT_KEY!; // Public key can keep prefix if needed elsewhere
        this.clientSecret = process.env.TIKTOK_CLIENT_SECRET!; // Use non-prefixed name for server-side secret
        this.redirectUri = process.env.VITE_PUBLIC_TIKTOK_REDIRECT_URI!;

        // --- BEGIN DEBUG LOGGING ---
        console.log('[TikTokService Constructor] Raw Env Vars:', {
            key: process.env.VITE_PUBLIC_TIKTOK_CLIENT_KEY,
            secret: process.env.TIKTOK_CLIENT_SECRET, // Check the non-prefixed name here
            redirect: process.env.VITE_PUBLIC_TIKTOK_REDIRECT_URI,
        });
        console.log('[TikTokService Constructor] Service Properties:', {
            clientKey: this.clientKey,
            clientSecret: this.clientSecret, // Log the value read into the property
            redirectUri: this.redirectUri,
        });
        // --- END DEBUG LOGGING ---

        if (!this.clientKey || !this.clientSecret || !this.redirectUri) {
            // Update error message to reflect the change
            console.error("TikTok environment variables (VITE_PUBLIC_TIKTOK_CLIENT_KEY, TIKTOK_CLIENT_SECRET, VITE_PUBLIC_TIKTOK_REDIRECT_URI) are not set.");
            // Optionally throw an error or handle appropriately
            // throw new Error("TikTok environment variables not configured.");
        }
    }

    /**
     * Generates a secure random state parameter for OAuth.
     */
    private generateState(): string {
        // Using crypto for better randomness if available (browser/node)
        if (typeof crypto !== 'undefined' && crypto.randomUUID) {
            return crypto.randomUUID();
        }
        // Fallback for environments without crypto.randomUUID
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    /**
     * Get the OAuth Authorization URL for TikTok login.
     * Includes required scopes for fetching profile, stats, and video list.
     */
    getAuthUrl(): string {
        // Scopes needed for basic info, profile stats, and video list
        const scope = ['user.info.basic', 'user.info.profile', 'user.info.stats', 'video.list'].join(',');
        const state = this.generateState(); // Generate a unique state for security

        const params = new URLSearchParams({
            client_key: this.clientKey,
            redirect_uri: this.redirectUri,
            scope: scope,
            state: state,
            response_type: 'code',
        });

        // Construct the authorization URL
        return `https://www.tiktok.com/v2/auth/authorize?${params.toString()}`;
    }

    /**
     * Exchange authorization code for access token, refresh token, and other details.
     * @param code The authorization code received from TikTok redirect.
     * @param codeVerifier The PKCE code verifier string.
     * @returns Promise resolving to TikTokTokenResponse containing token details.
     */
    async exchangeCodeForToken(code: string, codeVerifier: string): Promise<TikTokTokenResponse> {
        const requestBody = new URLSearchParams({
            client_key: this.clientKey,
            client_secret: this.clientSecret,
            code: code,
            grant_type: 'authorization_code',
            redirect_uri: this.redirectUri,
            code_verifier: codeVerifier,
        });

        // --- BEGIN DEBUG LOGGING ---
        console.log('[exchangeCodeForToken] Request Body Params:', {
             client_key: this.clientKey,
             // Avoid logging the full secret in production, but log its presence/type for debugging
             client_secret_present: !!this.clientSecret,
             client_secret_type: typeof this.clientSecret,
             code_present: !!code,
             grant_type: 'authorization_code',
             redirect_uri: this.redirectUri,
             code_verifier_present: !!codeVerifier,
        });
        // console.log('[exchangeCodeForToken] Full Request Body:', requestBody.toString()); // Uncomment for extreme debugging
        // --- END DEBUG LOGGING ---

        const response = await fetch(`${API_BASE_URL}/oauth/token/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Cache-Control': 'no-cache',
            },
            body: requestBody,
        });

        const data = await response.json();

        if (!response.ok || data.error) {
            console.error('TikTok Token Exchange Error Response Data:', data);
            throw new Error(`Failed to get access token: ${data.error_description || data.message || 'Unknown error'} (Hint: ${data.error})`); // Include hint
        }

        // Ensure the response matches the expected structure
        if (!data.access_token || !data.open_id) {
             console.error('TikTok Token Response Malformed:', data);
             throw new Error('Received malformed token response from TikTok.');
        }

        return {
            access_token: data.access_token,
            expires_in: data.expires_in,       // Typically 86400 seconds (1 day)
            open_id: data.open_id,
            refresh_token: data.refresh_token,   // Typically valid for 31536000 seconds (1 year)
            refresh_expires_in: data.refresh_expires_in,
            scope: data.scope,               // Scopes granted, e.g., "user.info.basic,video.list"
            token_type: data.token_type ?? 'Bearer',
        };
    }

    /**
      * Refreshes an expired access token using a refresh token.
      * @param refreshToken The refresh token obtained during the initial code exchange.
      * @returns Promise resolving to TikTokTokenResponse containing the new token details.
      */
    async refreshAccessToken(refreshToken: string): Promise<TikTokTokenResponse> {
        const response = await fetch(`${API_BASE_URL}/oauth/token/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Cache-Control': 'no-cache',
            },
            body: new URLSearchParams({
                client_key: this.clientKey,
                client_secret: this.clientSecret,
                grant_type: 'refresh_token',
                refresh_token: refreshToken,
            }),
        });

        const data = await response.json();

        if (!response.ok || data.error) {
            console.error('TikTok Token Refresh Error:', data);
            // Consider specific handling if refresh token is invalid/expired
            throw new Error(`Failed to refresh access token: ${data.error_description || data.message || 'Unknown error'}`);
        }

        // Refresh token response might not include a *new* refresh token
        // It usually returns a new access token and its expiry.
        return {
            access_token: data.access_token,
            expires_in: data.expires_in,
            open_id: data.open_id, // Included for consistency, should match original
            scope: data.scope,         // Should match original scopes
            refresh_token: data.refresh_token, // Might be null or same as input
            refresh_expires_in: data.refresh_expires_in, // Might be null or same as input
            token_type: data.token_type ?? 'Bearer',
        };
    }


    /**
     * Get user information (requires user.info.basic scope).
     * Fields parameter specifies which user fields to retrieve.
     * @param accessToken The valid access token for the user.
     * @returns Promise resolving to the user's TikTok information.
     */
    async getUserInfo(accessToken: string): Promise<TikTokUser> {
        // Define the fields you want based on granted scopes (e.g., user.info.profile for more details)
        const fields = 'open_id,union_id,avatar_url,display_name,profile_deep_link,bio_description,is_verified'; // Basic fields
        // Add fields like follower_count, following_count, likes_count, video_count if user.info.stats scope is granted
        const statsFields = 'follower_count,following_count,likes_count,video_count'; // Requires user.info.stats scope
        // Adjust based on actual scopes granted during connection

        const url = `${API_BASE_URL}/user/info/?fields=${fields},${statsFields}`;

        const response = await fetch(url, {
            method: 'GET', // GET request for user info
            headers: {
                'Authorization': `Bearer ${accessToken}`,
            },
        });

        const data = await response.json();

        if (!response.ok || data.error?.code) {
            console.error('TikTok Get User Info Error:', data);
            throw new Error(`Failed to get user info: ${data.error?.message || 'Unknown error'} (Code: ${data.error?.code})`);
        }

        return data.data.user;
    }

    /**
     * Get a list of the user's public videos (requires video.list scope).
     * Supports pagination using cursor.
     * @param accessToken The valid access token for the user.
     * @param cursor Pagination cursor from previous response (optional, defaults to fetching the first page).
     * @param maxCount Number of videos per page (optional, defaults to 20).
     * @returns Promise resolving to a list of videos and pagination info.
     */
    async getVideos(accessToken: string, cursor: number = 0, maxCount: number = 20): Promise<TikTokVideoList> {
        // Define the fields you want for each video
        const fields = 'id,create_time,cover_image_url,share_url,video_description,duration,height,width,title,embed_html,embed_link,like_count,comment_count,share_count,view_count';

        const response = await fetch(`${API_BASE_URL}/video/list/?fields=${fields}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                cursor: cursor,
                max_count: maxCount,
            }),
        });

        const data = await response.json();

        if (!response.ok || data.error?.code) {
            console.error('TikTok Get Videos Error:', data);
            throw new Error(`Failed to get videos: ${data.error?.message || 'Unknown error'} (Code: ${data.error?.code})`);
        }

        return {
            videos: data.data.videos,
            cursor: data.data.cursor,
            has_more: data.data.has_more,
        };
    }

    // Removed storeTikTokAccount and storeVideos methods
    // Database interactions will be handled by the API route/Edge Function
}

// Define the types used by the service (can be moved to a separate types file)
// export interface TikTokTokenResponse { ... } // Already defined in ./types.ts
// export interface TikTokUser { ... } // Already defined in ./types.ts
// export interface TikTokVideo { ... } // Already defined in ./types.ts
// export interface TikTokVideoList { ... } // Already defined in ./types.ts
// export interface TikTokError { ... } // Already defined in ./types.ts 