import React, { useState } from 'react';
import { X, Check, AlertCircle, Calendar, Eye, DollarSign, FileText, Info, Plus, Trash2, Globe, Users, TrendingUp } from 'lucide-react';
import { formatMoney } from '@/utils/format';
import type { Campaign } from '@/types/brand';

interface CampaignApprovalModalProps {
  campaign: Campaign;
  onClose: () => void;
  onApprove: (campaign: Campaign, notes?: string) => void;
  onReject: (campaign: Campaign, reason: string) => void;
}

const CampaignApprovalModal: React.FC<CampaignApprovalModalProps> = ({
  campaign,
  onClose,
  onApprove,
  onReject
}) => {
  const [rejectReason, setRejectReason] = useState('');
  const [recommendations, setRecommendations] = useState('');
  const [approvalNotes, setApprovalNotes] = useState('');
  const [showRejectDialog, setShowRejectDialog] = useState(false);

  // Function to handle rejection with both reason and recommendations
  const handleReject = () => {
    if (rejectReason.trim()) {
      // Combine both rejection reason and recommendations in a structured format
      const rejectionFeedback = JSON.stringify({
        reasons: rejectReason.trim(),
        recommendations: recommendations.trim()
      });
      onReject(campaign, rejectionFeedback);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-80 backdrop-blur-sm flex items-center justify-center p-4 z-50"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="campaign-title"
    >
      <div
        className="bg-black/40 border border-gray-800 rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 hover:bg-white/10 rounded-full"
        >
          <X className="h-6 w-6" />
        </button>

        <h2 id="campaign-title" className="text-2xl font-bold mb-6 text-white">{campaign.title}</h2>

        <div className="space-y-8">
          {/* Campaign Status */}
          <div className="flex items-center gap-2 mb-3">
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
              campaign.status === 'active' ? 'bg-green-900/20 text-green-400' :
              campaign.status === 'draft' ? 'bg-gray-900/20 text-gray-400' :
              campaign.status === 'pending-approval' ? 'bg-yellow-900/20 text-yellow-400' :
              'bg-gray-900/20 text-gray-400'
            }`}>
              {campaign.status.toUpperCase()}
            </span>
          </div>

          {/* Campaign Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-black/20 border border-gray-700 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="h-5 w-5 text-green-400" />
                <h4 className="font-medium">Budget</h4>
              </div>
              <p className="text-2xl font-bold">${formatMoney(campaign.budget)}</p>
              {campaign.status === 'active' && (
                <p className="text-sm text-gray-400">${formatMoney(campaign.spent)} spent</p>
              )}
            </div>
            
            <div className="p-4 bg-black/20 border border-gray-700 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Users className="h-5 w-5 text-blue-400" />
                <h4 className="font-medium">Creators</h4>
              </div>
              <p className="text-2xl font-bold">{campaign.creatorCount}</p>
              <p className="text-sm text-gray-400">Active participants</p>
            </div>
            
            <div className="p-4 bg-black/20 border border-gray-700 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-5 w-5 text-purple-400" />
                <h4 className="font-medium">Views</h4>
              </div>
              <p className="text-2xl font-bold">{campaign.views?.toLocaleString() || '0'}</p>
              {campaign.engagement && (
                <p className="text-sm text-gray-400">{((campaign.engagement / campaign.views) * 100).toFixed(1)}% engagement</p>
              )}
            </div>
          </div>

          {/* Campaign Details */}
          <div className="p-6 bg-black/40 border border-gray-800 rounded-lg">
            <h3 className="text-lg font-bold mb-4">Campaign Details</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Campaign Title</label>
                <p className="font-medium">{campaign.title}</p>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">Content Type</label>
                <p className="font-medium capitalize">{campaign.contentType}</p>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">Platforms</label>
                <div className="flex flex-wrap gap-2">
                  {campaign.requirements.platforms.map((platform) => (
                    <span
                      key={platform}
                      className="px-3 py-1 bg-black/40 border border-gray-700 rounded-lg text-sm"
                    >
                      {platform}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">Campaign Duration</label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-400">Start Date</p>
                    <p className="font-medium">{new Date(campaign.startDate).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">End Date</p>
                    <p className="font-medium">{new Date(campaign.endDate).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">Budget & Rates</label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-400">Campaign Budget</p>
                    <p className="font-medium">${formatMoney(campaign.budget)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Minimum Views</p>
                    <p className="font-medium">{campaign.requirements.minViewsForPayout}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Campaign Requirements */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(campaign.contentType === 'original' || campaign.contentType === 'both') && campaign.brief?.original && (
              <div className="p-4 bg-black/40 border border-gray-800 rounded-lg">
                <h4 className="font-medium text-green-400 mb-3">Original Content</h4>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-400 mb-2">Brief</p>
                    <p className="text-gray-300">{campaign.brief?.original || 'No brief provided'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400 mb-2">Guidelines</p>
                    <ul className="list-disc pl-5 space-y-2">
                      {campaign.requirements.contentGuidelines.map((guideline, index) => (
                        <li key={index} className="text-gray-300">{guideline}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400 mb-1">Required Hashtag</p>
                    <div className="p-3 bg-green-900/10 border border-green-500 rounded-lg">
                      <p className="font-bold text-green-400">{campaign.requirements.hashtags?.original || '#BrandAd'}</p>
                      <p className="text-xs text-gray-400 mt-1">Posts without this exact hashtag will be ineligible for payment</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400 mb-1">Payout Rate</p>
                    <p className="font-bold text-green-400">{campaign.requirements.payoutRate.original}</p>
                    <p className="text-xs text-gray-500">per 1M views</p>
                  </div>
                </div>
              </div>
            )}
            
            {(campaign.contentType === 'repurposed' || campaign.contentType === 'both') && campaign.brief?.repurposed && (
              <div className="p-4 bg-black/40 border border-gray-800 rounded-lg">
                <h4 className="font-medium text-blue-400 mb-3">Repurposed Content</h4>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-400 mb-2">Brief</p>
                    <p className="text-gray-300">{campaign.brief?.repurposed || 'No brief provided'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400 mb-2">Guidelines</p>
                    <ul className="list-disc pl-5 space-y-2">
                      {campaign.requirements.contentGuidelines.map((guideline, index) => (
                        <li key={index} className="text-gray-300">{guideline}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400 mb-1">Required Hashtag</p>
                    <div className="p-3 bg-blue-900/10 border border-blue-500 rounded-lg">
                      <p className="font-bold text-blue-400">{campaign.requirements.hashtags?.repurposed || '#BrandPartner'}</p>
                      <p className="text-xs text-gray-400 mt-1">Posts without this exact hashtag will be ineligible for payment</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400 mb-1">Payout Rate</p>
                    <p className="font-bold text-blue-400">{campaign.requirements.payoutRate.repurposed}</p>
                    <p className="text-xs text-gray-500">per 1M views</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Campaign Guidelines */}
          <div className="p-6 bg-black/40 border border-gray-800 rounded-lg">
            <h3 className="text-lg font-bold mb-4">Content Guidelines</h3>
            <div className="space-y-4">
              {(campaign.contentType === 'original' || campaign.contentType === 'both') && (
                <div>
                  <h4 className="font-medium text-green-400 mb-3">Original Content Guidelines</h4>
                  <ul className="list-disc pl-5 space-y-2">
                    {campaign.requirements.contentGuidelines.map((guideline, index) => (
                      <li key={index} className="text-gray-300">{guideline}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              {(campaign.contentType === 'repurposed' || campaign.contentType === 'both') && (
                <div>
                  <h4 className="font-medium text-blue-400 mb-3">Repurposed Content Guidelines</h4>
                  <ul className="list-disc pl-5 space-y-2">
                    {campaign.requirements.contentGuidelines.map((guideline, index) => (
                      <li key={index} className="text-gray-300">{guideline}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* Campaign Assets */}
          {campaign.requirements.files && campaign.requirements.files.length > 0 && (
            <div className="p-4 bg-black/20 border border-gray-700 rounded-lg">
              <div className="flex items-center gap-2 mb-4">
                <FileText className="h-5 w-5 text-blue-400" />
                <h4 className="font-medium">Campaign Assets</h4>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {campaign.requirements.files.map((file, index) => (
                  <a
                    key={index}
                    href={file.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-3 bg-black/40 border border-gray-800 rounded-lg hover:border-gray-600 transition-colors flex items-center gap-3"
                  >
                    <div className="p-2 bg-gray-800 rounded">
                      <FileText className="h-4 w-4 text-gray-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{file.name}</p>
                      <p className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(1)} MB</p>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Additional Requirements */}
          <div className="p-4 bg-black/20 border border-gray-700 rounded-lg">
            <div className="flex items-center gap-2 mb-4">
              <Info className="h-5 w-5 text-purple-400" />
              <h4 className="font-medium">Additional Requirements</h4>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-400">Minimum Views</p>
                <p className="font-medium">{campaign.requirements.minViewsForPayout}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Total Budget</p>
                <p className="font-medium">{campaign.requirements.totalBudget}</p>
              </div>
            </div>
          </div>

          {/* Approval/Rejection Actions */}
          <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-gray-800">
            {campaign.status !== 'active' && (
              <button
                onClick={() => setShowRejectDialog(true)}
                className="px-4 py-2 border border-red-500 text-red-400 rounded-lg hover:bg-red-900/20"
              >
                Reject Campaign
              </button>
            )}
            
            <div className="flex-1 max-w-md">
              <input
                type="text"
                value={approvalNotes}
                onChange={(e) => setApprovalNotes(e.target.value)}
                placeholder="Optional approval notes..."
                className="w-full px-4 py-2 bg-black/20 border border-gray-700 rounded-lg"
              />
            </div>
            
            {campaign.status !== 'active' && (
              <button
                onClick={() => onApprove(campaign, approvalNotes)}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg flex items-center gap-2"
              >
                <Check className="h-4 w-4" />
                Approve Campaign
              </button>
            )}
          </div>

          {/* Reject Dialog */}
          {showRejectDialog && (
            <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
              <div className="bg-black border border-gray-800 rounded-lg p-6 w-full max-w-md">
                <h3 className="text-xl font-bold mb-4">Reject Campaign</h3>
                
                <div className="mb-4">
                  <label className="block text-sm text-gray-400 mb-2">
                    Reasons for Rejection
                  </label>
                  <textarea
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    className="w-full h-32 p-3 bg-black border border-gray-700 rounded-lg"
                    placeholder="Provide detailed reasons why this campaign is being rejected..."
                  />
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm text-gray-400 mb-2">
                    Recommendations for Improvement
                  </label>
                  <textarea
                    value={recommendations}
                    onChange={(e) => setRecommendations(e.target.value)}
                    className="w-full h-32 p-3 bg-black border border-gray-700 rounded-lg"
                    placeholder="Provide specific recommendations for what the brand should fix..."
                  />
                </div>
                
                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => setShowRejectDialog(false)}
                    className="px-4 py-2 border border-gray-700 rounded-lg hover:bg-white/5"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleReject}
                    disabled={!rejectReason.trim()}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg disabled:opacity-50"
                  >
                    Confirm Rejection
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CampaignApprovalModal;