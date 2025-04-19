import React, { useState, useEffect } from 'react';
import { Check, X, Eye, Calendar, DollarSign, Info, AlertTriangle, ArrowRight, CheckCircle, EyeOff, ChevronDown, ChevronUp } from 'lucide-react';
import { formatMoney } from '@/utils/format';

interface CampaignEditReviewProps {
  campaign: {
    id: string;
    campaign_id: string;
    title: string;
    oldData: any;
    newData: any;
    changeReason: string;
    requestedBy: {
      name: string;
      email: string;
      company: string;
    };
    requestedAt: string;
    keyChanges?: string[]; // Fields that have changed
  };
  onApprove: (id: string, notes?: string) => void;
  onReject: (id: string, reason: string) => void;
}

const CampaignEditReview: React.FC<CampaignEditReviewProps> = ({
  campaign,
  onApprove,
  onReject
}) => {
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [approvalNotes, setApprovalNotes] = useState('');
  const [showDebugInfo, setShowDebugInfo] = useState(false);
  const [showFullDetails, setShowFullDetails] = useState(false);

  // Debug the received data
  useEffect(() => {
    console.log('CampaignEditReview received data:', {
      id: campaign.id,
      campaignId: campaign.campaign_id,
      hasOldData: !!campaign.oldData,
      oldDataFields: campaign.oldData ? Object.keys(campaign.oldData) : [],
      hasNewData: !!campaign.newData,
      newDataFields: campaign.newData ? Object.keys(campaign.newData) : [],
      platforms: {
        old: campaign.oldData?.platforms || campaign.oldData?.requirements?.platforms || [],
        new: campaign.newData?.platforms || campaign.newData?.requirements?.platforms || []
      },
      guidelines: {
        old: campaign.oldData?.contentGuidelines || campaign.oldData?.requirements?.contentGuidelines || [],
        new: campaign.newData?.contentGuidelines || campaign.newData?.requirements?.contentGuidelines || []
      },
      keyChanges: campaign.keyChanges || []
    });
  }, [campaign]);

  // Get the platform list from newData for display
  const getPlatforms = () => {
    const platformList = campaign.newData?.platforms || 
                         campaign.newData?.requirements?.platforms || 
                         [];
    return platformList;
  };

  // Get content guidelines separated by type
  const getContentGuidelinesByType = () => {
    const guidelines = campaign.newData?.contentGuidelines || 
                       campaign.newData?.requirements?.contentGuidelines || {};
    
    if (Array.isArray(guidelines)) return { original: guidelines, repurposed: [] };
    if (guidelines?.original || guidelines?.repurposed) {
      return {
        original: Array.isArray(guidelines.original) ? guidelines.original : guidelines.original ? [guidelines.original] : [],
        repurposed: Array.isArray(guidelines.repurposed) ? guidelines.repurposed : guidelines.repurposed ? [guidelines.repurposed] : []
      };
    }
    return { original: [], repurposed: [] };
  };

  // Get hashtags from newData for display
  const getHashtags = () => {
    const hashtags = campaign.newData?.hashtags || 
                     campaign.newData?.requirements?.hashtags || {};
    
    if (typeof hashtags === 'string') return { original: [hashtags], repurposed: [] };
    if (Array.isArray(hashtags)) return { original: hashtags, repurposed: [] };
    if (hashtags?.original || hashtags?.repurposed) {
      return {
        original: Array.isArray(hashtags.original) ? hashtags.original : hashtags.original ? [hashtags.original] : [],
        repurposed: Array.isArray(hashtags.repurposed) ? hashtags.repurposed : hashtags.repurposed ? [hashtags.repurposed] : []
      };
    }
    return { original: [], repurposed: [] };
  };

  // Get minimum views for payout
  const getMinViews = () => {
    return campaign.newData?.minViewsForPayout || 
           campaign.newData?.requirements?.minViewsForPayout || 
           "Not specified";
  };
  
  // Get total budget if available
  const getTotalBudget = () => {
    return campaign.newData?.totalBudget || 
           campaign.newData?.requirements?.totalBudget || 
           campaign.newData?.budget || 
           0;
  };

  // Render a standalone view of the complete campaign - styled to match pending approval view
  const renderCampaignPreview = () => {
    const newData = campaign.newData;
    if (!newData) return null;

    // Get all values we might need to display
    const platforms = getPlatforms();
    const guidelines = Array.isArray(newData.contentGuidelines) 
      ? newData.contentGuidelines 
      : newData.requirements?.contentGuidelines && Array.isArray(newData.requirements.contentGuidelines) 
        ? newData.requirements.contentGuidelines 
        : [];
    const hashtags = [];
    
    // Get hashtags (in whatever format they may exist)
    const hashtagData = newData.hashtags || newData.requirements?.hashtags;
    if (typeof hashtagData === 'string') {
      hashtags.push(hashtagData);
    } else if (Array.isArray(hashtagData)) {
      hashtags.push(...hashtagData);
    } else if (hashtagData && typeof hashtagData === 'object') {
      // Handle both original and repurposed hashtags
      if (hashtagData.original) {
        if (Array.isArray(hashtagData.original)) {
          hashtags.push(...hashtagData.original);
        } else {
          hashtags.push(hashtagData.original);
        }
      }
      if (hashtagData.repurposed) {
        if (Array.isArray(hashtagData.repurposed)) {
          hashtags.push(...hashtagData.repurposed);
        } else {
          hashtags.push(hashtagData.repurposed);
        }
      }
    }

    const brandName = newData.brand?.name || campaign.requestedBy?.company || 'Unknown Brand';
    const payout = newData.budget || 
                  (newData.requirements?.payoutRate?.original) || 0;

    return (
      <div className="bg-gray-900 rounded-lg overflow-hidden border border-gray-800">
        {/* Campaign Header */}
        <div className="p-4 bg-black/20 border-b border-gray-800">
          <div className="flex justify-between">
            <div>
              <h3 className="text-lg font-bold text-white">{newData.title}</h3>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-sm text-gray-400">by {brandName}</span>
                <span className="px-2 py-0.5 bg-green-900/20 text-green-400 rounded-full text-xs">
                  {newData.status?.toUpperCase() || 'ACTIVE'}
                </span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-white font-bold">${formatMoney(payout)}</p>
              <p className="text-xs text-gray-400">per post</p>
            </div>
          </div>
        </div>
        
        {/* Campaign Details */}
        <div className="p-4">
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <p className="text-xs uppercase text-gray-500 mb-1">Content Type</p>
              <p className="text-white">{newData.content_type || 'Not specified'}</p>
            </div>
            <div>
              <p className="text-xs uppercase text-gray-500 mb-1">Campaign Period</p>
              <div className="flex items-center">
                <Calendar className="h-4 w-4 text-gray-500 mr-2" />
                <span className="text-white text-sm">
                  {newData.start_date ? new Date(newData.start_date).toLocaleDateString() : 'N/A'} - 
                  {newData.end_date ? new Date(newData.end_date).toLocaleDateString() : 'N/A'}
                </span>
              </div>
            </div>
          </div>
          
          <div className="mb-4">
            <p className="text-xs uppercase text-gray-500 mb-1">Platforms</p>
            <div className="flex flex-wrap gap-2">
              {platforms.length > 0 ? (
                platforms.map((platform, index) => (
                  <span 
                    key={index} 
                    className="px-2 py-1 bg-gray-800 text-gray-300 border border-gray-700 rounded-full text-sm"
                  >
                    {platform}
                  </span>
                ))
              ) : (
                <span className="text-gray-400">No platforms specified</span>
              )}
            </div>
          </div>
          
          {hashtags.length > 0 && (
            <div className="mb-4">
              <p className="text-xs uppercase text-gray-500 mb-1">Required Hashtags</p>
              <div className="flex flex-wrap gap-2">
                {hashtags.map((tag, index) => (
                  <span key={index} className="text-gray-300 text-sm">
                    {tag.startsWith('#') ? tag : `#${tag}`}
                  </span>
                ))}
              </div>
            </div>
          )}
          
          {guidelines.length > 0 && (
            <div className="mb-4">
              <p className="text-xs uppercase text-gray-500 mb-1">Content Guidelines</p>
              <ul className="list-disc pl-5 text-gray-300 text-sm space-y-1">
                {guidelines.map((guideline, index) => (
                  <li key={index}>{guideline}</li>
                ))}
              </ul>
            </div>
          )}
          
          {newData.brief?.original && (
            <div className="mb-4">
              <p className="text-xs uppercase text-gray-500 mb-1">Campaign Brief</p>
              <p className="text-gray-300 text-sm whitespace-pre-line">
                {newData.brief.original}
              </p>
            </div>
          )}
          
          <div className="mt-4 pt-4 border-t border-gray-800">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs uppercase text-gray-500 mb-1">Payment</p>
                <p className="text-white font-medium">${formatMoney(payout)}</p>
              </div>
              
              {newData.requirements?.minViewsForPayout && (
                <div>
                  <p className="text-xs uppercase text-gray-500 mb-1">Minimum Views</p>
                  <p className="text-white font-medium">{newData.requirements.minViewsForPayout}</p>
                </div>
              )}
              
              {newData.requirements?.payoutRate?.repurposed && (
                <div>
                  <p className="text-xs uppercase text-gray-500 mb-1">Repurposed Content</p>
                  <p className="text-white font-medium">${newData.requirements.payoutRate.repurposed}</p>
                </div>
              )}
              
              {newData.totalBudget && (
                <div>
                  <p className="text-xs uppercase text-gray-500 mb-1">Total Budget</p>
                  <p className="text-white font-medium">${formatMoney(newData.totalBudget)}</p>
                </div>
              )}
            </div>
          </div>
          
          {/* Simple campaign ID and info at bottom */}
          <div className="mt-4 pt-4 border-t border-gray-800 text-xs text-gray-500">
            <p>Campaign ID: {newData.id || campaign.campaign_id}</p>
            <p>Last Updated: {newData.updated_at ? new Date(newData.updated_at).toLocaleString() : new Date().toLocaleString()}</p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="p-6 bg-black/40 border border-gray-800 rounded-lg">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h3 className="text-xl font-bold text-white">{campaign.title}</h3>
          <div className="flex flex-wrap gap-2 items-center mt-1">
            <span className="text-sm text-gray-400">
              Edit requested by {campaign.requestedBy.name}
            </span>
            <span className="text-xs px-2 py-0.5 bg-black/30 border border-gray-700 rounded-full">
              {campaign.requestedBy.company}
            </span>
            <span className="text-xs text-gray-500">
              {new Date(campaign.requestedAt).toLocaleString()}
            </span>
          </div>
        </div>
      </div>
      
      {/* Debug Toggle */}
      <div className="flex justify-end mb-4">
        <button 
          onClick={() => setShowDebugInfo(!showDebugInfo)}
          className="text-xs text-gray-500 underline"
        >
          {showDebugInfo ? 'Hide' : 'Show'} Debug Info
        </button>
      </div>
      
      {showDebugInfo && (
        <div className="p-3 bg-black/50 border border-gray-700 rounded mb-4 overflow-auto">
          <h4 className="text-sm font-medium text-gray-400 mb-2">Debug Information</h4>
          <div className="text-xs">
            <div className="mb-2">
              <p className="text-gray-400">Old Data Fields: {Object.keys(campaign.oldData).join(', ')}</p>
              <p className="text-gray-400">New Data Fields: {Object.keys(campaign.newData).join(', ')}</p>
              <p className="text-gray-400">Key Changes: {campaign.keyChanges?.join(', ') || 'None specified'}</p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <p className="text-gray-400 font-medium">Old Platforms:</p>
                <pre className="bg-black/30 p-1 rounded">{JSON.stringify(campaign.oldData.platforms || campaign.oldData.requirements?.platforms || [], null, 2)}</pre>
              </div>
              <div>
                <p className="text-gray-400 font-medium">New Platforms:</p>
                <pre className="bg-black/30 p-1 rounded">{JSON.stringify(campaign.newData.platforms || campaign.newData.requirements?.platforms || [], null, 2)}</pre>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Campaign Preview Section */}
      <div className="space-y-6">
        {renderCampaignPreview()}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between gap-4 pt-4 mt-6 border-t border-gray-800">
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
          <button
            onClick={() => setShowRejectDialog(true)}
            className="px-4 py-2 border border-red-500 text-red-400 rounded-lg hover:bg-red-900/20 flex items-center gap-2"
          >
            <X className="h-4 w-4" />
            Reject Changes
          </button>
          
          <button
            onClick={() => onApprove(campaign.id, approvalNotes)}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg flex items-center gap-2"
          >
            <Check className="h-4 w-4" />
            Approve Changes
          </button>
        </div>
      </div>

      {/* Reject Confirmation Dialog */}
      {showRejectDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4">
          <div className="max-w-lg w-full p-6 bg-black/90 border border-gray-800 rounded-lg">
            <h4 className="text-lg font-bold mb-4">Reject Campaign Changes</h4>
            <p className="text-gray-300 mb-4">
              Please provide a reason for rejecting these changes. This will be shared with the brand.
            </p>
            
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Reason for rejection..."
              className="w-full p-3 bg-black/40 border border-gray-700 rounded-lg focus:border-red-500 focus:outline-none text-white mb-4"
              rows={4}
            />
            
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowRejectDialog(false)}
                className="px-4 py-2 border border-gray-700 rounded-lg hover:bg-white/5"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (rejectReason.trim()) {
                    onReject(campaign.id, rejectReason);
                    setShowRejectDialog(false);
                  }
                }}
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

export default CampaignEditReview;