import { useAuth } from '@/hooks/useAuthContext';
import { toast } from 'react-hot-toast';

/**
 * Hook for handling actions that require email verification
 * 
 * @returns Object with functions to use for protected actions
 */
export const useProtectedAction = () => {
  const { isEmailVerified } = useAuth();
  
  /**
   * Executes an action only if the user's email is verified
   * 
   * @param action The function to execute if verified
   * @param actionType The type of action (for the error message)
   * @returns A function that checks verification before executing the action
   */
  const requireVerification = (action: () => void, actionType = 'perform this action') => {
    return () => {
      if (!isEmailVerified) {
        toast.error(`Email verification required to ${actionType}`, {
          duration: 5000,
          position: 'bottom-center',
          icon: '🔒',
        });
        return;
      }
      
      action();
    };
  };

  return {
    requireVerification,
    isEmailVerified
  };
};

export default useProtectedAction; 