import React from 'react';
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from 'recharts';
import { DollarSign, Eye, TrendingUp, Users, Calendar, Target } from 'lucide-react';

// Sample data for charts
const viewsData = [
  { date: '2024-01', views: 1200000 },
  { date: '2024-02', views: 1500000 },
  { date: '2024-03', views: 1800000 },
  { date: '2024-04', views: 2200000 },
  { date: '2024-05', views: 2500000 },
  { date: '2024-06', views: 2800000 },
];

const earningsData = [
  { date: '2024-01', earnings: 1200 },
  { date: '2024-02', views: 1500 },
  { date: '2024-03', views: 1800 },
  { date: '2024-04', views: 2200 },
  { date: '2024-05', views: 2500 },
  { date: '2024-06', views: 2800 },
];

const AnalyticsView: React.FC = () => {
  return (
    <div className="space-y-8">
      {/* Performance Overview */}
      <section className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="p-6 rounded-lg bg-black border border-gray-800">
          <div className="flex items-center gap-3 mb-3">
            <Eye className="h-6 w-6 text-blue-400" />
            <span className="text-gray-400">Total Views</span>
          </div>
          <div className="flex justify-between items-end">
            <p className="text-3xl font-bold text-white">28.3M</p>
            <div className="text-sm flex items-center gap-1 text-green-400">
              <TrendingUp className="h-4 w-4" />
              <span>+14%</span>
            </div>
          </div>
        </div>

        <div className="p-6 rounded-lg bg-black border border-gray-800">
          <div className="flex items-center gap-3 mb-3">
            <DollarSign className="h-6 w-6 text-green-400" />
            <span className="text-gray-400">Total Earnings</span>
          </div>
          <div className="flex justify-between items-end">
            <p className="text-3xl font-bold text-white">$74,600</p>
            <div className="text-sm flex items-center gap-1 text-green-400">
              <TrendingUp className="h-4 w-4" />
              <span>+23%</span>
            </div>
          </div>
        </div>

        <div className="p-6 rounded-lg bg-black border border-gray-800">
          <div className="flex items-center gap-3 mb-3">
            <Users className="h-6 w-6 text-purple-400" />
            <span className="text-gray-400">Engagement Rate</span>
          </div>
          <div className="flex justify-between items-end">
            <p className="text-3xl font-bold text-white">4.2%</p>
            <div className="text-sm flex items-center gap-1 text-green-400">
              <TrendingUp className="h-4 w-4" />
              <span>+2%</span>
            </div>
          </div>
        </div>

        <div className="p-6 rounded-lg bg-black border border-gray-800">
          <div className="flex items-center gap-3 mb-3">
            <Target className="h-6 w-6 text-yellow-400" />
            <span className="text-gray-400">Campaign Success</span>
          </div>
          <div className="flex justify-between items-end">
            <p className="text-3xl font-bold text-white">92%</p>
            <div className="text-sm flex items-center gap-1 text-green-400">
              <TrendingUp className="h-4 w-4" />
              <span>+5%</span>
            </div>
          </div>
        </div>
      </section>

      {/* Views Over Time Chart */}
      <section className="p-6 rounded-lg bg-black border border-gray-800">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-white">Views Over Time</h3>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-gray-400" />
            <span className="text-sm text-gray-400">Last 6 months</span>
          </div>
        </div>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={viewsData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
              <XAxis 
                dataKey="date" 
                stroke="#9ca3af"
                tick={{ fill: '#9ca3af' }}
              />
              <YAxis 
                stroke="#9ca3af"
                tick={{ fill: '#9ca3af' }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#111827',
                  border: '1px solid #374151',
                  borderRadius: '0.5rem',
                  color: '#fff'
                }}
                labelStyle={{ color: '#9ca3af' }}
              />
              <Line
                type="monotone"
                dataKey="views"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={{ fill: '#3b82f6', strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Earnings Chart */}
      <section className="p-6 rounded-lg bg-black border border-gray-800">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-white">Earnings Over Time</h3>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-gray-400" />
            <span className="text-sm text-gray-400">Last 6 months</span>
          </div>
        </div>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={earningsData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
              <XAxis 
                dataKey="date" 
                stroke="#9ca3af"
                tick={{ fill: '#9ca3af' }}
              />
              <YAxis 
                stroke="#9ca3af"
                tick={{ fill: '#9ca3af' }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#111827',
                  border: '1px solid #374151',
                  borderRadius: '0.5rem',
                  color: '#fff'
                }}
                labelStyle={{ color: '#9ca3af' }}
              />
              <Bar dataKey="earnings" fill="#10b981" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Platform Performance */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 rounded-lg bg-black border border-gray-800">
          <h3 className="text-xl font-bold text-white mb-6">Platform Performance</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
                  <span className="text-blue-400">T</span>
                </div>
                <span className="text-gray-300">TikTok</span>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold text-white">15.2M</p>
                <p className="text-sm text-gray-400">views</p>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-pink-500/20 flex items-center justify-center">
                  <span className="text-pink-400">I</span>
                </div>
                <span className="text-gray-300">Instagram</span>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold text-white">8.5M</p>
                <p className="text-sm text-gray-400">views</p>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center">
                  <span className="text-red-400">Y</span>
                </div>
                <span className="text-gray-300">YouTube</span>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold text-white">4.6M</p>
                <p className="text-sm text-gray-400">views</p>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 rounded-lg bg-black border border-gray-800">
          <h3 className="text-xl font-bold text-white mb-6">Content Type Performance</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
                  <span className="text-green-400">O</span>
                </div>
                <span className="text-gray-300">Original Content</span>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold text-white">18.3M</p>
                <p className="text-sm text-gray-400">views</p>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
                  <span className="text-blue-400">R</span>
                </div>
                <span className="text-gray-300">Repurposed Content</span>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold text-white">10M</p>
                <p className="text-sm text-gray-400">views</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AnalyticsView; 