'use client';

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BackgroundPattern from '@/components/shared/BackgroundPattern';
import CreatorDashboard from '@/components/creator/CreatorDashboard';
import SupportSection from '@/components/shared/SupportSection';
import DashboardLayout from '@/components/shared/DashboardLayout';
import { useAuth } from '@/hooks/useAuthContext';
import { UserRole } from '@/types/auth';
import AdminDashboardPage from './AdminDashboardPage';
import BrandDashboardPage from './BrandDashboardPage';

export default function DashboardPage() {
  const { user, userProfile, loading, userRole, signOut } = useAuth();
  const [authTimeout, setAuthTimeout] = useState(false);
  
  useEffect(() => {
    console.log('DashboardPage rendered with:', {
      userExists: !!user,
      userProfileExists: !!userProfile,
      isLoading: loading,
      userRole: userRole
    });

    // Set a timeout to prevent infinite loading
    const timeout = setTimeout(() => {
      if (loading) {
        console.warn('Auth loading taking too long in DashboardPage. Setting timeout flag.');
        setAuthTimeout(true);
      }
    }, 10000); // 10 seconds

    return () => clearTimeout(timeout);
  }, [user, userProfile, loading]);

  // If we've hit the timeout but are still loading, force render anyway
  if (loading && !authTimeout) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-500"></div>
        <p className="ml-3 text-white">Loading your dashboard...</p>
      </div>
    );
  }

  // Determine which dashboard component to render based on role
  let DashboardComponent;
  switch (userRole) {
    case UserRole.ADMIN:
      DashboardComponent = AdminDashboardPage;
      break;
    case UserRole.BRAND:
      DashboardComponent = BrandDashboardPage;
      break;
    case UserRole.CREATOR:
    default: // Default to CreatorDashboard if role is null or creator
      DashboardComponent = CreatorDashboard;
      break;
  }

  // Determine userType for layout based on role
  const layoutUserType = userRole === UserRole.BRAND ? 'brand' : 'creator';

  return (
    <DashboardLayout userType={layoutUserType}>
      <div className="w-full">
        <DashboardComponent user={user} signOut={signOut} userId={user?.id} />
        <div className="max-w-7xl mx-auto px-4 pb-8">
          <div style={{ backgroundColor: '#000000', position: 'relative', zIndex: 20 }}>
            <SupportSection userType={layoutUserType} />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}