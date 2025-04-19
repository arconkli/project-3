import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Check, AlertCircle } from 'lucide-react';
import * as apis from '@/lib/apis';
import { supabase } from '@/lib/supabaseClient';

interface AccountAuthModalProps {
  platform: 'instagram' | 'youtube' | 'tiktok' | 'twitter';
  onClose: () => void;
  onSuccess: () => void;
}

const AccountAuthModal: React.FC<AccountAuthModalProps> = ({ platform, onClose, onSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      let accountData;

      switch (platform) {
        case 'instagram':
          const igClient = await apis.initializeInstagramAPI(username, password);
          const igStats = await apis.getInstagramUserStats(username);
          accountData = {
            username,
            followers: igStats.followers,
            isVerified: igStats.isVerified,
            addedOn: new Date().toISOString(),
            metrics: {
              engagement: igStats.engagement,
              posts: igStats.posts
            }
          };
          break;

        case 'youtube':
          const ytStats = await apis.getYouTubeChannelStats(username, import.meta.env.VITE_YOUTUBE_API_KEY);
          accountData = {
            username,
            followers: ytStats.subscribers,
            isVerified: true,
            addedOn: new Date().toISOString(),
            metrics: {
              views: ytStats.views,
              videos: ytStats.videos
            }
          };
          break;

        case 'twitter':
          const twitterClient = apis.initializeTwitterAPI(
            import.meta.env.VITE_TWITTER_API_KEY,
            import.meta.env.VITE_TWITTER_API_SECRET,
            import.meta.env.VITE_TWITTER_ACCESS_TOKEN,
            import.meta.env.VITE_TWITTER_ACCESS_SECRET
          );
          const twitterStats = await apis.getTwitterUserStats(twitterClient, username);
          accountData = {
            username,
            followers: twitterStats.followers,
            isVerified: twitterStats.isVerified,
            addedOn: new Date().toISOString(),
            metrics: {
              tweets: twitterStats.tweets,
              listed: twitterStats.listed
            }
          };
          break;

        case 'tiktok':
          const tiktokStats = await apis.getTikTokUserStats(import.meta.env.VITE_TIKTOK_API_KEY, username);
          accountData = {
            username,
            followers: tiktokStats.followers,
            isVerified: tiktokStats.verified,
            addedOn: new Date().toISOString(),
            metrics: {
              likes: tiktokStats.likes,
              videos: tiktokStats.videos
            }
          };
          break;
      }

      // Save to Supabase
      const { data: profile } = await supabase.auth.getUser();
      if (!profile.user) throw new Error('Not authenticated');

      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          platforms: {
            [platform]: accountData
          }
        })
        .eq('id', profile.user.id);

      if (updateError) throw updateError;

      onSuccess();
    } catch (err) {
      console.error('Error connecting account:', err);
      setError('Failed to connect account. Please check your credentials and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <motion.div
        className="bg-black/40 border border-gray-800 rounded-lg p-6 w-full max-w-md"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">Connect {platform.charAt(0).toUpperCase() + platform.slice(1)}</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-full"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="p-3 mb-4 bg-red-900/20 border border-red-500 rounded-lg">
            <div className="flex items-center gap-2 text-red-400">
              <AlertCircle className="h-5 w-5" />
              <p>{error}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleAuth} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">
              {platform === 'youtube' ? 'Channel ID' : 'Username'}
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full p-3 bg-black/40 border border-gray-700 rounded-lg focus:border-red-500 focus:outline-none"
              required
            />
          </div>

          {platform === 'instagram' && (
            <div>
              <label className="block text-sm text-gray-400 mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-3 bg-black/40 border border-gray-700 rounded-lg focus:border-red-500 focus:outline-none"
                required
              />
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-red-600 hover:bg-red-700 disabled:opacity-50 rounded-lg font-medium flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                Connecting...
              </>
            ) : (
              <>
                <Check className="h-5 w-5" />
                Connect Account
              </>
            )}
          </button>
        </form>

        <p className="mt-4 text-sm text-gray-400">
          By connecting your account, you agree to our terms of service and data collection policies.
        </p>
      </motion.div>
    </div>
  );
};

export default AccountAuthModal;