'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  X, ArrowRight, Check, Zap, Eye, DollarSign
} from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import { ConnectTikTok } from './ConnectTikTok';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

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
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    bio: ''
  });

  const [showSocialConnect, setShowSocialConnect] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Sign up user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password
      });

      if (authError) throw authError;

      // Create profile
      if (authData.user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: authData.user.id,
            display_name: formData.name,
            bio: formData.bio,
            role: 'creator'
          });

        if (profileError) throw profileError;
      }

      setShowSocialConnect(true);
    } catch (error) {
      console.error('Error during signup:', error);
      // You might want to show an error toast here
    }
  };

  const handleComplete = () => {
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

        <AnimatePresence mode="wait">
          {!showSocialConnect ? (
            <motion.form 
              key="signup"
              className="space-y-4 w-full mx-auto"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onSubmit={handleSubmit}
            >
              <div>
                <label className="block text-sm mb-1">Your Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
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
                  required
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
                  required
                  className="w-full p-3 bg-transparent border rounded focus:border-red-500 outline-none transition-colors"
                  placeholder="••••••••"
                />
              </div>

              <div>
                <label className="block text-sm mb-1">Bio</label>
                <textarea
                  name="bio"
                  value={formData.bio}
                  onChange={handleChange}
                  className="w-full p-3 bg-transparent border rounded focus:border-red-500 outline-none transition-colors"
                  placeholder="Tell us about yourself"
                  rows={3}
                />
              </div>

              <motion.button
                type="submit"
                className="px-6 py-3 bg-gradient-to-r from-red-500 to-red-700 rounded flex items-center justify-center gap-2 font-bold w-full"
                whileHover={{ scale: 1.02, boxShadow: "0 0 15px rgba(255,68,68,0.3)" }}
                whileTap={{ scale: 0.98 }}
              >
                Continue
                <ArrowRight className="h-5 w-5" />
              </motion.button>
            </motion.form>
          ) : (
            <motion.div
              key="social"
              className="space-y-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="text-center mb-6">
                <h3 className="text-xl font-bold mb-2">Connect Your Accounts</h3>
                <p className="text-gray-400">Connect your social media accounts to start monetizing your content</p>
              </div>

              <ConnectTikTok />

              <div className="flex justify-between mt-6">
                <button
                  onClick={() => setShowSocialConnect(false)}
                  className="px-4 py-2 border border-gray-700 rounded hover:bg-white/5"
                >
                  Back
                </button>
                <button
                  onClick={handleComplete}
                  className="px-4 py-2 bg-gradient-to-r from-red-500 to-red-700 rounded"
                >
                  Complete Setup
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default Onboarding;