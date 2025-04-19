import React, { useState } from 'react';
import { Eye, Clock, TrendingUp, AlertTriangle, Check, X, Flag, MessageSquare, Info } from 'lucide-react';

interface AdminContentReviewProps {
  review: {
    id: string;
    platform: string;
    contentType: 'original' | 'repurposed';
    creator: {
      name: string;
      username: string;
      verificationLevel: string;
    };
    campaign: {
      title: string;
      brand: string;
      brief: string;
      hashtags: string[];
      guidelines: string[];
    };
    metrics: {
      views: number;
      engagement: number;
      watchTime: number;
      completionRate: number;
    };
    submittedAt: string;
    status: 'pending' | 'approved' | 'rejected';
    priority: 'low' | 'normal' | 'high' | 'urgent';
    automatedChecks: {
      hashtag: boolean;
      disclosure: boolean;
      safety: boolean;
      quality: number;
    };
    flags: {
      type: string;
      description: string;
    }[];
    notes?: string[];
    videoUrl: string;
  };
  onAction: (action: string, reviewId: string, notes?: string) => void;
}

const AdminContentReview: React.FC<AdminContentReviewProps> = ({ review, onAction }) => {
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [showQuickReject, setShowQuickReject] = useState(false);
  
  const quickRejectReasons = [
    'Content does not follow campaign guidelines',
    'Missing required hashtags',
    'Poor video/audio quality',
    'Inappropriate content',
    'Incorrect product placement',
    'Misleading messaging',
    'Brand safety concerns'
  ];

  const safeReview = {
    id: review.id,
    platform: review.platform || 'TikTok',
    contentType: review.contentType || 'original',
    creator: {
      name: review.creator?.name || '',
      username: review.creator?.username || '',
      verificationLevel: review.creator?.verificationLevel || ''
    },
    campaign: {
      title: review.campaign?.title || '',
      brand: review.campaign?.brand || '',
      brief: review.campaign?.brief || '',
      hashtags: review.campaign?.hashtags || [],
      guidelines: review.campaign?.guidelines || []
    },
    metrics: {
      views: review.metrics?.views || 0,
      engagement: review.metrics?.engagement || 0,
      watchTime: review.metrics?.watchTime || 0,
      completionRate: review.metrics?.completionRate || 0
    },
    submittedAt: review.submittedAt || '',
    status: review.status || 'pending',
    priority: review.priority || 'normal',
    automatedChecks: {
      hashtag: review.automatedChecks?.hashtag || false,
      disclosure: review.automatedChecks?.disclosure || false,
      safety: review.automatedChecks?.safety || false,
      quality: review.automatedChecks?.quality || 0
    },
    flags: review.flags || [],
    notes: Array.isArray(review.notes) ? review.notes : [],
    videoUrl: review.videoUrl || ''
  };

  const {
    id,
    platform,
    contentType,
    creator,
    campaign,
    metrics,
    submittedAt,
    status,
    priority,
    automatedChecks,
    flags,
    notes,
    videoUrl
  } = safeReview;

  const handleReject = () => {
    if (!rejectReason.trim()) return;
    onAction('reject', id, rejectReason);
    setRejectReason('');
    setShowRejectDialog(false);
    setShowQuickReject(false);
  };

  return (
    <div className="p-4 border border-gray-800 rounded-lg bg-black/40">
      <div className="p-4" role="group" aria-labelledby="content-review">
        {/* Two Column Layout */}
        <div className="grid grid-cols-2 gap-4">
          {/* Left Column: Video */}
          <div className="space-y-4">
            {/* Video Preview */}
            <div className="aspect-[9/16] bg-black/60 rounded-lg overflow-hidden relative">
              <iframe 
                src={videoUrl}
                className="absolute inset-0 w-full h-full"
                allowFullScreen
              />
            </div>
          </div>
          
          {/* Right Column: Stats and Checks */}
          <div className="flex flex-col h-full">
            {/* Platform & Content Type */}
            <div className="flex items-center gap-2">
              {/* Platform badge */}
              <span className={`px-2 py-0.5 text-xs rounded-full ${
                platform === 'TikTok' ? 'bg-cyan-900/20 text-cyan-400' :
                platform === 'Instagram' ? 'bg-pink-900/20 text-pink-400' :
                platform === 'YouTube' ? 'bg-red-900/20 text-red-400' :
                'bg-blue-900/20 text-blue-400'
              }`}>
                {platform}
              </span>
              {/* Content type badge */}
              <span className={`px-2 py-0.5 text-xs rounded-full ${
                contentType === 'original' ? 'bg-green-900/20 text-green-400' : 'bg-blue-900/20 text-blue-400'
              }`}>
                {contentType}
              </span>
              {/* Priority badge */}
              <span className={`px-2 py-0.5 text-xs rounded-full ${
                priority === 'urgent' ? 'bg-red-900/20 text-red-400' :
                priority === 'high' ? 'bg-orange-900/20 text-orange-400' :
                'bg-gray-900/20 text-gray-400'
              }`}>
                {priority}
              </span>
            </div>

            <div className="flex-1 space-y-4 mt-4">
              {/* Creator Info */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                <span className="font-medium">@{creator.username}</span>
                {creator.verificationLevel && (
                  <span className="px-2 py-0.5 bg-blue-900/20 text-blue-400 text-xs rounded-full">
                    {creator.verificationLevel}
                  </span>
                )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-400">Account Standing:</span>
                  <span className="px-2 py-0.5 bg-green-900/20 text-green-400 text-xs rounded-full">
                    Good
                  </span>
                </div>
              </div>

              {/* Key Metrics */}
              <div className="grid grid-cols-2 gap-2 mb-4">
                <div className="p-2 bg-black/20 border border-gray-700 rounded-lg">
                  <div className="flex items-center gap-1 text-sm text-gray-400">
                    <Eye className="h-4 w-4" />
                    <span>{metrics.views.toLocaleString()} views</span>
                  </div>
                </div>
                <div className="p-2 bg-black/20 border border-gray-700 rounded-lg">
                  <div className="flex items-center gap-1 text-sm text-gray-400">
                    <TrendingUp className="h-4 w-4" />
                    <span>{metrics.engagement}% engagement</span>
                  </div>
                </div>
              </div>

              {/* Engagement Metrics */}
              <div className="grid grid-cols-2 gap-2 mb-4">
                <div className="p-2 bg-black/20 border border-gray-700 rounded-lg">
                  <p className="text-sm text-gray-400 mb-1">Likes</p>
                  <p className="font-medium">124.5K</p>
                </div>
                <div className="p-2 bg-black/20 border border-gray-700 rounded-lg">
                  <p className="text-sm text-gray-400 mb-1">Comments</p>
                  <p className="font-medium">2.8K</p>
                </div>
                <div className="p-2 bg-black/20 border border-gray-700 rounded-lg">
                  <p className="text-sm text-gray-400 mb-1">Shares</p>
                  <p className="font-medium">15.2K</p>
                </div>
                <div className="p-2 bg-black/20 border border-gray-700 rounded-lg">
                  <p className="text-sm text-gray-400 mb-1">Watch Time</p>
                  <p className="font-medium">85%</p>
                </div>
              </div>

              {/* Creator Stats */}
              <div className="grid grid-cols-2 gap-2 mb-4">
                <div className="p-2 bg-black/20 border border-gray-700 rounded-lg">
                  <p className="text-sm text-gray-400 mb-1">Avg. Views</p>
                  <p className="font-medium">450K</p>
                </div>
                <div className="p-2 bg-black/20 border border-gray-700 rounded-lg">
                  <p className="text-sm text-gray-400 mb-1">Completion Rate</p>
                  <p className="font-medium">92%</p>
                </div>
              </div>

              {/* Disclosure Check */}
              <div className={`p-2 border rounded-lg w-full ${
                automatedChecks.disclosure ? 'border-green-500 bg-green-900/10' : 'border-red-500 bg-red-900/10'
              }`}>
                <span className={automatedChecks.disclosure ? 'text-green-400' : 'text-red-400'}>
                  {automatedChecks.disclosure ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
                  Disclosure
                </span>
              </div>

              {/* Action Buttons - Moved right below disclosure */}
              <div className="flex gap-1.5 mt-2">
                <button
                  onClick={() => onAction('approve', id)}
                  className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg flex items-center justify-center gap-2"
                >
                  <Check className="h-4 w-4" />
                  Approve
                </button>
                <button
                  onClick={() => setShowRejectDialog(true)}
                  className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg flex items-center justify-center gap-2 relative"
                  onMouseEnter={() => setShowQuickReject(true)}
                  onMouseLeave={() => setShowQuickReject(false)}
                >
                  <X className="h-4 w-4" />
                  Reject
                </button>
              </div>
            </div>
          </div>
        </div>

          {/* Quick Reject Menu */}
          {showQuickReject && (
            <div 
              className="absolute right-0 bottom-full mb-2 w-64 bg-black border border-gray-800 rounded-lg shadow-lg py-1 z-50"
              onMouseEnter={() => setShowQuickReject(true)}
              onMouseLeave={() => setShowQuickReject(false)}
            >
              {quickRejectReasons.map((reason, index) => (
                <button
                  key={index}
                  className="w-full px-4 py-2 text-left hover:bg-red-900/20 text-sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    setRejectReason(reason);
                    handleReject();
                  }}
                >
                  {reason}
                </button>
              ))}
              <div className="border-t border-gray-800 mt-1 pt-1">
                <button
                  className="w-full px-4 py-2 text-left hover:bg-red-900/20 text-sm text-red-400"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowQuickReject(false);
                    setShowRejectDialog(true);
                  }}
                >
                  Custom Reason...
                </button>
              </div>
            </div>
          )}
      </div>

      {/* Reject Dialog */}
      {showRejectDialog && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-black/40 border border-gray-800 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-bold mb-3">Reject Content</h3>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="w-full h-32 p-3 bg-black/40 border border-gray-700 rounded-lg mb-3"
              placeholder="Provide reason for rejection..."
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowRejectDialog(false)}
                className="px-4 py-2 border border-gray-700 rounded-lg hover:bg-white/5"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg"
                disabled={!rejectReason.trim()}
              >
                Confirm Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminContentReview;