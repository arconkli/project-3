import React, { useState, useEffect } from 'react';
import { 
  Check, X, DollarSign, Users, TrendingUp, Calendar, Globe, 
  FileText, AlertCircle, Info, Eye, CheckCircle, XCircle, 
  TrendingDown, BarChart, Target, Award, MessageCircle,
  Building2, Briefcase, PieChart, Split, BarChart3, User, AlertTriangle
} from 'lucide-react';
import { formatMoney, formatNumber } from '@/utils/format';
import type { Campaign } from '@/types/brand';
import { supabase } from '@/lib/supabaseClient';

interface AdminCampaignDetailsProps {
  campaign: Campaign;
  onClose: () => void;
  onApprove?: (campaign: Campaign, notes?: string) => void;
  onReject?: (campaign: Campaign, reason: string) => void;
  onPause?: (campaign: Campaign, reason: string) => void;
  onResume?: (campaign: Campaign) => void;
  onComplete?: (campaign: Campaign, reason?: string) => void;
}

type BudgetAllocation = {
  original: number;
  repurposed: number;
};

type ViewTargets = {
  total: number;
  original: number;
  repurposed: number;
};

const AdminCampaignDetails: React.FC<AdminCampaignDetailsProps> = ({
  campaign,
  onClose,
  onApprove,
  onReject,
  onPause,
  onResume,
  onComplete
}) => {
  if (!campaign) return null;

  console.log('[AdminCampaignDetails] Received campaign prop (check for brand):', campaign);

  const [rejectReason, setRejectReason] = useState('');
  const [recommendations, setRecommendations] = useState('');
  const [approvalNotes, setApprovalNotes] = useState('');
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'performance' | 'creators' | 'content' | 'business'>('overview');
  const [isLoading, setIsLoading] = useState(false);
  const [creators, setCreators] = useState<any[]>([]);
  const [isLoadingCreators, setIsLoadingCreators] = useState(false);
  const [creatorError, setCreatorError] = useState<string | null>(null);

  const viewTargets: ViewTargets = {
    total: campaign.total_view_target ?? 0,
    original: campaign.original_view_target ?? 0,
    repurposed: campaign.repurposed_view_target ?? 0
  };
  
  const budgetAllocation: BudgetAllocation = {
    original: campaign.requirements?.budget_allocation?.original ?? (campaign.contentType === 'original' ? 100 : campaign.contentType === 'repurposed' ? 0 : 50),
    repurposed: campaign.requirements?.budget_allocation?.repurposed ?? (campaign.contentType === 'repurposed' ? 100 : campaign.contentType === 'original' ? 0 : 50)
  };
  
  const isPending = campaign.status === 'pending_approval' || 
                   campaign.status === 'pending-approval' || 
                   campaign.status === 'draft';

  useEffect(() => {
    console.log('=== ADMIN CAMPAIGN DETAILS MOUNT ===');
    console.log('Initial campaign data:', {
      id: campaign.id,
      title: campaign.title,
      metrics: campaign.metrics,
      hasMetrics: !!campaign.metrics,
      metricsKeys: campaign.metrics ? Object.keys(campaign.metrics) : [],
      creatorsJoined: campaign.metrics?.creators_joined,
      rawCreators: campaign.creators,
      hasCreatorsArray: Array.isArray(campaign.creators),
      creatorsLength: campaign.creators?.length
    });

    // Add date field debugging
    console.log('Campaign date fields:', {
      startDate: campaign.startDate,
      endDate: campaign.endDate,
      start_date: campaign.start_date,
      end_date: campaign.end_date,
      campaignKeys: Object.keys(campaign)
    });

    // Ensure metrics object exists
    if (!campaign.metrics) {
      console.log('No metrics found, initializing metrics object');
      campaign.metrics = {
        views: 0,
        engagement: 0,
        creators_joined: 0,
        posts_submitted: 0,
        posts_approved: 0
      };
    }

    // Update creators_joined in metrics based on actual creators array if available
    if (Array.isArray(campaign.creators)) {
      const activeCreators = campaign.creators.filter(c => c.status === 'active');
      if (campaign.metrics.creators_joined !== activeCreators.length) {
        console.log(`Fixing creators_joined metric: ${campaign.metrics.creators_joined} → ${activeCreators.length}`);
        campaign.metrics.creators_joined = activeCreators.length;
      }
    }

    // Fetch active creators count regardless of tab
    const fetchActiveCreatorsCount = async () => {
      try {
        console.log('Fetching active creators count for overview...');
        const { data: activeCreators, error } = await supabase
          .from('campaign_creators')
          .select('id')
          .eq('campaign_id', campaign.id)
          .eq('status', 'active');

        if (error) {
          console.error('Error fetching active creators count:', error);
          return;
        }

        // Update metrics with accurate active creators count
        if (!campaign.metrics) campaign.metrics = {};
        const activeCount = activeCreators?.length || 0;
        console.log(`Setting initial active creators count: ${activeCount}`);
        campaign.metrics.creators_joined = activeCount;
      } catch (error) {
        console.error('Error fetching active creators count:', error);
      }
    };

    fetchActiveCreatorsCount();
  }, [campaign]);

  useEffect(() => {
    console.log('Campaign Data:', campaign);
    console.log('Requirements:', campaign.requirements);
    console.log('Budget Allocation:', budgetAllocation);
    console.log('View Targets:', viewTargets);
  }, [campaign, budgetAllocation, viewTargets]);

  // Debug logging for creators tab
  useEffect(() => {
    if (activeTab === 'creators') {
      console.log('Creators tab activated with campaign:', {
        id: campaign.id,
        hasCreatorsField: campaign.hasOwnProperty('creators'),
        creatorsIsArray: Array.isArray(campaign.creators),
        creatorsLength: campaign.creators?.length || 0,
        creatorsData: Array.isArray(campaign.creators) ? campaign.creators.slice(0, 2) : campaign.creators,
        metricsData: campaign.metrics,
        creatorsJoinedInMetrics: campaign.metrics?.creators_joined,
        creatorCount: campaign.creatorCount
      });
      
      // Warn if neither creators array nor metrics is available
      if (!Array.isArray(campaign.creators) && 
          (!campaign.metrics || campaign.metrics.creators_joined === undefined)) {
        console.warn('Neither creators array nor metrics with creators_joined is available for campaign:', campaign.id);
      }
      
      // Log any potential issues with creators data structure
      if (Array.isArray(campaign.creators) && campaign.creators.length > 0) {
        const firstCreator = campaign.creators[0];
        console.log('Sample creator data structure:', {
          hasCreatorObject: !!firstCreator.creator,
          creatorObjectFields: firstCreator.creator ? Object.keys(firstCreator.creator) : [],
          creatorEmail: firstCreator.creator?.email,
          status: firstCreator.status,
          platforms: firstCreator.platforms
        });
      }
    }
  }, [activeTab, campaign]);

  // Fetch creator data when creators tab is activated
  useEffect(() => {
    const fetchCreators = async () => {
      try {
        setIsLoadingCreators(true);
        
        console.log('=== CREATOR FETCH START ===');
        console.log('Campaign state before fetch:', {
          id: campaign.id,
          metrics: campaign.metrics,
          creators_joined: campaign.metrics?.creators_joined,
          hasCreators: !!campaign.creators,
          creatorsCount: campaign.creators?.length || 0
        });

        // STEP 1: Fetch basic creator records without complex join
        console.log('Fetching basic creator records without join...');
        const { data: campaignCreators, error: creatorsError } = await supabase
          .from('campaign_creators')
          .select('*')
          .eq('campaign_id', campaign.id);

        if (creatorsError) {
          console.error('Error fetching campaign creators:', creatorsError);
          setCreatorError(`Failed to fetch campaign creators: ${creatorsError.message}`);
          setCreators([]);
          setIsLoadingCreators(false);
          return;
        }

        console.log(`Found ${campaignCreators?.length || 0} creators for campaign ${campaign.id}`);
        
        if (!campaignCreators || campaignCreators.length === 0) {
          console.log('No creators found for this campaign');
          setCreators([]);
          
          // Update metrics with zero active creators
          if (!campaign.metrics) campaign.metrics = {};
          campaign.metrics.creators_joined = 0;
          
          setIsLoadingCreators(false);
          return;
        }

        // STEP 2: Fetch creator profiles separately
        const creatorIds = campaignCreators.map(cc => cc.creator_id);
        console.log(`Fetching profiles for ${creatorIds.length} creators...`);
        
        const { data: creatorProfiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, email, full_name, username, avatar_url, bio')
          .in('id', creatorIds);

        if (profilesError) {
          console.error('Error fetching creator profiles:', profilesError);
          // Continue with partial data
        }

        // Create a map of creator profiles by ID for easy lookup
        const profileMap = {};
        (creatorProfiles || []).forEach(profile => {
          profileMap[profile.id] = profile;
        });

        // STEP 3: Combine creator records with their profiles
        const processedCreators = campaignCreators.map(cc => ({
          id: cc.id,
          creator_id: cc.creator_id,
          campaign_id: cc.campaign_id,
          status: cc.status || 'pending',
          platforms: Array.isArray(cc.platforms) ? cc.platforms : [cc.platforms].filter(Boolean),
          creator: {
            id: cc.creator_id,
            email: profileMap[cc.creator_id]?.email || '',
            full_name: profileMap[cc.creator_id]?.full_name || '',
            username: profileMap[cc.creator_id]?.username || '',
            avatar_url: profileMap[cc.creator_id]?.avatar_url || null,
            bio: profileMap[cc.creator_id]?.bio || '',
            followers: 0, // Using default values since we can't join with these fields
            views: 0,
            engagement_rate: 0
          }
        }));

        console.log('Processed creators:', {
          total: processedCreators.length,
          activeCount: processedCreators.filter(c => c.status === 'active').length,
          sample: processedCreators.slice(0, 2)
        });

        // Update metrics
        if (!campaign.metrics) campaign.metrics = {};
        const activeCreatorsCount = processedCreators.filter(c => c.status === 'active').length;
        
        // Always update the metrics with the most recent count
        console.log(`Updating creators_joined metric: ${campaign.metrics.creators_joined} → ${activeCreatorsCount}`);
        campaign.metrics.creators_joined = activeCreatorsCount;

        // Update state
        setCreators(processedCreators);
        
        // Run additional checks for debugging
        console.log('DEBUG - All unique campaign_ids in database:', 
          Array.from(new Set(processedCreators.map(c => c.campaign_id))));

        console.log('Filtered campaign creators for this campaign:', {
          campaign_id: campaign.id,
          totalCreators: processedCreators.length,
          filteredCount: processedCreators.length,
          sample: processedCreators.slice(0, 3)
        });
        
      } catch (error) {
        console.error('Error in fetchCreators:', error);
        setCreatorError(`Error loading creators: ${error.message}`);
      } finally {
        setIsLoadingCreators(false);
      }
    };

    if (activeTab === 'creators') {
      fetchCreators();
    }
  }, [activeTab, campaign.id]);

  // Add this format date function inside the component
  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Invalid date';
      
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Error';
    }
  };

  // Helper function to get date values checking multiple property names
  const getCampaignDate = (dateType: 'start' | 'end') => {
    // Log all possible date values for debugging
    const possibleProps = dateType === 'start' 
      ? ['startDate', 'start_date', 'start', 'startdate', 'startTime', 'start_time']
      : ['endDate', 'end_date', 'end', 'enddate', 'endTime', 'end_time'];
    
    const values = {};
    possibleProps.forEach(prop => {
      values[prop] = campaign[prop];
    });
    console.log(`Checking all possible ${dateType} date props:`, values);
    
    // Return the first non-empty value
    for (const prop of possibleProps) {
      if (campaign[prop]) return campaign[prop];
    }
    
    return null;
  };

  // Helper function to safely get nested fields
  const getCampaignField = (fieldOptions: string[], fallback: any = null): any => {
    for (const field of fieldOptions) {
      const value = field.split('.').reduce((obj: any, key: string) => obj?.[key], campaign);
      if (value !== undefined && value !== null) {
        return value;
      }
    }
    return fallback;
  };

  // Calculate campaign data when not available
  const calculateCampaignData = (dataType: 'view_estimates' | 'budget_allocation'): ViewTargets | BudgetAllocation => {
    const contentType = getCampaignField(['contentType', 'content_type', 'type'], 'both') as 'original' | 'repurposed' | 'both';
    const budget = Number(getCampaignField(['budget', 'total_budget'], 0));
    const originalRate = Number(getCampaignField(['requirements.payoutRate.original', 'requirements.payout.original'], 500));
    const repurposedRate = Number(getCampaignField(['requirements.payoutRate.repurposed', 'requirements.payout.repurposed'], 250));
    
    // Default budget allocation based on content type
    let budgetAllocation: BudgetAllocation = {
      original: 50,
      repurposed: 50
    };
    
    if (contentType === 'original') {
      budgetAllocation = { original: 100, repurposed: 0 };
    } else if (contentType === 'repurposed') {
      budgetAllocation = { original: 0, repurposed: 100 };
    }
    
    if (dataType === 'budget_allocation') {
      return budgetAllocation;
    }
    
    // Calculate view estimates based on budget allocation and rates
    const originalBudget = budget * (budgetAllocation.original / 100);
    const repurposedBudget = budget * (budgetAllocation.repurposed / 100);
    
    // Ensure rates are valid numbers > 0 before dividing
    const safeOriginalRate = Number(originalRate) || 0;
    const safeRepurposedRate = Number(repurposedRate) || 0;
    
    const originalViews = safeOriginalRate > 0 ? (originalBudget / safeOriginalRate) * 1000000 : 0;
    const repurposedViews = safeRepurposedRate > 0 ? (repurposedBudget / safeRepurposedRate) * 1000000 : 0;
    const totalViews = originalViews + repurposedViews;
    
    // Ensure the returned object values are numbers
    return {
      total: Number.isFinite(totalViews) ? totalViews : 0,
      original: Number.isFinite(originalViews) ? originalViews : 0,
      repurposed: Number.isFinite(repurposedViews) ? repurposedViews : 0
    };
  };

  // Function to handle rejection with both reason and recommendations
  const handleReject = () => {
    if (rejectReason.trim()) {
      const rejectionFeedback = JSON.stringify({
        reasons: rejectReason.trim(),
        recommendations: recommendations.trim()
      });
      onReject?.(campaign, rejectionFeedback);
    }
  };

  const renderMetricCard = (title: string, value: string | number, icon: React.ReactNode, trend?: number) => {
    // Add debug logging for metric values
    console.log(`Rendering metric card for ${title}:`, { value, trend });
    
    return (
      <div className="p-4 bg-black/20 border border-gray-800 rounded-lg">
        <div className="flex items-center justify-between mb-2">
          <span className="text-gray-400">{title}</span>
          {icon}
        </div>
        <div className="flex items-end gap-2">
          <span className="text-2xl font-bold">{value}</span>
          {trend !== undefined && (
            <span className={`flex items-center text-sm ${trend >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {trend >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
              {Math.abs(trend)}%
            </span>
          )}
        </div>
      </div>
    );
  };

  const renderBudgetBreakdown = () => {
    console.log('Rendering budget breakdown with:', {
      totalBudget: campaign.budget,
      budgetAllocation: campaign.requirements?.budget_allocation,
      rawBudgetAllocation: campaign.requirements?.budget_allocation
    });

    const totalBudget = campaign.budget || 0;
    const budgetAllocation = campaign.requirements?.budget_allocation || calculateCampaignData('budget_allocation') as BudgetAllocation;
    
    console.log('Calculated budget values:', {
      totalBudget,
      budgetAllocation,
      originalBudget: (totalBudget * Number(budgetAllocation.original)) / 100,
      repurposedBudget: (totalBudget * Number(budgetAllocation.repurposed)) / 100
    });

    const originalBudget = (totalBudget * Number(budgetAllocation.original)) / 100;
    const repurposedBudget = (totalBudget * Number(budgetAllocation.repurposed)) / 100;

    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Budget Breakdown</h3>
        <div className="bg-black/20 border border-gray-800 rounded-lg p-4">
          <h4 className="font-medium mb-3">Content Type Distribution</h4>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <div>
                <span>Original Content</span>
                <span className="text-sm text-gray-400 ml-2">({budgetAllocation.original}%)</span>
              </div>
              <span className="font-medium">{formatMoney(originalBudget)}</span>
            </div>
            <div className="h-2 bg-gray-700 rounded-full mt-1 overflow-hidden">
              <div 
                className="h-full bg-red-500 rounded-full"
                style={{ width: `${budgetAllocation.original}%` }}
              />
            </div>
            <div className="flex justify-between items-center mt-3">
              <div>
                <span>Repurposed Content</span>
                <span className="text-sm text-gray-400 ml-2">({budgetAllocation.repurposed}%)</span>
              </div>
              <span className="font-medium">{formatMoney(repurposedBudget)}</span>
            </div>
            <div className="h-2 bg-gray-700 rounded-full mt-1 overflow-hidden">
              <div 
                className="h-full bg-blue-500 rounded-full"
                style={{ width: `${budgetAllocation.repurposed}%` }}
              />
            </div>
            <div className="flex justify-between items-center mt-4 pt-3 border-t border-gray-700">
              <div>
                <span className="font-medium">Total Budget</span>
              </div>
              <span className="font-medium">{formatMoney(totalBudget)}</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderViewsBreakdown = () => {
    return (
      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gray-800 p-4 rounded-lg text-center">
          <p className="text-sm text-gray-400 mb-1">Total View Target</p>
          <p className="text-2xl font-bold text-white">{formatNumber(viewTargets.total)}</p>
        </div>
        <div className={`bg-gray-800 p-4 rounded-lg text-center ${campaign.contentType === 'repurposed' ? 'opacity-50' : ''}`}>
          <p className="text-sm text-gray-400 mb-1">Original Target</p>
          <p className="text-2xl font-bold text-white">{formatNumber(viewTargets.original)}</p>
        </div>
        <div className={`bg-gray-800 p-4 rounded-lg text-center ${campaign.contentType === 'original' ? 'opacity-50' : ''}`}>
          <p className="text-sm text-gray-400 mb-1">Repurposed Target</p>
          <p className="text-2xl font-bold text-white">{formatNumber(viewTargets.repurposed)}</p>
        </div>
      </div>
    );
  };

  const renderCreatorsTab = () => {
    if (isLoadingCreators) {
      return (
        <div className="p-6 flex flex-col items-center justify-center min-h-[300px]">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-red-500 border-t-transparent mb-4"></div>
          <p className="text-gray-400">Loading creators...</p>
        </div>
      );
    }

    if (creatorError) {
      return (
        <div className="p-6 flex flex-col items-center justify-center min-h-[300px]">
          <AlertTriangle className="h-12 w-12 text-red-500 mb-4" />
          <p className="text-red-400 text-lg font-medium mb-2">Error Loading Creators</p>
          <p className="text-gray-400 mb-6 text-center">{creatorError}</p>
        </div>
      );
    }

    if (!creators || creators.length === 0) {
      return (
        <div className="p-6 flex flex-col items-center justify-center min-h-[300px]">
          <User className="h-12 w-12 text-gray-500 mb-4" />
          <p className="text-gray-400 mb-2 text-center">No creators found</p>
          <p className="text-gray-500 text-sm text-center max-w-md">
            No creators have joined this campaign yet.
          </p>
          {process.env.NODE_ENV === 'development' && (
            <button
              onClick={() => {
                console.log('Generating mock creators for development testing...');
                // Create mock creators for testing
                const mockCreators = [
                  {
                    id: 'mock-1',
                    creator_id: 'mock-creator-1',
                    campaign_id: campaign.id,
                    status: 'active',
                    platforms: ['TikTok', 'Instagram'],
                    creator: {
                      id: 'mock-creator-1',
                      email: 'creator1@example.com',
                      full_name: 'Test Creator 1',
                      username: 'testcreator1',
                      avatar_url: null,
                      bio: 'This is a mock creator for testing the admin dashboard',
                      followers: 50000,
                      views: 250000,
                      engagement_rate: 4.2
                    }
                  },
                  {
                    id: 'mock-2',
                    creator_id: 'mock-creator-2',
                    campaign_id: campaign.id,
                    status: 'pending',
                    platforms: ['YouTube'],
                    creator: {
                      id: 'mock-creator-2',
                      email: 'creator2@example.com',
                      full_name: 'Test Creator 2',
                      username: 'testcreator2',
                      avatar_url: null,
                      bio: 'Another mock creator with pending status',
                      followers: 120000,
                      views: 500000,
                      engagement_rate: 3.8
                    }
                  },
                  {
                    id: 'mock-3',
                    creator_id: 'mock-creator-3',
                    campaign_id: campaign.id,
                    status: 'rejected',
                    platforms: ['Instagram', 'TikTok', 'YouTube'],
                    creator: {
                      id: 'mock-creator-3',
                      email: 'creator3@example.com',
                      full_name: 'Test Creator 3',
                      username: 'testcreator3',
                      avatar_url: null,
                      bio: 'A rejected mock creator for testing all statuses',
                      followers: 85000,
                      views: 320000,
                      engagement_rate: 2.9
                    }
                  }
                ];
                
                setCreators(mockCreators);
                console.log('Set mock creators:', mockCreators.length);
                
                // Update campaign metrics with mock data
                const activeCreatorsCount = mockCreators.filter(c => c.status === 'active').length;
                if (!campaign.metrics) campaign.metrics = {};
                campaign.metrics.creators_joined = activeCreatorsCount;
              }}
              className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white"
            >
              Add Mock Creators (Dev Only)
            </button>
          )}
        </div>
      );
    }

    const getStatusColor = (status: string) => {
      switch (status.toLowerCase()) {
        case 'active': return 'bg-green-500/20 text-green-400 border-green-600';
        case 'pending': return 'bg-yellow-500/20 text-yellow-400 border-yellow-600';
        case 'rejected': return 'bg-red-500/20 text-red-400 border-red-600';
        default: return 'bg-gray-500/20 text-gray-400 border-gray-600';
      }
    };

    const activeCount = creators.filter(c => c.status === 'active').length;
    const pendingCount = creators.filter(c => c.status === 'pending').length;
    const totalCount = creators.length;

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="p-4 bg-gray-800/30 border border-gray-700 rounded-lg">
            <p className="text-sm text-gray-400 mb-1">Total Creators</p>
            <p className="text-2xl font-bold">{totalCount}</p>
          </div>
          <div className="p-4 bg-gray-800/30 border border-gray-700 rounded-lg">
            <p className="text-sm text-gray-400 mb-1">Active Creators</p>
            <p className="text-2xl font-bold text-green-400">{activeCount}</p>
          </div>
          <div className="p-4 bg-gray-800/30 border border-gray-700 rounded-lg">
            <p className="text-sm text-gray-400 mb-1">Pending Creators</p>
            <p className="text-2xl font-bold text-yellow-400">{pendingCount}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {creators.map(creator => (
            <div key={creator.id} className="p-4 bg-gray-800/30 border border-gray-700 rounded-lg">
              <div className="flex items-start">
                <div className="w-12 h-12 rounded-full bg-gray-700 flex-shrink-0 mr-3 overflow-hidden">
                  {creator.creator?.avatar_url ? (
                    <img 
                      src={creator.creator.avatar_url} 
                      alt={creator.creator.full_name || 'Creator'} 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-red-900/30 text-red-400">
                      <User className="w-6 h-6" />
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium">
                        {creator.creator?.full_name || creator.creator?.username || creator.creator?.email?.split('@')[0] || 'Unknown Creator'}
                      </h3>
                      <p className="text-sm text-gray-400">{creator.creator?.email || 'No email'}</p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full border ${getStatusColor(creator.status)}`}>
                      {creator.status}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="mt-3 flex flex-wrap gap-2">
                {creator.platforms && creator.platforms.length > 0 ? creator.platforms.map((platform: string, idx: number) => (
                  <span key={idx} className="text-xs px-2 py-1 bg-gray-700/50 border border-gray-600 rounded-full">
                    {platform}
                  </span>
                )) : (
                  <span className="text-xs px-2 py-1 bg-gray-700/50 border border-gray-600 rounded-full">
                    Unknown
                  </span>
                )}
              </div>
              
              <div className="mt-4 grid grid-cols-3 gap-2">
                <div className="text-center">
                  <p className="text-xs text-gray-400">Followers</p>
                  <p className="font-medium">{creator.creator?.followers ? new Intl.NumberFormat().format(creator.creator.followers) : 'N/A'}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-400">Views</p>
                  <p className="font-medium">{creator.creator?.views ? new Intl.NumberFormat().format(creator.creator.views) : 'N/A'}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-400">Engagement</p>
                  <p className="font-medium text-green-400">{creator.creator?.engagement_rate ? creator.creator.engagement_rate.toFixed(1) + '%' : 'N/A'}</p>
                </div>
              </div>
              
              {creator.creator?.bio && (
                <div className="mt-3 pt-3 border-t border-gray-700">
                  <p className="text-xs text-gray-400">Bio</p>
                  <p className="text-sm line-clamp-2">{creator.creator.bio}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-black/40 border border-gray-800 rounded-lg w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-800 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white">{campaign.title}</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className={`px-2 py-1 text-xs rounded-full ${
                campaign.status === 'active' ? 'bg-green-900/20 text-green-400' :
                campaign.status === 'pending-approval' ? 'bg-yellow-900/20 text-yellow-400' :
                campaign.status === 'rejected' ? 'bg-red-900/20 text-red-400' :
                'bg-gray-900/20 text-gray-400'
              }`}>
                {campaign.status.toUpperCase()}
              </span>
              <span className="text-sm text-gray-400">ID: {campaign.id}</span>
              <span className="text-sm text-gray-400">Business: {campaign.brand?.name || 'Not Available'}</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-full"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-gray-800">
          {[
            { id: 'overview', label: 'Overview', icon: Info },
            ...(isPending ? [] : [
              { id: 'performance', label: 'Performance', icon: BarChart },
              { id: 'creators', label: 'Creators', icon: Users },
              { id: 'content', label: 'Content', icon: FileText }
            ]),
            { id: 'business', label: 'Business Profile', icon: Building2 }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`flex items-center gap-2 px-6 py-3 relative ${
                activeTab === tab.id ? 'text-white' : 'text-gray-400'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-500" />
              )}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Key Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {renderMetricCard(
                  'Total Budget',
                  formatMoney(campaign.budget),
                  <DollarSign className="h-5 w-5 text-green-400" />
                )}
                {!isPending && renderMetricCard(
                  'Budget Spent',
                  formatMoney(campaign.spent || 0),
                  <DollarSign className="h-5 w-5 text-yellow-400" />,
                  5.2
                )}
                {renderMetricCard(
                  'Target Views',
                  formatNumber(viewTargets.total),
                  <Eye className="h-5 w-5 text-purple-400" />
                )}
                {!isPending && renderMetricCard(
                  'Active Creators',
                  formatNumber(campaign.metrics?.creators_joined || 0),
                  <Users className="h-5 w-5 text-blue-400" />
                )}
              </div>

              {/* Campaign Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Campaign Details</h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-400">Duration:</span>
                      <span>
                        {formatDate(getCampaignDate('start'))} - 
                        {formatDate(getCampaignDate('end'))}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-400">Platforms:</span>
                      <div className="flex flex-wrap gap-2">
                        {campaign.requirements?.platforms?.map((platform) => (
                          <span
                            key={platform}
                            className="px-2 py-1 bg-black/20 border border-gray-700 rounded text-sm"
                          >
                            {platform}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Target className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-400">Content Type:</span>
                      <span className="capitalize">{campaign.contentType}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Requirements</h3>
                  <div className="space-y-3">
                    <div>
                      <span className="text-gray-400">Payout Rates:</span>
                      <div className="mt-1 space-y-1">
                        {campaign.requirements?.payoutRate?.original && (
                          <p>Original Content: {campaign.requirements.payoutRate.original}</p>
                        )}
                        {campaign.requirements?.payoutRate?.repurposed && (
                          <p>Repurposed Content: {campaign.requirements.payoutRate.repurposed}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Budget and Views Breakdown */}
              {renderBudgetBreakdown()}
              <div className="mb-6">
                <h4 className="text-lg font-medium mb-2 flex items-center gap-2">
                  <Target className="h-5 w-5 text-blue-400" />
                  View Targets
                </h4>
                {renderViewsBreakdown()}
                <p className="text-xs text-gray-500 mt-2">
                  * Calculated targets based on budget and payout rates per million views. Rounded.
                </p>
              </div>

              {/* Content Guidelines */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Content Guidelines</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Original Content Guidelines */}
                  {(campaign.contentType === 'original' || campaign.contentType === 'both') && (
                    <div className="bg-black/20 border border-gray-800 rounded-lg p-4">
                      <h4 className="font-medium text-green-400 mb-3">Original Content</h4>
                      <div className="space-y-3">
                        {/* Guidelines */}
                        <div>
                          <p className="text-sm text-gray-400 mb-2">Guidelines</p>
                          <ul className="list-disc pl-4 space-y-2">
                            {campaign.requirements?.contentGuidelines?.map((guideline, index) => (
                              <li key={index}>{guideline}</li>
                            ))}
                          </ul>
                        </div>
                        
                        {/* Hashtags */}
                        <div>
                          <p className="text-sm text-gray-400 mb-2">Required Hashtag</p>
                          <div className="p-3 bg-green-900/10 border border-green-500 rounded-lg">
                            <p className="font-bold text-green-400">
                              {campaign.requirements?.hashtags?.original || '#BrandAd'}
                            </p>
                            <p className="text-xs text-gray-400 mt-1">Posts without this exact hashtag will be ineligible for payment</p>
                          </div>
                        </div>
                        
                        {/* Brief */}
                        {campaign.brief?.original && (
                          <div>
                            <p className="text-sm text-gray-400 mb-2">Campaign Brief</p>
                            <p className="text-gray-300">{campaign.brief.original}</p>
                          </div>
                        )}
                        
                        {/* Rate */}
                        <div>
                          <p className="text-sm text-gray-400 mb-2">Payout Rate</p>
                          <p className="font-bold text-green-400">
                            {campaign.requirements?.payoutRate?.original || 'Not specified'}
                          </p>
                          <p className="text-xs text-gray-500">per 1M views</p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Repurposed Content Guidelines */}
                  {(campaign.contentType === 'repurposed' || campaign.contentType === 'both') && (
                    <div className="bg-black/20 border border-gray-800 rounded-lg p-4">
                      <h4 className="font-medium text-blue-400 mb-3">Repurposed Content</h4>
                      <div className="space-y-3">
                        {/* Guidelines */}
                        <div>
                          <p className="text-sm text-gray-400 mb-2">Guidelines</p>
                          <ul className="list-disc pl-4 space-y-2">
                            {campaign.requirements?.contentGuidelines?.map((guideline, index) => (
                              <li key={index}>{guideline}</li>
                            ))}
                          </ul>
                        </div>
                        
                        {/* Hashtags */}
                        <div>
                          <p className="text-sm text-gray-400 mb-2">Required Hashtag</p>
                          <div className="p-3 bg-blue-900/10 border border-blue-500 rounded-lg">
                            <p className="font-bold text-blue-400">
                              {campaign.requirements?.hashtags?.repurposed || '#BrandPartner'}
                            </p>
                            <p className="text-xs text-gray-400 mt-1">Posts without this exact hashtag will be ineligible for payment</p>
                          </div>
                        </div>
                        
                        {/* Brief */}
                        {campaign.brief?.repurposed && (
                          <div>
                            <p className="text-sm text-gray-400 mb-2">Campaign Brief</p>
                            <p className="text-gray-300">{campaign.brief.repurposed}</p>
                          </div>
                        )}
                        
                        {/* Rate */}
                        <div>
                          <p className="text-sm text-gray-400 mb-2">Payout Rate</p>
                          <p className="font-bold text-blue-400">
                            {campaign.requirements?.payoutRate?.repurposed || 'Not specified'}
                          </p>
                          <p className="text-xs text-gray-500">per 1M views</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Add Brand Information Section */}
              {campaign.brand && (
                <div className="bg-black/30 border border-gray-700 rounded-lg p-4 mt-4">
                  <h4 className="text-md font-semibold mb-3 flex items-center text-gray-200">
                    <Building2 className="w-5 h-5 mr-2 text-purple-400" />
                    Brand Information
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Name:</span>
                      <span className="text-white font-medium">{campaign.brand.name || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Email:</span>
                      <span className="text-white font-medium">{campaign.brand.email || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Industry:</span>
                      <span className="text-white font-medium">{campaign.brand.industry || 'N/A'}</span>
                    </div>
                    {/* Add more brand fields if needed, e.g., website */}
                    {campaign.brand.website && (
                       <div className="flex justify-between">
                         <span className="text-gray-400">Website:</span>
                         <a 
                           href={campaign.brand.website} 
                           target="_blank" 
                           rel="noopener noreferrer" 
                           className="text-blue-400 hover:underline font-medium truncate max-w-[50%]"
                          >
                           {campaign.brand.website}
                          </a>
                       </div>
                    )}
                  </div>
                </div>
              )}

              {/* Campaign Brief Section */}
              {campaign.brief && (
                <div className="bg-black/20 border border-gray-800 rounded-lg p-4 mt-4">
                  <h4 className="text-md font-semibold mb-3 flex items-center text-gray-200">
                    <FileText className="w-5 h-5 mr-2 text-purple-400" />
                    Campaign Brief
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Original Content</span>
                      <span className="text-white font-medium">{campaign.brief.original || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Repurposed Content</span>
                      <span className="text-white font-medium">{campaign.brief.repurposed || 'N/A'}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'performance' && !isPending && (
            <div className="space-y-6">
              {/* Performance Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {renderMetricCard(
                  'Engagement Rate',
                  `${((campaign.engagement || 0) / (campaign.views || 1) * 100).toFixed(2)}%`,
                  <TrendingUp className="h-5 w-5 text-green-400" />,
                  3.8
                )}
                {renderMetricCard(
                  'Average View Duration',
                  '2:45',
                  <Eye className="h-5 w-5 text-blue-400" />,
                  1.2
                )}
                {renderMetricCard(
                  'Conversion Rate',
                  '4.2%',
                  <Target className="h-5 w-5 text-purple-400" />,
                  -0.8
                )}
              </div>

              {/* Platform Performance */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Platform Performance</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {campaign.requirements?.platforms?.map((platform) => (
                    <div key={platform} className="bg-black/20 border border-gray-800 rounded-lg p-4">
                      <h4 className="font-medium mb-3">{platform}</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Views</span>
                          <span>{formatNumber(campaign.platformPerformance?.[platform]?.views || 0)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Engagement Rate</span>
                          <span>{((campaign.platformPerformance?.[platform]?.engagement || 0) * 100).toFixed(1)}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Click-through Rate</span>
                          <span>{((campaign.platformPerformance?.[platform]?.ctr || 0) * 100).toFixed(1)}%</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'creators' && (
            <div className="mt-4">
              {renderCreatorsTab()}
            </div>
          )}

          {activeTab === 'content' && !isPending && (
            <div className="space-y-6">
              {/* Content Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {renderMetricCard(
                  'Total Content Pieces',
                  formatNumber(campaign.metrics?.contentCount || 0),
                  <FileText className="h-5 w-5 text-blue-400" />
                )}
                {renderMetricCard(
                  'Average Engagement',
                  `${((campaign.metrics?.totalEngagement || 0) / (campaign.metrics?.contentCount || 1)).toFixed(1)}%`,
                  <MessageCircle className="h-5 w-5 text-green-400" />
                )}
                {renderMetricCard(
                  'Content Approval Rate',
                  `${((campaign.metrics?.approvedContent || 0) / (campaign.metrics?.contentCount || 1) * 100).toFixed(0)}%`,
                  <CheckCircle className="h-5 w-5 text-yellow-400" />
                )}
              </div>

              {/* Content Performance */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Top Performing Content</h3>
                <div className="space-y-3">
                  {(campaign.topContent || []).map((content, index) => (
                    <div key={index} className="bg-black/20 border border-gray-800 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-16 h-16 bg-gray-800 rounded" />
                          <div>
                            <h4 className="font-medium">{content.title}</h4>
                            <p className="text-sm text-gray-400">{content.platform} • {content.creator}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{formatNumber(content.views)} views</p>
                          <p className="text-sm text-gray-400">{content.engagement.toFixed(1)}% engagement</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'business' && (
            <div className="space-y-6">
              {/* Brand Profile */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Brand Profile</h3>
                <div className="bg-black/20 border border-gray-800 rounded-lg p-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Brand Name:</span>
                      <span className="font-medium">{campaign.brand?.name || 'Not Available'}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Industry:</span>
                      <span className="font-medium">{campaign.brand?.industry || 'Not Specified'}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Email:</span>
                      <span className="font-medium">{campaign.brand?.email || 'Not Available'}</span>
                    </div>
                    {campaign.brand?.contactName && (
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Contact Person:</span>
                        <span className="font-medium">{campaign.brand.contactName}</span>
                      </div>
                    )}
                    {campaign.brand?.contactPhone && (
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Contact Phone:</span>
                        <span className="font-medium">{campaign.brand.contactPhone}</span>
                      </div>
                    )}
                    {campaign.brand?.website && (
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Website:</span>
                        <a 
                          href={campaign.brand.website} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="text-blue-400 hover:underline font-medium"
                        >
                          {campaign.brand.website}
                        </a>
                      </div>
                    )}
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Verification Status:</span>
                      <span className={`font-medium ${campaign.brand?.verificationLevel === 'verified' ? 'text-green-400' : 'text-yellow-400'}`}>
                        {campaign.brand?.verificationLevel || 'Unverified'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Business Overview */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {renderMetricCard(
                  'Total Campaigns',
                  formatNumber(campaign.business?.totalCampaigns || 0),
                  <Briefcase className="h-5 w-5 text-blue-400" />
                )}
                {renderMetricCard(
                  'Total Spent',
                  formatMoney(campaign.business?.totalSpent || 0),
                  <DollarSign className="h-5 w-5 text-green-400" />
                )}
                {renderMetricCard(
                  'Average Campaign Budget',
                  formatMoney(campaign.business?.avgCampaignBudget || 0),
                  <BarChart3 className="h-5 w-5 text-purple-400" />
                )}
              </div>

              {/* Previous Campaigns */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Previous Campaigns</h3>
                <div className="space-y-3">
                  {(campaign.business?.previousCampaigns || []).map((prevCampaign, index) => (
                    <div key={index} className="bg-black/20 border border-gray-800 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">{prevCampaign.title}</h4>
                          <p className="text-sm text-gray-400">
                            {new Date(prevCampaign.startDate).toLocaleDateString()} - 
                            {new Date(prevCampaign.endDate).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{formatMoney(prevCampaign.budget)}</p>
                          <p className="text-sm text-gray-400">{formatNumber(prevCampaign.views)} views</p>
                        </div>
                      </div>
                      <div className="mt-2 flex gap-2">
                        {prevCampaign.platforms.map((platform) => (
                          <span
                            key={platform}
                            className="px-2 py-1 text-xs bg-black/20 border border-gray-700 rounded"
                          >
                            {platform}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Business Performance Metrics */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Performance History</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-black/20 border border-gray-800 rounded-lg p-4">
                    <h4 className="font-medium mb-3">Campaign Success Rate</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Completed Successfully</span>
                        <span>{campaign.business?.successRate || 0}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Average ROI</span>
                        <span>{campaign.business?.averageRoi || 0}x</span>
                      </div>
                    </div>
                  </div>
                  <div className="bg-black/20 border border-gray-800 rounded-lg p-4">
                    <h4 className="font-medium mb-3">Content Performance</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Avg. Engagement Rate</span>
                        <span>{campaign.business?.avgEngagementRate || 0}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Avg. Views per Campaign</span>
                        <span>{formatNumber(campaign.business?.avgViewsPerCampaign || 0)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        {(onApprove || onReject) && isPending && (
          <div className="p-6 border-t border-gray-800">
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1">
                <input
                  type="text"
                  value={approvalNotes}
                  onChange={(e) => setApprovalNotes(e.target.value)}
                  placeholder="Optional approval notes..."
                  className="w-full px-4 py-2 bg-black/20 border border-gray-700 rounded-lg"
                />
              </div>
              <div className="flex gap-3">
                {onReject && (
                  <button
                    onClick={() => setShowRejectDialog(true)}
                    className="px-4 py-2 border border-red-500 text-red-400 rounded-lg hover:bg-red-900/20 flex items-center gap-2"
                  >
                    <XCircle className="h-4 w-4" />
                    Reject Campaign
                  </button>
                )}
                {onApprove && (
                  <button
                    onClick={() => onApprove(campaign, approvalNotes)}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg flex items-center gap-2"
                  >
                    <CheckCircle className="h-4 w-4" />
                    Approve Campaign
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Reject Dialog */}
      {showRejectDialog && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-[60]">
          <div className="bg-black/40 border border-gray-800 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">Reject Campaign</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  Rejection Reason
                </label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="w-full h-32 p-3 bg-black/40 border border-gray-700 rounded-lg"
                  placeholder="Explain why this campaign is being rejected..."
                />
              </div>
              
              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  Recommendations for Improvement
                </label>
                <textarea
                  value={recommendations}
                  onChange={(e) => setRecommendations(e.target.value)}
                  className="w-full h-32 p-3 bg-black/40 border border-gray-700 rounded-lg"
                  placeholder="Provide suggestions for how the campaign could be improved..."
                />
              </div>
            </div>
            
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setShowRejectDialog(false);
                  setRejectReason('');
                  setRecommendations('');
                }}
                className="px-4 py-2 border border-gray-700 rounded-lg hover:bg-white/5"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg"
                disabled={!rejectReason.trim()}
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCampaignDetails; 