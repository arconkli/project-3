import React, { useState } from 'react';
import { 
  Bell, Globe, Lock, User, Instagram, Youtube, 
  Twitter, Plus, X, AlertCircle, Eye, EyeOff, Check, ChevronLeft,
  Save
} from 'lucide-react';

// Sample interface for connected accounts
interface SocialAccount {
  id: string;
  username: string;
  followers: string;
  isVerified: boolean;
  isPrimary: boolean;
  addedOn: string;
}

interface ConnectedAccounts {
  instagram: SocialAccount[];
  youtube: SocialAccount[];
  tiktok: SocialAccount[];
  twitter: SocialAccount[];
}

type SecurityView = 'main' | 'password' | '2fa' | 'privacy';

const SettingsView: React.FC = () => {
  const [notificationSettings, setNotificationSettings] = useState({
    email: true,
    campaigns: true,
    payments: true,
    updates: true
  });

  const [profileSettings, setProfileSettings] = useState({
    name: 'John Creator',
    bio: 'Content creator passionate about tech',
    email: 'creator@create-os.com',
    phone: '+1 (555) 123-4567'
  });

  // Security section states
  const [securityView, setSecurityView] = useState<SecurityView>('main');
  const [passwordData, setPasswordData] = useState({
    current: '',
    new: '',
    confirm: ''
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  
  // State for save feedback
  const [showSaveConfirmation, setShowSaveConfirmation] = useState(false);

  // Connected accounts state
  const [connectedAccounts, setConnectedAccounts] = useState<ConnectedAccounts>({
    instagram: [
      {
        id: 'ig1',
        username: 'johncreator',
        followers: '135K',
        isVerified: true,
        isPrimary: true,
        addedOn: '2023-11-15'
      }
    ],
    youtube: [
      {
        id: 'yt1',
        username: 'John Creator',
        followers: '245K',
        isVerified: true,
        isPrimary: true,
        addedOn: '2023-10-20'
      }
    ],
    tiktok: [
      {
        id: 'tt1',
        username: 'johncreator',
        followers: '520K',
        isVerified: true,
        isPrimary: true,
        addedOn: '2023-09-30'
      }
    ],
    twitter: []
  });

  // State for the add account modal
  const [showAddAccountModal, setShowAddAccountModal] = useState(false);
  const [accountToAdd, setAccountToAdd] = useState<string | null>(null);
  const [newUsername, setNewUsername] = useState('');
  
  const handleNotificationToggle = (key: keyof typeof notificationSettings) => {
    setNotificationSettings(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleAddAccount = (platform: string) => {
    setAccountToAdd(platform);
    setNewUsername('');
    setShowAddAccountModal(true);
  };

  const handleRemoveAccount = (platform: string, accountId: string) => {
    setConnectedAccounts(prev => ({
      ...prev,
      [platform]: prev[platform as keyof ConnectedAccounts].filter(acc => acc.id !== accountId)
    }));
  };

  const handleSetPrimaryAccount = (platform: string, accountId: string) => {
    setConnectedAccounts(prev => {
      const updatedAccounts = prev[platform as keyof ConnectedAccounts].map(acc => ({
        ...acc,
        isPrimary: acc.id === accountId
      }));
      
      return {
        ...prev,
        [platform]: updatedAccounts
      };
    });
  };

  const handleAddNewAccount = () => {
    if (!accountToAdd || !newUsername.trim()) return;
    
    // This would normally make an API call to validate the account
    // For this example, we'll just create a mock account
    const newAccount: SocialAccount = {
      id: `${accountToAdd}-${Date.now()}`,
      username: newUsername,
      followers: '0',
      isVerified: false,
      isPrimary: connectedAccounts[accountToAdd as keyof ConnectedAccounts].length === 0,
      addedOn: new Date().toISOString()
    };

    setConnectedAccounts(prev => ({
      ...prev,
      [accountToAdd]: [...prev[accountToAdd as keyof ConnectedAccounts], newAccount]
    }));

    setShowAddAccountModal(false);
    setAccountToAdd(null);
    setNewUsername('');
  };

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess(false);

    // Basic validation
    if (!passwordData.current) {
      setPasswordError('Current password is required');
      return;
    }

    if (passwordData.new.length < 8) {
      setPasswordError('New password must be at least 8 characters');
      return;
    }

    if (passwordData.new !== passwordData.confirm) {
      setPasswordError('New passwords do not match');
      return;
    }

    // This would normally call an API to change the password
    // For demo purposes, we'll just simulate success
    setTimeout(() => {
      setPasswordSuccess(true);
      setPasswordData({
        current: '',
        new: '',
        confirm: ''
      });
    }, 800);
  };

  const handlePasswordInput = (field: keyof typeof passwordData, value: string) => {
    setPasswordData(prev => ({
      ...prev,
      [field]: value
    }));
    setPasswordError('');
    setPasswordSuccess(false);
  };

  // Platform display helpers
  const platformIcons = {
    instagram: <Instagram className="h-5 w-5 text-pink-500" />,
    youtube: <Youtube className="h-5 w-5 text-red-500" />,
    twitter: <Twitter className="h-5 w-5 text-blue-500" />,
    tiktok: (
      <svg className="h-5 w-5 text-cyan-400" viewBox="0 0 24 24" fill="currentColor">
        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
      </svg>
    )
  };

  const renderSecurityContent = () => {
    switch (securityView) {
      case 'password':
        return (
          <div className="space-y-5">
            <button 
              onClick={() => setSecurityView('main')}
              className="flex items-center text-gray-400 hover:text-white transition-colors mb-4"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back to Security
            </button>
            
            <h3 className="text-lg font-medium mb-4">Change Password</h3>
            
            {passwordSuccess && (
              <div className="p-3 bg-green-900/20 border border-green-800 rounded-lg text-green-400 flex items-start gap-2 mb-4">
                <Check className="h-5 w-5 flex-shrink-0 mt-0.5" />
                <span>Your password has been successfully updated.</span>
              </div>
            )}
            
            {passwordError && (
              <div className="p-3 bg-red-900/20 border border-red-800 rounded-lg text-red-400 mb-4">
                {passwordError}
              </div>
            )}
            
            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Current Password</label>
                <div className="relative">
                  <input
                    type={showCurrentPassword ? 'text' : 'password'}
                    value={passwordData.current}
                    onChange={(e) => handlePasswordInput('current', e.target.value)}
                    className="w-full px-3 py-2 bg-black/20 border border-gray-700 rounded-lg focus:outline-none focus:border-red-500 text-white pr-10"
                  />
                  <button
                    type="button"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  >
                    {showCurrentPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>
              
              <div>
                <label className="block text-sm text-gray-400 mb-1">New Password</label>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={passwordData.new}
                    onChange={(e) => handlePasswordInput('new', e.target.value)}
                    className="w-full px-3 py-2 bg-black/20 border border-gray-700 rounded-lg focus:outline-none focus:border-red-500 text-white pr-10"
                  />
                  <button
                    type="button"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                  >
                    {showNewPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">Minimum 8 characters</p>
              </div>
              
              <div>
                <label className="block text-sm text-gray-400 mb-1">Confirm New Password</label>
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  value={passwordData.confirm}
                  onChange={(e) => handlePasswordInput('confirm', e.target.value)}
                  className="w-full px-3 py-2 bg-black/20 border border-gray-700 rounded-lg focus:outline-none focus:border-red-500 text-white"
                />
              </div>
              
              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full sm:w-auto px-6 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors"
                >
                  Update Password
                </button>
              </div>
            </form>
          </div>
        );
        
      case '2fa':
        return (
          <div className="space-y-5">
            <button 
              onClick={() => setSecurityView('main')}
              className="flex items-center text-gray-400 hover:text-white transition-colors mb-4"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back to Security
            </button>
            
            <h3 className="text-lg font-medium mb-4">Two-Factor Authentication</h3>
            
            <div className="p-5 border border-gray-800 rounded-lg bg-black/30">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h4 className="font-medium text-lg">Authenticator App</h4>
                  <p className="text-gray-400 text-sm mt-1">
                    Use an authentication app to get two-factor authentication codes when prompted.
                  </p>
                </div>
                <button className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors whitespace-nowrap">
                  Set Up
                </button>
              </div>
            </div>
            
            <div className="p-5 border border-gray-800 rounded-lg bg-black/30 mt-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h4 className="font-medium text-lg">SMS Authentication</h4>
                  <p className="text-gray-400 text-sm mt-1">
                    Get verification codes sent to your phone via SMS.
                  </p>
                </div>
                <button className="px-5 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors whitespace-nowrap">
                  Set Up
                </button>
              </div>
            </div>
          </div>
        );
        
      case 'privacy':
        return (
          <div className="space-y-5">
            <button 
              onClick={() => setSecurityView('main')}
              className="flex items-center text-gray-400 hover:text-white transition-colors mb-4"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back to Security
            </button>
            
            <h3 className="text-lg font-medium mb-4">Data & Privacy</h3>
            
            <div className="space-y-6">
              <div>
                <h4 className="font-medium mb-2">Account Data</h4>
                <p className="text-gray-400 text-sm mb-3">
                  Your account data and how it's used across our platform.
                </p>
                <button className="px-4 py-2 border border-gray-700 hover:bg-white/5 text-white rounded-lg transition-colors">
                  Download My Data
                </button>
              </div>
              
              <div className="pt-2 border-t border-gray-800">
                <h4 className="font-medium mb-2 mt-4">Privacy Settings</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between py-2">
                    <span className="text-gray-300">Analytics & Tracking</span>
                    <button
                      className="w-12 h-6 rounded-full transition-colors relative bg-red-500"
                      role="switch"
                      aria-checked="true"
                    >
                      <div className="absolute top-1 w-4 h-4 rounded-full bg-white right-1" />
                    </button>
                  </div>
                  
                  <div className="flex items-center justify-between py-2">
                    <span className="text-gray-300">Public Profile</span>
                    <button
                      className="w-12 h-6 rounded-full transition-colors relative bg-red-500"
                      role="switch"
                      aria-checked="true"
                    >
                      <div className="absolute top-1 w-4 h-4 rounded-full bg-white right-1" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
        
      default:
        return (
          <div className="space-y-3">
            <button 
              onClick={() => setSecurityView('password')}
              className="w-full px-4 py-3 text-left hover:bg-white/5 rounded flex items-center justify-between group"
            >
              <span className="text-gray-300 group-hover:text-white transition-colors">Change Password</span>
              <span className="text-gray-500 group-hover:text-gray-400 transition-colors">→</span>
            </button>
            <button 
              onClick={() => setSecurityView('2fa')}
              className="w-full px-4 py-3 text-left hover:bg-white/5 rounded flex items-center justify-between group"
            >
              <span className="text-gray-300 group-hover:text-white transition-colors">Two-Factor Authentication</span>
              <span className="text-gray-500 group-hover:text-gray-400 transition-colors">→</span>
            </button>
            <button 
              onClick={() => setSecurityView('privacy')}
              className="w-full px-4 py-3 text-left hover:bg-white/5 rounded flex items-center justify-between group"
            >
              <span className="text-gray-300 group-hover:text-white transition-colors">Data & Privacy</span>
              <span className="text-gray-500 group-hover:text-gray-400 transition-colors">→</span>
            </button>
          </div>
        );
    }
  };

  const handleSaveChanges = () => {
    // Here you would normally save all settings to your backend
    setShowSaveConfirmation(true);
    
    // Hide the confirmation after a few seconds
    setTimeout(() => {
      setShowSaveConfirmation(false);
    }, 3000);
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto py-6 px-4 pb-20">
      {/* Profile Settings */}
      <section>
        <h2 className="text-xl font-semibold flex items-center gap-2 mb-4">
          <User className="h-5 w-5 text-red-500" />
          Profile
        </h2>
        <div className="rounded-lg bg-[#000000] border border-gray-800 p-6 space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Display Name</label>
            <input
              type="text"
              value={profileSettings.name}
              onChange={(e) => setProfileSettings(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-3 py-2 bg-black/20 border border-gray-700 rounded-lg focus:outline-none focus:border-red-500 text-white"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Email</label>
            <input
              type="email"
              value={profileSettings.email}
              onChange={(e) => setProfileSettings(prev => ({ ...prev, email: e.target.value }))}
              className="w-full px-3 py-2 bg-black/20 border border-gray-700 rounded-lg focus:outline-none focus:border-red-500 text-white"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Bio</label>
            <textarea
              value={profileSettings.bio}
              onChange={(e) => setProfileSettings(prev => ({ ...prev, bio: e.target.value }))}
              className="w-full px-3 py-2 bg-black/20 border border-gray-700 rounded-lg focus:outline-none focus:border-red-500 text-white h-24"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Phone</label>
            <input
              type="tel"
              value={profileSettings.phone}
              onChange={(e) => setProfileSettings(prev => ({ ...prev, phone: e.target.value }))}
              className="w-full px-3 py-2 bg-black/20 border border-gray-700 rounded-lg focus:outline-none focus:border-red-500 text-white"
            />
          </div>
        </div>
      </section>

      {/* Connected Accounts */}
      <section>
        <h2 className="text-xl font-semibold flex items-center gap-2 mb-4">
          <Globe className="h-5 w-5 text-blue-500" />
          Connected Accounts
        </h2>
        <div className="rounded-lg bg-[#000000] border border-gray-800 p-6 space-y-5">
          <p className="text-gray-400 text-sm">
            Connect your social media accounts to maximize earnings. 
            Campaigns will be matched to your connected platforms.
          </p>

          {/* Connected Accounts List */}
          <div className="space-y-6">
            {Object.entries(connectedAccounts).map(([platform, accounts]) => (
              <div key={platform} className="pb-5 border-b border-gray-800 last:border-0 last:pb-0">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-medium flex items-center gap-2">
                    {platformIcons[platform as keyof typeof platformIcons]}
                    <span className="capitalize">{platform}</span>
                  </h3>
                  <button
                    onClick={() => handleAddAccount(platform)}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm flex items-center gap-2 transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                    Add
                  </button>
                </div>

                {accounts.length === 0 ? (
                  <div className="border border-blue-900/30 bg-blue-900/10 rounded-lg p-4 text-center">
                    <p className="text-blue-400 text-sm">No {platform} accounts connected yet</p>
                    <button
                      onClick={() => handleAddAccount(platform)}
                      className="mt-2 text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                    >
                      Connect {platform.charAt(0).toUpperCase() + platform.slice(1)}
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {accounts.map(account => (
                      <div 
                        key={account.id} 
                        className="border border-gray-800 rounded-lg p-4 bg-black"
                      >
                        <div className="flex flex-col sm:flex-row sm:justify-between gap-3">
                          <div className="flex items-center gap-3">
                            {platformIcons[platform as keyof typeof platformIcons]}
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="font-medium text-white">@{account.username}</p>
                                <div className="flex flex-wrap gap-2">
                                  {account.isVerified && (
                                    <span className="px-2 py-0.5 bg-blue-500/10 text-blue-400 text-xs rounded-full">
                                      Verified
                                    </span>
                                  )}
                                  {account.isPrimary && (
                                    <span className="px-2 py-0.5 bg-green-500/10 text-green-400 text-xs rounded-full">
                                      Primary
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-4 mt-1 text-sm text-gray-400">
                                <span>{account.followers} followers</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 mt-2 sm:mt-0">
                            {!account.isPrimary && accounts.length > 1 && (
                              <button
                                onClick={() => handleSetPrimaryAccount(platform, account.id)}
                                className="px-2 py-1 text-xs border border-green-500 text-green-400 rounded hover:bg-green-900/20 transition-colors"
                              >
                                Set Primary
                              </button>
                            )}
                            <button
                              onClick={() => handleRemoveAccount(platform, account.id)}
                              className="px-2 py-1 text-xs border border-red-500 text-red-400 rounded hover:bg-red-900/20 transition-colors"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Notification & Privacy Settings */}
      <section>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Notification Settings */}
          <div>
            <h2 className="text-xl font-semibold flex items-center gap-2 mb-4">
              <Bell className="h-5 w-5 text-yellow-500" />
              Notifications
            </h2>
            <div className="rounded-lg bg-[#000000] border border-gray-800 p-6 space-y-4 h-full">
              {Object.entries(notificationSettings).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between py-2">
                  <span className="capitalize text-gray-300">{key}</span>
                  <button
                    onClick={() => handleNotificationToggle(key as keyof typeof notificationSettings)}
                    className={`w-12 h-6 rounded-full transition-colors relative ${
                      value ? 'bg-red-500' : 'bg-gray-700'
                    }`}
                    aria-checked={value}
                    role="switch"
                  >
                    <div
                      className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                        value ? 'right-1' : 'left-1'
                      }`}
                    />
                    <span className="sr-only">{value ? 'Enabled' : 'Disabled'}</span>
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Privacy Settings */}
          <div>
            <h2 className="text-xl font-semibold flex items-center gap-2 mb-4">
              <Lock className="h-5 w-5 text-green-500" />
              Privacy & Security
            </h2>
            <div className="rounded-lg bg-[#000000] border border-gray-800 p-6 h-full">
              {renderSecurityContent()}
            </div>
          </div>
        </div>
      </section>

      {/* Fixed save button in bottom right */}
      <div className="fixed bottom-8 right-8 z-50">
        <button
          onClick={handleSaveChanges}
          className="h-14 w-14 sm:h-auto sm:w-auto sm:px-6 sm:py-3 bg-red-500 hover:bg-red-600 text-white rounded-full sm:rounded-lg font-medium transition-colors shadow-lg flex items-center justify-center group"
          aria-label="Save changes"
        >
          <Save className="h-6 w-6 sm:h-5 sm:w-5 sm:mr-2" />
          <span className="hidden sm:inline">Save Changes</span>
          
          {/* Save confirmation tooltip */}
          {showSaveConfirmation && (
            <div className="absolute bottom-full mb-3 left-1/2 transform -translate-x-1/2 bg-green-900 text-green-100 px-4 py-2 rounded text-sm whitespace-nowrap">
              Settings saved successfully!
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-2 h-2 bg-green-900 rotate-45"></div>
            </div>
          )}
        </button>
      </div>

      {/* Add Account Modal */}
      {showAddAccountModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/80 backdrop-blur-sm z-50 p-4">
          <div className="bg-[#000000] border border-gray-800 rounded-lg p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold flex items-center gap-2">
                {accountToAdd && platformIcons[accountToAdd as keyof typeof platformIcons]}
                <span>Add {accountToAdd && accountToAdd.charAt(0).toUpperCase() + accountToAdd.slice(1)} Account</span>
              </h3>
              <button 
                onClick={() => {
                  setShowAddAccountModal(false);
                  setAccountToAdd(null);
                }}
                className="text-gray-400 hover:text-white"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="space-y-4 py-2">
              <div>
                <label className="block text-sm text-gray-400 mb-1">
                  Username
                </label>
                <input 
                  type="text"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  placeholder={`Enter your ${accountToAdd} username`}
                  className="w-full px-3 py-3 bg-black border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500 text-white"
                />
              </div>
              
              <div className="bg-blue-900/10 border border-blue-900/30 rounded-lg p-4">
                <div className="flex gap-2">
                  <AlertCircle className="h-5 w-5 text-blue-400 flex-shrink-0" />
                  <p className="text-sm text-blue-400">
                    We'll need to verify this account. Make sure you have access to it.
                  </p>
                </div>
              </div>
              
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => {
                    setShowAddAccountModal(false);
                    setAccountToAdd(null);
                  }}
                  className="flex-1 px-4 py-3 border border-gray-700 rounded-lg text-white hover:bg-white/5"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddNewAccount}
                  className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg text-white"
                  disabled={!newUsername.trim()}
                >
                  Connect Account
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsView; 