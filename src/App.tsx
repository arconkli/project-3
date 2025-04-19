import { Routes, Route, Navigate } from 'react-router-dom'
import HomePage from './pages/HomePage'
import DashboardPage from './pages/DashboardPage'
import OnboardingPage from './pages/OnboardingPage'
import BrandOnboardingPage from './pages/BrandOnboardingPage'
import AdminDashboardPage from './pages/AdminDashboardPage'
import BrandDashboardPage from './pages/BrandDashboardPage'
import CampaignCreationPage from './pages/brand/campaigns/create'
import CampaignEditPage from './pages/brand/campaigns/edit'
import LoginPage from './pages/LoginPage'
import VerificationPage from './pages/VerificationPage'
import AdminSetupPage from './pages/AdminSetupPage'
import { OnboardingProvider } from './components/shared/OnboardingProvider'
import ErrorBoundary from './components/shared/ErrorBoundary'
import { useAuth, AuthContextType } from '@/hooks/useAuthContext'
import { UserRole } from '@/types/auth'
import { useState, useEffect, ReactNode } from 'react'
import { authDebugger } from './lib/authDebugger'
import { useNavigate } from 'react-router-dom'

// Expose auth debugger in development
if (import.meta.env.DEV) {
  // @ts-ignore
  window.authDebugger = authDebugger;
  console.log('Auth debugger available. Use authDebugger.checkAuth() or authDebugger.recoverSession() in console to debug auth issues.');
}

// Define props type for ProtectedRoute
interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: UserRole | null;
}

// --- ProtectedRoute Component ---
function ProtectedRoute({ children, requiredRole = null }: ProtectedRouteProps) {
  // Destructure using correctly imported type
  const { user, loading, userRole }: AuthContextType = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // If loading is finished and there's no user, redirect to login
    if (!loading && !user) {
      console.log(`[ProtectedRoute] No user found after loading, redirecting to login.`);
      navigate('/login', { replace: true });
      return; // Exit early
    }

    // If loading is finished and there IS a user, check the role
    if (!loading && user) {
      let allowAccess = false;
      if (requiredRole) {
        // Use userRole from context for reliable role checking
        if (userRole === requiredRole) {
          allowAccess = true;
        } else if (requiredRole === UserRole.ADMIN && userRole === UserRole.ADMIN) {
          allowAccess = true;
        } else if (requiredRole === UserRole.BRAND && userRole === UserRole.BRAND) {
          allowAccess = true;
        }
      } else {
        // If no requiredRole, logged-in user is allowed
        allowAccess = true;
      }

      if (!allowAccess) {
        console.log(`[ProtectedRoute] Access denied. Required: ${requiredRole}, User Role: ${userRole}. Redirecting.`);
        navigate('/', { replace: true });
      }
    }
  }, [user, loading, userRole, navigate, requiredRole]);

  // Show loading state ONLY based on the context's loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="animate-spin h-8 w-8 border-t-2 border-b-2 border-red-600 rounded-full"></div>
      </div>
    );
  }

  // Special check for BrandRoute email verification *after* role check passes
  // Ensure user is not null before checking email_confirmed_at
  if (requiredRole === UserRole.BRAND && user) {
    const isEmailVerified = !!user.email_confirmed_at;
    if (!isEmailVerified) {
      console.log('Brand user email not verified, redirecting to /verify');
      return <Navigate to="/verify" replace />;
    }
  }

  return <>{children}</>;
}

// --- AdminRoute Component (Simplified - now uses ProtectedRoute) ---
// const AdminRoute = ({ children }: { children: JSX.Element }) => {
//   return <ProtectedRoute requiredRole={UserRole.ADMIN}>{children}</ProtectedRoute>;
// };

// --- BrandRoute Component (Simplified - now uses ProtectedRoute) ---
// const BrandRoute = ({ children }: { children: JSX.Element }) => {
//   return <ProtectedRoute requiredRole={UserRole.BRAND}>{children}</ProtectedRoute>;
// };

// --- VerificationRoute Component ---
const VerificationRoute = ({ children }: { children: JSX.Element }) => {
  // Destructure using correctly imported type
  const { user, loading, userRole }: AuthContextType = useAuth();
  const isEmailVerified = !!user?.email_confirmed_at;

  // Show loading state based on context
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-500"></div>
      </div>
    );
  }

  // If email is already verified, redirect to appropriate dashboard
  if (isEmailVerified) {
    console.log('Email already verified, redirecting to dashboard. User role:', userRole);
    const role = userRole?.toString().toLowerCase() || ''; // Use userRole from context
    console.log('Determined role for navigation:', role);

    if (role === UserRole.BRAND) {
      console.log('Redirecting to brand dashboard');
      return <Navigate to="/brand/dashboard" replace />;
    } else {
      // For creators and all other roles (including admin), go to main dashboard
      console.log('Redirecting to main dashboard');
      return <Navigate to="/dashboard" replace />;
    }
  }

  return children;
};

// --- App Component ---
function App() {
  return (
    <ErrorBoundary>
      <OnboardingProvider>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/admin-setup" element={<AdminSetupPage />} />

          {/* Verification Route */}
          <Route
            path="/verify"
            element={
              <VerificationRoute>
                <VerificationPage />
              </VerificationRoute>
            }
          />

          {/* Protected Routes (using common ProtectedRoute component) */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <ErrorBoundary>
                  <DashboardPage />
                </ErrorBoundary>
              </ProtectedRoute>
            }
          />
          <Route
            path="/onboarding"
            element={
              <OnboardingPage />
            }
          />
          <Route
            path="/brand-onboarding"
            element={
              <BrandOnboardingPage />
            }
          />

          {/* Admin Routes */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute requiredRole={UserRole.ADMIN}>
                <AdminDashboardPage />
              </ProtectedRoute>
            }
          />

          {/* Brand Routes */}
          <Route
            path="/brand/dashboard"
            element={
              <ProtectedRoute requiredRole={UserRole.BRAND}>
                <BrandDashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/brand/campaigns/create"
            element={
              <ProtectedRoute requiredRole={UserRole.BRAND}>
                <CampaignCreationPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/brand/campaigns/:id/edit"
            element={
              <ProtectedRoute requiredRole={UserRole.BRAND}>
                <CampaignEditPage />
              </ProtectedRoute>
            }
          />

          {/* Fallback/Not Found - Consider adding a 404 component */}
          {/* <Route path="*" element={<NotFoundPage />} /> */}
        </Routes>
      </OnboardingProvider>
    </ErrorBoundary>
  );
}

export default App;