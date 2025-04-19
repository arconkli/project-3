import { memo } from 'react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell
} from 'recharts';
import {
  Eye, DollarSign, Users, Calendar, TrendingUp,
  Target, Info
} from 'lucide-react';
import CustomTooltip from './CustomTooltip';

// Sample data
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

const COLORS = ['#FF4444', '#4287f5', '#31a952', '#b026ff'];

const AnalyticsView = memo(() => {
  return (
    <div className="space-y-10">
      {/* Views and Earnings Charts */}
      <section aria-labelledby="analytics-charts" className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <h2 id="analytics-charts" className="sr-only">Analytics Charts</h2>
        
        {/* Views Chart */}
        <div className="p-6 rounded-lg bg-black/40 border border-gray-800 hover:border-gray-700 transition-colors">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold flex items-center gap-2 text-white">
              <Eye className="h-5 w-5 text-blue-400" aria-hidden="true" />
              Views Over Time
            </h3>
            <select
              className="px-3 py-1 bg-transparent border border-gray-700 rounded text-sm focus:outline-none focus:border-blue-500 text-gray-300"
              aria-label="Select view type"
            >
              <option value="total">Total Views</option>
              <option value="platform">By Platform</option>
            </select>
          </div>

          <div className="h-64" role="img" aria-label="Line chart showing view count trends over time">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={viewsData} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis
                  dataKey="date"
                  stroke="#9CA3AF"
                  tick={{ fill: '#9CA3AF' }}
                  dy={8}
                  tickMargin={8}
                />
                <YAxis
                  stroke="#9CA3AF"
                  tick={{ fill: '#9CA3AF' }}
                  tickFormatter={(value) => `${value}M`}
                  tickMargin={8}
                />
                <Tooltip content={<CustomTooltip />} />
                <Line
                  type="monotone"
                  dataKey="views"
                  name="Views"
                  stroke="#4287f5"
                  strokeWidth={3}
                  dot={{ fill: '#FFFFFF', r: 4, strokeWidth: 2 }}
                  activeDot={{ r: 6, fill: '#4287f5' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Earnings Chart */}
        <div className="p-6 rounded-lg bg-black/40 border border-gray-800 hover:border-gray-700 transition-colors">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold flex items-center gap-2 text-white">
              <DollarSign className="h-5 w-5 text-green-400" aria-hidden="true" />
              Earnings Over Time
            </h3>
            <select
              className="px-3 py-1 bg-transparent border border-gray-700 rounded text-sm focus:outline-none focus:border-green-500 text-gray-300"
              aria-label="Select earnings view"
            >
              <option value="total">Total Earnings</option>
              <option value="campaign">By Campaign</option>
            </select>
          </div>

          <div className="h-64" role="img" aria-label="Bar chart showing earnings trends over time">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={viewsData} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis
                  dataKey="date"
                  stroke="#9CA3AF"
                  tick={{ fill: '#9CA3AF' }}
                  dy={8}
                  tickMargin={8}
                />
                <YAxis
                  stroke="#9CA3AF"
                  tick={{ fill: '#9CA3AF' }}
                  tickFormatter={(value) => `$${value / 1000}k`}
                  tickMargin={8}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar
                  dataKey="earnings"
                  name="Earnings"
                  fill="#31a952"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      {/* Platform Breakdown */}
      <section aria-labelledby="platform-breakdown" className="p-6 rounded-lg bg-black/40 border border-gray-800 hover:border-gray-700 transition-colors">
        <h2 id="platform-breakdown" className="text-xl font-bold mb-6 text-white">Platform Breakdown</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Pie Chart */}
          <div className="h-64" role="img" aria-label="Pie chart showing distribution of views across platforms">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={platformData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  dataKey="percentage"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {platformData.map((entry) => (
                    <Cell key={entry.platform} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Platform Stats */}
          <div className="space-y-4">
            {platformData.map((platform) => (
              <div
                key={platform.platform}
                className="p-4 rounded-lg bg-white/5 border border-gray-800 flex items-center justify-between"
                role="listitem"
              >
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: platform.color }} />
                  <span className="font-medium text-gray-300">{platform.platform}</span>
                </div>
                <div className="text-right">
                  <p className="font-bold text-white">{platform.views}M</p>
                  <p className="text-sm text-gray-400">{platform.percentage}%</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Demographics */}
      <section className="p-6 rounded-lg bg-black/40 border border-gray-800">
        <h3 className="text-xl font-bold mb-6 flex items-center gap-2 text-white">
          <Users className="h-5 w-5 text-purple-400" />
          Audience Demographics
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-4 bg-black/20 border border-gray-800 rounded-lg">
            <h4 className="font-medium mb-4">Age Distribution</h4>
            <div className="space-y-3">
              {[
                { age: '18-24', percentage: 42 },
                { age: '25-34', percentage: 35 },
                { age: '35-44', percentage: 15 },
                { age: '45+', percentage: 8 }
              ].map((group) => (
                <div key={group.age}>
                  <div className="flex justify-between text-sm mb-1">
                    <span>{group.age}</span>
                    <span>{group.percentage}%</span>
                  </div>
                  <div className="w-full h-2 bg-gray-800 rounded-full">
                    <div 
                      className="h-full bg-red-500 rounded-full"
                      style={{ width: `${group.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="p-4 bg-black/20 border border-gray-800 rounded-lg">
            <h4 className="font-medium mb-4">Gender Distribution</h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-black/40 border border-gray-800 rounded-lg text-center">
                <p className="text-xs text-gray-400">Female</p>
                <p className="text-xl font-bold">62%</p>
              </div>
              <div className="p-3 bg-black/40 border border-gray-800 rounded-lg text-center">
                <p className="text-xs text-gray-400">Male</p>
                <p className="text-xl font-bold">38%</p>
              </div>
            </div>
          </div>

          <div className="p-4 bg-black/20 border border-gray-800 rounded-lg">
            <h4 className="font-medium mb-4">Top Locations</h4>
            <div className="space-y-3">
              {[
                { country: 'United States', percentage: 65 },
                { country: 'United Kingdom', percentage: 12 },
                { country: 'Canada', percentage: 8 },
                { country: 'Australia', percentage: 6 },
                { country: 'Other', percentage: 9 }
              ].map((location) => (
                <div key={location.country} className="flex justify-between items-center">
                  <span>{location.country}</span>
                  <span className="font-medium">{location.percentage}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
});

AnalyticsView.displayName = 'AnalyticsView';

export default AnalyticsView;