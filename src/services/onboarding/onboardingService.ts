import { registerUser } from '../auth/authService';
import { createUserProfile } from '../creator/creatorService';
import { createBrandProfileAndLink } from '../brand/brandService';
import { UserRole } from '@/types/auth';
import { supabase } from '@/lib/supabaseClient';
import { FEATURES } from '@/config/features';
import { completeNewBrandSetup } from '../auth/authService';

/**
 * Complete creator onboarding process
 */
export const onboardCreator = async (
  email: string, 
  password: string, 
  name: string,
  phone?: string,
  platforms: string[] = []
) => {
  try {
    console.log('Starting creator onboarding process...', {
      email,
      name,
      hasPhone: !!phone,
      platforms
    });

    // 1. Register user with Supabase Auth
    console.log('Attempting to register user with Supabase Auth...');
    const authData = await registerUser(email, password, UserRole.CREATOR);
    
    console.log('Auth registration response:', {
      success: !!authData,
      hasUser: !!authData?.user,
      userId: authData?.user?.id
    });
    
    if (!authData.user) {
      console.error('No user data returned from registration');
      throw new Error('Failed to create user account');
    }
    
    const userId = authData.user.id;
    console.log('User registered successfully with ID:', userId);
    
    // 2. Create user record in public.users table
    try {
      console.log('Creating user record in public.users table...');
      const { error: userError } = await supabase
        .from('users')
        .insert([{
          id: userId,
          email: email,
          type: UserRole.CREATOR // Ensure role is set correctly
        }])
        .select('*')
        .single();

      if (userError) {
        console.error('Error creating user record:', userError);
        throw userError;
      }
      console.log('User record created successfully:', {
        userId,
        email,
        type: UserRole.CREATOR
      });
    } catch (userError) {
      console.error('Error creating user record:', userError);
      // Continue with the process even if user record creation fails
      // The error will be part of the response
    }
    
    // 3. Create user profile
    try {
      console.log('Creating user profile...');
      const userProfile = await createUserProfile({
        id: userId,
        user_id: userId,
        full_name: name,
        email: email,
        phone: phone,
        status: FEATURES.REQUIRE_VERIFICATION ? 'pending' : 'active' // Set status based on feature flag
      });

      console.log('User profile created successfully:', userProfile);

      // 4. Add platform connections if provided
      let platformConnections = [];
      if (platforms && platforms.length > 0) {
        console.log('Adding platform connections...', platforms);
        for (const platform of platforms) {
          const { data, error } = await supabase
            .from('platform_connections')
            .insert([{
              user_id: userId,
              platform: platform,
              platform_username: '',  // Will be updated after actual connection
              is_active: false
            }])
            .select('*');

          if (error) {
            console.error(`Error adding platform ${platform}:`, error);
          } else if (data) {
            console.log(`Platform ${platform} added successfully:`, data[0]);
            platformConnections.push(data[0]);
          }
        }
      }

      // 5. Create creator record
      console.log('Creating creator record...');
      try {
        const { data: creatorData, error: creatorError } = await supabase
          .from('creators')
          .insert([{
            user_id: userId,
            platform: platforms[0] || null,
            platform_username: '',
            is_active: !FEATURES.REQUIRE_VERIFICATION // Set active status based on feature flag
          }])
          .select('*')
          .single();

        if (creatorError) {
          console.error('Error creating creator record:', creatorError);
          // Continue with the process even if creator record creation fails
          // The error will be part of the response
        } else {
          console.log('Creator record created successfully:', creatorData);
        }
      } catch (creatorError) {
        console.error('Error creating creator record:', creatorError);
        // Continue with the process even if creator record creation fails
        // The error will be part of the response
      }

      return {
        user: authData.user,
        profile: userProfile,
        platforms: platformConnections,
        shouldVerify: FEATURES.REQUIRE_VERIFICATION || FEATURES.EMAIL_VERIFICATION // Require verification if either flag is enabled
      };
    } catch (profileError) {
      console.error('Error creating profile:', profileError);
      // If profile creation fails, we should still return the user data
      // so they can try again later
      return {
        user: authData.user,
        shouldVerify: FEATURES.REQUIRE_VERIFICATION || FEATURES.EMAIL_VERIFICATION, // Require verification if either flag is enabled
        error: 'Profile creation failed. Please try again after verifying your email.'
      };
    }
  } catch (error: any) {
    // Log detailed error for debugging
    console.error('Error in creator onboarding:', {
      message: error.message,
      code: error.code,
      name: error.name,
      stack: error.stack,
      details: error
    });
    
    // Handle specific error types for better user experience
    if (error.message) {
      if (error.message.includes('already registered') || 
          error.message.includes('already exists') || 
          error.message.includes('already taken')) {
        throw new Error('This email is already registered. Please sign in or try a different email address.');
      } else if (error.message.includes('password')) {
        throw new Error('Password must be at least 6 characters long and contain a mix of characters.');
      } else if (error.message.includes('email')) {
        throw new Error('Please provide a valid email address.');
      } else if (error.message.includes('network') || error.message.includes('connection')) {
        throw new Error('Network error. Please check your internet connection and try again.');
      }
    }
    
    // If it's another type of error, just pass it through
    throw error;
  }
};

