import React, { useState } from 'react';
import { createAdminUser } from '@/services/auth/authService';
import { X, AlertCircle, Mail, Lock, User, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const AdminSetupPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const navigate = useNavigate();

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Reset messages
    setErrorMessage('');
    setSuccessMessage('');
    
    // Validation
    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match');
      return;
    }
    
    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters');
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Create the admin user
      const result = await createAdminUser(email, password);
      
      if (result.success) {
        let message = `Admin user created successfully with email: ${email}`;
        
        // Check for promotion message (existing user case)
        if (result.message && result.message.includes('promoted')) {
          message = `Existing user ${email} was successfully promoted to admin!`;
        }
        
        setSuccessMessage(message);
        
        // Clear form
        setEmail('');
        setPassword('');
        setConfirmPassword('');
        
        // Let user know they can login now
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      } else {
        throw new Error('Failed to create admin user');
      }
    } catch (error: any) {
      console.error('Error creating admin user:', error);
      
      // User-friendly error message
      if (error.message && error.message.includes('already registered')) {
        setErrorMessage('This email is already registered. If this is your account, we will attempt to promote it to admin.');
      } else {
        setErrorMessage(error.message || 'Failed to create admin user');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Secret access code - very basic security measure
  const [accessCode, setAccessCode] = useState('');
  const [isVerified, setIsVerified] = useState(false);
  
  const verifyAccessCode = () => {
    // This is a very simple check - in production you would want something more secure
    if (accessCode === 'createadmin123') {
      setIsVerified(true);
    } else {
      setErrorMessage('Invalid access code');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
        <div className="px-6 py-8">
          <div className="text-center">
            <Shield className="h-12 w-12 text-red-500 mx-auto" />
            <h2 className="mt-4 text-3xl font-extrabold text-gray-900 dark:text-white">
              Admin Setup
            </h2>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Create a permanent admin user with full access
            </p>
          </div>

          {!isVerified ? (
            <div className="mt-8">
              <div className="rounded-md bg-yellow-50 dark:bg-yellow-900/30 p-4 mb-6">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <AlertCircle className="h-5 w-5 text-yellow-400" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-300">
                      Restricted Access
                    </h3>
                    <p className="mt-2 text-sm text-yellow-700 dark:text-yellow-200">
                      This page is for initial admin setup only. Please enter the setup access code.
                    </p>
                  </div>
                </div>
              </div>
            
              <div className="mb-6">
                <label htmlFor="accessCode" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Setup Access Code
                </label>
                <input
                  id="accessCode"
                  type="password"
                  value={accessCode}
                  onChange={(e) => setAccessCode(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-700 dark:bg-gray-800 shadow-sm focus:border-red-500 focus:ring-red-500"
                  placeholder="Enter access code"
                />
              </div>
              
              <button
                onClick={verifyAccessCode}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Verify Access
              </button>
              
              {errorMessage && (
                <div className="mt-4 p-3 bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded-md flex items-start">
                  <AlertCircle className="shrink-0 mr-2 mt-0.5" size={16} />
                  <span>{errorMessage}</span>
                </div>
              )}
            </div>
          ) : (
            <form className="mt-8 space-y-6" onSubmit={handleCreateAdmin}>
              {successMessage && (
                <div className="p-3 bg-green-100 dark:bg-green-900/30 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 rounded-md">
                  {successMessage}
                </div>
              )}
              
              {errorMessage && (
                <div className="p-3 bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded-md flex items-start">
                  <AlertCircle className="shrink-0 mr-2 mt-0.5" size={16} />
                  <span>{errorMessage}</span>
                </div>
              )}
              
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Admin Email
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-700 dark:bg-gray-800 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500"
                    placeholder="admin@example.com"
                  />
                </div>
              </div>
              
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Password
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-700 dark:bg-gray-800 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500"
                    placeholder="••••••••"
                  />
                </div>
              </div>
              
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Confirm Password
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-700 dark:bg-gray-800 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500"
                    placeholder="••••••••"
                  />
                </div>
              </div>
              
              <div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className={`group relative w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                    isLoading ? 'bg-red-400' : 'bg-red-600 hover:bg-red-700'
                  } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500`}
                >
                  {isLoading ? (
                    <>
                      <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                        <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      </span>
                      Creating Admin...
                    </>
                  ) : (
                    <>
                      <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                        <Shield className="h-5 w-5 text-red-400 group-hover:text-red-300" />
                      </span>
                      Create Admin User
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminSetupPage; 