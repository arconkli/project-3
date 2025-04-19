import React, { useState, useEffect } from 'react';
import { X, Eye, Calendar, DollarSign, Check, AlertCircle, Youtube, Instagram, Twitter, FileText, ArrowUpRight, ChevronRight, Building, Target, Clock, Users, TrendingUp, Hash, BarChart, Share2, Smartphone, Award, Heart, MessageCircle, Video, PieChart, User, UserPlus, Activity, Mail, Edit } from 'lucide-react';
import { formatMoney, formatNumber } from '@/utils/format';
import { motion, AnimatePresence } from 'framer-motion';

// Define expanded types locally instead of trying to augment the imported type
interface Post {
  platform: string;
  status: string;
  views: number | string;
  earned: number | string;
  postDate?: string | Date;
}

interface Brand {
  name?: string;
  industry?: string;
  website?: string;
  contactName?: string;
  email?: string;
  contactPhone?: string;
  verificationLevel?: string;
  status?: string;
}

interface PayoutRate {
  original?: string;
  repurposed?: string;
}

interface Hashtags {
  original?: string;
  repurposed?: string;
}

interface Brief {
  original?: string;
  repurposed?: string;
  goal?: string;
}

interface File {
  name: string;
  url: string;
  size: number;
}

interface CreatorPerformance {
  name?: string;
  username?: string;
  followers?: string | number;
  posts?: number;
  views?: number;
  engagement?: string;
  performance?: 'high' | 'medium' | 'low' | string;
}

interface JoinedCreator {
  id?: string;
  name?: string;
  username?: string;
  followers?: string | number;
  profilePic?: string;
  status?: string;
}

interface PlatformBreakdown {
  name: string;
  posts: number;
  percentage: number;
}

interface CampaignMetrics {
  totalPosts?: number;
  totalViews?: number;
  avgEngagementRate?: string;
  totalLikes?: number;
  totalComments?: number;
  totalShares?: number;
  totalSaves?: number;
  viewToEngagementRate?: string;
  creatorPerformance?: CreatorPerformance[];
  platformBreakdown?: PlatformBreakdown[];
  costPerView?: string;
  costPerEngagement?: string;
  brandAwarenessIncrease?: string;
  audienceGrowth?: string;
  sentimentScore?: string;
  totalReach?: number;
  performanceVsBenchmark?: string;
  rejection_reason?: string;
  totalCreators?: number;
}

interface CampaignRequirements {
  platforms: string[];
  contentGuidelines?: string[];
  hashtags?: Hashtags;
  payoutRate?: PayoutRate;
  minViewsForPayout: number | string;
  files?: File[];
  goal?: string;
  budget_allocation?: {
    original: number;
    repurposed: number;
  };
  view_estimates?: {
    total: number;
    original: number;
    repurposed: number;
  };
}

interface Campaign {
  id: string;
  title: string;
  status: string;
  isActive?: boolean;
  budget: number;
  spent?: number;
  views?: number;
  engagement_rate?: string;
  completedPosts?: number;
  earned?: number | string;
  startDate?: string | Date;
  start_date?: string | Date;
  endDate?: string | Date;
  end_date?: string | Date;
  requirements: CampaignRequirements;
  brief?: Brief;
  contentType?: string;
  content_type?: string;
  type?: string;
  brand?: Brand;
  description?: string;
  goal?: string;
  objective?: string;
  campaign_goal?: string;
  goal_type?: string;
  objective_type?: string;
  campaign_type?: string;
  joinedCreators?: number | JoinedCreator[];
  creatorCount?: number;
  creators?: JoinedCreator[];
  metrics?: CampaignMetrics;
  metadata?: Record<string, any>;
  data?: Record<string, any>;
  posts?: Post[];
  paymentStatus?: string;
  paymentDate?: string | Date;
  paymentMethod?: {
    type: string;
    last4?: string;
    email?: string;
  };
  created_at?: string | Date;
  [key: string]: any;
}

// Alias for backward compatibility
type AvailableCampaign = Campaign;

interface ConnectedAccount {
  id: string;
  username: string;
  followers: string;
  isVerified: boolean;
  isPrimary: boolean;
  addedOn: string;
}

interface AccountSelection {
  [platform: string]: {
    accountIds: string[];
    accountTypes: {
      [accountId: string]: 'original' | 'repurposed' | null;
    };
  };
}

interface CampaignDetailModalProps {
  campaign: Campaign | AvailableCampaign;
  onClose: () => void;
  onJoin?: () => void;
  onEdit?: (campaign: Campaign | AvailableCampaign) => void;
  userType?: 'creator' | 'brand' | 'admin';
  onApprove?: (campaign: Campaign) => void;
  onReject?: (campaign: Campaign, reason: string) => void;
  isLoading?: boolean; // <-- Add isLoading prop
}

// Sample connected accounts data (in a real app, this would come from your user state/context)
const connectedAccounts: { [key: string]: ConnectedAccount[] | undefined } = { // <-- Add index signature
  instagram: [
    {
      id: 'ig1',
      username: 'creator.main',
      followers: '180K',
      isVerified: true,
      isPrimary: true,
      addedOn: '2025-01-15'
    },
    {
      id: 'ig2',
      username: 'creator.gaming',
      followers: '85K',
      isVerified: true,
      isPrimary: false,
      addedOn: '2025-02-01'
    }
  ],
  tiktok: [
    {
      id: 'tt1',
      username: 'creator',
      followers: '500K',
      isVerified: true,
      isPrimary: true,
      addedOn: '2024-12-20'
    }
  ],
  youtube: [
    {
      id: 'yt1',
      username: 'Creator Official',
      followers: '250K',
      isVerified: true,
      isPrimary: true,
      addedOn: '2025-01-10'
    }
  ]
};

// Helper to check if campaign is active
const isActiveCampaign = (campaign: Campaign | AvailableCampaign): campaign is Campaign => {
  return 'posts' in campaign;
};

// Status Label Component
const StatusLabel = ({ status }: { status: string }) => {
  let bgColor, textColor, label;

  switch (status.toLowerCase()) {
    case 'active':
      bgColor = 'bg-green-900/20';
      textColor = 'text-green-400';
      label = 'ACTIVE';
      break;
    case 'approved':
      bgColor = 'bg-green-900/20';
      textColor = 'text-green-400';
      label = 'APPROVED';
      break;
    case 'rejected':
      bgColor = 'bg-red-900/20';
      textColor = 'text-red-400';
      label = 'REJECTED';
      break;
    case 'pending':
    case 'pending_approval':
    case 'pending-approval':
      bgColor = 'bg-yellow-900/20';
      textColor = 'text-yellow-400';
      label = 'PENDING APPROVAL';
      break;
    case 'draft':
      bgColor = 'bg-gray-900/20';
      textColor = 'text-gray-400';
      label = 'DRAFT';
      break;
    case 'completed':
      bgColor = 'bg-blue-900/20';
      textColor = 'text-blue-400';
      label = 'COMPLETED';
      break;
    case 'cancelled':
      bgColor = 'bg-red-900/20';
      textColor = 'text-red-400';
      label = 'CANCELLED';
      break;
    default:
      bgColor = 'bg-gray-900/20';
      textColor = 'text-gray-400';
      label = status.toUpperCase();
  }

  return (
    <span className={`px-3 py-1 rounded-full text-sm font-medium ${bgColor} ${textColor}`} role="status">
      {label}
    </span>
  );
};

// Add type definitions for creator-related data structures
interface CreatorPerformance {
  name?: string;
  username?: string;
  followers?: string | number;
  posts?: number;
  views?: number;
  engagement?: string;
  performance?: 'high' | 'medium' | 'low' | string;
}

interface JoinedCreator {
  id?: string;
  name?: string;
  username?: string;
  followers?: string | number;
  profilePic?: string;
  status?: string;
}

