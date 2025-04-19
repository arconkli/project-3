import React, { useState, useEffect, useMemo } from 'react';
import { Search, Filter, Check, X, Eye, Pause, AlertCircle, Plus, CheckCircle, XCircle, Info, PlayCircle, PauseCircle } from 'lucide-react';
import { formatMoney } from '@/utils/format';
import type { Campaign } from '@/types/brand';
import CampaignEditReview from './CampaignEditReview';
import CampaignEditor from './CampaignEditor';
import AdminCampaignDetails from './AdminCampaignDetails';
import { campaignService } from '@/services/campaign';
import { Button, Dialog, Input, Spinner } from "@/components/ui";
import { supabase } from '@/lib/supabaseClient';

// Helper function to safely format dates
const formatDate = (dateValue: string | Date | undefined): string => {
  if (!dateValue) return 'N/A';
  try {
    const date = typeof dateValue === 'string' ? new Date(dateValue) : dateValue;
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  } catch (e) {
    console.error('Error formatting date:', e);
    return 'Invalid date';
  }
};

interface CampaignApprovalListProps {
  campaigns: Campaign[];
  activeCampaigns: Campaign[];
  pendingEdits: any[];
  onViewDetails: (campaign: Campaign) => void;
  onApprove: (campaign: Campaign) => void;
  onReject: (campaign: Campaign, rejectionFeedback: string) => void;
  onApproveEdit: (editId: string, notes?: string) => void;
  onRejectEdit: (editId: string, reason: string) => void;
  isLoading?: boolean;
  isMockData?: boolean;
}

