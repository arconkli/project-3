import { createBrowserClient } from '@supabase/ssr'; // Use ssr browser client
import { Database } from '@/types/database.types'; // Assuming this type is used or needed

// Get environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase credentials not found. Please check your environment variables.');
}

// Get project ID from env var or try to extract (for storage key)
const extractProjectId = (url: string) => {
  try {
    const urlObj = new URL(url);
    const subdomain = urlObj.hostname.split('.')[0];
    // Basic check to avoid using 'supabase' or other common parts if extraction fails
    return (subdomain && !['supabase', 'db'].includes(subdomain)) ? subdomain : 'default-project';
  } catch (e) {
    console.warn('Failed to extract project ID from URL for storage key:', e);
    return 'default-project';
  }
};
const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID || extractProjectId(supabaseUrl);
console.log('[Supabase Client] Using project ID for storage key:', projectId);


// Create a Supabase client using createBrowserClient
// Note: The extensive options like poolConfig, debug, postgresql.pool are generally
// not applicable or configurable in the same way with createBrowserClient.
// We will stick to the standard browser client configuration.
export const supabase = createBrowserClient(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
        // These options are often handled by ssr package defaults,
        // but explicitly setting persistSession and storageKey is fine.
      autoRefreshToken: true,
      persistSession: true,
      storageKey: `sb-${projectId}-auth-token`, // Use extracted/provided project ID
      detectSessionInUrl: true, // Default is true, but explicit is okay
      // storage: localStorage, // createBrowserClient uses localStorage by default
    },
    global: {
      headers: {
        'x-client-info': 'supabase-ssr-browser', // Identify client type
        'x-application-name': 'admin-dashboard'
      }
    }
    // db schema defaults to 'public'
  }
);

// Initial session check and listener are primarily handled by AuthProvider now.
// Keep the listener for debugging if needed, but remove the explicit initial check/refresh.
console.log('[Supabase Client] Initializing auth listener...');
supabase.auth.onAuthStateChange((event, session) => {
  console.log(`[Auth Client] Event: ${event}`, session ? `User: ${session.user?.id}` : 'No session');

  // Clean up debug flags if necessary
  if (event === 'SIGNED_OUT') {
    try {
      localStorage.removeItem('lastAuthEvent');
      localStorage.removeItem('lastAuthTime');
      // Consider if localStorage.clear() is too aggressive
      // localStorage.clear();
      // sessionStorage.clear();
      console.log('[Auth Client] Cleared auth debug flags on SIGNED_OUT');
    } catch (e) {
      console.error('[Auth Client] Error clearing debug flags:', e);
    }
  }

  if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
    try {
      localStorage.setItem('lastAuthEvent', event);
      localStorage.setItem('lastAuthTime', new Date().toISOString());
    } catch (e) {
      console.error('[Auth Client] Error setting debug flags:', e);
    }
  }

  // Email verification reload logic can stay if needed, though ideally handled elsewhere
  if (event === 'USER_UPDATED' && session?.user?.email_confirmed_at) {
     const emailVerifiedFlag = localStorage.getItem('emailVerified');
     if (emailVerifiedFlag !== 'true') { // Only reload if not already marked
        console.log('[Auth Client] Email verified:', session.user.email);
        try {
          localStorage.setItem('emailVerified', 'true');
          console.log('[Auth Client] Reloading page for email verification...');
          setTimeout(() => {
            window.location.reload();
          }, 500); // Short delay
        } catch (e) {
          console.error('[Auth Client] Error updating localStorage after verification:', e);
        }
     }
  }
});

console.log('[Supabase Client] Browser client created.');

// Helper function to handle errors consistently (moved from supabase.ts)
export function handleError(error: unknown): Error {
  console.error('Database operation failed:', error);
  if (error instanceof Error) {
    return error;
  }
  // Ensure we always return an Error object
  if (typeof error === 'string') {
    return new Error(error);
  } 
  // Handle Supabase specific errors if possible
  if (error && typeof error === 'object' && 'message' in error) {
     return new Error(String(error.message));
  }
  // Fallback for truly unknown types
  return new Error('An unknown database error occurred');
}

// // --- Removed initial getSession/refreshSession block ---
// // This logic is now centralized in AuthProvider

