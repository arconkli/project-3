import { supabase } from '@/lib/supabaseClient';
import { PostgrestError } from '@supabase/supabase-js';

interface QueryOptions {
  signal?: AbortSignal;
  retries?: number;
  timeout?: number;
}

interface QueryResult<T> {
  data: T | null;
  error: PostgrestError | Error | null;
}

// Helper function to handle timeouts
const withTimeout = async <T>(
  promise: Promise<T>,
  timeoutMs: number,
  errorMessage: string
): Promise<T> => {
  const timeoutPromise = new Promise<T>((_, reject) =>
    setTimeout(() => reject(new Error(errorMessage)), timeoutMs)
  );
  return Promise.race([promise, timeoutPromise]);
};

// Helper function to handle retries
const withRetry = async <T>(
  operation: () => Promise<T>,
  retries: number,
  delay: number = 1000
): Promise<T> => {
  for (let i = 0; i < retries; i++) {
    try {
      return await operation();
    } catch (error) {
      if (i === retries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
    }
  }
  throw new Error('All retry attempts failed');
};

// Get platform connections for a user
export const getPlatformConnections = async (
  userId: string,
  options: QueryOptions = {}
): Promise<QueryResult<any[]>> => {
  try {
    const result = await withRetry(
      async () => {
        const query = supabase
          .from('platform_connections')
          .select('platform, platform_username, is_active')
          .eq('user_id', userId);

        if (options.signal) query.abortSignal(options.signal);

        const { data, error } = await withTimeout(
          query,
          options.timeout || 15000,
          'Platform connections query timed out'
        );

        if (error) throw error;
        return data || [];
      },
      options.retries || 2
    );

    return { data: result, error: null };
  } catch (error) {
    console.error('Error fetching platform connections:', error);
    return { 
      data: [
        { platform: 'TikTok', platform_username: 'creator', is_active: true },
        { platform: 'Instagram', platform_username: 'creator', is_active: true }
      ], 
      error: error as Error 
    };
  }
};

// Get active transactions with campaign details
export const getActiveTransactions = async (
  userId: string,
  options: QueryOptions = {}
): Promise<QueryResult<any[]>> => {
  try {
    const result = await withRetry(
      async () => {
        const query = supabase
          .from('transactions')
          .select(`
            campaign_id,
            amount,
            type,
            status,
            campaigns:campaign_id (
              id,
              title,
              status,
              end_date,
              content_type,
              requirements,
              brands:brand_id (name)
            )
          `)
          .eq('user_id', userId)
          .eq('status', 'active');

        if (options.signal) query.abortSignal(options.signal);

        const { data, error } = await withTimeout(
          query,
          options.timeout || 15000,
          'Active transactions query timed out'
        );

        if (error) throw error;
        return data || [];
      },
      options.retries || 2
    );

    return { data: result, error: null };
  } catch (error) {
    console.error('Error fetching active transactions:', error);
    return {
      data: [],
      error: error as Error
    };
  }
};

// Get completed transactions with campaign details
export const getCompletedTransactions = async (
  userId: string,
  options: QueryOptions = {}
): Promise<QueryResult<any[]>> => {
  try {
    const result = await withRetry(
      async () => {
        const query = supabase
          .from('transactions')
          .select(`
            campaign_id,
            amount,
            type,
            status,
            campaigns:campaign_id (
              id,
              title,
              status,
              end_date,
              content_type,
              requirements,
              brands:brand_id (name)
            )
          `)
          .eq('user_id', userId)
          .eq('status', 'completed');

        if (options.signal) query.abortSignal(options.signal);

        const { data, error } = await withTimeout(
          query,
          options.timeout || 15000,
          'Completed transactions query timed out'
        );

        if (error) throw error;
        return data || [];
      },
      options.retries || 2
    );

    return { data: result, error: null };
  } catch (error) {
    console.error('Error fetching completed transactions:', error);
    return {
      data: [],
      error: error as Error
    };
  }
};

// Get earnings data
export const getEarnings = async (
  userId: string,
  options: QueryOptions = {}
): Promise<QueryResult<any[]>> => {
  try {
    const result = await withRetry(
      async () => {
        const query = supabase
          .from('transactions')
          .select('amount')
          .eq('user_id', userId)
          .eq('type', 'payment');

        if (options.signal) query.abortSignal(options.signal);

        const { data, error } = await withTimeout(
          query,
          options.timeout || 15000,
          'Earnings query timed out'
        );

        if (error) throw error;
        return data || [];
      },
      options.retries || 2
    );

    return { data: result, error: null };
  } catch (error) {
    console.error('Error fetching earnings:', error);
    return {
      data: [{ amount: 0 }],
      error: error as Error
    };
  }
};

// Get available campaigns
export const getAvailableCampaigns = async (
  existingCampaignIds: string[],
  options: QueryOptions = {}
): Promise<QueryResult<any[]>> => {
  try {
    const result = await withRetry(
      async () => {
        let query = supabase
          .from('campaigns')
          .select(`
            id,
            title,
            description,
            status,
            start_date,
            end_date,
            content_type,
            requirements,
            brief,
            brand_id,
            brands:brand_id (
              id,
              name,
              logo_url
            )
          `)
          .eq('status', 'active');

        if (existingCampaignIds.length > 0) {
          query = query.not('id', 'in', `(${existingCampaignIds.join(',')})`);
        }

        if (options.signal) query.abortSignal(options.signal);

        const { data, error } = await withTimeout(
          query,
          options.timeout || 15000,
          'Available campaigns query timed out'
        );

        if (error) throw error;
        return data || [];
      },
      options.retries || 2
    );

    return { data: result, error: null };
  } catch (error) {
    console.error('Error fetching available campaigns:', error);
    return {
      data: [{
        id: 'mock-available-1',
        title: 'Sample Available Campaign',
        status: 'active',
        content_type: 'both',
        end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        requirements: JSON.stringify({
          platforms: ['TikTok', 'Instagram'],
          contentGuidelines: ['Sample guideline 1', 'Sample guideline 2'],
          payoutRate: { original: '$50 per 10K views', repurposed: '$25 per 10K views' }
        }),
        brief: JSON.stringify({
          original: 'This is a sample brief for original content.',
          repurposed: 'This is a sample brief for repurposed content.'
        }),
        brands: { name: 'Sample Brand' }
      }],
      error: error as Error
    };
  }
};

// Get campaign metrics
export const getCampaignMetrics = async (
  campaignIds: string[],
  options: QueryOptions = {}
): Promise<QueryResult<any[]>> => {
  try {
    const result = await withRetry(
      async () => {
        const query = supabase
          .from('campaigns')
          .select('metrics')
          .in('id', campaignIds);

        if (options.signal) query.abortSignal(options.signal);

        const { data, error } = await withTimeout(
          query,
          options.timeout || 5000,
          'Campaign metrics query timed out'
        );

        if (error) throw error;
        return data || [];
      },
      options.retries || 3
    );

    return { data: result, error: null };
  } catch (error) {
    console.error('Error fetching campaign metrics:', error);
    return { data: null, error: error as Error };
  }
}; 