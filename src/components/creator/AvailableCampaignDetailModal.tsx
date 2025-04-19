import React, { useState } from 'react';
import { X, DollarSign, Zap, Instagram, AlertCircle } from 'lucide-react';
import type { AvailableCampaign } from './types';
import { formatNumber } from '@/utils/format';
import { motion, AnimatePresence } from 'framer-motion';

interface AccountSelection {
  [platform: string]: {
    accountIds: string[];
    accountTypes: {
      [accountId: string]: 'original' | 'repurposed' | null;
    };
  };
}

// Mock connected accounts for demonstration
// In a real app, this would come from a user's profile or state
const connectedAccounts = {
  instagram: [
    { id: 'ig1', username: 'creator_official', followers: '10.5K', isVerified: true },
    { id: 'ig2', username: 'creator_personal', followers: '5.2K', isVerified: false }
  ],
  tiktok: [
    { id: 'tt1', username: 'creator_tiktok', followers: '25K', isVerified: true }
  ],
  youtube: [
    { id: 'yt1', username: 'CreatorChannel', followers: '8.7K', isVerified: false }
  ]
};

interface AvailableCampaignDetailModalProps {
  campaign: AvailableCampaign;
  onClose: () => void;
  onJoin: (selectedPlatforms: string[]) => void;
}