const CampaignDetailModal: React.FC<CampaignDetailModalProps> = ({ 
  campaign, 
  onClose, 
  onJoin,
  onEdit,
  userType = 'creator',
  onApprove,
  onReject,
  isLoading // <-- Destructure isLoading prop
}) => {
  const [showAccountSelection, setShowAccountSelection] = useState(false);
  const [selectedAccounts, setSelectedAccounts] = useState<AccountSelection>({});
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showRejectDialog, setShowRejectDialog] = useState(false); // Keep this if needed for brand/admin
  const [rejectReason, setRejectReason] = useState(''); // Keep this if needed

  // --- Define Helper Functions FIRST ---

  // Helper to get fields safely, trying multiple possible paths
  const getCampaignField = (fieldOptions: string[], fallback: any = null) => {
    for (const fieldPath of fieldOptions) {
      const pathParts = fieldPath.split('.');
      let value = campaign as any;
      try {
        for (const part of pathParts) {
          if (value === null || value === undefined) {
            throw new Error('Path broken');
          }
          value = value[part];
        }
        if (value !== null && value !== undefined) {
          // console.log(`[getCampaignField] Found value for ${fieldPath}:`, value);
          return value;
        }
      } catch (e) {
        // Path doesn't exist or value is null/undefined, try next option
      }
    }
    // console.log(`[getCampaignField] Using fallback for ${fieldOptions.join(' or ')}:`, fallback);
    return fallback;
  };

  // Function to find view estimates or budget allocation, checking multiple locations
  const findCampaignData = (dataType: 'view_estimates' | 'budget_allocation') => {
    const primaryPath = `requirements.${dataType}`;
    const secondaryPath = `data.${dataType}`;
    const tertiaryPath = `metadata.${dataType}`;
    const directPath = dataType;

    let data = getCampaignField([primaryPath]);
    if (data) {
      // console.log(`Found ${dataType} at path: ${primaryPath}`, data);
      return data;
    } 
    
    // Check alternative paths if not found in requirements
    data = getCampaignField([secondaryPath, tertiaryPath, directPath]);
    if (data) {
       // console.log(`Found ${dataType} at alternative path: ${secondaryPath} or ${tertiaryPath} or ${directPath}`, data);
       return data;
    } 
    
    // console.log(`Could not find ${dataType} data.`);
    return null;
  };

  // Calculate view estimates or budget allocation (potentially redundant with findCampaignData, review later)
  const calculateCampaignData = (dataType: 'view_estimates' | 'budget_allocation') => {
    // Priority: campaign.requirements.dataType
    if (campaign.requirements?.[dataType]) {
      // console.log(`Calculated ${dataType} from requirements:`, campaign.requirements[dataType]);
      return campaign.requirements[dataType];
    }
    // Fallback: campaign.data.dataType
    if (campaign.data?.[dataType]) {
      // console.log(`Calculated ${dataType} from data:`, campaign.data[dataType]);
      return campaign.data[dataType];
    }
    // Fallback: campaign.metadata.dataType
    if (campaign.metadata?.[dataType]) {
       // console.log(`Calculated ${dataType} from metadata:`, campaign.metadata[dataType]);
       return campaign.metadata[dataType];
    }
    // Fallback: campaign.dataType (direct)
    if (campaign[dataType]) {
       // console.log(`Calculated ${dataType} from direct property:`, campaign[dataType]);
       return campaign[dataType];
    }

    // console.log(`Could not calculate ${dataType}.`);
    return null; // Return null or appropriate default
  };

  // Function to find the campaign goal, checking multiple possible fields
  const findCampaignGoal = () => {
    // console.log('[findCampaignGoal] Starting goal detection process');
    const possibleGoalFields = [
      'campaign_goal', 'goal', 'objective', 'campaign_type', 'objective_type', 'goal_type', 
      'requirements.goal', 'brief.goal', 'metadata.goal', 'metadata.objective', 
      'metadata.objective_type', 'metadata.campaign_type', 'data.goal', 'data.objective', 
      'data.objective_type', 'data.campaign_type'
    ];
    for (const field of possibleGoalFields) {
      const value = getCampaignField([field]);
      // console.log(`[findCampaignGoal] Checking field: ${field} = `, value);
      if (value && typeof value === 'string' && value.trim() !== '') {
        // console.log(`[findCampaignGoal] Found goal in field '${field}': ${value}`);
        return value;
      }
    }
    // console.log('[findCampaignGoal] No specific goal field found, using fallback.');
    return 'Not specified'; // Fallback if no specific goal field is found
  };
  
  // Function to get the count of joined creators, checking multiple possible fields
  const getJoinedCreatorsCount = () => {
    const creatorsDirect = getCampaignField(['creators']);
    if (Array.isArray(creatorsDirect)) {
      // console.log('Found creators array with length:', creatorsDirect.length);
      return creatorsDirect.length;
    }
    const count = getCampaignField(['joined_creators_count', 'creatorCount', 'metrics.totalCreators'], 0);
    // console.log('Found joined creators count:', count);
    return typeof count === 'number' ? count : 0;
  };

  // Format Date
  const formatDate = (date: string | Date | null | undefined) => {
    if (!date) return 'N/A';
    try {
      return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(date));
    } catch (e) {
      return 'Invalid Date';
    }
  };

  // --- Derive Variables from Props and Helpers ---
  const campaignGoal = findCampaignGoal();
  const campaignStartDate = getCampaignField(['startDate', 'start_date']);
  const campaignEndDate = getCampaignField(['endDate', 'end_date']);
  const campaignContentType = getCampaignField(['contentType', 'content_type'], 'unknown');
  const campaignBudget = parseFloat(getCampaignField(['budget', 'requirements.totalBudget'], 0)) || 0;
  const campaignSpent = parseFloat(getCampaignField(['spent'], 0)) || 0;
  const joinedCreatorsCount = getJoinedCreatorsCount();
  const viewEstimates = findCampaignData('view_estimates');
  const budgetAllocation = findCampaignData('budget_allocation');

  // Derive brief and payout vars needed for creator view - define them here
  const campaignBriefOriginal = campaign.brief?.original;
  const campaignBriefRepurposed = campaign.brief?.repurposed;
  const payoutRateOriginal = campaign.requirements?.payoutRate?.original;
  const payoutRateRepurposed = campaign.requirements?.payoutRate?.repurposed;

  // --- Effects ---
  useEffect(() => {
    // Initialize selected accounts based on required platforms
    const initialSelection: AccountSelection = {};
    (campaign.requirements?.platforms || []).forEach(platform => {
      const platformKey = platform.toLowerCase();
      initialSelection[platformKey] = { accountIds: [], accountTypes: {} };
      // Pre-select the primary account if only one exists for a platform
      // const accounts = connectedAccounts[platformKey];
      // if (accounts && accounts.length === 1) {
      //   initialSelection[platformKey].accountIds = [accounts[0].id];
      //   if (campaignContentType === 'both') {
      //      initialSelection[platformKey].accountTypes[accounts[0].id] = null; // Require selection
      //   } else {
      //      initialSelection[platformKey].accountTypes[accounts[0].id] = campaignContentType as 'original' | 'repurposed';
      //   }
      // }
    });
    setSelectedAccounts(initialSelection);

    // Reset state when campaign changes
    setShowAccountSelection(false);
    setShowConfirmation(false);
    setTermsAccepted(false);
    setError(null);

  }, [campaign]); // Rerun when campaign changes

  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  // --- Event Handlers ---
  const handleStartJoin = () => {
    setShowAccountSelection(true);
    setShowConfirmation(false); // Ensure confirmation is hidden
  };

  const handleAccountSelect = (platform: string, accountId: string, isSelected: boolean) => {
    setSelectedAccounts(prev => {
      const currentPlatform = prev[platform] || { accountIds: [], accountTypes: {} };
      const accountIds = isSelected
        ? [...currentPlatform.accountIds, accountId]
        : currentPlatform.accountIds.filter(id => id !== accountId);
      
      const accountTypes = { ...currentPlatform.accountTypes };
      if (!isSelected) {
        delete accountTypes[accountId]; // Remove type if deselected
      } else if (campaignContentType !== 'both') {
         accountTypes[accountId] = campaignContentType as 'original' | 'repurposed';
      } else {
         accountTypes[accountId] = null; // Require selection for 'both'
      }

      return {
        ...prev,
        [platform]: { accountIds, accountTypes }
      };
    });
  };

  const handleContentTypeSelect = (platform: string, accountId: string, contentType: 'original' | 'repurposed') => {
    setSelectedAccounts(prev => {
      const platformSelection = prev[platform];
      if (!platformSelection) return prev; // Should not happen
      return {
        ...prev,
        [platform]: {
          ...platformSelection,
          accountTypes: {
            ...platformSelection.accountTypes,
            [accountId]: contentType
          }
        }
      };
    });
  };

  const handleSubmitJoin = () => {
    // Basic validation: ensure at least one account is selected
    const isAnyAccountSelected = Object.values(selectedAccounts).some(p => p.accountIds.length > 0);
    if (!isAnyAccountSelected) {
      setError('Please select at least one account to join the campaign.');
      return;
    }
    
    // Validate content types are selected if content type is 'both'
    if (campaignContentType === 'both') {
       const missingContentTypes = Object.values(selectedAccounts).some(platformSelection => {
         if (!platformSelection || !platformSelection.accountTypes) {
           // If accountTypes itself is missing for a platform with selected accounts, consider it an error
           return platformSelection.accountIds.length > 0; 
         }
         return platformSelection.accountIds.some(accountId => 
           platformSelection.accountTypes[accountId] === null || platformSelection.accountTypes[accountId] === undefined
         );
       });
       if (missingContentTypes) {
        setError('Please select a content type (Original/Repurposed) for each selected account.');
        return;
      }
    }
    
    // Show confirmation step
    setError(null);
    setShowAccountSelection(false);
    setShowConfirmation(true);
  };

  const handleConfirmJoin = () => {
    if (!termsAccepted) {
      setError('Please accept the campaign terms and requirements');
      return;
    }
    
    // Call the join handler passed from the parent (CreatorCampaignDetailModal)
    // This handler should contain the actual Supabase call
    if (onJoin) {
      // We might need to pass selectedAccounts data to the onJoin handler
      // For now, just calling it as it was originally
      onJoin(); 
    } else {
      console.error('onJoin handler is missing!');
      setError('Could not process join request. Missing handler.');
    }
  };

   const handleReject = () => {
    if (!rejectReason) {
      setError('Please provide a reason for rejection.');
      return;
    }
    if (onReject) {
      onReject(campaign as Campaign, rejectReason);
      setShowRejectDialog(false);
      onClose(); // Close main modal after rejection
    }
  };

  // <<< RENDER LOGIC STARTS HERE >>>

  // --- Brand View Rendering ---
  if (userType === 'brand') {
    return (
      <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 z-50">
        <div className="bg-black rounded-xl w-full max-w-5xl max-h-[90vh] overflow-y-auto">
          <div className="sticky top-0 z-10 bg-black/95 border-b border-gray-800/60 p-4 flex items-center justify-between backdrop-blur-sm">
            <h2 className="text-xl font-bold text-white">{campaign.title}</h2>
            <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-lg transition-colors">
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="p-6 space-y-8">
            {/* Status Information */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <StatusLabel status={campaign.status} />
                {campaign.isActive && (
                  <span className="px-3 py-1 rounded-full bg-blue-900/20 text-blue-400 text-xs font-medium">
                    Live Campaign
                  </span>
                )}
              </div>

              {onEdit && (
                <button
                  onClick={() => onEdit(campaign)}
                  className="flex items-center gap-1 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-white text-sm transition-colors"
                >
                  <FileText className="h-4 w-4" />
                  Edit Campaign
                </button>
              )}
            </div>

            {/* Rejection Feedback (if rejected) */}
            {campaign.status === 'rejected' && campaign.metrics?.rejection_reason && (
              <div className="p-4 bg-red-900/10 border border-red-800/30 rounded-lg">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="text-red-400 font-medium mb-1">Campaign Rejected</h3>
                    <p className="text-gray-300">{campaign.metrics.rejection_reason}</p>
                    <div className="mt-3">
                      {userType === 'brand' ? (
                        <div className="mt-3">
                          <p className="text-sm text-gray-300 mb-2">
                            To resubmit this campaign with changes, please email us at:
                          </p>
                          <a
                            href="mailto:brands@create-os.com"
                            className="text-sm px-3 py-1.5 bg-blue-600 hover:bg-blue-700 rounded text-white inline-flex items-center gap-1"
                          >
                            brands@create-os.com
                            <ArrowUpRight className="h-3 w-3" />
                          </a>
                        </div>
                      ) : (
                        <button
                          onClick={() => onEdit?.(campaign)}
                          className="text-sm px-3 py-1.5 bg-red-600 hover:bg-red-700 rounded text-white"
                        >
                          Edit Campaign to Resubmit
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Campaign Performance Dashboard (for active/completed campaigns) */}
            {(campaign.status === 'active' || campaign.status === 'completed' || campaign.status === 'approved') && (
              <div className="bg-black/50 rounded-xl p-6 border border-gray-900">
                <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                  <BarChart className="h-6 w-6 text-purple-400" />
                  Campaign Performance
                </h3>
              
                {/* Top Stats Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                  <div className="bg-black/40 rounded-lg p-4 border border-gray-800">
                    <div className="flex items-center gap-2 mb-2">
                      <Video className="h-5 w-5 text-blue-400" />
                      <p className="text-sm text-gray-400">Total Content</p>
                    </div>
                    <p className="text-2xl font-bold">{campaign.metrics?.totalPosts || '0'}</p>
                    <p className="text-xs text-gray-500">videos published</p>
                  </div>
                  
                  <div className="bg-black/40 rounded-lg p-4 border border-gray-800">
                    <div className="flex items-center gap-2 mb-2">
                      <Eye className="h-5 w-5 text-green-400" />
                      <p className="text-sm text-gray-400">Total Views</p>
                    </div>
                    <p className="text-2xl font-bold">{formatNumber(campaign.metrics?.totalViews || 0)}</p>
                    <p className="text-xs text-gray-500">across all platforms</p>
                  </div>
                  
                  <div className="bg-black/40 rounded-lg p-4 border border-gray-800">
                    <div className="flex items-center gap-2 mb-2">
                      <User className="h-5 w-5 text-orange-400" />
                      <p className="text-sm text-gray-400">Creators</p>
                    </div>
                    <p className="text-2xl font-bold">{joinedCreatorsCount}</p>
                    <p className="text-xs text-gray-500">joined campaign</p>
                  </div>
                  
                  <div className="bg-black/40 rounded-lg p-4 border border-gray-800">
                    <div className="flex items-center gap-2 mb-2">
                      <Heart className="h-5 w-5 text-red-400" />
                      <p className="text-sm text-gray-400">Engagement</p>
                    </div>
                    <p className="text-2xl font-bold">{campaign.metrics?.avgEngagementRate || '0%'}</p>
                    <p className="text-xs text-gray-500">average rate</p>
                  </div>
                </div>
                
                {/* Platform Distribution */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                  <div className="bg-black/30 rounded-lg p-5 border border-gray-800">
                    <h4 className="font-medium mb-4 flex items-center gap-2">
                      <PieChart className="h-5 w-5 text-blue-400" />
                      Content Distribution by Platform
                    </h4>
                    
                    <div className="space-y-4">
                      {(campaign.metrics?.platformBreakdown || []).map((platform, index) => (
                        <div key={index} className="relative">
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                              {platform.name === 'Instagram' && <Instagram className="h-4 w-4 text-pink-400" />}
                              {platform.name === 'TikTok' && (
                                <svg className="h-4 w-4 text-cyan-400" viewBox="0 0 24 24" fill="currentColor">
                                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
                                </svg>
                              )}
                              {platform.name === 'YouTube' && <Youtube className="h-4 w-4 text-red-400" />}
                              {platform.name === 'Twitter' && <Twitter className="h-4 w-4 text-blue-400" />}
                              
                              <span className="text-sm">{platform.name}</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-sm font-medium">{platform.posts} posts</span>
                              <span className="text-xs text-gray-500">{platform.percentage}%</span>
                            </div>
                          </div>
                          <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                            <div 
                              className={`h-full ${
                                platform.name === 'Instagram' ? 'bg-pink-500' :
                                platform.name === 'TikTok' ? 'bg-cyan-500' :
                                platform.name === 'YouTube' ? 'bg-red-500' :
                                'bg-blue-500'
                              }`}
                              style={{ width: `${platform.percentage}%` }}
                            ></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="bg-black/30 rounded-lg p-5 border border-gray-800">
                    <h4 className="font-medium mb-4 flex items-center gap-2">
                      <Activity className="h-5 w-5 text-green-400" />
                      Engagement Metrics
                    </h4>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-400 mb-1">Likes</p>
                        <p className="text-xl font-bold">{formatNumber(campaign.metrics?.totalLikes || 0)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-400 mb-1">Comments</p>
                        <p className="text-xl font-bold">{formatNumber(campaign.metrics?.totalComments || 0)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-400 mb-1">Shares</p>
                        <p className="text-xl font-bold">{formatNumber(campaign.metrics?.totalShares || 0)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-400 mb-1">Saves</p>
                        <p className="text-xl font-bold">{formatNumber(campaign.metrics?.totalSaves || 0)}</p>
                      </div>
                    </div>
                    
                    <div className="mt-4 pt-4 border-t border-gray-700">
                      <div className="flex justify-between items-center mb-2">
                        <p className="text-sm text-gray-400">View to Engagement Rate</p>
                        <p className="text-sm font-medium">{campaign.metrics?.viewToEngagementRate || '0%'}</p>
                      </div>
                      <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-purple-500 to-red-500"
                          style={{ width: `${parseFloat(campaign.metrics?.viewToEngagementRate || '0')}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Creator Participation */}
                <div className="bg-black/30 rounded-lg p-5 border border-gray-800">
                  <h4 className="font-medium mb-4 flex items-center gap-2">
                    <Users className="h-5 w-5 text-purple-400" />
                    Creator Participation
                  </h4>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[600px] border-collapse">
                      <thead>
                        <tr className="border-b border-gray-800">
                          <th className="text-left py-3 text-xs font-medium text-gray-400">Creator</th>
                          <th className="text-left py-3 text-xs font-medium text-gray-400">Followers</th>
                          <th className="text-left py-3 text-xs font-medium text-gray-400">Posts</th>
                          <th className="text-left py-3 text-xs font-medium text-gray-400">Views</th>
                          <th className="text-left py-3 text-xs font-medium text-gray-400">Engagement</th>
                          <th className="text-left py-3 text-xs font-medium text-gray-400">Performance</th>
                        </tr>
                      </thead>
                      <tbody>
                        {joinedCreatorsCount > 0 ? (
                          // If we have creator performance data, show it
                          Array.isArray(campaign.metrics?.creatorPerformance) && campaign.metrics.creatorPerformance.length > 0 ? (
                            campaign.metrics.creatorPerformance.map((creator: CreatorPerformance, index: number) => (
                              <tr key={index} className="border-b border-gray-800">
                                <td className="py-3">
                                  <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center">
                                      <User className="h-4 w-4 text-gray-400" />
                                    </div>
                                    <div>
                                      <p className="font-medium text-sm">{creator.name || 'Creator'}</p>
                                      <p className="text-xs text-gray-500">@{creator.username || 'username'}</p>
                                    </div>
                                  </div>
                                </td>
                                <td className="py-3 text-sm">{creator.followers || 'N/A'}</td>
                                <td className="py-3 text-sm">{creator.posts || '0'}</td>
                                <td className="py-3 text-sm">{formatNumber(creator.views || 0)}</td>
                                <td className="py-3 text-sm">{creator.engagement || '0%'}</td>
                                <td className="py-3">
                                  <span className={`px-2 py-1 rounded-full text-xs ${
                                    creator.performance === 'high' ? 'bg-green-900/20 text-green-400' :
                                    creator.performance === 'medium' ? 'bg-yellow-900/20 text-yellow-400' :
                                    creator.performance === 'low' ? 'bg-red-900/20 text-red-400' :
                                    'bg-yellow-900/20 text-yellow-400'
                                  }`}>
                                    {creator.performance ? (creator.performance.charAt(0).toUpperCase() + creator.performance.slice(1)) : 'New'}
                                  </span>
                                </td>
                              </tr>
                            ))
                          ) : (
                            // If we know creators have joined but don't have detailed performance data
                            Array.isArray(campaign.creators) && campaign.creators.length > 0 ? (
                              campaign.creators.map((creator: any, index: number) => (
                                <tr key={index} className="border-b border-gray-800">
                                  <td className="py-3">
                                    <div className="flex items-center gap-2">
                                      <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center">
                                        <User className="h-4 w-4 text-gray-400" />
                                      </div>
                                      <div>
                                        <p className="font-medium text-sm">
                                          {/* Try to get the name from various possible locations */}
                                          {creator.name || 
                                           creator.username || 
                                           creator.creator?.email?.split('@')[0] ||
                                           'Creator'}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                          {creator.creator?.email || 'No email'}
                                        </p>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="py-3 text-sm">{creator.followers || 'N/A'}</td>
                                  <td className="py-3 text-sm">{creator.metrics?.posts_submitted || '0'}</td>
                                  <td className="py-3 text-sm">{formatNumber(creator.metrics?.views || 0)}</td>
                                  <td className="py-3 text-sm">{creator.engagement || '-'}</td>
                                  <td className="py-3">
                                    <span className={`px-2 py-1 rounded-full text-xs ${
                                      creator.status === 'active' 
                                        ? 'bg-green-900/20 text-green-400'
                                        : 'bg-yellow-900/20 text-yellow-400'
                                    }`}>
                                      {creator.status === 'active' ? 'Active' : 'Pending'}
                                    </span>
                                  </td>
                                </tr>
                              ))
                            ) : (
                              // Generic placeholder for when we know creators have joined but have no data
                              <tr className="border-b border-gray-800">
                                <td className="py-3">
                                  <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center">
                                      <User className="h-4 w-4 text-gray-400" />
                                    </div>
                                    <div>
                                      <p className="font-medium text-sm">Creator</p>
                                      <p className="text-xs text-gray-500">@username</p>
                                    </div>
                                  </div>
                                </td>
                                <td className="py-3 text-sm">N/A</td>
                                <td className="py-3 text-sm">0</td>
                                <td className="py-3 text-sm">0</td>
                                <td className="py-3 text-sm">-</td>
                                <td className="py-3">
                                  <span className="px-2 py-1 rounded-full text-xs bg-yellow-900/20 text-yellow-400">
                                    New
                                  </span>
                                </td>
                              </tr>
                            )
                          )
                        ) : (
                          // No creators have joined
                          <tr className="border-b border-gray-800">
                            <td colSpan={6} className="py-6 text-center text-gray-500">
                              No creators have joined this campaign yet.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
                
                {/* Budget Utilization */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
                  <div className="bg-black/30 rounded-lg p-5 border border-gray-800">
                    <h4 className="font-medium mb-4 flex items-center gap-2">
                      <DollarSign className="h-5 w-5 text-green-400" />
                      Budget Utilization
                    </h4>
                    
                    <div className="mb-4">
                      <div className="flex justify-between items-end mb-2">
                        <div>
                          <p className="text-sm text-gray-400">Total Budget</p>
                          <p className="text-xl font-bold text-white">{formatMoney(campaignBudget)}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-400">Spent</p>
                          <p className="text-xl font-bold text-green-400">{formatMoney(campaignSpent)}</p>
                        </div>
                      </div>
                      <div className="h-3 bg-gray-800 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-green-500 to-blue-500"
                          style={{ width: `${Math.min(((Number(campaignSpent || 0) / Number(campaignBudget || 1)) * 100), 100)}%` }}
                        ></div>
                      </div>
                      <p className="text-right text-xs text-gray-500 mt-1">
                        {Math.round(((Number(campaignSpent || 0) / Number(campaignBudget || 1)) * 100))}% utilized
                      </p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 mt-6">
                      <div>
                        <p className="text-sm text-gray-400 mb-1">Cost per View</p>
                        <p className="text-lg font-bold">${campaign.metrics?.costPerView?.replace('$', '') || '0.00'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-400 mb-1">Cost per Engagement</p>
                        <p className="text-lg font-bold">${campaign.metrics?.costPerEngagement?.replace('$', '') || '0.00'}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-black/30 rounded-lg p-5 border border-gray-800">
                    <h4 className="font-medium mb-4 flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-blue-400" />
                      Campaign Impact
                    </h4>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-400 mb-1">Brand Awareness</p>
                        <p className="text-lg font-bold">+{campaign.metrics?.brandAwarenessIncrease || '0%'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-400 mb-1">Audience Growth</p>
                        <p className="text-lg font-bold">+{campaign.metrics?.audienceGrowth || '0%'}</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 mt-4">
                      <div>
                        <p className="text-sm text-gray-400 mb-1">Sentiment</p>
                        <p className="text-lg font-bold">{campaign.metrics?.sentimentScore || 'Neutral'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-400 mb-1">Reach</p>
                        <p className="text-lg font-bold">{formatNumber(campaign.metrics?.totalReach || 0)}</p>
                      </div>
                    </div>
                    
                    <div className="mt-6 bg-black/20 rounded-lg p-3 border border-dashed border-gray-700">
                      <p className="text-sm text-gray-300">Campaign is performing {campaign.metrics?.performanceVsBenchmark || 'on par with'} similar campaigns in your industry</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Campaign Overview Section */}
            <div className="bg-black/50 rounded-xl p-6 border border-gray-900">
              <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                <FileText className="h-6 w-6 text-blue-400" />
                Campaign Overview
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-5">
                  <div>
                    <h4 className="text-sm text-gray-400 mb-2">Campaign Title</h4>
                    <p className="text-lg font-medium text-white">{campaign.title}</p>
                  </div>
                  
                  {/* <<< START NEW BRAND DISPLAY >>> */}
                  <div>
                    <h4 className="text-sm text-gray-400 mb-2">Brand</h4>
                    <div className="flex items-center gap-2">
                       <Building className="h-5 w-5 text-gray-400" />
                       <p className="text-lg font-medium text-white">
                         {getCampaignField(['brand.name', 'brand.company_name'], 'Brand details unavailable')}
                       </p>
                    </div>
                     {/* Optional: Add website link if available */}
                     {getCampaignField(['brand.website']) && (
                        <a
                          href={getCampaignField(['brand.website'], '#')}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-400 hover:underline ml-7"
                        >
                          Visit Website <ArrowUpRight className="inline h-3 w-3" />
                        </a>
                      )}
                  </div>
                  {/* <<< END NEW BRAND DISPLAY >>> */}

                  <div>
                    <h4 className="text-sm text-gray-400 mb-2">Campaign Goal</h4>
                    <p className="text-lg font-medium text-white">{campaignGoal}</p>
                  </div>
                  
                  <div>
                    <h4 className="text-sm text-gray-400 mb-2">Campaign Duration</h4>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-blue-400" />
                      <p className="text-white">{formatDate(campaignStartDate)} - {formatDate(campaignEndDate)}</p>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm text-gray-400 mb-2">Content Type</h4>
                    <p className="text-lg font-medium text-white capitalize">{campaignContentType}</p>
                  </div>
                </div>
                
                <div className="space-y-5">
                  <div>
                    <h4 className="text-sm text-gray-400 mb-2">Total Budget</h4>
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-5 w-5 text-green-400" />
                      <p className="text-lg font-medium text-green-400">{formatMoney(campaignBudget)}</p>
                    </div>
                    {campaignSpent > 0 && (
                      <p className="text-sm text-gray-400 mt-1 ml-7">
                        {formatMoney(campaignSpent)} spent ({Math.round((campaignSpent / campaignBudget) * 100)}%)
                      </p>
                    )}
                  </div>
                  
                  <div>
                    <h4 className="text-sm text-gray-400 mb-2">Target Platforms</h4>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {(campaign.requirements?.platforms || campaign.platforms || []).map((platform: string, index: number) => (
                        <span key={index} className="px-3 py-1 bg-purple-900/20 text-purple-400 rounded-full text-sm flex items-center gap-1">
                          {platform === 'instagram' && <Instagram className="h-4 w-4" />}
                          {platform === 'tiktok' && (
                            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
                            </svg>
                          )}
                          {platform === 'youtube' && <Youtube className="h-4 w-4" />}
                          {platform === 'twitter' && <Twitter className="h-4 w-4" />}
                          {platform}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Budget & Payout Section */}
            <div className="bg-black/50 rounded-xl p-6 border border-gray-900">
              <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                <DollarSign className="h-6 w-6 text-green-400" />
                Budget & Payout Details
              </h3>
              
              {/* Budget Allocation Overview */}
              <div className="lg:col-span-3 p-6 bg-black/60 rounded-lg border border-gray-900/60 mb-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Total Budget Column */}
                  <div className="flex flex-col justify-center">
                    <h4 className="text-lg font-medium text-white mb-2">Total Campaign Budget</h4>
                    <p className="text-3xl font-bold text-green-400">{formatMoney(campaignBudget)}</p>
                    {campaignSpent > 0 && (
                      <p className="text-sm text-gray-400 mt-1">
                        {formatMoney(campaignSpent)} spent ({Math.round((campaignSpent / campaignBudget) * 100)}%)
                      </p>
                    )}
                  </div>
                  
                  {/* Budget Allocation Column */}
                  <div className="lg:col-span-2">
                    <h4 className="text-base font-medium text-white mb-4 flex items-center gap-2">
                      <PieChart className="h-5 w-5 text-purple-400" />
                      Budget Allocation by Content Type
                    </h4>
                    
                    {budgetAllocation ? (
                      <>
                        <div className="relative h-8 bg-gray-800 rounded-lg overflow-hidden mb-4">
                          <div 
                            className="absolute h-full bg-green-500 flex items-center justify-center text-xs font-medium text-white"
                            style={{ width: `${budgetAllocation.original}%` }}
                          >
                            {budgetAllocation.original}%
                          </div>
                          <div 
                            className="absolute h-full bg-blue-500 flex items-center justify-center text-xs font-medium text-white"
                            style={{ width: `${budgetAllocation.repurposed}%`, left: `${budgetAllocation.original}%` }}
                          >
                            {budgetAllocation.repurposed}%
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-6">
                          <div className="bg-black/30 rounded-lg p-4 border border-green-900/30">
                            <div className="flex items-center gap-2 mb-2">
                              <div className="w-4 h-4 bg-green-500 rounded-sm"></div>
                              <h5 className="text-sm font-medium">Original Content</h5>
                            </div>
                            <p className="text-xl font-bold text-green-400">
                              {formatMoney((campaignBudget * (budgetAllocation?.original || 0)) / 100)}
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                              {budgetAllocation?.original || 0}% of budget
                            </p>
                          </div>
                          
                          <div className="bg-black/30 rounded-lg p-4 border border-blue-900/30">
                            <div className="flex items-center gap-2 mb-2">
                              <div className="w-4 h-4 bg-blue-500 rounded-sm"></div>
                              <h5 className="text-sm font-medium">Repurposed Content</h5>
                            </div>
                            <p className="text-xl font-bold text-blue-400">
                              {formatMoney((campaignBudget * (budgetAllocation?.repurposed || 0)) / 100)}
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                              {budgetAllocation?.repurposed || 0}% of budget
                            </p>
                          </div>
                        </div>
                      </>
                    ) : (
                      <p className="text-gray-500">No budget allocation specified</p>
                    )}
                  </div>
                </div>
              </div>
              
              {/* View Estimates Box - Prominent Display */}
              {viewEstimates && viewEstimates.total > 0 && (
                <div className="p-6 bg-black rounded-lg border border-gray-900 mb-6">
                  <h4 className="text-lg font-medium text-white mb-5 flex items-center gap-2">
                    <Eye className="h-5 w-5 text-purple-400" />
                    Estimated Campaign Performance
                  </h4>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-5">
                    <div className="lg:col-span-3 text-center">
                      <p className="text-sm text-gray-400 mb-1">Total Estimated Views</p>
                      <p className="text-4xl font-bold text-white mb-1">
                        {formatNumber(viewEstimates.total)}
                      </p>
                      <p className="text-xs text-gray-400">
                        Estimated cost per view: ${((campaignBudget / viewEstimates.total) || 0).toFixed(4)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="relative h-8 bg-gray-800 rounded-lg overflow-hidden mb-5">
                    {viewEstimates.original > 0 && (
                      <div 
                        className="absolute h-full bg-green-500 flex items-center justify-center text-xs font-medium text-white"
                        style={{ width: `${(viewEstimates.original / viewEstimates.total) * 100}%` }}
                      >
                        {Math.round((viewEstimates.original / viewEstimates.total) * 100)}%
                      </div>
                    )}
                    {viewEstimates.repurposed > 0 && (
                      <div 
                        className="absolute h-full bg-blue-500 flex items-center justify-center text-xs font-medium text-white"
                        style={{ 
                          width: `${(viewEstimates.repurposed / viewEstimates.total) * 100}%`, 
                          left: `${(viewEstimates.original / viewEstimates.total) * 100}%` 
                        }}
                      >
                        {Math.round((viewEstimates.repurposed / viewEstimates.total) * 100)}%
                      </div>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {viewEstimates.original > 0 && (
                      <div className="bg-black/30 rounded-lg p-4 border border-green-900/30">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-4 h-4 bg-green-500 rounded-sm"></div>
                          <h5 className="text-sm font-medium">Original Content Views</h5>
                        </div>
                        <p className="text-2xl font-bold text-green-400">
                          {formatNumber(viewEstimates.original)}
                        </p>
                        <div className="flex justify-between items-center mt-1">
                          <p className="text-xs text-gray-400">
                            {Math.round((viewEstimates.original / viewEstimates.total) * 100)}% of total views
                          </p>
                          <p className="text-xs text-gray-400">
                            {formatMoney((campaignBudget * (budgetAllocation?.original || 0)) / 100)} allocated
                          </p>
                        </div>
                      </div>
                    )}
                    
                    {viewEstimates.repurposed > 0 && (
                      <div className="bg-black/30 rounded-lg p-4 border border-blue-900/30">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-4 h-4 bg-blue-500 rounded-sm"></div>
                          <h5 className="text-sm font-medium">Repurposed Content Views</h5>
                        </div>
                        <p className="text-2xl font-bold text-blue-400">
                          {formatNumber(viewEstimates.repurposed)}
                        </p>
                        <div className="flex justify-between items-center mt-1">
                          <p className="text-xs text-gray-400">
                            {Math.round((viewEstimates.repurposed / viewEstimates.total) * 100)}% of total views
                          </p>
                          <p className="text-xs text-gray-400">
                            {formatMoney((campaignBudget * (budgetAllocation?.repurposed || 0)) / 100)} allocated
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Payout Rates */}
                <div className="p-5 bg-black/60 rounded-lg border border-gray-900/60">
                  <h4 className="text-base font-medium text-white mb-4 flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-green-400" />
                    Creator Payout Rates
                  </h4>
                  
                  <div className="space-y-4">
                    {campaign.requirements?.payoutRate?.original && (campaignContentType.toLowerCase() === 'original' || campaignContentType.toLowerCase() === 'both') && (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-green-900/30 flex items-center justify-center">
                            <Video className="h-4 w-4 text-green-400" />
                          </div>
                          <div>
                            <p className="font-medium text-white">Original Content</p>
                            <p className="text-xs text-gray-400">Per approved post</p>
                          </div>
                        </div>
                        <p className="text-lg font-bold text-green-400">{campaign.requirements.payoutRate.original}</p>
                      </div>
                    )}
                    
                    {campaign.requirements?.payoutRate?.repurposed && (campaignContentType.toLowerCase() === 'repurposed' || campaignContentType.toLowerCase() === 'both') && (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-blue-900/30 flex items-center justify-center">
                            <Share2 className="h-4 w-4 text-blue-400" />
                          </div>
                          <div>
                            <p className="font-medium text-white">Repurposed Content</p>
                            <p className="text-xs text-gray-400">Per approved post</p>
                          </div>
                        </div>
                        <p className="text-lg font-bold text-blue-400">{campaign.requirements.payoutRate.repurposed}</p>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* View Distribution by Content Type - Replacing the Est. Creator Earnings/Content Value section */}
                <div className="p-5 bg-black/60 rounded-lg border border-gray-900/60">
                  <h4 className="text-base font-medium text-white mb-4 flex items-center gap-2">
                    <Eye className="h-5 w-5 text-purple-400" />
                    View Distribution & Budget Allocation
                  </h4>
                  
                  {viewEstimates && viewEstimates.total > 0 ? (
                    <div className="space-y-4">
                      <div className="bg-black/30 rounded-lg p-3 border border-gray-700/50">
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-2">
                          <p className="text-sm text-gray-400">Total Estimated Views</p>
                          <p className="text-xl font-bold text-white">{formatNumber(viewEstimates.total)}</p>
                        </div>
                      </div>

                      {/* Content Type Distribution */}
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-green-500 rounded-sm"></div>
                            <p className="text-sm text-white">Original Content</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-white">
                              {formatNumber(viewEstimates.original)} views
                            </p>
                            <p className="text-xs px-1.5 py-0.5 bg-green-900/30 text-green-400 rounded">
                              {Math.round((viewEstimates.original / viewEstimates.total) * 100)}%
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex justify-between items-center mb-4">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-blue-500 rounded-sm"></div>
                            <p className="text-sm text-white">Repurposed Content</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-white">
                              {formatNumber(viewEstimates.repurposed)} views
                            </p>
                            <p className="text-xs px-1.5 py-0.5 bg-blue-900/30 text-blue-400 rounded">
                              {Math.round((viewEstimates.repurposed / viewEstimates.total) * 100)}%
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Budget Distribution */}
                      {budgetAllocation && (
                        <div className="pt-3 border-t border-gray-700/50">
                          <div className="flex justify-between items-center mb-1">
                            <p className="text-sm text-gray-400">Budget Distribution</p>
                          </div>
                          <div className="flex justify-between items-center mb-1">
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 bg-green-500 rounded-sm"></div>
                              <p className="text-sm text-white">Original Budget</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-medium text-white">
                                {formatMoney((campaignBudget * (budgetAllocation?.original || 0)) / 100)}
                              </p>
                              <p className="text-xs px-1.5 py-0.5 bg-green-900/30 text-green-400 rounded">
                                {budgetAllocation?.original || 0}%
                              </p>
                            </div>
                          </div>
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 bg-blue-500 rounded-sm"></div>
                              <p className="text-sm text-white">Repurposed Budget</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-medium text-white">
                                {formatMoney((campaignBudget * (budgetAllocation?.repurposed || 0)) / 100)}
                              </p>
                              <p className="text-xs px-1.5 py-0.5 bg-blue-900/30 text-blue-400 rounded">
                                {budgetAllocation?.repurposed || 0}%
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-gray-500">No view estimate data available</p>
                  )}
                </div>
              </div>
            </div>
            
            {/* Content Brief & Guidelines */}
            <div className="bg-black/50 rounded-xl p-6 border border-gray-900">
              <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                <FileText className="h-6 w-6 text-orange-400" />
                Content Guidelines
              </h3>
              
              {/* Required Hashtags */}
              <div className="p-5 bg-black/60 rounded-lg border border-gray-900/60 mb-5">
                <div className="flex items-center gap-2 mb-3">
                  <Hash className="h-4 w-4 text-blue-400" />
                  <h4 className="text-base font-medium text-white">Required Hashtags</h4>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h5 className="text-sm text-gray-400 mb-2">Original Content</h5>
                    {campaign.requirements?.hashtags?.original ? (
                      <div className="flex flex-wrap gap-2">
                        {campaign.requirements.hashtags.original.split(' ').map((tag, index) => (
                          <span key={index} className="px-3 py-1 bg-blue-900/20 text-blue-400 rounded-full text-sm">
                            {tag}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">No hashtags specified</p>
                    )}
                  </div>
                  
                  {(campaignContentType.toLowerCase() === 'repurposed' || campaignContentType.toLowerCase() === 'both') && (
                    <div>
                      <h5 className="text-sm text-gray-400 mb-2">Repurposed Content</h5>
                      {campaign.requirements?.hashtags?.repurposed ? (
                        <div className="flex flex-wrap gap-2">
                          {campaign.requirements.hashtags.repurposed.split(' ').map((tag, index) => (
                            <span key={index} className="px-3 py-1 bg-blue-900/20 text-blue-400 rounded-full text-sm">
                              {tag}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500">No hashtags specified</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
              
              {/* Content Guidelines */}
              <div className="p-5 bg-black/60 rounded-lg border border-gray-900/60 mb-5">
                <h4 className="text-base font-medium text-white mb-3">Guidelines for Creators</h4>
                
                {(campaignContentType.toLowerCase() === 'original' || campaignContentType.toLowerCase() === 'both') && (
                  <div className="mb-4">
                    <h5 className="text-sm text-gray-400 mb-2 flex items-center gap-2">
                      <Video className="h-4 w-4 text-green-400" />
                      Original Content Guidelines
                    </h5>
                    {campaign.requirements?.contentGuidelines && campaign.requirements.contentGuidelines.length > 0 ? (
                      <ul className="list-disc pl-5 space-y-2">
                        {campaign.requirements.contentGuidelines
                          .filter((_, index) => {
                            // If content type is both, assume first half of guidelines are for original
                            if (campaignContentType.toLowerCase() === 'both') {
                              return index < Math.ceil((campaign.requirements?.contentGuidelines?.length || 0) / 2);
                            }
                            return true; // If content type is original, show all guidelines
                          })
                          .map((guideline: string, index: number) => (
                            <li key={index} className="text-white">{guideline}</li>
                          ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-gray-500">No content guidelines specified</p>
                    )}
                  </div>
                )}
                
                {(campaignContentType.toLowerCase() === 'repurposed' || campaignContentType.toLowerCase() === 'both') && (
                  <div>
                    <h5 className="text-sm text-gray-400 mb-2 flex items-center gap-2">
                      <Share2 className="h-4 w-4 text-blue-400" />
                      Repurposed Content Guidelines
                    </h5>
                    {campaign.requirements?.contentGuidelines && campaign.requirements.contentGuidelines.length > 0 ? (
                      <ul className="list-disc pl-5 space-y-2">
                        {campaign.requirements.contentGuidelines
                          .filter((_, index) => {
                            // If content type is both, assume second half of guidelines are for repurposed
                            if (campaignContentType.toLowerCase() === 'both') {
                              return index >= Math.ceil((campaign.requirements?.contentGuidelines?.length || 0) / 2);
                            }
                            return true; // If content type is repurposed, show all guidelines
                          })
                          .map((guideline: string, index: number) => (
                            <li key={index} className="text-white">{guideline}</li>
                          ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-gray-500">No content guidelines specified</p>
                    )}
                  </div>
                )}
              </div>
              
              {/* Campaign Brief */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {campaign.brief?.original || campaignContentType.toLowerCase() === 'original' || campaignContentType.toLowerCase() === 'both' ? (
                  <div className="p-5 bg-black/60 rounded-lg border border-gray-900/60">
                    <h4 className="text-base font-medium text-white mb-3">Original Content Brief</h4>
                    <div className="prose prose-sm prose-invert max-w-none">
                      {campaign.brief?.original ? (
                        <p className="text-gray-300 whitespace-pre-line">{campaign.brief.original}</p>
                      ) : (
                        <p className="text-gray-500">No brief provided</p>
                      )}
                    </div>
                  </div>
                ) : null}
                
                {campaign.brief?.repurposed || campaignContentType.toLowerCase() === 'repurposed' || campaignContentType.toLowerCase() === 'both' ? (
                  <div className="p-5 bg-black/60 rounded-lg border border-gray-900/60">
                    <h4 className="text-base font-medium text-white mb-3">Repurposed Content Brief</h4>
                    <div className="prose prose-sm prose-invert max-w-none">
                      {campaign.brief?.repurposed ? (
                        <p className="text-gray-300 whitespace-pre-line">{campaign.brief.repurposed}</p>
                      ) : (
                        <p className="text-gray-500">No brief provided</p>
                      )}
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
            
            {/* Footer Actions */}
            <div className="flex justify-end gap-3 mt-8">
              <button
                onClick={onClose}
                className="px-5 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-white text-sm transition-colors"
              >
                Close
              </button>
              {onEdit && (
                <button
                  onClick={() => onEdit(campaign)}
                  className="px-5 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-white text-sm transition-colors flex items-center gap-2"
                >
                  <Edit className="h-4 w-4" />
                  Edit Campaign
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Creator view (default)
  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-80 backdrop-blur-sm flex items-center justify-center p-4 md:p-6 z-50"
      onClick={(e) => {
        // Only close if clicking the backdrop
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="campaign-title"
      aria-describedby="campaign-description"
    >
      <div
        className="bg-black/40 border border-gray-800 rounded-lg p-6 md:p-8 w-full max-w-4xl max-h-[90vh] overflow-y-auto custom-scrollbar"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Creator view code START */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 id="campaign-title" className="text-2xl font-bold text-white mb-1">{campaign.title}</h2>
            <div className="flex items-center gap-2 text-gray-400 text-sm">
              <Building className="h-4 w-4" />
              <span>{getCampaignField(['brand.name'], 'Unknown Brand')}</span>
            </div>
          </div>
          <button onClick={onClose} className="p-2 -m-2 hover:bg-white/10 rounded-lg transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-900/20 border border-red-800/30 rounded-lg text-red-400 text-sm flex items-center gap-2">
            <AlertCircle className="h-4 w-4" /> {error}
          </div>
        )}

        <AnimatePresence mode="wait">
          {showAccountSelection ? (
             // Account Selection Step
            <motion.div
              key="account-selection"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              <h3 className="text-lg font-semibold text-white border-b border-gray-800 pb-2">Select Accounts to Join</h3>
              <p className="text-sm text-gray-400">
                Choose which of your connected accounts you want to use for this campaign. You can select different accounts for original and repurposed content if applicable.
              </p>

              {campaign.requirements.platforms.map(platform => (
                <div key={platform} className="p-4 bg-black/30 border border-gray-800 rounded-lg">
                  <h4 className="text-base font-medium capitalize flex items-center gap-2 mb-3">
                    {platform === 'instagram' && <Instagram className="h-5 w-5 text-pink-400" />}
                    {platform === 'tiktok' && <svg className="h-5 w-5 text-cyan-400" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" /></svg>}
                    {platform === 'youtube' && <Youtube className="h-5 w-5 text-red-400" />}
                    {platform === 'twitter' && <Twitter className="h-5 w-5 text-blue-400" />}
                    {platform}
                  </h4>
                  {(connectedAccounts[platform.toLowerCase()] || []).map((account: ConnectedAccount) => (
                    <div key={account.id} className="mb-4 p-3 bg-black/20 rounded-md border border-gray-700">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id={`${platform}-${account.id}`}
                            checked={selectedAccounts[platform.toLowerCase()]?.accountIds.includes(account.id)}
                            onChange={(e) => handleAccountSelect(platform.toLowerCase(), account.id, e.target.checked)}
                            className="form-checkbox h-4 w-4 bg-gray-700 border-gray-600 text-blue-500 focus:ring-blue-600"
                          />
                          <label htmlFor={`${platform}-${account.id}`} className="text-sm font-medium text-white">{account.username}</label>
                          {account.isVerified && <Check className="h-4 w-4 text-blue-400" />}
                        </div>
                        <span className="text-xs text-gray-500">{account.followers} followers</span>
                      </div>
                      {selectedAccounts[platform.toLowerCase()]?.accountIds.includes(account.id) && campaignContentType === 'both' && (
                        <div className="mt-2 pl-6 space-y-1">
                           <p className="text-xs text-gray-400 mb-1">Select content type for this account:</p>
                           <div className="flex gap-3">
                              <label className="flex items-center gap-1 text-xs">
                                <input
                                  type="radio"
                                  name={`${platform}-${account.id}-type`}
                                  value="original"
                                  checked={selectedAccounts[platform.toLowerCase()]?.accountTypes[account.id] === 'original'}
                                  onChange={() => handleContentTypeSelect(platform.toLowerCase(), account.id, 'original')}
                                  className="form-radio h-3 w-3 bg-gray-700 border-gray-600 text-green-500 focus:ring-green-600"
                                /> Original
                              </label>
                               <label className="flex items-center gap-1 text-xs">
                                <input
                                  type="radio"
                                  name={`${platform}-${account.id}-type`}
                                  value="repurposed"
                                  checked={selectedAccounts[platform.toLowerCase()]?.accountTypes[account.id] === 'repurposed'}
                                  onChange={() => handleContentTypeSelect(platform.toLowerCase(), account.id, 'repurposed')}
                                   className="form-radio h-3 w-3 bg-gray-700 border-gray-600 text-blue-500 focus:ring-blue-600"
                                /> Repurposed
                              </label>
                           </div>
                        </div>
                      )}
                    </div>
                  ))}
                   {(connectedAccounts[platform.toLowerCase()] === undefined || connectedAccounts[platform.toLowerCase()].length === 0) && (
                      <p className="text-xs text-gray-500 italic">No connected {platform} accounts found.</p>
                    )}
                </div>
              ))}

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-800">
                 <button onClick={onClose} className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-white text-sm transition-colors">Cancel</button>
                 <button
                    onClick={handleSubmitJoin}
                    disabled={Object.values(selectedAccounts).every(p => p.accountIds.length === 0)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                 >
                   Next <ChevronRight className="h-4 w-4" />
                 </button>
              </div>
            </motion.div>

          ) : showConfirmation ? (
            // Confirmation Step
            <motion.div
              key="confirmation"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              <h3 className="text-lg font-semibold text-white border-b border-gray-800 pb-2">Confirm Joining Campaign</h3>
              <p className="text-sm text-gray-400">
                Please review the details and confirm you agree to the campaign terms and requirements.
              </p>

              <div className="p-4 bg-black/30 border border-gray-800 rounded-lg space-y-3">
                <h4 className="text-base font-medium">Selected Accounts & Content Types:</h4>
                {Object.entries(selectedAccounts).map(([platform, selection]) => selection.accountIds.length > 0 && (
                    <div key={platform}>
                      <h5 className="text-sm font-medium capitalize flex items-center gap-1 mb-1">
                        {platform === 'instagram' && <Instagram className="h-4 w-4 text-pink-400" />}
                        {platform === 'tiktok' && <svg className="h-4 w-4 text-cyan-400" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" /></svg>}
                        {platform === 'youtube' && <Youtube className="h-4 w-4 text-red-400" />}
                        {platform === 'twitter' && <Twitter className="h-4 w-4 text-blue-400" />}
                        {platform}
                      </h5>
                      <ul className="list-disc pl-5 text-xs text-gray-300 space-y-1">
                        {selection.accountIds.map(accountId => {
                          // Ensure platform key exists before accessing
                          const platformAccounts = connectedAccounts[platform];
                          const account = platformAccounts?.find((acc: ConnectedAccount) => acc.id === accountId); // <-- Add type to acc
                          const contentType = campaignContentType === 'both' ? selection.accountTypes[accountId] : campaignContentType;
                          return (
                            <li key={accountId}>
                              @{account?.username || accountId}
                              {contentType && <span className={`ml-2 capitalize px-1.5 py-0.5 rounded text-xs ${contentType === 'original' ? 'bg-green-900/30 text-green-400' : 'bg-blue-900/30 text-blue-400'}`}>{contentType}</span>}
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  ))}
              </div>

              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id="terms-accept"
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                  className="form-checkbox h-4 w-4 bg-gray-700 border-gray-600 text-blue-500 focus:ring-blue-600 mt-1 flex-shrink-0"
                />
                <label htmlFor="terms-accept" className="text-sm text-gray-300">
                  I have read and agree to the <button className="text-blue-400 hover:underline">campaign terms, requirements, and guidelines</button>.
                </label>
              </div>

               <div className="flex justify-end gap-3 pt-4 border-t border-gray-800">
                 <button onClick={() => setShowAccountSelection(true)} className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-white text-sm transition-colors">Back</button>
                 <button
                    onClick={handleConfirmJoin}
                    disabled={!termsAccepted || isLoading}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-white text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                 >
                   {isLoading ? 'Joining...' : 'Confirm & Join Campaign'} <Check className="h-4 w-4" />
                 </button>
              </div>
            </motion.div>

          ) : (
            // Default View (Campaign Details)
            <motion.div
              key="details"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Left Column */}
                <div className="md:col-span-2 space-y-6">
                   {/* Overview Card */}
                   <div className="p-5 bg-black/30 border border-gray-800 rounded-lg">
                      <h3 className="text-base font-semibold mb-4 flex items-center gap-2"><FileText className="h-5 w-5 text-blue-400"/>Campaign Details</h3>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                         <div>
                            <p className="text-gray-400 text-xs mb-1">Campaign Goal</p>
                            <p>{campaignGoal}</p>
                         </div>
                          <div>
                            <p className="text-gray-400 text-xs mb-1">Content Type</p>
                            <p className="capitalize">{campaignContentType}</p>
                         </div>
                          <div>
                            <p className="text-gray-400 text-xs mb-1">Duration</p>
                             <p>{formatDate(campaignStartDate)} - {formatDate(campaignEndDate)}</p>
                         </div>
                         <div>
                            <p className="text-gray-400 text-xs mb-1">Target Platforms</p>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {(campaign.requirements?.platforms || []).map((platform: string, index: number) => (
                                <span key={index} className="px-2 py-0.5 bg-purple-900/30 text-purple-400 rounded-full text-xs flex items-center gap-1">
                                  {platform === 'instagram' && <Instagram className="h-3 w-3" />}
                                  {platform === 'tiktok' && <svg className="h-3 w-3" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" /></svg>}
                                  {platform === 'youtube' && <Youtube className="h-3 w-3" />}
                                  {platform === 'twitter' && <Twitter className="h-3 w-3" />}
                                  {platform}
                                </span>
                              ))}
                            </div>
                         </div>
                      </div>
                   </div>

                  {/* Brief & Guidelines Card */}
                  <div className="p-5 bg-black/30 border border-gray-800 rounded-lg">
                     <h3 className="text-base font-semibold mb-4 flex items-center gap-2"><FileText className="h-5 w-5 text-orange-400"/>Brief & Guidelines</h3>
                      {/* Campaign Brief */}
                      {(campaignBriefOriginal || campaignBriefRepurposed) && (
                        <div className="mb-4">
                           <h4 className="text-sm font-medium text-gray-300 mb-2">Campaign Brief</h4>
                           {campaignBriefOriginal && (campaignContentType === 'original' || campaignContentType === 'both') && (
                             <div className="prose prose-sm prose-invert max-w-none bg-black/20 p-3 rounded border border-gray-700 mb-2">
                               <p className="text-xs font-semibold text-green-400 mb-1">Original Content Brief:</p>
                               <p className="text-gray-300 whitespace-pre-line">{campaignBriefOriginal}</p>
                             </div>
                           )}
                           {campaignBriefRepurposed && (campaignContentType === 'repurposed' || campaignContentType === 'both') && (
                              <div className="prose prose-sm prose-invert max-w-none bg-black/20 p-3 rounded border border-gray-700">
                               <p className="text-xs font-semibold text-blue-400 mb-1">Repurposed Content Brief:</p>
                               <p className="text-gray-300 whitespace-pre-line">{campaignBriefRepurposed}</p>
                             </div>
                           )}
                        </div>
                      )}
                       {/* Content Guidelines */}
                      {(campaign.requirements?.contentGuidelines && campaign.requirements.contentGuidelines.length > 0) && (
                        <div className="mb-4">
                          <h4 className="text-sm font-medium text-gray-300 mb-2">Content Guidelines</h4>
                           {(campaignContentType === 'original' || campaignContentType === 'both') && (
                              <div className="mb-2">
                                <h5 className="text-xs text-gray-400 mb-1 flex items-center gap-1"><Video className="h-3 w-3 text-green-400" />Original:</h5>
                                <ul className="list-disc pl-5 space-y-1 text-xs text-gray-300">
                                  {campaign.requirements.contentGuidelines
                                    .filter((_, index) => campaignContentType === 'both' ? index < Math.ceil((campaign.requirements?.contentGuidelines?.length || 0) / 2) : true)
                                    .map((guideline: string, index: number) => <li key={`og-${index}`}>{guideline}</li>)}
                                </ul>
                              </div>
                           )}
                           {(campaignContentType === 'repurposed' || campaignContentType === 'both') && (
                               <div>
                                <h5 className="text-xs text-gray-400 mb-1 flex items-center gap-1"><Share2 className="h-3 w-3 text-blue-400" />Repurposed:</h5>
                                <ul className="list-disc pl-5 space-y-1 text-xs text-gray-300">
                                   {campaign.requirements.contentGuidelines
                                    .filter((_, index) => campaignContentType === 'both' ? index >= Math.ceil((campaign.requirements?.contentGuidelines?.length || 0) / 2) : true)
                                    .map((guideline: string, index: number) => <li key={`rp-${index}`}>{guideline}</li>)}
                                </ul>
                              </div>
                           )}
                        </div>
                      )}
                       {/* Required Hashtags */}
                      {(campaign.requirements?.hashtags?.original || campaign.requirements?.hashtags?.repurposed) && (
                         <div>
                          <h4 className="text-sm font-medium text-gray-300 mb-2">Required Hashtags</h4>
                           {campaign.requirements?.hashtags?.original && (campaignContentType === 'original' || campaignContentType === 'both') && (
                             <div className="mb-2">
                               <h5 className="text-xs text-gray-400 mb-1">Original:</h5>
                               <div className="flex flex-wrap gap-1">
                                 {campaign.requirements.hashtags.original.split(' ').map((tag, index) => (
                                   <span key={`ht-og-${index}`} className="px-2 py-0.5 bg-blue-900/30 text-blue-400 rounded-full text-xs">{tag}</span>
                                 ))}
                               </div>
                             </div>
                           )}
                            {campaign.requirements?.hashtags?.repurposed && (campaignContentType === 'repurposed' || campaignContentType === 'both') && (
                              <div>
                               <h5 className="text-xs text-gray-400 mb-1">Repurposed:</h5>
                               <div className="flex flex-wrap gap-1">
                                 {campaign.requirements.hashtags.repurposed.split(' ').map((tag, index) => (
                                   <span key={`ht-rp-${index}`} className="px-2 py-0.5 bg-blue-900/30 text-blue-400 rounded-full text-xs">{tag}</span>
                                 ))}
                               </div>
                             </div>
                           )}
                        </div>
                      )}
                  </div>
                </div>

                {/* Right Column */}
                <div className="md:col-span-1 space-y-6">
                   {/* Payout Card */}
                  <div className="p-5 bg-black/30 border border-gray-800 rounded-lg">
                      <h3 className="text-base font-semibold mb-4 flex items-center gap-2"><DollarSign className="h-5 w-5 text-green-400"/>Payout Details</h3>
                       <div className="space-y-3">
                         {payoutRateOriginal && (campaignContentType === 'original' || campaignContentType === 'both') && (
                           <div className="flex items-center justify-between">
                             <span className="text-sm flex items-center gap-1"><Video className="h-4 w-4 text-green-400"/>Original Content</span>
                             <span className="font-semibold text-green-400">{payoutRateOriginal}</span>
                           </div>
                         )}
                         {payoutRateRepurposed && (campaignContentType === 'repurposed' || campaignContentType === 'both') && (
                           <div className="flex items-center justify-between">
                             <span className="text-sm flex items-center gap-1"><Share2 className="h-4 w-4 text-blue-400"/>Repurposed Content</span>
                             <span className="font-semibold text-blue-400">{payoutRateRepurposed}</span>
                           </div>
                         )}
                         <div className="flex items-center justify-between pt-2 border-t border-gray-700">
                            <span className="text-sm">Min. Views for Payout</span>
                            <span className="font-semibold">{campaign.requirements?.minViewsForPayout || 'N/A'}</span>
                         </div>
                         {(budgetAllocation?.original || budgetAllocation?.repurposed) && (
                          <div className="pt-3 mt-3 border-t border-gray-700">
                             <h4 className="text-xs text-gray-400 mb-1">Budget Allocation</h4>
                             <div className="flex justify-between text-xs">
                                {budgetAllocation.original && <span>Original: {budgetAllocation.original}%</span>}
                                {budgetAllocation.repurposed && <span>Repurposed: {budgetAllocation.repurposed}%</span>}
                             </div>
                          </div>
                         )}
                       </div>
                   </div>

                  {/* Target Audience Card */}
                   {campaign.targetAudience && (campaign.targetAudience.locations?.length > 0 || campaign.targetAudience.interests?.length > 0) && (
                     <div className="p-5 bg-black/30 border border-gray-800 rounded-lg">
                       <h3 className="text-base font-semibold mb-4 flex items-center gap-2"><Target className="h-5 w-5 text-red-400"/>Target Audience</h3>
                       <div className="space-y-2 text-sm">
                          {campaign.targetAudience.age && campaign.targetAudience.age.length === 2 && (
                              <div>
                                <p className="text-gray-400 text-xs mb-1">Age Range</p>
                                <p>{campaign.targetAudience.age[0]} - {campaign.targetAudience.age[1]}</p>
                              </div>
                          )}
                          {campaign.targetAudience.locations && campaign.targetAudience.locations.length > 0 && (
                             <div>
                                <p className="text-gray-400 text-xs mb-1">Locations</p>
                                <p>{campaign.targetAudience.locations.join(', ')}</p>
                              </div>
                          )}
                          {campaign.targetAudience.interests && campaign.targetAudience.interests.length > 0 && (
                             <div>
                                <p className="text-gray-400 text-xs mb-1">Interests</p>
                                <p>{campaign.targetAudience.interests.join(', ')}</p>
                              </div>
                          )}
                       </div>
                     </div>
                   )}

                  {/* Join Button Card */}
                  {onJoin && campaign.status.toLowerCase() === 'active' && (
                    <div className="p-5 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg text-center">
                      <h3 className="text-lg font-semibold mb-2">Ready to Join?</h3>
                      <p className="text-sm text-blue-100 mb-4">Start creating content and earning for this campaign.</p>
                      <button
                        onClick={handleStartJoin} // Changed from onJoin directly
                        disabled={isLoading}
                        className="w-full px-4 py-2 bg-white text-blue-600 font-semibold rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-1"
                      >
                        {isLoading ? 'Processing...' : 'Join Campaign'} <ArrowUpRight className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                   {/* Already Joined / Not Active */}
                   {( !onJoin || campaign.status.toLowerCase() !== 'active') && ( // <-- Adjust condition slightly
                     <div className="p-4 bg-black/30 border border-gray-800 rounded-lg text-center">
                       <p className="text-sm text-gray-400">
                         { campaign.status.toLowerCase() === 'active' 
                           ? 'Join functionality not available.' // Should not happen if onJoin exists for active
                           : 'This campaign is not currently active for joining.'}
                       </p>
                       <p className="text-xs text-gray-500 mt-1">Status: <StatusLabel status={campaign.status} /></p>
                     </div>
                   )}

                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        {/* Creator view code END */}
      </div>
    </div>
  );
};

export default CampaignDetailModal;