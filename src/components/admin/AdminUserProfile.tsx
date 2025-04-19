import React, { useState } from 'react';
import { X, Eye, Calendar, DollarSign, Check, AlertCircle, Youtube, Instagram, Twitter, FileText, ArrowUpRight, ChevronRight, Users, TrendingUp, Building, Mail, Phone, Globe, Flag, Wallet, BarChart2, ShieldAlert } from 'lucide-react';
import { formatMoney } from '@/utils/format';
import { Button } from '@/components/ui/Button';

interface AdminUserProfileProps {
  user: {
    id?: string;
    name: string;
    email: string;
    phone?: string;
    username: string;
    type: 'creator' | 'brand' | 'admin';
    status: 'active' | 'suspended' | 'pending' | 'banned';
    followers: string;
    joinDate: string;
    metrics: {
      totalViews: number;
      totalEarnings: number;
      avgEngagement?: number;
      completedCampaigns?: number;
      pendingReviews?: number;
      totalEarned: number;
      totalSpent?: number;
      avgEarningsPerCampaign: number;
      campaignCompletionRate: number;
      lastActive: string;
      contentQuality: number;
      violationCount: number;
      activeCreators?: number;
      accountAge?: string;
      avgCampaignBudget?: number;
      activeCampaigns?: number;
      totalRefunds?: number;
    };
    verificationLevel: 'none' | 'basic' | 'verified' | 'trusted';
    platforms: string[];
    recentActivity?: {
      type: string;
      description: string;
      timestamp: string;
    }[];
    connectedAccounts?: Array<{
      platform: string;
      username: string;
      followers: string;
      isVerified: boolean;
      addedDate: string;
      status: 'active' | 'suspended';
    }>;
    campaigns?: Array<{
      id: string;
      title: string;
      status: string;
      earned: number;
      views: number;
      startDate: string;
      endDate: string;
      platform: string;
      engagement?: number;
    }>;
    videos?: Array<{
      id: string;
      title: string;
      thumbnail: string;
      views: string;
      engagement: number;
      platform: string;
      status: 'approved' | 'pending' | 'rejected';
      campaignTitle?: string;
    }>;
    paymentHistory?: Array<{
      id: string;
      amount: number;
      date: string;
      status: 'completed' | 'pending' | 'failed';
      method: string;
      campaign?: string;
    }>;
    flags?: Array<{
      type: string;
      reason: string;
      date: string;
    }>;
    refundHistory?: Array<{
      amount: number;
      reason: string;
      date: string;
    }>;
    industry?: string;
    website?: string;
    contactName?: string;
    contactEmail?: string;
    contactPhone?: string;
  };
  onClose: () => void;
  onBanUser: (user: any) => void;
}

