import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  User, Bell, Link as LinkIcon, Shield, Wallet, 
  Check, AlertTriangle, LogOut, Globe, Instagram, 
  Youtube, Twitter, Plus, Info
} from 'lucide-react';

const SettingsView = () => {
  // User profile state
  const [profile, setProfile] = useState({
    name: 'Creator Name',
    email: 'creator@example.com',
    bio: 'Content creator passionate about tech and lifestyle.',
    notificationPreferences: {
      email: true,
      campaigns: true,
      payments: true,
      updates: true
    },
    connectedAccounts: {
      instagram: [
        {
          id: 'ig1',
          username: 'creator.main',
          followers: '180K',
          isVerified: true,
          isPrimary: true,
          addedOn: '2025-01-15'
        },
        {
          id: 'ig2',
          username: 'creator.gaming',
          followers: '85K',
          isVerified: true,
          isPrimary: false,
          addedOn: '2025-02-01'
        }
      ],
      youtube: [
        {
          id: 'yt1',
          username: 'Creator Official',
          followers: '250K',
          isVerified: true,
          isPrimary: true,
          addedOn: '2025-01-10'
        }
      ],
      tiktok: [
        {
          id: 'tt1',
          username: 'creator',
          followers: '500K',
          isVerified: true,
          isPrimary: true,
          addedOn: '2024-12-20'
        },
        {
          id: 'tt2',
          username: 'creator.clips',
          followers: '120K',
          isVerified: true,
          isPrimary: false,
          addedOn: '2025-01-05'
        }
      ],
      twitter: []
    }
  });

  // Handle profile updates
  const handleProfileUpdate = (field: string, value: any) => {
    setProfile(prev => ({
      ...prev,
      [field]: value
    }));
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

  // Handle platform disconnect
  const handleAccountDisconnect = (platform: string, accountId: string) => {
    setProfile(prev => ({
      ...prev,
      connectedAccounts: {
        ...prev.connectedAccounts,
        [platform]: prev.connectedAccounts[platform].filter(account => account.id !== accountId)
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
          {Object.entries(profile.connectedAccounts).map(([platform, accounts]) => (
            <div key={platform} className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-medium flex items-center gap-2">
                  {platform === 'instagram' && <Instagram className="h-5 w-5 text-pink-400" />}
                  {platform === 'youtube' && <Youtube className="h-5 w-5 text-red-400" />}
                  {platform === 'twitter' && <Twitter className="h-5 w-5 text-blue-400" />}
                  {platform === 'tiktok' && (
                    <svg className="h-5 w-5 text-cyan-400" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
                    </svg>
                  )}
                  <span className="capitalize">{platform}</span>
                </h4>
                <button
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm flex items-center gap-2"
                  onClick={() => {/* Handle connect new account */}}
                >
                  <Plus className="h-4 w-4" />
                  Add Account
                </button>
              </div>
              
              <div className="space-y-2">
                {accounts.map((account) => (
                  <div
                    key={account.id}
                    className={`p-4 border rounded-lg ${
                      account.isPrimary ? 'border-green-500 bg-green-900/10' : 'border-gray-700'
                    }`}
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
                          {account.isPrimary && (
                            <span className="px-2 py-0.5 bg-green-900/20 text-green-400 text-xs rounded-full">
                              Primary
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-4 mt-1 text-sm text-gray-400">
                          <span>{account.followers} followers</span>
                          <span>Added {new Date(account.addedOn).toLocaleDateString()}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {!account.isPrimary && (
                          <button
                            onClick={() => handleSetPrimaryAccount(platform, account.id)}
                            className="px-3 py-1.5 border border-gray-700 rounded text-sm hover:bg-white/5"
                          >
                            Make Primary
                          </button>
                        )}
                        <button
                          onClick={() => handleAccountDisconnect(platform, account.id)}
                          className="px-3 py-1.5 border border-red-500 text-red-400 rounded text-sm hover:bg-red-900/20"
                        >
                          Disconnect
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                
                {accounts.length === 0 && (
                  <div className="p-4 border border-gray-700 rounded-lg text-center">
                    <p className="text-gray-400">No accounts connected</p>
                    <button
                      className="mt-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm"
                      onClick={() => {/* Handle connect first account */}}
                    >
                      Connect {platform}
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
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