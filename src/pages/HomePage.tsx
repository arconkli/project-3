'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  XIcon, ArrowUpRight, Zap, Eye, DollarSign, 
  Building, Calendar, Users, TrendingUp, 
  Twitter, Youtube, Instagram, Clock, LogOut, User
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import Navigation from '@/components/shared/Navigation';
import LoginModal from '@/components/shared/LoginModal';
import { useNavigate } from 'react-router-dom';
import { useOnboarding } from '@/components/shared/OnboardingProvider';
import BackgroundPattern from '@/components/shared/BackgroundPattern';
import { supabase } from '@/lib/supabaseClient';

// Sample data for the growth chart
const growthData = [
  { month: 'Jan', views: 2.1, earnings: 4200 },
  { month: 'Feb', views: 3.4, earnings: 6800 },
  { month: 'Mar', views: 4.2, earnings: 8400 },
  { month: 'Apr', views: 6.8, earnings: 13600 },
  { month: 'May', views: 8.5, earnings: 17000 },
  { month: 'Jun', views: 12.3, earnings: 24600 }
];

// Types for better code organization
interface Campaign {
  title: string;
  type: string;
  payout: string;
  minViews: string;
  platforms: string[];
  description: string;
}

interface CampaignModalProps {
  campaign: Campaign;
  onClose: () => void;
}

// Sample campaign data
const exampleCampaigns: Campaign[] = [
  {
    title: "Upcoming Netflix Series",
    type: "Entertainment",
    payout: "$550 per 1M views",
    minViews: "100K",
    platforms: ["TikTok", "Instagram", "YouTube"],
    description: "Create unique content promoting our new series launch. Focus on character reactions, plot theories, or creative skits."
  },
  {
    title: "New Artist Release",
    type: "Music",
    payout: "Share of $500K pool",
    minViews: "1M",
    platforms: ["TikTok", "Instagram"],
    description: "Use the artist's new track in your videos. Dance, lip-sync, or create original content that highlights the song."
  },
  {
    title: "Gaming Stream Highlight",
    type: "Gaming",
    payout: "$250 per 1M views",
    minViews: "500K",
    platforms: ["TikTok", "Instagram", "YouTube", "X"],
    description: "Create clips or reaction videos to interesting stream moments. Emphasis on exciting moments and community engagement."
  }
];

// Custom tooltip component for charts
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="p-3 border border-gray-700 bg-black rounded">
        <p className="text-white font-bold">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={`item-${index}`} style={{ color: entry.color || '#FFFFFF' }}>
            {entry.name}: {entry.value} {entry.name === 'views' ? 'M' : entry.unit || ''}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

// AnimatedNumber component for stats
const AnimatedNumber = ({ value, label }: { value: string; label: string }) => {
  return (
    <motion.div
      className="text-center"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
    >
      <p className="text-4xl font-bold mb-2 text-white">{value}</p>
      <p className="text-sm text-gray-400">{label}</p>
    </motion.div>
  );
};

