import React, { useState } from 'react';
import { 
  Users, 
  Building, 
  Mail, 
  Calendar, 
  TrendingUp, 
  DollarSign, 
  BarChart, 
  Eye, 
  CheckCircle, 
  Clock 
} from 'lucide-react';
import { formatMoney } from '@/utils/format';
import type { User } from '@/types/admin';

// Helper function to get status indicator
const getStatusIndicator = (status?: string) => {
  const lowerStatus = (status || 'unknown').toLowerCase();
  let colorClass = 'bg-gray-500'; // Default

  if (lowerStatus === 'active') {
    colorClass = 'bg-green-500';
  } else if (lowerStatus === 'pending') {
    colorClass = 'bg-yellow-500';
  } else if (lowerStatus === 'suspended' || lowerStatus === 'inactive') {
    colorClass = 'bg-red-500';
  }

  return (
    <span 
      className={`inline-block w-2 h-2 rounded-full ml-1.5 ${colorClass}`}
      title={`Status: ${status || 'Unknown'}`}
    />
  );
};

interface AdminUserCardProps {
  user: User;
  onAction: (action: string, userId: string) => void;
  onViewDetails: (user: User) => void;
}

const AdminUserCard: React.FC<AdminUserCardProps> = ({ user, onAction, onViewDetails }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleExpand = () => setIsExpanded(!isExpanded);

  // Safely access properties that might be missing
  const displayUsername = user.username || user.email?.split('@')[0] || 'unknown';
  const displayName = user.name || displayUsername || 'Unknown User';
  const displayType = (user.type || 'user').toLowerCase();
  const displayStatus = (user.status || 'unknown').toLowerCase();
  
  const primaryMetricLabel = user.type === 'creators' ? 'Followers' : 'Total Spent';
  const primaryMetricValue = user.type === 'creators' 
    ? user.followers 
    : formatMoney(user.metrics?.totalSpent ?? 0);

  return (
    <div 
      className={`bg-black rounded-lg shadow-md border border-gray-700 hover:border-gray-600 transition-all duration-200 ease-in-out cursor-pointer ${isExpanded ? 'p-4' : 'p-3'}`}
      onClick={toggleExpand}
    >
      {/* --- Collapsed / Always Visible Top Section --- */}
      <div className="flex justify-between items-start mb-2">
        <div className="flex-grow mr-2">
          <h3 className="text-md font-semibold text-white break-words" title={user.name}>{user.name || 'N/A'}</h3>
          <p className="text-xs text-gray-400 truncate" title={user.username}>@{user.username || 'N/A'}</p>
        </div>
        <div className="flex-shrink-0">
          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${user.type === 'creators' ? 'bg-blue-900 text-blue-200' : 'bg-purple-900 text-purple-200'}`}>
            {user.type === 'creators' ? <Users className="w-4 h-4 mr-1 inline" /> : <Building className="w-4 h-4 mr-1 inline" />}
            {user.type === 'creators' ? 'Creator' : 'Brand'}
          </span>
          {getStatusIndicator(user.status)}
        </div>
      </div>
      
      {/* --- Collapsed View Primary Metric --- */}
      {!isExpanded && (
        <div className="mt-1">
           <p className="text-sm text-gray-300">
             <span className="font-medium">{primaryMetricLabel}:</span> {primaryMetricValue}
           </p>
        </div>
      )}

      {/* --- Expanded View Details --- */}
      {isExpanded && (
        <div className="mt-3 border-t border-gray-700 pt-3 space-y-2 text-sm text-gray-300">
          <div className="flex items-center">
            <Mail className="w-4 h-4 mr-2 text-gray-400" />
            <span>{user.email || 'No email provided'}</span>
          </div>
          <div className="flex items-center">
            <Calendar className="w-4 h-4 mr-2 text-gray-400" />
            <span>Joined: {user.joinDate || 'N/A'}</span>
          </div>
          
          {/* Metrics Section */}
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs pt-1">
            {user.type === 'creators' ? (
              <>
                <div><TrendingUp className="w-3 h-3 mr-1 inline text-gray-400"/>Followers: {user.followers || '0'}</div>
                <div><DollarSign className="w-3 h-3 mr-1 inline text-gray-400"/>Total Earned: {formatMoney(user.metrics?.totalEarned ?? 0)}</div>
                <div><BarChart className="w-3 h-3 mr-1 inline text-gray-400"/>Avg. Engagement: {user.metrics?.avgEngagement?.toFixed(1) ?? 'N/A'}%</div>
                <div><Eye className="w-3 h-3 mr-1 inline text-gray-400"/>Total Views: {user.metrics?.totalViews?.toLocaleString() ?? 'N/A'}</div>
              </>
            ) : (
              <>
                <div><DollarSign className="w-3 h-3 mr-1 inline text-gray-400"/>Total Spent: {formatMoney(user.metrics?.totalSpent ?? 0)}</div>
                <div><Eye className="w-3 h-3 mr-1 inline text-gray-400"/>Total Views: {user.metrics?.totalViews?.toLocaleString() ?? 'N/A'}</div>
                <div><CheckCircle className="w-3 h-3 mr-1 inline text-gray-400"/>Completed Campaigns: {user.metrics?.completedCampaigns ?? 'N/A'}</div>
                <div><Clock className="w-3 h-3 mr-1 inline text-gray-400"/>Active Campaigns: {user.metrics?.activeCampaigns ?? 'N/A'}</div>
              </>
            )}
          </div>

          {/* View Details Button */}
          <div className="pt-2">
            <button
              onClick={(e) => {
                e.stopPropagation(); // Prevent card toggle when clicking button
                onViewDetails(user);
              }}
              className="w-full text-center px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white text-xs font-medium rounded transition-colors duration-150"
            >
              View Full Profile
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUserCard;