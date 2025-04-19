import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell, Legend,
  ComposedChart, Area
} from 'recharts';
import {
  Eye, DollarSign, Users, Calendar, TrendingUp,
  Target, Info, Layers, Download, Activity, BarChartIcon,
  Filter, Heart, Share2, MessageCircle, ThumbsUp
} from 'lucide-react';
import CustomTooltip from '@/components/CustomTooltip';
import { activeCampaigns } from '@/data/campaigns';

// Sample data
const viewsData = [
  { date: 'Jan', engagement_rate: 3.2, views: 1200000, likes: 85000, comments: 12000, shares: 8500, saves: 4200 },
  { date: 'Feb', engagement_rate: 3.8, views: 1800000, likes: 120000, comments: 18000, shares: 12000, saves: 6800 },
  { date: 'Mar', engagement_rate: 4.5, views: 2400000, likes: 180000, comments: 24000, shares: 15000, saves: 8500 },
  { date: 'Apr', engagement_rate: 5.2, views: 3100000, likes: 240000, comments: 31000, shares: 18500, saves: 12000 },
  { date: 'May', engagement_rate: 4.8, views: 3800000, likes: 280000, comments: 38000, shares: 22000, saves: 15500 },
  { date: 'Jun', engagement_rate: 5.5, views: 4200000, likes: 320000, comments: 42000, shares: 25000, saves: 18000 }
];

const platformData = [
  { platform: 'TikTok', engagement: 5.8, percentage: 45, color: '#69C9D0' },
  { platform: 'Instagram', engagement: 4.2, percentage: 30, color: '#E1306C' },
  { platform: 'YouTube', engagement: 3.9, percentage: 15, color: '#FF0000' },
  { platform: 'X', engagement: 3.5, percentage: 10, color: '#1DA1F2' }
];

const contentDistributionData = [
  { type: 'Original', engagement_rate: 5.2, views: 2400000, creators: 12 },
  { type: 'Repurposed', engagement_rate: 4.1, views: 1800000, creators: 8 },
  { type: 'Brand-Supplied', engagement_rate: 3.8, views: 800000, creators: 4 }
];

const COLORS = ['#FF4444', '#4287f5', '#31a952', '#b026ff'];

