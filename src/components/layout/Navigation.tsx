import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LogOut, ArrowUpRight, User, LogIn } from 'lucide-react';
import { useOnboarding } from './OnboardingProvider';

interface NavigationProps {
  isLoggedIn?: boolean;
}

const Navigation: React.FC<NavigationProps> = ({ isLoggedIn = false }) => {
  const navigate = useNavigate();
  const { resetOnboarding } = useOnboarding();
  
  // Start with a definitive authStatus value - either from props or false
  const [authStatus, setAuthStatus] = useState(isLoggedIn);
  
  // Use a second state variable to track if we've checked localStorage
  // This prevents any flash of incorrect UI
  const [hasCheckedStorage, setHasCheckedStorage] = useState(false);
  
  // Force immediate check of localStorage on client side
  useEffect(() => {
    const storedLoginStatus = localStorage.getItem('isLoggedIn') === 'true';
    const userData = JSON.parse(localStorage.getItem('userData') || '{}');
    setAuthStatus(storedLoginStatus);
    setHasCheckedStorage(true);
  }, []);
  
  const handleLogout = async () => {
    console.log('🚪 Logging out - clearing all user data...');
    
    // Clear all user-related localStorage items
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('userData');
    localStorage.removeItem('isBrandLoggedIn');
    localStorage.removeItem('isCreatorLoggedIn');
    localStorage.removeItem('currentBrandId');
    localStorage.removeItem('brandData');
    
    // Clear Supabase auth tokens
    localStorage.removeItem('sb-selhnopizirtuwrwwzac-auth-token');
    localStorage.removeItem('supabase.auth.token');
    
    try {
      // Also call the Supabase auth signOut method
      const { signOut } = await import('@/services/auth/authService');
      await signOut();
      console.log('✅ Supabase auth signed out successfully');
    } catch (error) {
      console.error('Error during Supabase sign out:', error);
      // Continue with logout process even if there's an error
    }
    
    setAuthStatus(false);
    
    // Redirect to home page
    navigate('/');
    console.log('✅ Logout complete, redirected to homepage');
  };

  const handleLogin = () => {
    // Open the login modal by dispatching a custom event
    document.dispatchEvent(new CustomEvent('openLogin'));
  };

  const handleJoin = () => {
    // Always redirect to the full onboarding page
    navigate('/onboarding');
  };

  const goToDashboard = () => {
    const userData = JSON.parse(localStorage.getItem('userData') || '{}');
    // Redirect based on stored user type from database
    switch(userData.type) {
      case 'admin':
        navigate('/admin');
        break;
      case 'brand':
        navigate('/brand/dashboard');
        break;
      default:
        navigate('/dashboard');
    }
  };
  
  // Only render once we've checked localStorage
  return (
    <div className="sticky top-0 z-50 bg-black bg-opacity-80 backdrop-blur-sm border-b">
      <div className="flex justify-between items-center p-4 max-w-7xl mx-auto">
        <motion.h1 
          className="text-2xl md:text-4xl font-bold cursor-pointer text-white"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          onClick={() => router.push('/')}
        >
          CREATE_OS
        </motion.h1>
        
        <div className="flex items-center gap-3">
          {authStatus && (
            <>
              {/* Improved dashboard button with better icon styling */}
              <motion.button
                onClick={goToDashboard}
                className="px-4 py-2 md:px-6 md:py-2.5 bg-gradient-to-r from-red-500 to-red-700 rounded-lg text-white font-bold flex items-center justify-center gap-3 shadow-lg"
                whileHover={{ scale: 1.05, boxShadow: "0 0 10px rgba(255,68,68,0.3)" }}
                whileTap={{ scale: 0.98 }}
              >
                <span className="hidden md:inline">Dashboard</span>
                <div className="flex items-center justify-center bg-white/20 rounded-full p-1">
                  <User className="h-4 w-4" />
                </div>
              </motion.button>
              
              {/* Desktop-only logout button */}
              <motion.button
                onClick={handleLogout}
                className="hidden md:flex px-3 py-1.5 md:px-4 md:py-2 border border-gray-600 hover:border-gray-400 rounded-lg text-white items-center gap-2"
                whileHover={{ backgroundColor: "rgba(255,255,255,0.05)" }}
                whileTap={{ scale: 0.98 }}
              >
                <span>Logout</span>
                <LogOut className="h-4 w-4" />
              </motion.button>
            </>
          )}
          
          {!authStatus && (
            <>
              {/* Mobile: Single Action Button */}
              <div className="md:hidden">
                <motion.button
                  onClick={handleJoin}
                  className="p-2 rounded-full bg-gradient-to-r from-red-500 to-red-700 flex items-center justify-center shadow-lg"
                  whileHover={{ scale: 1.05, boxShadow: "0 0 10px rgba(255,68,68,0.3)" }}
                  whileTap={{ scale: 0.98 }}
                  aria-label="Sign up or login"
                >
                  <User className="h-5 w-5" />
                </motion.button>
              </div>
              
              {/* Desktop: Separate Login & Join Buttons */}
              <div className="hidden md:flex items-center gap-3">
                {/* Login Button */}
                <motion.button
                  onClick={handleLogin}
                  className="px-4 py-2 border border-gray-600 hover:border-gray-400 rounded-lg text-white flex items-center gap-2"
                  whileHover={{ backgroundColor: "rgba(255,255,255,0.05)" }}
                  whileTap={{ scale: 0.98 }}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                >
                  <span>Login</span>
                  <LogIn className="h-4 w-4" />
                </motion.button>
                
                {/* Join as Creator Button */}
                <motion.button
                  onClick={handleJoin}
                  className="px-6 py-2 border-2 border-red-500 rounded-lg flex items-center gap-2 text-white"
                  whileHover={{ scale: 1.05, backgroundColor: "rgba(255,68,68,0.1)" }}
                  whileTap={{ scale: 0.95 }}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ type: "spring", stiffness: 300, damping: 30, delay: 0.1 }}
                >
                  <span>Join as Creator</span>
                  <ArrowUpRight className="h-4 w-4" />
                </motion.button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Navigation;