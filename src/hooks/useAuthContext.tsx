import { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabaseClient';
import { completeNewBrandSetup } from '@/services/auth/authService';
import { useNavigate } from 'react-router-dom';
import { UserRole } from '@/types/auth';

// Function to ensure brand accounts are properly set up
const ensureBrandAccountSetup = async (user: User) => {
  if (!user) return;
  
  try {
    // Check if the user is a brand by looking at metadata or profiles table
    const isBrand = user.app_metadata?.role === 'brand' || user.user_metadata?.role === 'brand';
    
    if (!isBrand) {
      // Check profile table as fallback
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('user_id', user.id)
        .single();
        
      if (profile?.role !== 'brand') {
        return; // Not a brand account, don't need to do anything
      }
    }
    
    console.log('[AUTH] Brand account detected. Ensuring complete setup...');
    
    // Run the setup function
    await completeNewBrandSetup(user.id, {
      full_name: user.user_metadata?.full_name,
      email: user.email,
      company_name: user.user_metadata?.company_name
    });
    
  } catch (error) {
    console.error('[AUTH] Error in ensureBrandAccountSetup:', error);
    // Non-critical, continue with auth flow
  }
};

// Define the auth context type - ADD export
export interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  userRole: UserRole | null;
  isEmailVerified: boolean;
  userProfile: any;
  brandInfo: any;
  error: Error | null;
  signOut: () => Promise<void>;
  refreshUserData: () => Promise<void>;
  resendVerificationEmail: () => Promise<void>;
}

// Create the auth context with default values
const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  loading: true,
  userRole: null,
  isEmailVerified: false,
  userProfile: null,
  brandInfo: null,
  error: null,
  signOut: async () => {},
  refreshUserData: async () => {},
  resendVerificationEmail: async () => {}
});

