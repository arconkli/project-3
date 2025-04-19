/**
 * Utility for handling Supabase errors, especially rate limiting
 */

interface ErrorResponse {
  message: string;
  isRateLimited: boolean;
  remainingSeconds?: number;
  originalError?: any;
}

/**
 * Handles Supabase errors with special consideration for rate limiting
 * @param error The error returned from Supabase
 * @returns Structured error object with user-friendly message and rate limiting details
 */
export function handleSupabaseError(error: any): ErrorResponse {
  if (!error) {
    return {
      message: 'Unknown error occurred',
      isRateLimited: false
    };
  }
  
  // Handle rate limit errors (429)
  if (error.status === 429 || 
      error.message?.includes('rate limit') || 
      error.message?.includes('security purposes')) {
    
    // Extract waiting time if available
    const timeMatch = error.message?.match(/(\d+) seconds/);
    const remainingSeconds = timeMatch ? parseInt(timeMatch[1]) : 60;
    
    return {
      message: `Rate limit exceeded. Please try again after ${remainingSeconds} seconds.`,
      isRateLimited: true,
      remainingSeconds,
      originalError: error
    };
  }
  
  // Authentication errors
  if (error.status === 401 || error.status === 403) {
    return {
      message: 'Authentication error. Please sign in again.',
      isRateLimited: false,
      originalError: error
    };
  }
  
  // Database errors
  if (error.status === 400 && error.message?.includes('duplicate')) {
    return {
      message: 'This email is already registered. Please sign in instead.',
      isRateLimited: false,
      originalError: error
    };
  }

  // All other errors
  return {
    message: error.message || 'An unexpected error occurred',
    isRateLimited: false,
    originalError: error
  };
}

/**
 * Adds consistent delay for rate limited operations
 * @param seconds Number of seconds to wait
 * @returns Promise that resolves after the specified seconds
 */
export function delay(seconds: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, seconds * 1000));
} 