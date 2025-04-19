import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { HelpCircle, AlertTriangle, Bug, User, Briefcase } from 'lucide-react';
import BackgroundPattern from '@/components/BackgroundPattern';
import BrandHeader from '@/components/brand/BrandHeader';
import BrandNavigation from '@/components/brand/BrandNavigation';
import BrandStats from '@/components/brand/BrandStats';
import BrandOverview from '@/components/brand/BrandOverview';
import BrandCampaigns from '@/components/brand/BrandCampaigns';
import BrandAnalytics from '@/components/brand/BrandAnalytics';
import BrandSettings from '@/components/brand/BrandSettings';
import BrandBilling from '@/components/brand/BrandBilling';
import BrandCreators from '@/components/brand/BrandCreators';
import CampaignDetailModal from '@/components/brand/CampaignDetailModal';
import SupportSection from '@/components/shared/SupportSection';
import DashboardLayout from '@/components/shared/DashboardLayout';
import { useCampaigns } from '@/hooks/useCampaigns';
import { useAuth } from '@/hooks/useAuthContext';
import useProtectedAction from '@/hooks/useProtectedAction';
import type { Campaign } from '@/types/brand';
import { supabase } from '@/lib/supabaseClient';
import { getBrandProfileByUserId } from '@/services/brand/brandService';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { toast } from 'react-hot-toast';

type ViewType = 'overview' | 'campaigns' | 'creators' | 'analytics' | 'team' | 'billing' | 'settings';

type BrandProfile = {
  id: string;
  name: string;
  logo?: string;
  description?: string;
  website?: string;
  industry?: string;
  contact_email?: string;
  contact_phone?: string;
  status?: string;
  created_at?: string;
  updated_at?: string;
  user_id?: string;
  verified?: boolean;
};

