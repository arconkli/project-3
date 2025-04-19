import { supabase, handleError } from '@/lib/supabaseClient';
import type { Database } from '@/types/database.types';

export type ContentSubmission = Database['public']['Tables']['content_submissions']['Row'];
export type ContentSubmissionInsert = Database['public']['Tables']['content_submissions']['Insert'];
export type ContentSubmissionUpdate = Database['public']['Tables']['content_submissions']['Update'];

/**
 * Submit new content for a campaign
 */
export async function submitContent(contentData: Omit<ContentSubmissionInsert, 'id' | 'created_at' | 'updated_at'>) {
  try {
    const { data, error } = await supabase
      .from('content_submissions')
      .insert({
        ...contentData,
        status: 'submitted',
        submitted_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return { content: data };
  } catch (error) {
    throw handleError(error);
  }
}

/**
 * Get content submission by ID
 */
export async function getContentSubmission(contentId: string) {
  try {
    const { data, error } = await supabase
      .from('content_submissions')
      .select(`
        *,
        campaigns:campaign_id (*),
        creators:creator_id (
          *,
          profiles:profile_id (
            full_name,
            username,
            avatar_url
          )
        )
      `)
      .eq('id', contentId)
      .single();

    if (error) {
      throw error;
    }

    return { content: data };
  } catch (error) {
    throw handleError(error);
  }
}

/**
 * Update content submission status
 */
export async function updateContentStatus(contentId: string, status: 'approved' | 'rejected', feedback?: string) {
  try {
    const updateData: ContentSubmissionUpdate = {
      status,
      updated_at: new Date().toISOString(),
    };

    // If there's feedback, store it in metrics
    if (feedback) {
      updateData.metrics = { feedback };
    }

    const { data, error } = await supabase
      .from('content_submissions')
      .update(updateData)
      .eq('id', contentId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    // If content is approved, update campaign analytics
    if (status === 'approved') {
      await updateCampaignMetrics(data.campaign_id);
    }

    return { content: data };
  } catch (error) {
    throw handleError(error);
  }
}

/**
 * Get all content submissions for a campaign
 */
export async function getCampaignContent(campaignId: string, status: string | null = null) {
  try {
    let query = supabase
      .from('content_submissions')
      .select(`
        *,
        creators:creator_id (
          *,
          profiles:profile_id (
            full_name,
            username,
            avatar_url
          )
        )
      `)
      .eq('campaign_id', campaignId);

    if (status) {
      query = query.eq('status', status);
    }

    query = query.order('submitted_at', { ascending: false });

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    return { content: data };
  } catch (error) {
    throw handleError(error);
  }
}

/**
 * Get all content submissions by a creator
 */
export async function getCreatorContent(creatorId: string, status: string | null = null) {
  try {
    let query = supabase
      .from('content_submissions')
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

    query = query.order('submitted_at', { ascending: false });

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    return { content: data };
  } catch (error) {
    throw handleError(error);
  }
}

/**
 * Update content metrics (views, engagement, etc.)
 */
export async function updateContentMetrics(contentId: string, metrics: Record<string, any>) {
  try {
    // Get current metrics
    const { data: currentContent, error: fetchError } = await supabase
      .from('content_submissions')
      .select('metrics')
      .eq('id', contentId)
      .single();

    if (fetchError) {
      throw fetchError;
    }

    // Merge new metrics with existing ones
    const updatedMetrics = {
      ...(currentContent.metrics || {}),
      ...metrics,
      last_updated: new Date().toISOString(),
    };

    // Save updated metrics
    const { data, error } = await supabase
      .from('content_submissions')
      .update({
        metrics: updatedMetrics,
        updated_at: new Date().toISOString(),
      })
      .eq('id', contentId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    // If metrics are updated, also update campaign metrics
    await updateCampaignMetrics(data.campaign_id);

    return { content: data };
  } catch (error) {
    throw handleError(error);
  }
}

/**
 * Helper to update campaign metrics based on content submissions
 */
async function updateCampaignMetrics(campaignId: string) {
  try {
    // Get all approved content for the campaign
    const { data: approvedContent, error: contentError } = await supabase
      .from('content_submissions')
      .select('metrics')
      .eq('campaign_id', campaignId)
      .eq('status', 'approved');

    if (contentError) {
      throw contentError;
    }

    // Calculate total views and engagement
    const metrics = approvedContent.reduce(
      (totals, content) => {
        const contentMetrics = content.metrics || {};
        
        // Sum views
        totals.totalViews += contentMetrics.views || 0;
        // Sum engagement
        totals.totalEngagement += contentMetrics.likes || 0;
        totals.totalEngagement += contentMetrics.comments || 0;
        totals.totalEngagement += contentMetrics.shares || 0;
        
        return totals;
      },
      { totalViews: 0, totalEngagement: 0 }
    );

    // No need to update the campaign right now, this will be handled elsewhere
    // This function just calculates the metrics

    return metrics;
  } catch (error) {
    console.error('Error updating campaign metrics:', error);
    throw error;
  }
} 