import { supabase, handleError } from '@/lib/supabaseClient';
import type { Database } from '@/types/database.types';

export type Transaction = Database['public']['Tables']['transactions']['Row'];
export type TransactionInsert = Database['public']['Tables']['transactions']['Insert'];
export type TransactionUpdate = Database['public']['Tables']['transactions']['Update'];

/**
 * Create a new transaction
 */
export async function createTransaction(transactionData: Omit<TransactionInsert, 'id' | 'created_at' | 'updated_at'>) {
  try {
    const { data, error } = await supabase
      .from('transactions')
      .insert({
        ...transactionData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return { transaction: data };
  } catch (error) {
    throw handleError(error);
  }
}

/**
 * Get a transaction by ID
 */
export async function getTransaction(transactionId: string) {
  try {
    const { data, error } = await supabase
      .from('transactions')
      .select(`
        *,
        campaigns:campaign_id (*),
        content_submissions:content_id (*)
      `)
      .eq('id', transactionId)
      .single();

    if (error) {
      throw error;
    }

    return { transaction: data };
  } catch (error) {
    throw handleError(error);
  }
}

/**
 * Update a transaction status
 */
export async function updateTransactionStatus(transactionId: string, status: Transaction['status']) {
  try {
    const { data, error } = await supabase
      .from('transactions')
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', transactionId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return { transaction: data };
  } catch (error) {
    throw handleError(error);
  }
}

/**
 * Get transactions for a user with optional filters
 */
export async function getUserTransactions({
  userId,
  type = null,
  status = null,
  campaignId = null,
  startDate = null,
  endDate = null,
  page = 1,
  limit = 10
}: {
  userId: string;
  type?: Transaction['type'] | null;
  status?: Transaction['status'] | null;
  campaignId?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  page?: number;
  limit?: number;
}) {
  try {
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let query = supabase
      .from('transactions')
      .select(`
        *,
        campaigns:campaign_id (
          title,
          brands:brand_id (name, logo_url)
        )
      `, { count: 'exact' })
      .eq('user_id', userId);

    // Apply filters
    if (type) {
      query = query.eq('type', type);
    }

    if (status) {
      query = query.eq('status', status);
    }

    if (campaignId) {
      query = query.eq('campaign_id', campaignId);
    }

    if (startDate) {
      query = query.gte('created_at', startDate);
    }

    if (endDate) {
      query = query.lte('created_at', endDate);
    }

    // Apply ordering and pagination
    query = query.order('created_at', { ascending: false })
      .range(from, to);

    const { data, error, count } = await query;

    if (error) {
      throw error;
    }

    return {
      transactions: data,
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
 * Get transactions for a campaign
 */
export async function getCampaignTransactions(campaignId: string) {
  try {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('campaign_id', campaignId)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return { transactions: data };
  } catch (error) {
    throw handleError(error);
  }
}

/**
 * Get earnings summary for a user (creator)
 */
export async function getUserEarnings(userId: string, period: 'all' | 'month' | 'year' = 'all') {
  try {
    let query = supabase
      .from('transactions')
      .select('amount, type, created_at')
      .eq('user_id', userId)
      .in('type', ['payment'])
      .eq('status', 'completed');

    // Filter by time period if specified
    if (period === 'month') {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);
      query = query.gte('created_at', startOfMonth.toISOString());
    } else if (period === 'year') {
      const startOfYear = new Date();
      startOfYear.setMonth(0, 1);
      startOfYear.setHours(0, 0, 0, 0);
      query = query.gte('created_at', startOfYear.toISOString());
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    // Calculate total earnings
    const totalEarnings = data.reduce((sum, transaction) => {
      // Add payments, subtract refunds
      if (transaction.type === 'payment') {
        return sum + transaction.amount;
      }
      return sum;
    }, 0);

    // Calculate monthly breakdown (for the selected period or all time)
    const monthlyBreakdown: Record<string, number> = {};
    
    data.forEach((transaction) => {
      const date = new Date(transaction.created_at);
      const yearMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!monthlyBreakdown[yearMonth]) {
        monthlyBreakdown[yearMonth] = 0;
      }
      
      if (transaction.type === 'payment') {
        monthlyBreakdown[yearMonth] += transaction.amount;
      }
    });

    return { 
      totalEarnings,
      monthlyBreakdown,
      transactions: data
    };
  } catch (error) {
    throw handleError(error);
  }
}