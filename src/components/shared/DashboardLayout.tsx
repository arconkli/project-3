import React, { ReactNode } from 'react';
import VerificationBanner from './VerificationBanner';
import BackgroundPattern from '../BackgroundPattern';

interface DashboardLayoutProps {
  children: ReactNode;
  userType: 'creator' | 'brand';
}

/**
 * Shared layout component for dashboard pages
 * Includes the verification banner and common styling
 */
const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children, userType }) => {
  return (
    <div className="min-h-screen bg-black relative">
      <div className="relative z-10">
        {/* Add Verification Banner */}
        <VerificationBanner userType={userType} />
        
        {/* Main content */}
        {children}
      </div>
      <BackgroundPattern />
    </div>
  );
};

export default DashboardLayout; 