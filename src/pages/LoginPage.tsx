import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { signInWithEmail } from '@/services/auth/authService';
import BackgroundPattern from '@/components/BackgroundPattern';
import { UserRole } from '@/types/auth';
import { supabase } from '@/lib/supabaseClient';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userType, setUserType] = useState<'creator' | 'brand'>('creator');
  
  const navigate = useNavigate();
  
  useEffect(() => {
    // Only redirect if the user is already logged in
    const checkAuth = async () => {
      const { data } = await supabase.auth.getSession();
      
      if (data.session) {
        // User is already logged in, redirect to appropriate dashboard
        const userMetadata = data.session.user.user_metadata;
        if (userMetadata?.type === UserRole.BRAND) {
          navigate('/brand/dashboard');
        } else {
          navigate('/dashboard');
        }
      }
      // No automatic redirection if there's no session
    };
    
    checkAuth();
  }, [navigate]);
  
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    
    try {
      const result = await signInWithEmail(email, password);
      
      if (result.user) {
        // Check if the user has verified their email
        if (!result.user.email_confirmed_at && (result.user.app_metadata?.role === UserRole.BRAND || result.user.user_metadata?.role === UserRole.BRAND)) {
          // Store email for verification process
          localStorage.setItem('userData', JSON.stringify({
            id: result.user.id,
            email: result.user.email,
            type: 'brand',
            emailVerified: false
          }));
          
          // Redirect to verification page
          navigate('/verify');
          return;
        } else if (!result.user.email_confirmed_at) {
          // Store email for verification process
          localStorage.setItem('userData', JSON.stringify({
            id: result.user.id,
            email: result.user.email,
            type: 'creator',
            emailVerified: false
          }));
          
          // Redirect to verification page
          navigate('/verify');
          return;
        } else {
          // Email is verified, store that in userData
          localStorage.setItem('userData', JSON.stringify({
            id: result.user.id,
            email: result.user.email,
            type: result.user.user_metadata?.type || 'creator',
            emailVerified: true
          }));
        }
        
        // Set appropriate localStorage values for backward compatibility
        if (result.user.user_metadata?.type === UserRole.BRAND) {
          localStorage.setItem('isBrandLoggedIn', 'true');
          navigate('/brand/dashboard');
        } else {
          localStorage.setItem('isLoggedIn', 'true');
          navigate('/dashboard');
        }
      }
    } catch (error: any) {
      console.error('Error logging in:', error);
      
      // Check for email verification errors specifically
      if (error.message.includes('Email not confirmed') || error.message.includes('email confirmation')) {
        // Store email for verification process
        localStorage.setItem('userData', JSON.stringify({
          email: email,
          type: userType,
          emailVerified: false
        }));
        
        // Redirect to verification page with a notice
        navigate('/verify');
        return;
      }
      
      setError(error.message || 'Failed to login. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleSocialLogin = async (provider: 'google' | 'facebook' | 'twitter') => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: window.location.origin + '/auth/callback',
          queryParams: {
            user_type: userType,
          },
        },
      });
      
      if (error) throw error;
      
      // The user will be redirected to the OAuth provider
    } catch (error: any) {
      console.error(`Error logging in with ${provider}:`, error);
      setError(error.message || `Failed to login with ${provider}`);
    }
  };
  
  return (
    <div className="min-h-screen bg-black flex flex-col justify-center relative">
      <BackgroundPattern />
      
      <div className="max-w-md w-full mx-auto p-8 bg-black/40 border border-gray-800 rounded-xl shadow-lg relative z-10">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white">CREATE_OS</h1>
          <p className="text-gray-400 mt-2">Sign in to your account</p>
        </div>
        
        <div className="mb-6">
          <div className="w-full flex rounded-md overflow-hidden border border-gray-800">
            <button
              className={`flex-1 py-3 ${userType === 'creator' ? 'bg-red-600 text-white' : 'bg-black/60 text-gray-300'}`}
              onClick={() => setUserType('creator')}
            >
              Creator
            </button>
            <button
              className={`flex-1 py-3 ${userType === 'brand' ? 'bg-red-600 text-white' : 'bg-black/60 text-gray-300'}`}
              onClick={() => setUserType('brand')}
            >
              Brand
            </button>
          </div>
        </div>
        
        {error && (
          <div className="mb-4 p-3 bg-red-900/20 border border-red-800 rounded-md text-red-400 text-sm">
            {error}
          </div>
        )}
        
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 bg-black/60 border border-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
              placeholder="you@example.com"
              required
            />
          </div>
          
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-1">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 bg-black/60 border border-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
              placeholder="••••••••"
              required
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-4 w-4 text-red-500 focus:ring-red-500 bg-black/60 border-gray-700 rounded"
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-300">
                Remember me
              </label>
            </div>
            
            <div className="text-sm">
              <a href="#" className="text-red-400 hover:text-red-300">
                Forgot password?
              </a>
            </div>
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors disabled:opacity-50"
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
        
        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-800"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-black text-gray-400">Or continue with</span>
            </div>
          </div>
          
          <div className="mt-6 grid grid-cols-3 gap-3">
            <button
              onClick={() => handleSocialLogin('google')}
              className="w-full py-2 px-4 border border-gray-700 rounded-md shadow-sm bg-black/40 text-sm font-medium text-gray-300 hover:bg-black/60 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              <span className="sr-only">Sign in with Google</span>
              <svg className="h-5 w-5 mx-auto" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z" />
              </svg>
            </button>
            
            <button
              onClick={() => handleSocialLogin('facebook')}
              className="w-full py-2 px-4 border border-gray-700 rounded-md shadow-sm bg-black/40 text-sm font-medium text-gray-300 hover:bg-black/60 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              <span className="sr-only">Sign in with Facebook</span>
              <svg className="h-5 w-5 mx-auto" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
              </svg>
            </button>
            
            <button
              onClick={() => handleSocialLogin('twitter')}
              className="w-full py-2 px-4 border border-gray-700 rounded-md shadow-sm bg-black/40 text-sm font-medium text-gray-300 hover:bg-black/60 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              <span className="sr-only">Sign in with Twitter</span>
              <svg className="h-5 w-5 mx-auto" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
              </svg>
            </button>
          </div>
        </div>
        
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-400">
            Don't have an account?{' '}
            <Link 
              to={userType === 'creator' ? '/onboarding' : '/brand-onboarding'} 
              className="text-red-400 hover:text-red-300 font-medium"
            >
              Sign up now
            </Link>
          </p>
        </div>

        <div className="mt-4 text-center">
          <Link to="/" className="text-sm text-red-400 hover:text-red-300">
            Back to home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LoginPage; 