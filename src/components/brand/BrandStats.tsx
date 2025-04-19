import React from 'react';
import { Eye, DollarSign, Users, Calendar, TrendingUp } from 'lucide-react';

interface BrandStatsProps {
  stats: {
    views: string;
    spend: string;
    creators: number;
    campaigns: number;
  };
}

const BrandStats: React.FC<BrandStatsProps> = ({ stats }) => {
  return (
    <section aria-label="Performance overview" className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
      <div className="p-6 rounded-lg bg-black/40 border border-gray-800 hover:border-gray-700 transition-colors">
        <div className="flex items-center gap-3 mb-3">
          <TrendingUp className="h-6 w-6 text-blue-400" aria-hidden="true" />
          <span className="text-gray-400">Avg. Engagement Rate</span>
        </div>
        <div className="flex justify-between items-end">
          <p className="text-3xl font-bold text-white">{stats.engagement}%</p>
          <div className="text-sm flex items-center gap-1 text-green-400">
            <TrendingUp className="h-4 w-4" />
            <span>+24%</span>
          </div>
        </div>
      </div>

      <div className="p-6 rounded-lg bg-black/40 border border-gray-800 hover:border-gray-700 transition-colors">
        <div className="flex items-center gap-3 mb-3">
          <DollarSign className="h-6 w-6 text-green-400" />
          <span className="text-gray-400">Total Spend</span>
        </div>
        <div className="flex justify-between items-end">
          <p className="text-3xl font-bold text-white">{stats.spend}</p>
          <div className="text-sm flex items-center gap-1 text-green-400">
            <TrendingUp className="h-4 w-4" />
            <span>+12%</span>
          </div>
        </div>
      </div>

      <div className="p-6 rounded-lg bg-black/40 border border-gray-800 hover:border-gray-700 transition-colors">
        <div className="flex items-center gap-3 mb-3">
          <Users className="h-6 w-6 text-purple-400" />
          <span className="text-gray-400">Active Creators</span>
        </div>
        <div className="flex justify-between items-end">
          <p className="text-3xl font-bold text-white">{stats.creators}</p>
          <div className="text-sm flex items-center gap-1 text-green-400">
            <TrendingUp className="h-4 w-4" />
            <span>+8%</span>
          </div>
        </div>
      </div>

      <div className="p-6 rounded-lg bg-black/40 border border-gray-800 hover:border-gray-700 transition-colors">
        <div className="flex items-center gap-3 mb-3">
          <Calendar className="h-6 w-6 text-red-400" />
          <span className="text-gray-400">Active Campaigns</span>
        </div>
        <div className="flex justify-between items-end">
          <p className="text-3xl font-bold text-white">{stats.campaigns}</p>
          <div className="text-sm flex items-center gap-1 text-green-400">
            <TrendingUp className="h-4 w-4" />
            <span>+2</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default BrandStats;