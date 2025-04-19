'use client';

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import BackgroundPattern from '@/components/BackgroundPattern';
import { 
  ArrowRight, 
  Check, 
  X,
  Mail
} from 'lucide-react';
import { checkEmailExists } from '@/services/auth/authService';

// Define types for steps and form data
interface FormData {
  name: string;
  email: string;
  phone: string;
  password: string;
  platforms: string[];
  paymentMethod: string;
  paymentEmail: string;
  accountNumber: string;
  routingNumber: string;
  accountName: string;
  skipPayment: boolean;
}

type StepField = 'name' | 'email' | 'phone' | 'password' | 'platforms' | 'payment';

interface Option {
  id: string;
  label: string;
}

interface Step {
  title: string;
  subtitle: string;
  field: StepField;
  type: string;
  placeholder?: string;
  options?: Option[];
  nextText?: string;
  nextEnabled: (value: string | string[] | FormData) => boolean;
}

const OnboardingPage: React.FC = () => {
  // State to manage the current onboarding step
  const [step, setStep] = useState(0);
  
  // Form data
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    phone: '',
    password: '',
    platforms: [],
    paymentMethod: '',
    paymentEmail: '',
    accountNumber: '',
    routingNumber: '',
    accountName: '',
    skipPayment: false
  });
  
  // Error state
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [emailChecking, setEmailChecking] = useState(false);
  const [emailExists, setEmailExists] = useState(false);
  
  const navigate = useNavigate();
  
  // Format account number
  const formatAccountNumber = (value: string) => {
    return value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
  };
  
  // Format routing number
  const formatRoutingNumber = (value: string) => {
    return value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
  };
  
  // Steps configuration
  const steps: Step[] = [
    {
      title: "What's your name?",
      subtitle: "Let's start with a proper introduction",
      field: "name",
      type: "text",
      placeholder: "Your name",
      nextEnabled: (value: string) => value.trim().length > 0,
    },
    {
      title: "What's your email?",
      subtitle: "We'll use this to create your account",
      field: "email",
      type: "email",
      placeholder: "your@email.com",
      nextEnabled: (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
    },
    {
      title: "Your phone number",
      subtitle: "For account security (optional)",
      field: "phone",
      type: "tel",
      placeholder: "Your phone number",
      nextEnabled: (_: string) => true, // Optional field
    },
    {
      title: "Create a password",
      subtitle: "Make it strong and memorable",
      field: "password",
      type: "password",
      placeholder: "••••••••",
      nextEnabled: (value: string) => value.length >= 6,
    },
    {
      title: "Which platforms do you create on?",
      subtitle: "Select all that apply",
      field: "platforms",
      type: "multi-select",
      options: [
        { id: "tiktok", label: "TikTok" },
        { id: "instagram", label: "Instagram" },
        { id: "youtube", label: "YouTube" },
        { id: "twitter", label: "X (Twitter)" }
      ],
      nextEnabled: (_: string[]) => true, // Always enabled as platforms are optional
    },
    {
      title: "Payment Information",
      subtitle: "How would you like to receive your earnings?",
      field: "payment",
      type: "payment",
      nextText: "Complete",
      nextEnabled: (data: FormData) => {
        // Skip validation if the user chooses to skip payment setup
        if (data.skipPayment) return true;
        
        // Otherwise, check if a payment method was selected
        return (
          data.paymentMethod === 'paypal' || 
          data.paymentMethod === 'bank'
        );
      },
    }
  ];
  
  // Social media login handlers
  const handleSocialLogin = (provider: string) => {
    // In a real app, this would authenticate with the provider
    console.log(`Authenticating with ${provider}`);
    
    // For demo, simulate successful login
    localStorage.setItem('userData', JSON.stringify({
      name: `${provider} User`,
      email: `user@${provider.toLowerCase()}.com`,
      platforms: [provider.toLowerCase()]
    }));
    
    localStorage.setItem('isLoggedIn', 'true');
    navigate('/dashboard');
  };
  
  // Check if email exists when email field is blurred
  const handleEmailBlur = async (value: string) => {
    if (value && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      setEmailChecking(true);
      try {
        const result = await checkEmailExists(value);
        setEmailExists(result.exists);
        if (result.exists) {
          setError(result.message || 'This email is already registered. Please sign in instead.');
        } else {
          // Clear error message if email doesn't exist
          if (error && error.includes('already registered')) {
            setError(null);
          }
        }
      } catch (err) {
        console.error('Error checking email:', err);
      } finally {
        setEmailChecking(false);
      }
    }
  };
  
  // Navigate to the next step or complete onboarding
  const handleNext = async () => {
    if (step === 1) { // Email step
      // Double-check email before proceeding
      if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        setEmailChecking(true);
        try {
          const result = await checkEmailExists(formData.email);
          setEmailExists(result.exists);
          if (result.exists) {
            setError(result.message || 'This email is already registered. Please sign in instead.');
            setEmailChecking(false);
            return; // Prevent proceeding to next step
          }
        } catch (err) {
          console.error('Error checking email:', err);
        } finally {
          setEmailChecking(false);
        }
      }
    }
    
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      handleComplete();
    }
  };
  
  // Handle field value changes
  const handleChange = (value: string | string[] | boolean, field?: string) => {
    const fieldName = field || steps[step].field;
    
    setFormData({
      ...formData,
      [fieldName]: value
    });
  };
  
  // Handle multi-select options
  const handleOptionToggle = (optionId: string) => {
    const currentPlatforms = [...formData.platforms];
    const index = currentPlatforms.indexOf(optionId);
    
    if (index > -1) {
      // Remove if already selected
      currentPlatforms.splice(index, 1);
    } else {
      // Add if not selected
      currentPlatforms.push(optionId);
    }
    
    setFormData({
      ...formData,
      platforms: currentPlatforms
    });
  };
  
  // Handle completion of the onboarding process
  const handleComplete = async () => {
    try {
      console.log('🚀 ATTEMPT: Starting creator onboarding...');
      setError(null);
      setIsLoading(true);

      // Validate data
      if (!formData.name || !formData.email || !formData.password) {
        setError('Please fill out all required fields.');
        setIsLoading(false);
        return;
      }

      // Check password strength
      if (formData.password.length < 6) {
        setError('Password must be at least 6 characters long.');
        setIsLoading(false);
        return;
      }

      // Import the onboardCreator service
      const { onboardCreator } = await import('@/services/onboarding/onboardingService');

      // Call the service
      const result = await onboardCreator(
        formData.email,
        formData.password,
        formData.name,
        formData.phone,
        formData.platforms
      );

      // Store the user data
      localStorage.setItem('userData', JSON.stringify({
        id: result.user.id,
        email: formData.email,
        name: formData.name,
        platforms: formData.platforms,
        type: 'creator'
      }));

      console.log('✅ Onboarding Successful:', {
        shouldVerify: result.shouldVerify,
        userId: result.user?.id,
        userEmail: result.user?.email,
      });

      // Navigate to the verification page with a clear message
      navigate('/verify');
      
    } catch (error: any) {
      console.error('❌ Error during onboarding:', error);
      setError(error.message || 'An unexpected error occurred during signup.');
      setIsLoading(false);
    }
  };
  
  // Check if the next button should be enabled
  const isNextEnabled = () => {
    const currentStep = steps[step];
    
    // Special case for payment step
    if (currentStep.field === 'payment') {
      return currentStep.nextEnabled(formData);
    }
    
    // For other steps, use the specific field value with proper type assertion
    const value = formData[currentStep.field as keyof typeof formData];
    if (value === undefined) {
      return false;
    }
    return currentStep.nextEnabled(value);
  };
  
  // Handle pressing Enter to advance
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && isNextEnabled()) {
        handleNext();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [step, formData]);

  // Render payment form fields
  const renderPaymentFields = () => {
    return (
      <div className="space-y-4">
        <p className="text-sm mb-3">Choose how you want to receive your earnings from campaigns:</p>
        
        <div className="grid grid-cols-1 gap-3">
          <motion.button
            className={`p-4 border rounded-lg text-left flex items-start gap-3 ${formData.paymentMethod === 'bank' ? 'border-green-500 bg-green-900 bg-opacity-10' : ''}`}
            whileHover={{ scale: 1.01, backgroundColor: "rgba(255,255,255,0.05)" }}
            onClick={() => handleChange('bank', 'paymentMethod')}
          >
            <div className="mt-1">
              <svg className="h-5 w-5 text-green-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="5" width="20" height="14" rx="2" />
                <line x1="2" y1="10" x2="22" y2="10" />
              </svg>
            </div>
            <div>
              <p className="font-medium">Bank Account</p>
              <p className="text-sm text-gray-400">Receive direct deposits to your bank account</p>
            </div>
            {formData.paymentMethod === 'bank' && (
              <div className="absolute right-4 top-4">
                <svg className="h-5 w-5 text-green-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                  <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
              </div>
            )}
          </motion.button>
          
          <motion.button
            className={`p-4 border rounded-lg text-left flex items-start gap-3 ${formData.paymentMethod === 'paypal' ? 'border-blue-500 bg-blue-900 bg-opacity-10' : ''}`}
            whileHover={{ scale: 1.01, backgroundColor: "rgba(255,255,255,0.05)" }}
            onClick={() => handleChange('paypal', 'paymentMethod')}
          >
            <div className="mt-1">
              <svg className="h-5 w-5 text-blue-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M7 11l5-7"></path>
                <path d="M21 6l-3 7"></path>
                <path d="M11 4h1a3 3 0 0 1 3 3v0a3 3 0 0 1-3 3h-1v5"></path>
                <path d="M14 15v-3a2 2 0 0 1 2-2h1a2 2 0 0 1 2 2v0a2 2 0 0 1-2 2h-1"></path>
              </svg>
            </div>
            <div>
              <p className="font-medium">PayPal</p>
              <p className="text-sm text-gray-400">Get paid quickly to your PayPal account</p>
            </div>
            {formData.paymentMethod === 'paypal' && (
              <div className="absolute right-4 top-4">
                <svg className="h-5 w-5 text-blue-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                  <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
              </div>
            )}
          </motion.button>
        </div>
        
        {formData.paymentMethod === 'paypal' && (
          <div className="mt-3">
            <label className="block text-sm opacity-70 mb-1">PayPal Email</label>
            <input
              type="email"
              value={formData.paymentEmail as string}
              onChange={(e) => handleChange(e.target.value, 'paymentEmail')}
              className="w-full p-3 bg-transparent border rounded focus:border-red-500 outline-none transition-colors"
              placeholder="your@email.com"
            />
          </div>
        )}
        
        {formData.paymentMethod === 'bank' && (
          <div className="space-y-3 mt-3">
            <div>
              <label className="block text-sm opacity-70 mb-1">Account Holder Name</label>
              <input
                type="text"
                value={formData.accountName as string}
                onChange={(e) => handleChange(e.target.value, 'accountName')}
                className="w-full p-3 bg-transparent border rounded focus:border-red-500 outline-none transition-colors"
                placeholder="Full name on account"
              />
            </div>
            
            <div>
              <label className="block text-sm opacity-70 mb-1">Routing Number</label>
              <input
                type="text"
                value={formData.routingNumber as string}
                onChange={(e) => handleChange(formatRoutingNumber(e.target.value), 'routingNumber')}
                className="w-full p-3 bg-transparent border rounded focus:border-red-500 outline-none transition-colors"
                placeholder="9 digits"
                maxLength={9}
              />
            </div>
            
            <div>
              <label className="block text-sm opacity-70 mb-1">Account Number</label>
              <input
                type="text"
                value={formData.accountNumber as string}
                onChange={(e) => handleChange(formatAccountNumber(e.target.value), 'accountNumber')}
                className="w-full p-3 bg-transparent border rounded focus:border-red-500 outline-none transition-colors"
                placeholder="Your account number"
              />
            </div>
          </div>
        )}
        
        <div className="mt-5 pt-5 border-t border-gray-700">
          <p className="text-xs text-gray-400 mt-2 mb-4">
            Your payment information is encrypted and secure. This account will be used
            to receive your earnings from campaigns once you reach the minimum payout threshold.
          </p>
        </div>
      </div>
    );
  };

  // Modified for the email step to check if the email exists
  const renderEmailStep = () => (
    <div>
      <input
        type="email"
        value={formData.email}
        onChange={(e) => handleChange(e.target.value)}
        onBlur={(e) => handleEmailBlur(e.target.value)}
        placeholder={steps[step].placeholder}
        className={`w-full p-3 bg-transparent border rounded ${emailExists ? 'border-red-500' : 'focus:border-red-500'} outline-none transition-colors`}
        autoFocus
      />
      {emailChecking && (
        <p className="text-sm text-gray-500 mt-1">Checking email...</p>
      )}
      {emailExists && (
        <p className="text-sm text-red-500 mt-1">
          This email is already registered. Please <a href="/login" className="underline">sign in</a> instead.
        </p>
      )}
    </div>
  );

  // Password step with confirmation notice
  const renderPasswordStep = () => (
    <div className="space-y-4">
      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-1">
          Password
        </label>
        <input
          id="password"
          type="password"
          name="password"
          value={formData.password}
          onChange={(e) => handleChange(e.target.value)}
          className="w-full px-3 py-2 bg-black/60 border border-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
          placeholder="••••••••"
          autoFocus
        />
        <p className="text-xs text-gray-500 mt-2">Use at least 6 characters for better security.</p>
      </div>
      
      <div className="bg-black/30 p-3 rounded-md border border-gray-800 flex items-start space-x-2">
        <div className="bg-red-600/20 p-1.5 rounded-full shrink-0">
          <Check className="h-4 w-4 text-red-500" />
        </div>
        <p className="text-sm text-gray-300">
          After clicking "Complete," you'll be directed to verify your email address.
        </p>
      </div>
    </div>
  );

  // Render appropriate fields based on current step
  const renderStepFields = () => {
    const currentStep = steps[step];
    switch (currentStep.field) {
      case 'name':
        return (
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-1">
              Full Name
            </label>
            <input
              id="name"
              type="text"
              name="name"
              value={formData.name}
              onChange={(e) => handleChange(e.target.value)}
              className="w-full px-3 py-2 bg-black/60 border border-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
              placeholder="Your name"
              autoFocus
            />
          </div>
        );
      case 'email':
        return renderEmailStep();
      case 'phone':
        return (
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-300 mb-1">
              Phone Number (Optional)
            </label>
            <input
              id="phone"
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={(e) => handleChange(e.target.value)}
              className="w-full px-3 py-2 bg-black/60 border border-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
              placeholder="Your phone number"
              autoFocus
            />
          </div>
        );
      case 'password':
        return renderPasswordStep();
      case 'platforms':
        return (
          <div className="space-y-3">
            <p className="text-sm text-gray-400 mb-2">Select platforms where you create content:</p>
            <div className="grid grid-cols-2 gap-3">
              {steps[step].options?.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => handleOptionToggle(option.id)}
                  className={`p-3 flex items-center border rounded-md transition-colors ${
                    formData.platforms.includes(option.id)
                      ? 'bg-red-500/10 border-red-500 text-white'
                      : 'bg-black/30 border-gray-700 text-gray-300 hover:border-gray-500'
                  }`}
                >
                  <div className={`w-5 h-5 mr-2 rounded-full border flex items-center justify-center ${
                    formData.platforms.includes(option.id)
                      ? 'border-red-500'
                      : 'border-gray-500'
                  }`}>
                    {formData.platforms.includes(option.id) && (
                      <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    )}
                  </div>
                  <span>{option.label}</span>
                </button>
              ))}
            </div>
          </div>
        );
      case 'payment':
        return renderPaymentFields();
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-black flex flex-col relative">
      <BackgroundPattern />
      {/* Minimal header */}
      <header className="p-4 border-b border-gray-800">
        <div className="text-2xl font-bold">CREATE_OS</div>
      </header>
      
      {/* Main content */}
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md content-layer">
          {/* Social Login Options */}
          {step === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="mb-6"
            >
              <p className="text-center text-sm text-gray-400 mb-3">Sign up faster with</p>
              <div className="grid grid-cols-4 gap-3">
                <motion.button
                  className="flex items-center justify-center border border-gray-700 p-3 rounded-lg"
                  whileHover={{ scale: 1.05, backgroundColor: "rgba(255,255,255,0.05)" }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleSocialLogin('Google')}
                >
                  <svg className="h-5 w-5" viewBox="0 0 24 24">
                    <path fill="#EA4335" d="M5.26620003,9.76452941 C6.19878754,6.93863203 8.85444915,4.90909091 12,4.90909091 C13.6909091,4.90909091 15.2181818,5.50909091 16.4181818,6.49090909 L19.9090909,3 C17.7818182,1.14545455 15.0545455,0 12,0 C7.27006974,0 3.1977497,2.69829785 1.23999023,6.65002441 L5.26620003,9.76452941 Z"/>
                    <path fill="#34A853" d="M16.0407269,18.0125889 C14.9509167,18.7163016 13.5660892,19.0909091 12,19.0909091 C8.86648613,19.0909091 6.21911939,17.076871 5.27698177,14.2678769 L1.23746264,17.3349879 C3.19279051,21.2970142 7.26500293,24 12,24 C14.9328362,24 17.7353462,22.9573905 19.834192,20.9995801 L16.0407269,18.0125889 Z"/>
                    <path fill="#4A90E2" d="M19.834192,20.9995801 C22.0291676,18.9520994 23.4545455,15.903663 23.4545455,12 C23.4545455,11.2909091 23.3454545,10.5272727 23.1818182,9.81818182 L12,9.81818182 L12,14.4545455 L18.4363636,14.4545455 C18.1187732,16.013626 17.2662994,17.2212117 16.0407269,18.0125889 L19.834192,20.9995801 Z"/>
                    <path fill="#FBBC05" d="M5.27698177,14.2678769 C5.03832634,13.556323 4.90909091,12.7937589 4.90909091,12 C4.90909091,11.2182781 5.03443647,10.4668121 5.26620003,9.76452941 L1.23999023,6.65002441 C0.43658717,8.26043162 0,10.0753848 0,12 C0,13.9195484 0.444780743,15.7301709 1.23746264,17.3349879 L5.27698177,14.2678769 Z"/>
                  </svg>
                </motion.button>
                
                <motion.button
                  className="flex items-center justify-center border border-gray-700 p-3 rounded-lg"
                  whileHover={{ scale: 1.05, backgroundColor: "rgba(255,255,255,0.05)" }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleSocialLogin('Facebook')}
                >
                  <svg className="h-5 w-5 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M22.675 0H1.325C.593 0 0 .593 0 1.325v21.351C0 23.407.593 24 1.325 24H12.82v-9.294H9.692v-3.622h3.128V8.413c0-3.1 1.893-4.788 4.659-4.788 1.325 0 2.463.099 2.795.143v3.24l-1.918.001c-1.504 0-1.795.715-1.795 1.763v2.313h3.587l-.467 3.622h-3.12V24h6.116c.73 0 1.323-.593 1.323-1.325V1.325C24 .593 23.407 0 22.675 0z" />
                  </svg>
                </motion.button>
                
                <motion.button
                  className="flex items-center justify-center border border-gray-700 p-3 rounded-lg"
                  whileHover={{ scale: 1.05, backgroundColor: "rgba(255,255,255,0.05)" }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleSocialLogin('Twitter')}
                >
                  <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                  </svg>
                </motion.button>
                
                <motion.button
                  className="flex items-center justify-center border border-gray-700 p-3 rounded-lg"
                  whileHover={{ scale: 1.05, backgroundColor: "rgba(255,255,255,0.05)" }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleSocialLogin('Instagram')}
                >
                  <svg className="h-5 w-5 text-pink-500" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                  </svg>
                </motion.button>
              </div>
              
              <div className="flex items-center my-4">
                <div className="flex-grow border-t border-gray-700"></div>
                <span className="flex-shrink mx-4 text-sm text-gray-400">or continue with email</span>
                <div className="flex-grow border-t border-gray-700"></div>
              </div>
            </motion.div>
          )}
        
          {/* Progress bar */}
          <div className="flex gap-1 mb-12">
            {steps.map((_, index) => (
              <div 
                key={index} 
                className={`h-1 flex-1 rounded-full ${index <= step ? 'bg-red-500' : 'bg-gray-700'}`}
              />
            ))}
          </div>
          
          {/* Error message display */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 p-4 bg-red-900/20 border border-red-500/50 rounded-lg text-red-400 text-sm"
            >
              {error}
            </motion.div>
          )}
          
          {/* Step content with animations */}
          <AnimatePresence mode="wait">
            <motion.div
              key={`step-${step}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="mb-8"
            >
              <h1 className="text-3xl font-bold mb-2">{steps[step].title}</h1>
              <p className="text-gray-400 mb-6">{steps[step].subtitle}</p>
              
              {/* Input field based on step type */}
              {renderStepFields()}
            </motion.div>
          </AnimatePresence>
          
          {/* Next and Skip buttons */}
          <div className="flex flex-col space-y-3">
            <motion.button
              onClick={handleNext}
              className={`w-full p-4 flex items-center justify-center gap-2 rounded-lg font-bold text-xl transition-colors relative z-10 ${
                isNextEnabled() && !isLoading
                  ? 'bg-gradient-to-r from-red-500 to-red-700 text-white' 
                  : 'bg-gray-800 text-gray-500 cursor-not-allowed'
              }`}
              whileHover={isNextEnabled() && !isLoading ? { scale: 1.02 } : {}}
              whileTap={isNextEnabled() && !isLoading ? { scale: 0.98 } : {}}
              disabled={!isNextEnabled() || isLoading}
            >
              {isLoading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </span>
              ) : (
                <>
                  {steps[step].nextText || 'Continue'} 
                  <ArrowRight className="h-5 w-5" />
                </>
              )}
            </motion.button>
            
            {step === 5 && ( // Only show skip button on payment step
              <motion.button
                onClick={() => {
                  setFormData({...formData, skipPayment: true});
                  handleComplete();
                }}
                className="text-gray-400 py-2 hover:text-gray-200 transition-colors text-center relative z-10"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Skip payment setup for now
              </motion.button>
            )}
          </div>
          
          {/* Additional tips or help text */}
          <div className="mt-4 text-center text-gray-500 text-sm">
            {step === 0 && "We're excited to have you join us"}
            {step === 1 && "We'll never share your email with third parties"}
            {step === 2 && "Your phone helps secure your account and receive notifications"}
            {step === 3 && "Use at least 6 characters for a secure password"}
            {step === 4 && "You can connect more platforms later in your settings"}
            {step === 5 && "You can always set up your payment method later in settings"}
          </div>
        </div>
      </main>
    </div>
  );
};

export default OnboardingPage;