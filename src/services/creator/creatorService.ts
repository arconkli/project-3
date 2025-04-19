import { supabase } from '@/lib/supabaseClient';
import { UserProfile, PlatformConnection } from '@/types/auth';
import { Campaign } from '@/types/campaign';

/**
 * Create a user profile
 */
export const createUserProfile = async (
  profileData: Omit<UserProfile, 'created_at' | 'updated_at'>
): Promise<UserProfile> => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .insert([{
        ...profileData,
        user_id: profileData.id  // Set user_id to match id
      }])
      .select('*')
      .single();

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error creating user profile:', error);
    throw error;
  }
};

/**
 * Get user profile by user ID
 */
export const getUserProfileByUserId = async (
  userId: string
): Promise<UserProfile | null> => {
  try {
    console.log('Fetching user profile for user ID:', userId);
    
    // Query profiles table by user_id, joining with creators table
    const { data, error } = await supabase
      .from('profiles')
      .select(`
        *,
        creators (*)
      `)
      .eq('user_id', userId)
      .maybeSingle(); // Use maybeSingle to return null instead of error if not found

    if (error) {
      // Log the error but don't throw if it's just that the row wasn't found
      if (error.code === 'PGRST116') {
        console.log(`Profile not found for user_id: ${userId}`);
        return null; // Explicitly return null if profile doesn't exist
      } else {
        // Log and re-throw other unexpected errors
        console.error('Error querying profile by user_id:', error);
        throw error;
      }
    }

    console.log('Profile fetch result:', data);

    // The data structure might be slightly different due to the join
    // Ensure we return the expected shape or null
    if (data) {
        // Supabase returns the joined data as an array, even for a single join.
        // Extract the single creator object if it exists.
        const creatorData = Array.isArray(data.creators) && data.creators.length > 0 
                            ? data.creators[0] 
                            : null;
        
        // Return the profile data with the nested creator object (or null)
        return {
            ...data,
            creators: undefined, // Remove the original array from the root
            creator: creatorData   // Add the extracted object or null
        } as UserProfile; // Cast to expected type
    } else {
        return null; // Return null if no profile data was found
    }

  } catch (error) {
    // Catch any other unexpected errors during the process
    console.error('Unhandled error in getUserProfileByUserId:', error);
    // Depending on desired behavior, you might want to return null or throw
    // Returning null might prevent the UI from crashing
    return null; 
  }
};

/**
 * Update user profile
 */
export const updateUserProfile = async (
  profileId: string,
  profileData: Partial<UserProfile>
): Promise<UserProfile> => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .update(profileData)
      .eq('id', profileId)
      .select('*')
      .single();

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
};

/**
 * Create a platform connection
 */
export const createPlatformConnection = async (
  connectionData: Omit<PlatformConnection, 'id' | 'created_at' | 'updated_at'>
): Promise<PlatformConnection> => {
  try {
    const { data, error } = await supabase
      .from('platform_connections')
      .insert([connectionData])
      .select('*')
      .single();

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error creating platform connection:', error);
    throw error;
  }
};

/**
 * Get platform connections by user ID
 */
export const getPlatformConnectionsByUserId = async (
  userId: string
): Promise<PlatformConnection[]> => {
  try {
    const { data, error } = await supabase
      .from('platform_connections')
      .select('*')
      .eq('user_id', userId);

    if (error) {
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error getting platform connections:', error);
    throw error;
  }
};

/**
 * Update platform connection
 */
export const updatePlatformConnection = async (
  connectionId: string,
  connectionData: Partial<PlatformConnection>
): Promise<PlatformConnection> => {
  try {
    const { data, error } = await supabase
      .from('platform_connections')
      .update(connectionData)
      .eq('id', connectionId)
      .select('*')
      .single();

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error updating platform connection:', error);
    throw error;
  }
};

/**
 * Delete platform connection
 */
export const deletePlatformConnection = async (
  connectionId: string
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('platform_connections')
      .delete()
      .eq('id', connectionId);

    if (error) {
      throw error;
    }

    return true;
  } catch (error) {
    console.error('Error deleting platform connection:', error);
    throw error;
  }
};

