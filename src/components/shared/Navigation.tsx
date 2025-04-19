import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, User, LogIn } from 'lucide-react';
import { useAuth } from '@/hooks/useAuthContext';
import toast from 'react-hot-toast';

interface NavigationProps {}

const Navigation: React.FC<NavigationProps> = () => {
  console.log('[Navigation] Component Rendering');
  const navigate = useNavigate();
  const { user, isLoading, signOut } = useAuth();
  const [isNavigating, setIsNavigating] = useState(false);

  console.log('[Navigation] Auth State:', { isLoading, user: user ? user.id : null });

  const handleLogout = async () => {
    if (isNavigating) return;
    setIsNavigating(true);
    console.log('🚪 Logging out via Navigation (using useAuth context)...');
    try {
      await signOut();
      console.log('✅ Logout successful (via context), navigating to / ');
    } catch (err) {
      console.error("Exception during logout:", err);
      toast.error(err instanceof Error ? err.message : 'An unexpected error occurred during logout');
    } finally {
      setIsNavigating(false);
    }
  };

  const handleLogin = () => {
    if (isNavigating) return;
    navigate('/login');
  };

  const handleJoin = async () => {
    navigate('/onboarding');
  };

  const goToDashboard = async () => {
    if (isNavigating || isLoading) return;
    setIsNavigating(true);
    console.log('Dashboard button clicked, checking auth status (from context)...');

    if (!user) {
      console.log('No active user session found (context). Redirecting to login.');
      handleLogin();
      setIsNavigating(false);
      return;
    }

    try {
      const userRole = user.app_metadata?.role || user.user_metadata?.role;
      console.log('User found (context): ', { id: user.id, email: user.email, role: userRole });

      switch (userRole?.toLowerCase()) {
        case 'admin':
          console.log('Navigating to admin dashboard');
          navigate('/admin');
          break;
        case 'brand':
          console.log('Navigating to brand dashboard');
          navigate('/brand/dashboard');
          break;
        case 'creator':
          console.log('Navigating to creator dashboard');
          navigate('/dashboard');
          break;
        default:
          console.warn(`Unknown or missing user role: '${userRole}'. Navigating to generic dashboard.`);
          navigate('/dashboard');
          toast.error('Could not determine user role for dashboard. Using default.');
      }
    } catch (err) {
      console.error('Unexpected error in goToDashboard:', err);
      toast.error('An error occurred while trying to navigate to the dashboard.');
    } finally {
      setIsNavigating(false);
    }
  };

  if (isLoading) {
    console.log('[Navigation] Rendering: Loading State');
    return (
      <div className="sticky top-0 z-50 bg-black bg-opacity-80 backdrop-blur-sm border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex-shrink-0 flex items-center text-white font-bold text-xl">
              Loading...
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  console.log('[Navigation] Rendering: Main Content (User:', user ? user.id : 'null', ')');
  return (
    <div className="sticky top-0 z-50 bg-black bg-opacity-80 backdrop-blur-sm border-b border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div 
            className="flex-shrink-0 flex items-center cursor-pointer text-white text-2xl font-bold tracking-tight hover:text-red-500 transition-colors duration-200"
            onClick={() => navigate('/')}
          >
            Create_OS
          </div>

          <div className="hidden md:flex space-x-8">
            {/* Add other nav links here if needed */}
          </div>

          <div className="flex items-center space-x-4">
            {user ? (
              <>
                <button
                  onClick={goToDashboard}
                  disabled={isNavigating}
                  className="flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-gray-700 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black focus:ring-gray-500 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <User className="mr-2 h-4 w-4" />
                  Dashboard
                </button>
                <button
                  onClick={handleLogout}
                  disabled={isNavigating}
                  className="flex items-center px-4 py-2 border border-red-600 text-sm font-medium rounded-md text-red-500 hover:bg-red-600 hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black focus:ring-red-500 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={handleLogin}
                  disabled={isNavigating}
                  className="flex items-center px-4 py-2 border border-gray-600 text-sm font-medium rounded-md text-gray-300 hover:bg-gray-700 hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black focus:ring-gray-500 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <LogIn className="mr-2 h-4 w-4" />
                  Login
                </button>
                <button
                  onClick={handleJoin}
                  disabled={isNavigating}
                  className="flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black focus:ring-red-500 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Join Now
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Navigation; 