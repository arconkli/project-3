'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  X, ArrowRight, Check, Zap, Eye, DollarSign
} from 'lucide-react';

// Background pattern 
const BackgroundPattern = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    <svg width="100%" height="100%" className="opacity-5">
      <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
        <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="1"/>
      </pattern>
      <rect width="100%" height="100%" fill="url(#grid)" />
    </svg>
  </div>
);

interface OnboardingProps {
  onComplete: () => void;
  onSkip: () => void;
}

const Onboarding: React.FC<OnboardingProps> = ({ onComplete, onSkip }) => {
  // Single-step streamlined onboarding for quick signup
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    platforms: {
      tiktok: false,
      instagram: false,
      youtube: false,
      twitter: false
    }
  });
  
  const navigate = useNavigate();
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    
    if (type === 'checkbox' && name.startsWith('platform-')) {
      const platform = name.replace('platform-', '');
      setFormData({
        ...formData,
        platforms: {
          ...formData.platforms,
          [platform]: checked
        }
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };
  
  const handleComplete = () => {
    // Create user account
    const userData = {
      name: formData.name || 'Demo User',
      email: formData.email || 'demo@create-os.com',
      platforms: Object.entries(formData.platforms)
        .filter(([_, enabled]) => enabled)
        .map(([platform]) => platform)
    };
    
    localStorage.setItem('userData', JSON.stringify(userData));
    localStorage.setItem('isLoggedIn', 'true');
    
    onComplete();
    navigate('/dashboard');
  };

  return (
    <motion.div 
      className="fixed inset-0 bg-black z-50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <BackgroundPattern />
      
      <motion.div
        className="absolute -right-20 -top-20 w-64 h-64 bg-white opacity-10 rounded-full blur-3xl"
        animate={{
          x: [0, 10, 0],
          y: [0, 10, 0],
        }}
        transition={{
          duration: 5,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      
      <motion.div
        className="absolute -left-20 -bottom-20 w-64 h-64 bg-red-500 opacity-10 rounded-full blur-3xl"
        animate={{
          x: [0, -10, 0],
          y: [0, -10, 0],
        }}
        transition={{
          duration: 7,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      
      <div className="bg-black border border-white border-opacity-20 rounded-lg p-8 max-w-md w-full relative overflow-hidden">
        <div className="absolute top-4 right-4">
          <motion.button
            onClick={onSkip}
            className="p-2 rounded-full hover:bg-white hover:bg-opacity-10"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <X className="h-5 w-5" />
          </motion.button>
        </div>
        
        <div className="flex flex-col items-center justify-center mb-8">
          <Zap className="h-10 w-10 text-red-500" />
          <motion.h2 
            className="text-2xl md:text-3xl font-bold text-center mt-4"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            JOIN CREATE_OS
          </motion.h2>
          <motion.p 
            className="text-center text-gray-300 mt-2 max-w-md"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            Sign up in seconds and start monetizing your content instantly
          </motion.p>
        </div>
        
        {/* Simplified single-step form */}
        <motion.div 
          className="space-y-4 w-full mx-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm mb-1">Your Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full p-3 bg-transparent border rounded focus:border-red-500 outline-none transition-colors"
                placeholder="Enter your name"
              />
            </div>
            
            <div>
              <label className="block text-sm mb-1">Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full p-3 bg-transparent border rounded focus:border-red-500 outline-none transition-colors"
                placeholder="your@email.com"
              />
            </div>
            
            <div>
              <label className="block text-sm mb-1">Password</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full p-3 bg-transparent border rounded focus:border-red-500 outline-none transition-colors"
                placeholder="••••••••"
              />
            </div>
            
            <div className="pt-2">
              <label className="font-bold block mb-2">Connect Your Platforms <span className="text-xs font-normal opacity-70">(Optional - you can do this later)</span></label>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="platform-tiktok"
                    name="platform-tiktok"
                    checked={formData.platforms.tiktok}
                    onChange={handleChange}
                    className="rounded border-gray-400 text-red-500 focus:ring-red-500"
                  />
                  <label htmlFor="platform-tiktok">TikTok</label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="platform-instagram"
                    name="platform-instagram"
                    checked={formData.platforms.instagram}
                    onChange={handleChange}
                    className="rounded border-gray-400 text-red-500 focus:ring-red-500"
                  />
                  <label htmlFor="platform-instagram">Instagram</label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="platform-youtube"
                    name="platform-youtube"
                    checked={formData.platforms.youtube}
                    onChange={handleChange}
                    className="rounded border-gray-400 text-red-500 focus:ring-red-500"
                  />
                  <label htmlFor="platform-youtube">YouTube</label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="platform-twitter"
                    name="platform-twitter"
                    checked={formData.platforms.twitter}
                    onChange={handleChange}
                    className="rounded border-gray-400 text-red-500 focus:ring-red-500"
                  />
                  <label htmlFor="platform-twitter">X (Twitter)</label>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
        
        <div className="mt-6 flex flex-col space-y-4">
          <motion.button
            onClick={handleComplete}
            className="px-6 py-3 bg-gradient-to-r from-red-500 to-red-700 rounded flex items-center justify-center gap-2 font-bold w-full"
            whileHover={{ scale: 1.02, boxShadow: "0 0 15px rgba(255,68,68,0.3)" }}
            whileTap={{ scale: 0.98 }}
          >
            Create Account <Check className="h-4 w-4" />
          </motion.button>
          
          <div className="text-center space-y-4 mt-4">
            <div className="flex items-center justify-center">
              <div className="border-b border-gray-700 flex-grow"></div>
              <p className="mx-4 text-sm text-gray-400">How It Works</p>
              <div className="border-b border-gray-700 flex-grow"></div>
            </div>
            
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="flex flex-col items-center p-2">
                <Eye className="h-4 w-4 text-blue-400 mb-1" />
                <p>Create content on any platform</p>
              </div>
              <div className="flex flex-col items-center p-2">
                <Zap className="h-4 w-4 text-yellow-400 mb-1" />
                <p>Participate in brand campaigns</p>
              </div>
              <div className="flex flex-col items-center p-2">
                <DollarSign className="h-4 w-4 text-green-400 mb-1" />
                <p>Get paid based on views</p>
              </div>
            </div>
            
            <motion.button
              onClick={onSkip}
              className="text-sm text-gray-400 underline hover:text-white"
              whileHover={{ scale: 1.05 }}
            >
              Learn more
            </motion.button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default Onboarding;