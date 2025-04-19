import React from 'react';
import { BarChart2, FileText, TrendingUp, MessageSquare, Calendar, Users, Settings, DollarSign } from 'lucide-react';

interface AdminNavigationProps {
  activeTab: 'overview' | 'reviews' | 'campaigns' | 'users' | 'settings' | 'analytics' | 'payments';
  onTabChange: (tab: 'overview' | 'reviews' | 'campaigns' | 'users' | 'settings' | 'analytics' | 'payments') => void;
}

const AdminNavigation: React.FC<AdminNavigationProps> = ({ activeTab, onTabChange }) => {
  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart2 },
    { id: 'reviews', label: 'Content Reviews', icon: FileText },
    { id: 'analytics', label: 'Analytics', icon: TrendingUp },
    { id: 'campaigns', label: 'Campaigns', icon: Calendar },
    { id: 'payments', label: 'Payments', icon: DollarSign },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

  return (
    <nav className="flex space-x-1 mb-8 border-b border-gray-800">
      {tabs.map(tab => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id as typeof activeTab)}
          className={`px-4 py-3 flex items-center gap-2 relative ${
            activeTab === tab.id ? 'text-white' : 'text-gray-400 hover:text-gray-300'
          }`}
        >
          <tab.icon className="h-5 w-5" />
          <span>{tab.label}</span>
          {activeTab === tab.id && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-500" />
          )}
        </button>
      ))}
    </nav>
  );
};

export default AdminNavigation;