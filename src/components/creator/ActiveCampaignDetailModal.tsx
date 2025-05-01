import React from 'react';
import {
  X, Calendar, DollarSign, Eye, Edit3, BarChart2, Users, CheckCircle,
  Info, FileText, Video, Share2, Hash, Building, Target, Check, AlertCircle,
  Youtube, Instagram, Twitter, PieChart, Activity, Heart, MessageCircle, Smartphone, Award, UserPlus, Mail, Edit
} from 'lucide-react';
// Ensure Campaign type includes all necessary fields, may need adjustment based on actual data structure
// import type { Campaign } from './types'; // Assuming this type is sufficient or adjusting if needed
import { formatNumber, formatMoney } from '@/utils/format'; // Assuming formatMoney exists
import { motion } from 'framer-motion';

// Keep existing Campaign type or import a more comprehensive one if needed
// Temporarily defining a more comprehensive structure based on usage below
interface Campaign {
  id: string;
  title: string;
  status: string; // Should likely be 'active'
  startDate?: string | Date;
  endDate?: string | Date;
  contentType?: 'original' | 'repurposed' | 'both';
  brand?: { name?: string }; // Assuming brand is an object with a name
  brief?: { original?: string; repurposed?: string };
  requirements?: {
    platforms?: string[];
    contentGuidelines?: string[];
    hashtags?: { original?: string; repurposed?: string }; // Match shared modal structure
    payoutRate?: { original?: string; repurposed?: string };
    minViewsForPayout?: number | string;
  };
  posts?: Array<{ // Assuming posts array for stats
    platform: string;
    views: number | string;
    earned: number | string;
    likes?: number;
    comments?: number;
    shares?: number;
    saves?: number;
  }>;
  // Stats fields (can be direct or calculated)
  earned?: number | string;
  views?: number | string;
  pendingPayout?: number | string;
  targetAudience?: { // Example structure if needed
    age?: [number, number];
    locations?: string[];
    interests?: string[];
  };
  // Add other fields used from shared modal structure if necessary
  [key: string]: any; // Allow other fields
}


interface ActiveCampaignDetailModalProps {
  campaign: Campaign;
  onClose: () => void;
}

// Helper to get campaign fields safely - simplified version
const getCampaignField = (campaign: Campaign, fieldPath: string, fallback: any = null) => {
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
      return value;
    }
  } catch (e) {
    // Path doesn't exist or value is null/undefined
  }
  return fallback;
};

// Helper function to format date (reused)
const formatDate = (date: string | Date | null | undefined) => {
  if (!date) return 'N/A';
  try {
    return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(date));
  } catch (e) {
    return 'Invalid Date';
  }
};


