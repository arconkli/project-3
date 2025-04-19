import React from 'react';
import { X, Calendar, DollarSign, Eye } from 'lucide-react';
import type { Campaign } from './types';
import { formatNumber } from '@/utils/format';
import { motion } from 'framer-motion';

interface ActiveCampaignDetailModalProps {
  campaign: Campaign;
  onClose: () => void;
}

const ActiveCampaignDetailModal: React.FC<ActiveCampaignDetailModalProps> = ({ campaign, onClose }) => {
  // Group posts by platform to show stats
  const platformStats = React.useMemo(() => {
    if (!campaign.posts) return {};
    
    const stats: Record<string, { posts: number, views: number, earned: number }> = {};
    
    campaign.posts.forEach(post => {
      if (!stats[post.platform]) {
        stats[post.platform] = { posts: 0, views: 0, earned: 0 };
      }
      stats[post.platform].posts += 1;
      stats[post.platform].views += parseInt(post.views.replace(/[^0-9]/g, '')) || 0;
      stats[post.platform].earned += post.earned;
    });
    
    return stats;
  }, [campaign.posts]);

  return (
    <div
      className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-80 backdrop-blur-sm z-50 p-6"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <motion.div
        className="bg-black/40 border border-gray-800 rounded-lg p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
      >
        <button
          className="absolute top-4 right-4 p-2"
          onClick={onClose}
          aria-label="Close details"
        >
          <X className="h-6 w-6" />
        </button>

        <div className="flex justify-between items-start mb-6">
          <h2 className="text-2xl font-bold text-white">{campaign.title}</h2>
          <span className="px-3 py-1 rounded-full bg-green-900/20 text-green-400 text-sm font-medium">
            ACTIVE
          </span>
        </div>

        {/* Campaign Details Section */}
        <div className="space-y-6 mb-8">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-400">Content Type</p>
              <p className="text-lg font-medium capitalize text-white">
                {campaign.contentType === 'both' 
                  ? 'Original & Repurposed' 
                  : campaign.contentType === 'original' 
                    ? 'Original Content' 
                    : 'Repurposed Content'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-400">End Date</p>
              <p className="text-lg font-medium text-white">{new Date(campaign.endDate).toLocaleDateString()}</p>
            </div>
            <div>
              <p className="text-sm text-gray-400">Brand</p>
              <p className="text-lg font-medium text-white">{campaign.brand}</p>
            </div>
            <div>
              <p className="text-sm text-gray-400">Campaign Status</p>
              <p className="text-lg font-medium text-green-400">Active</p>
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-medium mb-2 text-white">Campaign Brief</h3>
            {campaign.brief?.original && (
              <div className="mb-3">
                <p className="text-green-400 font-medium">Original Content:</p>
                <p className="text-gray-300 mt-1">{campaign.brief.original}</p>
              </div>
            )}
            {campaign.brief?.repurposed && (
              <div>
                <p className="text-blue-400 font-medium">Repurposed Content:</p>
                <p className="text-gray-300 mt-1">{campaign.brief.repurposed}</p>
              </div>
            )}
          </div>

          <div>
            <h3 className="text-lg font-medium mb-2 text-white">Content Requirements</h3>
            <ul className="list-disc pl-5 space-y-2 text-gray-300">
              {campaign.requirements.contentGuidelines.map((guideline, i) => (
                <li key={i}>{guideline}</li>
              ))}
            </ul>
          </div>
        </div>

        {/* Performance Stats */}
        <div className="mb-8">
          <h3 className="text-lg font-bold mb-4 text-white flex items-center gap-2">
            <span className="flex items-center justify-center p-1 rounded-full bg-purple-900/30">
              <svg className="h-4 w-4 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </span>
            Campaign Performance
          </h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-black/30 border border-gray-800 rounded-lg p-4">
              <p className="text-sm text-gray-400 mb-1">Total Earned</p>
              <div className="flex items-center">
                <DollarSign className="h-5 w-5 text-green-400 mr-1" />
                <p className="text-xl font-bold text-green-400">${campaign.earned || 0}</p>
              </div>
            </div>
            <div className="bg-black/30 border border-gray-800 rounded-lg p-4">
              <p className="text-sm text-gray-400 mb-1">Total Views</p>
              <div className="flex items-center">
                <Eye className="h-5 w-5 text-blue-400 mr-1" />
                <p className="text-xl font-bold text-blue-400">{formatNumber(campaign.views || 0)}</p>
              </div>
            </div>
            <div className="bg-black/30 border border-gray-800 rounded-lg p-4">
              <p className="text-sm text-gray-400 mb-1">Pending Payout</p>
              <div className="flex items-center">
                <DollarSign className="h-5 w-5 text-yellow-400 mr-1" />
                <p className="text-xl font-bold text-yellow-400">${campaign.pendingPayout || 0}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Connected Accounts Section */}
        <div className="mb-8">
          <h3 className="text-lg font-bold mb-4 text-white flex items-center gap-2">
            <span className="flex items-center justify-center p-1 rounded-full bg-green-900/30">
              <svg className="h-4 w-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </span>
            Connected Platforms
          </h3>
          <div className="flex flex-wrap gap-3 mb-2">
            {campaign.platforms?.map((platform) => (
              <div key={platform} className="bg-black/30 border border-gray-800 rounded-lg p-4 flex-1 min-w-[180px]">
                <div className="flex items-center gap-2 mb-3">
                  {platform === 'TikTok' && (
                    <span className="text-pink-400 text-lg font-medium flex items-center gap-1">
                      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M19.589 6.686a4.793 4.793 0 0 1-3.77-4.245V2h-3.445v13.672a2.896 2.896 0 0 1-5.201 1.743l-.002-.001.002.001a2.895 2.895 0 0 1 3.183-4.51v-3.5a6.329 6.329 0 0 0-5.394 10.692 6.33 6.33 0 0 0 10.857-4.424V8.687a8.182 8.182 0 0 0 4.773 1.526V6.79a4.831 4.831 0 0 1-1.003-.104z"/>
                      </svg>
                      TikTok
                    </span>
                  )}
                  {platform === 'Instagram' && (
                    <span className="text-purple-400 text-lg font-medium flex items-center gap-1">
                      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/>
                      </svg>
                      Instagram
                    </span>
                  )}
                  {platform === 'YouTube' && (
                    <span className="text-red-400 text-lg font-medium flex items-center gap-1">
                      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                      </svg>
                      YouTube
                    </span>
                  )}
                  {platform === 'Twitter' && (
                    <span className="text-blue-400 text-lg font-medium flex items-center gap-1">
                      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                      </svg>
                      Twitter
                    </span>
                  )}
                </div>
                
                {platformStats[platform] && (
                  <div className="grid grid-cols-3 gap-1 text-sm">
                    <div>
                      <p className="text-gray-400">Posts</p>
                      <p className="text-white font-medium">{platformStats[platform].posts || 0}</p>
                    </div>
                    <div>
                      <p className="text-gray-400">Views</p>
                      <p className="text-white font-medium">{formatNumber(platformStats[platform].views || 0)}</p>
                    </div>
                    <div>
                      <p className="text-gray-400">Earnings</p>
                      <p className="text-white font-medium">${platformStats[platform].earned || 0}</p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Eligible Content Section */}
        <div className="mb-6">
          <h3 className="text-lg font-bold mb-4 text-white flex items-center gap-2">
            <span className="flex items-center justify-center p-1 rounded-full bg-blue-900/30">
              <svg className="h-4 w-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </span>
            Eligible Content
          </h3>
          {campaign.posts && campaign.posts.length > 0 ? (
            <div className="space-y-3">
              {campaign.posts.map((post, index) => (
                <div key={index} className="bg-black/30 border border-gray-800 rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                      {post.platform === 'TikTok' && (
                        <span className="text-pink-400 flex items-center gap-1">
                          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M19.589 6.686a4.793 4.793 0 0 1-3.77-4.245V2h-3.445v13.672a2.896 2.896 0 0 1-5.201 1.743l-.002-.001.002.001a2.895 2.895 0 0 1 3.183-4.51v-3.5a6.329 6.329 0 0 0-5.394 10.692 6.33 6.33 0 0 0 10.857-4.424V8.687a8.182 8.182 0 0 0 4.773 1.526V6.79a4.831 4.831 0 0 1-1.003-.104z"/>
                          </svg>
                        </span>
                      )}
                      {post.platform === 'Instagram' && (
                        <span className="text-purple-400 flex items-center gap-1">
                          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/>
                          </svg>
                        </span>
                      )}
                      {post.platform === 'YouTube' && (
                        <span className="text-red-400 flex items-center gap-1">
                          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                          </svg>
                        </span>
                      )}
                      <span className="font-medium text-white">{post.platform}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-gray-800 text-gray-300">
                        {post.contentType}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-400">{post.views} views</span>
                      <span className={`text-sm px-2 py-0.5 rounded-full ${
                        post.status === 'approved' 
                          ? 'bg-green-900/20 text-green-400' 
                          : 'bg-yellow-900/20 text-yellow-400'
                      }`}>
                        {post.status}
                      </span>
                    </div>
                  </div>
                  <div className="mt-2 text-sm text-gray-400">
                    <p>Posted: <time dateTime={post.postDate}>{new Date(post.postDate).toLocaleDateString()}</time></p>
                    <div className="flex items-center mt-1">
                      <DollarSign className="h-4 w-4 text-green-400 mr-1" />
                      <p>Earned: ${post.earned}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-black/30 border border-gray-800 rounded-lg p-4 text-center">
              <p className="text-gray-400">No eligible content found yet.</p>
              <p className="text-sm text-gray-500 mt-2">Content is automatically detected and will appear here once found.</p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default ActiveCampaignDetailModal; 