import { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabaseClient';
import { completeNewBrandSetup } from '@/services/auth/authService';

// Add this function to ensure brand accounts are properly set up
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

// Create the auth context
const AuthContext = createContext<{
  session: Session | null;
  user: User | null;
  loading: boolean;
}>({
  session: null,
  user: null,
  loading: true,
});

// Auth provider component
export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // Fetch the current session
    const fetchSession = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) {
          console.error('Error fetching session:', error);
        } else {
          setSession(data.session);
          if (data.session?.user) {
            setUser(data.session.user);
            
            // Ensure brand account is fully set up when a user signs in
            await ensureBrandAccountSetup(data.session.user);
          }
        }
      } catch (err) {
        console.error('Exception in fetchSession:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchSession();

    // Subscribe to auth state changes
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        console.log('Auth state change:', event);
        setSession(newSession);
        
        if (newSession?.user) {
          setUser(newSession.user);
          
          if (event === 'SIGNED_IN') {
            // Ensure brand account is fully set up when a user signs in
            await ensureBrandAccountSetup(newSession.user);
          }
        } else {
          setUser(null);
        }
        
        setLoading(false);
      }
    );

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ session, user, loading }}>
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