const ActiveCampaignDetailModal: React.FC<ActiveCampaignDetailModalProps> = ({ campaign, onClose }) => {

  // Calculate Performance Stats
  const performanceStats = React.useMemo(() => {
    const stats = {
      totalEarned: 0,
      totalPosts: 0,
      totalViews: 0,
      totalLikes: 0,
      totalComments: 0,
      totalShares: 0,
      totalSaves: 0,
      pendingPayout: Number(getCampaignField(campaign, 'pendingPayout', 0)), // Assume pendingPayout is directly on campaign or needs calculation elsewhere
      platformBreakdown: {} as Record<string, { posts: number, views: number, earned: number }>,
    };

    if (campaign.posts && Array.isArray(campaign.posts)) {
      stats.totalPosts = campaign.posts.length;
      campaign.posts.forEach(post => {
        const views = parseInt(String(post.views).replace(/[^0-9]/g, '')) || 0;
        const earned = Number(post.earned) || 0;
        stats.totalViews += views;
        stats.totalEarned += earned;
        stats.totalLikes += Number(post.likes) || 0;
        stats.totalComments += Number(post.comments) || 0;
        stats.totalShares += Number(post.shares) || 0;
        stats.totalSaves += Number(post.saves) || 0;

        if (!stats.platformBreakdown[post.platform]) {
          stats.platformBreakdown[post.platform] = { posts: 0, views: 0, earned: 0 };
        }
        stats.platformBreakdown[post.platform].posts += 1;
        stats.platformBreakdown[post.platform].views += views;
        stats.platformBreakdown[post.platform].earned += earned;
      });
    } else {
      // Fallback if posts array is not available but top-level stats are
      stats.totalEarned = Number(getCampaignField(campaign, 'earned', 0));
      stats.totalViews = parseInt(String(getCampaignField(campaign, 'views', '0')).replace(/[^0-9]/g, '')) || 0;
      // totalPosts might need a separate field if campaign.posts isn't guaranteed
    }

    return stats;
  }, [campaign]);

  // Get derived values using the helper
  const campaignContentType = getCampaignField(campaign, 'contentType', 'unknown');
  const campaignStartDate = getCampaignField(campaign, 'startDate');
  const campaignEndDate = getCampaignField(campaign, 'endDate');
  const brandName = getCampaignField(campaign, 'brand.name', 'Unknown Brand');
  const campaignGoal = getCampaignField(campaign, 'goal', 'Not specified'); // Assuming 'goal' field exists

  const payoutRateOriginal = getCampaignField(campaign, 'requirements.payoutRate.original');
  const payoutRateRepurposed = getCampaignField(campaign, 'requirements.payoutRate.repurposed');
  const minViewsForPayout = getCampaignField(campaign, 'requirements.minViewsForPayout', 'N/A');

  const campaignBriefOriginal = getCampaignField(campaign, 'brief.original');
  const campaignBriefRepurposed = getCampaignField(campaign, 'brief.repurposed');
  const contentGuidelines = getCampaignField(campaign, 'requirements.contentGuidelines', []);
  const hashtagsOriginal = getCampaignField(campaign, 'requirements.hashtags.original', '');
  const hashtagsRepurposed = getCampaignField(campaign, 'requirements.hashtags.repurposed', '');
  const requiredPlatforms = getCampaignField(campaign, 'requirements.platforms', []);

  // --- Render Logic based on Shared Modal Creator Default View ---
  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-80 backdrop-blur-sm flex items-center justify-center p-4 md:p-6 z-50"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="campaign-title"
    >
      <motion.div
        className="bg-black/60 border border-gray-800 rounded-lg p-6 md:p-8 w-full max-w-5xl max-h-[90vh] overflow-y-auto custom-scrollbar shadow-xl"
        onClick={(e) => e.stopPropagation()}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        transition={{ duration: 0.2 }}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-6 pr-8 relative">
          <div>
             <h2 id="campaign-title" className="text-2xl font-bold text-white mb-1">{campaign.title}</h2>
            <div className="flex items-center gap-2 text-gray-400 text-sm">
              <Building className="h-4 w-4" />
              <span>{brandName}</span>
            </div>
          </div>
           <span className="absolute top-0 right-10 px-3 py-1 rounded-full bg-green-900/30 text-green-400 text-sm font-medium flex items-center gap-1.5 self-start sm:self-center">
              <CheckCircle className="h-4 w-4"/> ACTIVE
            </span>
          <button
            className="absolute top-0 right-0 p-2 -m-2 text-gray-500 hover:text-white hover:bg-white/10 rounded-full transition-colors"
            onClick={onClose}
            aria-label="Close campaign details"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Main Content Area */}
        <motion.div
            key="details"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            {/* Performance Stats Section */}
            <div className="p-5 bg-black/40 border border-gray-800 rounded-lg">
               <h3 className="text-lg font-bold mb-4 text-white flex items-center gap-2">
            <span className="flex items-center justify-center p-1 rounded-full bg-purple-900/30">
              <BarChart2 className="h-5 w-5 text-purple-400" />
            </span>
            Campaign Performance
          </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-black/50 border border-gray-700 rounded-lg p-4">
                  <p className="text-sm text-gray-400 mb-1">Total Earned</p>
                  <div className="flex items-center">
                    <DollarSign className="h-5 w-5 text-green-400 mr-1" />
                    <p className="text-xl font-bold text-green-400">{formatMoney(performanceStats.totalEarned)}</p>
                  </div>
                </div>
                <div className="bg-black/50 border border-gray-700 rounded-lg p-4">
                  <p className="text-sm text-gray-400 mb-1">Total Posts</p>
                  <div className="flex items-center">
                    <Edit3 className="h-5 w-5 text-cyan-400 mr-1" />
                    <p className="text-xl font-bold text-cyan-400">{formatNumber(performanceStats.totalPosts)}</p>
                  </div>
                </div>
                <div className="bg-black/50 border border-gray-700 rounded-lg p-4">
                  <p className="text-sm text-gray-400 mb-1">Total Views</p>
                  <div className="flex items-center">
                    <Eye className="h-5 w-5 text-blue-400 mr-1" />
                    <p className="text-xl font-bold text-blue-400">{formatNumber(performanceStats.totalViews)}</p>
                  </div>
                </div>
                <div className="bg-black/50 border border-gray-700 rounded-lg p-4">
                  <p className="text-sm text-gray-400 mb-1">Pending Payout</p>
                  <div className="flex items-center">
                    <DollarSign className="h-5 w-5 text-yellow-400 mr-1" />
                    <p className="text-xl font-bold text-yellow-400">{formatMoney(performanceStats.pendingPayout)}</p>
                  </div>
                </div>
              </div>
              {/* Engagement Metrics (Optional but nice) */}
               <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                 <div className="bg-black/50 border border-gray-700 rounded-lg p-4">
                    <p className="text-sm text-gray-400 mb-1">Total Likes</p>
                    <div className="flex items-center">
                      <Heart className="h-5 w-5 text-red-400 mr-1" />
                      <p className="text-xl font-bold text-red-400">{formatNumber(performanceStats.totalLikes)}</p>
                    </div>
                  </div>
                  <div className="bg-black/50 border border-gray-700 rounded-lg p-4">
                    <p className="text-sm text-gray-400 mb-1">Total Comments</p>
                    <div className="flex items-center">
                      <MessageCircle className="h-5 w-5 text-purple-400 mr-1" />
                      <p className="text-xl font-bold text-purple-400">{formatNumber(performanceStats.totalComments)}</p>
                    </div>
                  </div>
                  <div className="bg-black/50 border border-gray-700 rounded-lg p-4">
                    <p className="text-sm text-gray-400 mb-1">Total Shares</p>
                    <div className="flex items-center">
                      <Share2 className="h-5 w-5 text-teal-400 mr-1" />
                      <p className="text-xl font-bold text-teal-400">{formatNumber(performanceStats.totalShares)}</p>
                    </div>
                  </div>
                   <div className="bg-black/50 border border-gray-700 rounded-lg p-4">
                    <p className="text-sm text-gray-400 mb-1">Total Saves</p>
                    <div className="flex items-center">
                      <Smartphone className="h-5 w-5 text-indigo-400 mr-1" />
                      <p className="text-xl font-bold text-indigo-400">{formatNumber(performanceStats.totalSaves)}</p>
                    </div>
                  </div>
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Left Column */}
              <div className="md:col-span-2 space-y-6">
                  {/* Overview Card */}
                  <div className="p-5 bg-black/40 border border-gray-800 rounded-lg">
                    <h3 className="text-base font-semibold mb-4 flex items-center gap-2"><FileText className="h-5 w-5 text-blue-400"/>Campaign Details</h3>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                        <div>
                          <p className="text-gray-400 text-xs mb-1">Campaign Goal</p>
                          <p>{campaignGoal}</p>
                        </div>
                        <div>
                          <p className="text-gray-400 text-xs mb-1">Content Type</p>
                          <p className="capitalize">{campaignContentType === 'both' ? 'Original & Repurposed' : campaignContentType}</p>
                        </div>
                        <div>
                          <p className="text-gray-400 text-xs mb-1">Duration</p>
                            <p>{formatDate(campaignStartDate)} - {formatDate(campaignEndDate)}</p>
                        </div>
                        <div>
                          <p className="text-gray-400 text-xs mb-1">Target Platforms</p>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {requiredPlatforms.map((platform: string, index: number) => (
                              <span key={index} className="px-2 py-0.5 bg-purple-900/30 text-purple-400 rounded-full text-xs flex items-center gap-1">
                                {platform.toLowerCase() === 'instagram' && <Instagram className="h-3 w-3" />}
                                {platform.toLowerCase() === 'tiktok' && <svg className="h-3 w-3" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" /></svg>}
                                {platform.toLowerCase() === 'youtube' && <Youtube className="h-3 w-3" />}
                                {platform.toLowerCase() === 'twitter' && <Twitter className="h-3 w-3" />}
                                {platform}
                              </span>
                            ))}
                          </div>
                        </div>
                    </div>
                  </div>

                {/* Brief & Guidelines Card */}
                <div className="p-5 bg-black/40 border border-gray-800 rounded-lg">
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
                    {Array.isArray(contentGuidelines) && contentGuidelines.length > 0 && (
                      <div className="mb-4">
                        <h4 className="text-sm font-medium text-gray-300 mb-2">Content Guidelines</h4>
                          {(campaignContentType === 'original' || campaignContentType === 'both') && (
                            <div className="mb-2">
                              <h5 className="text-xs text-gray-400 mb-1 flex items-center gap-1"><Video className="h-3 w-3 text-green-400" />Original:</h5>
                              <ul className="list-disc pl-5 space-y-1 text-xs text-gray-300">
                                {contentGuidelines
                                  .filter((_, index) => campaignContentType === 'both' ? index < Math.ceil(contentGuidelines.length / 2) : true)
                                  .map((guideline: string, index: number) => <li key={`og-${index}`}>{guideline}</li>)}
                              </ul>
                            </div>
                          )}
                          {(campaignContentType === 'repurposed' || campaignContentType === 'both') && (
                              <div>
                              <h5 className="text-xs text-gray-400 mb-1 flex items-center gap-1"><Share2 className="h-3 w-3 text-blue-400" />Repurposed:</h5>
                              <ul className="list-disc pl-5 space-y-1 text-xs text-gray-300">
                                  {contentGuidelines
                                  .filter((_, index) => campaignContentType === 'both' ? index >= Math.ceil(contentGuidelines.length / 2) : true)
                                  .map((guideline: string, index: number) => <li key={`rp-${index}`}>{guideline}</li>)}
                              </ul>
                            </div>
                          )}
                      </div>
                    )}
                    {/* Required Hashtags */}
                    {(hashtagsOriginal || hashtagsRepurposed) && (
                        <div>
                        <h4 className="text-sm font-medium text-gray-300 mb-2">Required Hashtags</h4>
                          {hashtagsOriginal && (campaignContentType === 'original' || campaignContentType === 'both') && (
                            <div className="mb-2">
                              <h5 className="text-xs text-gray-400 mb-1">Original:</h5>
                              <div className="flex flex-wrap gap-1">
                                {hashtagsOriginal.split(' ').filter((tag: string) => tag.trim() !== '').map((tag: string, index: number) => (
                                  <span key={`ht-og-${index}`} className="px-2 py-0.5 bg-blue-900/30 text-blue-400 rounded-full text-xs">{tag.startsWith('#') ? tag : `#${tag}`}</span>
                                ))}
                              </div>
                            </div>
                          )}
                          {hashtagsRepurposed && (campaignContentType === 'repurposed' || campaignContentType === 'both') && (
                            <div>
                              <h5 className="text-xs text-gray-400 mb-1">Repurposed:</h5>
                              <div className="flex flex-wrap gap-1">
                                {hashtagsRepurposed.split(' ').filter((tag: string) => tag.trim() !== '').map((tag: string, index: number) => (
                                  <span key={`ht-rp-${index}`} className="px-2 py-0.5 bg-blue-900/30 text-blue-400 rounded-full text-xs">{tag.startsWith('#') ? tag : `#${tag}`}</span>
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
                <div className="p-5 bg-black/40 border border-gray-800 rounded-lg">
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
                          <span className="font-semibold">{formatNumber(minViewsForPayout)}</span>
                        </div>
                      </div>
                  </div>

                {/* Platform Stats Card */}
                 <div className="p-5 bg-black/40 border border-gray-800 rounded-lg">
                    <h3 className="text-base font-semibold mb-4 flex items-center gap-2">
                      <PieChart className="h-5 w-5 text-purple-400" />
                      Performance by Platform
                    </h3>
                    <div className="space-y-3">
                      {Object.entries(performanceStats.platformBreakdown).length > 0 ? (
                         Object.entries(performanceStats.platformBreakdown).map(([platform, stats]) => (
                          <div key={platform} className="p-3 bg-black/20 border border-gray-700 rounded">
                            <h4 className="text-sm font-medium capitalize flex items-center gap-1.5 mb-2">
                              {platform.toLowerCase() === 'instagram' && <Instagram className="h-4 w-4 text-pink-400" />}
                              {platform.toLowerCase() === 'tiktok' && <svg className="h-4 w-4 text-cyan-400" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" /></svg>}
                              {platform.toLowerCase() === 'youtube' && <Youtube className="h-4 w-4 text-red-400" />}
                              {platform.toLowerCase() === 'twitter' && <Twitter className="h-4 w-4 text-blue-400" />}
                              {platform}
                            </h4>
                            <div className="grid grid-cols-3 gap-2 text-xs">
                              <div className="text-center">
                                <p className="text-gray-400">Posts</p>
                                <p className="font-semibold">{stats.posts}</p>
                              </div>
                              <div className="text-center">
                                <p className="text-gray-400">Views</p>
                                <p className="font-semibold">{formatNumber(stats.views)}</p>
                              </div>
                              <div className="text-center">
                                <p className="text-gray-400">Earned</p>
                                <p className="font-semibold text-green-400">{formatMoney(stats.earned)}</p>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-gray-500 italic">No posts submitted yet.</p>
                      )}
                    </div>
                 </div>

                {/* Target Audience Card (Optional - uncomment if needed and data exists) */}
                {/* {campaign.targetAudience && (campaign.targetAudience.locations?.length > 0 || campaign.targetAudience.interests?.length > 0) && (
                  <div className="p-5 bg-black/40 border border-gray-800 rounded-lg">
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
                )} */}
              </div>
            </div>
          </motion.div>

      </motion.div>
    </div>
  );
};

export default ActiveCampaignDetailModal; 