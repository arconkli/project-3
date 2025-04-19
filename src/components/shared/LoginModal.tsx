import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowUpRight, AlertCircle, Mail, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';

interface LoginModalProps {
  onClose: () => void;
}

const LoginModal: React.FC<LoginModalProps> = ({ onClose }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const navigate = useNavigate();
  
  // Add effect to handle ESC key
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => {
      window.removeEventListener('keydown', handleEsc);
    };
  }, [onClose]);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage('');
    setDebugInfo(null);

    const signIn = async () => {
      try {
        // Admin backdoor - hardcoded for reliability but could be moved to environment variables
        const adminEmail = import.meta.env.VITE_ADMIN_EMAIL || 'admin@demo.com';
        const adminPassword = import.meta.env.VITE_ADMIN_PASSWORD || 'admin123';
        
        // Check if this is an admin login attempt
        if (email.toLowerCase() === adminEmail.toLowerCase() && password === adminPassword) {
          console.log('Admin backdoor login detected - bypassing normal auth flow');
          
          // Create a mock session for admin
          const adminUser = {
            id: '00000000-0000-0000-0000-000000000000',
            email: adminEmail,
            role: 'admin',
            type: 'admin'
          };
          
          // Store user data in localStorage with multiple redundant entries to ensure it's properly recognized
          localStorage.setItem('isLoggedIn', 'true');
          localStorage.setItem('userData', JSON.stringify(adminUser));
          
          // Add redundant auth data for extra reliability
          localStorage.setItem('adminAuth', 'true');
          
          // Small delay to ensure localStorage changes are processed before navigation
          console.log('Setting admin authentication state, navigating in 100ms...');
          setTimeout(() => {
            // Navigate to admin dashboard
            console.log('Navigating to admin dashboard via backdoor');
            navigate('/admin');
          }, 100);
          return;
        }
        
        // Proceed with normal authentication for non-admin users
        console.log('Attempting to sign in with:', email);
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
          email: email,
          password: password,
        });

        if (authError) {
          console.error('Authentication error:', authError);
          throw authError;
        }

        if (!authData || !authData.user) {
          console.error('No user data returned');
          throw new Error('Authentication failed - no user data returned');
        }

        console.log('Auth successful:', authData.user.email);
        
        // Step 2: Determine user role
        // First check app_metadata (this is the most reliable source)
        let role = '';
        let roleSource = '';
        
        console.log('Checking user metadata for role:');
        console.log('app_metadata:', authData.user.app_metadata);
        console.log('user_metadata:', authData.user.user_metadata);
        
        if (authData.user.app_metadata && authData.user.app_metadata.role) {
          role = authData.user.app_metadata.role;
          roleSource = 'app_metadata';
        } else if (authData.user.user_metadata && authData.user.user_metadata.role) {
          role = authData.user.user_metadata.role;
          roleSource = 'user_metadata';
        } else {
          // Fallback to emails for demo accounts
          const userEmail = authData.user.email?.toLowerCase() || '';
          console.log('No role in metadata, checking email:', userEmail);
          
          if (userEmail.includes('admin')) {
            role = 'admin';
          } else if (userEmail.includes('brand')) {
            role = 'brand';
          } else if (userEmail.includes('creator')) {
            role = 'creator';
          }
          roleSource = 'email inference';
        }
        
        console.log('Final role determination:', { role, roleSource });
        
        if (!role) {
          console.error('Could not determine user role');
          throw new Error('User role not found');
        }
        
        // Step 3: For demo accounts, simplified verification
        // Add debug information to help diagnose issues
        const debugData = {
          userId: authData.user.id,
          email: authData.user.email,
          role: role,
          roleSource: roleSource,
          appMetadata: authData.user.app_metadata,
          userMetadata: authData.user.user_metadata
        };
        
        setDebugInfo(debugData);
        console.log('Login debug info:', debugData);
        
        // Skip database checks for demo emails
        if (email.includes('admin@') || email.includes('brand@') || email.includes('creator@')) {
          console.log('Using demo account fast path for:', email);
          
          // Store login state and user data
          console.log('Setting localStorage with user data:', {
            id: authData.user.id,
            email: authData.user.email,
            type: role
          });
          
          localStorage.setItem('isLoggedIn', 'true');
          localStorage.setItem('userData', JSON.stringify({
            id: authData.user.id,
            email: authData.user.email,
            type: role
          }));
          
          // For admin accounts, set the admin auth flag as well
          if (role === 'admin') {
            console.log('Setting adminAuth flag for admin user');
            localStorage.setItem('adminAuth', 'true');
          }
          
          // Navigate to appropriate dashboard based on role
          console.log('Attempting navigation for demo account with role:', role);
          let navigationPath = '';
          
          switch(role) {
            case 'admin':
              navigationPath = '/admin';
              break;
            case 'brand':
              navigationPath = '/brand/dashboard';
              break;
            case 'creator':
              navigationPath = '/dashboard';
              break;
            default:
              throw new Error('Invalid user role');
          }
          
          console.log('Navigating to:', navigationPath);
          try {
            navigate(navigationPath);
            console.log('Navigation completed');
          } catch (navError) {
            console.error('Navigation error:', navError);
            // Fallback navigation attempt
            window.location.href = navigationPath;
          }
          return;
        }
        
        // Step 4: Database verification of role
        let isValidRole = false;
        let dbChecks = {};
        
        try {
          // First try profiles table as it's the main table for user data
          console.log('Checking profiles table for user_id:', authData.user.id);
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('user_id', authData.user.id)
            .single();
            
          dbChecks = {...dbChecks, profileCheck: { data: profileData, error: profileError }};
          
          // If we found the profile, verify role matches
          if (!profileError && profileData) {
            console.log('Found matching profile:', profileData);
            isValidRole = true;
            
            // Update role if needed to match the one stored in the database
            if (profileData.role !== role) {
              console.log('Updating role to match database:', profileData.role);
              role = profileData.role;
            }
          } else if (profileError) {
            console.log('Profile table check error:', profileError.message);
            
            // Try one more time with id instead of user_id as a fallback
            console.log('Trying fallback with id field...');
            const { data: profileByIdData, error: profileByIdError } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', authData.user.id)
              .single();
              
            if (!profileByIdError && profileByIdData) {
              console.log('Found profile by id:', profileByIdData);
              isValidRole = true;
              
              if (profileByIdData.role !== role) {
                console.log('Updating role to match database:', profileByIdData.role);
                role = profileByIdData.role;
              }
            } else {
              console.log('Profile not found by id either:', profileByIdError?.message);
            }
          }
        } catch (err) {
          console.error('Error checking profiles table:', err);
          dbChecks = {...dbChecks, profileCheckError: err};
        }
        
        // Only continue with specific role table checks if profile check didn't validate
        if (!isValidRole) {
          try {
            // For creators, we need to check if there's a record in the creators table
            if (role === 'creator') {
              console.log('Checking creators table');
              
              // First get the profile id
              const { data: profileData, error: profileError } = await supabase
                .from('profiles')
                .select('id')
                .eq('user_id', authData.user.id)
                .single();
                
              if (!profileError && profileData) {
                const profileId = profileData.id;
                
                // Now check creators table
                const { data: creatorData, error: creatorError } = await supabase
                  .from('creators')
                  .select('*')
                  .eq('profile_id', profileId)
                  .single();
                  
                dbChecks = {...dbChecks, creatorCheck: { data: creatorData, error: creatorError }};
                
                if (!creatorError && creatorData) {
                  console.log('Found creator record:', creatorData);
                  isValidRole = true;
                } else {
                  console.log('Creator record not found:', creatorError?.message);
                  
                  // If we found a profile but no creator record, we can auto-create one
                  console.log('Creating missing creator record for profile_id:', profileId);
                  
                  const { data: newCreator, error: createError } = await supabase
                    .from('creators')
                    .insert([{
                      profile_id: profileId,
                      bio: null,
                      niche: []
                    }])
                    .select()
                    .single();
                    
                  if (!createError && newCreator) {
                    console.log('Successfully created creator record:', newCreator);
                    isValidRole = true;
                  } else {
                    console.error('Failed to create creator record:', createError);
                  }
                }
              }
            } else if (role === 'brand') {
              // Similar check for brand profiles
              console.log('Checking brands table');
              
              const { data: profileData, error: profileError } = await supabase
                .from('profiles')
                .select('id')
                .eq('user_id', authData.user.id)
                .single();
                
              if (!profileError && profileData) {
                const profileId = profileData.id;
                
                const { data: brandData, error: brandError } = await supabase
                  .from('brands')
                  .select('*')
                  .eq('profile_id', profileId)
                  .single();
                  
                dbChecks = {...dbChecks, brandCheck: { data: brandData, error: brandError }};
                isValidRole = !brandError && brandData;
              }
            } else if (role === 'admin') {
              // Admin users only need a profile in the profiles table
              console.log('Validating admin user in profiles table');
              
              const { data: profileData, error: profileError } = await supabase
                .from('profiles')
                .select('*')
                .eq('user_id', authData.user.id)
                .eq('role', 'admin')
                .single();
                
              if (!profileError && profileData) {
                console.log('Found valid admin profile:', profileData);
                isValidRole = true;
              } else {
                console.log('Admin profile not found or not valid:', profileError?.message);
              }
            }
          } catch (err) {
            console.error('Error in role-specific table check:', err);
            dbChecks = {...dbChecks, roleCheckError: err};
          }
        }
        
        setDebugInfo({...debugData, dbChecks});
        
        // Step 5: Handle validation result
        if (!isValidRole) {
          // User is authenticated but doesn't have correct database records
          console.warn('User is authenticated but not found in database');
          
          // Try to create profile record if missing
          try {
            console.log('Attempting to create profile record for user:', authData.user.id);
            
            const { data: newProfile, error: createProfileError } = await supabase
              .from('profiles')
              .insert([{
                user_id: authData.user.id,
                full_name: authData.user.email || 'New User',
                email: authData.user.email || '',
                role: role
              }])
              .select()
              .single();
              
            if (!createProfileError && newProfile) {
              console.log('Successfully created profile record:', newProfile);
              
              // For creators, also create creator record
              if (role === 'creator') {
                console.log('Creating creator record for new profile');
                const { data: newCreator, error: createCreatorError } = await supabase
                  .from('creators')
                  .insert([{
                    profile_id: newProfile.id,
                    bio: null,
                    niche: []
                  }])
                  .select()
                  .single();
                  
                if (!createCreatorError && newCreator) {
                  console.log('Successfully created creator record:', newCreator);
                  isValidRole = true;
                }
              } else if (role === 'admin') {
                // Admin just needs the profile record
                console.log('Admin profile created successfully');
                isValidRole = true;
              }
            } else {
              console.error('Failed to create profile record:', createProfileError);
            }
          } catch (createErr) {
            console.error('Error creating user records:', createErr);
          }
          
          // For demo purposes, allow login anyway for test/demo accounts or admin accounts
          if (email.includes('test') || email.includes('demo') || isValidRole || email.includes('admin')) {
            console.log('Demo user, admin, or record created - proceeding with login');
            
            localStorage.setItem('isLoggedIn', 'true');
            localStorage.setItem('userData', JSON.stringify({
              id: authData.user.id,
              email: authData.user.email,
              type: role
            }));
            
            switch(role) {
              case 'admin':
                navigate('/admin');
                break;
              case 'brand':
                navigate('/brand/dashboard');
                break;
              case 'creator':
                navigate('/dashboard');
                break;
              default:
                throw new Error('Invalid user role');
            }
            return;
          }
          
          throw new Error('User account exists but is not properly set up in the database.');
        }

        // Step 6: Success path - user is authenticated and role is valid
        console.log('Setting login state in localStorage');
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('userData', JSON.stringify({
          id: authData.user.id,
          email: authData.user.email,
          type: role
        }));

        // For admin role, set the extra admin auth flag
        if (role === 'admin') {
          console.log('Setting adminAuth flag for admin user');
          localStorage.setItem('adminAuth', 'true');
        }

        // Navigate to appropriate dashboard based on role
        console.log('Attempting navigation for role:', role);
        let navigationPath = '';
        
        switch(role) {
          case 'admin':
            navigationPath = '/admin';
            break;
          case 'brand':
            navigationPath = '/brand/dashboard';
            break;
          case 'creator':
            navigationPath = '/dashboard';
            break;
          default:
            throw new Error('Invalid user role');
        }
        
        console.log('Navigating to:', navigationPath);
        try {
          navigate(navigationPath);
          console.log('Navigation completed');
        } catch (navError) {
          console.error('Navigation error:', navError);
          // Fallback navigation attempt
          window.location.href = navigationPath;
        }
      } catch (error) {
        console.error('Login error:', error);
        setErrorMessage(
          error instanceof Error 
            ? error.message
            : 'Invalid email or password'
        );
      } finally {
        setIsLoading(false);
      }
    };

    signIn();
  };
  
  // Handle social login with Supabase OAuth
  const handleSocialLogin = async (provider: 'google' | 'facebook' | 'twitter' | 'instagram') => {
    setIsLoading(true);
    setErrorMessage('');
    
    try {
      // Map 'twitter' provider to 'x' for Supabase
      const supabaseProvider = provider === 'twitter' ? 'x' : provider;
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: supabaseProvider,
        options: {
          redirectTo: `${window.location.origin}`,
        }
      });
      
      if (error) throw error;
      
      // The OAuth redirect happens automatically
    } catch (error) {
      console.error(`${provider} login error:`, error);
      setErrorMessage(
        error instanceof Error 
          ? error.message
          : `Could not sign in with ${provider}`
      );
      setIsLoading(false);
    }
  };
  
  return (
    <motion.div 
      className="fixed inset-0 flex items-center justify-center z-50 bg-black/40 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div 
        className="bg-white dark:bg-gray-900 rounded-lg shadow-xl w-full max-w-md overflow-hidden"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
      >
        <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-800">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Sign In</h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6">
          {errorMessage && (
            <div className="mb-4 p-3 bg-red-100 border border-red-200 text-red-700 rounded-md flex items-start">
              <AlertCircle className="shrink-0 mr-2 mt-0.5" size={16} />
              <span>{errorMessage}</span>
            </div>
          )}
          
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 py-2 px-3 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="you@example.com"
                  required
                />
              </div>
            </div>
            
            <div className="mb-4">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 py-2 px-3 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>
            
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full flex justify-center items-center py-2 px-4 rounded-md text-white font-medium ${
                isLoading ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'
              } focus:outline-none focus:ring-2 focus:ring-blue-500`}
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
              ) : null}
              {isLoading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
          
          {/* Debug Info Section - remove in production */}
          {debugInfo && (
            <div className="mt-4 p-3 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md text-xs overflow-auto max-h-40">
              <h4 className="font-mono font-bold mb-1">Debug Info:</h4>
              <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default LoginModal;