'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import BackgroundPattern from '@/components/BackgroundPattern';
import { supabase } from '@/lib/supabaseClient';
import { 
  ArrowRight, 
  Building, 
  Users, 
  Calendar, 
  CreditCard, 
  Check, 
  X, 
  DollarSign,
  Globe,
  FileText,
  Bug,
  Mail
} from 'lucide-react';
import { checkEmailExists } from '@/services/auth/authService';

// Define types for steps and form data
interface FormData {
  companyName: string;
  industry: string;
  website: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  password: string;
  billingAddress: {
    street: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  };
  paymentMethod: string;
  paymentEmail: string;
  accountNumber: string;
  routingNumber: string;
  accountName: string;
  cardNumber: string;
  cardName: string;
  cardExpiry: string;
  cardCVC: string;
  paymentMethods: PaymentMethod[];
  skipPayment: boolean;
  verificationSent: boolean;
  emailVerified: boolean;
}

type StepField = 'company' | 'contact' | 'password' | 'payment' | 'verify';

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
  nextEnabled: (formData: FormData) => boolean;
}

const BrandOnboardingPage: React.FC = () => {
  // State to manage the current onboarding step
  const [step, setStep] = useState(0);
  
  // Form data
  const [formData, setFormData] = useState<FormData>({
    companyName: '',
    industry: '',
    website: '',
    contactName: '',
    contactEmail: '',
    contactPhone: '',
    password: '',
    billingAddress: {
      street: '',
      city: '',
      state: '',
      zip: '',
      country: '',
    },
    paymentMethod: '',
    paymentEmail: '',
    accountNumber: '',
    routingNumber: '',
    accountName: '',
    cardNumber: '',
    cardName: '',
    cardExpiry: '',
    cardCVC: '',
    paymentMethods: [],
    skipPayment: false,
    verificationSent: false,
    emailVerified: false
  });
  
  // Error state
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [emailChecking, setEmailChecking] = useState(false);
  const [emailExists, setEmailExists] = useState(false);
  
  const navigate = useNavigate();
  
  const [showDebugInfo, setShowDebugInfo] = useState(false);
  const [debugData, setDebugData] = useState<any>(null);
  
  // Format card number with spaces
  const formatCardNumber = (value: string) => {
    return value.replace(/\s/g, '').replace(/(\d{4})/g, '$1 ').trim();
  };
  
  // Format card expiry date
  const formatExpiryDate = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/^(\d{2})(\d)/, '$1/$2')
      .substr(0, 5);
  };
  
  // Steps configuration
  const steps: Step[] = [
    {
      title: "Let's get started",
      subtitle: "Tell us about your company",
      field: "company",
      type: "company",
      nextEnabled: (data: FormData) => 
        data.companyName.trim().length > 0 && 
        data.industry.trim().length > 0,
    },
    {
      title: "Contact information",
      subtitle: "How can creators reach you?",
      field: "contact",
      type: "contact",
      nextEnabled: (data: FormData) => 
        data.contactName.trim().length > 0 &&
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.contactEmail) &&
        !emailExists,
    },
    {
      title: "Create a password",
      subtitle: "Secure your brand account",
      field: "password",
      type: "password",
      placeholder: "••••••••",
      nextEnabled: (data: FormData) => data.password.length >= 6,
    },
    {
      title: "Almost done!",
      subtitle: "Set up your account verification",
      field: "verify",
      type: "verify",
      nextText: "Complete Setup", 
      nextEnabled: (data: FormData) => true, // Always enabled to allow users to proceed
    },
  ];
  
  // Handle field value changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    if (name.includes('.')) {
      // Handle nested fields (e.g., billingAddress.street)
      const [parent, child] = name.split('.');
      const parentKey = parent as keyof FormData;
      const parentObj = formData[parentKey];
      
      if (typeof parentObj === 'object' && parentObj !== null) {
        setFormData({
          ...formData,
          [parent]: {
            ...parentObj,
            [child]: value
          }
        });
      }
    } else if (name === 'cardNumber') {
      setFormData({
        ...formData,
        cardNumber: formatCardNumber(value)
      });
    } else if (name === 'cardExpiry') {
      setFormData({
        ...formData,
        cardExpiry: formatExpiryDate(value)
      });
    } else if (name === 'cardCVC') {
      setFormData({
        ...formData,
        cardCVC: value.replace(/\D/g, '').substr(0, 3)
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };
  
  // Check if email exists when email field is blurred
  const handleEmailBlur = async (e: React.FocusEvent<HTMLInputElement>) => {
    const email = e.target.value.trim();
    if (email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailChecking(true);
      try {
        const result = await checkEmailExists(email);
        setEmailExists(result.exists);
        if (result.exists) {
          setErrorMessage(result.message || 'This email is already registered. Please sign in instead.');
        } else {
          // Clear error message if email doesn't exist
          if (errorMessage && errorMessage.includes('already registered')) {
            setErrorMessage(null);
          }
        }
      } catch (error) {
        console.error('Error checking email:', error);
      } finally {
        setEmailChecking(false);
      }
    }
  };
  
  // Navigate to the next step or complete onboarding
  const handleNext = async () => {
    if (step === 1) { // Contact information step
      // Double-check email before proceeding
      if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.contactEmail)) {
        setEmailChecking(true);
        try {
          const result = await checkEmailExists(formData.contactEmail);
          setEmailExists(result.exists);
          if (result.exists) {
            setErrorMessage(result.message || 'This email is already registered. Please sign in instead.');
            setEmailChecking(false);
            return; // Prevent proceeding to next step
          }
        } catch (error) {
          console.error('Error checking email:', error);
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
  
  // Handle completion of the onboarding process
  const handleComplete = async () => {
    try {
      console.log('🚀 ATTEMPT: Starting brand registration...');
      setErrorMessage(null);
      setIsLoading(true);
      
      // Validate form data
      if (!formData.companyName || !formData.industry || !formData.contactName || !formData.contactEmail || !formData.password) {
        setErrorMessage('Please fill out all required fields.');
        setIsLoading(false);
        return;
      }
      if (formData.password.length < 6) {
        setErrorMessage('Password must be at least 6 characters long.');
        setIsLoading(false);
        return;
      }
      console.log('📝 FORM: Submitting form data...', { /* ... */ });
      
      // Import and call the simplified onboardBrand service
      console.log('📝 SERVICE: Importing onboarding service...');
      const { onboardBrand } = await import('@/services/onboarding/onboardingService');
      console.log('📝 SERVICE: Calling onboardBrand function...');
      
      const result = await onboardBrand(
        formData.companyName,
        formData.industry,
        formData.contactName,
        formData.contactEmail,
        formData.password,
        formData.contactPhone,
        formData.website
      );
      
      console.log('✅ SERVICE SUCCESS: onboardBrand returned:', result);

      // Store comprehensive user data in localStorage
      console.log('🎉 REDIRECT: Preparing to redirect to verification page...');
      
      // Store user data with additional brand information
      const userData = {
        id: result.userId || (result.user?.id || ''),
        email: result.email || (result.user?.email || ''),
        type: 'brand',
        role: 'BRAND',
        brandProfileId: result.brandProfileId || '',
        companyName: formData.companyName,
        industry: formData.industry
      };
      
      // Set all required localStorage values
      localStorage.setItem('userData', JSON.stringify(userData));
      localStorage.setItem('isLoggedIn', 'true');
      localStorage.setItem('isBrandLoggedIn', 'true');
      
      // Additionally store brand-specific information for dashboard usage
      localStorage.setItem('brandData', JSON.stringify({
        name: formData.companyName,
        industry: formData.industry,
        contactName: formData.contactName,
        contactEmail: formData.contactEmail,
        contactPhone: formData.contactPhone || '',
        website: formData.website || ''
      }));
      
      // Send verification email
      if (result.user) {
        try {
          console.log('✉️ Sending verification email to:', formData.contactEmail);
          const { error } = await supabase.auth.resend({
            type: 'signup',
            email: formData.contactEmail,
            options: {
              emailRedirectTo: `${import.meta.env.VITE_SITE_URL || window.location.origin}/verify`
            }
          });
          
          if (error) {
            console.error('❌ Error from Supabase when sending verification email:', error);
            // We'll still continue but log the error for reference
            if (error.status === 429 || error.message?.includes('security purposes')) {
              // Rate limiting - we'll handle this specially
              console.log('⏳ Rate limited on verification email. Will be handled on verification page.');
              // Store the rate limit info in localStorage so verification page can display it
              try {
                localStorage.setItem('verification_email_last_sent_' + formData.contactEmail, Date.now().toString());
              } catch (err) {
                console.error('❌ Could not store rate limit info:', err);
              }
            }
          } else {
            setFormData(prev => ({...prev, verificationSent: true}));
            console.log('✅ Verification email sent successfully');
          }
        } catch (err) {
          console.error('❌ Failed to send verification email:', err);
          // Continue anyway, the user can request another email on the verification page
        }
      }
      
      console.log('🚀 REDIRECT: Redirecting to verification page...');
      // Add more detailed logging about the verification status
      console.log(`🔍 Verification status: ${formData.verificationSent ? 'Email sent successfully' : 'Automatic email sending failed or was rate limited'}`);
      console.log('ℹ️ Note: User can manually request a new verification email on the verification page if needed');
      // Ensure we're only calling navigate once and after all localStorage is set
      setIsLoading(false); // Important: Set loading to false before navigation
      navigate('/verify');

    } catch (error: any) {
      console.error('❌ ERROR: Brand registration failed:', error);
      setErrorMessage(error.message || 'An unexpected error occurred during signup.');
      setIsLoading(false);
    }
  };
  
  // Check if the next button should be enabled
  const isNextEnabled = () => {
    const currentStep = steps[step];
    return currentStep.nextEnabled(formData);
  };
  
  // Render company information fields
  const renderCompanyFields = () => {
    return (
      <div className="space-y-4">
        <div>
          <label htmlFor="companyName" className="block text-sm opacity-70 mb-1">Company Name</label>
          <input
            id="companyName"
            type="text"
            name="companyName"
            value={formData.companyName}
            onChange={handleChange}
            className="w-full p-3 bg-transparent border rounded focus:border-red-500 outline-none transition-colors"
            placeholder="Your company name"
            autoFocus
          />
        </div>
        
        <div>
          <label htmlFor="industry" className="block text-sm opacity-70 mb-1">Industry</label>
          <select
            id="industry"
            name="industry"
            value={formData.industry}
            onChange={handleChange}
            className="w-full p-3 bg-transparent border rounded focus:border-red-500 outline-none transition-colors"
          >
            <option value="">Select your industry</option>
            <option value="entertainment">Entertainment</option>
            <option value="fashion">Fashion</option>
            <option value="beauty">Beauty</option>
            <option value="technology">Technology</option>
            <option value="food">Food & Beverage</option>
            <option value="travel">Travel</option>
            <option value="health">Health & Fitness</option>
            <option value="education">Education</option>
            <option value="finance">Finance</option>
            <option value="other">Other</option>
          </select>
        </div>
        
        <div>
          <label htmlFor="website" className="block text-sm opacity-70 mb-1">Website (Optional)</label>
          <input
            id="website"
            type="url"
            name="website"
            value={formData.website}
            onChange={handleChange}
            className="w-full p-3 bg-transparent border rounded focus:border-red-500 outline-none transition-colors"
            placeholder="https://yourcompany.com"
          />
        </div>
      </div>
    );
  };
  
  // Render contact information fields
  const renderContactFields = () => {
    return (
      <div className="space-y-4">
        <div>
          <label htmlFor="contactName" className="block text-sm font-medium text-gray-700">
            Your Full Name
          </label>
          <input
            type="text"
            id="contactName"
            name="contactName"
            value={formData.contactName}
            onChange={handleChange}
            placeholder="John Doe"
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
        
        <div>
          <label htmlFor="contactEmail" className="block text-sm font-medium text-gray-700">
            Email Address
          </label>
          <input
            type="email"
            id="contactEmail"
            name="contactEmail"
            value={formData.contactEmail}
            onChange={handleChange}
            onBlur={handleEmailBlur}
            placeholder="john@example.com"
            className={`mt-1 block w-full px-3 py-2 border ${emailExists ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500`}
          />
          {emailChecking && (
            <p className="text-sm text-gray-500 mt-1">Checking email...</p>
          )}
          {emailExists && (
            <p className="text-sm text-red-600 mt-1">
              This email is already registered. Please <a href="/login" className="underline">sign in</a> instead.
            </p>
          )}
        </div>
        
        <div>
          <label htmlFor="contactPhone" className="block text-sm font-medium text-gray-700">
            Phone Number (Optional)
          </label>
          <input
            type="tel"
            id="contactPhone"
            name="contactPhone"
            value={formData.contactPhone}
            onChange={handleChange}
            placeholder="(123) 456-7890"
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
        
        <div>
          <label htmlFor="website" className="block text-sm font-medium text-gray-700">
            Company Website (Optional)
          </label>
          <input
            type="url"
            id="website"
            name="website"
            value={formData.website}
            onChange={handleChange}
            placeholder="https://www.example.com"
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
      </div>
    );
  };
  
  // Modified password field without verification notice
  const renderPasswordField = () => {
    return (
      <div className="space-y-4">
        <div>
          <label htmlFor="password" className="block text-sm opacity-70 mb-1">Password</label>
          <input
            id="password" 
            type="password" 
            name="password"
            value={formData.password} 
            onChange={handleChange}
            className="w-full p-3 bg-transparent border rounded focus:border-red-500 outline-none transition-colors"
            placeholder="••••••••" 
            autoFocus
          />
          <p className="text-xs text-gray-500 mt-2">Use at least 6 characters.</p> 
        </div>
      </div>
    );
  };

  // New verification step
  const renderVerificationStep = () => {
    return (
      <div className="space-y-6">
        <div className="bg-black/20 p-5 rounded-lg border border-gray-800">
          <div className="flex items-start mb-4">
            <div className="bg-red-600/10 p-3 rounded-full mr-4">
              <Mail className="h-6 w-6 text-red-500" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white mb-1">Email Verification</h3>
              <p className="text-gray-400 text-sm">
                We'll send a verification email to {formData.contactEmail} after you complete this step.
              </p>
              <p className="text-gray-400 text-sm mt-2">
                <strong className="text-red-400">Important:</strong> You must verify your email before accessing your brand dashboard.
              </p>
            </div>
          </div>
          
          <div className="space-y-4 mt-6">
            <div className="flex items-center gap-2">
              <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
              <span className="text-sm text-gray-300">Check your inbox (and spam folder) for the verification email</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
              <span className="text-sm text-gray-300">Click the link in the email to verify your account</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
              <span className="text-sm text-gray-300">After verification, you'll have full access to your dashboard</span>
            </div>
          </div>
        </div>
      </div>
    );
  };
  
  // Render appropriate fields based on current step
  const renderStepFields = () => {
    const currentStep = steps[step];
    switch (currentStep.field) {
      case 'company': return renderCompanyFields();
      case 'contact': return renderContactFields();
      case 'password': return renderPasswordField();
      case 'verify': return renderVerificationStep();
      default: return null;
    }
  };
  
  // Debug helper function (Ensuring it has try/catch)
  const handleCheckDatabase = async () => {
    try { // Ensure try block exists and is correct
      setShowDebugInfo(true);
      console.log('🔍 Checking database for debugging...');
      const { checkDatabaseTables } = await import('@/utils/debugUtils');
      await checkDatabaseTables();
      setDebugData({ checked: true, timestamp: new Date().toISOString() });
    } catch (error) { // Ensure catch block exists
      console.error('Error during database check:', error);
      setDebugData({ error: String(error) });
    } 
    // Removed any potential remnants causing syntax error
  };
  
  return (
    <div className="min-h-screen bg-black flex flex-col relative">
      <BackgroundPattern />
      {/* Minimal header */}
      <header className="p-4 border-b border-gray-800 bg-black/80 backdrop-blur-sm relative z-10">
        <div className="text-2xl font-bold">CREATE_OS</div>
      </header>
      
      {/* Main content */}
      <main className="flex-1 flex items-center justify-center p-4 relative z-10">
        <div className="w-full max-w-2xl">
          {/* Progress bar */}
          <div className="flex gap-1 mb-8">
            {steps.map((_, index) => (
              <div 
                key={index} 
                className={`h-1 flex-1 rounded-full ${index <= step ? 'bg-red-500' : 'bg-gray-700'}`}
              />
            ))}
          </div>
          
          {/* Debug button - only in development */}
          {process.env.NODE_ENV !== 'production' && (
            <div className="absolute top-4 right-4">
              <button
                onClick={handleCheckDatabase}
                className="p-2 bg-purple-800 hover:bg-purple-700 text-white rounded-full shadow-lg focus:outline-none"
                aria-label="Debug database"
              >
                <Bug className="h-5 w-5" />
              </button>
            </div>
          )}
          
          {/* Debug Info Modal */}
          {showDebugInfo && (
            <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-80 backdrop-blur-sm z-50 p-6">
              <div className="p-6 rounded-lg w-full max-w-lg bg-black/40 border border-gray-800">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-bold text-white">Database Debug</h3>
                  <button 
                    onClick={() => setShowDebugInfo(false)}
                    className="text-gray-400 hover:text-white"
                  >
                    &times;
                  </button>
                </div>
                
                <div className="space-y-2">
                  <p className="text-gray-300">
                    Check the browser console for detailed database information.
                  </p>
                  
                  {debugData?.error && (
                    <div className="p-3 bg-red-900/30 border border-red-700 rounded text-sm">
                      <p className="text-red-300">{debugData.error}</p>
                    </div>
                  )}
                  
                  {debugData?.checked && (
                    <div className="p-3 bg-green-900/30 border border-green-700 rounded text-sm">
                      <p className="text-green-300">Database check complete at {new Date(debugData.timestamp).toLocaleTimeString()}</p>
                    </div>
                  )}
                </div>
                
                <div className="mt-6 flex justify-end">
                  <button
                    className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded"
                    onClick={() => setShowDebugInfo(false)}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}
          
          {/* Error message display */}
          {errorMessage && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 bg-red-900/30 border border-red-800 rounded-lg text-red-200"
            >
              <p>{errorMessage}</p>
              {errorMessage.includes('already registered') && (
                <div className="mt-2">
                  <button 
                    onClick={() => navigate('/login')}
                    className="text-red-300 underline hover:text-red-100"
                  >
                    Go to login page
                  </button>
                </div>
              )}
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
              
              {/* Input fields for the current step */}
              {renderStepFields()}
            </motion.div>
          </AnimatePresence>
          
          {/* Next and Skip buttons */}
          <div className="flex flex-col space-y-3">
            <motion.button
              onClick={handleNext}
              className={`w-full p-4 flex items-center justify-center gap-2 rounded-lg font-bold text-xl transition-colors relative z-10 ${
                isNextEnabled() 
                  ? 'bg-gradient-to-r from-red-500 to-red-700 text-white' 
                  : 'bg-gray-800 text-gray-500 cursor-not-allowed'
              }`}
              whileHover={isNextEnabled() ? { scale: 1.02 } : {}}
              whileTap={isNextEnabled() ? { scale: 0.98 } : {}}
              disabled={!isNextEnabled() || isLoading}
              type="button"
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
          </div>
          
          {/* Additional tips or help text */}
          <div className="mt-4 text-center text-gray-500 text-sm">
            {step === 0 && "We're excited to have your brand on CREATE_OS"}
            {step === 1 && "We'll never share your contact information with third parties"}
            {step === 2 && "Your password secures your brand's campaign data and analytics"}
            {step === 3 && "You can always set up your payment method later in settings"}
          </div>
        </div>
      </main>
    </div>
  );
};

export default BrandOnboardingPage;