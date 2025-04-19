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
        // Step 1: Basic auth check
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
        
        if (authData.user.app_metadata && authData.user.app_metadata.role) {
          role = authData.user.app_metadata.role;
          roleSource = 'app_metadata';
        } else if (authData.user.user_metadata && authData.user.user_metadata.role) {
          role = authData.user.user_metadata.role;
          roleSource = 'user_metadata';
        } else {
          // Fallback to emails for demo accounts
          const userEmail = authData.user.email?.toLowerCase() || '';
          if (userEmail.includes('admin')) {
            role = 'admin';
          } else if (userEmail.includes('brand')) {
            role = 'brand';
          } else if (userEmail.includes('creator')) {
            role = 'creator';
          }
          roleSource = 'email inference';
        }
        
        if (!role) {
          console.error('Could not determine user role');
          throw new Error('User role not found');
        }
        
        console.log('Determined role:', role, '(from', roleSource, ')');
        
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
          localStorage.setItem('isLoggedIn', 'true');
          localStorage.setItem('userData', JSON.stringify({
            id: authData.user.id,
            email: authData.user.email,
            type: role
          }));
          
          // Navigate to appropriate dashboard based on role
          switch(role) {
            case 'admin':
              navigate('/admin');
              return;
            case 'brand':
              navigate('/brand/dashboard');
              return;
            case 'creator':
              navigate('/dashboard');
              return;
            default:
              throw new Error('Invalid user role');
          }
        }
        
        // Step 4: Database verification of role
        let isValidRole = false;
        let dbChecks = {};
        
        try {
          // First try users table as it has less restrictive policies
          console.log('Checking users table for ID:', authData.user.id);
          const { data: userData, error: userError } = await supabase
            .from('users')
            .select('*')
            .eq('id', authData.user.id)
            .single();
            
          dbChecks = {...dbChecks, userCheck: { data: userData, error: userError }};
          
          // If we found the user, verify role matches
          if (!userError && userData && userData.type === role) {
            console.log('Found matching user in users table with correct role');
            isValidRole = true;
          } else if (userError) {
            console.log('User table check error:', userError.message);
          } else if (userData && userData.type !== role) {
            console.log('Role mismatch - user table says:', userData.type, 'but auth says:', role);
          }
        } catch (err) {
          console.error('Error checking users table:', err);
          dbChecks = {...dbChecks, userCheckError: err};
        }
        
        // Only continue with specific table checks if user check didn't validate
        if (!isValidRole) {
          try {
            // Try specific role tables based on role
            switch(role) {
              case 'admin':
                console.log('Checking admin_users table');
                const { data: adminData, error: adminError } = await supabase
                  .from('admin_users')
                  .select('*')
                  .eq('id', authData.user.id)
                  .single();
                  
                dbChecks = {...dbChecks, adminCheck: { data: adminData, error: adminError }};
                isValidRole = !adminError && adminData;
                break;
                
              case 'brand':
                console.log('Checking brand_profiles table');
                const { data: brandData, error: brandError } = await supabase
                  .from('brand_profiles')
                  .select('*')
                  .eq('id', authData.user.id)
                  .single();
                  
                dbChecks = {...dbChecks, brandCheck: { data: brandData, error: brandError }};
                isValidRole = !brandError && brandData;
                break;
                
              case 'creator':
                console.log('Checking profiles table');
                const { data: creatorData, error: creatorError } = await supabase
                  .from('profiles')
                  .select('*')
                  .eq('id', authData.user.id)
                  .single();
                  
                dbChecks = {...dbChecks, creatorCheck: { data: creatorData, error: creatorError }};
                isValidRole = !creatorError && creatorData;
                break;
            }
          } catch (err) {
            console.error('Error in role-specific table check:', err);
            dbChecks = {...dbChecks, roleCheckError: err};
          }
        }
        
        setDebugInfo({...debugData, dbChecks});
        
        // Step 5: Handle validation result
        if (!isValidRole) {
          // If validation failed but we've come this far, the user is authenticated
          // but doesn't have correct database records. We could create them here.
          console.warn('User is authenticated but not found in database');
          
          // For demo purposes, allow login anyway
          if (email.includes('test') || email.includes('demo')) {
            console.log('Demo user detected, bypassing database validation');
            
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
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('userData', JSON.stringify({
          id: authData.user.id,
          email: authData.user.email,
          type: role
        }));

        // Navigate to appropriate dashboard based on role
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