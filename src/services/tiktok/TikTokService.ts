import { createClient } from '@supabase/supabase-js';
import { TikTokUser, TikTokVideo, TikTokVideoList, TikTokError } from './types';

export class TikTokService {
    private readonly clientKey: string;
    private readonly clientSecret: string;
    private readonly redirectUri: string;
    private readonly supabase;
    private readonly API_BASE_URL = 'https://open.tiktokapis.com/v2';

    constructor() {
        this.clientKey = process.env.TIKTOK_CLIENT_KEY!;
        this.clientSecret = process.env.TIKTOK_CLIENT_SECRET!;
        this.redirectUri = process.env.TIKTOK_REDIRECT_URI!;
        this.supabase = createClient(
            process.env.SUPABASE_URL!,
            process.env.SUPABASE_ANON_KEY!
        );
    }

    /**
     * Get the OAuth URL for TikTok login
     */
    getAuthUrl(): string {
        const scope = ['user.info.basic', 'user.info.profile', 'user.info.stats', 'video.list'];
        
        // Generate browser-compatible UUID for state
        const state = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
        
        const params = new URLSearchParams({
            client_key: this.clientKey,
            redirect_uri: this.redirectUri,
            scope: scope.join(','),
            state,
            response_type: 'code',
        });

        return `https://www.tiktok.com/auth/authorize?${params.toString()}`;
    }

    /**
     * Exchange authorization code for access token
     */
    async getAccessToken(code: string): Promise<string> {
        const response = await fetch(`${this.API_BASE_URL}/oauth/token`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Cache-Control': 'no-cache',
            },
            body: new URLSearchParams({
                client_key: this.clientKey,
                client_secret: this.clientSecret,
                code,
                grant_type: 'authorization_code',
                redirect_uri: this.redirectUri,
            }),
        });

        const data = await response.json();
        if (!response.ok) {
            throw new Error(`Failed to get access token: ${data.message}`);
        }

        return data.access_token;
    }

    /**
     * Get user information
     */
    async getUserInfo(accessToken: string): Promise<TikTokUser> {
        const response = await fetch(`${this.API_BASE_URL}/user/info/`, {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
            },
        });

        const data = await response.json();
        if (!response.ok) {
            throw new Error(`Failed to get user info: ${data.message}`);
        }

        return data.user;
    }

    /**
     * Get user's videos
     */
    async getVideos(accessToken: string, cursor = 0): Promise<TikTokVideoList> {
        const response = await fetch(`${this.API_BASE_URL}/video/list/`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                cursor,
                max_count: 20,
            }),
        });

        const data = await response.json();
        if (!response.ok) {
            throw new Error(`Failed to get videos: ${data.message}`);
        }

        return {
            videos: data.videos,
            cursor: data.cursor,
            has_more: data.has_more,
        };
    }

    /**
     * Store TikTok account in Supabase
     */
    async storeTikTokAccount(userId: string, tikTokUser: TikTokUser, accessToken: string) {
        const { data: account, error: accountError } = await this.supabase
            .from('social_media_accounts')
            .upsert({
                user_id: userId,
                platform: 'tiktok',
                platform_user_id: tikTokUser.open_id,
                username: tikTokUser.display_name,
                display_name: tikTokUser.display_name,
                profile_url: tikTokUser.profile_deep_link,
            })
            .select()
            .single();

        if (accountError) throw accountError;

        // Store access token
        const { error: tokenError } = await this.supabase
            .from('access_tokens')
            .upsert({
                social_media_account_id: account.id,
                access_token: accessToken,
            });

        if (tokenError) throw tokenError;

        // Store initial channel statistics
        const { error: statsError } = await this.supabase
            .from('channel_statistics')
            .insert({
                social_media_account_id: account.id,
                total_followers: tikTokUser.follower_count,
                total_posts: tikTokUser.video_count,
                total_likes: tikTokUser.likes_count,
            });

        if (statsError) throw statsError;

        return account;
    }

    /**
     * Store TikTok videos in Supabase
     */
    async storeVideos(accountId: string, videos: TikTokVideo[]) {
        for (const video of videos) {
            // Store basic video content
            const { data: content, error: contentError } = await this.supabase
                .from('social_media_content')
                .upsert({
                    social_media_account_id: accountId,
                    platform_content_id: video.id,
                    content_type: 'tiktok',
                    title: video.title,
                    media_url: video.share_url,
                    thumbnail_url: video.cover_image_url,
                    published_at: new Date(video.create_time * 1000),
                })
                .select()
                .single();

            if (contentError) throw contentError;

            // Store TikTok-specific metadata
            const { error: metadataError } = await this.supabase
                .from('tiktok_metadata')
                .upsert({
                    content_id: content.id,
                    sound_id: video.music.id,
                    sound_name: video.music.title,
                    sound_author: video.music.author,
                    duration_seconds: video.duration,
                });

            if (metadataError) throw metadataError;

            // Store initial metrics
            const { error: metricsError } = await this.supabase
                .from('content_metrics')
                .insert({
                    content_id: content.id,
                    likes: video.like_count,
                    comments: video.comment_count,
                    shares: video.share_count,
                    views: video.view_count,
                });

            if (metricsError) throw metricsError;
        }
    }
} 