import React, { useState } from 'react';
import { Search, Filter } from 'lucide-react';
import AdminContentReview from './AdminContentReview';
import type { ContentReview } from '@/types/admin';
import { motion, AnimatePresence } from 'framer-motion';

interface ContentReviewListProps {
  reviews: ContentReview[];
  onAction: (action: string, reviewId: string, notes?: string) => void;
}

const ContentReviewList: React.FC<ContentReviewListProps> = ({ reviews, onAction }) => {
  const [platform, setPlatform] = useState('all');
  const [status, setStatus] = useState('all');
  const [priority, setPriority] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentReviewIndex, setCurrentReviewIndex] = useState(0);

  const filteredReviews = reviews.filter(review => {
    const matchesPlatform = platform === 'all' || review.platform.toLowerCase() === platform;
    const matchesStatus = status === 'all' || review.status === status;
    const matchesPriority = priority === 'all' || review.review_priority === priority;
    const matchesSearch = searchTerm === '' || 
      review.post_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      review.campaign_id.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesPlatform && matchesStatus && matchesPriority && matchesSearch;
  });

  const handleReviewAction = (action: string, reviewId: string, notes?: string) => {
    onAction(action, reviewId, notes);
    // Move to next review if available
    if (currentReviewIndex < filteredReviews.length - 1) {
      setCurrentReviewIndex(currentReviewIndex + 1);
    }
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-wrap gap-3 p-4 bg-black/40 border border-gray-800 rounded-lg">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search reviews..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-black/40 border border-gray-700 rounded-lg"
          />
        </div>
        
        <select
          value={platform}
          onChange={(e) => setPlatform(e.target.value)}
          className="px-3 py-2 bg-black/40 border border-gray-700 rounded-lg"
        >
          <option value="all">All Platforms</option>
          <option value="tiktok">TikTok</option>
          <option value="instagram">Instagram</option>
          <option value="youtube">YouTube</option>
          <option value="twitter">X/Twitter</option>
        </select>
        
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="px-3 py-2 bg-black/40 border border-gray-700 rounded-lg"
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
        
        <select
          value={priority}
          onChange={(e) => setPriority(e.target.value)}
          className="px-3 py-2 bg-black/40 border border-gray-700 rounded-lg"
        >
          <option value="all">All Priority</option>
          <option value="urgent">Urgent</option>
          <option value="high">High</option>
          <option value="normal">Normal</option>
          <option value="low">Low</option>
        </select>
      </div>

      {/* Reviews List */}
      <div className="min-h-[80vh] relative">
        <AnimatePresence mode="wait">
          {filteredReviews[currentReviewIndex] && (
            <motion.div
              key={filteredReviews[currentReviewIndex].id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="absolute inset-0"
            >
              <AdminContentReview
                review={{
                  id: filteredReviews[currentReviewIndex].id,
                  platform: filteredReviews[currentReviewIndex].platform,
                  contentType: filteredReviews[currentReviewIndex].contentType,
                  creator: {
                    name: `Creator ${filteredReviews[currentReviewIndex].creator_id}`,
                    username: `creator.${filteredReviews[currentReviewIndex].creator_id}`,
                    verificationLevel: 'verified'
                  },
                  campaign: {
                    title: `Campaign ${filteredReviews[currentReviewIndex].campaign_id}`,
                    brand: 'Brand Name',
                    brief: 'Campaign brief goes here',
                    hashtags: ['#ad', '#sponsored'],
                    guidelines: ['Follow brand guidelines', 'Include product showcase']
                  },
                  metrics: {
                    views: filteredReviews[currentReviewIndex].viewCount,
                    engagement: 5.2,
                    watchTime: 45,
                    completionRate: 78
                  },
                  submittedAt: filteredReviews[currentReviewIndex].submittedAt,
                  status: filteredReviews[currentReviewIndex].status,
                  priority: filteredReviews[currentReviewIndex].review_priority || 'normal',
                  automatedChecks: {
                    hashtag: true,
                    disclosure: true,
                    safety: true,
                    quality: 8
                  },
                  flags: [],
                  notes: filteredReviews[currentReviewIndex].notes,
                  videoUrl: filteredReviews[currentReviewIndex].postUrl
                }}
                onAction={handleReviewAction}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Review Progress */}
        <div className="fixed bottom-6 right-6 bg-black/80 border border-gray-800 rounded-lg px-4 py-2">
          <p className="text-sm">
            Review {currentReviewIndex + 1} of {filteredReviews.length}
          </p>
        </div>
      </div>
    </div>
  );
};

export default ContentReviewList;