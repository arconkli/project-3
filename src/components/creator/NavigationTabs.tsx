import React from 'react';
import { LayoutDashboard, TrendingUp, DollarSign, Settings } from 'lucide-react';

interface NavigationTabsProps {
  activeView: 'campaigns' | 'analytics' | 'payments' | 'settings';
  onViewChange: (view: 'campaigns' | 'analytics' | 'payments' | 'settings') => void;
}

const NavigationTabs: React.FC<NavigationTabsProps> = ({ activeView, onViewChange }) => {
  const tabs = [
    {
      id: 'campaigns',
      label: 'Campaigns',
      icon: LayoutDashboard,
    },
    {
      id: 'analytics',
      label: 'Analytics',
      icon: TrendingUp,
    },
    {
      id: 'payments',
      label: 'Payments',
      icon: DollarSign,
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: Settings,
    },
  ] as const;

  return (
    <div className="flex border-b border-gray-800">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onViewChange(tab.id)}
          className={`px-6 py-3 relative flex items-center gap-2 transition-colors ${
            activeView === tab.id ? 'text-white' : 'text-gray-400 hover:text-gray-300'
          }`}
        >
          <tab.icon className="h-5 w-5" />
          <span>{tab.label}</span>
          {activeView === tab.id && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-500" />
          )}
        </button>
      ))}
    </div>
  );
};

export default NavigationTabs; 