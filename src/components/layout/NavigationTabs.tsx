'use client';

import React, { memo } from 'react';
import { motion } from 'framer-motion';

// NavigationTabs component with improved styling
const NavigationTabs: React.FC<{
  activeView: 'campaigns' | 'analytics' | 'payments' | 'settings';
  setActiveView: (view: 'campaigns' | 'analytics' | 'payments' | 'settings') => void;
}> = memo(({ activeView, setActiveView }) => {
  return (
    <div className="mb-6 md:mb-8 flex overflow-x-auto scrollbar-none relative z-20 border-b border-gray-800">
      <motion.button
        className={`px-4 md:px-6 py-3 font-medium relative whitespace-nowrap ${
          activeView === 'campaigns' ? 'text-white' : 'text-gray-400'
        }`}
        onClick={() => setActiveView('campaigns')}
        whileHover={{ backgroundColor: 'rgba(255,255,255,0.05)' }}
        transition={{ duration: 0.2 }}
      >
        Campaigns
        {activeView === 'campaigns' && (
          <motion.div
            className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-500"
            layoutId="activeTab"
            transition={{ duration: 0.2 }}
          />
        )}
      </motion.button>
      <motion.button
        className={`px-4 md:px-6 py-3 font-medium relative whitespace-nowrap ${
          activeView === 'analytics' ? 'text-white' : 'text-gray-400'
        }`}
        onClick={() => setActiveView('analytics')}
        whileHover={{ backgroundColor: 'rgba(255,255,255,0.05)' }}
        transition={{ duration: 0.2 }}
      >
        Analytics
        {activeView === 'analytics' && (
          <motion.div
            className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-500"
            layoutId="activeTab"
            transition={{ duration: 0.2 }}
          />
        )}
      </motion.button>
      <motion.button
        className={`px-4 md:px-6 py-3 font-medium relative whitespace-nowrap ${
          activeView === 'payments' ? 'text-white' : 'text-gray-400'
        }`}
        onClick={() => setActiveView('payments')}
        whileHover={{ backgroundColor: 'rgba(255,255,255,0.05)' }}
        transition={{ duration: 0.2 }}
      >
        Payments
        {activeView === 'payments' && (
          <motion.div
            className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-500"
            layoutId="activeTab"
            transition={{ duration: 0.2 }}
          />
        )}
      </motion.button>
      <motion.button
        className={`px-4 md:px-6 py-3 font-medium relative whitespace-nowrap ${
          activeView === 'settings' ? 'text-white' : 'text-gray-400'
        }`}
        onClick={() => setActiveView('settings')}
        whileHover={{ backgroundColor: 'rgba(255,255,255,0.05)' }}
        transition={{ duration: 0.2 }}
      >
        Settings
        {activeView === 'settings' && (
          <motion.div
            className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-500"
            layoutId="activeTab"
            transition={{ duration: 0.2 }}
          />
        )}
      </motion.button>
    </div>
  );
});

NavigationTabs.displayName = 'NavigationTabs';

export default NavigationTabs;