const AvailableCampaignDetailModal: React.FC<AvailableCampaignDetailModalProps> = ({ 
  campaign, 
  onClose,
  onJoin
}) => {
  const [showAccountSelection, setShowAccountSelection] = useState(false);
  const [selectedAccounts, setSelectedAccounts] = useState<AccountSelection>({});
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Helper function to safely display brand information
  const renderBrandName = () => {
    if (!campaign.brand) return "Unknown Brand";
    
    // If brand is an object with a name property
    if (typeof campaign.brand === 'object' && campaign.brand !== null && 'name' in campaign.brand) {
      return campaign.brand.name;
    }
    
    // If brand is a string
    if (typeof campaign.brand === 'string') {
      return campaign.brand;
    }
    
    return "Unknown Brand";
  };

  const handleStartJoin = () => {
    setShowAccountSelection(true);
  };

  const handleAccountSelect = (platform: string, accountId: string, isSelected: boolean) => {
    if (isSelected) {
      // Remove account from selection
      setSelectedAccounts(prev => ({
        ...prev,
        [platform]: {
          accountIds: prev[platform]?.accountIds.filter(id => id !== accountId) || [], 
          accountTypes: {
            ...prev[platform]?.accountTypes
          }
        }
      }));
    } else {
      // Add account to selection
      setSelectedAccounts(prev => ({
        ...prev,
        [platform]: {
          accountIds: [...(prev[platform]?.accountIds || []), accountId],
          accountTypes: {
            ...prev[platform]?.accountTypes || {},
            [accountId]: null
          }
        }
      }));
    }
  };

  const handleContentTypeSelect = (platform: string, accountId: string, contentType: 'original' | 'repurposed') => {
    if (platform && accountId) {
      setSelectedAccounts(prev => ({
        ...prev,
        [platform]: { 
          accountIds: prev[platform]?.accountIds || [],
          accountTypes: {
            ...prev[platform]?.accountTypes,
            [accountId]: contentType
          }
        }
      }));
    }
  };

  const handleSubmitJoin = () => {
    // Validate selections
    const requiredPlatforms = campaign.requirements.platforms;
    const missingPlatforms = requiredPlatforms.filter(platform => !selectedAccounts[platform.toLowerCase()]);
    
    if (missingPlatforms.length > 0) {
      setError(`Please select accounts for: ${missingPlatforms.join(', ')}`);
      return;
    }
    
    // Validate content types are selected
    const missingContentTypes = Object.values(selectedAccounts).some(platform => 
      platform.accountIds.some(accountId => platform.accountTypes[accountId] === null)
    );
    if (missingContentTypes) {
      setError('Please select content types for all accounts');
      return;
    }
    
    // Show confirmation step
    setError(null);
    setShowConfirmation(true);
  };

  const handleConfirmJoin = () => {
    if (!termsAccepted) {
      setError('Please accept the campaign terms and requirements');
      return;
    }
    
    // Extract selected platforms for the join handler
    const selectedPlatforms = Object.keys(selectedAccounts);
    
    // Call the join handler with the selected platforms
    onJoin(selectedPlatforms);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-80 backdrop-blur-sm z-50 p-6"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <motion.div
        className="bg-black/40 border border-gray-800 rounded-lg p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
      >
        <button
          className="absolute top-4 right-4 p-2"
          onClick={onClose}
          aria-label="Close details"
        >
          <X className="h-6 w-6" />
        </button>

        <div className="flex justify-between items-start mb-6">
          <h2 className="text-2xl font-bold text-white">{campaign.title}</h2>
          <span className="px-3 py-1 rounded-full bg-red-900/20 text-red-400 text-sm font-medium">
            AVAILABLE
          </span>
        </div>

        {/* Campaign Details Section */}
        <div className="space-y-6 mb-8">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-400">Content Type</p>
              <p className="text-lg font-medium capitalize text-white">
                {campaign.contentType === 'both' 
                  ? 'Original & Repurposed' 
                  : campaign.contentType === 'original' 
                    ? 'Original Content' 
                    : 'Repurposed Content'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-400">Campaign Dates</p>
              <p className="text-lg font-medium text-white">
                {new Date(campaign.startDate).toLocaleDateString()} - {new Date(campaign.endDate).toLocaleDateString()}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-400">Brand</p>
              <p className="text-lg font-medium text-white">{renderBrandName()}</p>
            </div>
            <div>
              <p className="text-sm text-gray-400">Platforms</p>
              <div className="flex flex-wrap gap-2 mt-1">
                {Array.isArray(campaign.requirements.platforms) && campaign.requirements.platforms.map((platform) => (
                  <span
                    key={platform}
                    className="px-3 py-1 bg-black/40 border border-gray-700 rounded-lg text-sm text-gray-300"
                  >
                    {platform.charAt(0).toUpperCase() + platform.slice(1)}
                  </span>
                ))}
              </div>
            </div>
          </div>
          
          {/* Content Sections */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Original Content Section */}
            {(campaign.contentType === 'original' || campaign.contentType === 'both') && (
              <div className="bg-black/40 p-4 rounded-lg border border-gray-800">
                <h5 className="font-medium text-green-400 mb-3">
                  Original Content
                </h5>

                <div className="mb-3">
                  <p className="text-sm text-gray-400 mb-1">Campaign Brief</p>
                  <p className="bg-black/40 p-3 rounded-lg border border-gray-800 text-sm">
                    {campaign.brief?.original || 'No brief provided'}
                  </p>
                </div>

                <div className="mb-3">
                  <p className="text-sm text-gray-400 mb-1">
                    Content Guidelines
                  </p>
                  <ul className="list-disc pl-5 space-y-1 text-sm">
                    {campaign.requirements?.contentGuidelines
                      .filter((guideline) => guideline.trim().length > 0)
                      .map((guideline, index) => (
                        <li key={index}>{guideline}</li>
                      ))}
                    {!campaign.requirements?.contentGuidelines?.length && (
                      <li className="text-gray-500 italic">
                        No guidelines provided
                      </li>
                    )}
                  </ul>
                </div>

                {campaign.requirements?.hashtags?.original && (
                  <div className="mb-3">
                    <p className="text-sm text-gray-400 mb-1">
                      Required Hashtag
                    </p>
                    <p className="font-bold text-blue-400">
                      {campaign.requirements.hashtags.original}
                    </p>
                  </div>
                )}
                
                <div className="mt-4">
                  <p className="text-sm text-gray-400 mb-1">Payout Rate</p>
                  <div className="bg-black/40 p-3 rounded-lg border border-gray-800">
                    <span className="text-green-400 font-medium">
                      ${campaign.requirements?.payoutRate?.original || '0'} <span className="text-gray-300">per 1M views</span>
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Repurposed Content Section */}
            {(campaign.contentType === 'repurposed' || campaign.contentType === 'both') && (
              <div className="bg-black/40 p-4 rounded-lg border border-gray-800">
                <h5 className="font-medium text-blue-400 mb-3">
                  Repurposed Content
                </h5>

                <div className="mb-3">
                  <p className="text-sm text-gray-400 mb-1">Campaign Brief</p>
                  <p className="bg-black/40 p-3 rounded-lg border border-gray-800 text-sm">
                    {campaign.brief?.repurposed || 'No brief provided'}
                  </p>
                </div>

                <div className="mb-3">
                  <p className="text-sm text-gray-400 mb-1">
                    Content Guidelines
                  </p>
                  <ul className="list-disc pl-5 space-y-1 text-sm">
                    {campaign.requirements?.contentGuidelines
                      .filter((guideline) => guideline.trim().length > 0)
                      .map((guideline, index) => (
                        <li key={index}>{guideline}</li>
                      ))}
                    {!campaign.requirements?.contentGuidelines?.length && (
                      <li className="text-gray-500 italic">
                        No guidelines provided
                      </li>
                    )}
                  </ul>
                </div>

                {campaign.requirements?.hashtags?.repurposed && (
                  <div className="mb-3">
                    <p className="text-sm text-gray-400 mb-1">
                      Required Hashtag
                    </p>
                    <p className="font-bold text-blue-400">
                      {campaign.requirements.hashtags.repurposed}
                    </p>
                  </div>
                )}
                
                <div className="mt-4">
                  <p className="text-sm text-gray-400 mb-1">Payout Rate</p>
                  <div className="bg-black/40 p-3 rounded-lg border border-gray-800">
                    <span className="text-green-400 font-medium">
                      ${campaign.requirements?.payoutRate?.repurposed || '0'} <span className="text-gray-300">per 1M views</span>
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Platform Guidelines and Agreement Terms */}
        <div className="mt-6 p-4 bg-black/40 border border-gray-800 rounded-lg">
          <h3 className="text-lg font-medium mb-3 flex items-center">
            <AlertCircle className="h-5 w-5 text-yellow-400 mr-2" />
            Platform Guidelines
          </h3>
          
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-300 mb-2">By joining this campaign, you agree to follow these platform-specific guidelines:</p>
              
              <ul className="list-disc pl-5 space-y-2 text-sm">
                <li>Post content that adheres to the platform's community guidelines and terms of service</li>
                <li>Include all required hashtags and mentions as specified in the campaign brief</li>
                <li>Maintain the post for a minimum of 30 days after publishing</li>
                <li>Respond to relevant comments on your content within 48 hours of posting</li>
                <li>Do not edit or alter the content after submission without brand approval</li>
                <li>Report any issues or concerns to the campaign manager immediately</li>
              </ul>
            </div>
            
            <div>
              <p className="text-sm text-gray-300 mb-2">Additional requirements:</p>
              <ul className="list-disc pl-5 space-y-2 text-sm">
                <li>All content must be approved by the brand before posting</li>
                <li>You must use the campaign tracking links provided in your dashboard</li>
                <li>Analytics screenshots may be required to verify view counts</li>
                <li>Payment processing begins after the campaign end date and verification of metrics</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Join Campaign Button */}
        <div className="mt-8 flex justify-center">
          <motion.button
            onClick={(e) => {
              e.stopPropagation();
              handleStartJoin();
            }}
            className="px-8 py-4 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 text-white rounded-lg shadow-lg shadow-red-600/20 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50 font-bold flex items-center gap-2 transition-all transform hover:scale-105"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
          >
            <Zap className="h-5 w-5" />
            <span className="text-lg">Join This Campaign</span>
          </motion.button>
        </div>
      </motion.div>

      {/* Account Selection Modal */}
      <AnimatePresence>
        {showAccountSelection && (
          <div className="fixed inset-0 bg-black bg-opacity-80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <motion.div
              className="bg-black/40 border border-gray-800 rounded-lg p-6 w-full max-w-md"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-xl font-bold mb-4">Select Account</h3>
              <div className="space-y-4">
                {campaign.requirements.platforms.map((platform: string) => {
                  const accounts = connectedAccounts[platform.toLowerCase() as keyof typeof connectedAccounts] || [];
                  return (
                    <div key={platform} className="space-y-2">
                      <div className="font-medium flex items-center justify-between">
                        <div className="flex items-center gap-2">
                        {platform === 'Instagram' && <Instagram className="h-5 w-5 text-pink-500" />}
                        {platform}
                        </div>
                      </div>
                      {accounts.length > 0 ? (
                        accounts.map(account => (
                          <div
                            key={account.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAccountSelect(
                                platform.toLowerCase(), 
                                account.id,
                                selectedAccounts[platform.toLowerCase()]?.accountIds?.includes(account.id) || false
                              );
                            }}
                            className={`w-full p-4 border rounded-lg transition-colors text-left cursor-pointer ${
                              selectedAccounts[platform.toLowerCase()]?.accountIds?.includes(account.id)
                                ? 'border-red-500 bg-red-900/10'
                                : 'border-gray-700 hover:border-red-500 hover:bg-red-900/10'
                            }`}
                          >
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-medium">@{account.username}</span>
                                {account.isVerified && (
                                  <span className="px-2 py-0.5 bg-blue-900/20 text-blue-400 text-xs rounded-full">
                                    Verified
                                  </span>
                                )}
                              </div>
                              <span className="text-sm text-gray-400">{account.followers} followers</span>
                            </div>
                            {selectedAccounts[platform.toLowerCase()]?.accountIds?.includes(account.id) && (
                              <div className="flex flex-col gap-2 mt-3">
                                <p className="text-sm text-gray-400">Content type for this account:</p>
                                {(campaign.contentType === 'both' || campaign.contentType === 'original') && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleContentTypeSelect(platform.toLowerCase(), account.id, 'original');
                                    }}
                                    className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                                      selectedAccounts[platform.toLowerCase()]?.accountTypes[account.id] === 'original'
                                        ? 'bg-green-900/20 text-green-400 border border-green-500'
                                        : 'border border-gray-700 hover:border-green-500'
                                    }`}
                                  >Original</button>
                                )}
                                {(campaign.contentType === 'both' || campaign.contentType === 'repurposed') && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleContentTypeSelect(platform.toLowerCase(), account.id, 'repurposed');
                                    }}
                                    className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                                      selectedAccounts[platform.toLowerCase()]?.accountTypes[account.id] === 'repurposed'
                                        ? 'bg-blue-900/20 text-blue-400 border border-blue-500'
                                        : 'border border-gray-700 hover:border-blue-500'
                                    }`}
                                  >Repurposed</button>
                                )}
                              </div>
                            )}
                          </div>  
                        ))
                      ) : (
                        <div className="p-4 border border-gray-700 rounded-lg text-center">
                          <p className="text-gray-400 mb-2">No accounts connected</p>
                          <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm">
                            Connect {platform}
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              <div className="flex justify-end mt-6">
                <button
                  onClick={handleSubmitJoin}
                  className="px-6 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-white font-medium ml-4"
                >
                  Continue
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      
      {/* Confirmation Step */}
      <AnimatePresence>
        {showConfirmation && (
          <div className="fixed inset-0 bg-black bg-opacity-80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <motion.div
              className="bg-black/40 border border-gray-800 rounded-lg p-6 w-full max-w-md"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-xl font-bold mb-4">Confirm Campaign Join</h3>
              
              <div className="space-y-4 mb-6">
                <div className="p-4 bg-black/20 border border-gray-700 rounded-lg">
                  <h4 className="font-medium mb-2">Selected Accounts</h4>
                  {Object.entries(selectedAccounts).map(([platform, account]) => (
                    <div key={platform} className="flex items-center justify-between py-2">
                      <div>
                        <p className="font-medium capitalize">{platform}</p>
                        <div className="space-y-1">
                          {account.accountIds.map(id => {
                            const accountInfo = connectedAccounts[platform as keyof typeof connectedAccounts]
                              ?.find(a => a.id === id);
                            const contentType = account.accountTypes[id];
                            return (
                              <div key={id} className="flex items-center justify-between">
                                <p className="text-sm text-gray-400">
                                  @{accountInfo?.username}
                                </p>
                                <span className={`px-2 py-1 text-xs rounded-full ${
                                  contentType === 'original'
                                    ? 'bg-green-900/20 text-green-400 border border-green-500'
                                    : 'bg-blue-900/20 text-blue-400 border border-blue-500'
                                }`}>
                                  {contentType}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="mt-1">
                    <input
                      type="checkbox"
                      id="terms"
                      checked={termsAccepted}
                      onChange={(e) => setTermsAccepted(e.target.checked)}
                      className="rounded border-gray-700 text-red-500 focus:ring-red-500"
                    />
                  </div>
                  <label htmlFor="terms" className="text-sm text-gray-300">
                    I have read and agree to follow all campaign requirements, including content guidelines,
                    hashtag usage, and brand specifications. I understand that payment is based on
                    view metrics as outlined in the payout rates.
                  </label>
                </div>
                
                {error && (
                  <div className="p-3 bg-red-900/20 border border-red-500 rounded-lg">
                    <div className="flex items-center gap-2 text-red-400">
                      <AlertCircle className="h-5 w-5" />
                      <p>{error}</p>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowConfirmation(false)}
                  className="px-4 py-2 border border-gray-700 rounded-lg text-gray-300 hover:bg-gray-800 transition-colors"
                >
                  Back
                </button>
                <motion.button
                  onClick={handleConfirmJoin}
                  className="px-6 py-3 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 text-white rounded-lg shadow-lg shadow-red-600/20 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50 font-bold transition-all"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Join Campaign
                </motion.button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AvailableCampaignDetailModal; 