const CampaignApprovalList: React.FC<CampaignApprovalListProps> = ({
  campaigns,
  activeCampaigns,
  pendingEdits,
  onViewDetails,
  onApprove,
  onReject,
  onApproveEdit,
  onRejectEdit,
  isLoading = false,
  isMockData = false
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'active' | 'pending' | 'completed'>('active');
  const [pendingCampaigns, setPendingCampaigns] = useState<Campaign[]>(campaigns);
  const [localActiveCampaigns, setLocalActiveCampaigns] = useState<Campaign[]>([]);
  const [completedCampaigns, setCompletedCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [showPauseDialog, setShowPauseDialog] = useState(false);
  const [pauseReason, setPauseReason] = useState('');
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [showEditApprovalDialog, setShowEditApprovalDialog] = useState(false);
  const [editApprovalNotes, setEditApprovalNotes] = useState('');
  const [showEditor, setShowEditor] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);
  const [showCampaignDetails, setShowCampaignDetails] = useState(false);
  
  // Add states for rejection dialog
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [recommendations, setRecommendations] = useState('');

  // Add new state for the complete dialog
  const [showCompleteDialog, setShowCompleteDialog] = useState(false);
  const [completeReason, setCompleteReason] = useState('');

  // Combine external loading state with internal loading state
  const isPageLoading = loading || isLoading;

  // Update local active campaigns state when prop changes
  useEffect(() => {
    if (activeCampaigns && activeCampaigns.length > 0) {
      console.log('Setting local active campaigns from props:', activeCampaigns.length);
      setLocalActiveCampaigns(activeCampaigns);
    }
  }, [activeCampaigns]);

  // Log when component receives new props
  useEffect(() => {
    console.log('CampaignApprovalList received props:', { 
      activeCampaignsCount: activeCampaigns?.length || 0, 
      activeFirstItem: activeCampaigns?.[0] ? `${activeCampaigns[0].id} (${activeCampaigns[0].title})` : 'none',
      campaignsCount: campaigns?.length || 0,
      pendingEditsCount: pendingEdits?.length || 0
    });
  }, [activeCampaigns, campaigns, pendingEdits]);

  // Improve the function to check if a campaign has pending edits
  const hasPendingEdit = (campaignId: string) => {
    if (!pendingEdits || pendingEdits.length === 0) return false;
    
    const hasEdit = pendingEdits.some(edit => edit.campaign_id === campaignId);
    if (hasEdit) {
      console.log(`Campaign ${campaignId} has pending edits and will be excluded from the pending tab`);
    }
    return hasEdit;
  };

  // Log available pending edits for debugging
  useEffect(() => {
    if (pendingEdits && pendingEdits.length > 0) {
      console.log(`CampaignApprovalList has ${pendingEdits.length} pending edits:`);
      
      // Group by campaign ID for easier debugging
      const editsByCampaignId: Record<string, any[]> = {};
      pendingEdits.forEach(edit => {
        if (!editsByCampaignId[edit.campaign_id]) {
          editsByCampaignId[edit.campaign_id] = [];
        }
        editsByCampaignId[edit.campaign_id].push({
          edit_id: edit.id,
          title: edit.title,
          hasOldData: !!edit.oldData,
          hasNewData: !!edit.newData,
          keyChanges: edit.keyChanges
        });
      });
      
      console.log('Edits grouped by campaign_id:', editsByCampaignId);
    } else {
      console.log('DEBUG: No pending campaign edits to review - this is just informational');
    }
  }, [pendingEdits]);

  // Filter campaigns based on tab and search term - enhanced logic
  const filteredCampaigns = useMemo(() => {
    let campaignsToFilter;
    
    if (activeTab === 'active') {
      // Use both props and local state to be more resilient
      campaignsToFilter = localActiveCampaigns.length > 0 
        ? localActiveCampaigns 
        : activeCampaigns || [];
    } else if (activeTab === 'completed') {
      // Use completed campaigns state for the completed tab
      campaignsToFilter = completedCampaigns || [];
    } else {
      campaignsToFilter = campaigns || [];
    }
    
    console.log(`Filtering campaigns for ${activeTab} tab:`, { 
      sourceCount: campaignsToFilter?.length || 0,
      searchTerm: searchTerm ? `"${searchTerm}"` : 'none'
    });
    
    return (campaignsToFilter || []).filter(campaign => {
      // Always apply search filtering
      const matchesSearch = !searchTerm || (campaign.title && campaign.title.toLowerCase().includes(searchTerm.toLowerCase()));
      
      // Apply tab-specific filtering
      if (activeTab === 'active') {
        // Active tab: show campaigns with status 'active' or 'paused'
        return matchesSearch && (campaign.status === 'active' || campaign.status === 'paused');
      } 
      else if (activeTab === 'pending') {
        // Pending tab: show campaigns pending approval
        const isPending = campaign.status === 'pending_approval' || 
                          campaign.status === 'pending-approval' || 
                          campaign.status === 'pending' ||
                          campaign.status === 'review' ||
                          campaign.status === 'draft';
        
        return matchesSearch && isPending;
      }
      else if (activeTab === 'completed') {
        // For completed tab, we're already filtering from completedCampaigns state
        // Additional status check as a safeguard
        return matchesSearch && campaign.status === 'completed';
      }
      
      // Default: just apply search filtering
      return matchesSearch;
    });
  }, [activeTab, searchTerm, campaigns, localActiveCampaigns, activeCampaigns, completedCampaigns]);

  // Fetch campaigns based on active tab
  useEffect(() => {
    console.log(`Tab changed to: ${activeTab}, fetching necessary data`);
    
    if (activeTab === 'pending') {
      setLoading(true);
      console.log('Fetching pending campaigns from API...');
      campaignService.getAllPendingCampaigns()
        .then(campaigns => {
          console.log('API returned pending campaigns:', campaigns);
          setPendingCampaigns(campaigns || []);
          setLoading(false);
        })
        .catch(err => {
          console.error('Error fetching pending campaigns:', err);
          setError('Failed to load pending campaigns');
          setLoading(false);
        });
    } else if (activeTab === 'active' && activeCampaigns.length === 0 && localActiveCampaigns.length === 0) {
      // If active tab is selected but no active campaigns are loaded, fetch them
      setLoading(true);
      console.log('Fetching active campaigns from API because none were provided...');
      campaignService.getAllActiveCampaigns()
        .then(campaigns => {
          console.log('API directly returned active campaigns:', campaigns);
          if (campaigns && campaigns.length > 0) {
            setLocalActiveCampaigns(campaigns);
            setLoading(false);
          } else {
            console.log('No active campaigns found from direct API call');
            setLoading(false);
          }
        })
        .catch(err => {
          console.error('Error fetching active campaigns directly:', err);
          setError('Failed to load active campaigns');
          setLoading(false);
        });
    } else if (activeTab === 'completed') {
      // Fetch completed campaigns when the completed tab is selected
      // Removing the completedCampaigns.length === 0 condition to ensure it fetches every time
      setLoading(true);
      console.log('Fetching completed campaigns from API...');
      campaignService.getAllCompletedCampaigns()
        .then(campaigns => {
          console.log('API returned completed campaigns:', campaigns);
          setCompletedCampaigns(campaigns || []);
          setLoading(false);
        })
        .catch(err => {
          console.error('Error fetching completed campaigns:', err);
          setError('Failed to load completed campaigns');
          setLoading(false);
        });
    }
  }, [activeTab, activeCampaigns.length, localActiveCampaigns.length]); // Removed completedCampaigns.length from dependencies

  // Handle approving a campaign
  const handleApprove = (campaign: Campaign) => {
    // Don't allow actions on mock data
    if (isMockData) {
      alert('Actions are disabled in demo mode.');
      return;
    }
    
    setLoading(true);
    campaignService.approveCampaign(campaign.id)
      .then(() => {
        // Remove from pending list
        setPendingCampaigns(prev => prev.filter(c => c.id !== campaign.id));
        // Call parent handler
        onApprove(campaign);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error approving campaign:', err);
        setError('Failed to approve campaign');
        setLoading(false);
      });
  };
  
  // Handle rejecting a campaign
  const handleReject = (campaign: Campaign) => {
    // Don't allow actions on mock data
    if (isMockData) {
      alert('Actions are disabled in demo mode.');
      return;
    }
    
    setSelectedCampaign(campaign);
    setShowRejectDialog(true);
  };

  // Add new function to handle the actual rejection after dialog
  const handleConfirmReject = () => {
    if (!selectedCampaign || !rejectReason.trim()) return;
    
    setLoading(true);
    
    // Structure the rejection feedback
    const rejectionFeedback = JSON.stringify({
      reasons: rejectReason.trim(),
      recommendations: recommendations.trim()
    });
    
    campaignService.rejectCampaign(selectedCampaign.id, rejectionFeedback)
      .then(() => {
        // Remove from pending list
        setPendingCampaigns(prev => prev.filter(c => c.id !== selectedCampaign.id));
        // Call parent handler with both the campaign and the rejection feedback
        onReject(selectedCampaign, rejectionFeedback);
        // Reset dialog
        setShowRejectDialog(false);
        setRejectReason('');
        setRecommendations('');
        setSelectedCampaign(null);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error rejecting campaign:', err);
        setError('Failed to reject campaign');
        setLoading(false);
      });
  };

  const handlePauseCampaign = (campaign: Campaign) => {
    // Don't allow actions on mock data
    if (isMockData) {
      alert('Actions are disabled in demo mode.');
      return;
    }
    
    setSelectedCampaign(campaign);
    setShowPauseDialog(true);
  };

  const handleConfirmPause = () => {
    if (selectedCampaign && pauseReason.trim()) {
      // Set loading state
      setLoading(true);
      
      console.log(`Attempting to pause campaign ${selectedCampaign.id} with reason: ${pauseReason.trim()}`);
      
      // Make API call to pause the campaign
      campaignService.updateCampaign(selectedCampaign.id, { 
        status: 'paused',
        pauseReason: pauseReason.trim() 
      })
        .then(updatedCampaign => {
          console.log('Campaign paused successfully:', updatedCampaign);
          
          if (updatedCampaign.status !== 'paused') {
            console.warn(`Warning: Campaign was updated but status is ${updatedCampaign.status}, not 'paused'`);
          }
          
          // Update local state
          if (activeTab === 'active') {
            console.log('Updating local active campaigns list with paused campaign');
            setLocalActiveCampaigns(prev => 
              prev.map(c => c.id === updatedCampaign.id ? updatedCampaign : c)
            );
          }
          
          // Show success message
          alert(`Campaign "${selectedCampaign.title}" has been paused.`);
          
          // Reset UI state
          setShowPauseDialog(false);
          setPauseReason('');
          setSelectedCampaign(null);
          setLoading(false);
        })
        .catch(error => {
          console.error('Error pausing campaign:', error);
          alert(`Failed to pause campaign: ${error.message || String(error)}`);
          setLoading(false);
        });
    }
  };

  // New function to handle campaign completion
  const handleCompleteCampaign = (campaign: Campaign) => {
    // Don't allow actions on mock data
    if (isMockData) {
      alert('Actions are disabled in demo mode.');
      return;
    }
    
    setSelectedCampaign(campaign);
    setShowCompleteDialog(true);
  };

  // New function to confirm campaign completion
  const handleConfirmComplete = () => {
    if (selectedCampaign) {
      // Set loading state
      setLoading(true);
      
      console.log(`Attempting to complete campaign ${selectedCampaign.id}`);
      
      // Make API call to complete the campaign
      campaignService.completeCampaign(selectedCampaign.id)
        .then(updatedCampaign => {
          console.log('Campaign completed successfully:', updatedCampaign);
          
          // Update local state - remove from active campaigns
          if (activeTab === 'active') {
            console.log('Removing completed campaign from active list');
            setLocalActiveCampaigns(prev => 
              prev.filter(c => c.id !== updatedCampaign.id)
            );
          }
          
          // Add the campaign to the completed campaigns state
          setCompletedCampaigns(prev => [updatedCampaign, ...prev]);
          
          // Show success message
          alert(`Campaign "${selectedCampaign.title}" has been completed.`);
          
          // Reset UI state
          setShowCompleteDialog(false);
          setCompleteReason('');
          setSelectedCampaign(null);
          setLoading(false);
        })
        .catch(error => {
          console.error('Error completing campaign:', error);
          alert(`Failed to complete campaign: ${error.message || String(error)}`);
          setLoading(false);
        });
    }
  };

  // Remove mock examples for pending campaigns
  const pendingExamples = [];

  // Add example campaigns to pending tab only if no real campaigns found
  const displayedCampaigns = activeTab === 'pending' 
    ? pendingCampaigns
    : filteredCampaigns;
  
  console.log(`Tab: ${activeTab}, Showing ${filteredCampaigns.length} campaigns after filtering`);

  // Render campaign list with more forgiving status checks
  const renderCampaignStatus = (status: string) => {
    // Normalize status by replacing underscore with hyphen and handling various forms
    const normalizedStatus = status.replace('_', '-');
    const isPending = normalizedStatus.includes('pending') || normalizedStatus === 'review';
    const isApproved = normalizedStatus === 'approved' || normalizedStatus === 'active';
    const isRejected = normalizedStatus === 'rejected';
    const isPaused = normalizedStatus === 'paused';
    const isCompleted = normalizedStatus === 'completed';
    
    const statusClass = isPending ? 'bg-yellow-900/20 text-yellow-400' :
                      isApproved ? 'bg-green-900/20 text-green-400' :
                      isPaused ? 'bg-orange-900/20 text-orange-400' :
                      isCompleted ? 'bg-blue-900/20 text-blue-400' :
                      'bg-red-900/20 text-red-400';
                      
    return (
      <span className={`px-2 py-1 text-xs rounded-full ${statusClass}`}>
        {status.toUpperCase()}
      </span>
    );
  };

  // Handle approving an edit - enhanced with better logging and error handling
  const handleApproveEdit = (id: string, notes?: string) => {
    console.log('Approving edit:', id, notes);
    setLoading(true);

    // Optional: You could add direct API call here instead of relying on parent
    onApproveEdit(id, notes);
    
    // Remove the edit from the local list to update UI immediately
    if (pendingEdits) {
      const newPendingEdits = pendingEdits.filter(edit => edit.id !== id);
      // Note: This won't actually update the list since it's a prop, but it's good practice
      console.log(`Edit ${id} would be removed from list, leaving ${newPendingEdits.length} edits`);
    }
    
    setLoading(false);
  };
  
  // Handle rejecting an edit
  const handleRejectEdit = (id: string, reason: string) => {
    console.log('Rejecting edit:', id, reason);
    setLoading(true);
    
    // Optional: You could add direct API call here instead of relying on parent
    onRejectEdit(id, reason);
    
    // Same as above for UI update
    if (pendingEdits) {
      const newPendingEdits = pendingEdits.filter(edit => edit.id !== id);
      console.log(`Edit ${id} would be removed from list, leaving ${newPendingEdits.length} edits`);
    }
    
    setLoading(false);
  };

  // Handle viewing campaign details - update to fetch campaign with creators
  const handleViewCampaignDetails = async (campaign: Campaign) => {
    // View is still allowed, but the user should know it's mock data
    if (isMockData) {
      alert('Viewing mock data. Some details may be limited.');
    }
    
    try {
      setLoading(true);
      console.log('Fetching campaign details for:', {
        id: campaign.id,
        title: campaign.title,
        currentMetrics: campaign.metrics,
        currentCreators: campaign.creators
      });
      
      // Always fetch fresh data from the API to ensure we have the latest metrics
      console.log('Fetching fresh campaign data with creators...');
      const campaignWithCreators = await campaignService.getCampaignWithCreators(campaign.id);
      
      console.log('Fetched campaign data:', {
        id: campaignWithCreators.id,
        metrics: campaignWithCreators.metrics,
        creatorsCount: campaignWithCreators.creators?.length || 0,
        creatorsJoined: campaignWithCreators.metrics?.creators_joined,
        firstCreator: campaignWithCreators.creators?.[0]
      });

      // Ensure metrics object exists
      if (!campaignWithCreators.metrics) {
        console.log('No metrics found, initializing metrics object');
        campaignWithCreators.metrics = {
          views: 0,
          engagement: 0,
          creators_joined: 0,
          posts_submitted: 0,
          posts_approved: 0
        };
      }

      // Update creators_joined in metrics based on actual creators array
      const activeCreators = (campaignWithCreators.creators || []).filter(c => c.status === 'active');
      if (campaignWithCreators.metrics.creators_joined !== activeCreators.length) {
        console.log(`Fixing creators_joined metric: ${campaignWithCreators.metrics.creators_joined} → ${activeCreators.length}`);
        campaignWithCreators.metrics.creators_joined = activeCreators.length;
      }

      // Ensure creators array exists
      if (!Array.isArray(campaignWithCreators.creators)) {
        console.log('No creators array found, initializing empty array');
        campaignWithCreators.creators = [];
      }

      console.log('Final campaign data:', {
        id: campaignWithCreators.id,
        metrics: campaignWithCreators.metrics,
        creatorsCount: campaignWithCreators.creators.length,
        creatorsJoined: campaignWithCreators.metrics.creators_joined
      });

      setSelectedCampaign(campaignWithCreators);
      setShowCampaignDetails(true);
    } catch (error) {
      console.error('Error fetching campaign details:', error);
      // If we can't fetch with creators, show what we have
      setSelectedCampaign(campaign);
      setShowCampaignDetails(true);
    } finally {
      setLoading(false);
    }
  };

  // First, add a new function to render a mock data warning
  const renderMockDataWarning = () => {
    if (!isMockData) return null;
    
    return (
      <div className="flex items-center p-4 my-4 text-amber-800 border border-amber-300 bg-amber-50 rounded-md">
        <AlertCircle className="w-5 h-5 mr-2 text-amber-500" />
        <div>
          <h3 className="font-medium">Demo Mode Active</h3>
          <p className="text-sm">
            You're viewing sample data because the database connection timed out. 
            Admin actions are disabled in demo mode.
          </p>
        </div>
      </div>
    );
  };

  const openEditor = (campaign: Campaign | null) => {
    setEditingCampaign(campaign);
    setShowEditor(true);
  };

  if (loading) {
    return (
      <div className="p-8 flex justify-center items-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-red-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Loading and Error State */}
      {error && (
        <div className="p-4 border border-red-800 rounded-lg bg-red-900/20 text-red-400">
          <p className="flex items-center gap-2">
            <X className="h-5 w-5" />
            {error}
          </p>
        </div>
      )}
      
      {/* Debug information - can be removed for production */}
      {/* Removing this debug panel as requested */}
      
      {activeTab === 'pending' && pendingCampaigns.length === 0 && !loading && !error && (
        <div className="p-4 border border-yellow-800 rounded-lg bg-yellow-900/20 text-yellow-400">
          <p>No pending campaigns found. Make sure brand accounts have submitted campaigns for approval.</p>
        </div>
      )}

      {activeTab === 'active' && localActiveCampaigns.length === 0 && activeCampaigns.length === 0 && !loading && !error && (
        <div className="p-4 border border-yellow-800 rounded-lg bg-yellow-900/20 text-yellow-400">
          <p>No active campaigns found. Approve pending campaigns to see them here.</p>
        </div>
      )}

      {activeTab === 'completed' && completedCampaigns.length === 0 && !loading && !error && (
        <div className="p-4 border border-blue-800 rounded-lg bg-blue-900/20 text-blue-400">
          <p>No completed campaigns found. Complete active campaigns to see them here.</p>
        </div>
      )}

      {/* Campaign Tabs */}
      <div className="flex border-b border-gray-800">
        {[
          { id: 'active', label: 'Active Campaigns' },
          { id: 'pending', label: 'Pending Approval' },
          { id: 'completed', label: 'Completed' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              console.log(`Switching to ${tab.id} tab`);
              setActiveTab(tab.id as typeof activeTab);
            }}
            className={`px-4 py-2 relative ${
              activeTab === tab.id ? 'text-white' : 'text-gray-400'
            }`}
          >
            <div className="flex items-center gap-2">
              <span>{tab.label}</span>
            </div>
            {activeTab === tab.id && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-500" />
            )}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 p-4 bg-black/40 border border-gray-800 rounded-lg">
        <button
          onClick={() => openEditor(null)}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Create Campaign
        </button>

        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search campaigns..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-black/40 border border-gray-700 rounded-lg"
          />
        </div>
        
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 bg-black/40 border border-gray-700 rounded-lg"
        >
          <option value="all">All Status</option>
          <option value="pending-approval">Pending Approval</option>
          <option value="pending-changes">Pending Changes</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {/* Show mock data warning if applicable */}
      {renderMockDataWarning()}

      {/* Show loading state */}
      {isPageLoading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
        </div>
      ) : filteredCampaigns.length === 0 ? (
        <div className="bg-zinc-800 rounded-lg p-8 text-center">
          <p className="text-lg text-gray-300">
            {activeTab === 'pending'
              ? 'No pending campaigns found'
              : activeTab === 'active'
              ? 'No active campaigns found'
              : 'No completed campaigns found'}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto bg-zinc-800 rounded-lg">
          <div className="space-y-4">
            {filteredCampaigns.map((campaign) => (
              <div
                key={campaign.id}
                className="p-6 bg-black/40 border border-gray-800 rounded-lg"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-white truncate" title={campaign.title}>{campaign.title}</h3>
                    {/* Add Brand Name Display */}
                    {campaign.brand && (
                      <p className="text-sm text-gray-400 truncate" title={campaign.brand.name}>
                        By: {campaign.brand.name || 'Unknown Brand'}
                      </p>
                    )}
                    <p className="text-xs text-gray-500">ID: {campaign.id}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-gray-400">Content Type</p>
                    <p className="font-medium capitalize">{campaign.content_type || campaign.contentType || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Platforms</p>
                    <div className="flex flex-wrap gap-2">
                      {(campaign.requirements?.platforms?.length > 0 || campaign.platforms?.length > 0) ? (
                        (campaign.requirements?.platforms || campaign.platforms || []).map((platform: string) => (
                          <span
                            key={platform}
                            className="px-2 py-1 bg-black/20 border border-gray-700 rounded text-sm"
                          >
                            {platform}
                          </span>
                        ))
                      ) : (
                        <span className="text-gray-400">No platforms specified</span>
                      )}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Duration</p>
                    <p className="font-medium">
                      {formatDate(campaign.start_date || campaign.startDate)} - 
                      {formatDate(campaign.end_date || campaign.endDate)}
                    </p>
                  </div>
                </div>

                {/* Campaign Stats for Active Campaigns */}
                {(campaign.status === 'active' || campaign.status === 'paused') && (
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4 p-3 bg-black/20 border border-gray-700 rounded-lg">
                    <div>
                      <p className="text-xs text-gray-400">Total Views</p>
                      <p className="font-bold text-white">
                        {campaign.metrics?.views 
                          ? campaign.metrics.views.toLocaleString() 
                          : '0'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Engagement</p>
                      <p className="font-bold text-white">
                        {campaign.metrics?.engagement 
                          ? `${campaign.metrics.engagement.toLocaleString()}%`
                          : '0%'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Creators</p>
                      <p className="font-bold text-white">
                        {campaign.metrics?.creators_joined 
                          ? campaign.metrics.creators_joined.toLocaleString()
                          : '0'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Content Pieces</p>
                      <p className="font-bold text-white">
                        {campaign.metrics?.posts_submitted
                          ? campaign.metrics.posts_submitted.toLocaleString()
                          : '0'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Budget Used</p>
                      <p className="font-bold text-white">
                        {campaign.spent ? formatMoney(campaign.spent) : '$0'} / {formatMoney(campaign.budget || 0)}
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex gap-2">
                  <button
                    onClick={() => handleViewCampaignDetails(campaign)}
                    className="px-3 py-1 border border-gray-700 rounded text-sm hover:bg-white/5"
                  >
                    View Details
                  </button>
                  <button
                    onClick={() => openEditor(campaign)}
                    className="px-3 py-1 border border-gray-700 rounded text-sm hover:bg-white/5"
                  >
                    Edit
                  </button>
                  
                  {/* Show the Approve and Reject buttons for any campaign that seems to be pending approval */}
                  {(campaign.status === 'pending-approval' || 
                    campaign.status === 'pending_approval' || 
                    campaign.status === 'pending' || 
                    campaign.status === 'review' || 
                    campaign.status === 'draft' ||
                    campaign.status.includes('pending')) && (
                    <>
                      <button
                        onClick={() => handleApprove(campaign)}
                        className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg flex items-center gap-2"
                      >
                        <CheckCircle className="h-4 w-4" />
                        Approve
                      </button>
                      
                      <button
                        onClick={() => handleReject(campaign)}
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg flex items-center gap-2"
                      >
                        <XCircle className="h-4 w-4" />
                        Reject
                      </button>
                    </>
                  )}
                  
                  {campaign.status === 'active' && (
                    <>
                      <button
                        className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 rounded-lg flex items-center gap-2"
                        onClick={() => handlePauseCampaign(campaign)}
                        disabled={loading}
                      >
                        {loading ? <Spinner size="sm" /> : <PauseCircle className="h-4 w-4" />}
                        {loading ? 'Processing...' : 'Pause Campaign'}
                      </button>
                      
                      <button
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center gap-2"
                        onClick={() => handleCompleteCampaign(campaign)}
                        disabled={loading}
                      >
                        {loading ? <Spinner size="sm" /> : <CheckCircle className="h-4 w-4" />}
                        {loading ? 'Completing...' : 'Complete Campaign'}
                      </button>
                    </>
                  )}
                  
                  {campaign.status === 'paused' && (
                    <>
                      <button
                        className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg flex items-center gap-2"
                        onClick={() => {
                          // Call API to resume the campaign
                          setLoading(true);
                          console.log(`Attempting to resume campaign ${campaign.id}`);
                          
                          campaignService.updateCampaign(campaign.id, { status: 'active' })
                            .then(updatedCampaign => {
                              console.log('Campaign resumed successfully:', updatedCampaign);
                              
                              if (updatedCampaign.status !== 'active') {
                                console.warn(`Warning: Campaign was updated but status is ${updatedCampaign.status}, not 'active'`);
                              }
                              
                              // Update local state
                              if (activeTab === 'active') {
                                console.log('Updating local active campaigns list with resumed campaign');
                                setLocalActiveCampaigns(prev => 
                                  prev.map(c => c.id === updatedCampaign.id ? updatedCampaign : c)
                                );
                              }
                              
                              alert(`Campaign "${campaign.title}" has been resumed.`);
                              setLoading(false);
                            })
                            .catch(error => {
                              console.error('Error resuming campaign:', error);
                              alert(`Failed to resume campaign: ${error.message || String(error)}`);
                              setLoading(false);
                            });
                        }}
                        disabled={loading}
                      >
                        {loading ? <Spinner size="sm" /> : <PlayCircle className="h-4 w-4" />}
                        {loading ? 'Resuming...' : 'Resume Campaign'}
                      </button>
                      
                      <button
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center gap-2"
                        onClick={() => handleCompleteCampaign(campaign)}
                        disabled={loading}
                      >
                        {loading ? <Spinner size="sm" /> : <CheckCircle className="h-4 w-4" />}
                        {loading ? 'Completing...' : 'Complete Campaign'}
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Pause Campaign Dialog */}
      {showPauseDialog && selectedCampaign && (
        <Dialog
          isOpen={showPauseDialog}
          onClose={() => !loading && setShowPauseDialog(false)}
          title={`Pause Campaign: ${selectedCampaign.title}`}
        >
          <div className="space-y-4">
            <p>Please provide a reason for pausing this campaign:</p>
            <Input
              value={pauseReason}
              onChange={(e) => setPauseReason(e.target.value)}
              placeholder="Reason for pausing..."
              disabled={loading}
            />
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowPauseDialog(false)}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmPause}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg flex items-center gap-2"
                disabled={!pauseReason.trim() || loading}
              >
                {loading ? <Spinner size="sm" /> : <Pause className="h-4 w-4" />}
                {loading ? 'Pausing...' : 'Confirm Pause'}
              </button>
            </div>
          </div>
        </Dialog>
      )}
      
      {/* Edit Approval Dialog */}
      {showEditApprovalDialog && selectedCampaign && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-black/40 border border-gray-800 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">Review Campaign Edit</h3>
            
            <div className="mb-4">
              <p className="text-gray-400 mb-2">Campaign: {selectedCampaign.title}</p>
              <div className="p-3 bg-black/20 border border-gray-700 rounded-lg mb-3">
                <h4 className="font-medium mb-2">Changes Requested:</h4>
                <ul className="list-disc pl-4 space-y-1 text-sm">
                  <li>Updated campaign budget</li>
                  <li>Modified content guidelines</li>
                  <li>Extended end date</li>
                </ul>
              </div>
              
              <label className="block text-sm text-gray-400 mb-2">
                Review Notes
              </label>
              <textarea
                value={editApprovalNotes}
                onChange={(e) => setEditApprovalNotes(e.target.value)}
                className="w-full h-32 p-3 bg-black/40 border border-gray-700 rounded-lg"
                placeholder="Add notes about the campaign changes..."
              />
            </div>
            
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowEditApprovalDialog(false);
                  setEditApprovalNotes('');
                  setSelectedCampaign(null);
                }}
                className="px-4 py-2 border border-gray-700 rounded-lg hover:bg-white/5"
              >
                Reject Changes
              </button>
              <button
                onClick={() => {
                  // Handle approving changes
                  console.log('Approved changes:', selectedCampaign.id, editApprovalNotes);
                  setShowEditApprovalDialog(false);
                  setEditApprovalNotes('');
                  setSelectedCampaign(null);
                }}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg"
              >
                Approve Changes
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Campaign Editor Modal */}
      {showEditor && (
        <CampaignEditor
          campaign={editingCampaign || undefined}
          onClose={() => {
            setShowEditor(false);
            setEditingCampaign(null);
          }}
          isAdmin={true}
          onSave={async (campaignData) => {
            console.log('Save campaign:', campaignData);
            
            try {
              let finalBrandId: string | undefined;
              let campaignPayload: any;
              
              // Handle brand creation or selection
              if (campaignData.new_brand_name) {
                // Admin is creating a new brand
                console.log(`Creating new brand: ${campaignData.new_brand_name}`);

                // 1. Get current admin user ID
                const { data: { user }, error: userError } = await supabase.auth.getUser();
                if (userError || !user) {
                  console.error("Error fetching current user:", userError);
                  throw new Error(userError?.message || 'Could not get current user to associate with new brand.');
                }
                
                // 2. Get admin's profile ID
                // Let's assume admin profile must exist. If not, brand creation might fail later, which is acceptable for now.
                const { data: adminProfile, error: profileError } = await supabase
                  .from('profiles')
                  .select('id')
                  .eq('user_id', user.id)
                  .maybeSingle(); // Use maybeSingle in case profile doesn't exist yet
                  
                if (profileError) {
                  console.error("Error fetching admin profile:", profileError);
                  throw new Error("Could not fetch admin profile to link brand.");
                }
                
                if (!adminProfile) {
                  // Handle case where admin might not have a profile? Or rely on RLS/trigger to create one?
                  // For now, throw an error - this indicates a setup issue.
                  console.error(`Admin user ${user.id} does not have a profile.`);
                  throw new Error(`Admin user ${user.email} does not have a profile. Cannot create brand.`);
                }
                
                const adminProfileId = adminProfile.id;
                console.log(`Using admin profile ID ${adminProfileId} for new brand.`);

                // 3. Insert into brands table, including profile_id
                const { data: newBrand, error: brandError } = await supabase
                  .from('brands')
                  .insert({ 
                      name: campaignData.new_brand_name,
                      contact_email: campaignData.new_brand_contact_email || null,
                      profile_id: adminProfileId // Include the admin's profile ID
                  })
                  .select('id')
                  .single();
                
                if (brandError || !newBrand) {
                   throw new Error('Failed to create brand or retrieve its ID.');
                }

                finalBrandId = newBrand.id;
                console.log(`Created new brand with ID: ${finalBrandId}`);

              } else if (campaignData.brand_id) {
                // Use existing brand ID
                finalBrandId = campaignData.brand_id;
              } else {
                // This case should ideally be prevented by form validation
                throw new Error('Campaign data is missing required brand information (existing ID or new brand details).');
              }

              // Prepare the common campaign data payload (excluding brand_id for create)
              campaignPayload = {
                title: campaignData.title,
                content_type: campaignData.contentType,
                start_date: campaignData.startDate,
                end_date: campaignData.endDate,
                budget: campaignData.budget,
                brief: campaignData.brief,
                platforms: campaignData.platforms,
                status: 'pending_approval', // Admin creation goes to pending
                // Pass view targets directly
                total_view_target: campaignData.total_view_target,
                original_view_target: campaignData.original_view_target,
                repurposed_view_target: campaignData.repurposed_view_target,
                requirements: {
                  // Only include requirements that are part of the form/payload
                  contentGuidelines: campaignData.requirements?.contentGuidelines,
                  minViewsForPayout: campaignData.requirements?.minViewsForPayout,
                  payoutRate: campaignData.requirements?.payoutRate,
                  hashtags: campaignData.requirements?.hashtags,
                  budget_allocation: campaignData.requirements?.budget_allocation
                  // Removed: view_estimates is handled at the top level
                }
              };

              // Make API call to update or create the campaign
              let updatedCampaign;
              if (editingCampaign) {
                console.log('Updating existing campaign with ID:', editingCampaign.id);
                updatedCampaign = await campaignService.updateCampaign(editingCampaign.id, campaignPayload);
              } else {
                console.log('Creating new campaign via admin service...');
                // Ensure brand_id is passed for creation
                updatedCampaign = await campaignService.createCampaignFromAdmin({ 
                  ...campaignPayload, 
                  brand_id: finalBrandId 
                });
              }
              
              console.log('Campaign saved successfully:', updatedCampaign);
              setShowEditor(false);
              setEditingCampaign(null);
              // Refresh data by changing active tab temporarily or calling a refresh function
              setActiveTab('pending'); // Switch to pending to show the new/updated campaign
            } catch (error) {
              console.error('Error saving campaign:', error);
              alert(`Error saving campaign: ${error instanceof Error ? error.message : String(error)}`);
            }
          }}
        />
      )}
      
      {/* Add the Rejection Dialog */}
      {showRejectDialog && selectedCampaign && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-black border border-gray-800 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">Reject Campaign</h3>
            
            <p className="mb-4 text-gray-400">
              Rejecting campaign: <span className="font-medium text-white">{selectedCampaign.title}</span>
            </p>
            
            <div className="mb-4">
              <label className="block text-sm text-gray-400 mb-2">
                Reasons for Rejection <span className="text-red-500">*</span>
              </label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="w-full h-32 p-3 bg-black border border-gray-700 rounded-lg"
                placeholder="Provide detailed reasons why this campaign is being rejected..."
              />
              <p className="text-xs text-gray-500 mt-1">
                This feedback will be displayed to the brand to help them understand why their campaign was rejected.
              </p>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm text-gray-400 mb-2">
                Recommendations for Improvement <span className="text-red-500">*</span>
              </label>
              <textarea
                value={recommendations}
                onChange={(e) => setRecommendations(e.target.value)}
                className="w-full h-32 p-3 bg-black border border-gray-700 rounded-lg"
                placeholder="Provide specific recommendations for what the brand should fix..."
              />
              <p className="text-xs text-gray-500 mt-1">
                Specific recommendations help the brand make appropriate changes to resubmit their campaign.
              </p>
            </div>

            <div className="text-xs text-gray-400 mb-4 flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-yellow-500 flex-shrink-0 mt-0.5" />
              <p>Both reasons and recommendations are required for rejecting a campaign. This ensures brands receive clear feedback to improve their campaigns.</p>
            </div>
            
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowRejectDialog(false);
                  setRejectReason('');
                  setRecommendations('');
                  setSelectedCampaign(null);
                }}
                className="px-4 py-2 border border-gray-700 rounded-lg hover:bg-white/5"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReject}
                disabled={!rejectReason.trim() || !recommendations.trim() || loading}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg disabled:opacity-50 flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                    Processing...
                  </>
                ) : (
                  <>Confirm Rejection</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Campaign Details Modal */}
      {showCampaignDetails && selectedCampaign && (
        <AdminCampaignDetails
          campaign={selectedCampaign}
          onClose={() => {
            setShowCampaignDetails(false);
            setSelectedCampaign(null);
          }}
          onApprove={selectedCampaign.status !== 'active' ? onApprove : undefined}
          onReject={selectedCampaign.status !== 'active' ? onReject : undefined}
        />
      )}

      {/* Complete Campaign Dialog */}
      {showCompleteDialog && selectedCampaign && (
        <Dialog
          isOpen={showCompleteDialog}
          onClose={() => !loading && setShowCompleteDialog(false)}
          title={`Complete Campaign: ${selectedCampaign.title}`}
        >
          <div className="space-y-4">
            <div className="p-3 bg-blue-900/10 border border-blue-800 rounded-lg mb-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-300">
                    Completing this campaign will:
                  </p>
                  <ul className="list-disc pl-5 mt-2 text-sm text-gray-300 space-y-1">
                    <li>Move it from "Active" to "Completed" status</li>
                    <li>Prevent any new creator sign-ups or submissions</li>
                    <li>Allow processing of any remaining payouts</li>
                    <li>Generate a final campaign report</li>
                  </ul>
                </div>
              </div>
            </div>
            
            <p>Please provide a reason for completing this campaign early:</p>
            <Input
              value={completeReason}
              onChange={(e) => setCompleteReason(e.target.value)}
              placeholder="Reason for completing..."
              disabled={loading}
            />
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowCompleteDialog(false)}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmComplete}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center gap-2"
                disabled={!completeReason.trim() || loading}
              >
                {loading ? <Spinner size="sm" /> : <CheckCircle className="h-4 w-4" />}
                {loading ? 'Completing...' : 'Confirm Completion'}
              </button>
            </div>
          </div>
        </Dialog>
      )}
    </div>
  );
};

export default CampaignApprovalList;