'use client';

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import BackgroundPattern from '@/components/BackgroundPattern';
import { useAuth } from '@/hooks/useAuthContext';
import { supabase } from '@/lib/supabaseClient';
import { getUserProfileByUserId } from '@/services/creator/creatorService';
import { 
  ArrowRight, 
  Mail, 
  Phone, 
  Shield, 
  Check, 
  AlertCircle,
  Loader2,
  Lock,
  Info,
  RefreshCw
} from 'lucide-react';

const VerificationPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, userRole, refreshUserData, isEmailVerified } = useAuth();
  
  // State
  const [loading, setLoading] = useState(true);
  const [processingToken, setProcessingToken] = useState(false);
  const [checkingVerification, setCheckingVerification] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailSendSuccess, setEmailSendSuccess] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [verificationState, setVerificationState] = useState({
    email: '',
    isVerified: false,
    step: 'email-sent', // 'email-sent' | 'success'
  });
  
  // Debug logging
  useEffect(() => {
    console.log('📋 VERIFICATION PAGE LOADED 📋');
    console.log('🔗 URL:', window.location.href);
    console.log('🔑 URL Params:', new URLSearchParams(window.location.search).toString());
    console.log('👤 User:', user?.id || 'No user');
    console.log('✅ Email verified:', isEmailVerified ? 'Yes' : 'No');
    
    try {
      const userDataStr = localStorage.getItem('userData');
      if (userDataStr) {
        console.log('💾 userData in localStorage:', JSON.parse(userDataStr));
      } else {
        console.log('💾 No userData in localStorage');
      }
    } catch (err) {
      console.error('❌ Error reading localStorage:', err);
    }
  }, []);
  
  // Get email from localStorage just for UI display
  useEffect(() => {
    try {
      const userDataStr = localStorage.getItem('userData');
      if (userDataStr) {
        const userData = JSON.parse(userDataStr);
        if (userData.email) {
          console.log('📝 Using email from localStorage for UI:', userData.email);
          setVerificationState(prev => ({
            ...prev,
            email: userData.email
          }));
        }
      }
    } catch (err) {
      console.error('❌ Error reading userData from localStorage:', err);
    }
  }, []);
  
  // Process the verification token when the page loads
  useEffect(() => {
    const processVerification = async () => {
      console.log('Verification page loaded, checking URL parameters');
      
      try {
        // Get parameters from URL
        const url = new URL(window.location.href);
        const type = url.searchParams.get('type');
        const token = url.searchParams.get('token') || url.searchParams.get('confirmation_token');
        const urlEmail = url.searchParams.get('email');
        
        console.log('URL parameters:', { type, token: token ? 'present' : 'absent', email: urlEmail });
        
        // Load email from localStorage if available
        let storedEmail = '';
        try {
          const userDataStr = localStorage.getItem('userData');
          if (userDataStr) {
            const userData = JSON.parse(userDataStr);
            if (userData.email) {
              storedEmail = userData.email;
              setVerificationState(prev => ({
                ...prev,
                email: userData.email
              }));
            }
          }
        } catch (err) {
          console.error('Error reading email from localStorage:', err);
        }
        
        // Use email from URL or localStorage
        const emailToUse = urlEmail || storedEmail || '';
        if (emailToUse) {
          setVerificationState(prev => ({
            ...prev,
            email: emailToUse
          }));
        }
        
        // Check for verification token
        if (token && type === 'signup' && emailToUse) {
          setProcessingToken(true);
          
          console.log('Attempting to verify email with token');
          
          try {
            // Try direct verification
            const { error } = await supabase.auth.verifyOtp({
              email: emailToUse,
              token,
              type: 'signup'
            });
            
            if (error) {
              console.error('Error verifying email:', error);
              setError(error.message || 'Verification failed. Please try again or request a new verification email.');
            } else {
              console.log('Email verified successfully');
              setVerificationState(prev => ({
                ...prev,
                isVerified: true,
                step: 'success'
              }));
              
              // Update localStorage
              try {
                const userDataStr = localStorage.getItem('userData');
                if (userDataStr) {
                  const userData = JSON.parse(userDataStr);
                  userData.emailVerified = true;
                  localStorage.setItem('userData', JSON.stringify(userData));
                }
                localStorage.setItem('emailVerified', 'true');
              } catch (err) {
                console.error('Error updating localStorage:', err);
              }
              
              // Redirect to dashboard after a delay
              setTimeout(() => {
                navigateToDashboard();
              }, 2000);
            }
          } catch (err) {
            console.error('Exception during verification:', err);
            setError('An unexpected error occurred during verification. Please try again.');
          } finally {
            setProcessingToken(false);
          }
        } else {
          // Check if user is already verified
          const { data } = await supabase.auth.getSession();
          if (data.session?.user?.email_confirmed_at) {
            console.log('User already verified');
            setVerificationState(prev => ({
              ...prev,
              isVerified: true,
              step: 'success'
            }));
            setTimeout(() => {
              navigateToDashboard();
            }, 1500);
          }
        }
      } catch (err) {
        console.error('Error processing verification:', err);
        setError('Failed to process verification. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    processVerification();
    
    // Clean up URL parameters after processing
    return () => {
      try {
        const url = new URL(window.location.href);
        if (url.searchParams.has('token') || url.searchParams.has('type') || url.searchParams.has('confirmation_token')) {
          const cleanUrl = window.location.pathname;
          window.history.replaceState(null, '', cleanUrl);
        }
      } catch (err) {
        console.error('Error cleaning URL:', err);
      }
    };
  }, [navigate]);
  
  // Function to manually check verification status
  const checkVerificationStatus = async () => {
    setCheckingVerification(true);
    setError(null);
    
    try {
      // Force refresh session to get latest state
      await supabase.auth.refreshSession();
      
      // Check if email is verified
      const { data } = await supabase.auth.getUser();
      if (data.user?.email_confirmed_at) {
        console.log('Email verified');
        setVerificationState(prev => ({
          ...prev,
          isVerified: true,
          step: 'success'
        }));
        
        // Update localStorage
        try {
          const userDataStr = localStorage.getItem('userData');
          if (userDataStr) {
            const userData = JSON.parse(userDataStr);
            userData.emailVerified = true;
            localStorage.setItem('userData', JSON.stringify(userData));
          }
          localStorage.setItem('emailVerified', 'true');
        } catch (err) {
          console.error('Error updating localStorage:', err);
        }
        
        // Redirect to dashboard
        setTimeout(() => {
          navigateToDashboard();
        }, 1500);
      } else {
        console.log('Email not verified');
        setError('Your email is not verified yet. Please check your inbox and click the verification link.');
      }
    } catch (err) {
      console.error('Error checking verification status:', err);
      setError('Failed to check verification status. Please try again.');
    } finally {
      setCheckingVerification(false);
    }
  };
  
  // Function to resend verification email
  const resendVerificationEmail = async () => {
    if (resendTimer > 0) {
      return; // Still in cooldown
    }
    
    setError(null);
    
    // Get email from state or localStorage
    const emailToUse = verificationState.email || '';
    if (!emailToUse) {
      setError('No email address found. Please return to login and try again.');
      return;
    }
    
    try {
      console.log('Resending verification email to:', emailToUse);
      
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: emailToUse,
        options: {
          emailRedirectTo: `${window.location.origin}/verify`
        }
      });
      
      if (error) {
        console.error('Error resending verification email:', error);
        setError(error.message || 'Failed to send verification email. Please try again later.');
      } else {
        setError('A new verification email has been sent. Please check your inbox and spam folder.');
        
        // Start cooldown timer
        setResendTimer(60);
        const interval = setInterval(() => {
          setResendTimer(prev => {
            if (prev <= 1) {
              clearInterval(interval);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      }
    } catch (err) {
      console.error('Exception resending verification email:', err);
      setError('An unexpected error occurred. Please try again later.');
    }
  };
  
  // Navigate to appropriate dashboard
  const navigateToDashboard = () => {
    console.log('🧭 Navigating to dashboard after verification');
    
    // Check for role in Supabase
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user) {
        // Get metadata from all possible places
        const appRole = data.user.app_metadata?.role;
        const userRole = data.user.user_metadata?.role;
        const userType = data.user.user_metadata?.type;
        const metadataRole = data.user.user_metadata?.userrole;
        
        // Log all available role data for debugging
        console.log('🔍 Dashboard navigation - user data:', {
          appRole, 
          userRole, 
          userType,
          metadataRole,
          id: data.user.id,
          email: data.user.email
        });
        
        // Normalize role to lowercase for comparison and check all variations
        const normalizedRole = (appRole || userRole || userType || metadataRole || '').toLowerCase();
        
        console.log('👤 Determined normalized role:', normalizedRole);
        
        if (normalizedRole === 'brand') {
          console.log('🏢 Brand user detected, navigating to brand dashboard');
          navigate('/brand/dashboard');
        } else if (normalizedRole === 'creator' || normalizedRole.includes('creator')) {
          console.log('👩‍🎨 Creator user detected, navigating to creator dashboard');
          navigate('/dashboard');
        } else {
          // Check context first if available
          if (userRole) {
            console.log('🔄 Using userRole from context:', userRole);
            if (userRole === UserRole.BRAND) {
              navigate('/brand/dashboard');
              return;
            } else if (userRole === UserRole.CREATOR) {
              navigate('/dashboard');
              return;
            }
          }
          
          // Default fallback for unknown roles
          console.log('⚠️ No specific role found, using fallback dashboard');
          navigate('/dashboard');
        }
      } else {
        // Fallback to localStorage
        try {
          // Try to get user type from localStorage
          const userDataStr = localStorage.getItem('userData');
          let userType = '';
          
          if (userDataStr) {
            const userData = JSON.parse(userDataStr);
            userType = userData.type || userData.role || '';
            console.log('💾 Using localStorage user data:', userData);
          }
          
          // Check brand login status
          const isBrandLoggedIn = localStorage.getItem('isBrandLoggedIn') === 'true';
          
          if (isBrandLoggedIn || userType === 'brand') {
            console.log('🏢 Navigating to brand dashboard (localStorage)');
            navigate('/brand/dashboard');
          } else {
            console.log('👩‍🎨 Navigating to creator dashboard (localStorage fallback)');
            navigate('/dashboard');
          }
        } catch (err) {
          console.error('❌ Error reading localStorage:', err);
          navigate('/dashboard');
        }
      }
    }).catch((error) => {
      // Log error and fallback if auth fails
      console.error('❌ Error determining dashboard:', error);
      navigate('/dashboard');
    });
  };
  
  // Render loading state
  const renderLoading = () => (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-500 mb-4"></div>
      <p className="text-gray-400">Loading verification status...</p>
    </div>
  );

  // Render verified state
  const renderSuccessStep = () => (
    <motion.div
      key="success"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="max-w-md w-full mx-auto p-8 bg-black/40 border border-gray-800 rounded-xl shadow-lg"
    >
      <div className="space-y-6">
        <div className="flex justify-center mb-6">
          <div className="bg-green-900/20 rounded-full p-6">
            <Check className="h-12 w-12 text-green-500" />
          </div>
        </div>
        
        <h1 className="text-3xl font-bold mb-2 text-center text-white">Verification Complete</h1>
        <p className="text-gray-400 mb-6 text-center">
          Your email has been successfully verified.
          <span className="block mt-2 font-semibold text-green-400">
            Redirecting you to the dashboard...
          </span>
        </p>
        
        <div className="p-4 bg-black/40 border border-gray-800 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-white">
              <Mail className="h-5 w-5 text-gray-400" />
              <span>{verificationState.email}</span>
            </div>
            <div className="flex items-center text-green-500">
              <Check className="h-4 w-4 mr-1" />
              <span className="text-sm">Verified</span>
            </div>
          </div>
        </div>
        
        <button
          onClick={navigateToDashboard}
          className="w-full p-3 flex items-center justify-center gap-2 rounded-lg font-medium bg-gradient-to-r from-green-600 to-green-700 text-white hover:from-green-700 hover:to-green-800"
        >
          Continue to Dashboard
          <ArrowRight className="h-5 w-5" />
        </button>
      </div>
    </motion.div>
  );

  // Render the appropriate content based on state
  const renderContent = () => {
    if (loading || processingToken) {
      return renderLoading();
    }
    
    if (verificationState.isVerified) {
      return renderSuccessStep();
    }
    
    return (
      <motion.div
        key="email-sent"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="max-w-md w-full mx-auto p-8 bg-black/40 border border-gray-800 rounded-xl shadow-lg"
      >
        <div className="text-center mb-8">
          <div className="bg-red-600/20 p-4 rounded-full inline-flex mb-4">
            <Mail className="h-10 w-10 text-red-500" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Verify Your Email</h1>
          <p className="text-gray-400">
            {verificationState.email ? `We've sent a verification email to:` : 'Check your email for a verification link'}
          </p>
          {verificationState.email && <p className="text-white font-semibold mt-2 text-lg">{verificationState.email}</p>}
        </div>
        
        {error && (
          <div className="mb-6 p-4 bg-red-900/30 border border-red-800 rounded-lg text-red-200 flex items-start">
            <AlertCircle className="h-5 w-5 text-red-400 mr-2 mt-0.5 flex-shrink-0" />
            <p>{error}</p>
          </div>
        )}
        
        <div className="bg-black/30 p-6 rounded-lg border border-gray-800 mb-6">
          <h3 className="text-lg font-semibold text-white mb-4">Important:</h3>
          <ul className="text-gray-300 space-y-3">
            <li className="flex items-start">
              <Check className="h-5 w-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
              <span>Check both your inbox and spam/junk folders</span>
            </li>
            <li className="flex items-start">
              <Check className="h-5 w-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
              <span>Click the verification link in the email</span>
            </li>
            <li className="flex items-start">
              <Check className="h-5 w-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
              <span>Return to this page after clicking the link</span>
            </li>
          </ul>
        </div>
        
        <button 
          onClick={checkVerificationStatus}
          disabled={checkingVerification}
          className="w-full py-3 px-4 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors flex items-center justify-center"
        >
          {checkingVerification ? (
            <>
              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              Checking verification status...
            </>
          ) : (
            <>
              <RefreshCw className="h-5 w-5 mr-2" />
              I've clicked the verification link
            </>
          )}
        </button>
        
        <div className="mt-6">
          <p className="text-sm text-gray-400 text-center mb-4">
            Didn't receive the verification email?
          </p>
          
          {resendTimer > 0 ? (
            <p className="text-sm text-center text-gray-500">
              You can request another verification email in {resendTimer} seconds
            </p>
          ) : (
            <button
              onClick={resendVerificationEmail}
              className="w-full py-2 bg-transparent hover:bg-gray-800 text-gray-300 border border-gray-700 rounded-md transition-colors"
            >
              Send New Verification Email
            </button>
          )}
        </div>
        
        <div className="mt-8 text-center">
          <button 
            onClick={() => navigate('/login')}
            className="text-sm text-red-400 hover:text-red-300"
          >
            Back to Login
          </button>
        </div>
      </motion.div>
    );
  };
  
  return (
    <div className="min-h-screen bg-black flex flex-col justify-center relative py-12">
      <BackgroundPattern />
      
      <div className="px-4 relative">
        <AnimatePresence mode="wait">
          {renderContent()}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default VerificationPage; 