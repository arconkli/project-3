import React, { useState, useEffect, createContext, useContext } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Session, User } from '@supabase/supabase-js';

// Define the shape of the context value
interface AuthContextType {
  user: (User & { role: string | null }) | null;
  isLoading: boolean;
  isAuthInitialized: boolean;
  signup: (email, password) => Promise<any>;
  login: (email, password) => Promise<any>;
  logout: () => Promise<any>;
  resetPassword: (email) => Promise<any>;
  updateProfile: (profile) => Promise<any>;
}

// Provide a default, non-undefined value matching AuthContextType
const defaultAuthContextValue: AuthContextType = {
  user: null,
  isLoading: true, // Start as loading
  isAuthInitialized: false,
  signup: async () => { throw new Error("AuthProvider not mounted"); },
  login: async () => { throw new Error("AuthProvider not mounted"); },
  logout: async () => { throw new Error("AuthProvider not mounted"); },
  resetPassword: async () => { throw new Error("AuthProvider not mounted"); },
  updateProfile: async () => { throw new Error("AuthProvider not mounted"); },
};

// Use the default value, context is never undefined
const AuthContext = createContext<AuthContextType>(defaultAuthContextValue);

const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<(User & { role: string | null }) | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthInitialized, setIsAuthInitialized] = useState(false);

  useEffect(() => {
    // Correct starting log message
    console.log('[Auth Context] Setting up auth listener...');
    let initialCheckDone = false; // Flag to ensure initialization logic runs only once

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log(`[Auth Context] Auth state change: ${event}, Session: ${session ? 'exists' : 'null'}`);
        // Keep loading true until we are certain about the user state
        // setIsLoading(true); // Potentially redundant if initial state is true

        let finalUser: (User & { role: string | null }) | null = null;
        let profileErrorOccurred = false;

        try {
          if (session?.user?.id) {
            const baseUser = {
              uid: session.user.id, // Use id directly
              email: session.user.email,
              role: null, // Initialize role as null
            };

            // Fetch profile
            try {
                const { data: profile, error } = await supabase
                  .from('profiles')
                  .select('role')
                  .eq('user_id', session.user.id)
                  .single();

                if (error && error.code !== 'PGRST116') {
                  console.error('[Auth Context] Error fetching user profile:', error);
                  profileErrorOccurred = true;
                  finalUser = baseUser; // Set user without role on error
                } else if (profile) {
                  console.log(`[Auth Context] User profile loaded. Role: ${profile.role}`);
                  finalUser = { ...baseUser, role: profile.role };
                } else {
                   console.warn('[Auth Context] User profile not found.');
                   finalUser = baseUser; // Set user without role if profile not found
                }
            } catch (profileError) {
               console.error('[Auth Context] Exception fetching profile:', profileError);
               profileErrorOccurred = true;
               finalUser = baseUser; // Set user without role on exception
            }
          } else {
            // No session or user ID
            finalUser = null;
          }

          // Set the user state AFTER determining the finalUser value
          console.log(`[Auth Context] About to setUser. finalUser object:`, JSON.stringify(finalUser));
          setUser(finalUser);

        } catch (error) {
           // Catch errors in the main try block (e.g., issues setting state)
           console.error('[Auth Context] Error processing auth state change:', error);
           console.log(`[Auth Context] Setting user to null due to error.`);
           setUser(null); // Reset user on error
           profileErrorOccurred = true; // Consider this an error state for loading purposes
        } finally {
           // Set loading false and initialized true AFTER user state is set or error occurred
           console.log('[Auth Context] Finalizing auth state update.');
           console.log(`[Auth Context] About to setIsLoading(false). Current isLoading: ${isLoading}`);
           setIsLoading(false);
           if (!isAuthInitialized) { // Only set initialized once
             console.log(`[Auth Context] About to setIsAuthInitialized(true). Current isAuthInitialized: ${isAuthInitialized}`);
             setIsAuthInitialized(true);
           }
        }
      }
    );

    // Cleanup listener on component unmount
    return () => {
      console.log('[Auth Context] Unsubscribing auth listener.');
      subscription?.unsubscribe();
    };
  }, []); // Changed dependency array from [isLoading] to []

  // Implementations for signup, login, logout, etc.
  const signup = async (email, password) => {
    console.log('Signup called (implementation needed)');
    // Example: const { error } = await supabase.auth.signUp({ email, password }); if (error) throw error;
  };

  const login = async (email, password) => {
    console.log('Login called');
    setIsLoading(true); // Set loading true on login attempt
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    // Don't manually set loading false here, let the listener handle it
    if (error) {
      console.error('[Auth Context] Login error:', error);
      setIsLoading(false); // Set loading false on error
      throw error;
    }
    console.log('[Auth Context] Login successful, waiting for listener...');
  };

  const logout = async () => {
    console.log('Logout called');
    setIsLoading(true); // Optional: show loading during logout
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('[Auth Context] Logout error:', error);
       // Still proceed with state cleanup even if Supabase fails
    }
    console.log('[Auth Context] Logout request sent, updating state...');
    // Manually update state after signOut completes or fails
    setUser(null);
    setIsLoading(false);
    // isAuthInitialized remains true
  };

  const resetPassword = async (email) => {
    console.log('Reset password called (implementation needed)');
    // Example: const { error } = await supabase.auth.resetPasswordForEmail(email); if (error) throw error;
  };

  const updateProfile = async (profile) => {
    console.log('Update profile called (implementation needed)');
    // Example: const { error } = await supabase.from('profiles').update(profile).eq('id', user?.id); if (error) throw error;
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthInitialized,
    signup,
    login,
    logout,
    resetPassword,
    updateProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// useAuth hook - no check needed as context has a default value
const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  return context;
};

export { AuthProvider, useAuth, AuthContextType }; 