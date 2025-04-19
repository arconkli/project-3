import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, FileText, X, Eye, Calendar, DollarSign, TrendingUp, Phone, Mail, Shield, Flag, Video, Users, Building, AlertTriangle } from 'lucide-react';
import type { AdminUser, AdminPermissions } from '@/types/admin';
import type { User } from '@/types/admin';
import { supabase } from '@/lib/supabaseClient';
import AdminPayments from '@/components/admin/AdminPayments';
import AdminUserProfile from '@/components/admin/AdminUserProfile';
import AdminUserCard from '@/components/admin/AdminUserCard';
import { formatMoney } from '@/utils/format';
import { campaignService } from '@/services/campaign';
import CampaignDetailModal from '@/components/shared/CampaignDetailModal';

// Default permissions for new admin users
const DEFAULT_PERMISSIONS: AdminPermissions = {
  reviews: false,
  tickets: false,
  campaigns: false,
  users: false,
  settings: false,
  payments: false,
  reports: false,
  audit: false
};

import AdminHeader from '@/components/admin/AdminHeader';
import AdminNavigation from '@/components/admin/AdminNavigation';
import AdminOverview from '@/components/admin/AdminOverview';
import AdminAnalytics from '@/components/admin/AdminAnalytics';
import AdminSettings from '@/components/admin/AdminSettings';
import ContentReviewList from '@/components/admin/ContentReviewList';
import CampaignApprovalList from '@/components/admin/CampaignApprovalList';
import { Button } from '@/components/ui/Button'; // Changed 'button' to 'Button'

// Define a type for Content Submission (previously ContentReview)
// Adjusted based on direct query to content_submissions
interface ContentSubmission { 
  id: string;
  status: string;
  notes?: string; // Assuming notes might be added directly to submissions later or fetched differently
  created_at: string;
  content_url: string;
  submission_notes?: string;
  creators: { // Renamed from creators:profiles
    id: string;
    full_name?: string;
    username?: string;
    avatar_url?: string;
  } | null;
  campaigns: {
    id: string;
    name?: string;
    brands: {
      id: string;
      name?: string;
      logo_url?: string;
    } | null;
  } | null;
  // Add other relevant fields directly from content_submissions if needed
}

