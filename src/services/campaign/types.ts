export type CampaignStatus = 'draft' | 'pending_approval' | 'approved' | 'rejected' | 'active' | 'completed' | 'cancelled' | 'paused';
export type ContentType = 'original' | 'repurposed' | 'both';
export type PostStatus = 'pending' | 'approved' | 'rejected' | 'live';

export interface Campaign {
    id: string;
    brand_id: string;
    title: string;
    brief: {
        original: string | null;
        repurposed: string | null;
    };
    status: CampaignStatus;
    content_type: ContentType;
    budget: number;
    spent: number;
    start_date: string;
    end_date: string;
    requirements: {
        platforms: string[];
        contentGuidelines: string[];
        minViewsForPayout: string;
        totalBudget: string;
        payoutRate: {
            original: string;
            repurposed?: string;
        };
        hashtags?: {
            original: string;
            repurposed: string;
        };
        budget_allocation?: {
            original: number;
            repurposed: number;
        };
        view_estimates?: {
            total: number;
            original: number;
            repurposed: number;
        };
    };
    metrics: {
        views: number;
        engagement: number;
        creators_joined: number;
        posts_submitted: number;
        posts_approved: number;
        rejection_reason?: string;
    };
    created_at: string;
    updated_at: string;
    creators?: CampaignApplication[];
}

export interface CampaignApplication {
    id: string;
    campaign_id: string;
    creator_id: string;
    status: CampaignStatus;
    earned: number;
    engagement: number;
    metrics?: {
        rejection_reason?: string;
    };
    created_at: string;
    updated_at: string;
    campaign?: Campaign;
}

export interface CampaignSubmission {
    id: string;
    campaign_id: string;
    creator_id: string;
    platform: string;
    content_type: ContentType;
    post_url: string;
    status: PostStatus;
    views: number;
    engagement: number;
    earned: number;
    posted_at?: string;
    metrics: Record<string, any>;
    performance_data: {
        rejection_feedback?: string;
        [key: string]: any;
    };
    created_at: string;
    updated_at: string;
    campaign?: Campaign;
}

export interface CreateCampaignDTO {
    title: string;
    brief?: {
        original: string | null;
        repurposed: string | null;
    };
    content_type: ContentType;
    budget: number;
    start_date: string;
    end_date: string;
    platforms?: string[];
    requirements?: {
        contentGuidelines?: string[];
        minViewsForPayout?: string;
        totalBudget?: string;
        payoutRate?: {
            original: string;
            repurposed?: string;
        };
        hashtags?: {
            original: string;
            repurposed: string;
        };
        budget_allocation?: {
            original: number;
            repurposed: number;
        };
        view_estimates?: {
            total: number;
            original: number;
            repurposed: number;
        };
    };
}

export interface UpdateCampaignDTO {
    title?: string;
    brief?: {
        original?: string | null;
        repurposed?: string | null;
    };
    content_type?: ContentType;
    budget?: number;
    status?: CampaignStatus;
    start_date?: string;
    end_date?: string;
    platforms?: string[];
    pauseReason?: string;
    requirements?: {
        contentGuidelines?: string[];
        minViewsForPayout?: string;
        totalBudget?: string;
        payoutRate?: {
            original?: string;
            repurposed?: string;
        };
        hashtags?: {
            original?: string;
            repurposed?: string;
        };
        budget_allocation?: {
            original: number;
            repurposed: number;
        };
        view_estimates?: {
            total: number;
            original: number;
            repurposed: number;
        };
    };
}

export interface CreateApplicationDTO {
    campaign_id: string;
    platforms?: string[];
}

export interface CreateSubmissionDTO {
    campaign_id: string;
    platform: string;
    content_type: ContentType;
    post_url: string;
}

export interface CampaignAnalytics {
    views: number;
    engagement: number;
    creators_joined: number;
    posts_submitted: number;
    posts_approved: number;
    spent: number;
    roi: number;
    performance_by_platform: {
        [platform: string]: {
            views: number;
            engagement: number;
            spent: number;
        }
    };
    top_creators: Array<{
        creator_id: string;
        name: string;
        views: number;
        engagement: number;
        earned: number;
    }>;
    time_series: Array<{
        date: string;
        views: number;
        engagement: number;
        spent: number;
    }>;
} 