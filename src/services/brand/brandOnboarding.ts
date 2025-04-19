import { supabase } from '@/lib/supabaseClient';
import { UserRole } from '@/types/auth';

/**
 * Direct implementation of brand onboarding that creates all necessary records
 */
export const createBrandAccount = async (
  companyName: string,
  industry: string,
  contactName: string,
  contactEmail: string,
  password: string,
  contactPhone?: string,
  website?: string
) => {
  console.log('📢 BRAND ONBOARDING: Starting with simplified approach', {
    companyName,
    industry,
    contactEmail
  });

  // ** STEP 1: AUTH SIGNUP **
  try {
    console.log('📢 STEP 1: Registering with auth...');
    
    // Create new user account
    console.log('📢 Creating new user account...');
    let authData, authError;
    try {
        const response = await supabase.auth.signUp({
            email: contactEmail,
            password: password,
            options: {
                data: {
                    type: 'brand',
                    role: 'brand'
                }
            }
        });
        authData = response.data;
        authError = response.error;
        console.log('📢 signUp Response:', { authData: { userId: authData?.user?.id, email: authData?.user?.email }, authError }); // Log the raw response
    } catch (signUpException) {
        console.error('❌ signUp threw an exception:', signUpException);
        throw signUpException; // Re-throw
    }

    if (authError) {
      console.error('❌ Auth account creation failed:', authError.message);
      throw new Error(`Auth failed: ${authError.message}`);
    }
    
    if (!authData?.user) {
      console.error('❌ No user returned from auth signup');
      throw new Error('Auth signup did not return user data');
    }

    const userId = authData.user.id;
    console.log('✅ Auth account created:', userId);
    
    // ** STEP 2: CREATE USER RECORD **
    console.log('📢 STEP 2: Creating user record...');
    const { data: userRecord, error: userError } = await supabase
      .from('users')
      .insert({
        id: userId,
        email: contactEmail,
        type: 'brand',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select('id') // Select only ID, maybe less data needed?
      .maybeSingle(); // Use maybeSingle to handle potential null

    if (userError || !userRecord) {
      console.error('❌ User record creation failed:', userError?.message || 'No record returned');
      // Decide if we should throw or try to continue? Maybe throw for now.
      throw new Error(`User record creation failed: ${userError?.message || 'No record returned'}`);
    } else {
      console.log('✅ User record created:', userRecord.id);
    }
    
    // ** STEP 3 (was 4): CREATE BRAND PROFILE **
    console.log('📢 STEP 3: Creating brand profile...');
    const { data: profileData, error: profileError } = await supabase
      .from('brand_profiles')
      .insert({
        // id: userId, // REMOVED - Let DB generate UUID
        name: companyName,
        description: `${companyName} is a company in the ${industry} industry.`,
        website: website || '',
        industry: industry,
        contact_email: contactEmail,
        contact_phone: contactPhone || '',
        status: 'active', // Consider 'pending' or similar until fully verified?
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select('id') // Select the generated ID
      .single(); // Use single() as we expect exactly one row

    if (profileError || !profileData) {
      console.error('❌ Brand profile creation failed:', profileError?.message || 'No profile data returned');
      // If profile fails, we should probably stop and maybe clean up?
      throw new Error(`Brand profile creation failed: ${profileError?.message || 'No profile data returned'}`);
    }
    
    const brandProfileId = profileData.id;
    console.log('✅ Brand profile created:', brandProfileId);
      
    // ** STEP 4 (New): CREATE BRAND_USERS LINK **
    console.log('📢 STEP 4: Linking user to brand profile...');
    const { error: brandUserError } = await supabase
        .from('brand_users')
        .insert({
            user_id: userId,
            brand_id: brandProfileId,
            // Add other relevant fields if needed, e.g., role: 'admin'
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        });

    if (brandUserError) {
        console.error('❌ Linking user to brand profile failed:', brandUserError.message);
        // Critical step, throw error
        throw new Error(`Linking user to brand profile failed: ${brandUserError.message}`);
    } else {
        console.log('✅ User linked to brand profile successfully.');
    }

    // ** STEP 5: SIGN IN USER FOR SESSION **
    console.log('📢 STEP 5: Signing in to create session...');
    try {
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: contactEmail,
        password: password
      });
      
      if (signInError) {
        console.error('❌ Sign in failed:', signInError.message);
      } else {
        console.log('✅ Signed in successfully');
      }
    } catch (error) {
      console.error('❌ Sign in failed:', error);
      // Continue anyway
    }

    // ** COMPLETE **
    console.log('🎉 Brand account creation completed successfully');
    return {
      success: true,
      user: authData.user,
      userData: {
        id: userId,
        email: contactEmail,
        type: 'brand',
        companyName,
        industry
      }
    };
  } catch (error: any) {
    console.error('🔥 CRITICAL ERROR:', error.message);
    
    // For other types of errors, just throw them up
    throw error;
  }
} 