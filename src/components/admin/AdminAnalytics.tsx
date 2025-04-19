import React, { useState } from 'react';
import { TrendingUp, DollarSign, Users, Eye } from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell
} from 'recharts';
import CustomTooltip from '@/components/CustomTooltip';

// Sample data for charts
const viewsData = [
  { date: 'Jan', views: 2.1, earnings: 4200 },
  { date: 'Feb', views: 3.4, earnings: 6800 },
  { date: 'Mar', views: 4.2, earnings: 8400 },
  { date: 'Apr', views: 6.8, earnings: 13600 },
  { date: 'May', views: 8.5, earnings: 17000 },
  { date: 'Jun', views: 12.3, earnings: 24600 }
];

const platformData = [
  { platform: 'TikTok', views: 14.5, percentage: 51, color: '#69C9D0' },
  { platform: 'Instagram', views: 8.3, percentage: 29, color: '#E1306C' },
  { platform: 'YouTube', views: 4.2, percentage: 15, color: '#FF0000' },
  { platform: 'X', views: 1.3, percentage: 5, color: '#1DA1F2' }
];

const AdminAnalytics: React.FC = () => {
  const [timeframe, setTimeframe] = useState('7d');

  return (
    <div className="space-y-8">
      {/* Analytics Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-black border border-gray-800 rounded-lg">
        <h2 className="text-xl font-bold">Platform Analytics</h2>
        <div className="flex items-center gap-3">
          <select 
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value)}
            className="px-3 py-2 bg-black border border-gray-700 rounded-lg"
          >
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
            <option value="all">All Time</option>
          </select>
        </div>
      </div>

      {/* Content Performance */}
      <div className="grid grid-cols-1 gap-6">
        <div className="p-4 bg-black border border-gray-800 rounded-lg">
          <h3 className="text-lg font-bold mb-4">Content Performance</h3>
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-400">Avg. Views</p>
                <p className="text-2xl font-bold">2.8M</p>
                <div className="flex items-center text-sm text-green-400">
                  <TrendingUp className="h-4 w-4 mr-1" />
                  <span>+24%</span>
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-400">Avg. Engagement</p>
                <p className="text-2xl font-bold">5.2%</p>
                <div className="flex items-center text-sm text-green-400">
                  <TrendingUp className="h-4 w-4 mr-1" />
                  <span>+12%</span>
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-400">Total Revenue</p>
                <p className="text-2xl font-bold">$74.6K</p>
                <div className="flex items-center text-sm text-green-400">
                  <TrendingUp className="h-4 w-4 mr-1" />
                  <span>+28%</span>
                </div>
              </div>
            </div>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={viewsData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis 
                    dataKey="date" 
                    stroke="#9CA3AF" 
                    tick={{ fill: '#FFFFFF' }}
                    dy={10}
                  />
                  <YAxis 
                    stroke="#9CA3AF"
                    tick={{ fill: '#FFFFFF' }}
                    yAxisId="views"
                    tickFormatter={(value) => `${value}M`}
                  />
                  <YAxis 
                    stroke="#9CA3AF"
                    tick={{ fill: '#FFFFFF' }}
                    yAxisId="earnings"
                    orientation="right"
                    tickFormatter={(value) => `$${value}`}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Line 
                    type="monotone" 
                    dataKey="views" 
                    name="Views"
                    stroke="#4287f5"
                    strokeWidth={3}
                    yAxisId="views"
                    dot={{ fill: '#FFFFFF', r: 4 }}
                    activeDot={{ r: 6, fill: '#4287f5' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="earnings" 
                    name="Earnings"
                    stroke="#31a952"
                    strokeWidth={3}
                    yAxisId="earnings"
                    dot={{ fill: '#FFFFFF', r: 4 }}
                    activeDot={{ r: 6, fill: '#31a952' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="p-4 bg-black border border-gray-800 rounded-lg">
          <h3 className="text-lg font-bold mb-4">Platform Distribution</h3>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={platformData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        dataKey="percentage"
                        nameKey="platform"
                        label={({ name }) => name}
                      >
                        {platformData.map((entry) => (
                          <Cell key={`cell-${entry.platform}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="flex flex-col justify-center space-y-4">
                {platformData.map((platform) => (
                  <div key={platform.platform} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: platform.color }}></div>
                    <span>{platform.platform}</span>
                    <span className="ml-auto font-medium">{platform.percentage}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="p-4 bg-black border border-gray-800 rounded-lg">
          <h3 className="text-lg font-bold mb-4">Content Types</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span>Original Content</span>
              <span className="font-medium">65%</span>
            </div>
            <div className="w-full h-2 bg-gray-700 rounded-full">
              <div className="h-full w-[65%] bg-green-500 rounded-full"></div>
            </div>
            <div className="flex justify-between items-center">
              <span>Repurposed Content</span>
              <span className="font-medium">35%</span>
            </div>
            <div className="w-full h-2 bg-gray-700 rounded-full">
              <div className="h-full w-[35%] bg-blue-500 rounded-full"></div>
            </div>
          </div>
        </div>

        <div className="p-4 bg-black border border-gray-800 rounded-lg">
          <h3 className="text-lg font-bold mb-4">Demographics</h3>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-400 mb-2">Age Distribution</p>
              <div className="space-y-2">
                {[
                  { age: '18-24', percentage: 42 },
                  { age: '25-34', percentage: 35 },
                  { age: '35-44', percentage: 15 },
                  { age: '45+', percentage: 8 }
                ].map(group => (
                  <div key={group.age}>
                    <div className="flex justify-between text-sm mb-1">
                      <span>{group.age}</span>
                      <span>{group.percentage}%</span>
                    </div>
                    <div className="w-full h-2 bg-gray-700 rounded-full">
                      <div 
                        className="h-full bg-red-500 rounded-full"
                        style={{ width: `${group.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 bg-black border border-gray-800 rounded-lg">
          <h3 className="text-lg font-bold mb-4">Top Locations</h3>
          <div className="space-y-3">
            {[
              { country: 'United States', percentage: 45 },
              { country: 'United Kingdom', percentage: 15 },
              { country: 'Canada', percentage: 12 },
              { country: 'Australia', percentage: 8 },
              { country: 'Germany', percentage: 6 },
              { country: 'Other', percentage: 14 }
            ].map(location => (
              <div key={location.country} className="flex justify-between items-center">
                <span>{location.country}</span>
                <span className="font-medium">{location.percentage}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminAnalytics;