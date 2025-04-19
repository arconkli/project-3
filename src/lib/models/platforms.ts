import { supabase, handleError } from '@/lib/supabaseClient';
import type { Database } from '@/types/database.types';

export type PlatformConnection = Database['public']['Tables']['platform_connections']['Row'];
export type PlatformConnectionInsert = Database['public']['Tables']['platform_connections']['Insert'];
export type PlatformConnectionUpdate = Database['public']['Tables']['platform_connections']['Update'];

/**
 * Connect a social media platform to a user account
 */
export async function connectPlatform(connectionData: Omit<PlatformConnectionInsert, 'id' | 'created_at' | 'updated_at'>) {
  try {
    // Check if the connection already exists
    const { data: existingConnection, error: checkError } = await supabase
      .from('platform_connections')
      .select('id')
      .eq('user_id', connectionData.user_id)
      .eq('platform', connectionData.platform)
      .eq('platform_username', connectionData.platform_username)
      .maybeSingle();

    if (checkError) {
      throw checkError;
    }

    // If connection exists, update it
    if (existingConnection) {
      const { data, error } = await supabase
        .from('platform_connections')
        .update({
          ...connectionData,
          is_active: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingConnection.id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return { connection: data };
    }

    // Otherwise, create a new connection
    const { data, error } = await supabase
      .from('platform_connections')
      .insert({
        ...connectionData,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return { connection: data };
  } catch (error) {
    throw handleError(error);
  }
}

/**
 * Disconnect a platform connection
 */
export async function disconnectPlatform(connectionId: string) {
  try {
    const { data, error } = await supabase
      .from('platform_connections')
      .update({
        is_active: false,
        updated_at: new Date().toISOString(),
      })
      .eq('id', connectionId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return { connection: data };
  } catch (error) {
    throw handleError(error);
  }
}

/**
 * Get a user's platform connections
 */
export async function getUserPlatforms(userId: string, activeOnly = true) {
  try {
    let query = supabase
      .from('platform_connections')
      .select('*')
      .eq('user_id', userId);

    if (activeOnly) {
      query = query.eq('is_active', true);
    }

    query = query.order('created_at', { ascending: false });

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    return { connections: data };
  } catch (error) {
    throw handleError(error);
  }
}

/**
 * Update platform connection metadata (followers, metrics, etc.)
 */
export async function updatePlatformMetadata(connectionId: string, metadata: Record<string, any>) {
  try {
    // Get current metadata
    const { data: currentConnection, error: fetchError } = await supabase
      .from('platform_connections')
      .select('metadata')
      .eq('id', connectionId)
      .single();

    if (fetchError) {
      throw fetchError;
    }

    // Merge new metadata with existing
    const updatedMetadata = {
      ...(currentConnection.metadata || {}),
      ...metadata,
      last_updated: new Date().toISOString(),
    };

    // Update the connection
    const { data, error } = await supabase
      .from('platform_connections')
      .update({
        metadata: updatedMetadata,
        updated_at: new Date().toISOString(),
      })
      .eq('id', connectionId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return { connection: data };
  } catch (error) {
    throw handleError(error);
  }
}

/**
 * Get platform connections by platform type
 */
export async function getPlatformUsers(platform: string, limit = 10) {
  try {
    const { data, error } = await supabase
      .from('platform_connections')
      .select(`
        *,
        profiles:user_id (
          id,
          full_name,
          username,
          avatar_url,
          role
        )
      `)
      .eq('platform', platform)
      .eq('is_active', true)
      .limit(limit);

    if (error) {
      throw error;
    }

    return { connections: data };
  } catch (error) {
    throw handleError(error);
  }
}

/**
 * Update platform connection tokens (refresh access token)
 */
export async function updatePlatformTokens(
  connectionId: string, 
  accessToken: string, 
  refreshToken?: string, 
  expiresAt?: string
) {
  try {
    const updateData: PlatformConnectionUpdate = {
      access_token: accessToken,
      updated_at: new Date().toISOString(),
    };

    if (refreshToken) {
      updateData.refresh_token = refreshToken;
    }

    if (expiresAt) {
      updateData.token_expires_at = expiresAt;
    }

    const { data, error } = await supabase
      .from('platform_connections')
      .update(updateData)
      .eq('id', connectionId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return { connection: data };
  } catch (error) {
    throw handleError(error);
  }
} 