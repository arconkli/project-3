import React, { useState, useEffect, useMemo } from 'react';
import { Search, Filter, Plus, User, Video, Share2, AlertTriangle } from 'lucide-react';
import { useCampaigns } from '@/hooks/useCampaigns';
import { useDebounce } from '@/hooks/useDebounce';
import type { Creator } from '@/types/brand';
import { supabase } from '@/lib/supabaseClient';

// Define a type for creator data from campaigns
interface CampaignCreator {
  id: string;
  creator_id: string;
  campaign_id: string;
  status: string;
  platforms: string[];
  joined_at: string;
  creator?: {
    id: string;
    email: string;
  }
}

const BrandCreators = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [platformFilter, setPlatformFilter] = useState('all');
  const [creators, setCreators] = useState<Creator[]>([]);
  const [isLoadingCreators, setIsLoadingCreators] = useState(false);
  const userData = JSON.parse(localStorage.getItem('userData') || '{}');
  const [campaignsFetched, setCampaignsFetched] = useState(false);
  
  // Use campaign hook to get brand campaigns with creators
  const { 
    brandCampaigns, 
    loading, 
    error,
    refreshCampaigns
  } = useCampaigns({ userType: 'brand', userId: userData?.id });

  // Debounce search term
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  
  // First, fetch the campaigns
  useEffect(() => {
    const fetchCampaigns = async () => {
      if (!userData?.id) return;
      
      try {
        await refreshCampaigns();
        setCampaignsFetched(true);
      } catch (err) {
        console.error('Error fetching campaigns:', err);
      }
    };
    
    fetchCampaigns();
  }, [userData?.id, refreshCampaigns]);
  
  // Then, once campaigns are fetched, get the creators
  useEffect(() => {
    const fetchCreators = async () => {
      if (!campaignsFetched || brandCampaigns.length === 0) return;
      
      try {
        setIsLoadingCreators(true);
        
        const campaignIds = brandCampaigns.map(c => c.id.toString());
        
        // First try getting campaign creators directly
        const { data: campaignCreators, error: creatorsError } = await supabase
          .from('campaign_creators')
          .select(`
            id,
            creator_id,
            campaign_id,
            status,
            platforms
          `)
          .in('campaign_id', campaignIds);
        
        if (creatorsError) {
          console.error('Error fetching campaign creators:', creatorsError);
          return;
        }
        
        if (!campaignCreators || campaignCreators.length === 0) {
          setIsLoadingCreators(false);
          return;
        }
        
        // Now fetch the actual creator user data for these creator IDs
        const creatorIds = campaignCreators.map(cc => cc.creator_id);
        
        const { data: creatorUsers, error: usersError } = await supabase
          .from('users')
          .select(`
            id,
            email,
            type
          `)
          .in('id', creatorIds);
        
        if (usersError) {
          console.error('Error fetching creator users:', usersError);
          return;
        }
        
        // Create a map of creator users for easy lookup
        const creatorMap = new Map();
        creatorUsers?.forEach(user => {
          creatorMap.set(user.id, user);
        });
        
        // Fetch creator profiles
        const { data: creatorProfiles, error: profilesError } = await supabase
          .from('profiles')
          .select(`
            id,
            full_name,
            username,
            avatar_url,
            bio
          `)
          .in('id', creatorIds);
        
        if (profilesError) {
          console.error('Error fetching creator profiles:', profilesError);
        }
        
        // Create a map of profiles for easy lookup
        const profileMap = new Map();
        creatorProfiles?.forEach(profile => {
          profileMap.set(profile.id, profile);
        });
        
        // Combine all the data
        const processedCreators = processCreatorData(campaignCreators, creatorMap, profileMap);
        setCreators(processedCreators);
      } catch (err) {
        console.error('Error in fetchCreators:', err);
      } finally {
        setIsLoadingCreators(false);
      }
    };
    
    fetchCreators();
  }, [campaignsFetched, brandCampaigns]);
  
  // Process campaign data to extract creators
  const processCreatorData = (
    campaignCreators: any[], 
    creatorMap: Map<string, any>, 
    profileMap: Map<string, any>
  ) => {
    try {
      // Transform to creator format and deduplicate by creator_id
      const creatorDataMap = new Map<string, Creator>();
      
      campaignCreators.forEach(campaignCreator => {
        const creatorId = campaignCreator.creator_id;
        const user = creatorMap.get(creatorId);
        const profile = profileMap.get(creatorId);
        
        if (!user) return;
        
        const creatorName = profile?.full_name || 
                           profile?.username || 
                           user.email?.split('@')[0] || 
                           `Creator ${creatorId.substring(0, 6)}`;
        
        // Ensure platforms is always an array
        const platforms = Array.isArray(campaignCreator.platforms) 
          ? campaignCreator.platforms 
          : (campaignCreator.platforms ? [campaignCreator.platforms] : ['Unknown']);
        
        // If we already have this creator, update their data
        if (creatorDataMap.has(creatorId)) {
          const existingCreator = creatorDataMap.get(creatorId)!;
          
          // Combine platforms from multiple campaigns
          platforms.forEach((platform: string) => {
            if (platform && !existingCreator.platforms.includes(platform)) {
              existingCreator.platforms.push(platform);
            }
          });
          
          // Increment post count
          existingCreator.posts += 1;
          
        } else {
          // Create new creator entry
          creatorDataMap.set(creatorId, {
            id: creatorId,
            name: creatorName,
            platforms: platforms.filter((p: string) => p), // Filter out empty platforms
            followers: profile?.followers || 1000, // Default value
            views: profile?.views || 5000, // Default value
            engagement: profile?.engagement_rate || 3.5, // Default value
            posts: 1
          });
        }
      });
      
      const creatorsList = Array.from(creatorDataMap.values());
      
      // Add default platform if none exists
      creatorsList.forEach(creator => {
        if (!creator.platforms || creator.platforms.length === 0) {
          creator.platforms = ['Unknown'];
        }
      });
      
      return creatorsList;
    } catch (err) {
      console.error('Error processing creators:', err);
      return [];
    }
  };
  
  // Filter creators based on search and platform
  const filteredCreators = useMemo(() => {
    return creators.filter(creator => {
      const matchesSearch = !debouncedSearchTerm || 
        creator.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase());
      
      const matchesPlatform = platformFilter === 'all' || 
        creator.platforms.some(p => p && p.toLowerCase() === platformFilter.toLowerCase());
      
      return matchesSearch && matchesPlatform;
    });
  }, [creators, debouncedSearchTerm, platformFilter]);
  
  // Display creators even if loading to avoid blank screen flicker
  const shouldShowCreators = filteredCreators.length > 0;
  
  if ((loading || isLoadingCreators) && !shouldShowCreators) {
    return (
      <div className="p-6 bg-black/40 border border-gray-800 rounded-lg flex flex-col items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-red-500 border-t-transparent mb-4"></div>
        <p className="text-gray-400">Loading creators...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="p-6 bg-black/40 border border-gray-800 rounded-lg flex flex-col items-center justify-center min-h-[400px]">
        <AlertTriangle className="h-12 w-12 text-red-500 mb-4" />
        <p className="text-red-400 text-lg font-medium mb-2">Error Loading Creators</p>
        <p className="text-gray-400 mb-6 text-center">{error}</p>
        <button
          onClick={() => refreshCampaigns()}
          className="px-6 py-2 bg-red-600 hover:bg-red-700 rounded-lg"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search and filter controls */}
      <div className="p-4 bg-black/40 border border-gray-800 rounded-lg">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex-1">
            <div className="text-xl font-bold mb-2">Creator Management</div>
            <p className="text-sm text-gray-400">View and manage creators who have worked on your campaigns</p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <div className="relative w-full sm:w-64">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                className="pl-10 pr-4 py-2 w-full bg-black/40 border border-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                placeholder="Search creators..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="flex gap-3 w-full sm:w-auto">
              <div className="relative flex-1">
                <select
                  className="px-3 py-2 w-full bg-black/40 border border-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 appearance-none pr-8"
                  value={platformFilter}
                  onChange={(e) => setPlatformFilter(e.target.value)}
                >
                  <option value="all">All Platforms</option>
                  <option value="TikTok">TikTok</option>
                  <option value="Instagram">Instagram</option>
                  <option value="YouTube">YouTube</option>
                  <option value="X">X/Twitter</option>
                  <option value="Unknown">Unknown</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                  <Filter className="h-4 w-4 text-gray-400" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Creator list */}
      {shouldShowCreators ? (
        <div className="overflow-x-auto rounded-lg border border-gray-800">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-black/40 border-b border-gray-800">
                <th className="text-left p-4 text-gray-400 font-medium">Creator</th>
                <th className="text-left p-4 text-gray-400 font-medium">Platforms</th>
                <th className="text-left p-4 text-gray-400 font-medium">Followers</th>
                <th className="text-right p-4 text-gray-400 font-medium">Views</th>
                <th className="text-right p-4 text-gray-400 font-medium">Eng. Rate</th>
                <th className="text-center p-4 text-gray-400 font-medium">Posts</th>
              </tr>
            </thead>
            <tbody>
              {filteredCreators.map((creator) => (
                <tr key={creator.id} className="border-b border-gray-800 hover:bg-white/5">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center text-lg font-bold text-gray-300">
                        {creator.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium text-white">{creator.name}</p>
                        <p className="text-xs text-gray-400">{creator.id.substring(0, 8)}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex gap-1 flex-wrap">
                      {creator.platforms && creator.platforms.length > 0 ? (
                        creator.platforms.map((platform, index) => (
                          <span
                            key={`${creator.id}-${platform || 'unknown'}-${index}`}
                            className="px-2 py-1 bg-gray-800 rounded text-sm text-gray-300"
                          >
                            {platform || 'Unknown'}
                          </span>
                        ))
                      ) : (
                        <span className="px-2 py-1 bg-gray-800 rounded text-sm text-gray-300">
                          Unknown
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="p-4 text-gray-300">{creator.followers > 0 ? (creator.followers / 1000).toFixed(1) + 'K' : 'N/A'}</td>
                  <td className="p-4 text-right text-gray-300">{creator.views > 0 ? (creator.views / 1000).toFixed(1) + 'K' : 'N/A'}</td>
                  <td className="p-4 text-right text-green-400">{creator.engagement > 0 ? creator.engagement.toFixed(1) + '%' : 'N/A'}</td>
                  <td className="p-4 text-center">{creator.posts}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="p-6 bg-black/40 border border-gray-800 rounded-lg flex flex-col items-center justify-center min-h-[300px]">
          <User className="h-12 w-12 text-gray-500 mb-4" />
          <p className="text-gray-400 mb-2 text-center">No creators found</p>
          <p className="text-gray-500 text-sm text-center max-w-md">
            {brandCampaigns.length > 0 
              ? "No creators have joined your campaigns yet or your filters didn't match any creators."
              : "You don't have any active campaigns yet. Create a campaign to attract creators."}
          </p>
          {brandCampaigns.length === 0 && (
            <button
              onClick={() => window.location.href = '/brand/campaigns/create'}
              className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-white"
            >
              Create Campaign
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default BrandCreators;