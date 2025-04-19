import { supabase } from '@/lib/supabaseClient';

/**
 * Debug helper to check if tables exist and if the current user has access to them
 */
export const checkDatabaseTables = async () => {
  console.group('🔍 DATABASE DEBUG: Checking tables and permissions');
  
  try {
    // Check if we have an authenticated session
    const { data: sessionData } = await supabase.auth.getSession();
    console.log('Current session:', sessionData?.session ? 'Authenticated' : 'Not authenticated');
    
    // Try to list tables (requires admin privileges)
    try {
      console.log('Attempting to list tables (requires admin privileges)...');
      const { data: tableData, error: tableError } = await supabase.rpc('list_tables');
      
      if (tableError) {
        console.log('❌ Could not list tables:', tableError.message);
      } else {
        console.log('✅ Tables in database:', tableData);
      }
    } catch (e) {
      console.log('❌ Could not list tables (expected if not admin)');
    }
    
    // Check specific tables we know should exist
    const tablesToCheck = ['users', 'brands', 'brand_profiles', 'creators'];
    
    for (const table of tablesToCheck) {
      console.log(`Checking access to "${table}" table...`);
      try {
        // Just try to select a single row to see if we have access
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(1);
        
        if (error) {
          console.log(`❌ Error accessing "${table}" table:`, error.message);
          console.log('Details:', error.details);
        } else {
          console.log(`✅ Successfully accessed "${table}" table`, data.length > 0 ? `(${data.length} rows)` : '(empty)');
        }
      } catch (e) {
        console.log(`❌ Exception when accessing "${table}" table:`, e);
      }
    }
    
    // Check RLS policies (if possible)
    try {
      console.log('Attempting to check Row Level Security policies...');
      const { data: rlsData, error: rlsError } = await supabase.rpc('get_policies');
      
      if (rlsError) {
        console.log('❌ Could not check RLS policies:', rlsError.message);
      } else {
        console.log('✅ RLS policies:', rlsData);
      }
    } catch (e) {
      console.log('❌ Could not check RLS policies (expected if not admin)');
    }
    
  } catch (error) {
    console.error('❌ Error during database check:', error);
  } finally {
    console.groupEnd();
  }
};

/**
 * Debug utility to check if a user's records exist in various tables
 */
export const checkUserRecords = async (userId: string) => {
  console.group('🔍 DEBUG: Checking database records for user:', userId);
  
  try {
    // Check auth.users through admin functions (may not be accessible)
    try {
      console.log('Checking auth.users table...');
      const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(userId);
      
      if (authError) {
        console.log('❌ Could not check auth.users (requires admin rights):', authError.message);
      } else {
        console.log('✅ Found user in auth.users:', {
          id: authUser?.user?.id,
          email: authUser?.user?.email,
          role: authUser?.user?.app_metadata?.role,
          type: authUser?.user?.user_metadata?.type
        });
      }
    } catch (err) {
      console.log('❌ Error checking auth.users:', err);
    }
    
    // Check public.users table
    console.log('Checking public.users table...');
    const { data: publicUser, error: publicUserError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();
      
    if (publicUserError) {
      console.log('❌ Error checking public.users:', publicUserError.message);
    } else if (!publicUser) {
      console.log('❌ User not found in public.users table');
    } else {
      console.log('✅ Found user in public.users:', publicUser);
    }
    
    // Check brands table
    console.log('Checking brands table...');
    const { data: brand, error: brandError } = await supabase
      .from('brands')
      .select('*')
      .eq('user_id', userId)
      .single();
      
    if (brandError) {
      console.log('❌ Error checking brands table:', brandError.message);
    } else if (!brand) {
      console.log('❌ Brand not found in brands table');
    } else {
      console.log('✅ Found brand in brands table:', brand);
    }
    
    // Check brand_profiles table
    console.log('Checking brand_profiles table...');
    const { data: brandProfile, error: brandProfileError } = await supabase
      .from('brand_profiles')
      .select('*')
      .eq('brand_id', brand?.id || userId)
      .single();
      
    if (brandProfileError) {
      console.log('❌ Error checking brand_profiles table:', brandProfileError.message);
    } else if (!brandProfile) {
      console.log('❌ Brand profile not found in brand_profiles table');
    } else {
      console.log('✅ Found brand profile in brand_profiles table:', brandProfile);
    }
    
    return {
      authUserExists: true, // We can't really check this without admin privileges
      publicUserExists: !!publicUser,
      brandExists: !!brand,
      brandProfileExists: !!brandProfile,
      details: {
        publicUser,
        brand,
        brandProfile
      }
    };
  } catch (error) {
    console.error('❌ Error during record check:', error);
    return {
      error: error,
      authUserExists: false,
      publicUserExists: false,
      brandExists: false,
      brandProfileExists: false
    };
  } finally {
    console.groupEnd();
  }
}; 