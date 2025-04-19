export interface Post {
  platform: string;
  views: string;
  earned: number;
  status: 'approved' | 'pending' | 'denied';
  postDate?: string;
  contentType: 'original' | 'repurposed';
}

interface CampaignRequirements {
  platforms: string[];
  contentGuidelines: string[];
  minViewsForPayout?: string;
  totalBudget?: string;
  payoutRate: {
    original: string;
    repurposed?: string;
  };
}

export interface Campaign {
  id: string | number;
  title: string;
  earned: number;
  pendingPayout: number;
  views: string;
  endDate: string;
  status: string;
  startDate: string;
  brief: string;
  budget: number;
  spent: number;
  engagement: number;
  creatorCount: number;
  engagement_rate?: number;
  completedPosts?: number;
  pendingPosts?: number;
  reachEstimate?: string;
  contentType: 'original' | 'repurposed' | 'both';
  requirements: CampaignRequirements;
  posts: Post[];
  startDate: string;
  brief: string;
  budget: number;
  spent: number;
  engagement: number;
  creatorCount: number;
  engagement_rate?: number;
  completedPosts?: number;
  pendingPosts?: number;
  reachEstimate?: string;
}

export interface AvailableCampaign {
  id: number;
  title: string;
  views: string;
  endDate: string;
  status: string;
  contentType: 'original' | 'repurposed' | 'both';
  requirements: CampaignRequirements;
}