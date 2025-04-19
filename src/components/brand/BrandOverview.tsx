import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Zap, Plus, Eye, DollarSign, TrendingUp, Target, Info, Layers,
  Calendar, Users, ArrowUpRight, ArrowRight, AlertTriangle
} from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts';
import { Campaign } from '@/types/brand';
import { formatNumber, formatMoney } from '@/utils/format';
import CustomTooltip from '@/components/CustomTooltip';
import BrandCampaignCard from './BrandCampaignCard';

const CREATOR_WIDTH = 256; // Width of each creator card
const CREATOR_GAP = 16; // Gap between creator cards
const CREATORS = [
  { name: 'Creator A', views: '2.1M', engagement: '6.8%', platform: 'TikTok' },
  { name: 'Creator B', views: '1.8M', engagement: '5.9%', platform: 'Instagram' },
  { name: 'Creator C', views: '1.5M', engagement: '5.2%', platform: 'YouTube' },
  { name: 'Creator D', views: '1.2M', engagement: '4.8%', platform: 'TikTok' },
  { name: 'Creator E', views: '1.0M', engagement: '4.5%', platform: 'Instagram' }
];

interface BrandOverviewProps {
  campaigns: Campaign[];
  onCreateCampaign: () => void;
  onViewCampaign: (campaign: Campaign) => void;
  onEditCampaign?: (campaign: Campaign) => void;
  onContinueDraft?: (campaign: Campaign) => void;
  onViewAllCampaigns: () => void;
  onSubmitForApproval?: (campaignId: string) => Promise<void>;
}

