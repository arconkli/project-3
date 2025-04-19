import React from 'react';
import { motion } from 'framer-motion';

type ViewType = 'overview' | 'campaigns' | 'creators' | 'analytics' | 'team' | 'billing' | 'settings';

interface BrandNavigationProps {
  activeView: ViewType;
  onViewChange: (view: ViewType) => void;
}

const BrandNavigation: React.FC<BrandNavigationProps> = ({ activeView, onViewChange }) => {
  const navItems: { id: ViewType; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'campaigns', label: 'Campaigns' },
    { id: 'creators', label: 'Creators' },
    { id: 'analytics', label: 'Analytics' },
    { id: 'billing', label: 'Billing' },
    { id: 'settings', label: 'Settings' }
  ];

  return (
    <nav 
      aria-label="Dashboard sections"
      className="w-full mb-6 flex justify-start overflow-x-auto border-b border-gray-800 scrollbar-none relative z-10"
      role="navigation"
    >
      <div className="flex space-x-1">
        {navItems.map(item => (
          <button
            key={item.id}
            className={`px-5 py-3 font-medium relative whitespace-nowrap transition-colors hover:text-white focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-50 focus:z-10 ${
              activeView === item.id ? 'text-white' : 'text-gray-400'
            }`}
            onClick={() => onViewChange(item.id)}
            aria-current={activeView === item.id ? 'page' : undefined}
            aria-label={`${item.label} section`}
          >
            {item.label}
            {activeView === item.id && (
              <motion.div
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-500"
                layoutId="activeTab"
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              />
            )}
          </button>
        ))}
      </div>
    </nav>
  );
};

export default BrandNavigation;