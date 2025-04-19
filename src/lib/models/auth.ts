import { supabase } from '@/lib/supabaseClient';
import { handleError } from '@/lib/utils/errorHandling';
import type { Database } from '@/types/database.types';

export type Profile = Database['public']['Tables']['profiles']['Row'];
export type ProfileInsert = Database['public']['Tables']['profiles']['Insert'];
export type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];

/**
 * Sign up a new user
 */
export async function signUp(email: string, password: string, userData: Omit<ProfileInsert, 'user_id' | 'email'>) {
  try {
    // Create the user account
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: userData.full_name,
          role: userData.role,
        }
      }
    });

    if (authError) {
      throw authError;
    }

    if (!authData.user) {
      throw new Error('User creation failed');
    }

    // Create the user profile
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .insert({
        user_id: authData.user.id,
        email,
        full_name: userData.full_name,
        username: userData.username,
        avatar_url: userData.avatar_url,
        bio: userData.bio,
        website: userData.website,
        phone: userData.phone,
        role: userData.role,
        status: 'pending',
      })
      .select()
      .single();

    if (profileError) {
      // If profile creation fails, we should attempt to delete the auth user
      await supabase.auth.admin.deleteUser(authData.user.id);
      throw profileError;
    }

    return { user: authData.user, profile: profileData };
  } catch (error) {
    throw handleError(error);
  }
}

/**
 * Sign in a user
 */
export async function signIn(email: string, password: string) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw error;
    }

    return { session: data.session, user: data.user };
  } catch (error) {
    throw handleError(error);
  }
}

/**
 * Sign out the current user
 */
export async function signOut() {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) {
      throw error;
    }
    return { success: true };
  } catch (error) {
    throw handleError(error);
  }
}

/**
 * Get the current user profile
 */
export async function getProfile() {
  try {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session?.user) {
      return { profile: null, error: sessionError || new Error('No active session') };
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', session.user.id)
      .single();

    if (error) {
      throw error;
    }

    return { profile: data, user: session.user };
  } catch (error) {
    throw handleError(error);
  }
}

/**
 * Update a user profile
 */
export async function updateProfile(updates: ProfileUpdate) {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.user) {
      throw new Error('No active session');
    }

    const { data, error } = await supabase
      .from('profiles')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', session.user.id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return { profile: data };
  } catch (error) {
    throw handleError(error);
  }
}

/**
 * Send a password reset email
 */
export async function resetPassword(email: string) {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      throw error;
    }

    return { success: true };
  } catch (error) {
    throw handleError(error);
  }
}

/**
 * Update password with a recovery token
 */
export async function updatePassword(password: string) {
  try {
    const { data, error } = await supabase.auth.updateUser({
      password,
    });

    if (error) {
      throw error;
    }

    return { user: data.user };
  } catch (error) {
    throw handleError(error);
  }
} 