/**
 * Get active campaigns for a specific creator
 */
export const getActiveCampaigns = async (creatorId: string): Promise<Campaign[]> => {
    console.log(`[creatorService] Fetching active campaigns for creator: ${creatorId}`);
    if (!creatorId) {
        console.error("[creatorService] getActiveCampaigns called without creatorId");
        return []; // Return empty array if no ID provided
    }

    try {
        // Fetch campaign_creators records for the creator with status 'active'
        // Join with the campaigns table to get campaign details
        // Join with the brands table to get brand name
        const { data, error } = await supabase
            .from('campaign_creators')
            .select(`
                status,
                joined_at,
                platforms,
                metrics,
                campaigns (
                    *,
                    brands (
                        id,
                        name,
                        logo_url
                    )
                )
            `)
            .eq('creator_id', creatorId)
            .eq('status', 'active'); // Filter for active status

        if (error) {
            console.error('[creatorService] Error fetching active campaigns:', error);
            throw error;
        }

        if (!data) {
            console.log(`[creatorService] No active campaigns found for creator: ${creatorId}`);
            return [];
        }

        // Transform the data to match the expected Campaign structure
        const activeCampaigns = data
            .map(item => {
                // Check if the joined campaign data exists
                if (!item.campaigns) return null;

                // Extract nested campaign and brand data
                const campaignData = item.campaigns;
                const brandData = campaignData.brands || {};

                // Construct the final Campaign object
                return {
                    id: campaignData.id,
                    brand_id: campaignData.brand_id,
                    title: campaignData.title,
                    status: item.status, // Status from campaign_creators
                    budget: campaignData.budget,
                    spent: campaignData.spent,
                    start_date: campaignData.start_date,
                    end_date: campaignData.end_date,
                    content_type: campaignData.content_type,
                    brief: campaignData.brief,
                    requirements: campaignData.requirements, // Assuming requirements are stored correctly
                    metrics: campaignData.metrics,           // Campaign-level metrics
                    platforms: item.platforms,                 // Platforms the creator joined with (from campaign_creators)
                    joined_at: item.joined_at,                 // When the creator joined
                    creator_metrics: item.metrics,             // Creator-specific metrics for this campaign (if stored)
                    brand: {
                        id: brandData.id || campaignData.brand_id,
                        name: brandData.name || 'Unknown Brand',
                        logo_url: brandData.logo_url || null,
                         // Add other brand fields if needed and available
                        email: '', industry: '', website: null, contactName: null, contactPhone: null, verificationLevel: 'Unverified', profile_id: null, user_id: null
                    },
                    // Add default/fallback values for potentially missing fields
                    created_at: campaignData.created_at || new Date(),
                    updated_at: campaignData.updated_at || new Date(),
                    targetAudience: campaignData.targetAudience || { age: [], locations: [], interests: [] },
                    campaign_goal: campaignData.campaign_goal || 'Brand Awareness',
                    joined_creators_count: campaignData.metrics?.creators_joined || 0,
                    creators: [], // Typically not needed when fetching for a single creator's view
                    // Map fields from CampaignApplication subset if needed
                    earned: item.metrics?.earned || 0, // Example: Get earned amount from creator metrics
                    pendingPayout: item.metrics?.pending_payout || 0, // Example
                    views: item.metrics?.views || 0 // Example
                };
            })
            .filter((campaign): campaign is Campaign => campaign !== null); // Filter out nulls if a campaign join failed

        console.log(`[creatorService] Found ${activeCampaigns.length} active campaigns for creator ${creatorId}`);
        return activeCampaigns;

    } catch (error) {
        console.error('[creatorService] Unexpected error in getActiveCampaigns:', error);
        return []; // Return empty array on error
    }
}; 