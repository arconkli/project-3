import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, X, ExternalLink } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

interface VerificationBannerProps {
  userEmail: string;
  onDismiss?: () => void;
}

const VerificationBanner: React.FC<VerificationBannerProps> = ({ 
  userEmail, 
  onDismiss 
}) => {
  const navigate = useNavigate();
  const [isResending, setIsResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [resendError, setResendError] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState(true);

  const handleResendEmail = async () => {
    try {
      setIsResending(true);
      setResendError(null);
      setResendSuccess(false);
      
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: userEmail,
        options: {
          emailRedirectTo: `${import.meta.env.VITE_SITE_URL || window.location.origin}/verify`
        }
      });
      
      if (error) throw error;
      
      setResendSuccess(true);
    } catch (error: any) {
      console.error('Error resending verification email:', error);
      setResendError(error.message || 'Failed to resend verification email');
    } finally {
      setIsResending(false);
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    if (onDismiss) onDismiss();
  };

  if (!isVisible) return null;

  return (
    <div className="bg-black/50 border-b border-yellow-900 px-4 py-2">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-2 text-sm text-yellow-200">
          <Mail className="h-4 w-4" />
          <span>
            Please verify your email address ({userEmail}) to ensure you receive important notifications
          </span>
          
          {resendSuccess && (
            <span className="text-green-400 ml-2">
              Email sent successfully!
            </span>
          )}
          
          {resendError && (
            <span className="text-red-400 ml-2">
              {resendError}
            </span>
          )}
        </div>
        
        <div className="flex items-center space-x-4">
          <button
            onClick={handleResendEmail}
            disabled={isResending}
            className="text-xs text-yellow-400 hover:text-yellow-300 flex items-center"
          >
            {isResending ? 'Sending...' : 'Resend email'}
          </button>
          
          <button
            onClick={() => navigate('/verify')}
            className="text-xs text-yellow-400 hover:text-yellow-300 flex items-center"
          >
            <span>Verify now</span>
            <ExternalLink className="h-3 w-3 ml-1" />
          </button>
          
          <button
            onClick={handleDismiss}
            className="text-gray-400 hover:text-white"
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default VerificationBanner; 