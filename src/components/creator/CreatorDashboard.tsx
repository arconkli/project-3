import React, { useState, useEffect, memo, useMemo, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from 'recharts';
import {
  DollarSign, Eye, Calendar, TrendingUp, Search,
  ArrowUpRight, Clock, Youtube, Instagram, Twitter,
  LogOut, X, AlertCircle, Plus, Zap, Building, Users, Mail, RefreshCcw, Loader, Check, CheckCircle, AlertTriangle, ListFilter, Grid, FileText, ChevronDown, Trash2, Gift, Settings, User, Filter, Play, LightbulbIcon
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import NavigationTabs from '@/components/layout/NavigationTabs';
import SettingsView from './SettingsView';
import AnalyticsView from './AnalyticsView';
import PaymentsView from './PaymentsView';
import ActiveCampaignDetailModal from './ActiveCampaignDetailModal';
import AvailableCampaignDetailModal from './AvailableCampaignDetailModal';
import type { Campaign, AvailableCampaign, Platform, Post, CreatorMetrics as CreatorMetricsType } from './types';
import { formatNumber } from '@/utils/format';
import { supabase } from '@/lib/supabaseClient';
import { campaignService } from '@/services/campaignService';
import JoinCampaignModal from './JoinCampaignModal';
import SubmitPostModal from './SubmitPostModal';
import EditPostModal from './EditPostModal';
import ConfirmModal from '@/components/shared/ConfirmModal';
import CreatorNavigation from './CreatorNavigation';
import CampaignCard from './CampaignCard';
import AvailableCampaignCard from './AvailableCampaignCard';
import { IBarChartData } from './types';
import CampaignDetailModal from './CampaignDetailModal';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { useAuth } from '@/hooks/useAuthContext';
import useProtectedAction from '@/hooks/useProtectedAction';
import { toast } from 'react-hot-toast';
import {
  getPlatformConnections,
  getActiveCreatorCampaigns,
  getCompletedTransactions,
  getEarnings,
  getAvailableCampaigns,
  getCampaignMetrics
} from '@/lib/queries/optimizedQueries';
import {
  getUserProfileByUserId as fetchUserProfile,
  getDashboardMetrics,
  getActiveCampaigns,
  getCompletedCampaigns,
  getPendingPayouts,
} from '@/services/creator/creatorService';
import { useCampaigns } from '@/hooks/useCampaigns';

interface CreatorMetrics extends CreatorMetricsType {}

interface Campaign {
  id: string;
  title: string;
  brand: { name?: string };
  status: 'active' | 'completed' | 'pending';
  views: number;
  earnings: number;
  deadline: string;
  requirements: any;
  startDate?: string | Date;
  endDate?: string | Date;
  brief?: { original?: string; repurposed?: string };
  pendingPayout: number;
  earned: number;
  contentType?: 'original' | 'repurposed' | 'both';
  platforms?: string[];
  posts?: {
    platform: string;
    views: string;
    earned: number;
    status: 'approved' | 'pending' | 'rejected';
    postDate: string;
    contentType: 'original' | 'repurposed';
  }[];
}

// Background pattern component
const BackgroundPattern = memo(() => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
    <svg width="100%" height="100%" className="opacity-5">
      <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
        <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="1" />
      </pattern>
      <rect width="100%" height="100%" fill="url(#grid)" />
    </svg>
  </div>
));

BackgroundPattern.displayName = 'BackgroundPattern';

// Stats Overview Component
const StatsOverview = memo(({ totalPendingPayout }: { totalPendingPayout: number }) => {
  const stats = [
    { 
      icon: <Eye className="h-6 w-6 text-blue-400" aria-hidden="true" />, 
      label: "Total Views", 
      value: "28.3M", 
      trend: "+14%",
      ariaLabel: "Total views: 28.3 million, up 14% from last period"
    },
    { 
      icon: <DollarSign className="h-6 w-6 text-green-400" aria-hidden="true" />, 
      label: "Total Earned", 
      value: "$74,600", 
      trend: "+23%",
      ariaLabel: "Total earned: $74,600, up 23% from last period"
    },
    { 
      icon: <Clock className="h-6 w-6 text-yellow-400" aria-hidden="true" />, 
      label: "Pending", 
      value: `$${totalPendingPayout}`, 
      trend: "+8%",
      ariaLabel: `Pending payout: $${totalPendingPayout}, up 8% from last period`
    }
  ];

  return (
    <section aria-label="Performance overview" className="mb-10">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, i) => (
          <div
            key={i}
            role="region"
            aria-label={stat.ariaLabel}
            className="p-6 rounded-lg bg-black border border-gray-800 hover:border-gray-700 transition-colors"
          >
            <div className="flex items-center gap-3 mb-3">
              {stat.icon}
              <span className="text-gray-400">{stat.label}</span>
            </div>
            <div className="flex justify-between items-end">
              <p className="text-3xl font-bold text-white">{stat.value}</p>
              <div className="text-sm flex items-center gap-1 text-green-400">
                <TrendingUp className="h-4 w-4" aria-hidden="true" />
                <span>{stat.trend}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
});

StatsOverview.displayName = 'StatsOverview';

// Active Campaigns Component
const ActiveCampaigns = memo(({ campaigns, onCampaignClick }: { 
  campaigns: Campaign[];
  onCampaignClick: (campaign: Campaign) => void;
}) => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
    {campaigns.map((campaign) => (
      <button
        key={campaign.id}
        className="text-left p-6 rounded-lg bg-black border border-gray-800 hover:border-gray-600 transition-all hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50 cursor-pointer group"
        onClick={() => onCampaignClick(campaign)}
        aria-label={`View details for ${campaign.title} campaign`}
      >
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-xl font-bold text-white group-hover:text-red-400 transition-colors">{campaign.title}</h3>
          <span className="px-3 py-1 rounded-full bg-green-900/20 text-green-400 text-sm font-medium">
            ACTIVE
          </span>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-4">
          <div>
            <p className="text-sm text-gray-400 mb-1">Earned</p>
            <p className="text-xl font-bold text-white">${campaign.earned || 0}</p>
          </div>
          <div>
            <p className="text-sm text-gray-400 mb-1">Pending</p>
            <p className="text-xl font-bold text-white">${campaign.pendingPayout || 0}</p>
          </div>
          <div>
            <p className="text-sm text-gray-400 mb-1">Views</p>
            <p className="text-xl font-bold text-white">{formatNumber(campaign.views || 0)}</p>
          </div>
        </div>

        <div className="flex justify-between items-end">
          <div className="flex flex-wrap gap-2">
            {campaign.platforms?.slice(0, 2).map((platform) => (
              <span
                key={platform}
                className="px-3 py-1 rounded-full bg-purple-900/20 text-purple-400 text-sm"
              >
                {platform}
              </span>
            ))}
            {(campaign.platforms?.length || 0) > 2 && (
              <span className="px-3 py-1 rounded-full bg-gray-800 text-gray-300 text-sm">
                +{campaign.platforms!.length - 2} more
              </span>
            )}
          </div>
          <div className="flex items-center text-sm text-gray-400">
            <Calendar className="h-4 w-4 mr-1" aria-hidden="true" />
            <span>{new Date(campaign.endDate).toLocaleDateString()}</span>
          </div>
        </div>
      </button>
    ))}
  </div>
));

ActiveCampaigns.displayName = 'ActiveCampaigns';

// Available Campaigns Section
const AvailableCampaignsSection = memo(({ campaigns, onCampaignClick }: {
  campaigns: AvailableCampaign[];
  onCampaignClick: (campaign: AvailableCampaign) => void;
}) => {
  console.log(`Rendering AvailableCampaignsSection with ${campaigns?.length || 0} campaigns`);

  // Handle empty campaigns array
  if (!campaigns || campaigns.length === 0) {
    return (
      <div className="p-6 rounded-lg bg-black border border-gray-800 text-center">
        <p className="text-gray-400">No available campaigns at the moment. Check back soon!</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {campaigns.map((campaign) => {
        // Ensure campaign has required properties
        if (!campaign || !campaign.id) {
          console.error("Invalid campaign data:", campaign);
          return null;
        }

        // Safe access to nested properties with fallbacks
        const title = campaign.title || 'Untitled Campaign';
        const contentType = campaign.contentType || 'both';
        const brief = campaign.brief || { original: null, repurposed: null };
        const requirements = campaign.requirements || { platforms: [], contentGuidelines: [], payoutRate: { original: '', repurposed: '' } };
        const platforms = campaign.platforms || requirements.platforms || [];
        const payoutRate = requirements.payoutRate || { original: '', repurposed: '' };

        console.log(`Rendering campaign card: ${campaign.id} - ${title}`);

        return (
          <div
            key={campaign.id}
            className="text-left p-6 rounded-lg bg-black border border-gray-800 hover:border-gray-600 transition-all hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50 cursor-pointer group relative"
            onClick={() => onCampaignClick(campaign)}
          >
            <div className="absolute top-4 right-4">
              <ArrowUpRight className="h-4 w-4 text-gray-500 group-hover:text-red-400 transition-colors" aria-hidden="true" />
            </div>

            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-bold mb-2 text-white group-hover:text-red-400 transition-colors">{title}</h3>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full bg-red-900/20 text-red-400 text-sm font-medium">
                    NEW
                  </span>
                  <span className="px-3 py-1 rounded-full bg-white/5 text-sm text-gray-300">
                    {contentType === 'both' 
                      ? 'Original & Repurposed' 
                      : contentType === 'original'
                      ? 'Original Only'
                      : 'Repurposed Only'}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-4 mb-4">
              <div>
                <p className="text-sm text-gray-400 mb-2">Brief</p>
                <div className="space-y-2">
                  {brief.original && (
                    <p className="text-gray-300 line-clamp-2">
                      <span className="text-green-400 font-medium mr-2">Original:</span>
                      {brief.original}
                    </p>
                  )}
                  {brief.repurposed && (
                    <p className="text-gray-300 line-clamp-2">
                      <span className="text-blue-400 font-medium mr-2">Repurposed:</span>
                      {brief.repurposed}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <p className="text-sm text-gray-400 mb-2">Payout Rates</p>
                <div className="space-y-1">
                  {(contentType === 'original' || contentType === 'both') && payoutRate.original && (
                    <p className="font-medium text-green-400">
                      Original: {payoutRate.original}
                    </p>
                  )}
                  {(contentType === 'repurposed' || contentType === 'both') && payoutRate.repurposed && (
                    <p className="font-medium text-blue-400">
                      Repurposed: {payoutRate.repurposed}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3 pt-3 border-t border-gray-800">
              <div className="flex flex-wrap gap-2">
                {platforms.map((platform) => (
                  <span
                    key={platform}
                    className="px-3 py-1 rounded-full bg-white/5 text-sm text-gray-300"
                    role="img"
                    aria-label={`Platform: ${platform}`}
                  >
                    {platform}
                  </span>
                ))}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
});

AvailableCampaignsSection.displayName = 'AvailableCampaignsSection';

// Campaign Detail Component
const CampaignDetail = memo(({ campaign, onClose }: {
  campaign: Campaign | AvailableCampaign;
  onClose: () => void;
}) => {
  // Check if this is an active campaign (one the creator has joined)
  const isActive = campaign.status === 'active';

  // Helper function to check if campaign has posts and handle them
  const campaignHasPosts = (campaign: Campaign | AvailableCampaign): campaign is Campaign => {
    return 'posts' in campaign && !!campaign.posts;
  };

  // Group posts by platform to show stats
  const platformStats = React.useMemo(() => {
    if (!isActive || !campaignHasPosts(campaign)) return null;
    
    const stats: Record<string, { posts: number, views: number, earned: number }> = {};
    
    campaign.posts.forEach(post => {
      if (!stats[post.platform]) {
        stats[post.platform] = { posts: 0, views: 0, earned: 0 };
      }
      
      stats[post.platform].posts += 1;
      stats[post.platform].views += Number(post.views) || 0;
      stats[post.platform].earned += post.earned || 0;
    });
    
    return stats;
  }, [isActive, campaign]);

  return (
    <div
      className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-80 backdrop-blur-sm z-50 p-6"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="bg-black/40 border border-gray-800 rounded-lg p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className="absolute top-4 right-4 p-2"
          onClick={onClose}
          aria-label="Close details"
        >
          <X className="h-6 w-6" />
        </button>

        <h2 className="text-2xl font-bold mb-6 text-white">{campaign.title}</h2>

        {isActive && (
          <>
            {/* Stats Summary for Active Campaigns */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-black/30 border border-gray-800 rounded-lg p-4">
                <p className="text-sm text-gray-400 mb-1">Total Earned</p>
                <p className="text-xl font-bold text-green-400">${campaign.earned || 0}</p>
              </div>
              <div className="bg-black/30 border border-gray-800 rounded-lg p-4">
                <p className="text-sm text-gray-400 mb-1">Total Views</p>
                <p className="text-xl font-bold text-blue-400">{formatNumber(campaign.views || 0)}</p>
              </div>
              <div className="bg-black/30 border border-gray-800 rounded-lg p-4">
                <p className="text-sm text-gray-400 mb-1">Pending Payout</p>
                <p className="text-xl font-bold text-yellow-400">${campaign.pendingPayout || 0}</p>
              </div>
            </div>

            {/* Connected Accounts Section */}
            <div className="mb-6">
              <h3 className="text-lg font-bold mb-3 text-white">Connected Accounts</h3>
              <div className="bg-black/30 border border-gray-800 rounded-lg p-4 space-y-4">
                {campaign.platforms?.map((platform) => (
                  <div key={platform} className="flex flex-col">
                    <div className="flex items-center gap-2 mb-2">
                      {platform === 'TikTok' && <span className="text-pink-400 text-lg">TikTok</span>}
                      {platform === 'Instagram' && <span className="text-purple-400 text-lg">Instagram</span>}
                      {platform === 'YouTube' && <span className="text-red-400 text-lg">YouTube</span>}
                      {platform === 'Twitter' && <span className="text-blue-400 text-lg">Twitter</span>}
                      <span className="text-gray-300">@{platform.toLowerCase()}_username</span>
                    </div>
                    
                    <div className="ml-6 text-sm">
                      <p className="text-gray-400 mb-1">Content Type: <span className="text-white">
                        {campaign.contentType === 'both' 
                          ? 'Original & Repurposed' 
                          : campaign.contentType === 'original' 
                            ? 'Original Content Only' 
                            : 'Repurposed Content Only'}
                      </span></p>
                      
                      {platformStats && platformStats[platform] && (
                        <div className="grid grid-cols-3 gap-2 mt-2">
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
                  </div>
                ))}
              </div>
            </div>

            {/* Eligible Content Section */}
            <div className="mb-6">
              <h3 className="text-lg font-bold mb-3 text-white">Eligible Content</h3>
              {campaign.posts && campaign.posts.length > 0 ? (
                <div className="space-y-3">
                  {campaign.posts.map((post, index) => (
                    <div key={index} className="bg-black/30 border border-gray-800 rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-2">
                          {post.platform === 'TikTok' && <span className="text-pink-400 text-lg">TikTok</span>}
                          {post.platform === 'Instagram' && <span className="text-purple-400 text-lg">Instagram</span>}
                          {post.platform === 'YouTube' && <span className="text-red-400 text-lg">YouTube</span>}
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
                        <p>Posted: {new Date(post.postDate).toLocaleDateString()}</p>
                        <p>Earned: ${post.earned}</p>
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
          </>
        )}
        
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-400">Content Type</p>
              <p className="text-lg font-medium capitalize">{campaign.contentType}</p>
            </div>
            <div>
              <p className="text-sm text-gray-400">End Date</p>
              <p className="text-lg font-medium">{new Date(campaign.endDate).toLocaleDateString()}</p>
            </div>
          </div>

          <div>
            <h3 className="font-medium mb-2">Requirements</h3>
            <ul className="list-disc pl-5 space-y-2">
              {campaign.requirements.contentGuidelines.map((guideline, i) => (
                <li key={i}>{guideline}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
});

CampaignDetail.displayName = 'CampaignDetail';

// Let's add a simple loading component
const LoadingIndicator = () => (
  <div className="flex flex-col items-center justify-center p-8">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-500 mb-4"></div>
    <p className="text-white text-lg">Loading your dashboard...</p>
  </div>
);

// Create an error component to display when something goes wrong
const ErrorDisplay = ({ message, onRetry }: { message: string, onRetry?: () => void }) => (
  <div className="flex flex-col items-center justify-center p-8 border border-red-500 rounded-lg bg-red-900/20 max-w-xl mx-auto mt-10">
    <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
    <h3 className="text-xl font-bold text-white mb-2">Something went wrong</h3>
    <p className="text-gray-300 text-center mb-4">{message}</p>
    <p className="text-gray-400 text-sm text-center mb-4">
      Please try refreshing the page. If the problem persists, contact support.
    </p>
    {onRetry && (
      <button 
        onClick={onRetry}
        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg flex items-center gap-2"
      >
        <RefreshCcw className="h-4 w-4" />
        Try Again
      </button>
    )}
  </div>
);

// Adjusted transform function for data from getActiveCreatorCampaigns
const transformActiveCampaignData = (activeData: any[]): Campaign[] => {
  if (!activeData) return [];
  console.log('[transformActiveCampaignData] Transforming active data:', activeData);
  return activeData.map(item => {
    const campaignData = item.campaign; // Access the nested campaign data
    const brandData = campaignData?.brand; // Access nested brand data

    if (!campaignData) {
      console.warn('[transformActiveCampaignData] Skipping item due to missing nested campaign data:', item);
      return null; // Skip if essential campaign data is missing
    }

    // Helper to safely access potentially missing requirements fields
    const getReqField = (field: string, fallback: any = null) => campaignData.requirements?.[field] ?? fallback;

    return {
      id: campaignData.id,
      title: campaignData.title || 'Unknown Campaign',
      brand: brandData ? { name: brandData.name } : { name: 'Unknown Brand' }, // Corrected brand mapping
      status: 'active',
      views: campaignData.metrics?.totalViews || item.metrics?.views || 0, // Use item metrics as fallback?
      earnings: item.metrics?.earned || 0, // Use item metrics?
      // Map dates correctly
      startDate: campaignData.start_date, // Map start_date
      endDate: campaignData.end_date,     // Map end_date
      // Map brief
      brief: campaignData.brief, // Map brief object
      // Pass requirements through, maybe extract platforms separately if needed elsewhere
      requirements: campaignData.requirements || {},
      pendingPayout: item.metrics?.pendingPayout || 0, // Use item metrics?
      earned: item.metrics?.earned || 0,           // Use item metrics?
      contentType: campaignData.content_type || 'both',
      platforms: getReqField('platforms', []), // Extract platforms safely
      // posts: transformPostsData(campaignData.posts) // Keep commented out
      // Remove deadline if not needed
      deadline: campaignData.end_date || '', // Or remove this line
    };
  }).filter((c): c is Campaign => c !== null); // Filter out null entries and assert type
};

// Keep the existing transform function for completed *transactions*
const transformTransactionData = (transactions: any[]): Campaign[] => {
  if (!transactions) return [];
  console.log('[transformTransactionData] Transforming completed transaction data:', transactions);
  return transactions.map(t => {
    const campaignData = t.campaigns; // Access the nested campaign data
    const brandData = campaignData?.brands; // Access nested brand data
    
    if (!campaignData) {
      console.warn('[transformTransactionData] Skipping item due to missing nested campaign data:', t);
      return null; // Skip if essential campaign data is missing
    }

    return {
      id: campaignData?.id || t.campaign_id,
      title: campaignData?.title || 'Unknown Campaign',
      brand: brandData?.name || 'Unknown Brand',
      status: 'completed', // We know these are from completed transactions
      views: campaignData?.metrics?.totalViews || 0, // Assuming metrics might be nested
      earnings: t.amount || 0, // Use transaction amount for earnings/earned
      deadline: campaignData?.end_date || '',
      requirements: campaignData?.requirements || { platforms: [], contentGuidelines: [] },
      endDate: campaignData?.end_date || '',
      pendingPayout: 0, // Completed campaigns have no pending payout from these transactions
      earned: t.amount || 0, 
      contentType: campaignData?.content_type || 'both',
      platforms: campaignData?.requirements?.platforms || [],
      // posts: transformPostsData(campaignData?.posts) // Add post transformation if needed
    };
  }).filter((c): c is Campaign => c !== null); // Filter out null entries and assert type
};

// Define props type for CreatorDashboard
interface CreatorDashboardProps {
  user: (SupabaseUser & { role: string | null }) | null;
  signOut: () => Promise<any>;
  userId: string | undefined; // Add userId prop
}

export const CreatorDashboard = ({ user: userProp, signOut: signOutProp, userId: userIdProp }: CreatorDashboardProps) => { // Receive props
  // console.log('CreatorDashboard: Received userProp:', userProp); // Removed log
  // console.log('CreatorDashboard: Received userIdProp:', userIdProp); // Removed log

  // Assign props to local consts
  const user = userProp;
  const userId = userIdProp;
  const signOut = signOutProp;
  
  // Derive role from user prop
  const userRole = user?.role; 

  // We still need the loading state from context for the loading indicator
  const { loading } = useAuth(); 

  // console.log(`[CreatorDashboard Render] Auth State (Props) - User: ${user ? user.uid : 'null'}, UserId: ${userId}, loading: ${loading}, userRole: ${userRole}`);

  const navigate = useNavigate();
  
  // State for loading and error handling
  // const [isLoading, setIsLoading] = useState(true); // Remove internal loading state
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  
  // State for user data
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    views: 0,
    engagement: 0,
    conversion: 0,
    revenueGrowth: 0
  });
  const [totalPendingPayout, setTotalPendingPayout] = useState(0);
  
  // State for campaigns
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [availableCampaigns, setAvailableCampaigns] = useState<AvailableCampaign[]>([]);
  const [completedCampaigns, setCompletedCampaigns] = useState<Campaign[]>([]);
  
  // UI state
  const [activeView, setActiveView] = useState('campaigns');
  const [searchTerm, setSearchTerm] = useState('');
  const [timeFilter, setTimeFilter] = useState('1M');
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // Campaign selection state
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | AvailableCampaign | null>(null);
  const [selectedCampaignType, setSelectedCampaignType] = useState<'active' | 'available' | null>(null);
  const [joiningCampaign, setJoiningCampaign] = useState<AvailableCampaign | null>(null);

  // Timeouts and loading control
  const timeoutsRef = useRef<number[]>([]);
  const maxLoadingTimeout = useRef<number | null>(null);

  // Instantiate the useCampaigns hook
  const { joinCampaign: joinCampaignHook } = useCampaigns({ userId: userId, userType: 'creator' }); // Use userId prop

  // Function to load dashboard data
  const loadDashboardData = useCallback(async () => {
    // Ensure userId is available (passed as prop)
    if (!userId) { 
      // setIsLoading(false); // Removed internal loading state
      console.log('userId not available yet in loadDashboardData');
      return;
    }
    // const userId = user.uid; // No longer need to get from user object here

    setIsAuthenticated(true);
    // setIsLoading(true); // Removed internal loading state
    setError(null);
    console.log(`Starting dashboard data load for user: ${userId}`);

    // Clear previous timeouts if any (though they are removed now)
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];
    if (maxLoadingTimeout.current) {
      clearTimeout(maxLoadingTimeout.current);
      maxLoadingTimeout.current = null;
    }

    try {
      const profilePromise = fetchUserProfile(userId);

      // Setup promises for concurrent fetching - use new function for active campaigns
      const activeCampaignsPromise = getActiveCreatorCampaigns(userId);
      const completedTransactionsPromise = getCompletedTransactions(userId);
      const earningsPromise = getEarnings(userId);

      // Await profile completion
      try {
        const profileData = await profilePromise;
        if (!profileData) {
          console.error('User profile could not be fetched or does not exist.');
          setError("Your user profile could not be loaded. Please contact support.");
          // setIsLoading(false); // Removed internal loading state
          setIsAuthenticated(true); // Still authenticated, just no profile
          return; // Stop further data loading
        }
        setUserProfile(profileData);
        console.log('User profile fetched successfully.');
      } catch (profileError) {
        console.error("Error fetching user profile:", profileError);
        setError("Error fetching user profile. Please refresh the page.");
        // Decide if we should stop loading or continue for other data
        // For now, we'll continue but show the error
      }

      // Await concurrent fetches
      const [ activeResult, completedResult, earningsResult ] = await Promise.allSettled([
        activeCampaignsPromise,
        completedTransactionsPromise,
        earningsPromise
      ]);

      let activeCampaignIds: string[] = [];
      let completedCampaignIds: string[] = [];

      // Process active campaigns (using new function result and transformer)
      if (activeResult.status === 'fulfilled' && !activeResult.value.error) {
        console.log("Fetched active creator campaigns data:", activeResult.value.data); // Log raw data
        const transformedActive = transformActiveCampaignData(activeResult.value.data); // Use new transformer
        console.log("Transformed active campaigns:", transformedActive);
        setCampaigns(transformedActive);
        activeCampaignIds = transformedActive.map(c => c.id);
      } else {
        console.error("Error fetching active creator campaigns:", activeResult.status === 'rejected' ? activeResult.reason : activeResult.value.error);
      }

      // Process completed transactions
      if (completedResult.status === 'fulfilled' && !completedResult.value.error) {
        console.log("Fetched completed transactions:", completedResult.value.data);
        const transformedCompleted = transformTransactionData(completedResult.value.data); // Use existing transformer
        setCompletedCampaigns(transformedCompleted);
        // Get completed campaign IDs from the *nested* campaign data within transactions
        completedCampaignIds = transformedCompleted.map(c => c.id); 
      } else {
        console.error("Error fetching completed campaigns/transactions:", completedResult.status === 'rejected' ? completedResult.reason : completedResult.value.error);
      }

      // Process earnings
      if (earningsResult.status === 'fulfilled' && !earningsResult.value.error) {
        const totalPayout = (earningsResult.value.data || []).reduce((sum: number, earning: any) => sum + (earning.amount || 0), 0);
        setTotalPendingPayout(totalPayout);
        console.log(`Total pending payout calculated: ${totalPayout}`);
      } else {
        console.error("Error fetching pending payouts/earnings:", earningsResult.status === 'rejected' ? earningsResult.reason : earningsResult.value.error);
      }

      // Fetch available campaigns, excluding active/completed ones
      try {
        const existingIds = [...new Set([...activeCampaignIds, ...completedCampaignIds])];
        console.log(`Fetching available campaigns, excluding IDs:`, existingIds); // Log excluded IDs
        const { data: availableData, error: availableError } = await getAvailableCampaigns(userId, existingIds); // Pass userId and excluded IDs
        
        if (availableError) throw availableError;
        
        // Transform the fetched available campaigns
        const transformedAvailable = await campaignService.transformCampaigns(availableData || []);
        setAvailableCampaigns(transformedAvailable);
        console.log(`Fetched and transformed ${transformedAvailable.length} available campaigns.`);
      } catch (err) {
        console.error("Error fetching available campaigns:", err);
      }

      // TODO: Fetch dashboard metrics (getCampaignMetrics) if needed
      // try {
      //   const allCampaignIds = [...new Set([...activeCampaignIds, ...completedCampaignIds])];
      //   if (allCampaignIds.length > 0) {
      //      const { data: metricsData, error: metricsError } = await getCampaignMetrics(allCampaignIds);
      //      if (metricsError) throw metricsError;
      //      // Process and setMetrics(processedMetricsData);
      //      console.log("Fetched campaign metrics:", metricsData);
      //   }
      // } catch (err) {
      //    console.error("Error fetching dashboard metrics:", err);
      // }

    } catch (globalErr) {
      // Catch errors from profile fetch or re-thrown errors
      console.error("Global error during dashboard data load:", globalErr);
      // Avoid overwriting specific profile fetch error if already set
      if (!error) {
          setError("Error loading dashboard data. Please refresh the page.");
      }
    } finally {
      // setIsLoading(false); // Removed internal loading state
      console.log('Finished dashboard data load.');
    }
  // Update dependencies: only depends on user object changes now
  }, [userId]);

  // Handle campaign click
  const handleCampaignClick = useCallback((campaign: Campaign | AvailableCampaign, type: 'active' | 'available') => {
    console.log(`[handleCampaignClick] Campaign clicked (Type: ${type})`, campaign);
    setSelectedCampaign(campaign);
    setSelectedCampaignType(type);
  }, []);

  // Handle joining a campaign
  const handleJoinCampaign = useCallback(async (selectedPlatforms: string[]) => {
    if (!joiningCampaign || !user) return;
    
    try {
      // Use the joinCampaign function from the hook
      await joinCampaignHook(joiningCampaign.id, selectedPlatforms);
      
      // Refresh campaigns after joining
      loadDashboardData();
      setJoiningCampaign(null);
      toast.success(`Successfully joined campaign: ${joiningCampaign.title}`);
    } catch (err) {
      console.error("Error joining campaign:", err);
      toast.error("Failed to join campaign. Please try again.");
    }
  }, [joiningCampaign, user, loadDashboardData, joinCampaignHook]);

  // Load dashboard data initially when authentication is confirmed and user is available
  useEffect(() => {
    // Log the state we are checking
    // console.log(`useEffect [auth/user]: Checking userId - ${userId}.`); // Removed log

    // Trigger load data primarily when userId becomes available
    if (userId) { // Use userId prop
      console.log('useEffect [auth/user]: User ID present. Triggering initial data load.');
      loadDashboardData();
    } else {
      console.log('useEffect [auth/user]: User ID not present. Waiting or handling no user.');
      // If auth context is done loading but there's no userId (shouldn't happen if passed correctly)
      if (!loading && !userId) { 
        console.log('useEffect [auth/user]: Auth finalized with no user ID. Setting internal loading false.');
        setIsAuthenticated(false);
      }
    }
    // Dependencies: Primarily userId (from prop). Include loadDashboardData because it's called.
  }, [userId, loadDashboardData]); // Use userId prop dependency

  // Re-load dashboard data when timeFilter changes (if user is loaded)
  useEffect(() => {
    // Only reload if userId exists 
    if (userId) { // Use userId prop
      console.log(`useEffect [timeFilter]: Triggering data reload for filter: ${timeFilter}`);
      loadDashboardData();
    } else {
      console.log('useEffect [timeFilter]: Skipping reload, user.uid missing.');
    }
    // Depend on timeFilter and userId 
  }, [timeFilter, userId, loadDashboardData]); // Use userId prop dependency

  // Cleanup effect
  useEffect(() => {
    return () => {
      console.log('CreatorDashboard: Running cleanup.');
      if (timeoutsRef.current) {
        timeoutsRef.current.forEach(clearTimeout);
      }
      if (maxLoadingTimeout.current) {
        clearTimeout(maxLoadingTimeout.current);
      }
    };
  }, []); // Runs only on unmount

  // Debugging log added
  console.log(`[CreatorDashboard Render] selectedCampaignType: ${selectedCampaignType}, selectedCampaign ID: ${selectedCampaign?.id}`);

  // Prepare content based on loading, error, and auth state
  let content: React.ReactNode;
  
  // Rely on context's loading state now
  if (loading) { 
    content = (
      <div className="h-screen flex flex-col items-center justify-center p-4">
        <div className="flex items-center mb-4">
          <Loader className="h-8 w-8 text-red-500 animate-spin mr-3" aria-hidden="true" />
          <h1 className="text-xl font-bold">Loading your dashboard...</h1>
        </div>
        <p className="text-gray-400 max-w-md text-center">
          We're fetching your campaigns, metrics, and profile information.
        </p>
      </div>
    );
  } else if (error) {
    content = (
      <div className="h-screen flex flex-col items-center justify-center p-4 text-center">
        <div className="bg-red-900/20 p-3 rounded-full mb-4">
          <AlertCircle className="h-8 w-8 text-red-500" aria-hidden="true" />
        </div>
        <h1 className="text-xl font-bold mb-4">Something went wrong</h1>
        <p className="text-gray-400 max-w-md mb-6">{error}</p>
        <button
          onClick={loadDashboardData}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  } else if (isAuthenticated === false) {
    content = (
      <div className="h-screen flex flex-col items-center justify-center p-4">
        <div className="bg-yellow-900/20 p-3 rounded-full mb-4">
          <AlertCircle className="h-8 w-8 text-yellow-500" aria-hidden="true" />
        </div>
        <h1 className="text-xl font-bold mb-4">Authentication Required</h1>
        <p className="text-gray-400 max-w-md text-center mb-6">
          You need to be logged in to access the creator dashboard.
        </p>
        <button
          onClick={() => navigate('/login')}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50 transition-colors"
        >
          Log In
        </button>
      </div>
    );
  } else {
    content = (
      <div className="p-4 md:p-8 relative">
        {/* Header */}
        <header className="mb-8">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold">
                <a 
                  href="/"
                  className="focus:outline-none focus:ring-2 focus:ring-red-500 rounded-sm hover:text-red-400 transition-colors"
                  aria-label="Return to homepage"
                >
                  CREATE_OS
                </a>
              </h1>
              <p className="text-gray-400 text-sm" aria-label="Current section">Creator Dashboard</p>
            </div>

            <div className="flex items-center gap-3">
              <label htmlFor="search" className="sr-only">Search campaigns</label>
              <div className="relative">
                <input
                  type="text"
                  id="search"
                  className="bg-gray-900 text-gray-200 px-4 py-2 pr-10 rounded-lg border border-gray-800 w-full md:w-64"
                  placeholder="Search campaigns..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <Search className="absolute top-1/2 right-3 transform -translate-y-1/2 h-4 w-4 text-gray-400" aria-hidden="true" />
              </div>
              
              <div className="flex items-center">
                <span className="text-sm text-gray-400 mr-2 hidden md:inline">Filter:</span>
                <select
                  className="bg-gray-900 text-gray-200 px-3 py-2 rounded-lg border border-gray-800 appearance-none"
                  value={timeFilter}
                  onChange={(e) => setTimeFilter(e.target.value)}
                  aria-label="Time filter"
                >
                  <option value="1M">Last month</option>
                  <option value="3M">Last 3 months</option>
                  <option value="6M">Last 6 months</option>
                  <option value="1Y">Last year</option>
                  <option value="ALL">All time</option>
                </select>
              </div>
              
              <div className="relative">
                <button
                  onClick={() => setShowLogoutConfirm(true)}
                  className="bg-gray-900 hover:bg-gray-800 text-gray-200 p-2 rounded-full focus:outline-none focus:ring-2 focus:ring-red-500"
                  aria-label="User menu"
                >
                  <User className="h-5 w-5" aria-hidden="true" />
                </button>
              </div>
            </div>
          </div>
        </header>

        <StatsOverview totalPendingPayout={totalPendingPayout} />

        <NavigationTabs activeView={activeView} setActiveView={setActiveView} />

        <main aria-live="polite">
          {activeView === 'campaigns' && (
            <section className="grid md:grid-cols-3 gap-6">
              <div className="md:col-span-2">
                <div className="mb-6">
                  <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    <Play className="h-5 w-5 text-red-500" aria-hidden="true" />
                    Active Campaigns
                  </h2>
                  
                  {campaigns.length > 0 ? (
                    campaigns
                      .filter(c => c.title.toLowerCase().includes(searchTerm.toLowerCase()))
                      .map(campaign => (
                        <button
                          key={campaign.id}
                          onClick={() => handleCampaignClick(campaign, 'active')}
                          className={`w-full block mb-4 p-4 rounded-lg border border-gray-800 bg-gradient-to-r from-gray-900 to-black hover:from-gray-800 hover:to-gray-900 cursor-pointer text-left transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 ${selectedCampaign?.id === campaign.id ? 'ring-2 ring-red-500' : ''}`}
                        >
                          <div className="flex justify-between items-start mb-3">
                            <h3 className="font-semibold truncate mr-2">{campaign.title}</h3>
                            <span className="px-2 py-1 rounded-full bg-green-900/20 text-green-400 text-xs">
                              active
                            </span>
                          </div>
                          
                          <div className="mb-4 text-sm text-gray-400">
                            {campaign.brand?.name || 'Unknown Brand'}
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4 mb-4">
                            <div className="p-3 bg-black/30 rounded-lg">
                              <p className="text-xs text-gray-500 mb-1">Views</p>
                              <p className="font-medium">{campaign.views.toLocaleString()}</p>
                            </div>
                            <div className="p-3 bg-black/30 rounded-lg">
                              <p className="text-xs text-gray-500 mb-1">Earnings</p>
                              <p className="font-medium">${campaign.earnings.toLocaleString()}</p>
                            </div>
                          </div>

                          <div className="flex justify-between items-end">
                            <div className="flex flex-wrap gap-2">
                              {(campaign.platforms || []).map((platform) => (
                                <span
                                  key={platform}
                                  className="px-3 py-1 rounded-full bg-white/5 text-sm text-gray-300"
                                >
                                  {platform}
                                </span>
                              ))}
                            </div>
                            <div className="flex items-center text-sm text-gray-400">
                              <Calendar className="h-4 w-4 mr-1" aria-hidden="true" />
                              <span>{new Date(campaign.endDate).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </button>
                      ))
                  ) : (
                    <div className="p-6 rounded-lg bg-black border border-gray-800 text-center">
                      <p className="text-gray-400 mb-4">You don't have any active campaigns yet.</p>
                      <p className="text-sm text-gray-500">Join a campaign to start earning.</p>
                    </div>
                  )}
                </div>
              </div>
              
              <div>
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <LightbulbIcon className="h-5 w-5 text-yellow-500" aria-hidden="true" />
                  Available Campaigns
                </h2>
                
                {availableCampaigns.length > 0 ? (
                  availableCampaigns
                    .filter(c => c.title.toLowerCase().includes(searchTerm.toLowerCase()))
                    .map(campaign => (
                      <button
                        key={campaign.id}
                        onClick={() => handleCampaignClick(campaign, 'available')}
                        className={`w-full block mb-4 p-4 rounded-lg border border-gray-800 bg-gradient-to-r from-gray-900 to-black hover:from-gray-800 hover:to-gray-900 cursor-pointer text-left transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 ${selectedCampaign?.id === campaign.id ? 'ring-2 ring-red-500' : ''}`}
                      >
                        <div className="flex justify-between items-start mb-3">
                          <h3 className="font-semibold truncate mr-2">{campaign.title}</h3>
                          <span className="px-2 py-1 rounded-full bg-blue-900/20 text-blue-400 text-xs">
                            available
                          </span>
                        </div>
                        
                        <div className="mb-4 text-sm text-gray-400">
                          {campaign.brand?.name || 'Unknown Brand'}
                        </div>
                        
                        <div className="mb-3 flex flex-wrap gap-2">
                          {(campaign.platforms || []).map((platform) => (
                            <span
                              key={platform}
                              className="px-3 py-1 rounded-full bg-white/5 text-sm text-gray-300"
                            >
                              {platform}
                            </span>
                          ))}
                        </div>
                        
                        <div className="flex justify-end items-center text-sm text-gray-400">
                          <Calendar className="h-4 w-4 mr-1" aria-hidden="true" />
                          <span>{new Date(campaign.endDate).toLocaleDateString()}</span>
                        </div>
                      </button>
                    ))
                ) : (
                  <div className="p-6 rounded-lg bg-black border border-gray-800 text-center">
                    <p className="text-gray-400 mb-4">No campaigns available right now.</p>
                    <p className="text-sm text-gray-500">Check back soon for new opportunities!</p>
                  </div>
                )}
              </div>
            </section>
          )}

          {activeView === 'analytics' && (
            <AnalyticsView userId={userId} />
          )}

          {activeView === 'payments' && (
            <PaymentsView userId={userId} />
          )}

          {activeView === 'settings' && (
            <SettingsView userProfile={userProfile} onUpdate={() => loadDashboardData()} />
          )}
        </main>
        
        {/* Campaign Details Modal - Conditionally render Active or Available */}
        {selectedCampaign && selectedCampaignType === 'active' && (
          <ActiveCampaignDetailModal
            campaign={selectedCampaign as Campaign} // Cast to Campaign for active
            onClose={() => {
              setSelectedCampaign(null);
              setSelectedCampaignType(null);
            }}
          />
        )}

        {selectedCampaign && selectedCampaignType === 'available' && (
          // Use the shared modal for available campaigns as requested
          <CampaignDetailModal
            campaign={selectedCampaign} // No need to cast here, shared handles both
            userType="creator"
            onClose={() => {
              setSelectedCampaign(null);
              setSelectedCampaignType(null);
            }}
            onJoin={() => {
              // Trigger the Join flow for available campaigns
              setJoiningCampaign(selectedCampaign as AvailableCampaign);
              setSelectedCampaign(null); // Close the detail modal
              setSelectedCampaignType(null);
            }}
          />
        )}
        
        {/* Join Campaign Modal */}
        {joiningCampaign && (
          <JoinCampaignModal
            campaign={joiningCampaign}
            onClose={() => setJoiningCampaign(null)}
            onJoin={handleJoinCampaign}
            availablePlatforms={userProfile?.platforms || []}
          />
        )}
        
        {/* Logout Confirmation Modal */}
        {showLogoutConfirm && (
          <LogoutConfirmationModal
            onConfirm={async () => {
              await signOut();
              setShowLogoutConfirm(false);
            }}
            onCancel={() => setShowLogoutConfirm(false)}
          />
        )}
      </div>
    );
  }
  
  return content;
};

export default CreatorDashboard;