const BrandAnalytics = () => {
  const [timeFilter, setTimeFilter] = useState('6M');
  const [selectedCampaign, setSelectedCampaign] = useState('all');
  const [showExportModal, setShowExportModal] = useState(false);
  const [selectedCampaignForExport, setSelectedCampaignForExport] = useState<string | null>(null);

  const completedCampaigns = activeCampaigns.filter(c => c.status === 'completed');
  
  // Memoize filtered campaigns
  const filteredCampaigns = useMemo(() => {
    if (selectedCampaign === 'all') return activeCampaigns;
    return activeCampaigns.filter(c => c.id === selectedCampaign);
  }, [selectedCampaign, activeCampaigns]);
  
  // Memoize chart data based on filtered campaigns
  const chartData = useMemo(() => {
    if (selectedCampaign === 'all') return viewsData;
    const campaign = filteredCampaigns[0];
    if (!campaign) return viewsData;
    
    // Generate campaign-specific data
    return viewsData.map(data => ({
      ...data,
      views: data.views * (campaign.views / 4200000), // Scale based on campaign performance
      engagement_rate: data.engagement_rate * (campaign.engagement_rate || 1) / 5.5
    }));
  }, [selectedCampaign, filteredCampaigns]);

  const handleExportAnalytics = (campaignId: string) => {
    // In a real app, this would trigger an API call to generate and download the report
    console.log(`Exporting analytics for campaign ${campaignId}`);
    // Simulate download delay
    setTimeout(() => {
      setShowExportModal(false);
      setSelectedCampaignForExport(null);
    }, 1500);
  };

  return (
    <div className="space-y-8">
      {/* Campaign Filter */}
      <div className="flex items-center justify-between gap-4 p-4 bg-black/40 border border-gray-800 rounded-lg">
        <div className="flex items-center gap-3">
          <Filter className="h-5 w-5 text-gray-400" />
          <select
            value={selectedCampaign}
            onChange={(e) => setSelectedCampaign(e.target.value)}
            className="bg-transparent border border-gray-700 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            <option value="all">All Campaigns</option>
            {activeCampaigns.map(campaign => (
              <option key={campaign.id} value={campaign.id}>{campaign.title}</option>
            ))}
          </select>
        </div>

        {completedCampaigns.length > 0 && (
          <button
            onClick={() => setShowExportModal(true)}
            className="px-4 py-2 border border-gray-700 rounded-lg hover:bg-white/5 transition-colors flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Export Analytics
          </button>
        )}
      </div>

      <div className="p-6 bg-black/40 border border-gray-800 rounded-lg">
        {/* Engagement Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="p-4 bg-black/20 border border-gray-700 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Heart className="h-5 w-5 text-red-400" />
              <h4 className="font-medium">Total Likes</h4>
            </div>
            <p className="text-2xl font-bold">1.2M</p>
            <p className="text-sm text-gray-400 mt-1">+24% from last month</p>
          </div>
          
          <div className="p-4 bg-black/20 border border-gray-700 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <MessageCircle className="h-5 w-5 text-blue-400" />
              <h4 className="font-medium">Comments</h4>
            </div>
            <p className="text-2xl font-bold">165K</p>
            <p className="text-sm text-gray-400 mt-1">+18% from last month</p>
          </div>
          
          <div className="p-4 bg-black/20 border border-gray-700 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Share2 className="h-5 w-5 text-green-400" />
              <h4 className="font-medium">Shares</h4>
            </div>
            <p className="text-2xl font-bold">101K</p>
            <p className="text-sm text-gray-400 mt-1">+32% from last month</p>
          </div>
          
          <div className="p-4 bg-black/20 border border-gray-700 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <ThumbsUp className="h-5 w-5 text-purple-400" />
              <h4 className="font-medium">Saves</h4>
            </div>
            <p className="text-2xl font-bold">65K</p>
            <p className="text-sm text-gray-400 mt-1">+28% from last month</p>
          </div>
        </div>

        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-red-400" />
            Engagement Rate Over Time
          </h3>
          
          <div className="flex items-center gap-3">
            <select 
              className="bg-transparent border border-gray-700 rounded p-2 text-sm"
              value={timeFilter}
              onChange={(e) => setTimeFilter(e.target.value)}
            >
              <option value="30D">Last 30 Days</option>
              <option value="3M">Last 3 Months</option>
              <option value="6M">Last 6 Months</option>
              <option value="1Y">Last Year</option>
            </select>
          </div>
        </div>
        
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData}>
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
                yAxisId="rate"
                orientation="right"
                tickFormatter={(value) => `${value}%`}
              />
              <YAxis 
                stroke="#9CA3AF"
                tick={{ fill: '#FFFFFF' }}
                yAxisId="count"
                tickFormatter={(value) => `${value / 1000}k`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Area 
                type="monotone" 
                dataKey="likes" 
                name="Likes"
                fill="#ef4444"
                fillOpacity={0.1}
                stroke="#ef4444"
                yAxisId="count"
              />
              <Area 
                type="monotone" 
                dataKey="comments" 
                name="Comments"
                fill="#3b82f6"
                fillOpacity={0.1}
                stroke="#3b82f6"
                yAxisId="count"
              />
              <Area 
                type="monotone" 
                dataKey="shares" 
                name="Shares"
                fill="#22c55e"
                fillOpacity={0.1}
                stroke="#22c55e"
                yAxisId="count"
              />
              <Line 
                type="monotone" 
                dataKey="engagement_rate" 
                name="Engagement Rate"
                stroke="#4287f5"
                strokeWidth={3}
                dot={{ fill: '#FFFFFF', r: 4 }}
                activeDot={{ r: 6, fill: '#4287f5' }}
                yAxisId="rate"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 bg-black/40 border border-gray-800 rounded-lg">
          <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
            <BarChartIcon className="h-5 w-5 text-yellow-400" />
            Campaign Comparison
          </h3>
          
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart 
                data={activeCampaigns.filter(c => c.status === 'active').map(c => ({
                  name: c.title,
                  views: c.views / 1000000,
                  engagement: c.engagement_rate
                }))}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis type="number" stroke="#9CA3AF" tick={{ fill: '#FFFFFF' }} />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  stroke="#9CA3AF" 
                  tick={{ fill: '#FFFFFF' }}
                  width={150}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="views" name="Views (M)" fill="#4287f5" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        <div className="p-6 bg-black/40 border border-gray-800 rounded-lg">
          <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
            <Target className="h-5 w-5 text-green-400" />
            Engagement by Platform
          </h3>
          
          <div className="grid grid-cols-2 gap-6">
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
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 bg-black/40 border border-gray-800 rounded-lg col-span-full md:col-span-1">
          <h3 className="text-lg font-medium mb-4">Demographic Insights</h3>
          
          <div className="space-y-4">
            <div>
              <h4 className="text-sm text-gray-400 mb-2">Age Distribution</h4>
              <div className="space-y-2">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>18-24</span>
                    <span>42%</span>
                  </div>
                  <div className="w-full h-2 bg-gray-800 rounded-full">
                    <div className="h-full bg-red-500 rounded-full" style={{ width: '42%' }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>25-34</span>
                    <span>35%</span>
                  </div>
                  <div className="w-full h-2 bg-gray-800 rounded-full">
                    <div className="h-full bg-red-500 rounded-full" style={{ width: '35%' }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>35-44</span>
                    <span>15%</span>
                  </div>
                  <div className="w-full h-2 bg-gray-800 rounded-full">
                    <div className="h-full bg-red-500 rounded-full" style={{ width: '15%' }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>45+</span>
                    <span>8%</span>
                  </div>
                  <div className="w-full h-2 bg-gray-800 rounded-full">
                    <div className="h-full bg-red-500 rounded-full" style={{ width: '8%' }}></div>
                  </div>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="text-sm text-gray-400 mb-2">Gender Distribution</h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-black/20 border border-gray-800 rounded-lg text-center">
                  <p className="text-xs text-gray-400">Female</p>
                  <p className="text-xl font-bold">62%</p>
                </div>
                <div className="p-3 bg-black/20 border border-gray-800 rounded-lg text-center">
                  <p className="text-xs text-gray-400">Male</p>
                  <p className="text-xl font-bold">38%</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="p-6 bg-black/40 border border-gray-800 rounded-lg col-span-full md:col-span-2">
          <h3 className="text-lg font-medium mb-4">Geographic Distribution</h3>
          
          <div className="space-y-3">
            <div className="p-3 bg-black/20 border border-gray-800 rounded-lg">
              <div className="flex justify-between items-center">
                <span>United States</span>
                <span className="font-medium">65%</span>
              </div>
              <div className="w-full h-2 bg-gray-800 rounded-full mt-1">
                <div className="h-full bg-blue-500 rounded-full" style={{ width: '65%' }}></div>
              </div>
            </div>
            
            <div className="p-3 bg-black/20 border border-gray-800 rounded-lg">
              <div className="flex justify-between items-center">
                <span>United Kingdom</span>
                <span className="font-medium">12%</span>
              </div>
              <div className="w-full h-2 bg-gray-800 rounded-full mt-1">
                <div className="h-full bg-blue-500 rounded-full" style={{ width: '12%' }}></div>
              </div>
            </div>
            
            <div className="p-3 bg-black/20 border border-gray-800 rounded-lg">
              <div className="flex justify-between items-center">
                <span>Canada</span>
                <span className="font-medium">8%</span>
              </div>
              <div className="w-full h-2 bg-gray-800 rounded-full mt-1">
                <div className="h-full bg-blue-500 rounded-full" style={{ width: '8%' }}></div>
              </div>
            </div>
            
            <div className="p-3 bg-black/20 border border-gray-800 rounded-lg">
              <div className="flex justify-between items-center">
                <span>Australia</span>
                <span className="font-medium">6%</span>
              </div>
              <div className="w-full h-2 bg-gray-800 rounded-full mt-1">
                <div className="h-full bg-blue-500 rounded-full" style={{ width: '6%' }}></div>
              </div>
            </div>
            
            <div className="p-3 bg-black/20 border border-gray-800 rounded-lg">
              <div className="flex justify-between items-center">
                <span>Other</span>
                <span className="font-medium">9%</span>
              </div>
              <div className="w-full h-2 bg-gray-800 rounded-full mt-1">
                <div className="h-full bg-blue-500 rounded-full" style={{ width: '9%' }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="p-6 bg-black/40 border border-gray-800 rounded-lg">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium">Analytics Report</h3>
          <button className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex items-center gap-2">
            <Download className="h-4 w-4" />
            Export Full Report
          </button>
        </div>
        
        <div className="p-4 bg-black/20 border border-gray-800 rounded-lg">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm">
                <span className="font-medium">Analytics Overview:</span> Your campaigns are performing 24% better than industry average with TikTok driving the highest engagement. Consider allocating more budget to video-based content focused on the 18-24 age demographic for optimal results.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Export Modal */}
      <AnimatePresence>
        {showExportModal && (
          <motion.div 
            className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-80 backdrop-blur-sm z-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="bg-black/40 border border-gray-800 rounded-lg p-6 w-full max-w-md">
              <h3 className="text-xl font-bold mb-4">Export Campaign Analytics</h3>
              <p className="text-gray-400 mb-4">Select a completed campaign to export detailed analytics:</p>
              
              <div className="space-y-3">
                {completedCampaigns.map(campaign => (
                  <button
                    key={campaign.id}
                    onClick={() => setSelectedCampaignForExport(campaign.id)}
                    className={`w-full p-4 border rounded-lg text-left transition-colors ${
                      selectedCampaignForExport === campaign.id
                        ? 'border-red-500 bg-red-900/20'
                        : 'border-gray-700 hover:border-gray-500'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium">{campaign.title}</p>
                        <div className="flex items-center gap-4 text-sm text-gray-400">
                          <span>{new Date(campaign.endDate).toLocaleDateString()}</span>
                          <div className="flex items-center gap-2">
                            <Heart className="h-4 w-4 text-red-400" />
                            <span>{(campaign.views * 0.08).toLocaleString()} likes</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <MessageCircle className="h-4 w-4 text-blue-400" />
                            <span>{(campaign.views * 0.01).toLocaleString()} comments</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Share2 className="h-4 w-4 text-green-400" />
                            <span>{(campaign.views * 0.006).toLocaleString()} shares</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{campaign.views.toLocaleString()} views</p>
                        <p className="text-sm text-gray-400">{campaign.engagement_rate}% engagement</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
              
              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setShowExportModal(false)}
                  className="px-4 py-2 border border-gray-700 rounded-lg hover:bg-white/5"
                >
                  Cancel
                </button>
                <button
                  onClick={() => selectedCampaignForExport && handleExportAnalytics(selectedCampaignForExport)}
                  disabled={!selectedCampaignForExport}
                  className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
                    selectedCampaignForExport
                      ? 'bg-red-600 hover:bg-red-700'
                      : 'bg-gray-800 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  <Download className="h-4 w-4" />
                  Export
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default BrandAnalytics;