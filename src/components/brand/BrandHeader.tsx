import React, { useEffect, useState } from 'react';
import { LogOut, Mail, X } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

interface BrandHeaderProps {
  brandName: string;
  onLogout: () => void;
}

const BrandHeader: React.FC<BrandHeaderProps> = ({ brandName, onLogout }) => {
  const [showVerificationBanner, setShowVerificationBanner] = useState(false);
  const [userEmail, setUserEmail] = useState<string>('');
  const [isNewUser, setIsNewUser] = useState(true);
  
  useEffect(() => {
    // Check if the user needs to verify their email
    const checkVerificationStatus = async () => {
      // Try to get data from Supabase
      const { data: { user } } = await supabase.auth.getUser();
      
      // If there's no session but we have localStorage data, show the banner
      if (!user) {
        const userDataStr = localStorage.getItem('userData');
        if (userDataStr) {
          try {
            const userData = JSON.parse(userDataStr);
            if (userData.email) {
              setUserEmail(userData.email);
              setShowVerificationBanner(true);
              setIsNewUser(true); // It's likely a new user if using localStorage data
            }
          } catch (e) {
            console.error('Error parsing userData from localStorage:', e);
          }
        }
      } else if (user && !user.email_confirmed_at) {
        // If there is a session but email is not confirmed
        setUserEmail(user.email || '');
        setShowVerificationBanner(true);
        setIsNewUser(false); // User exists in the system already
      }
    };
    
    checkVerificationStatus();
  }, []);
  
  const dismissBanner = () => {
    setShowVerificationBanner(false);
  };
  
  const resendVerification = async () => {
    if (!userEmail) return;
    
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: userEmail,
      });
      
      if (error) {
        console.error('Error resending verification email:', error);
        alert('Error resending verification email. Please try again later.');
      } else {
        alert('Verification email sent! Please check your inbox.');
      }
    } catch (e) {
      console.error('Error resending verification:', e);
      alert('Failed to resend verification email. Please try again later.');
    }
  };
  
  return (
    <header className="border-b border-gray-800 bg-black/80 backdrop-blur-sm sticky top-0 z-40 relative" role="banner">
      {showVerificationBanner && (
        <div className="bg-red-900/50 border-b border-red-700 text-white py-2 px-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-red-400" />
            <span className="text-sm">
              Please verify your email address to access all features. 
              {userEmail && <span className="ml-1 font-medium">{userEmail}</span>}
            </span>
            <button 
              onClick={resendVerification}
              className="text-xs bg-red-600 hover:bg-red-700 px-2 py-1 rounded ml-2"
            >
              {isNewUser ? "Send Email" : "Resend Email"}
            </button>
          </div>
          <button 
            onClick={dismissBanner} 
            className="p-1 hover:bg-red-800 rounded"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16" role="navigation">
          <div className="flex items-center gap-6">
            <h1 className="text-2xl font-bold">
              <a 
                href="/"
                className="focus:outline-none focus:ring-2 focus:ring-gray-500 rounded-sm hover:text-gray-300 transition-colors"
                aria-label="Return to homepage"
              >
                CREATE_OS
              </a>
            </h1>
            
            <div className="hidden md:block">
              <p className="text-gray-400 text-sm" aria-label="Current section">Brand Dashboard</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-4">
            <div 
              className="h-8 w-8 bg-gray-800 rounded-full flex items-center justify-center font-bold" 
              aria-label={`${brandName} logo`}
            >
              {brandName.charAt(0).toUpperCase()}
            </div>
            
            <span className="hidden md:block font-medium" aria-label="Brand name">{brandName}</span>
            
            <button
              onClick={onLogout}
              className="p-2 hover:bg-gray-700 rounded-full focus:outline-none focus-visible:outline-none focus:ring-2 focus:ring-gray-500 transition-colors"
              aria-label="Log out"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default BrandHeader;