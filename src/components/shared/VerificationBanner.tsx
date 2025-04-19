import React, { useState } from 'react';
import { AlertTriangle, X, Mail, ExternalLink } from 'lucide-react';
import { useAuth } from '@/hooks/useAuthContext';
import { useNavigate } from 'react-router-dom';

interface VerificationBannerProps {
  userType: 'creator' | 'brand';
}

const VerificationBanner: React.FC<VerificationBannerProps> = ({ userType }) => {
  const { isEmailVerified, resendVerificationEmail, user } = useAuth();
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(true);
  const [isResending, setIsResending] = useState(false);
  const [resendMessage, setResendMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // If already verified, don't show the banner
  if (isEmailVerified || !isVisible) {
    return null;
  }

  const handleResendEmail = async () => {
    setIsResending(true);
    setResendMessage(null);
    
    try {
      await resendVerificationEmail();
      setResendMessage({ 
        type: 'success', 
        text: `Verification email sent to ${user?.email}` 
      });
    } catch (error) {
      setResendMessage({ 
        type: 'error', 
        text: 'Failed to send verification email. Please try again later.' 
      });
    } finally {
      setIsResending(false);
    }
  };

  // Different messages based on user type
  const actionRestriction = userType === 'brand' 
    ? 'create campaigns' 
    : 'join campaigns';

  return (
    <div className="w-full bg-black border-b border-red-800 px-4 py-3">
      <div className="max-w-screen-xl mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <AlertTriangle className="h-5 w-5 text-red-500" />
          <div>
            <p className="text-sm text-gray-200">
              <span className="font-medium text-red-400">Email verification required.</span> Please verify your email 
              address to {actionRestriction} and access all features.
            </p>
            {resendMessage && (
              <p className={`text-xs mt-1 ${resendMessage.type === 'success' ? 'text-green-400' : 'text-red-400'}`}>
                {resendMessage.text}
              </p>
            )}
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={handleResendEmail}
            disabled={isResending}
            className="flex items-center text-xs font-medium text-red-400 hover:text-red-300 disabled:opacity-50 px-3 py-1 rounded border border-red-800 hover:bg-red-900/20 transition-colors"
          >
            <Mail className="h-4 w-4 mr-1" />
            {isResending ? 'Sending...' : 'Resend Email'}
          </button>
          
          <button
            onClick={() => navigate('/verify')}
            className="flex items-center text-xs font-medium text-red-400 hover:text-red-300 px-3 py-1 rounded border border-red-800 hover:bg-red-900/20 transition-colors"
          >
            <span>Verify Now</span>
            <ExternalLink className="h-3 w-3 ml-1" />
          </button>
          
          <button 
            onClick={() => setIsVisible(false)}
            className="text-gray-400 hover:text-gray-300"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default VerificationBanner; 