// Campaign Modal Component
function CampaignModal({ campaign, onClose }: CampaignModalProps) {
  const navigate = useNavigate();
  
  // Handle ESC key to close modal
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => {
      window.removeEventListener('keydown', handleEsc);
    };
  }, [onClose]);
  
  const handleApply = () => {
    // Check if user is logged in
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    
    if (isLoggedIn) {
      navigate('/dashboard');
    } else {
      onClose();
      document.dispatchEvent(new CustomEvent('openLogin'));
    }
  };

  return (
    <div
      className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-80 backdrop-blur-sm z-50 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="campaign-title"
    >
      <div
        className="border border-gray-800 p-6 rounded-lg w-full max-w-md relative bg-black"
        onClick={(e) => e.stopPropagation()}
      >
        <button 
          className="absolute top-2 right-2 p-2" 
          onClick={onClose}
          aria-label="Close modal"
        >
          <XIcon className="h-6 w-6" />
        </button>
        
        <h2 id="campaign-title" className="text-2xl font-bold mb-4 text-white">{campaign.title}</h2>
        
        <div className="space-y-4">
          <div className="flex justify-between">
            <div>
              <p className="text-sm text-gray-400">Campaign Type</p>
              <p className="font-bold text-white">{campaign.type}</p>
            </div>
            <div>
              <p className="text-sm text-gray-400">Payout</p>
              <p className="font-bold text-white">{campaign.payout}</p>
            </div>
          </div>
          
          <div>
            <p className="text-sm text-gray-400">Platforms</p>
            <div className="flex flex-wrap gap-2 mt-1">
              {campaign.platforms.map((platform, idx) => (
                <span 
                  key={platform} 
                  className="px-2 py-0.5 text-xs bg-white/10 rounded-full text-gray-300"
                >
                  {platform}
                </span>
              ))}
            </div>
          </div>
          
          <div>
            <p className="text-sm text-gray-400 mb-2">Eligible Platforms</p>
            <div className="flex flex-wrap gap-2">
              {campaign.platforms.map((platform) => (
                <span
                  key={platform}
                  className="px-2 py-1 border border-gray-700 rounded text-sm text-gray-300"
                >
                  {platform}
                </span>
              ))}
            </div>
          </div>
          
          <div>
            <p className="text-sm text-gray-400 mb-2">Campaign Details</p>
            <p className="text-gray-300">{campaign.description}</p>
          </div>
        </div>
        
        <button
          className="mt-6 border border-gray-700 hover:border-red-500 px-6 py-2 rounded w-full flex items-center justify-center gap-2 text-white"
          onClick={handleApply}
        >
          Apply Now
          <ArrowUpRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

// Main HomePage component
export default function HomePage() {
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [showLogin, setShowLogin] = useState(false);
  const navigate = useNavigate();
  const { resetOnboarding } = useOnboarding();
  
  // Add smooth scroll for internal links
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };
  
  // Check login status on component mount
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  
  useEffect(() => {
    // Check if user is logged in from localStorage
    const loginStatus = localStorage.getItem('isLoggedIn') === 'true';
    setIsLoggedIn(loginStatus);
    
    // Listen for custom event to open login modal from campaign modal
    const handleOpenLogin = () => setShowLogin(true);
    document.addEventListener('openLogin', handleOpenLogin);
    
    return () => {
      document.removeEventListener('openLogin', handleOpenLogin);
    };
  }, []);
  
  // Handle login button click
  const handleLoginClick = () => {
    setShowLogin(true);
  };
  
  const handleJoinCreator = () => {
    if (isLoggedIn) {
      navigate('/dashboard');
    } else {
      navigate('/onboarding');
    }
  };

  return (
    <div className="min-h-screen bg-black">
      <BackgroundPattern />
      <Navigation isLoggedIn={isLoggedIn} />
      
      <main className="relative z-10">
        {/* Business Campaign Banner */}
        <div className="bg-gradient-to-r from-indigo-900 to-orange-900 p-4 md:p-6 relative z-20">
          <div className="flex flex-col md:flex-row items-center justify-between max-w-7xl mx-auto">
            <div className="flex items-center gap-3 mb-4 md:mb-0">
              <Building className="h-6 w-6 text-white" />
              <p className="text-white font-medium">Looking to launch a campaign?</p>
            </div>
            <button 
              className="px-6 py-2 bg-white text-black rounded-full font-medium flex items-center gap-2 w-full md:w-auto justify-center"
              onClick={async () => {
                console.log('🔄 Starting new brand registration process...');
                
                try {
                  // First, force sign out from Supabase
                  console.log('🔑 Signing out from any existing session...');
                  await supabase.auth.signOut({ scope: 'global' });
                  
                  // Clear ALL localStorage
                  console.log('🧹 Clearing ALL localStorage');
                  localStorage.clear();
                  
                  // Clear ALL sessionStorage
                  console.log('🧹 Clearing ALL sessionStorage');
                  sessionStorage.clear();
                  
                  console.log('✅ All data cleared, redirecting to brand onboarding...');
                  
                  // Force a page reload to clear any React state
                  window.location.href = '/brand-onboarding?new=true&t=' + Date.now();
                } catch (error) {
                  console.error('Error during cleanup:', error);
                  // If there's an error, still try to redirect
                  window.location.href = '/brand-onboarding?new=true&t=' + Date.now();
                }
              }}
            >
              Start a Campaign <ArrowUpRight className="h-4 w-4" />
            </button>
          </div>
        </div>
        
        <div className="p-4 md:p-8 max-w-7xl mx-auto relative z-20">
          {/* Hero Section */}
          <div
            className="border border-gray-800 p-6 md:p-8 rounded-lg mb-8 bg-black relative overflow-hidden"
            id="hero"
          >
            <div>
              <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight text-white">
                CREATOR<br />
                <motion.span
                  className="inline-block"
                  animate={{ 
                    color: ['#FFFFFF', '#FF4444', '#FFFFFF'],
                    transition: { duration: 3, repeat: Infinity }
                  }}
                >
                  MONETIZATION_
                </motion.span>
              </h1>
              <p className="text-lg md:text-xl mb-8 max-w-2xl text-gray-300">
                <strong><em>Create great content, go viral, get paid.</em></strong>
                <br /><br />
                No minimum follower requirements. No complex sign-up.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <button 
                  className="px-8 py-4 bg-gradient-to-r from-red-500 to-red-700 text-white rounded-lg font-bold transition-colors hover:shadow-lg hover:shadow-red-900/40"
                  onClick={handleJoinCreator}
                >
                  Join as Creator
                </button>
                <button 
                  className="px-8 py-4 bg-black border border-gray-600 hover:border-white text-white rounded-lg font-bold transition-colors"
                  onClick={() => setShowLogin(true)}
                >
                  Login
                </button>
              </div>
            </div>
          </div>

          {/* Stats Section */}
          <div
            className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8"
          >
            {[
              { icon: <Users className="h-6 w-6 text-blue-400" />, label: "Creators", value: "10,000+", trend: "+24%" },
              { icon: <Eye className="h-6 w-6 text-purple-400" />, label: "Monthly Views", value: "280M+", trend: "+35%" },
              { icon: <DollarSign className="h-6 w-6 text-green-400" />, label: "Creator Payouts", value: "$4.2M+", trend: "+47%" },
              { icon: <Building className="h-6 w-6 text-red-400" />, label: "Brand Partners", value: "120+", trend: "+18%" }
            ].map((stat, i) => (
              <div
                key={i}
                className="border border-gray-800 p-4 rounded-lg bg-black"
              >
                <div className="flex items-center gap-3 mb-4">
                  {stat.icon}
                  <span className="text-sm text-gray-400">{stat.label}</span>
                </div>
                <div className="flex justify-between items-end">
                  <p className="text-2xl font-bold text-white">{stat.value}</p>
                  <div className="text-sm flex items-center gap-1 text-green-400">
                    <TrendingUp className="h-4 w-4" />
                    <span>{stat.trend}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* How It Works */}
          <div
            className="border border-gray-800 p-6 rounded-lg mb-8 relative bg-black"
            id="how-it-works"
          >
            <h2 className="text-2xl font-bold mb-6 text-white">HOW IT WORKS_</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { 
                  icon: <Eye className="h-8 w-8 text-blue-400" />, 
                  title: "Connect Platforms", 
                  desc: "Link your TikTok, Instagram, YouTube, and X accounts. No minimum metric requirements." 
                },
                { 
                  icon: <Zap className="h-8 w-8 text-yellow-400" />, 
                  title: "Choose Campaigns", 
                  desc: "Browse available campaigns, create content following simple guidelines, and post with campaign hashtags." 
                },
                { 
                  icon: <DollarSign className="h-8 w-8 text-green-400" />, 
                  title: "Earn Per View", 
                  desc: "Get paid based on your views. Minimum thresholds start at 100K views. Quick monthly payouts." 
                }
              ].map((step, i) => (
                <div 
                  key={i}
                  className="space-y-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 border border-gray-700 rounded-lg flex items-center justify-center">
                      {step.icon}
                    </div>
                    <h3 className="text-xl font-bold text-white">{step.title}</h3>
                  </div>
                  
                  <p className="text-gray-300">{step.desc}</p>
                  
                  <div className="pt-2 border-t border-gray-800 text-sm text-gray-400">
                    {i === 0 && "No minimum follower count required"}
                    {i === 1 && "Simple guidelines with creative freedom"}
                    {i === 2 && "Payments sent directly to your account"}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Example Campaigns */}
          <div
            className="mb-8"
            id="campaigns"
          >
            <h2 className="text-2xl font-bold mb-6 text-white">EXAMPLE CAMPAIGNS_</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {exampleCampaigns.map((campaign, i) => (
                <button
                  key={i}
                  className="text-left p-6 rounded-lg bg-black border border-gray-800 hover:border-gray-600 transition-all hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50"
                  onClick={() => setSelectedCampaign(campaign)}
                  aria-label={`View details of ${campaign.title} campaign`}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-bold mb-2 text-white">{campaign.title}</h3>
                      <div className="flex items-center gap-2">
                        <span className="px-3 py-1 rounded-full bg-red-900/20 text-red-400 text-sm">
                          NEW
                        </span>
                        <span className="px-3 py-1 rounded-full bg-white/5 text-sm text-gray-300">
                          {campaign.type}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4 mb-4">
                    <div>
                      <p className="text-sm text-gray-400 mb-1">Payout Rate</p>
                      <p className="text-lg font-bold text-white">{campaign.payout}</p>
                    </div>

                    <div>
                      <p className="text-sm text-gray-400 mb-1">Campaign Brief</p>
                      <p className="text-sm text-gray-300 line-clamp-2">{campaign.description}</p>
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-3 border-t border-gray-800">
                    <div className="flex flex-wrap gap-2">
                      {campaign.platforms.slice(0, 2).map((platform) => (
                        <span
                          key={platform}
                          className="px-3 py-1 rounded-full bg-white/5 text-sm text-gray-300"
                        >
                          {platform}
                        </span>
                      ))}
                      {campaign.platforms.length > 2 && (
                        <span className="px-3 py-1 rounded-full bg-white/5 text-sm text-gray-300">
                          +{campaign.platforms.length - 2}
                        </span>
                      )}
                    </div>

                    <span className="inline-flex items-center text-red-400 font-medium text-sm">
                      Join <ArrowUpRight className="h-4 w-4 ml-1" />
                    </span>
                  </div>
                </button>
              ))}
            </div>
            
            <div className="text-center mt-8">
              <button
                className="px-6 py-3 border border-gray-700 rounded-full hover:bg-gray-800 text-white transition-colors"
                onClick={() => isLoggedIn ? navigate('/dashboard') : setShowLogin(true)}
              >
                Browse All Campaigns <ArrowUpRight className="h-4 w-4 inline ml-1" />
              </button>
            </div>
          </div>

          {/* Monthly Views Chart */}
          <div
            className="border border-gray-800 p-6 rounded-lg mb-8"
          >
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
              <h2 className="text-xl sm:text-2xl font-bold flex items-center gap-2 text-white">
                <div className="flex items-center justify-center p-1 rounded-full bg-blue-900">
                  <Eye className="h-4 w-4 sm:h-5 sm:w-5 text-blue-400" />
                </div>
                <span className="whitespace-normal sm:whitespace-nowrap">MONTHLY VIEWS</span>
              </h2>
              <div className="flex items-center gap-2 border border-gray-700 px-3 py-1.5 rounded">
                <Calendar className="h-4 w-4 text-gray-400" />
                <select className="bg-transparent border-none outline-none text-xs sm:text-sm text-gray-300 pr-2">
                  <option value="6M">Last 6 Months</option>
                  <option value="1Y">Last Year</option>
                  <option value="ALL">All Time</option>
                </select>
              </div>
            </div>
            
            <div className="h-64 md:h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={growthData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis 
                    dataKey="month" 
                    stroke="#9CA3AF" 
                    tick={{ fill: '#FFFFFF', fontSize: 12 }}
                    tickLine={{ stroke: '#4B5563' }}
                    axisLine={{ stroke: '#4B5563' }}
                    dy={10}
                  />
                  <YAxis 
                    stroke="#9CA3AF"
                    tick={{ fill: '#FFFFFF', fontSize: 12 }}
                    tickLine={{ stroke: '#4B5563' }}
                    axisLine={{ stroke: '#4B5563' }}
                    tickFormatter={(value) => `${value}M`}
                    width={40}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Line 
                    type="monotone" 
                    dataKey="views" 
                    name="Views"
                    stroke="#4287f5"
                    strokeWidth={3}
                    dot={{ fill: '#FFFFFF', r: 3, strokeWidth: 2 }}
                    activeDot={{ r: 6, fill: '#4287f5' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Footer */}
          <footer
            className="border-t border-gray-800 mt-8 pt-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <h3 className="text-xl font-bold mb-4 text-white">CREATE_OS</h3>
                <p className="text-gray-400">
                  The no-nonsense platform for creator monetization.
                </p>
              </div>
              
              <div>
                <h3 className="text-xl font-bold mb-4 text-white">Supported Platforms</h3>
                <div className="flex flex-wrap gap-3">
                  {['TikTok', 'Instagram', 'YouTube', 'X'].map((platform) => (
                    <div
                      key={platform}
                      className="p-2 border border-gray-700 rounded text-sm text-gray-300"
                    >
                      {platform}
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <h3 className="text-xl font-bold mb-4 text-white">Contact</h3>
                <p className="text-gray-400">
                  creators@create-os.com<br />
                  partnerships@create-os.com
                </p>
              </div>
            </div>
            <div className="text-center mt-6 pt-6 border-t border-gray-800 text-sm text-gray-500">
              © 2025 CREATE_OS. All rights reserved.
            </div>
          </footer>
        </div>
      </main>

      {/* Login Modal */}
      <AnimatePresence>
        {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}
      </AnimatePresence>

      {/* Campaign Modal */}
      <AnimatePresence>
        {selectedCampaign && (
          <CampaignModal
            campaign={selectedCampaign}
            onClose={() => setSelectedCampaign(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}