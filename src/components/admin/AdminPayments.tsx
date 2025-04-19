import React, { useState } from 'react';
import { DollarSign, Search, Filter, Check, AlertCircle, Download, FileText, Eye, ArrowRight } from 'lucide-react';
import { formatMoney } from '@/utils/format';
import AdminUserProfile from './AdminUserProfile';

interface Payment {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  amount: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  method: string;
  accountDetails: string;
  campaignId?: string;
  campaignTitle?: string;
  createdAt: string;
  scheduledFor?: string;
  campaigns?: Array<{
    id: string;
    title: string;
    amount: number;
    views: number;
    posts: number;
  }>;
}

const AdminPayments: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showPaymentDetails, setShowPaymentDetails] = useState<Payment | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [selectedPayments, setSelectedPayments] = useState<string[]>([]);
  const [selectedUser, setSelectedUser] = useState<any>(null);

  // Sample pending payments data
  const pendingPayments: Payment[] = [
    {
      id: 'pmt_1',
      userId: 'user_1',
      userName: 'John Creator',
      userEmail: 'john@creator.com',
      amount: 2500,
      status: 'pending',
      method: 'Bank Transfer',
      accountDetails: '****4321',
      campaignId: 'camp_1',
      campaignTitle: 'Summer Collection',
      createdAt: '2025-03-12T10:00:00Z',
      scheduledFor: '2025-03-15T00:00:00Z'
    },
    {
      id: 'pmt_2',
      userId: 'user_2',
      userName: 'Sarah Content',
      userEmail: 'sarah@content.com',
      amount: 1800,
      status: 'pending',
      method: 'PayPal',
      accountDetails: 'sarah@content.com',
      campaignId: 'camp_2',
      campaignTitle: 'Tech Launch',
      createdAt: '2025-03-12T09:00:00Z',
      scheduledFor: '2025-03-15T00:00:00Z'
    }
  ];

  const handleProcessPayments = () => {
    console.log('Processing payments:', selectedPayments);
    setShowConfirmDialog(false);
    setSelectedPayments([]);
  };

  return (
    <div className="space-y-6">
      {/* Payment Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-black/40 border border-gray-800 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="h-5 w-5 text-green-400" />
            <h3 className="text-sm text-gray-400">Pending Payouts</h3>
          </div>
          <p className="text-2xl font-bold">$24,500</p>
          <p className="text-sm text-gray-400">15 creators</p>
        </div>

        <div className="p-4 bg-black/40 border border-gray-800 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Check className="h-5 w-5 text-blue-400" />
            <h3 className="text-sm text-gray-400">Processing</h3>
          </div>
          <p className="text-2xl font-bold">$12,800</p>
          <p className="text-sm text-gray-400">8 payments</p>
        </div>

        <div className="p-4 bg-black/40 border border-gray-800 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <FileText className="h-5 w-5 text-purple-400" />
            <h3 className="text-sm text-gray-400">Today's Batch</h3>
          </div>
          <p className="text-2xl font-bold">$8,400</p>
          <p className="text-sm text-gray-400">6 payments ready</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 p-4 bg-black/40 border border-gray-800 rounded-lg">
        <button
          onClick={() => setSelectedPayments(pendingPayments.map(p => p.id))}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center gap-2"
        >
          <Check className="h-4 w-4" />
          Select All
        </button>

        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by creator or campaign..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-black/40 border border-gray-700 rounded-lg"
          />
        </div>
        
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 bg-black/40 border border-gray-700 rounded-lg"
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="processing">Processing</option>
          <option value="completed">Completed</option>
          <option value="failed">Failed</option>
        </select>

        <button
          onClick={() => setShowConfirmDialog(true)}
          disabled={selectedPayments.length === 0}
          className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:hover:bg-green-600 rounded-lg flex items-center gap-2"
        >
          <DollarSign className="h-4 w-4" />
          Process Selected
        </button>

        <button className="px-4 py-2 border border-gray-700 rounded-lg flex items-center gap-2 hover:bg-white/5">
          <Download className="h-4 w-4" />
          Export Report
        </button>
      </div>

      {/* Payments List */}
      <div className="space-y-4">
        {pendingPayments.map((payment) => (
          <div
            key={payment.id}
            className="p-4 bg-black/40 border border-gray-800 rounded-lg"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-start gap-4">
                <input
                  type="checkbox"
                  checked={selectedPayments.includes(payment.id)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedPayments([...selectedPayments, payment.id]);
                    } else {
                      setSelectedPayments(selectedPayments.filter(id => id !== payment.id));
                    }
                  }}
                  className="mt-1.5 rounded border-gray-700 text-green-500 focus:ring-green-500"
                />
                <div 
                  className="cursor-pointer hover:opacity-80"
                  onClick={() => setSelectedUser({
                    name: payment.userName,
                    email: payment.userEmail,
                    username: payment.userName.toLowerCase().replace(' ', '.'),
                    type: 'creator',
                    status: 'active',
                    followers: '10K+',
                    joinDate: new Date().toLocaleDateString(),
                    metrics: {
                      totalViews: 0,
                      totalEarnings: 0,
                      avgEngagement: 0,
                      completedCampaigns: 0,
                      pendingReviews: 0,
                      totalEarned: 24500,
                      avgEarningsPerCampaign: 2040,
                      campaignCompletionRate: 92,
                      lastActive: '2 hours ago',
                      contentQuality: 8.5,
                      violationCount: 0
                    },
                    paymentHistory: [payment],
                    verificationLevel: 'verified',
                    platforms: ['TikTok', 'Instagram', 'YouTube'],
                    recentActivity: [
                      {
                        type: 'payment',
                        description: `Received payment of $${formatMoney(payment.amount)}`,
                        timestamp: new Date().toLocaleString()
                      }
                    ]
                  })}
                >
                  <h3 className="font-medium">{payment.userName}</h3>
                  <p className="text-sm text-gray-400">{payment.userEmail}</p>
                  {payment.campaignTitle && (
                    <p className="text-sm text-gray-400 mt-1">
                      Campaign: {payment.campaignTitle}
                    </p>
                  )}
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold">${formatMoney(payment.amount)}</p>
                <p className="text-sm text-gray-400">
                  {payment.method} - {payment.accountDetails}
                </p>
                <p className="text-sm text-gray-400 mt-1">
                  Scheduled: {new Date(payment.scheduledFor!).toLocaleDateString()}
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className={`px-2 py-1 text-xs rounded-full ${
                payment.status === 'pending' ? 'bg-yellow-900/20 text-yellow-400' :
                payment.status === 'processing' ? 'bg-blue-900/20 text-blue-400' :
                payment.status === 'completed' ? 'bg-green-900/20 text-green-400' :
                'bg-red-900/20 text-red-400'
              }`}>
                {payment.status.toUpperCase()}
              </span>
              <div className="flex gap-2">
                <button 
                  onClick={() => setShowPaymentDetails(payment)}
                  className="px-3 py-1 border border-gray-700 rounded text-sm hover:bg-white/5 flex items-center gap-2"
                >
                  <Eye className="h-4 w-4" />
                  View Details
                </button>
                <button className="px-3 py-1 bg-green-600 hover:bg-green-700 rounded text-sm">
                  Process Now
                </button>
              </div>
            </div>
            {showPaymentDetails?.id === payment.id && (
              <div className="mt-4 pt-4 border-t border-gray-700">
                <h4 className="font-medium mb-3">Campaign Earnings Breakdown</h4>
                <div className="space-y-3">
                  {payment.campaigns?.map(campaign => (
                    <div key={campaign.id} className="p-3 bg-black/20 border border-gray-700 rounded-lg">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium">{campaign.title}</p>
                          <div className="flex items-center gap-4 mt-1 text-sm text-gray-400">
                            <span>{campaign.posts} posts</span>
                            <span>{formatMoney(campaign.views)} views</span>
                          </div>
                        </div>
                        <p className="font-bold">${formatMoney(campaign.amount)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Confirmation Dialog */}
      {showConfirmDialog && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-black/40 border border-gray-800 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">Process Payments</h3>
            
            <div className="p-4 bg-yellow-900/10 border border-yellow-800 rounded-lg mb-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-yellow-400 mb-1">
                    Confirm Payment Processing
                  </p>
                  <p className="text-sm text-gray-300">
                    You are about to process {selectedPayments.length} payments totaling{' '}
                    ${formatMoney(pendingPayments
                      .filter(p => selectedPayments.includes(p.id))
                      .reduce((sum, p) => sum + p.amount, 0)
                    )}. This action cannot be undone.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowConfirmDialog(false)}
                className="px-4 py-2 border border-gray-700 rounded-lg hover:bg-white/5"
              >
                Cancel
              </button>
              <button
                onClick={handleProcessPayments}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg"
              >
                Confirm Processing
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* User Profile Modal */}
      {selectedUser && (
        <AdminUserProfile
          user={selectedUser}
          onClose={() => setSelectedUser(null)}
        />
      )}
    </div>
  );
};

export default AdminPayments;