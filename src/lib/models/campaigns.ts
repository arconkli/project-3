import { supabase } from '@/lib/supabaseClient';
import { handleError } from '@/lib/utils/errorHandling';
import type { Database } from '@/types/database.types';

export type Campaign = Database['public']['Tables']['campaigns']['Row'];
export type CampaignInsert = Database['public']['Tables']['campaigns']['Insert'];
export type CampaignUpdate = Database['public']['Tables']['campaigns']['Update'];

export type CampaignCreator = Database['public']['Tables']['campaign_creators']['Row'];

/**
 * Create a new campaign
 */
export async function createCampaign(campaignData: Omit<CampaignInsert, 'id' | 'created_at' | 'updated_at'>) {
  try {
    const { data, error } = await supabase
      .from('campaigns')
      .insert({
        ...campaignData,
        spent: 0, // Initialize spent amount as 0
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return { campaign: data };
  } catch (error) {
    throw handleError(error);
  }
}

/**
 * Get a campaign by ID, with optional relations
 */
export async function getCampaign(campaignId: string, includeRelations = false) {
  try {
    let query = supabase.from('campaigns').select('*');
    
    if (includeRelations) {
      query = supabase
        .from('campaigns')
        .select(`
          *,
          brands:brand_id (*),
          campaign_creators:campaign_creators (
            *,
            creators:creator_id (
              *,
              profiles:profile_id (
                full_name,
                username,
                avatar_url
              )
            )
          ),
          content_submissions:content_submissions (*)
        `);
    }
    
    const { data, error } = await query
      .eq('id', campaignId)
      .single();

    if (error) {
      throw error;
    }

    return { campaign: data };
  } catch (error) {
    throw handleError(error);
  }
}

/**
 * Update a campaign
 */
export async function updateCampaign(campaignId: string, updates: CampaignUpdate) {
  try {
    const { data, error } = await supabase
      .from('campaigns')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', campaignId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return { campaign: data };
  } catch (error) {
    throw handleError(error);
  }
}

/**
 * Get campaigns with filtering and pagination
 */
export async function getCampaigns({
  page = 1,
  limit = 10,
  status = null,
  brandId = null,
  platform = null,
  startDate = null,
  endDate = null,
  orderBy = 'created_at',
  order = 'desc'
}: {
  page?: number;
  limit?: number;
  status?: string | null;
  brandId?: string | null;
  platform?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  orderBy?: string;
  order?: 'asc' | 'desc';
}) {
  try {
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let query = supabase
      .from('campaigns')
      .select('*, brands:brand_id (name, logo_url)', { count: 'exact' });

    // Apply filters
    if (status) {
      query = query.eq('status', status);
    }

    if (brandId) {
      query = query.eq('brand_id', brandId);
    }

    if (platform) {
      query = query.contains('platforms', [platform]);
    }

    if (startDate) {
      query = query.gte('start_date', startDate);
    }

    if (endDate) {
      query = query.lte('end_date', endDate);
    }

    // Apply ordering
    query = query.order(orderBy, { ascending: order === 'asc' });

    // Apply pagination
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) {
      throw error;
    }

    return {
      campaigns: data,
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
 * Delete a campaign
 */
export async function deleteCampaign(campaignId: string) {
  try {
    const { error } = await supabase
      .from('campaigns')
      .delete()
      .eq('id', campaignId);

    if (error) {
      throw error;
    }

    return { success: true };
  } catch (error) {
    throw handleError(error);
  }
}

/**
 * Get campaigns for a specific brand
 */
export async function getBrandCampaigns(brandId: string, statuses: string[] | null = null) {
  try {
    let query = supabase
      .from('campaigns')
      .select('*')
      .eq('brand_id', brandId);

    if (statuses && statuses.length > 0) {
      query = query.in('status', statuses);
    }

    query = query.order('created_at', { ascending: false });

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    return { campaigns: data };
  } catch (error) {
    throw handleError(error);
  }
}

/**
 * Update a campaign creator status
 */
export async function updateCampaignCreatorStatus(applicationId: string, status: 'approved' | 'rejected' | 'completed') {
  try {
    const { data, error } = await supabase
      .from('campaign_creators')
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', applicationId)
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

/**
 * Get campaigns that a creator has applied to or is participating in
 */
export async function getCreatorCampaigns(creatorId: string, status: string | null = null) {
  try {
    let query = supabase
      .from('campaign_creators')
      .select(`
        *,
        campaigns:campaign_id (
          *,
          brands:brand_id (
            name,
            logo_url
          )
        )
      `)
      .eq('creator_id', creatorId);

    if (status) {
      query = query.eq('status', status);
    }

    query = query.order('joined_at', { ascending: false });

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    return { creatorCampaigns: data };
  } catch (error) {
    throw handleError(error);
  }
} 