const BrandDashboardPage = () => {
  const navigate = useNavigate();
  const { isEmailVerified } = useAuth();
  const { requireVerification } = useProtectedAction();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<ViewType>('overview');
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [authUser, setAuthUser] = useState<SupabaseUser | null>(null);
  const [brandProfile, setBrandProfile] = useState<BrandProfile | null>(null);
  const [showDebugInfo, setShowDebugInfo] = useState(false);
  const [debugData, setDebugData] = useState<any>(null);
  const [emailVerified, setEmailVerified] = useState(false);

  const {
    brandCampaigns,
    loading: campaignsLoading,
    error: campaignsError,
    refreshCampaigns,
    submitCampaignForApproval,
    getCampaignWithCreators
  } = useCampaigns({
    userId: authUser?.id,
    userType: 'brand'
  });

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      console.log('🔍 BrandDashboardPage - Checking authentication and fetching data...');

      // Set a timeout to prevent infinite loading
      const timeout = setTimeout(() => {
        if (isLoading) {
          console.warn('⚠️ Dashboard data fetch taking too long, checking session state directly');
          // Direct session check as failsafe
          supabase.auth.getSession().then(({ data, error }) => {
            if (error || !data.session) {
              console.error('❌ No valid session found after timeout, redirecting to login');
              navigate('/login');
            } else {
              console.log('✅ Session exists but fetch is slow, forcing loading off');
              setIsLoading(false);
              // Attempt to refresh the page as a last resort
              if (document.visibilityState === 'visible') {
                window.location.reload();
              }
            }
          });
        }
      }, 10000); // 10 second timeout

      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        console.log('🔍 Auth User:', user ? { id: user.id, email: user.email, role: user.app_metadata?.role, confirmed: !!user.email_confirmed_at } : null, 'Auth Error:', authError);

        // Check if we have brand data in localStorage regardless of auth status
        const isBrandLoggedIn = localStorage.getItem('isBrandLoggedIn') === 'true';
        const userDataStr = localStorage.getItem('userData');
        const brandDataStr = localStorage.getItem('brandData');
        const hasLocalStorageData = isBrandLoggedIn && userDataStr && brandDataStr;

        // Handle case when no user session exists
        if (authError || !user) {
          console.log('❌ Authentication failed - No user session:', authError);
          
          if (hasLocalStorageData) {
            console.log('🔑 Found brand data in localStorage, using it instead of session');
            const userData = JSON.parse(userDataStr!);
            const brandData = JSON.parse(brandDataStr!);
            
            // Create a mock user and profile from localStorage data
            setAuthUser({
              id: userData.id,
              email: userData.email,
              user_metadata: { role: 'brand' },
              app_metadata: { role: 'brand' },
              // Add other required properties
              aud: 'authenticated',
              created_at: new Date().toISOString(),
              role: 'authenticated'
            } as SupabaseUser);
            
            setBrandProfile({
              id: userData.brandProfileId || 'temp-' + userData.id,
              name: brandData.name || userData.companyName,
              description: `${brandData.name || userData.companyName} is a company in the ${brandData.industry} industry.`,
              industry: brandData.industry,
              contact_email: brandData.contactEmail || userData.email,
              contact_phone: brandData.contactPhone || '',
              website: brandData.website || '',
              user_id: userData.id,
              verified: false,
              status: 'active',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            });
            
            setIsLoading(false);
            console.log('✅ Using localStorage data for brand dashboard', { userData, brandData });
            return;
          }
          
          // If no localStorage data, redirect to login
          navigate('/login');
          return;
        }

        // User exists in session, check role
        const userRole = user.app_metadata?.role || user.user_metadata?.role;
        if (userRole !== 'brand') {
           console.error(`❌ Authorization failed - User role is '${userRole}', expected 'brand'.`);
           navigate('/');
           return;
        }

        setAuthUser(user);
        console.log('✅ Authentication successful - User:', user.id);

        // If we have localStorage data, use it as a backup plan
        let profile: BrandProfile | null = null;
        
        try {
          console.log(`⏳ Fetching brand profile for user ID: ${user.id}...`);
          profile = await getBrandProfileByUserId(user.id);
          console.log('✅ Brand Profile fetched successfully:', profile);
        } catch (profileError: any) {
          console.error('❌ Error fetching brand profile:', profileError);
          
          // If DB error contains mention of relations not existing, use localStorage
          if (profileError.message.includes('relation') || 
              profileError.message.includes('No brand association') || 
              profileError.message.includes('Brand profile not found')) {
            
            console.log('ℹ️ Database tables may not exist. Checking localStorage for fallback data...');
            
            // Use localStorage data if available
            if (hasLocalStorageData) {
              const userData = JSON.parse(userDataStr!);
              const brandData = JSON.parse(brandDataStr!);
              
              console.log('✅ Using localStorage data as fallback for brand profile');
              profile = {
                id: userData.brandProfileId || 'temp-' + user.id,
                name: brandData.name || userData.companyName || user.email?.split('@')[0] || 'Your Brand',
                description: `${brandData.name || userData.companyName} is a company in the ${brandData.industry} industry.`,
                industry: brandData.industry,
                contact_email: brandData.contactEmail || user.email,
                contact_phone: brandData.contactPhone || '',
                website: brandData.website || '',
                user_id: user.id,
                verified: !!user.email_confirmed_at,
                status: 'active',
                created_at: user.created_at || new Date().toISOString(),
                updated_at: new Date().toISOString()
              };
            } else {
              // Create minimal profile from user data if no localStorage
              console.log('⚠️ No localStorage data available. Creating minimal brand profile from user data.');
              profile = {
                id: 'temp-' + user.id,
                name: user.email?.split('@')[0] || 'Your Brand',
                description: 'Your brand description',
                contact_email: user.email,
                user_id: user.id,
                verified: !!user.email_confirmed_at,
                status: 'active',
                created_at: user.created_at || new Date().toISOString(),
                updated_at: new Date().toISOString()
              };
            }
          } else {
            // Other unexpected errors
            throw profileError;
          }
        }
        
        // Set the profile (either from DB or fallback)
        setBrandProfile(profile);
        
        // Only need to track if email is verified for internal purposes
        setEmailVerified(!!user?.email_confirmed_at);

      } catch (err: any) {
        console.error('❌ Error during data fetching:', err);
        setError(`Failed to load dashboard data: ${err.message || 'Unknown error'}`);
        
        // Check if we can use localStorage as a last resort
        const userDataStr = localStorage.getItem('userData');
        const brandDataStr = localStorage.getItem('brandData');
        
        if (userDataStr && brandDataStr) {
          try {
            const userData = JSON.parse(userDataStr);
            const brandData = JSON.parse(brandDataStr);
            
            console.log('🔄 Attempting to recover using localStorage data after error');
            
            // Create minimal fallback data
            setAuthUser({
              id: userData.id,
              email: userData.email,
              user_metadata: { role: 'brand' },
              app_metadata: { role: 'brand' },
              aud: 'authenticated',
              created_at: new Date().toISOString(),
              role: 'authenticated'
            } as SupabaseUser);
            
            setBrandProfile({
              id: userData.brandProfileId || 'temp-' + userData.id,
              name: brandData.name || userData.companyName || 'Your Brand',
              industry: brandData.industry || 'Technology',
              contact_email: userData.email,
              status: 'active',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            });
            
            // Clear the error since we've recovered
            setError(null);
            
            console.log('✅ Recovered using localStorage data');
          } catch (recoveryErr) {
            console.error('❌ Failed to recover using localStorage:', recoveryErr);
            // Keep the original error
          }
        }
      } finally {
        clearTimeout(timeout); // Clear the timeout if fetch completes normally
        setIsLoading(false);
        console.log('🏁 Data fetching attempt complete.');
      }
    };

    fetchData();
  }, [navigate]);

  useEffect(() => {
    // Only refresh campaigns when the authUser is available and we haven't loaded campaigns yet
    if (authUser?.id && !brandCampaigns.length) {
      console.log('🔄 Refreshing campaigns because authUser ID is available:', authUser.id);
      refreshCampaigns();
    }
  }, [authUser, refreshCampaigns, brandCampaigns.length]);

  const isPageLoading = isLoading || (!brandProfile && !error);

  if (isPageLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-red-500 border-t-transparent"></div>
      </div>
    );
  }

  if (error && !campaignsError) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-white">
        <div className="max-w-md p-6 bg-black/40 border border-red-800 rounded-lg text-center">
           <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
           <h2 className="text-xl font-bold mb-2">Dashboard Data Issue</h2>
           <p className="text-gray-300 mb-4">
             {error.includes('database') || error.includes('relation') || error.includes('does not exist') 
               ? "We're unable to retrieve your brand profile data. This might be because the database tables haven't been set up yet."
               : error}
           </p>
           <div className="flex flex-col space-y-3">
             <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-white"
             >
               Reload Page
             </button>
             <button
              onClick={() => {
                setError(null);
                // Try to use localStorage data as a fallback
                const userDataStr = localStorage.getItem('userData');
                const brandDataStr = localStorage.getItem('brandData');
                
                if (userDataStr && brandDataStr) {
                  try {
                    const userData = JSON.parse(userDataStr);
                    const brandData = JSON.parse(brandDataStr);
                    
                    // Create minimal fallback data
                    setAuthUser({
                      id: userData.id,
                      email: userData.email,
                      user_metadata: { role: 'brand' },
                      app_metadata: { role: 'brand' },
                      aud: 'authenticated',
                      created_at: new Date().toISOString(),
                      role: 'authenticated'
                    } as any);
                    
                    setBrandProfile({
                      id: userData.brandProfileId || 'temp-' + userData.id,
                      name: brandData.name || userData.companyName || 'Your Brand',
                      industry: brandData.industry || 'Technology',
                      contact_email: userData.email,
                      status: 'active',
                      created_at: new Date().toISOString(),
                      updated_at: new Date().toISOString()
                    });
                  } catch (err) {
                    console.error('Failed to use localStorage data for recovery:', err);
                  }
                }
              }}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg text-white"
             >
               Continue with Limited Data
             </button>
           </div>
         </div>
       </div>
    );
  }

  if (campaignsError) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="max-w-md p-6 bg-black/40 border border-red-800 rounded-lg text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Error Loading Campaigns</h2>
          <p className="text-gray-300 mb-4">{campaignsError}</p>
          <button 
            onClick={() => refreshCampaigns()}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-white"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!authUser || !brandProfile) {
      console.error("State error: Auth user or brand profile is null after loading and no error.");
       return (
         <div className="min-h-screen bg-black flex items-center justify-center text-white">
           Unexpected error: Missing user or profile data.
         </div>
       );
  }

  const handleLogout = async () => {
    setShowLogoutConfirm(false);
    console.log('🚫 Logging out...');
    
    // Clear all localStorage data related to brand login
    localStorage.removeItem('userData');
    localStorage.removeItem('brandData');
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('isBrandLoggedIn');
    
    const { error: signOutError } = await supabase.auth.signOut();
    if (signOutError) {
      console.error("Error signing out:", signOutError);
    }
    console.log('✅ Logout successful, navigating to landing page.');
    navigate('/');
  };

  const handleViewAllCampaigns = () => {
    setActiveView('campaigns');
  };

  const handleCreateCampaign = requireVerification(
    () => navigate('/brand/campaigns/create'),
    'create campaigns'
  );

  const handleEditCampaign = (campaign: Campaign) => {
    navigate('/brand/campaigns/create', { state: { editMode: true, campaignData: campaign } });
  };

  const handleContinueDraft = (campaign: Campaign) => {
    console.log("Continuing draft campaign:", campaign);
    navigate('/brand/campaigns/create', { state: { editMode: true, campaignData: campaign } });
  };

  const handleViewCampaign = async (campaign: Campaign) => {
    try {
      const campaignWithCreators = await getCampaignWithCreators(campaign.id.toString());
      setSelectedCampaign(campaignWithCreators);
    } catch (error) {
      console.error('Error fetching campaign with creators:', error);
      setSelectedCampaign(campaign);
    }
  };

  const handleCheckRecords = async () => {
    if (!authUser?.id) return;

    try {
      setShowDebugInfo(true);
      console.log('🔍 Checking database records for debugging...');
      const { checkUserRecords } = await import('@/utils/debugUtils');
      const records = await checkUserRecords(authUser.id);
      setDebugData(records);
    } catch (error) {
      console.error('Error checking records:', error);
      setDebugData({ error: 'Failed to check records' });
    }
  };

  // Helper function to refresh brand profile
  const refetchBrandProfile = async () => {
    console.log('🔄 Refreshing brand profile...');
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        try {
          const profile = await getBrandProfileByUserId(user.id);
          setBrandProfile(profile);
          console.log('✅ Brand Profile refreshed successfully');
        } catch (err) {
          console.error('❌ Error refreshing brand profile, using existing data:', err);
          // Keep using existing profile data
          toast.error('Could not refresh profile data');
        }
      }
    } catch (error) {
      console.error('❌ Error getting current user during profile refresh:', error);
    }
  };

  return (
    <DashboardLayout isLoading={isPageLoading}>
      <div className="flex flex-col min-h-screen bg-black relative">
        <BackgroundPattern />
        
        <div className="relative z-10 flex flex-col min-h-screen">
          <BrandHeader 
            brandName={brandProfile?.name || "Your Brand"}
            onLogout={() => setShowLogoutConfirm(true)}
          />
          
          {/* Top navigation */}
          <div className="w-full max-w-7xl mx-auto px-4">
            <BrandNavigation
              activeView={activeView}
              onViewChange={setActiveView}
            />
          </div>
          
          <main className="flex-1 max-w-7xl mx-auto px-4 py-8">
            <AnimatePresence mode="wait">
              {activeView === 'overview' && (
                <motion.div
                  key="overview"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  <BrandOverview
                    brandProfile={brandProfile}
                    campaigns={brandCampaigns}
                    loading={campaignsLoading}
                    onCreateCampaign={handleCreateCampaign}
                    onViewCampaign={handleViewCampaign}
                    onEditCampaign={handleEditCampaign}
                    onContinueDraft={handleContinueDraft}
                    onViewAllCampaigns={handleViewAllCampaigns}
                    onSubmitForApproval={submitCampaignForApproval}
                  />
                </motion.div>
              )}

              {activeView === 'campaigns' && (
                <motion.div
                  key="campaigns"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                >
                  <BrandCampaigns
                    campaigns={brandCampaigns}
                    onCreateCampaign={handleCreateCampaign}
                    onViewCampaign={handleViewCampaign}
                    onEditCampaign={handleEditCampaign}
                    onContinueDraft={handleContinueDraft}
                    onSubmitForApproval={submitCampaignForApproval}
                  />
                </motion.div>
              )}

              {activeView === 'creators' && (
                <motion.div
                  key="creators"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                >
                  <BrandCreators brandProfile={brandProfile} />
                </motion.div>
              )}

              {activeView === 'analytics' && (
                <motion.div
                  key="analytics"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                >
                  <BrandAnalytics brandProfile={brandProfile} />
                </motion.div>
              )}

              {activeView === 'billing' && (
                <motion.div
                  key="billing"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                >
                  <BrandBilling brandProfile={brandProfile} />
                </motion.div>
              )}

              {activeView === 'settings' && (
                <motion.div
                  key="settings"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                >
                  <BrandSettings
                    authUser={authUser}
                    brandProfile={brandProfile}
                    onProfileUpdate={refetchBrandProfile}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </main>
          
          {selectedCampaign && (
            <CampaignDetailModal
              campaign={selectedCampaign}
              onClose={() => setSelectedCampaign(null)}
              onApprovalSubmit={() => {
                if (selectedCampaign) {
                  requireVerification(() => submitCampaignForApproval(selectedCampaign.id));
                }
              }}
            />
          )}
          
          {showLogoutConfirm && (
            <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-80 backdrop-blur-sm z-50 p-6">
              <div className="p-6 rounded-lg w-full max-w-md bg-black/40 border border-gray-800">
                <h3 className="text-xl font-bold text-white mb-4">Confirm Logout</h3>
                <p className="text-gray-300 mb-6">Are you sure you want to log out of your account?</p>
                <div className="flex justify-end space-x-3">
                  <button 
                    onClick={() => setShowLogoutConfirm(false)}
                    className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleLogout}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded"
                  >
                    Log Out
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default BrandDashboardPage;