/**
 * Complete brand onboarding process - Reworked Direct Implementation
 */
export const onboardBrand = async (
  companyName: string,
  industry: string,
  contactName: string,
  contactEmail: string,
  password: string,
  contactPhone?: string,
  website?: string
) => {
  console.log('[onboardBrand] START (Direct DB Inserts Flow)');
  console.log('[onboardBrand] Input Data:', {
    companyName, industry, contactName, contactEmail, hasPhone: !!contactPhone, hasWebsite: !!website
  });

  let userId: string | undefined;
  let brandProfileId: string | undefined;
  let authUser: any = null;
  let session: any = null;
  let stepError: any = null; 

  try {
    // == STEP 1: Supabase Auth Sign Up (Minimal) ==
    try {
      console.log('[onboardBrand] Step 1: Attempting supabase.auth.signUp (MINIMAL - NO OPTIONS)...');
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: contactEmail,
        password: password,
        options: {
          data: {
            role: UserRole.BRAND, // Set role in app_metadata directly during signup
            full_name: contactName
          }
        }
      });
      console.log('[onboardBrand] Step 1: supabase.auth.signUp returned', { signUpData: signUpData ? { user: !!signUpData.user, session: !!signUpData.session, userId: signUpData.user?.id } : null, signUpError });
      if (signUpError) throw signUpError; 
      if (!signUpData?.user) throw new Error('SignUp returned no user object.');
      userId = signUpData.user.id;
      authUser = signUpData.user;
      session = signUpData.session;
      console.log(`[onboardBrand] Step 1 SUCCESS: User ID = ${userId}, Session Exists = ${!!session}`);
    } catch (err) {
      stepError = err;
      console.error('[onboardBrand] Step 1 CAUGHT ERROR:', err);
      throw err;
    }
    
    // == STEP 2: Sign In to get a valid session ==
    if (!session) {
      try {
        console.log('[onboardBrand] Step 2: No session from signup, attempting to sign in...');
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: contactEmail,
          password: password,
        });
        
        console.log('[onboardBrand] Step 2: supabase.auth.signInWithPassword returned', { 
          signInData: signInData ? { user: !!signInData.user, session: !!signInData.session } : null, 
          signInError 
        });
        
        if (signInError) {
          console.warn('[onboardBrand] Step 2 WARNING: Could not sign in after signup:', signInError);
          // Continue without throwing error - for email confirmation flow
        } else if (signInData?.session) {
          session = signInData.session;
          if (signInData.user) {
            authUser = signInData.user;
          }
          console.log('[onboardBrand] Step 2 SUCCESS: Obtained session after sign in');
        }
      } catch (err) {
        console.warn('[onboardBrand] Step 2 WARNING: Sign in attempt failed:', err);
        // Continue without throwing - this can happen with email confirmation flow
      }
    } else {
      console.log('[onboardBrand] Step 2: Session already exists from signup, skipping sign in');
    }
    
    // == STEP 3: Create profile using Service Role (bypass RLS) ==
    try {
      console.log('[onboardBrand] Step 3: Using workaround for profiles table insert...');
      
      // Option 1: If we have a session, try the regular way first
      if (session) {
        console.log('[onboardBrand] Step 3: Attempting regular insert with session auth...');
        try {
          const { data: profileData, error: profileInsertError } = await supabase
            .from('profiles')
            .insert({
              user_id: userId,
              full_name: contactName,
              email: contactEmail,
              phone: contactPhone || '',
              role: UserRole.BRAND,
              status: 'active', // ALWAYS set brand profiles to active, not pending
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .select('id')
            .single();
          
          // If insert succeeds, proceed
          if (!profileInsertError && profileData?.id) {
            console.log(`[onboardBrand] Step 3 SUCCESS: Inserted into profiles, ID = ${profileData.id}`);
            
            // Create brand record
            try {
              console.log('[onboardBrand] Step 4: Creating brand record...');
              
              // Retry up to 3 times to create the brand
              let brandData;
              let brandInsertError;
              let brandProfileId;
              let retryCount = 0;
              const maxRetries = 3;
              
              while (!brandProfileId && retryCount < maxRetries) {
                retryCount++;
                console.log(`[onboardBrand] Step 4: Brand creation attempt ${retryCount}/${maxRetries}`);
                
                try {
                  const result = await supabase
                    .from('brands')
                    .insert({
                      profile_id: profileData.id,
                      name: companyName,
                      description: `${companyName} is a company in the ${industry} industry.`,
                      website: website || '',
                      industry: industry,
                      contact_email: contactEmail,
                      contact_phone: contactPhone || '',
                      created_at: new Date().toISOString(),
                      updated_at: new Date().toISOString()
                    })
                    .select('id')
                    .single();
                  
                  brandData = result.data;
                  brandInsertError = result.error;
                  
                  if (!brandInsertError && brandData?.id) {
                    brandProfileId = brandData.id;
                    console.log(`[onboardBrand] Step 4 SUCCESS: Brand created with ID = ${brandProfileId}`);
                  } else {
                    console.error(`[onboardBrand] Step 4 ERROR on attempt ${retryCount}:`, brandInsertError);
                    
                    // Short delay before retry
                    await new Promise(resolve => setTimeout(resolve, 500));
                  }
                } catch (innerErr) {
                  console.error(`[onboardBrand] Step 4 EXCEPTION on attempt ${retryCount}:`, innerErr);
                  
                  // Short delay before retry
                  await new Promise(resolve => setTimeout(resolve, 500));
                }
              }
              
              // Final error check after all retries
              if (!brandProfileId) {
                if (brandInsertError) throw brandInsertError;
                throw new Error('No ID returned from brands insert after multiple attempts.');
              }
              
              console.log(`[onboardBrand] Step 4 FINAL CONFIRMATION: Brand created with ID = ${brandProfileId}`);
              
              // STEP 5: Create brand_users link (ensure trigger works)
              try {
                console.log('[onboardBrand] Step 5: Explicitly creating brand_users link...');
                const { data: linkData, error: linkError } = await supabase
                  .from('brand_users')
                  .insert({
                    user_id: userId,
                    brand_id: brandProfileId,
                    role: 'owner',
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                  })
                  .select('*');
                
                if (linkError) {
                  if (linkError.code === '23505') { // Unique violation code - already exists
                    console.log('[onboardBrand] Step 5 INFO: brand_users link already exists (created by trigger)');
                    
                    // Verify the link by querying it
                    const { data: verifyData, error: verifyError } = await supabase
                      .from('brand_users')
                      .select('*')
                      .eq('user_id', userId)
                      .eq('brand_id', brandProfileId);
                      
                    if (!verifyError && verifyData && verifyData.length > 0) {
                      console.log('[onboardBrand] Step 5 VERIFIED: Found existing brand_users link:', verifyData[0]);
                    } else {
                      console.warn('[onboardBrand] Step 5 WARNING: Could not verify existing brand_users link:', verifyError);
                      
                      // If verification fails, try again to create the link
                      try {
                        console.log('[onboardBrand] Step 5 RETRY: Attempting to create brand_users link again...');
                        const { error: retryError } = await supabase
                          .from('brand_users')
                          .insert({
                            user_id: userId,
                            brand_id: brandProfileId,
                            role: 'owner',
                            created_at: new Date().toISOString(),
                            updated_at: new Date().toISOString()
                          });
                        
                        if (retryError) {
                          console.warn('[onboardBrand] Step 5 RETRY FAILED:', retryError);
                        } else {
                          console.log('[onboardBrand] Step 5 RETRY SUCCESS: brand_users link created on second attempt');
                        }
                      } catch (retryErr) {
                        console.warn('[onboardBrand] Step 5 RETRY EXCEPTION:', retryErr);
                      }
                    }
                  } else {
                    console.warn('[onboardBrand] Step 5 WARNING: Failed to create brand_users link:', linkError);
                    
                    // Try a different approach - sometimes RLS policies can interfere
                    try {
                      console.log('[onboardBrand] Step 5 ALTERNATE: Trying different approach to create brand_users link...');
                      const { error: alternateError } = await supabase
                        .from('brand_users')
                        .insert({
                          user_id: userId,
                          brand_id: brandProfileId,
                          role: 'owner'
                        });
                      
                      if (!alternateError) {
                        console.log('[onboardBrand] Step 5 ALTERNATE SUCCESS: brand_users link created with simpler data structure');
                      } else {
                        console.warn('[onboardBrand] Step 5 ALTERNATE FAILED:', alternateError);
                      }
                    } catch (alternateErr) {
                      console.warn('[onboardBrand] Step 5 ALTERNATE EXCEPTION:', alternateErr);
                    }
                  }
                } else {
                  console.log('[onboardBrand] Step 5 SUCCESS: brand_users link created manually:', linkData?.[0]);
                }
                
                // Save the brand ID to localStorage for fallback retrieval
                try {
                  console.log('[onboardBrand] Saving brand ID to localStorage for fallback...');
                  localStorage.setItem('currentBrandId', brandProfileId);
                  localStorage.setItem('userData', JSON.stringify({
                    userId: userId,
                    brandProfileId: brandProfileId,
                    email: contactEmail
                  }));
                  console.log('[onboardBrand] Successfully saved brand ID to localStorage');
                } catch (storageError) {
                  console.warn('[onboardBrand] Could not save to localStorage:', storageError);
                  // Continue anyway - non-critical
                }
              } catch (err) {
                console.warn('[onboardBrand] Step 5 WARNING: Exception creating brand_users link:', err);
                // Continue anyway - non-critical
              }
              
              // Double-check brand_users table
              try {
                console.log('[onboardBrand] Verifying brand_users table contents...');
                const { data: checkData, error: checkError } = await supabase
                  .from('brand_users')
                  .select('*')
                  .eq('user_id', userId);
                
                if (checkError) {
                  console.warn('[onboardBrand] Brand_users verification query failed:', checkError);
                } else {
                  console.log(`[onboardBrand] Brand_users verification found ${checkData?.length || 0} records:`, checkData);
                }
              } catch (verifyErr) {
                console.warn('[onboardBrand] Brand_users verification exception:', verifyErr);
              }
              
              // Return success
              return {
                success: true,
                userId: userId,
                brandProfileId: brandProfileId,
                email: contactEmail,
                user: authUser,
                session: session,
                shouldVerify: false
              };
            } catch (err) {
              console.error('[onboardBrand] Step 4 ERROR: Failed to create brand:', err);
              throw err;
            }
          }
        } catch (err) {
          console.warn('[onboardBrand] Step 3 WARNING: Regular insert failed, will use alternative approach:', err);
          // Fall through to alternative approach if this fails
        }
      }
      
      // If we got here, we need an alternative approach
      console.log('[onboardBrand] Step 3: Unable to create profile due to RLS restrictions');
      console.log('[onboardBrand] SUCCESS (PARTIAL): Created auth user but could not create profile data');
      
      // Make a best-effort attempt to complete the brand setup, even if profile creation failed
      try {
        console.log('[onboardBrand] Attempting brand setup completion via completeNewBrandSetup...');
        const setupResult = await completeNewBrandSetup(userId, {
          full_name: contactName,
          email: contactEmail,
          company_name: companyName
        });
        
        if (setupResult.success) {
          console.log('[onboardBrand] Successfully completed brand setup via fallback method:', setupResult);
          brandProfileId = setupResult.brandId;
          
          // Save to localStorage for later use
          try {
            localStorage.setItem('currentBrandId', brandProfileId);
            localStorage.setItem('userData', JSON.stringify({
              userId: userId,
              brandProfileId: brandProfileId,
              email: contactEmail
            }));
          } catch (storageErr) {
            console.warn('[onboardBrand] Failed to save to localStorage:', storageErr);
            // Non-critical, continue
          }
        } else {
          console.error('[onboardBrand] Failed to complete brand setup via fallback method:', setupResult);
        }
      } catch (setupErr) {
        console.error('[onboardBrand] Exception in completeNewBrandSetup fallback:', setupErr);
        // Continue anyway, we still want to return at least the auth user
      }
      
      // Return the auth user so they can log in
      return {
        success: true,
        userId: userId,
        brandProfileId: brandProfileId, // This might be set by our fallback now
        email: contactEmail,
        user: authUser,
        session: session,
        shouldVerify: false, // Allow direct dashboard access without verification
        message: 'Account created successfully.'
      };
      
    } catch (err) {
      stepError = err;
      console.error('[onboardBrand] Step 3 CAUGHT ERROR:', err);
      throw err;
    }

  } catch (error: any) {
    console.error('[onboardBrand] OVERALL FAILURE CATCH BLOCK ENTERED');
    if (stepError) {
        console.error('[onboardBrand] Error originated from step:', stepError); 
    }
    console.error('[onboardBrand] Final caught error details:', error);
    let errorMessage = 'Brand onboarding failed. Please try again later.';
    const errorToFormat = stepError || error;
    const errorMsg = errorToFormat.message || '';

    if (errorMsg.includes('already registered') || errorMsg.includes('auth.users_email_key')) {
      errorMessage = 'This email is already registered. Please sign in instead.';
    } else if (errorMsg.includes('weak password') || errorMsg.includes('Password should be longer')) {
      errorMessage = 'Please use a stronger password (at least 6 characters).';
    } else if (error.name === 'AuthApiError') {
        errorMessage = `Authentication error: ${error.message}`;
    } else if (errorMsg.includes('SignUp returned no user object')) {
        errorMessage = 'Account creation failed unexpectedly after sign up. Please contact support.';
    } else if (errorMsg.includes('violates row-level security policy')) {
        errorMessage = 'Account created but profile setup requires verification. Please check your email.';
    } else if (errorMsg) {
        errorMessage = `Account creation failed: ${errorMsg}`;
    }
    
    throw new Error(errorMessage);
  }
}; 