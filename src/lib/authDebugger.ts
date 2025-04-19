import { supabase } from './supabaseClient';

/**
 * Debug utility for Supabase auth issues
 * This can be used by calling authDebugger.checkAuth() in the browser console
 */
export const authDebugger = {
  /**
   * Checks the current auth state and provides detailed logging
   */
  async checkAuth() {
    console.group('🔍 Supabase Auth Debugger');
    
    try {
      console.log('Checking authentication state...');
      
      // Check session
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) {
        console.error('❌ Session error:', sessionError);
      }
      
      console.log('Session found:', !!sessionData.session);
      
      if (sessionData.session) {
        console.log('Session expires at:', new Date(sessionData.session.expires_at! * 1000).toLocaleString());
        const nowSeconds = Math.floor(Date.now() / 1000);
        const expiresInSeconds = sessionData.session.expires_at! - nowSeconds;
        console.log('Session expires in:', Math.floor(expiresInSeconds / 60), 'minutes');
        
        if (sessionData.session.user) {
          console.log('User from session:', {
            id: sessionData.session.user.id,
            email: sessionData.session.user.email,
            email_confirmed_at: sessionData.session.user.email_confirmed_at,
            role: sessionData.session.user.role,
            app_metadata: sessionData.session.user.app_metadata,
            user_metadata: sessionData.session.user.user_metadata
          });
        }
      }
      
      // Check user
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError) {
        console.error('❌ User error:', userError);
      }
      
      console.log('User found:', !!userData.user);
      
      if (userData.user) {
        console.log('User details:', {
          id: userData.user.id,
          email: userData.user.email,
          email_confirmed_at: userData.user.email_confirmed_at,
          created_at: userData.user.created_at,
          app_metadata: userData.user.app_metadata,
          user_metadata: userData.user.user_metadata
        });
      }
      
      // Check localStorage
      console.log('Checking localStorage...');
      
      try {
        const keys = Object.keys(localStorage);
        const authKeys = keys.filter(k => k.includes('auth') || k.includes('supabase'));
        console.log('Auth-related localStorage keys:', authKeys);
        
        authKeys.forEach(key => {
          try {
            const value = localStorage.getItem(key);
            if (value) {
              try {
                const parsed = JSON.parse(value);
                console.log(`${key}:`, parsed);
              } catch {
                console.log(`${key} (raw):`, value);
              }
            } else {
              console.log(`${key}: <empty>`);
            }
          } catch (e) {
            console.error(`Error reading ${key}:`, e);
          }
        });
        
        // Check specific userData
        const userDataStr = localStorage.getItem('userData');
        if (userDataStr) {
          try {
            const userData = JSON.parse(userDataStr);
            console.log('userData in localStorage:', userData);
          } catch (e) {
            console.error('Error parsing userData:', e);
          }
        } else {
          console.log('No userData in localStorage');
        }
      } catch (e) {
        console.error('Error accessing localStorage:', e);
      }
      
      // Try a refresh
      console.log('Attempting session refresh...');
      const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
      
      if (refreshError) {
        console.error('❌ Refresh error:', refreshError);
      } else {
        console.log('Refresh result:', refreshData.session ? 'Session refreshed' : 'No session after refresh');
      }
      
    } catch (e) {
      console.error('❌ Unhandled error during auth check:', e);
    }
    
    console.groupEnd();
  },
  
  /**
   * Attempts to recover a session using token from URL
   */
  async recoverFromUrl() {
    console.group('🔄 Session Recovery Attempt');
    
    try {
      // Get URL parameters
      const urlParams = new URLSearchParams(window.location.search);
      const hash = window.location.hash;
      const hashParams = hash ? new URLSearchParams(hash.substring(1)) : null;
      
      console.log('URL Parameters:', Object.fromEntries(urlParams.entries()));
      if (hashParams) {
        console.log('Hash Parameters:', Object.fromEntries(hashParams.entries()));
      }
      
      // Look for auth-related parameters
      const type = urlParams.get('type');
      const email = urlParams.get('email');
      const token = urlParams.get('token') || urlParams.get('confirmation_token');
      const hashToken = hashParams ? hashParams.get('access_token') : null;
      
      if (email && type) {
        console.log(`Found email (${email}) and type (${type}) in URL`);
        
        if (token) {
          console.log('Found token in URL, attempting verification...');
          
          const { data, error } = await supabase.auth.verifyOtp({
            email,
            token,
            type: type as any
          });
          
          if (error) {
            console.error('❌ Verification error:', error);
          } else {
            console.log('✅ Verification successful:', data);
          }
        } else {
          console.log('No token found in URL params');
        }
      } else if (hashToken) {
        console.log('Found access_token in hash, this should be automatically processed by Supabase');
      } else {
        console.log('No auth-related parameters found in URL');
      }
      
      // Check session after recovery attempt
      const { data: sessionData } = await supabase.auth.getSession();
      console.log('Session after recovery attempt:', sessionData.session ? 'Found' : 'Not found');
      
    } catch (e) {
      console.error('❌ Error during recovery attempt:', e);
    }
    
    console.groupEnd();
  },
  
  /**
   * Manually sends a verification email
   */
  async sendVerificationEmail(email: string) {
    console.group('📧 Sending verification email');
    
    try {
      console.log(`Sending to: ${email}`);
      
      const siteUrl = import.meta.env.VITE_SITE_URL || window.location.origin;
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${siteUrl}/verify`,
          shouldCreateUser: false
        }
      });
      
      if (error) {
        console.error('❌ Error sending verification email:', error);
      } else {
        console.log('✅ Verification email sent successfully');
      }
    } catch (e) {
      console.error('❌ Unhandled error sending verification email:', e);
    }
    
    console.groupEnd();
  },
  
  /**
   * Clears any active session and auth-related data
   */
  async clearAuth() {
    console.group('🧹 Clearing auth state');
    
    try {
      // Sign out
      await supabase.auth.signOut({ scope: 'global' });
      
      // Clear localStorage
      const keys = Object.keys(localStorage);
      const authKeys = keys.filter(k => 
        k.includes('auth') || 
        k.includes('supabase') || 
        k === 'userData'
      );
      
      console.log('Clearing keys:', authKeys);
      
      authKeys.forEach(key => {
        try {
          localStorage.removeItem(key);
          console.log(`Removed ${key}`);
        } catch (e) {
          console.error(`Error removing ${key}:`, e);
        }
      });
      
      console.log('✅ Auth state cleared');
    } catch (e) {
      console.error('❌ Error clearing auth state:', e);
    }
    
    console.groupEnd();
  },
  
  /**
   * Attempts to recover a broken session
   */
  async recoverSession() {
    console.group('🚑 Attempting to recover broken session');
    
    try {
      // Check current session first
      const { data: sessionData } = await supabase.auth.getSession();
      console.log('Current session:', sessionData.session ? 'Exists' : 'Missing');
      
      if (sessionData.session) {
        console.log('Session exists, attempting refresh...');
        const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
        
        if (refreshError) {
          console.error('Error refreshing session:', refreshError);
        } else if (refreshData.session) {
          console.log('✅ Session refreshed successfully!');
          // Force reload the page
          setTimeout(() => {
            window.location.reload();
          }, 500);
          return;
        }
      }
      
      // If we get here, no session or refresh failed
      console.log('Checking localStorage for recovery data...');
      
      // Look for token in localStorage
      let foundToken = false;
      try {
        const keys = Object.keys(localStorage);
        const authKeys = keys.filter(k => 
          k.includes('auth') || 
          k.includes('supabase') || 
          k.includes('sb-')
        );
        
        for (const key of authKeys) {
          const value = localStorage.getItem(key);
          if (!value) continue;
          
          try {
            const parsed = JSON.parse(value);
            if (parsed.access_token || parsed.refresh_token) {
              console.log(`Found token in ${key}, attempting to restore session...`);
              foundToken = true;
              
              if (parsed.access_token && parsed.refresh_token) {
                const { data, error } = await supabase.auth.setSession({
                  access_token: parsed.access_token,
                  refresh_token: parsed.refresh_token
                });
                
                if (error) {
                  console.error('Failed to restore session:', error);
                } else if (data.session) {
                  console.log('✅ Session restored successfully!');
                  // Force reload the page
                  setTimeout(() => {
                    window.location.reload();
                  }, 500);
                  return;
                }
              }
            }
          } catch (e) {
            // Not JSON or doesn't have tokens, skip
          }
        }
      } catch (e) {
        console.error('Error accessing localStorage:', e);
      }
      
      if (!foundToken) {
        console.log('No valid tokens found in localStorage');
      }
      
      console.log('Recovery attempts exhausted. User may need to log in again.');
      
    } catch (e) {
      console.error('Error during session recovery:', e);
    }
    
    console.groupEnd();
  }
};

// Make it accessible in the global scope for debugging
if (typeof window !== 'undefined') {
  (window as any).authDebugger = authDebugger;
}

export default authDebugger; 