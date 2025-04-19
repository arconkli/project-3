import { supabase } from '@/lib/supabaseClient';
import { handleError } from '@/lib/utils/errorHandling';
import type { Database } from '@/types/database.types';

export type Brand = Database['public']['Tables']['brands']['Row'];
export type BrandInsert = Database['public']['Tables']['brands']['Insert'];
export type BrandUpdate = Database['public']['Tables']['brands']['Update'];

/**
 * Create a new brand
 */
export async function createBrand(brandData: Omit<BrandInsert, 'id' | 'created_at' | 'updated_at'>) {
  try {
    const { data, error } = await supabase
      .from('brands')
      .insert({
        ...brandData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return { brand: data };
  } catch (error) {
    throw handleError(error);
  }
}

/**
 * Get a brand by ID
 */
export async function getBrand(brandId: string) {
  try {
    const { data, error } = await supabase
      .from('brands')
      .select('*')
      .eq('id', brandId)
      .single();

    if (error) {
      throw error;
    }

    return { brand: data };
  } catch (error) {
    throw handleError(error);
  }
}

/**
 * Get brand by profile ID
 */
export async function getBrandByProfile(profileId: string) {
  try {
    const { data, error } = await supabase
      .from('brands')
      .select('*')
      .eq('profile_id', profileId)
      .single();

    if (error) {
      // If no brand found, return null instead of throwing an error
      if (error.code === 'PGRST116') {
        return { brand: null };
      }
      throw error;
    }

    return { brand: data };
  } catch (error) {
    throw handleError(error);
  }
}

/**
 * Update a brand
 */
export async function updateBrand(brandId: string, updates: BrandUpdate) {
  try {
    const { data, error } = await supabase
      .from('brands')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', brandId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return { brand: data };
  } catch (error) {
    throw handleError(error);
  }
}

/**
 * Get all brands (with pagination)
 */
export async function getBrands(page = 1, limit = 10) {
  try {
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data, error, count } = await supabase
      .from('brands')
      .select('*', { count: 'exact' })
      .range(from, to);

    if (error) {
      throw error;
    }

    return { 
      brands: data,
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
 * Delete a brand
 */
export async function deleteBrand(brandId: string) {
  try {
    const { error } = await supabase
      .from('brands')
      .delete()
      .eq('id', brandId);

    if (error) {
      throw error;
    }

    return { success: true };
  } catch (error) {
    throw handleError(error);
  }
}

/**
 * Search brands by name
 */
export async function searchBrands(query: string, limit = 10) {
  try {
    const { data, error } = await supabase
      .from('brands')
      .select('*')
      .ilike('name', `%${query}%`)
      .limit(limit);

    if (error) {
      throw error;
    }

    return { brands: data };
  } catch (error) {
    throw handleError(error);
  }
} 