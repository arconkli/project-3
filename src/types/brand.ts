export interface Campaign {
  id: string | number;
  title: string;
  status: 'active' | 'draft' | 'pending_approval' | 'pending-approval' | 'approved' | 'completed' | 'rejected' | 'cancelled';
  budget: number;
  spent: number;
  views: number;
  engagement: number;
  platforms: string[];
  startDate: string;
  endDate: string;
  brief: {
    original: string | null;
    repurposed: string | null;
  };
  creatorCount: number;
  contentType: 'original' | 'repurposed' | 'both';
  reachEstimate?: string;
  engagement_rate?: number;
  brand?: {
    id: string;
    name: string;
    industry: string;
    website?: string;
    contactName: string;
    contactEmail: string;
    contactPhone?: string;
    verificationLevel: string;
    status: string;
  };
  businessName?: string;
  budgetBreakdown?: {
    original: number;
    repurposed: number;
    platforms: Record<string, number>;
  };
  viewsBreakdown?: {
    original: number;
    repurposed: number;
    platforms: Record<string, number>;
  };
  targetViews?: number;
  platformPerformance?: Record<string, {
    views: number;
    engagement: number;
    ctr: number;
  }>;
  business?: {
    totalCampaigns: number;
    totalSpent: number;
    avgCampaignBudget: number;
    successRate: number;
    averageRoi: number;
    avgEngagementRate: number;
    avgViewsPerCampaign: number;
    previousCampaigns: Array<{
      title: string;
      budget: number;
      views: number;
      startDate: string;
      endDate: string;
      platforms: string[];
    }>;
  };
  completedPosts?: number;
  pendingPosts?: number;
  paymentStatus?: 'paid' | 'pending' | 'scheduled';
  paymentDate?: string;
  paymentMethod?: {
    type: string;
    last4?: string;
    email?: string;
  };
  earned?: number;
  metrics?: {
    views: number;
    engagement: number;
    creators_joined: number;
    posts_submitted: number;
    posts_approved: number;
    rejection_reason?: string;
    contentCount?: number;
    totalEngagement?: number;
    approvedContent?: number;
  };
  requirements: {
    contentGuidelines: string[];
    platforms: string[];
    totalBudget: string;
    payoutRate: {
      original: string;
      repurposed?: string;
    };
    hashtags?: {
      original: string;
      repurposed: string;
    };
    files?: Array<{
      name: string;
      url: string;
      type: string;
      size: number;
    }>;
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
  isActive?: boolean;
  creators?: Array<{
    id?: string;
    creator_id?: string;
    campaign_id?: string;
    name?: string;
    username?: string;
    status?: string;
    platforms?: string[];
    joined_at?: string;
    followers?: number | string;
    engagement?: number | string;
    metrics?: {
      posts_submitted?: number;
      views?: number;
    };
    creator?: {
      id?: string;
      email?: string;
    };
  }>;
  topCreators?: Array<{
    name: string;
    username: string;
    views: number;
    engagement: number;
  }>;
  topContent?: Array<{
    title: string;
    platform: string;
    creator: string;
    views: number;
    engagement: number;
  }>;
}

export interface BrandData {
  companyName: string;
  industry: string;
  email: string;
  password: string;
  logo: string | null;
  twoFactorEnabled: boolean;
  paymentMethods: PaymentMethod[];
  notificationPreferences: {
    email: boolean;
    creatorJoins: boolean;
    contentSubmissions: boolean;
    paymentAlerts: boolean;
  };
  connectedAccounts: {
    [platform: string]: Array<{
      id: string;
      username: string;
      followers: string;
      isVerified: boolean;
      isPrimary: boolean;
      addedOn: string;
    }>;
  };
}

export interface PaymentMethod {
  id: string;
  type: 'credit_card' | 'ach' | 'wire' | 'paypal' | 'stripe' | 'purchase_order';
  status: 'active' | 'pending' | 'expired' | 'failed';
  isDefault: boolean;
  createdAt: string;
  details: CreditCardDetails | ACHDetails | WireDetails | PayPalDetails | StripeDetails | PurchaseOrderDetails;
}

interface CreditCardDetails {
  last4: string;
  brand: string;
  expiryMonth: string;
  expiryYear: string;
  cardholderName: string;
  billingAddress: BillingAddress;
}

interface ACHDetails {
  bankName: string;
  accountType: 'checking' | 'savings';
  last4: string;
  routingNumber: string;
  accountHolderName: string;
  accountHolderType: 'individual' | 'company';
  billingAddress: BillingAddress;
}

interface WireDetails {
  bankName: string;
  accountNumber: string;
  routingNumber: string;
  swiftCode?: string;
  ibanNumber?: string;
  accountHolderName: string;
  billingAddress: BillingAddress;
}

interface PayPalDetails {
  email: string;
  accountId: string;
}

interface StripeDetails {
  accountId: string;
  accountType: 'standard' | 'express' | 'custom';
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
}

interface PurchaseOrderDetails {
  poNumber: string;
  companyName: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  billingAddress: BillingAddress;
  paymentTerms: string;
  creditLimit?: number;
}

interface BillingAddress {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface Transaction {
  id: string;
  type: 'charge' | 'refund';
  amount: number;
  date: string;
  status: 'completed' | 'pending' | 'failed';
  description: string;
  campaignId?: string;
  campaignTitle?: string;
  paymentMethod: {
    type: string;
    last4: string;
  };
}

export interface Creator {
  id: string;
  name: string;
  platforms: string[];
  followers: number;
  views: number;
  engagement: number;
  posts: number;
}

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'viewer';
  status: 'active' | 'pending';
}