// Auth provider component
export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const navigate = useNavigate();
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [isEmailVerified, setIsEmailVerified] = useState<boolean>(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [brandInfo, setBrandInfo] = useState<any>(null);
  const [error, setError] = useState<Error | null>(null);

  // --- DEBUG START: Wrapper for setLoading ---
  // const debugSetLoading = (value: boolean, caller: string) => {
  //   console.log(`[DEBUG AuthContext] setLoading(${value}) called from: ${caller}`);
  //   setLoading(value);
  // };
  // --- DEBUG END ---

  // Function to load user data
  const loadUserData = async (user: User, role: UserRole) => {
    // --- DEBUG START ---
    // console.log(`[DEBUG AuthContext] loadUserData START for role: ${role}, user: ${user.id}`);
    // const startTime = performance.now();
    // --- DEBUG END ---
    try {
      // Check if email is verified
      setIsEmailVerified(!!user.email_confirmed_at);
  
      // --- DEBUG START: Placeholder for additional data fetching ---
      // console.log('[DEBUG AuthContext] loadUserData: Checking for role-specific data (currently none).');
      // If you were fetching profile/brand info here, log it:
      // e.g., console.log('[DEBUG AuthContext] loadUserData: Fetching profile...');
      // const { data, error } = await supabase.from('profiles')...;
      // console.log('[DEBUG AuthContext] loadUserData: Profile fetch complete.', data);
      // --- DEBUG END ---
      
      console.log("User data loaded for role:", role);
    } catch (err) {
      console.error("Error loading user data:", err);
      setError(err as Error);
    } finally {
      // --- DEBUG START ---
      // const endTime = performance.now();
      // console.log(`[DEBUG AuthContext] loadUserData END. Duration: ${endTime - startTime}ms`);
      // --- DEBUG END ---
    }
  };

  useEffect(() => {
    // Set a maximum timeout for the loading state
    const loadingTimeout = setTimeout(() => {
      if (loading) {
        console.warn('[Auth Context] Loading state has been active for too long. Forcing completion.');
        // --- DEBUG START ---
        // setLoading(false);
        // debugSetLoading(false, 'Loading Timeout Fallback');
        setLoading(false); // Replaced debug call
        // --- DEBUG END ---
        
        // Try to get the session directly
        supabase.auth.getSession()
          .then(({ data, error }) => {
            if (error) {
              console.error('[Auth Context] Error getting session after timeout:', error);
              setError(error as Error);
            } else if (data.session) {
              console.log('[Auth Context] Found session after timeout:', data.session.user.id);
              setSession(data.session);
              setUser(data.session.user);
              setIsEmailVerified(!!data.session.user.email_confirmed_at);
            }
          })
          .catch(err => {
            console.error('[Auth Context] Exception in timeout session check:', err);
          });
      }
    }, 20000); // 20 second maximum loading time
    
    return () => clearTimeout(loadingTimeout);
  }, [loading]);

  useEffect(() => {
    // Check for force_logout flag to prevent immediate re-login
    const urlParams = new URLSearchParams(window.location.search);
    const forceLogout = urlParams.get('force_logout') === 'true';
    const forceLogoutCompleted = sessionStorage.getItem('_force_logout_completed') === 'true';
    
    if (forceLogout || forceLogoutCompleted) {
      console.log('[Auth Context] Force logout detected, preventing auto-login');
      
      // Clear the session and user state
      setSession(null);
      setUser(null);
      setUserRole(null);
      setUserProfile(null);
      setBrandInfo(null);
      setIsEmailVerified(false);
      
      // Clear the flag
      sessionStorage.removeItem('_force_logout_completed');
      
      // Clean URL if force_logout is present
      if (forceLogout && window.history.pushState) {
        const newUrl = window.location.protocol + "//" + 
                     window.location.host + 
                     window.location.pathname;
        window.history.pushState({path: newUrl}, '', newUrl);
      }
      
      // Short-circuit the session fetch
      // setLoading(false);
      // debugSetLoading(false, 'Force Logout'); // --- DEBUG
      setLoading(false); // Replaced debug call
      return;
    }
    
    // --- DEBUG START ---
    // console.log('[DEBUG AuthContext] useEffect[]: Initializing fetchSession and listener.');
    // setLoading(true); // Set loading true at the start of the effect
    setLoading(true); // Replaced debug call
    // --- DEBUG END ---

    // Fetch the current session
    const fetchSession = async () => {
      // --- DEBUG START ---
      // console.log('[DEBUG AuthContext] fetchSession START');
      // --- DEBUG END ---
      try {
        console.log('[Auth Context] Fetching session...');
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('[Auth Context] Error fetching session:', error);
          setError(error as Error);
          setLoading(false);
          return;
        }
        
        console.log('[Auth Context] Session fetch result:', 
          session ? 'Session found' : 'No session found');
        
        setSession(session);
        
        if (session?.user) {
          let currentUser = session.user;
          console.log('[Auth Context] User found in session:', currentUser.id);
          
          // Add a session refresh to ensure token validity
          try {
            console.log('[Auth Context] Refreshing session token...');
            const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
            
            if (refreshError) {
              console.error('[Auth Context] Error refreshing session token:', refreshError);
              // Continue with the existing session even if refresh fails
            } else if (refreshData.session) {
              console.log('[Auth Context] Session token refreshed successfully');
              // Update with the refreshed session and user
              setSession(refreshData.session);
              currentUser = refreshData.session.user; // Update the user variable
            }
          } catch (refreshErr) {
            console.error('[Auth Context] Exception during session refresh:', refreshErr);
            // Continue with the existing session even if refresh fails
          }
          
          setUser(currentUser);
          setIsEmailVerified(!!currentUser.email_confirmed_at);
          
          // Determine user role
          const role = currentUser.app_metadata?.role as UserRole || 
                       currentUser.user_metadata?.role as UserRole ||
                       null;
          setUserRole(role);
          
          if (role) {
            await loadUserData(currentUser, role);
          }
          
          // Store auth state in localStorage
          localStorage.setItem('isLoggedIn', 'true');
          localStorage.setItem('userData', JSON.stringify({
            id: currentUser.id,
            email: currentUser.email,
            role: role,
            emailVerified: !!currentUser.email_confirmed_at
          }));
          
          if (role === 'admin') {
            localStorage.setItem('adminAuth', 'true');
          }
          
          // Ensure brand account is fully set up ONLY when a user is actually a brand
          if (role === 'brand') {
            console.log('[Auth Context] User role is brand, ensuring setup...');
            await ensureBrandAccountSetup(currentUser);
          }

          // If the user is authenticated, check if they need onboarding.
          // if (session?.user && role) {
          //   const onboardingNeeded = await checkOnboardingStatus(session.user, role);
          //   if (onboardingNeeded) {
          //     const onboardingPath = role === 'brand' ? '/brand-onboarding' : '/creator-onboarding';
          //     // Prevent redirect if already on an onboarding path or login/signup
          //     if (!window.location.pathname.startsWith('/brand-onboarding') && 
          //         !window.location.pathname.startsWith('/creator-onboarding') &&
          //         !window.location.pathname.startsWith('/login') &&
          //         !window.location.pathname.startsWith('/signup')) {
          //       console.log(`[Auth Context] Redirecting ${role} to onboarding: ${onboardingPath}`);
          //       navigate(onboardingPath);
          //     }
          //   } else {
          //     console.log(`[Auth Context] ${role} onboarding complete.`);
          //   }
          // }
        } else {
          console.log('[Auth Context] No user in session');
          // Important: Reset all user state when no session is found
          setUser(null);
          setUserRole(null);
          setIsEmailVerified(false);
          setUserProfile(null);
          setBrandInfo(null);
          
          // Clear localStorage
          localStorage.removeItem('isLoggedIn');
          localStorage.removeItem('userData');
          localStorage.removeItem('adminAuth');
        }
      } catch (err) {
        console.error('[Auth Context] Exception in fetchSession:', err);
        setError(err as Error);
      } finally {
        // Always set loading to false, even if there's an error
        console.log('[Auth Context] Setting loading to false');
        // setLoading(false);
        setLoading(false); // Replaced debug call
      }
    };

    fetchSession();

    // Subscribe to auth state changes
    // console.log('[DEBUG AuthContext] Subscribing to onAuthStateChange'); // --- DEBUG
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log(`[Auth Context] Auth state change received: ${event}`);
        // --- DEBUG START: Keep loading until processing is complete ---
        // Don't set loading false immediately here.
        let processingComplete = false;
        // --- DEBUG END ---

        try {
          // --- DEBUG START ---
          // console.log('[DEBUG AuthContext] onAuthStateChange START');
          // --- DEBUG END ---
          setSession(session);
          setUser(session?.user ?? null);
          
          if (session?.user) {
            let currentUser = session.user;
            setIsEmailVerified(!!currentUser.email_confirmed_at);
            
            const role = currentUser.app_metadata?.role as UserRole || 
                         currentUser.user_metadata?.role as UserRole ||
                         null;
                         
            setUserRole(role);
            
            if (role) {
              await loadUserData(currentUser, role);
            }

            // If it's a brand user, ensure setup is complete
            if (role === 'brand') {
               await ensureBrandAccountSetup(currentUser);
            }
            
          } else {
            // Clear user-specific data if no session
            setUserRole(null);
            setIsEmailVerified(false);
            setUserProfile(null);
            setBrandInfo(null);
          }
          setError(null); // Clear previous errors on successful state change
        } catch (err) {
          console.error('[Auth Context] Error processing auth state change:', err);
          setError(err as Error);
        } finally {
          // --- DEBUG START: Set loading false AFTER processing ---
          // console.log('[DEBUG AuthContext] onAuthStateChange FINALLY');
          // --- DEBUG END ---
          // Ensure loading is always set to false after processing
          // setLoading(false);
          // debugSetLoading(false, 'onAuthStateChange finally');
          setLoading(false); // Replaced debug call
          processingComplete = true; 
        }
      }
    );

    // Cleanup function
    return () => {
      console.log('[Auth Context] Cleaning up auth listener.');
      authListener?.subscription.unsubscribe();
    };
  }, []);

  // Function to resend verification email
  const resendVerificationEmail = async () => {
    if (!user?.email) {
      console.error('Cannot resend verification email: No user email found');
      return;
    }

    try {
      console.log('Sending verification email to:', user.email);
      
      // Set the redirect URL to the verification page
      const redirectUrl = `${window.location.origin}/verify`;
      
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: user.email,
        options: {
          emailRedirectTo: redirectUrl
        }
      });

      if (error) {
        console.error('Error sending verification email:', error);
        throw error;
      }
      
      console.log('Verification email sent successfully');
      
      // Store email in localStorage for verification page
      try {
        const userDataStr = localStorage.getItem('userData');
        const userData = userDataStr ? JSON.parse(userDataStr) : {};
        userData.email = user.email;
        userData.id = user.id;
        userData.emailVerified = false;
        localStorage.setItem('userData', JSON.stringify(userData));
      } catch (err) {
        console.error('Error updating localStorage:', err);
      }
    } catch (error) {
      console.error('Failed to resend verification email:', error);
      throw error;
    }
  };

  // Create the context value object
  const contextValue: AuthContextType = {
    session,
    user,
    loading,
    userRole,
    isEmailVerified,
    userProfile,
    brandInfo,
    error,
    signOut: async () => {
      try {
        setLoading(true);
        console.log('[Auth Context] Signing out and clearing all user data...');
        
        // Setting force logout flag first for immediate effect
        try {
          window.sessionStorage.setItem('_force_logout_completed', 'true');
          console.log('[Auth Context] Set force logout flag to prevent auto-login');
        } catch (e) {
          console.warn('[Auth Context] Could not set force logout flag:', e);
        }
        
        // Perform Supabase signout with a timeout to prevent hanging
        await new Promise<void>(async (resolve) => {
          try {
            // Add a timeout to ensure we continue even if Supabase signOut hangs
            const timeoutId = setTimeout(() => {
              console.log('[Auth Context] Supabase signOut timed out, continuing with cleanup');
              resolve();
            }, 2000);
            
            // Only attempt Supabase signout if we have a session
            if (session) {
              const { error } = await supabase.auth.signOut({ scope: 'global' });
              if (error) {
                console.error('[Auth Context] Error signing out from Supabase:', error);
                setError(error);
              } else {
                console.log('[Auth Context] Supabase signOut completed successfully');
              }
            }
            
            clearTimeout(timeoutId);
            resolve();
          } catch (e) {
            console.error('[Auth Context] Exception during Supabase signOut:', e);
            resolve(); // Continue with cleanup regardless
          }
        });
        
        // Direct removal of known Supabase tokens first
        try {
          // Direct removal of Supabase session tokens
          window.localStorage.removeItem('sb-selhnopizirtuwrwwzac-auth-token');
          window.localStorage.removeItem('sb-selhnopizirtuwrwwzac-auth-token-code-verifier');
          window.localStorage.removeItem('supabase.auth.token');
          window.localStorage.removeItem('supabase.auth.refreshToken');
          console.log('[Auth Context] Directly removed Supabase auth tokens');
        } catch (e) {
          console.error('[Auth Context] Error removing Supabase tokens directly:', e);
        }
        
        // EXPANDED Comprehensive localStorage cleanup
        const keysToRemove = [
          // Auth tokens from various versions
          'sb-selhnopizirtuwrwwzac-auth-token',
          'sb-selhnopizirtuwrwwzac-auth-token-code-verifier',
          'sb-access-token',
          'sb-refresh-token',
          'supabase.auth.token',
          'supabase.auth.refreshToken',
          
          // User data
          'userData',
          'brandData',
          'profiles',
          'userProfile',
          
          // Login status flags
          'isLoggedIn',
          'isBrandLoggedIn',
          'isCreatorLoggedIn',
          
          // Campaign and brand data
          'currentBrandId',
          'brandCampaigns',
          'brandProfile',
          
          // Navigation state
          'lastVisitedPage',
          'hasCompletedOnboarding',
          
          // Any other app state
          'draft-campaign',
          'onboarding-progress'
        ];
        
        console.log('[Auth Context] Clearing ALL localStorage items (total:', keysToRemove.length, 'items)');
        
        // Clear all localStorage items in one go
        keysToRemove.forEach(key => {
          try {
            window.localStorage.removeItem(key);
          } catch (e) {
            console.warn(`[Auth Context] Could not remove ${key} from localStorage:`, e);
          }
        });
        
        // Also clear any SessionStorage items for good measure
        try {
          window.sessionStorage.clear();
          console.log('[Auth Context] Cleared all sessionStorage items');
        } catch (e) {
          console.warn('[Auth Context] Could not clear sessionStorage:', e);
        }
        
        // Try the nuclear option - clear everything
        try {
          window.localStorage.clear();
          console.log('[Auth Context] Cleared ALL localStorage items with clear()');
        } catch (e) {
          console.warn('[Auth Context] Could not clear all localStorage:', e);
        }
        
        console.log('[Auth Context] Successfully signed out and cleared user data');
      } catch (error) {
        console.error('Error during sign out process:', error);
        setError(error as Error);
        
        // Attempt emergency cleanup
        try {
          window.localStorage.clear();
          window.sessionStorage.clear();
          console.log('[Auth Context] Emergency cleanup: cleared all storage');
        } catch (e) {
          console.error('[Auth Context] Failed emergency cleanup:', e);
        }
      } finally {
        // Clear user state regardless of whether sign out succeeded
        setSession(null);
        setUser(null);
        setUserRole(null);
        setUserProfile(null);
        setBrandInfo(null);
        setIsEmailVerified(false);
        setLoading(false);
        
        // Force page reload with special parameter to indicate logout
        window.location.href = '/?force_logout=true';
      }
    },
    refreshUserData: async () => {
      if (user && userRole) {
        // --- DEBUG START ---
        // console.log('[DEBUG AuthContext] refreshUserData called.');
        // --- DEBUG END ---
        await loadUserData(user, userRole);
      }
    },
    resendVerificationEmail
  };

  // --- DEBUG START: Log final loading state ---
  // console.log(`[DEBUG AuthContext] Returning Provider. Loading state: ${loading}`);
  // --- DEBUG END ---

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 