const BrandOverview: React.FC<BrandOverviewProps> = ({
  campaigns,
  onCreateCampaign,
  onViewCampaign,
  onEditCampaign,
  onContinueDraft,
  onViewAllCampaigns,
  onSubmitForApproval
}) => {
  const activeCampaigns = campaigns.filter(c => c.status === 'active');
  const [tickerPosition, setTickerPosition] = useState(0);
  const totalWidth = CREATORS.length * (CREATOR_WIDTH + CREATOR_GAP);

  // Auto-scroll ticker
  useEffect(() => {
    const interval = setInterval(() => {
      setTickerPosition(prev => {
        // When the first item is fully off-screen, reset position to create seamless loop
        if (prev <= -(CREATOR_WIDTH + CREATOR_GAP)) {
          return 0;
        }
        return prev - 1;
      });
    }, 20);
    return () => clearInterval(interval);
  }, []);

  // Display both active and draft campaigns in the overview
  const displayCampaigns = campaigns.filter(c => c.status === 'active' || c.status === 'draft');

  return (
    <div className="space-y-6">
      {/* Create Campaign CTA */}
      <div className="p-6 rounded-lg border border-red-500 bg-red-900/10 flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-start gap-4">
          <Zap className="h-8 w-8 text-red-400 flex-shrink-0" />
          <div>
            <h2 className="text-xl font-bold text-white mb-1">Launch Your Next Campaign</h2>
            <p className="text-gray-300">Reach your target audience through creator content and boost your brand visibility</p>
          </div>
        </div>
        <button
          onClick={onCreateCampaign}
          className="w-full md:w-auto px-6 py-3 bg-red-600 hover:bg-red-700 transition-colors text-white font-bold rounded-lg flex items-center justify-center gap-2"
          aria-label="Create a new campaign"
        >
          <Plus className="h-5 w-5" />
          Create Campaign
        </button>
      </div>
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-6 bg-black border border-gray-800 rounded-lg">
          <div className="flex items-center gap-3 mb-3">
            <TrendingUp className="h-6 w-6 text-blue-400" />
            <span className="text-gray-400">Avg. Engagement Rate</span>
          </div>
          <div className="flex justify-between items-end">
            <p className="text-3xl font-bold text-white">4.8%</p>
            <div className="text-sm flex items-center gap-1 text-green-400">
              <TrendingUp className="h-4 w-4" />
              <span>+24%</span>
            </div>
          </div>
        </div>

        <div className="p-6 bg-black border border-gray-800 rounded-lg">
          <div className="flex items-center gap-3 mb-3">
            <Users className="h-6 w-6 text-purple-400" />
            <span className="text-gray-400">Active Creators</span>
          </div>
          <div className="flex justify-between items-end">
            <p className="text-3xl font-bold text-white">24</p>
            <div className="text-sm flex items-center gap-1 text-green-400">
              <TrendingUp className="h-4 w-4" />
              <span>+8%</span>
            </div>
          </div>
        </div>

        <div className="p-6 bg-black border border-gray-800 rounded-lg">
          <div className="flex items-center gap-3 mb-3">
            <Eye className="h-6 w-6 text-red-400" />
            <span className="text-gray-400">Total Views</span>
          </div>
          <div className="flex justify-between items-end">
            <p className="text-3xl font-bold text-white">28.3M</p>
            <div className="text-sm flex items-center gap-1 text-green-400">
              <TrendingUp className="h-4 w-4" />
              <span>+35%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Active Campaigns */}
      <section aria-labelledby="active-campaigns">
        <div className="flex justify-between items-center mb-6">
          <h3 id="active-campaigns" className="text-xl font-bold flex items-center gap-2">
            <Zap className="h-5 w-5 text-red-400" />
            <span>Your Campaigns</span>
          </h3>
          
          <button
            onClick={onViewAllCampaigns}
            className="text-sm text-red-400 hover:text-red-300 flex items-center gap-1"
          >
            View All
            <ArrowUpRight className="h-4 w-4" />
          </button>
        </div>
        
        {displayCampaigns.length > 0 ? (
          <div className="space-y-4">
            {displayCampaigns
              .slice(0, 3)
              .map(campaign => (
                <BrandCampaignCard 
                  key={campaign.id}
                  campaign={campaign}
                  onView={() => onViewCampaign(campaign)}
                  onEdit={() => onEditCampaign ? onEditCampaign(campaign) : onViewCampaign(campaign)}
                  onContinueDraft={() => onContinueDraft ? onContinueDraft(campaign) : (onEditCampaign ? onEditCampaign(campaign) : onViewCampaign(campaign))}
                  viewMode="list"
                  onSubmitForApproval={onSubmitForApproval}
                />
              ))}
              
            {displayCampaigns.length > 3 && (
              <button 
                onClick={onViewAllCampaigns}
                className="w-full p-4 border border-dashed border-gray-700 hover:border-gray-500 rounded-lg flex items-center justify-center gap-2 transition-colors"
              >
                <Plus className="h-5 w-5" />
                <span>{displayCampaigns.length - 3} more campaigns</span>
              </button>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-64 border border-dashed border-gray-700 rounded-lg">
            <AlertTriangle className="h-12 w-12 text-gray-500 mb-3" aria-hidden="true" />
            <p className="text-center text-gray-400 mb-6">No active campaigns</p>
            <button
              onClick={onCreateCampaign}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 transition-colors rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
              aria-label="Create your first campaign"
            >
              Create Campaign
            </button>
          </div>
        )}
      </section>
      
      {/* Creator Performance */}
      <div className="p-6 bg-black border border-gray-800 rounded-lg overflow-hidden">
        <h3 className="text-lg font-medium mb-4">Top Performing Creators</h3>
        <div className="relative overflow-hidden">
          <div className="flex gap-4" style={{ width: `${totalWidth * 2}px` }}>
            {/* First set of creators */}
            <div 
              className="flex gap-4 animate-none"
              style={{ 
                transform: `translateX(${tickerPosition}px)`,
                transition: 'transform 0s linear'
              }}
            >
              {CREATORS.map((creator, i) => (
                <div 
                  key={i} 
                  className="flex-none w-64 p-3 bg-black border border-gray-800 rounded-lg"
                >
                  <div className="flex justify-between items-start mb-2">
                    <p className="font-medium">{creator.name}</p>
                    <span className="text-xs bg-green-900 text-green-400 px-2 py-0.5 rounded-full">
                      {creator.engagement}
                    </span>
                  </div>
                  <div className="flex justify-between items-end">
                    <p className="text-sm text-gray-400">{creator.platform}</p>
                    <p className="text-sm text-gray-400">{creator.views} views</p>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Duplicate set for seamless loop */}
            <div 
              className="flex gap-4 animate-none"
              style={{ 
                transform: `translateX(${tickerPosition}px)`,
                transition: 'transform 0s linear'
              }}
            >
              {CREATORS.map((creator, i) => (
                <div 
                  key={`dup-${i}`} 
                  className="flex-none w-64 p-3 bg-black border border-gray-800 rounded-lg"
                >
                  <div className="flex justify-between items-start mb-2">
                    <p className="font-medium">{creator.name}</p>
                    <span className="text-xs bg-green-900 text-green-400 px-2 py-0.5 rounded-full">
                      {creator.engagement}
                    </span>
                  </div>
                  <div className="flex justify-between items-end">
                    <p className="text-sm text-gray-400">{creator.platform}</p>
                    <p className="text-sm text-gray-400">{creator.views} views</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BrandOverview;