export interface Campaign {
  id: string;
  title: string;
  brand: string;
  status: 'active' | 'completed' | 'pending';
  views: number;
  earned: number;
  pendingPayout?: number;
  endDate: string;
  startDate: string;
  spent?: number;
  engagement?: number;
  brief?: {
    original?: string;
    repurposed?: string;
  };
  contentType?: 'original' | 'repurposed' | 'both';
  requirements: {
    platforms?: string[];
    contentGuidelines: string[];
    payoutRate?: {
      original?: string;
      repurposed?: string;
    };
    hashtags?: string[];
  };
  platforms?: string[];
  creatorCount?: number;
  joinDate?: string;
  posts?: Array<{
    platform: string;
    contentType: string;
    views: string;
    status: 'approved' | 'pending';
    postDate: string;
    earned: number;
  }>;
}

export interface AvailableCampaign {
  id: string;
  title: string;
  brand: string | {
    id: string;
    name: string;
    email: string;
    industry: string;
    website: string;
    contactName: string;
    contactPhone: string;
    verificationLevel: string;
    status: string;
  };
  status: 'active' | 'completed' | 'pending' | 'open' | 'available';
  spent?: number;
  views?: number;
  engagement?: number;
  startDate: string;
  endDate: string;
  brief: {
    original?: string;
    repurposed?: string;
  };
  contentType: 'original' | 'repurposed' | 'both';
  requirements: {
    platforms: string[];
    contentGuidelines: string[];
    payoutRate: {
      original?: string;
      repurposed?: string;
    };
    minViewsForPayout?: string;
    totalBudget?: string;
  };
  platforms: string[];
  creatorCount?: number;
  targetAudience?: {
    age?: [number, number];
    locations?: string[];
    interests?: string[];
  };
  metrics?: {
    minFollowers?: number;
    minEngagementRate?: number;
    averageViews?: number;
    creators_joined?: number;
    views?: number;
    engagement?: number;
    earnings?: number;
    pending_payout?: number;
  };
} 