const AdminDashboardPage = () => {
  const navigate = useNavigate();
  // Separate loading states
  const [isUsersLoading, setIsUsersLoading] = useState(false); // Start false, load on demand
  const [isCampaignsLoading, setIsCampaignsLoading] = useState(true);
  const [isSubmissionsLoading, setIsSubmissionsLoading] = useState(false); // RENAMED loading state
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'reviews' | 'campaigns' | 'users' | 'settings' | 'payments' | 'analytics'>('campaigns'); // Add 'analytics' if needed
  const [selectedCampaign, setSelectedCampaign] = useState<any>(null); // Use specific type if available
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [userType, setUserType] = useState<'creators' | 'brands'>('creators');
  const [newAdminData, setNewAdminData] = useState<Partial<AdminUser>>({
    role: 'moderator',
    permissions: DEFAULT_PERMISSIONS
  });
  const [pendingCampaigns, setPendingCampaigns] = useState<any[]>([]); // Use specific type
  const [activeCampaigns, setActiveCampaigns] = useState<any[]>([]); // Use specific type
  const [contentSubmissions, setContentSubmissions] = useState<ContentSubmission[]>([]); // RENAMED state
  const [campaignsInitialized, setCampaignsInitialized] = useState(false);
  const [isDetailsLoading, setIsDetailsLoading] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  // Add state for data quality indicators
  const [isDataStale, setIsDataStale] = useState(false);
  const [isMockData, setIsMockData] = useState(false); // Track if mock data is being used

  // Add pagination state for users
  const [currentUserPage, setCurrentUserPage] = useState(1);
  const [hasMoreUsers, setHasMoreUsers] = useState(true); // Track if more users can be fetched

  // Pagination state for campaigns (assuming fetchCampaigns handles this)
  const [currentPendingPage, setCurrentPendingPage] = useState(1);
  const [currentActivePage, setCurrentActivePage] = useState(1);
  const [pageSize, setPageSize] = useState(25); // Shared page size

  // Add a useRef for tracking initial load
  const initialLoadRef = useRef(false);

  // Fetch users data - MOVED TO SEPARATE FUNCTION AND CONDITIONAL EFFECT
  // useEffect(() => { ... old user fetch logic removed ... }, []);

  // NEW: Function to fetch users based on type and page
  const fetchUsersByType = useCallback(async (page = 1, type = 'creators') => {
    console.log(`Fetching users: type=${type}, page=${page}`);
    setIsUsersLoading(true);
    setError(null);
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    try {
      // 1. Fetch user emails (needed for mapping) - consider caching this if it's large/static
      const { data: authUsers, error: authUsersError } = await supabase
        .from('user_emails')
        .select('id, email');

      if (authUsersError) throw new Error(`Error fetching user emails: ${authUsersError.message}`);

      const emailMap = new Map<string, string>();
      authUsers?.forEach(u => { emailMap.set(u.id, u.email); });
      console.log(`Fetched ${emailMap.size} emails from auth users.`);

      let profilesData: any[] | null = null;
      let profilesError: any = null;
      let transformedUsers: User[] = [];

      if (type === 'creators') {
        // Fetch creator profiles (from 'profiles' table)
        const { data, error } = await supabase
          .from('profiles')
          .select('id, user_id, full_name, username, email, role, status, created_at, avatar_url') // Select specific columns
          .eq('role', 'creator') // Ensure we only fetch creators
          .range(from, to)
          .order('created_at', { ascending: false });
        profilesData = data;
        profilesError = error;
        console.log('Fetched creator profiles page:', profilesData);

        if (profilesError) throw profilesError;

        // Transform creator profiles
        transformedUsers = (profilesData || []).map(profile => {
          const userEmail = profile.email || emailMap.get(profile.user_id) || 'No email found'; // Prefer profile email
          const joinDate = profile.created_at ? new Date(profile.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'Unknown';
          return {
            id: profile.id,
            name: profile.full_name || userEmail.split('@')[0] || 'Unnamed Creator',
            email: userEmail,
            username: profile.username || userEmail.split('@')[0] || 'unknown_creator',
            type: 'creators',
            status: profile.status || 'active',
            followers: 'N/A', // Placeholder - Needs separate query if required
            joinDate: joinDate,
            avatar_url: profile.avatar_url, // Add avatar URL
            metrics: { /* Basic metrics defaults */
              totalViews: 0, totalEarned: 0, totalEarnings: 0, totalPosts: 0, lastActive: 'Unknown', avgEngagement: 0, completedCampaigns: 0, pendingReviews: 0, contentQuality: 0, violationCount: 0, accountAge: '0 days', totalSpent: undefined, activeCampaigns: 0
            },
            verificationLevel: 'none', platforms: [], recentActivity: [], industry: null, website: null, contactName: null
          } as User;
        });

      } else if (type === 'brands') {
        // Fetch brand profiles (from 'brands' table)
         const { data, error } = await supabase
          .from('brands') // CORRECTED: Fetch from 'brands' table
          .select('id, name, contact_email, created_at, logo_url') // REMOVED: user_id as it does not exist
          .range(from, to)
          .order('created_at', { ascending: false });
        profilesData = data;
        profilesError = error;
        console.log('Fetched brand profiles page:', profilesData);

        if (profilesError) throw profilesError;

        // Transform brand profiles
        transformedUsers = (profilesData || []).map(brand => {
          // ADJUSTED: Rely primarily on contact_email, removed user_id fallback
          const userEmail = brand.contact_email || 'No email provided'; 
          const joinDate = brand.created_at ? new Date(brand.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'Unknown';
          return {
            id: brand.id,
            name: brand.name || userEmail.split('@')[0] || 'Unnamed Brand',
            email: userEmail,
            username: brand.name?.toLowerCase().replace(/\s+/g, '') || userEmail.split('@')[0] || 'unknown_brand',
            type: 'brands',
            status: 'active',
            followers: 'N/A',
            joinDate: joinDate,
            avatar_url: brand.logo_url,
            metrics: { /* Basic metrics defaults */
              totalViews: 0, totalSpent: 0, totalPosts: 0, activeCampaigns: 0, completedCampaigns: 0, lastActive: 'Unknown', totalEarned: 0, totalEarnings: 0, avgEngagement: 0, pendingReviews: 0, contentQuality: 0, violationCount: 0, accountAge: '0 days'
            },
            verificationLevel: 'none', platforms: [], recentActivity: [], industry: null, website: null, contactName: null
          } as User;
        });
      }

      console.log(`Combined ${transformedUsers.length} ${type} profiles for page ${page}.`);
      // Append users if page > 1, otherwise replace
      setUsers(prevUsers => page === 1 ? transformedUsers : [...prevUsers, ...transformedUsers]);
      // Check if we likely have more users
      setHasMoreUsers(transformedUsers.length === pageSize);
      setCurrentUserPage(page); // Update current page state

    } catch (error: any) {
      console.error('Error fetching or transforming user data:', error);
      setError(`Failed to load user data: ${error.message}`);
      setUsers([]); // Clear users on error
      setHasMoreUsers(false);
    } finally {
      setIsUsersLoading(false);
    }
  }, [pageSize]); // Include pageSize in dependencies

  // NEW: Effect to fetch users when 'users' tab is active or type/page changes
  useEffect(() => {
    if (activeTab === 'users') {
      // Reset page to 1 when switching type, otherwise fetch current page
      const pageToFetch = userType === users[0]?.type ? currentUserPage : 1;
      if (pageToFetch === 1) setUsers([]); // Clear existing users if resetting to page 1
      fetchUsersByType(pageToFetch, userType);
    } else {
      // Optionally clear users when navigating away from the tab
      // setUsers([]);
      // setCurrentUserPage(1);
      // setHasMoreUsers(true);
    }
    // Intentionally excluding fetchUsersByType from dependencies to control when it runs
  }, [activeTab, userType]); // Run when tab or type changes

  // Fetch Content Submissions (previously Content Reviews)
  const fetchContentSubmissions = useCallback(async () => {
    console.log('Fetching content submissions for review...');
    // setIsReviewsLoading(true);
    setIsSubmissionsLoading(true); // Use renamed state
    setError(null); // Clear previous errors specifically for this fetch
    try {
      // Fetch pending submissions - adjust status/logic as needed
      // Querying content_submissions directly
      const { data, error } = await supabase
        .from('content_submissions') // CORRECTED: Query content_submissions table
        .select(` 
          id,
          status,
          created_at,
          content_url,
          submission_notes,
          creators ( profiles ( id, full_name, username, avatar_url ) ),
          campaigns ( id, name, brands ( id, name, logo_url ) )
          // Add any other direct fields from content_submissions needed
        `)
        .eq('status', 'submitted') // Fetch only submitted items for review
        .order('created_at', { ascending: true });

      if (error) throw error;

      console.log('Fetched content submissions data:', data);
      // setContentReviews((data as ContentReview[]) || []); // Type assertion
      setContentSubmissions((data as ContentSubmission[]) || []); // Use renamed state

    } catch (err: any) {
      // console.error('Error fetching content reviews:', err);
      console.error('Error fetching content submissions:', err); // Updated log message
      setError(`Failed to load content submissions: ${err.message}`);
      // setContentReviews([]); // Clear on error
      setContentSubmissions([]); // Use renamed state
    } finally {
      // setIsReviewsLoading(false);
      setIsSubmissionsLoading(false); // Use renamed state
    }
  }, []); // Add dependencies if needed, e.g., filters

  // Effect to fetch submissions when 'reviews' tab is active
  useEffect(() => {
    if (activeTab === 'reviews') {
      // fetchContentReviews();
      fetchContentSubmissions(); // Call renamed function
    } else {
      // Optionally clear submissions when navigating away
      // setContentSubmissions([]);
    }
    // }, [activeTab, fetchContentReviews]);
  }, [activeTab, fetchContentSubmissions]); // Use renamed function

  // Function to handle banning a user
  const handleBanUser = useCallback(async (userToBan: User) => {
    console.log('Attempting to ban user:', userToBan);
    const isCreator = userToBan.type === 'creators';
    const tableName = isCreator ? 'profiles' : 'brands';
    const userId = userToBan.id;

    if (!userId) {
      console.error('Cannot ban user: User ID is missing.');
      alert('Error: Could not ban user because their ID is missing.');
      return;
    }

    try {
      const { data, error } = await supabase
        .from(tableName)
        .update({ status: 'banned' })
        .eq('id', userId)
        .select('id, status') // Select something to confirm the update
        .single(); // Use single if we expect only one user

      if (error) throw error;

      console.log('User banned successfully:', data);
      alert(`User ${userToBan.name} has been banned.`);

      // Update the user status locally in the `users` state array
      setUsers(currentUsers => 
        currentUsers.map(u => 
          u.id === userId ? { ...u, status: 'banned' } : u
        )
      );
      
      // Close the profile modal
      setSelectedUser(null);

      // Optional: Refresh the current page of users to ensure consistency
      // fetchUsersByType(currentUserPage, userType);

    } catch (err: any) {
      console.error(`Error banning user (ID: ${userId}, Table: ${tableName}):`, err);
      alert(`Failed to ban user: ${err.message || 'Unknown error'}`);
    } 
  }, [supabase, userType, currentUserPage, fetchUsersByType]); // Add dependencies

  const handleLogout = useCallback(() => {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('userData');
    navigate('/');
  }, [navigate]);

  const handleReviewAction = useCallback((action: string, reviewId: string, notes?: string) => {
    // Update review status in database
    const updateReview = async () => {
      try {
        const { error } = await supabase
          .from('content_submissions') // CORRECTED: Update content_submissions table
          .update({ 
            status: action,
            notes: notes,
            reviewer_id: (await supabase.auth.getUser()).data.user?.id
          })
          .eq('id', reviewId);

        if (error) throw error;
      } catch (error) {
        console.error('Error updating review:', error);
      }
    };

    updateReview();
  }, []);

  const handleCampaignAction = useCallback((action: string, campaignId: string) => {
    // Update campaign status in database
    const updateCampaign = async () => {
      try {
        const { error } = await supabase
          .from('campaigns')
          .update({ status: action })
          .eq('id', campaignId);

        if (error) throw error;
      } catch (error) {
        console.error('Error updating campaign:', error);
      }
    };

    updateCampaign();
  }, []);

  const handleCreateAdmin = useCallback((adminData: Partial<AdminUser>) => {
    // Create new admin user in database
    const createAdmin = async () => {
      try {
        const { error } = await supabase
          .from('admin_users')
          .insert([adminData]);

        if (error) throw error;
      } catch (error) {
        console.error('Error creating admin:', error);
      }
    };

    createAdmin();
  }, []);

  const handleViewUser = useCallback((user) => {
    setSelectedUser(user);
  }, []);

  const handleApproveCampaign = useCallback((campaign: Campaign) => {
    console.log('Admin approved campaign:', campaign);
    setIsCampaignsLoading(true);
    campaignService.approveCampaign(campaign.id)
      .then(async () => {
        try {
          // Update campaign status to active
          const { data, error } = await supabase
            .from('campaigns')
            .update({ 
              status: 'active',
              updated_at: new Date().toISOString()
            })
            .eq('id', campaign.id)
            .select();

          if (error) throw error;
          
          console.log('Campaign status updated to active:', data);

          // Refresh all campaign lists
          console.log('Refreshing campaign lists after approval...');
          const [pendingCampaignsData, activeCampaignsData] = await Promise.all([
            campaignService.getAllPendingCampaigns(),
            campaignService.getAllActiveCampaigns()
          ]);

          console.log('Fetched updated campaign lists:', {
            pendingCount: pendingCampaignsData?.length || 0,
            activeCount: activeCampaignsData?.length || 0
          });
          
          // Make sure we're updating state with the new data (use empty arrays as fallbacks)
          setPendingCampaigns(pendingCampaignsData || []);
          setActiveCampaigns(activeCampaignsData || []);
          
          alert(`Campaign "${campaign.title}" approved successfully!`);
        } catch (err) {
          console.error('Error during campaign approval process:', err);
          alert(`Error during approval process: ${err.message || String(err)}`);
        } finally {
          setIsCampaignsLoading(false);
        }
      })
      .catch(err => {
        console.error('Error approving campaign:', err);
        alert(`Error approving campaign: ${err.message || String(err)}`);
        setIsCampaignsLoading(false);
      });
  }, []);

  const handleRejectCampaign = useCallback((campaign: Campaign, reason: string) => {
    console.log('Admin rejected campaign:', campaign, 'Reason:', reason);
    campaignService.rejectCampaign(campaign.id, reason)
      .then(() => {
        alert(`Campaign "${campaign.title}" rejected.`);
        // Refresh campaigns list
        campaignService.getAllPendingCampaigns()
          .then(campaigns => setPendingCampaigns(campaigns))
          .catch(err => console.error('Error refreshing campaigns:', err));
      })
      .catch(err => {
        console.error('Error rejecting campaign:', err);
        alert(`Error rejecting campaign: ${err}`);
      });
  }, []);

  const handleApproveCampaignEdit = useCallback((editId: string, notes?: string) => {
    console.log('Admin approving campaign edit:', editId, notes);
    setIsCampaignsLoading(true);
    campaignService.approveCampaignEdit(editId, notes)
      .then(async (result) => {
        console.log('Campaign edit approval result:', result);
        
        try {
          // Refresh all campaign lists
          console.log('Refreshing all campaign data after approving edit...');
          
          // Use Promise.allSettled to ensure we continue even if one request fails
          const [pendingResult, activeResult] = await Promise.allSettled([
            campaignService.getAllPendingCampaigns(),
            campaignService.getAllActiveCampaigns()
          ]);
          
          // Log the results of each promise
          console.log('Refresh results:', {
            pendingCampaigns: pendingResult.status === 'fulfilled' ? 
              `Success: ${pendingResult.value?.length || 0} campaigns` : 
              `Failed: ${pendingResult.reason}`,
            activeCampaigns: activeResult.status === 'fulfilled' ? 
              `Success: ${activeResult.value?.length || 0} campaigns` : 
              `Failed: ${activeResult.reason}`,
          });
          
          // Update state with the results, handling both fulfilled and rejected promises
          setPendingCampaigns(pendingResult.status === 'fulfilled' ? pendingResult.value || [] : []);
          setActiveCampaigns(activeResult.status === 'fulfilled' ? activeResult.value || [] : []);
          
          alert(`Campaign edit approved successfully!`);
        } catch (err) {
          console.error('Error refreshing data after approving edit:', err);
          // Still consider the operation successful since the edit was approved
          alert(`Campaign edit approved, but there was an issue refreshing the data. Please reload the page.`);
        } finally {
          setIsCampaignsLoading(false);
        }
      })
      .catch(err => {
        console.error('Error approving campaign edit:', err);
        alert(`Error approving campaign edit: ${err.message || String(err)}`);
        setIsCampaignsLoading(false);
      });
  }, []);

  const handleRejectCampaignEdit = useCallback((editId: string, reason: string) => {
    console.log('Admin rejecting campaign edit:', editId, 'Reason:', reason);
    setIsCampaignsLoading(true);
    
    campaignService.rejectCampaignEdit(editId, reason)
      .then(async (result) => {
        console.log('Campaign edit rejection result:', result);
        
        try {
          // Consider the operation successful
          alert(`Campaign edit rejected successfully.`);
        } finally {
          setIsCampaignsLoading(false);
        }
      })
      .catch(err => {
        console.error('Error rejecting campaign edit:', err);
        alert(`Error rejecting campaign edit: ${err.message || String(err)}`);
        setIsCampaignsLoading(false);
      });
  }, []);

  // Modify the fetchCampaigns function to add a loading delay and preload data
  const fetchCampaigns = useCallback(async (options: { showLoading?: boolean, isInitialLoad?: boolean } = {}) => {
    const { showLoading = true, isInitialLoad = false } = options;
    
    if (showLoading) {
      setIsCampaignsLoading(true);
    }
    
    setError(null);
    setIsDataStale(false);
    setIsMockData(false);
    
    try {
      console.log('Fetching pending and active campaigns for AdminDashboardPage...');
      
      // If it's the initial load, try to preload the dashboard data
      // REMOVED: preloadDashboardData call as it doesn't exist
      // if (isInitialLoad) {
      //   try {
      //     await campaignService.preloadDashboardData();
      //   } catch (err) {
      //     console.error("Error in preload:", err);
      //   }
      // }
      
      // Use Promise.allSettled to handle partial failures
      const results = await Promise.allSettled([
        campaignService.getAllPendingCampaigns(currentPendingPage, pageSize),
        campaignService.getAllActiveCampaigns(currentActivePage, pageSize)
      ]);
      
      // Process each result independently
      // Result for pending campaigns
      if (results[0].status === 'fulfilled') {
        const pending = results[0].value;
        console.log('Fetched pending campaigns:', pending);
        
        // Check if the data is stale or mocked
        if (pending.length > 0) {
          if (pending.some(c => c.isStale)) {
            setIsDataStale(true);
            console.log('WARNING: Using stale pending campaigns data');
          }
          if (pending.some(c => c.isMockData)) {
            setIsMockData(true);
            console.log('WARNING: Using mock pending campaigns data');
          }
        }
        
        // Clean the data by removing our special flags before setting state
        const cleanedPending = pending.map(c => {
          const {isStale, isMockData, ...cleanCampaign} = c;
          return cleanCampaign;
        });
        
        setPendingCampaigns(cleanedPending || []);
      } else {
        console.error('Error fetching pending campaigns:', results[0].reason);
        setPendingCampaigns([]);
      }
      
      // Result for active campaigns
      if (results[1].status === 'fulfilled') {
        const active = results[1].value;
        console.log('Fetched active campaigns:', active);
        
        // Check if the data is stale or mocked (and don't override if already set to true)
        if (active.length > 0) {
          if (active.some(c => c.isStale)) {
            setIsDataStale(true);
            console.log('WARNING: Using stale active campaigns data');
          }
          if (active.some(c => c.isMockData)) {
            setIsMockData(true);
            console.log('WARNING: Using mock active campaigns data');
          }
        }
        
        // Clean the data by removing our special flags before setting state
        const cleanedActive = active.map(c => {
          const {isStale, isMockData, ...cleanCampaign} = c;
          return cleanCampaign;
        });
        
        setActiveCampaigns(cleanedActive || []);
      } else {
        console.error('Error fetching active campaigns:', results[1].reason);
        setActiveCampaigns([]);
      }
      
      setCampaignsInitialized(true);
    } catch (err: any) {
      console.error('Error in fetchCampaigns:', err);
      setError('Failed to load campaigns. ' + err.message);
      setPendingCampaigns([]);
      setActiveCampaigns([]);
      setCampaignsInitialized(true);
    } finally {
      if (showLoading) {
        setIsCampaignsLoading(false);
      }
    }
  }, [currentPendingPage, currentActivePage, pageSize]);

  // Update the polling effect to avoid duplicate fetches on first render
  useEffect(() => {
    // Only fetch on the initial load if not already initialized
    if (!campaignsInitialized && !initialLoadRef.current) {
      initialLoadRef.current = true;
      fetchCampaigns({ isInitialLoad: true });
    }
    
    // Set up polling every 60 seconds to refresh the data
    const pollingInterval = setInterval(() => {
      // Only refresh in the background if we're not already loading
      if (!isCampaignsLoading) {
        console.log('Refreshing campaign data in the background...');
        fetchCampaigns({ showLoading: false });
      }
    }, 60000); // 60 seconds
    
    // Clean up the interval when the component unmounts
    return () => clearInterval(pollingInterval);
  }, [fetchCampaigns, campaignsInitialized, isCampaignsLoading]);

  // Remove the useEffect that depends on pagination changes, as it creates duplicate fetches
  // Instead, add an explicit effect for pagination changes
  useEffect(() => {
    if (campaignsInitialized) { // Only run if we've already initialized once
      fetchCampaigns();
    }
  }, [currentPendingPage, currentActivePage, pageSize]);

  // Check if either process is loading for the main spinner
  const isPageLoading = isUsersLoading || isCampaignsLoading;

  // Function to manually refresh campaign data
  const handleRefreshCampaigns = useCallback(async () => {
    setIsCampaignsLoading(true);
    try {
      // Call the admin function to refresh campaign metrics
      const { data, error } = await supabase.rpc('admin_refresh_campaign_metrics');
      
      if (error) throw error;
      
      console.log('Campaign metrics refreshed:', data);
      
      // Re-fetch campaigns
      await fetchCampaigns();
      
    } catch (err) {
      console.error('Error refreshing campaign data:', err);
      setError('Failed to refresh campaign data. Please try again.');
    } finally {
      setIsCampaignsLoading(false);
    }
  }, [fetchCampaigns]);

  // Function to handle page changes for pending campaigns
  const handlePendingPageChange = useCallback((page: number) => {
    setCurrentPendingPage(page);
  }, []);

  // Function to handle page changes for active campaigns
  const handleActivePageChange = useCallback((page: number) => {
    setCurrentActivePage(page);
  }, []);

  // Function to handle page size changes
  const handlePageSizeChange = useCallback((size: number) => {
    setPageSize(size);
    // Reset to first page when changing page size
    setCurrentPendingPage(1);
    setCurrentActivePage(1);
  }, []);

  // Add handlers for user pagination
  const handleNextUserPage = () => {
    if (hasMoreUsers && !isUsersLoading) {
      fetchUsersByType(currentUserPage + 1, userType);
    }
  };

  const handlePrevUserPage = () => {
    if (currentUserPage > 1 && !isUsersLoading) {
      // For simplicity, re-fetch from page 1 up to the previous page end
      // A more optimized approach might cache pages, but this works
      setCurrentUserPage(1); // Reset page state
      setUsers([]); // Clear users
      fetchUsersByType(1, userType); // Refetch page 1
      // We can't easily go "back" without re-fetching or caching previous pages
      // Let's just disable "Prev" for now if page is 1
    }
  };

  if (isPageLoading) { // Use combined loading state for main spinner
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-red-500 border-t-transparent" />
      </div>
    );
  }

  // Sample payment history data
  const samplePaymentHistory = [
    {
      id: 'pmt_1',
      amount: 2500,
      date: '2025-03-10',
      status: 'completed',
      method: 'Bank Transfer',
      campaign: 'Summer Collection'
    },
    {
      id: 'pmt_2',
      amount: 1800,
      date: '2025-03-01',
      status: 'completed',
      method: 'PayPal',
      campaign: 'Tech Launch'
    },
    {
      id: 'pmt_3',
      amount: 950,
      date: '2025-02-15',
      status: 'pending',
      method: 'Bank Transfer',
      campaign: 'Spring Campaign'
    }
  ];

  // Sample users data
  const sampleUsers = [
    {
      name: 'John Smith',
      email: 'john@creator.com',
      phone: '+1 (555) 123-4567',
      username: 'creator.style',
      type: 'creator',
      status: 'active',
      followers: '2.1M',
      joinDate: 'Jan 2025',
      metrics: {
        totalViews: 12500000,
        totalEarnings: 24500,
        totalEarned: 24500,
        avgEarningsPerCampaign: 2040,
        campaignCompletionRate: 92,
        totalPosts: 156,
        avgEngagement: 5.2,
        completedCampaigns: 12,
        pendingReviews: 2,
        lastActive: '2 hours ago',
        contentQuality: 8.5,
        violationCount: 0,
        accountAge: '3 months'
      },
      paymentHistory: samplePaymentHistory,
      verificationLevel: 'verified',
      platforms: ['TikTok', 'Instagram', 'YouTube'],
      connectedAccounts: [
        {
          platform: 'TikTok',
          username: 'creator.style',
          followers: '1.2M',
          isVerified: true,
          addedDate: '2024-12-01',
          status: 'active'
        },
        {
          platform: 'Instagram',
          username: 'creator.style',
          followers: '850K',
          isVerified: true,
          addedDate: '2024-12-15',
          status: 'active'
        },
        {
          platform: 'YouTube',
          username: 'CreatorStyle',
          followers: '250K',
          isVerified: false,
          addedDate: '2025-01-10',
          status: 'active'
        }
      ],
      campaigns: [
        {
          id: 'camp_1',
          title: 'Summer Collection',
          status: 'completed',
          earned: 3500,
          views: 1200000,
          startDate: '2025-01-01',
          endDate: '2025-02-01',
          platform: 'TikTok'
        },
        {
          id: 'camp_2',
          title: 'Spring Launch',
          status: 'active',
          earned: 2100,
          views: 800000,
          startDate: '2025-02-15',
          endDate: '2025-03-15',
          platform: 'Instagram'
        },
        {
          id: 'camp_3',
          title: 'Tech Review',
          status: 'completed',
          earned: 4200,
          views: 1500000,
          startDate: '2025-01-15',
          endDate: '2025-02-15',
          platform: 'YouTube'
        }
      ],
      recentActivity: [
        {
          type: 'campaign',
          description: 'Submitted new content for review',
          timestamp: '2 hours ago'
        },
        {
          type: 'payment',
          description: 'Received campaign payout',
          timestamp: '1 day ago'
        }
      ],
      paymentInfo: {
        method: 'Bank Transfer',
        details: '****4321'
      }
    },
    {
      name: 'Fashion Brand',
      username: 'fashionbrand',
      type: 'brand',
      status: 'active',
      followers: 'N/A',
      joinDate: 'Feb 2025',
      metrics: {
        totalViews: 8500000,
        totalEarnings: 0,
        totalSpent: 185000,
        totalPosts: 24,
        avgEngagement: 4.8,
        completedCampaigns: 8,
        activeCampaigns: 3,
        activeCreators: 45,
        pendingReviews: 3,
        lastActive: '1 hour ago',
        contentQuality: 9.0,
        violationCount: 0,
        accountAge: '2 months'
      },
      verificationLevel: 'verified',
      platforms: ['TikTok', 'Instagram'],
      recentActivity: [
        {
          type: 'campaign',
          description: 'Created new campaign',
          timestamp: '1 hour ago'
        },
        {
          type: 'review',
          description: 'Approved creator content',
          timestamp: '3 hours ago'
        }
      ],
      campaigns: [],
      paymentInfo: {
        method: 'Credit Card',
        details: '****5678'
      }
    }
  ];

  console.log('Final users state:', users);
  console.log('Current userType:', userType);

  const handleViewCampaignDetails = async (campaignId: string) => {
    console.log('Fetching details for campaign:', campaignId);
    setIsDetailsLoading(true);
    try {
      const campaignData = await campaignService.getCampaignById(campaignId, true);
      console.log('[handleViewCampaignDetails] Fetched Campaign Data (check for brand):', campaignData);
      console.log('[handleViewCampaignDetails] Data BEFORE setSelectedCampaign:', JSON.stringify(campaignData, null, 2));
      setSelectedCampaign(campaignData);
      setIsDetailsModalOpen(true);
    } catch (error) {
      console.error('Error fetching campaign details:', error);
      // TODO: Show error toast to user
    } finally {
      setIsDetailsLoading(false);
    }
  };

  // Add a warning banner component to show when data is stale or mocked
  const DataQualityBanner = () => {
    if (!isDataStale && !isMockData) return null;
    
    return (
      <div className="bg-amber-600 text-white px-4 py-2 mb-4 rounded-md flex items-center justify-between">
        <div className="flex items-center">
          <AlertTriangle className="mr-2" size={18} />
          <span>
            {isMockData ? 
              'Database connection issue - showing sample data for demonstration purposes.' : 
              'Showing cached data that may not reflect the latest changes.'}
          </span>
        </div>
        <button 
          onClick={() => fetchCampaigns()}
          className="px-3 py-1 bg-white text-amber-600 rounded-md text-sm font-medium hover:bg-amber-50"
        >
          Retry
        </button>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-black">
      <AdminHeader onLogout={handleLogout} />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AdminNavigation activeTab={activeTab} onTabChange={setActiveTab} />
        
        {/* Data Quality Warning Banner */}
        {(isDataStale || isMockData) && <DataQualityBanner />}

        {/* Tab Content */}
        {activeTab === 'overview' && <AdminOverview />}
        {activeTab === 'reviews' && (
          <div className="mt-4">
            {isSubmissionsLoading ? ( // Use renamed state
              <p>Loading content for review...</p>
            ) : error && activeTab === 'reviews' ? ( // Check if the error belongs to this tab
              <p className="text-red-500">Error: {error}</p>
            ) : contentSubmissions.length === 0 ? ( // Use renamed state
               <p>No content submitted for review.</p>
            ): (
              <ContentReviewList
                reviews={contentSubmissions} // Use renamed state (assuming ContentReviewList can handle ContentSubmission type or needs adjustment)
                onAction={handleReviewAction} // Need to ensure handleReviewAction updates content_submissions table now
                // Pass other necessary props like isLoading if the component supports it
              />
            )}
          </div>
        )}
        {activeTab === 'analytics' && <AdminAnalytics />}
        {activeTab === 'campaigns' && (
          <div className="mt-4">
            <CampaignApprovalList 
              campaigns={pendingCampaigns}
              activeCampaigns={activeCampaigns} 
              pendingEdits={[]}
              onViewDetails={handleViewCampaignDetails}
              onApprove={handleApproveCampaign}
              onReject={handleRejectCampaign}
              onApproveEdit={handleApproveCampaignEdit}
              onRejectEdit={handleRejectCampaignEdit}
              isLoading={isCampaignsLoading}
              isMockData={isMockData}
            />
          </div>
        )}
        {activeTab === 'settings' && (
          <AdminSettings 
            onCreateAdmin={handleCreateAdmin}
          />
        )}
        {activeTab === 'users' && (
          <div className="mt-8">
            <div className="flex justify-between items-center mb-4">
              <div className="flex space-x-2">
                <Button
                  variant={userType === 'creators' ? 'default' : 'outline'}
                  onClick={() => { setUserType('creators'); setCurrentUserPage(1); setUsers([]); }} // Reset page and users on type switch
                >
                  Creators ({/* Add count here if available */})
                </Button>
                <Button
                  variant={userType === 'brands' ? 'default' : 'outline'}
                  onClick={() => { setUserType('brands'); setCurrentUserPage(1); setUsers([]); }} // Reset page and users on type switch
                >
                  Brands ({/* Add count here if available */})
                </Button>
              </div>
              {/* Add Search Bar here if needed */}
            </div>

            {isUsersLoading && users.length === 0 ? ( // Show loading only on initial load for the tab/type
              <p>Loading users...</p>
            ) : error ? (
              <p className="text-red-500">Error: {error}</p>
            ) : users.length === 0 ? (
               <p>No {userType} found.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {users.map((user) => (
                  <AdminUserCard key={user.id} user={user} onViewDetails={handleViewUser} />
                ))}
              </div>
            )}
             {/* Pagination Controls */}
             <div className="flex justify-center mt-6 space-x-2">
               <Button onClick={handlePrevUserPage} disabled={currentUserPage <= 1 || isUsersLoading}>
                 Previous
               </Button>
               <span className="self-center">Page {currentUserPage}</span>
               <Button onClick={handleNextUserPage} disabled={!hasMoreUsers || isUsersLoading}>
                 {isUsersLoading ? 'Loading...' : 'Next'}
               </Button>
             </div>
          </div>
        )}
        {activeTab === 'payments' && (
          <AdminPayments />
        )}
      </main>

      {/* Campaign Approval Modal */}
      {selectedCampaign && isDetailsModalOpen && (
        <CampaignDetailModal
          campaign={selectedCampaign}
          isOpen={isDetailsModalOpen}
          onClose={() => {
            setSelectedCampaign(null);
            setIsDetailsModalOpen(false);
          }}
          onApprove={handleApproveCampaign}
          onReject={handleRejectCampaign}
          mode="admin"
        />
      )}
      
      {/* User Profile Modal */}
      {selectedUser && (
        <AdminUserProfile
          user={selectedUser}
          isOpen={!!selectedUser}
          onClose={() => setSelectedUser(null)}
          onBanUser={handleBanUser}
        />
      )}

      {/* Add controls for refreshing data and pagination */}
      <div className="dashboard-controls">
        <button 
          className="refresh-button"
          onClick={handleRefreshCampaigns}
          disabled={isCampaignsLoading}
        >
          {isCampaignsLoading ? 'Refreshing...' : 'Refresh Data'}
        </button>
        
        <div className="page-size-control">
          <label>Items per page:</label>
          <select 
            value={pageSize} 
            onChange={(e) => handlePageSizeChange(Number(e.target.value))}
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
          </select>
        </div>
      </div>
      
      {/* Add pagination controls for campaigns */}
      {activeTab === 'campaigns' && !isCampaignsLoading && (
        <div className="pagination-controls">
          <div className="pagination-section">
            <h4>Pending Campaigns</h4>
            <div className="pagination-buttons">
              <button 
                onClick={() => handlePendingPageChange(currentPendingPage - 1)}
                disabled={currentPendingPage === 1}
              >
                Previous
              </button>
              <span>Page {currentPendingPage}</span>
              <button 
                onClick={() => handlePendingPageChange(currentPendingPage + 1)}
                disabled={pendingCampaigns.length < pageSize}
              >
                Next
              </button>
            </div>
          </div>
          
          <div className="pagination-section">
            <h4>Active Campaigns</h4>
            <div className="pagination-buttons">
              <button 
                onClick={() => handleActivePageChange(currentActivePage - 1)}
                disabled={currentActivePage === 1}
              >
                Previous
              </button>
              <span>Page {currentActivePage}</span>
              <button 
                onClick={() => handleActivePageChange(currentActivePage + 1)}
                disabled={activeCampaigns.length < pageSize}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboardPage;