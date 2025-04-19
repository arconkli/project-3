export interface TikTokUser {
    open_id: string;
    union_id: string;
    avatar_url: string;
    avatar_url_100: string;
    avatar_large_url: string;
    display_name: string;
    bio_description: string;
    profile_deep_link: string;
    is_verified: boolean;
    follower_count: number;
    following_count: number;
    likes_count: number;
    video_count: number;
}

export interface TikTokVideo {
    id: string;
    share_url: string;
    title: string;
    create_time: number;
    cover_image_url: string;
    share_count: number;
    like_count: number;
    comment_count: number;
    view_count: number;
    duration: number;
    height: number;
    width: number;
    format: string;
    embed_html: string;
    embed_link: string;
    music: TikTokMusic;
}

export interface TikTokMusic {
    id: string;
    title: string;
    author: string;
    duration: number;
    play_url: string;
}

export interface TikTokVideoList {
    videos: TikTokVideo[];
    cursor: number;
    has_more: boolean;
}

export interface TikTokError {
    code: number;
    message: string;
    log_id: string;
} 