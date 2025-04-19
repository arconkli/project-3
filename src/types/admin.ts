export interface AdminUser {
  id: string;
  role: 'superadmin' | 'admin' | 'moderator';
  permissions: AdminPermissions;
  created_at: string;
  updated_at: string;
  name: string;
  email: string;
  lastLogin: string;
  status: 'active' | 'inactive';
  assignedAreas: string[];
}

export interface AdminPermissions {
  reviews: boolean;
  tickets: boolean;
  campaigns: boolean;
  users: boolean;
  settings: boolean;
  payments: boolean;
  reports: boolean;
  audit: boolean;
}

export interface ContentReview {
  id: string;
  post_id: string;
  campaign_id: string;
  creator_id: string;
  reviewer_id: string;
  status: 'pending' | 'approved' | 'rejected';
  notes?: string;
  platform: string;
  contentType: 'original' | 'repurposed';
  postUrl: string;
  viewCount: number;
  submittedAt: string;
  created_at: string;
  updated_at: string;
}

interface AuditLog {
  id: string;
  admin_id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  ip_address: string;
  user_agent: string;
  success: boolean;
  details?: Record<string, any>;
  changes: Record<string, any>;
  created_at: string;
}

interface AdminDashboardStats {
  pendingReviews: number;
  openTickets: number;
  activeCampaigns: number;
  totalCreators: number;
  totalBrands: number;
  recentActions: AuditLog[];
  ticketStats: {
    totalOpen: number;
    highPriority: number;
    unassigned: number;
    avgResponseTime: number;
  };
  reviewStats: {
    pendingCount: number;
    todayApproved: number;
    todayRejected: number;
    avgReviewTime: number;
  };
  campaignStats: {
    activeCount: number;
    pendingApproval: number;
    totalBudget: number;
    avgEngagement: number;
  };
  userStats: {
    newToday: number;
    activeToday: number;
    verifiedCount: number;
    suspendedCount: number;
  };
}

export interface User {
  id: string;
  email: string;
  name: string | null;
  created_at: string;
  verification_level: string;
  status: string;
  type: 'creator' | 'brand' | 'admin';
  metrics: {
    total_views?: number;
    avg_view_rate?: number;
    total_engagement?: number;
    platform_stats?: Record<string, any>;
    earnings_stats?: Record<string, any>;
    content_stats?: Record<string, any>;
  };
  platforms: string[];
  profiles?: {
    bio: string | null;
    platforms: Record<string, any>;
    payment_info: Record<string, any>;
    notification_preferences: Record<string, any>;
  };
  brand_profiles?: {
    company_name: string;
    industry: string;
    website?: string;
    contact_name: string;
    contact_email: string;
    contact_phone?: string;
  } | null;
  platform_connections?: Array<{
    platform: string;
    platform_username: string;
    is_active: boolean;
  }>;
}