import React from 'react';
import { Eye, DollarSign, Users, Calendar, Flag, BarChart2, TrendingUp, MessageSquare } from 'lucide-react';
import { formatMoney } from '@/utils/format';

const AdminOverview: React.FC = () => {
  return (
    <div className="space-y-8">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-black/40 border border-gray-800 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Users className="h-5 w-5 text-blue-400" />
            <h3 className="text-sm text-gray-400">Active Creators</h3>
          </div>
          <div className="flex justify-between items-end">
            <p className="text-2xl font-bold">1,245</p>
            <div className="flex items-center text-sm text-green-400">
              <TrendingUp className="h-4 w-4 mr-1" />
              <span>+12%</span>
            </div>
          </div>
        </div>
        
        <div className="p-4 bg-black/40 border border-gray-800 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="h-5 w-5 text-green-400" />
            <h3 className="text-sm text-gray-400">Platform Revenue</h3>
          </div>
          <div className="flex justify-between items-end">
            <p className="text-2xl font-bold">${formatMoney(284500)}</p>
            <div className="flex items-center text-sm text-green-400">
              <TrendingUp className="h-4 w-4 mr-1" />
              <span>+24%</span>
            </div>
          </div>
        </div>
        
        <div className="p-4 bg-black/40 border border-gray-800 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="h-5 w-5 text-purple-400" />
            <h3 className="text-sm text-gray-400">Active Campaigns</h3>
          </div>
          <div className="flex justify-between items-end">
            <p className="text-2xl font-bold">48</p>
            <div className="flex items-center text-sm text-green-400">
              <TrendingUp className="h-4 w-4 mr-1" />
              <span>+8%</span>
            </div>
          </div>
        </div>
        
        <div className="p-4 bg-black/40 border border-gray-800 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Eye className="h-5 w-5 text-red-400" />
            <h3 className="text-sm text-gray-400">Total Views</h3>
          </div>
          <div className="flex justify-between items-end">
            <p className="text-2xl font-bold">28.3M</p>
            <div className="flex items-center text-sm text-green-400">
              <TrendingUp className="h-4 w-4 mr-1" />
              <span>+35%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Action Items */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Content Review Queue */}
        <div className="p-6 bg-black/40 border border-gray-800 rounded-lg">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Eye className="h-5 w-5 text-blue-400" />
            Content Review Queue
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-2xl font-bold">24</p>
                <p className="text-sm text-gray-400">Pending Reviews</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-red-400">5</p>
                <p className="text-sm text-gray-400">Urgent</p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span>TikTok</span>
                <span className="font-medium">12 pending</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span>Instagram</span>
                <span className="font-medium">8 pending</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span>YouTube</span>
                <span className="font-medium">4 pending</span>
              </div>
            </div>
          </div>
        </div>

        {/* Support Queue */}
        <div className="p-6 bg-black/40 border border-gray-800 rounded-lg">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-yellow-400" />
            Support Queue
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-2xl font-bold">18</p>
                <p className="text-sm text-gray-400">Open Tickets</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-yellow-400">3</p>
                <p className="text-sm text-gray-400">High Priority</p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span>Payment Issues</span>
                <span className="font-medium">6 open</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span>Technical Support</span>
                <span className="font-medium">8 open</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span>Account Issues</span>
                <span className="font-medium">4 open</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Platform Health */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Campaign Performance */}
        <div className="p-6 bg-black/40 border border-gray-800 rounded-lg">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <BarChart2 className="h-5 w-5 text-purple-400" />
            Campaign Performance
          </h3>
          <div className="space-y-4">
            <div>
              <p className="text-2xl font-bold">48</p>
              <p className="text-sm text-gray-400">Active Campaigns</p>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span>Avg. Engagement</span>
                <span className="font-medium">5.2%</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span>Completion Rate</span>
                <span className="font-medium">94%</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span>Avg. Views/Post</span>
                <span className="font-medium">245K</span>
              </div>
            </div>
          </div>
        </div>

        {/* User Growth */}
        <div className="p-6 bg-black/40 border border-gray-800 rounded-lg">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Users className="h-5 w-5 text-green-400" />
            User Growth
          </h3>
          <div className="space-y-4">
            <div>
              <p className="text-2xl font-bold">+124</p>
              <p className="text-sm text-gray-400">New Users Today</p>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span>Creators</span>
                <span className="font-medium">+85</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span>Brands</span>
                <span className="font-medium">+39</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span>Verification Rate</span>
                <span className="font-medium">82%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Safety & Trust */}
        <div className="p-6 bg-black/40 border border-gray-800 rounded-lg">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Flag className="h-5 w-5 text-red-400" />
            Safety & Trust
          </h3>
          <div className="space-y-4">
            <div>
              <p className="text-2xl font-bold text-green-400">98.5%</p>
              <p className="text-sm text-gray-400">Content Safety Score</p>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span>Content Flags</span>
                <span className="font-medium">12 pending</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span>Account Warnings</span>
                <span className="font-medium">5 issued</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span>Trust Score</span>
                <span className="font-medium">94%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminOverview;