import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  User, Bell, Link as LinkIcon, Shield, Wallet, 
  Check, AlertTriangle, LogOut, Globe, Instagram, 
  Youtube, Twitter, Plus, Info
} from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import { ConnectTikTok } from './ConnectTikTok';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const SettingsView = () => {
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    bio: '',
    connectedAccounts: {
      instagram: [],
      youtube: [],
      tiktok: [],
      twitter: []
    }
  });

  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get user profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError) throw profileError;

      // Get connected social media accounts
      const { data: accounts, error: accountsError } = await supabase
        .from('social_media_accounts')
        .select(`
          id,
          platform,
          username,
          display_name,
          profile_url,
          channel_statistics (
            total_followers,
            total_posts,
            total_likes
          )
        `)
        .eq('user_id', user.id);

      if (accountsError) throw accountsError;

      // Transform accounts into the expected format
      const connectedAccounts = {
        instagram: [],
        youtube: [],
        tiktok: [],
        twitter: []
      };

      accounts?.forEach(account => {
        const platformAccount = {
          id: account.id,
          username: account.username,
          followers: account.channel_statistics?.[0]?.total_followers.toString() || '0',
          isVerified: true, // You might want to store this in the database
          isPrimary: false, // You might want to store this in the database
          addedOn: new Date().toISOString() // You might want to store this in the database
        };

        connectedAccounts[account.platform].push(platformAccount);
      });

      setProfile({
        name: profile?.display_name || user.email?.split('@')[0] || '',
        email: user.email || '',
        bio: profile?.bio || '',
        connectedAccounts
      });
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  const handleProfileUpdate = async (field: string, value: any) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const updates = {
        id: user.id,
        [field]: value,
        updated_at: new Date()
      };

      const { error } = await supabase
        .from('profiles')
        .upsert(updates);

      if (error) throw error;

      setProfile(prev => ({
        ...prev,
        [field]: value
      }));
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  };

  const handleAccountDisconnect = async (platform: string, accountId: string) => {
    try {
      const { error } = await supabase
        .from('social_media_accounts')
        .delete()
        .eq('id', accountId);

      if (error) throw error;

      setProfile(prev => ({
        ...prev,
        connectedAccounts: {
          ...prev.connectedAccounts,
          [platform]: prev.connectedAccounts[platform].filter(account => account.id !== accountId)
        }
      }));
    } catch (error) {
      console.error('Error disconnecting account:', error);
    }
  };

  // Handle notification toggle
  const handleNotificationToggle = (type: string) => {
    setProfile(prev => ({
      ...prev,
      notificationPreferences: {
        ...prev.notificationPreferences,
        [type]: !prev.notificationPreferences[type as keyof typeof prev.notificationPreferences]
      }
    }));
  };

  // Handle setting primary account
  const handleSetPrimaryAccount = (platform: string, accountId: string) => {
    setProfile(prev => ({
      ...prev,
      connectedAccounts: {
        ...prev.connectedAccounts,
        [platform]: prev.connectedAccounts[platform].map(account => ({
          ...account,
          isPrimary: account.id === accountId
        }))
      }
    }));
  };

  return (
    <div className="space-y-8">
      {/* Profile Section */}
      <section className="p-6 bg-black/40 border border-gray-800 rounded-lg">
        <div className="flex items-center gap-4 mb-6">
          <div className="h-20 w-20 rounded-full bg-gray-800 flex items-center justify-center text-2xl font-bold">
            {profile.name.charAt(0)}
          </div>
          <div>
            <h2 className="text-xl font-bold">{profile.name}</h2>
            <p className="text-gray-400">{profile.email}</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Display Name</label>
            <input
              type="text"
              value={profile.name}
              onChange={(e) => handleProfileUpdate('name', e.target.value)}
              className="w-full p-3 bg-black/40 border border-gray-700 rounded-lg focus:border-red-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">Bio</label>
            <textarea
              value={profile.bio}
              onChange={(e) => handleProfileUpdate('bio', e.target.value)}
              className="w-full p-3 bg-black/40 border border-gray-700 rounded-lg focus:border-red-500 focus:outline-none"
              rows={3}
            />
          </div>
        </div>
      </section>

      {/* Connected Platforms */}
      <section className="p-6 bg-black/40 border border-gray-800 rounded-lg">
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
          <Globe className="h-5 w-5 text-blue-400" />
          Connected Accounts
        </h3>

        <div className="space-y-6">
          {/* TikTok Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-medium flex items-center gap-2">
                <svg className="h-5 w-5 text-cyan-400" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
                </svg>
                <span>TikTok</span>
              </h4>
            </div>
            
            {profile.connectedAccounts.tiktok.length === 0 ? (
              <ConnectTikTok />
            ) : (
              <div className="space-y-2">
                {profile.connectedAccounts.tiktok.map((account) => (
                  <div
                    key={account.id}
                    className="p-4 border border-gray-700 rounded-lg"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">@{account.username}</p>
                          {account.isVerified && (
                            <span className="px-2 py-0.5 bg-blue-900/20 text-blue-400 text-xs rounded-full">
                              Verified
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-4 mt-1 text-sm text-gray-400">
                          <span>{account.followers} followers</span>
                          <span>Added {new Date(account.addedOn).toLocaleDateString()}</span>
                        </div>
                      </div>
                      
                      <button
                        onClick={() => handleAccountDisconnect('tiktok', account.id)}
                        className="px-3 py-1.5 border border-red-500 text-red-400 rounded text-sm hover:bg-red-900/20"
                      >
                        Disconnect
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Other platforms can be added here */}
        </div>
        
        <div className="mt-6 p-4 bg-black/20 border border-gray-700 rounded-lg">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-gray-400">
              <p className="mb-2">You can connect multiple accounts for each platform. The primary account will be used by default for campaigns.</p>
              <p>All connected accounts must comply with our platform guidelines and creator terms of service.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Notification Preferences */}
      <section className="p-6 bg-black/40 border border-gray-800 rounded-lg">
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
          <Bell className="h-5 w-5 text-yellow-400" />
          Notification Preferences
        </h3>

        <div className="space-y-4">
          {[
            { id: 'email', label: 'Email Notifications', desc: 'Receive updates via email' },
            { id: 'campaigns', label: 'Campaign Alerts', desc: 'Get notified about new campaign opportunities' },
            { id: 'payments', label: 'Payment Notifications', desc: 'Receive alerts about earnings and payouts' },
            { id: 'updates', label: 'Platform Updates', desc: 'Stay informed about new features and changes' }
          ].map(pref => (
            <div
              key={pref.id}
              className="flex items-center justify-between p-4 border border-gray-700 rounded-lg"
            >
              <div>
                <p className="font-medium">{pref.label}</p>
                <p className="text-sm text-gray-400">{pref.desc}</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={profile.notificationPreferences[pref.id as keyof typeof profile.notificationPreferences]}
                  onChange={() => handleNotificationToggle(pref.id)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
              </label>
            </div>
          ))}
        </div>
      </section>

      {/* Security Settings */}
      <section className="p-6 bg-black/40 border border-gray-800 rounded-lg">
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
          <Shield className="h-5 w-5 text-green-400" />
          Security Settings
        </h3>

        <div className="space-y-4">
          <button className="w-full p-4 border border-gray-700 rounded-lg text-left hover:bg-white/5 transition-colors">
            <p className="font-medium">Change Password</p>
            <p className="text-sm text-gray-400">Update your account password</p>
          </button>

          <button className="w-full p-4 border border-gray-700 rounded-lg text-left hover:bg-white/5 transition-colors">
            <p className="font-medium">Two-Factor Authentication</p>
            <p className="text-sm text-gray-400">Add an extra layer of security</p>
          </button>
        </div>
      </section>

      {/* Account Management */}
      <section className="p-6 bg-black/40 border border-gray-800 rounded-lg">
        <h3 className="text-lg font-bold mb-4 text-red-400 flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" />
          Account Management
        </h3>

        <div className="space-y-4">
          <button className="w-full p-4 border border-red-500 text-red-400 rounded-lg text-left hover:bg-red-900/20 transition-colors">
            <p className="font-medium">Delete Account</p>
            <p className="text-sm">Permanently delete your account and all data</p>
          </button>
        </div>
      </section>
    </div>
  );
};

export default SettingsView;