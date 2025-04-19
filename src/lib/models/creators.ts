import { supabase } from '@/lib/supabaseClient';
import { handleError } from '@/lib/utils/errorHandling';
import type { Database } from '@/types/database.types';

export type Creator = Database['public']['Tables']['creators']['Row'];
export type CreatorInsert = Database['public']['Tables']['creators']['Insert'];
export type CreatorUpdate = Database['public']['Tables']['creators']['Update'];

/**
 * Create a new creator profile
 */
export async function createCreator(creatorData: Omit<CreatorInsert, 'id' | 'created_at' | 'updated_at'>) {
  try {
    const { data, error } = await supabase
      .from('creators')
      .insert({
        ...creatorData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return { creator: data };
  } catch (error) {
    throw handleError(error);
  }
}

/**
 * Get a creator by ID
 */
export async function getCreator(creatorId: string) {
  try {
    const { data, error } = await supabase
      .from('creators')
      .select('*')
      .eq('id', creatorId)
      .single();

    if (error) {
      throw error;
    }

    return { creator: data };
  } catch (error) {
    throw handleError(error);
  }
}

/**
 * Get creator by profile ID
 */
export async function getCreatorByProfile(profileId: string) {
  try {
    const { data, error } = await supabase
      .from('creators')
      .select('*')
      .eq('profile_id', profileId)
      .single();

    if (error) {
      // If no creator found, return null instead of throwing an error
      if (error.code === 'PGRST116') {
        return { creator: null };
      }
      throw error;
    }

    return { creator: data };
  } catch (error) {
    throw handleError(error);
  }
}

/**
 * Update a creator
 */
export async function updateCreator(creatorId: string, updates: CreatorUpdate) {
  try {
    const { data, error } = await supabase
      .from('creators')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', creatorId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return { creator: data };
  } catch (error) {
    throw handleError(error);
  }
}

/**
 * Get all creators with pagination and filtering options
 */
export async function getCreators({
  page = 1,
  limit = 10,
  niche = null,
  orderBy = 'created_at',
  order = 'desc'
}: {
  page?: number;
  limit?: number;
  niche?: string | null;
  orderBy?: string;
  order?: 'asc' | 'desc';
}) {
  try {
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let query = supabase
      .from('creators')
      .select('*, profiles!inner(*)', { count: 'exact' });

    // Apply filters if provided
    if (niche) {
      query = query.contains('niche', [niche]);
    }

    // Apply sorting
    if (orderBy.startsWith('profiles.')) {
      // Handle sorting by a profile field
      const profileField = orderBy.split('.')[1];
      query = query.order(profileField, { ascending: order === 'asc', foreignTable: 'profiles' });
    } else {
      // Handle sorting by a creator field
      query = query.order(orderBy, { ascending: order === 'asc' });
    }

    // Apply pagination
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) {
      throw error;
    }

    return {
      creators: data,
      pagination: {
        page,
        limit,
        total: count,
        totalPages: count ? Math.ceil(count / limit) : 0
      }
    };
  } catch (error) {
    throw handleError(error);
  }
}

/**
 * Delete a creator
 */
export async function deleteCreator(creatorId: string) {
  try {
    const { error } = await supabase
      .from('creators')
      .delete()
      .eq('id', creatorId);

    if (error) {
      throw error;
    }

    return { success: true };
  } catch (error) {
    throw handleError(error);
  }
}

/**
 * Get creators for a specific campaign
 */
export async function getCreatorsForCampaign(campaignId: string) {
  try {
    const { data, error } = await supabase
      .from('campaign_creators')
      .select(`
        *,
        creators:creator_id (
          *,
          profiles:profile_id (
            full_name,
            username,
            avatar_url,
            email
          )
        )
      `)
      .eq('campaign_id', campaignId);

    if (error) {
      throw error;
    }

    return { campaignCreators: data };
  } catch (error) {
    throw handleError(error);
  }
}

/**
 * Add a creator to a campaign
 */
export async function applyToCampaign(campaignId: string, creatorId: string, platforms: string[]) {
  try {
    const { data, error } = await supabase
      .from('campaign_creators')
      .insert({
        campaign_id: campaignId,
        creator_id: creatorId,
        status: 'applied',
        platforms,
        joined_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return { application: data };
  } catch (error) {
    throw handleError(error);
  }
} 