const AdminUserProfile: React.FC<AdminUserProfileProps> = ({ user, onClose, onBanUser }) => {
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isBanning, setIsBanning] = useState(false);
  const [showBanConfirm, setShowBanConfirm] = useState(false);

  const totalCampaignViews = user.campaigns?.reduce((sum, campaign) => sum + campaign.views, 0) || 0;
  const totalCampaignSpent = user.campaigns?.reduce((sum, campaign) => sum + campaign.earned, 0) || 0;
  const avgEngagementRate = user.campaigns?.reduce((sum, campaign) => sum + (campaign.engagement || 0), 0) / (user.campaigns?.length || 1);

  return (
    <div 
      className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50"
      onClick={onClose} 
      role="dialog" 
      aria-modal="true"
    >
      <div 
        className="bg-black/40 border border-gray-800 rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/10 z-10"
          aria-label="Close dialog"
        >
          <X className="h-6 w-6" />
        </button>
        <div className="flex items-center gap-4">
          <div className="h-20 w-20 rounded-full bg-gray-800 flex items-center justify-center text-2xl font-bold">
            {user.name.charAt(0)}
          </div>
          <div>
            <h2 className="text-2xl font-bold break-words">{user.name}</h2>
            <div className="flex items-center gap-2">
              <span className="font-medium">@{user.username}</span>
              {user.type === 'creator' && (
                <>
                  <span>•</span>
                  <span>{user.followers} followers</span>
                </>
              )}
            </div>
            <div className="flex items-center gap-4 text-sm text-gray-400">
              <span>Joined {user.joinDate}</span>
              <span>•</span>
              <span>Last active {user.metrics.lastActive}</span>
            </div>
          </div>
        </div>
        
        <div className="mt-6">
          {user.type === 'brand' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-black/20 border border-gray-700 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Eye className="h-5 w-5 text-blue-400" />
                  <h3 className="font-medium">Total Views</h3>
                </div>
                <p className="text-2xl font-bold">{user.metrics.totalViews.toLocaleString()}</p>
                <p className="text-sm text-gray-400">Across all campaigns</p>
              </div>
              
              <div className="p-4 bg-black/20 border border-gray-700 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="h-5 w-5 text-purple-400" />
                  <h3 className="font-medium">Active Campaigns</h3>
                </div>
                <p className="text-2xl font-bold">{user.metrics.activeCampaigns || 0}</p>
                <p className="text-sm text-gray-400">Currently running</p>
              </div>
              
              <div className="p-4 bg-black/20 border border-gray-700 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="h-5 w-5 text-green-400" />
                  <h3 className="font-medium">Avg. Engagement</h3>
                </div>
                <p className="text-2xl font-bold">{user.metrics.avgEngagement || 0}%</p>
                <p className="text-sm text-gray-400">Across all campaigns</p>
              </div>
            </div>
          )}
          
          {user.type === 'creator' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-black/20 border border-gray-700 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Eye className="h-5 w-5 text-blue-400" />
                  <h3 className="font-medium">Total Views</h3>
                </div>
                <p className="text-2xl font-bold">{user.metrics.totalViews.toLocaleString()}</p>
                <p className="text-sm text-gray-400">Across all platforms</p>
              </div>
              
              <div className="p-4 bg-black/20 border border-gray-700 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="h-5 w-5 text-green-400" />
                  <h3 className="font-medium">Total Earned</h3>
                </div>
                <p className="text-2xl font-bold">${formatMoney(user.metrics.totalEarned)}</p>
                <p className="text-sm text-gray-400">${formatMoney(user.metrics.avgEarningsPerCampaign)} avg per campaign</p>
              </div>
              
              <div className="p-4 bg-black/20 border border-gray-700 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="h-5 w-5 text-purple-400" />
                  <h3 className="font-medium">Campaign Stats</h3>
                </div>
                <p className="text-2xl font-bold">{user.metrics.completedCampaigns}</p>
                <p className="text-sm text-gray-400">{user.metrics.campaignCompletionRate}% completion rate</p>
              </div>
            </div>
          )}

          {/* Brand-specific Overview */}
          {user.type === 'brand' && (
            <div className="p-6 bg-black/20 border border-gray-700 rounded-lg">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Building className="h-5 w-5 text-blue-400" />
                Business Information
              </h3>
              
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-400">Industry</p>
                    <p className="font-medium">{user.industry || 'Not specified'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Website</p>
                    {user.website ? (
                      <a 
                        href={user.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:underline flex items-center gap-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {user.website}
                        <Globe className="h-4 w-4" />
                      </a>
                    ) : (
                      <p className="text-gray-500">Not provided</p>
                    )}
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Account Age</p>
                    <p className="font-medium">{user.metrics.accountAge}</p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-400">Primary Contact</p>
                    <p className="font-medium">{user.contactName || 'Not specified'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Contact Email</p>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-gray-400" />
                      <p className="font-medium">{user.contactEmail || 'Not provided'}</p>
                    </div>
                  </div>
                  {user.contactPhone && (
                    <div>
                      <p className="text-sm text-gray-400">Contact Phone</p>
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-gray-400" />
                        <p className="font-medium">{user.contactPhone}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Brand Performance Metrics */}
          {user.type === 'brand' && (
            <div className="p-6 bg-black/20 border border-gray-700 rounded-lg">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <BarChart2 className="h-5 w-5 text-yellow-400" />
                Performance Metrics
              </h3>
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-400">Avg. Campaign Budget</p>
                  <p className="text-xl font-bold">${formatMoney(user.metrics.avgCampaignBudget || 0)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Total Views</p>
                  <p className="text-xl font-bold">{user.metrics.totalViews.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Avg. Engagement</p>
                  <p className="text-xl font-bold">{user.metrics.avgEngagement || 0}%</p>
                </div>
              </div>
              
              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-black/40 border border-gray-700 rounded-lg">
                  <h4 className="font-medium mb-3">Campaign Distribution</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span>Active Campaigns</span>
                      <span className="font-medium">{user.metrics.activeCampaigns || 0}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Completed</span>
                      <span className="font-medium">{user.metrics.completedCampaigns || 0}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Pending Review</span>
                      <span className="font-medium">{user.metrics.pendingReviews || 0}</span>
                    </div>
                  </div>
                </div>
                
                <div className="p-4 bg-black/40 border border-gray-700 rounded-lg">
                  <h4 className="font-medium mb-3">Financial Health</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span>Payment Success Rate</span>
                      <span className="font-medium">98%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Total Refunds</span>
                      <span className="font-medium">${formatMoney(user.metrics.totalRefunds || 0)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Campaign History */}
          <div className="p-4 bg-black/20 border border-gray-700 rounded-lg">
            <h3 className="font-medium mb-4 flex items-center gap-2">
              <Calendar className="h-5 w-5 text-yellow-400" />
              {user.type === 'brand' ? 'Campaign Performance' : 'Campaign History'}
            </h3>
            <div className="space-y-3">
              {user.campaigns?.map((campaign) => (
                <div key={campaign.id} className="p-3 bg-black/40 border border-gray-800 rounded-lg">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">{campaign.title}</p>
                      <div className="flex items-center gap-4 mt-1 text-sm text-gray-400">
                        <span>{campaign.platform || 'All Platforms'}</span>
                        <span>{typeof campaign.views === 'number' ? campaign.views.toLocaleString() : campaign.views} views</span>
                        <span>${formatMoney(user.type === 'brand' ? campaign.earned : campaign.earned)} {user.type === 'brand' ? 'spent' : 'earned'}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        campaign.status === 'completed' ? 'bg-green-900/20 text-green-400' :
                        campaign.status === 'active' ? 'bg-blue-900/20 text-blue-400' :
                        'bg-gray-900/20 text-gray-400'
                      }`}>
                        {campaign.status.toUpperCase()}
                      </span>
                      <p className="text-sm text-gray-400 mt-1">
                        {new Date(campaign.startDate).toLocaleDateString()} - {new Date(campaign.endDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Flags & Violations */}
          {user.flags && user.flags.length > 0 && (
            <div className="p-4 bg-black/20 border border-gray-700 rounded-lg">
              <h3 className="font-medium mb-4 flex items-center gap-2">
                <Flag className="h-5 w-5 text-red-400" />
                Account Flags
              </h3>
              <div className="space-y-3">
                {user.flags.map((flag, index) => (
                  <div key={index} className="p-3 bg-red-900/10 border border-red-500 rounded-lg">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-red-400">{flag.type}</p>
                        <p className="text-sm text-gray-300">{flag.reason}</p>
                      </div>
                      <span className="text-sm text-red-400">{flag.date}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Account Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-800">
            <button className="px-4 py-2 border border-yellow-500 text-yellow-400 rounded-lg hover:bg-yellow-900/20">
              Suspend Account
            </button>
            <button className="px-4 py-2 border border-red-500 text-red-400 rounded-lg hover:bg-red-900/20">
              Ban Account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminUserProfile;