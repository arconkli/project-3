import { supabase } from '@/lib/supabaseClient';
import { UserRole } from '@/types/auth';

/**
 * Register a new user
 */
export const registerUser = async (email: string, password: string, role: UserRole = UserRole.CREATOR) => {
  // Reverted to original try/await/catch structure
  try {
    // Explicit check for Supabase client readiness remains useful
    if (!supabase || !supabase.auth || typeof supabase.auth.signUp !== 'function') {
      console.error('❌ Supabase client is not initialized correctly!');
      throw new Error('Supabase client not ready. Check environment variables and initialization.');
    }
    
    console.log('RegisterUser: Starting registration process with:', {
      email,
      role
    });

    // Determine redirect URL and ensure it's absolute
    const siteUrl = import.meta.env.VITE_SITE_URL || window.location.origin;
    const redirectUrl = `${siteUrl}/verify`;
    console.log('RegisterUser: Using redirect URL:', redirectUrl);

    console.log('RegisterUser: Attempting supabase.auth.signUp...');
    // Attempt to register the new user using await
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          role: role,
          type: role // Add type field to match database schema
        },
        emailRedirectTo: redirectUrl,
      },
    });
    // Log the result immediately after await
    console.log('>>> RegisterUser: signUp returned:', { data: data ? { user: !!data.user, session: !!data.session, userId: data.user?.id } : null, error });

    if (error) {
      console.error('RegisterUser: Registration error object:', {
        message: error.message,
        code: error.status,
        details: error
      });
      throw error;
    }

    if (!data?.user) { // Check data and data.user
      console.error('RegisterUser: No user data returned from registration');
      throw new Error('Failed to create user account. Please try again.');
    }

    console.log('RegisterUser: Registration successful check passed:', {
      userId: data.user.id,
      email: data.user.email,
      session: !!data.session
    });

    // Store the registration timestamp for rate limiting
    const registerKey = `verification_email_last_sent_${email}`;
    localStorage.setItem(registerKey, Date.now().toString());

    // Return the original shape expected by onboardCreator
    return data; 

  } catch (error: any) {
    console.error('RegisterUser: Error caught in catch block:', {
      message: error?.message,
      code: error?.code,
      name: error?.name,
      status: error?.status,
      details: error
    });

    // Handle specific known error messages
    if (error?.message?.includes('User already registered')) {
      throw new Error('This email is already registered. Please sign in or try a different email address.');
    }
    
    // Re-throw other errors
    throw error; 
  }
};

/**
 * Sign in a user with email and password
 */
export const signInWithEmail = async (email: string, password: string) => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error signing in:', error);
    throw error;
  }
};

/**
 * Sign out the current user
 */
export const signOut = async () => {
  try {
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      throw error;
    }
    
    return true;
  } catch (error) {
    console.error('Error signing out:', error);
    throw error;
  }
};

/**
 * Get the current logged in user
 */
export const getCurrentUser = async () => {
  try {
    const { data, error } = await supabase.auth.getUser();
    
    if (error) {
      throw error;
    }
    
    return data.user;
  } catch (error) {
    console.error('Error getting current user:', error);
    throw error;
  }
};

/**
 * Get the current user's session
 */
export const getSession = async () => {
  try {
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      throw error;
    }
    
    return data.session;
  } catch (error) {
    console.error('Error getting session:', error);
    throw error;
  }
};

/**
 * Reset password for a user
 */
export const resetPassword = async (email: string) => {
  try {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email);
    
    if (error) {
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('Error resetting password:', error);
    throw error;
  }
};

export const checkEmailVerification = async (userId: string) => {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error) {
      throw error;
    }

    if (!user) {
      throw new Error('No user found');
    }

    // Check if user has any identities (email verification creates an identity)
    const isVerified = user.identities && user.identities.length > 0;
    
    if (isVerified) {
      // Update profile and creator status if verified
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ status: 'active' })
        .eq('user_id', userId);

      if (profileError) {
        console.error('Error updating profile status:', profileError);
      }

      const { error: creatorError } = await supabase
        .from('creators')
        .update({ is_active: true })
        .eq('user_id', userId);

      if (creatorError) {
        console.error('Error updating creator status:', creatorError);
      }
    }

    return isVerified;
  } catch (error) {
    console.error('Error checking email verification:', error);
    throw error;
  }
};

// Add this after user registration for brands to ensure the brand profile is completed properly
export const completeNewBrandSetup = async (userId: string, userData: any) => {
  console.log(`[AUTH] Running post-registration setup for brand account (userId: ${userId})`);
  
  try {
    // Use the secure database function to ensure brand setup
    const { data, error } = await supabase.rpc('ensure_brand_setup', {
      p_user_id: userId,
      p_full_name: userData.full_name || 'Brand User',
      p_email: userData.email
    });
    
    if (error) {
      console.error(`[AUTH] Error in ensure_brand_setup:`, error);
      return { success: false, error: 'Failed to complete brand setup' };
    }
    
    console.log(`[AUTH] Brand setup completed successfully:`, data);
    return {
      success: true,
      profileId: data.profile_id,
      brandId: data.brand_id
    };
  } catch (error) {
    console.error(`[AUTH] Exception in completeNewBrandSetup:`, error);
    return { success: false, error: 'Exception during brand setup' };
  }
};

/**
 * Check if an email is already registered before proceeding with registration
 * This should be called before showing the next step in registration forms
 */
export const checkEmailExists = async (email: string): Promise<{exists: boolean, message?: string}> => {
  if (!email || !email.includes('@')) {
    return { exists: false, message: 'Please enter a valid email address' };
  }
  
  try {
    console.log(`[AUTH] Checking if email exists: ${email}`);
    
    // Call the Supabase auth API to check if the user exists
    const { error } = await supabase.auth.signInWithOtp({
      email: email,
      options: {
        shouldCreateUser: false // This will fail if the user doesn't exist
      }
    });
    
    // If there's no error with code 400, the user exists
    // Supabase returns 400 when the user doesn't exist with shouldCreateUser: false
    if (error) {
      if (error.status === 400) {
        console.log(`[AUTH] Email ${email} is not registered`);
        return { exists: false };
      } else if (error.message?.includes('already registered') || 
                error.message?.includes('already exists') ||
                error.message?.includes('already in use')) {
        console.log(`[AUTH] Email ${email} is already registered`);
        return { 
          exists: true, 
          message: 'This email is already registered. Please sign in instead.' 
        };
      }
    } else {
      // If there's no error at all, the OTP was sent, which means the user exists
      console.log(`[AUTH] Email ${email} is already registered (OTP sent)`);
      return { 
        exists: true, 
        message: 'This email is already registered. Please sign in instead.' 
      };
    }
    
    // Alternative approach - try a custom RPC function to check if the email exists
    // This requires creating a server-side function in Supabase
    const { data, error: rpcError } = await supabase.rpc('check_email_exists', {
      p_email: email
    });
    
    if (!rpcError && data && data.exists) {
      console.log(`[AUTH] Email ${email} is already registered (via RPC)`);
      return { 
        exists: true, 
        message: 'This email is already registered. Please sign in instead.' 
      };
    }
    
    return { exists: false };
  } catch (error) {
    console.error('[AUTH] Error checking if email exists:', error);
    // If there's an error, we'll assume the email doesn't exist for safety
    return { exists: false };
  }
};

/**
 * Resend verification email with proper rate limit handling and exponential backoff
 */
export const resendVerificationEmail = async (email: string) => {
  try {
    console.log(`[AUTH] Attempting to resend verification email to: ${email}`);
    
    // Check localStorage for last send time to implement client-side rate limiting
    const lastSendKey = `verification_email_last_sent_${email}`;
    const lastSendTime = localStorage.getItem(lastSendKey);
    const now = Date.now();
    
    if (lastSendTime) {
      const timeSinceLastSend = now - parseInt(lastSendTime);
      const cooldownPeriod = 60 * 1000; // 60 seconds cooldown
      
      if (timeSinceLastSend < cooldownPeriod) {
        const remainingSeconds = Math.ceil((cooldownPeriod - timeSinceLastSend) / 1000);
        console.log(`[AUTH] Rate limit: Must wait ${remainingSeconds} more seconds`);
        return {
          success: false,
          isRateLimited: true,
          remainingSeconds,
          message: `For security purposes, you can only request this after ${remainingSeconds} seconds.`
        };
      }
    }
    
    // Determine redirect URL and ensure it's absolute
    const siteUrl = import.meta.env.VITE_SITE_URL || window.location.origin;
    const redirectUrl = `${siteUrl}/verify`;
    console.log('[AUTH] Using redirect URL:', redirectUrl);
    
    // Attempt to resend verification email
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: email,
      options: {
        emailRedirectTo: redirectUrl
      }
    });
    
    if (error) {
      console.error('[AUTH] Error resending verification email:', error);
      
      // Handle rate limiting from server
      if (error.status === 429 || error.message?.includes('rate limit') || error.message?.includes('security purposes')) {
        // Extract remaining time if available in the message
        const timeMatch = error.message?.match(/(\d+) seconds/);
        const remainingSeconds = timeMatch ? parseInt(timeMatch[1]) : 60;
        
        return {
          success: false,
          isRateLimited: true,
          remainingSeconds,
          message: error.message || 'Rate limit exceeded. Please try again later.'
        };
      }
      
      return { 
        success: false, 
        message: error.message || 'Failed to send verification email.'
      };
    }
    
    // Store the current time as the last send time
    localStorage.setItem(lastSendKey, now.toString());
    
    console.log('[AUTH] Verification email sent successfully');
    return { success: true };
    
  } catch (error: any) {
    console.error('[AUTH] Exception when resending verification email:', error);
    return { 
      success: false, 
      message: error.message || 'An unexpected error occurred when sending verification email.'
    };
  }
};

/**
 * Create a permanent admin user in Supabase
 * This should be called after regular registration to promote a user to admin
 */
export const createAdminUser = async (email: string, password: string) => {
  try {
    console.log('Creating admin user with email:', email);
    
    // Step 1: Try to register the user with admin role
    let userId = '';
    try {
      const { data, error } = await registerUser(email, password, UserRole.ADMIN);
      
      if (error) {
        // Check if the error is because the user already exists
        if (error.message && error.message.includes('already registered')) {
          console.log('User already exists, will try to promote to admin directly');
          
          // Try to get existing user ID by calling signIn
          const authResult = await signInWithEmail(email, password);
          if (authResult?.user) {
            userId = authResult.user.id;
            console.log('Successfully signed in as existing user:', userId);
          } else {
            throw new Error('Could not authenticate with provided credentials');
          }
        } else {
          throw error;
        }
      } else if (data?.user) {
        userId = data.user.id;
        console.log('Admin user registered with ID:', userId);
      }
    } catch (registrationError: any) {
      console.error('Registration error:', registrationError.message);
      
      // If this is "already registered" error, we can try the promote_to_admin RPC
      if (registrationError.message && registrationError.message.includes('already registered')) {
        console.log('Attempting to promote existing user to admin via RPC');
        
        // Use our new RPC function to promote user directly
        const { data: rpcData, error: rpcError } = await supabase.rpc('promote_to_admin', {
          user_email: email
        });
        
        if (rpcError) {
          console.error('Error promoting user to admin via RPC:', rpcError);
          throw new Error('Could not promote existing user to admin');
        }
        
        if (rpcData && rpcData.success) {
          console.log('Successfully promoted existing user to admin:', rpcData);
          return {
            success: true,
            userId: rpcData.user_id,
            email: email,
            profileId: rpcData.profile_id,
            message: 'Existing user promoted to admin'
          };
        }
      } else {
        throw registrationError;
      }
    }
    
    if (!userId) {
      throw new Error('Failed to create or identify admin user account');
    }
    
    // Step 2: Set admin role in auth.users metadata through RPC function
    // This ensures the role is stored at the Supabase auth level
    const { error: rpcError } = await supabase.rpc('set_admin_role', {
      user_id: userId
    });
    
    if (rpcError) {
      console.error('Error setting admin role through RPC:', rpcError);
      // Continue anyway as we'll try to set up the profile
    }
    
    // Step 3: Create/update the profile record to mark as admin
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .upsert({
        user_id: userId,
        email: email,
        full_name: 'Admin User',
        role: 'admin',
        status: 'active'
      })
      .select()
      .single();
    
    if (profileError) {
      console.error('Error creating admin profile:', profileError);
      // Don't throw here, the user might still be an admin but just missing profile
      console.log('Continuing despite profile error - auth level admin should work');
    }
    
    console.log('Admin user created/updated successfully:', {
      userId,
      email,
      profileId: profile?.id
    });
    
    return {
      success: true,
      userId,
      email,
      profileId: profile?.id
    };
  } catch (error) {
    console.error('Error creating admin user:', error);
    throw error;
  }
}; 