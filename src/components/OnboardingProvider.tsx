import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface OnboardingContextType {
  showOnboarding: boolean;
  completeOnboarding: () => void;
  resetOnboarding: () => void;
  showTutorial: () => void;
}

interface OnboardingProviderProps {
  children: React.ReactNode;
  autoShow?: boolean;
}

const OnboardingContext = createContext<OnboardingContextType>({
  showOnboarding: false,
  completeOnboarding: () => {},
  resetOnboarding: () => {},
  showTutorial: () => {}
});

export const useOnboarding = () => useContext(OnboardingContext);

export const OnboardingProvider: React.FC<OnboardingProviderProps> = ({ 
  children,
  autoShow = true
}) => {
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isTutorial, setIsTutorial] = useState(false);
  const navigate = useNavigate();
  
  // Check if this is the user's first visit
  useEffect(() => {
    if (typeof window !== 'undefined' && autoShow) {
      const hasCompletedOnboarding = localStorage.getItem('hasCompletedOnboarding');
      const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
      
      if (!hasCompletedOnboarding && !isLoggedIn) {
        const timer = setTimeout(() => {
          // Don't automatically show the onboarding - wait for user to click "Join as Creator"
          // setShowOnboarding(true);
        }, 800);
        
        return () => clearTimeout(timer);
      }
    }
  }, [autoShow]);
  
  // Mark onboarding as complete
  const completeOnboarding = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('hasCompletedOnboarding', 'true');
    }
    setShowOnboarding(false);
    setIsTutorial(false);
  };
  
  // Reset onboarding to show signup form
  const resetOnboarding = () => {
    setShowOnboarding(true);
    setIsTutorial(false);
  };
  
  // Show more detailed platform tutorial 
  const showTutorial = () => {
    setShowOnboarding(true);
    setIsTutorial(true);
  };
  
  return (
    <OnboardingContext.Provider 
      value={{ 
        showOnboarding, 
        completeOnboarding, 
        resetOnboarding,
        showTutorial 
      }}
    >
      {children}
    </OnboardingContext.Provider>
  );
}; 