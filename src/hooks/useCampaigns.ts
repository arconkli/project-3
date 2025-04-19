import { useState, useEffect, useCallback } from 'react';
import { campaignService } from '@/services/campaign';
import type { Campaign, CampaignApplication, CampaignSubmission } from '@/services/campaign/types';
import { supabase } from '@/lib/supabaseClient';
import { getBrandProfileByUserId } from '@/services/brand/brandService';

// Add a helper function to create mock campaigns
const createMockCampaigns = (userId: string): Campaign[] => {
  // Generate a more diverse set of mock campaigns with different statuses
  return [
    {
      id: 'mock-1',
      brand_id: userId,
      title: 'Instagram Product Showcase',
      description: 'A campaign to showcase our latest product line through Instagram posts and stories.',
      status: 'active',
      budget: 2500,
      content_type: 'image',
      requirements: {
        platforms: ['instagram'],
        contentLength: 'Multiple posts and stories',
        theme: 'Product showcase with lifestyle elements',
        deliverables: '3 feed posts, 5 stories'
      },
      metrics: {
        views: 12500,
        engagement: 850,
        clicks: 320
      },
      created_at: new Date(Date.now() - 1000000000).toISOString(),
      updated_at: new Date(Date.now() - 500000).toISOString(),
      start_date: new Date(Date.now() - 864000000).toISOString(), // 10 days ago
      end_date: new Date(Date.now() + 1728000000).toISOString(), // 20 days from now
    },
    {
      id: 'mock-2',
      brand_id: userId,
      title: 'TikTok Challenge Campaign',
      description: 'Launch a viral TikTok challenge to increase brand awareness among Gen Z audiences.',
      status: 'draft',
      budget: 3000,
      content_type: 'video',
      requirements: {
        platforms: ['tiktok'],
        contentLength: '15-60 seconds',
        theme: 'Dance challenge with branded elements',
        hashtag: '#YourBrandChallenge'
      },
      metrics: {
        views: 0,
        engagement: 0
      },
      created_at: new Date(Date.now() - 432000000).toISOString(), // 5 days ago
      updated_at: new Date(Date.now() - 259200000).toISOString(), // 3 days ago
      start_date: new Date(Date.now() + 604800000).toISOString(), // 7 days from now
      end_date: new Date(Date.now() + 3024000000).toISOString(), // 35 days from now
    },
    {
      id: 'mock-3',
      brand_id: userId,
      title: 'YouTube Product Review Series',
      description: 'In-depth product reviews from tech influencers on YouTube.',
      status: 'pending_approval',
      budget: 5000,
      content_type: 'video',
      requirements: {
        platforms: ['youtube'],
        contentLength: '10-15 minutes',
        theme: 'Honest product review with demonstration',
        deliverables: '1 full review video'
      },
      metrics: {
        views: 0,
        engagement: 0
      },
      created_at: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
      updated_at: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
      start_date: new Date(Date.now() + 1209600000).toISOString(), // 14 days from now
      end_date: new Date(Date.now() + 4233600000).toISOString(), // 49 days from now
    },
    {
      id: 'mock-4',
      brand_id: userId,
      title: 'Multi-Platform Holiday Campaign',
      description: 'Seasonal holiday-themed content across multiple social platforms.',
      status: 'completed',
      budget: 8000,
      content_type: 'mixed',
      requirements: {
        platforms: ['instagram', 'tiktok', 'youtube'],
        contentLength: 'Varied by platform',
        theme: 'Holiday spirit with product integration',
        deliverables: '1 YouTube video, 3 Instagram posts, 2 TikTok videos'
      },
      metrics: {
        views: 75000,
        engagement: 4200,
        clicks: 1800
      },
      created_at: new Date(Date.now() - 7776000000).toISOString(), // 90 days ago
      updated_at: new Date(Date.now() - 3456000000).toISOString(), // 40 days ago
      start_date: new Date(Date.now() - 5184000000).toISOString(), // 60 days ago
      end_date: new Date(Date.now() - 2592000000).toISOString(), // 30 days ago
    }
  ];
};

interface UseCampaignsProps {
  userId?: string;
  userType?: 'brand' | 'creator' | 'admin';
}

interface UseCampaignsReturn {
  // Campaigns data
  brandCampaigns: Campaign[];
  availableCampaigns: Campaign[];
  creatorCampaigns: Campaign[];
  pendingCampaigns: Campaign[];
  
  // Applications and submissions
  creatorApplications: CampaignApplication[];
  creatorSubmissions: CampaignSubmission[];
  
  // Loading and error states
  loading: boolean;
  error: string | null;
  
  // Actions
  refreshCampaigns: () => Promise<void>;
  createCampaign: (data: any) => Promise<Campaign>;
  updateCampaign: (campaignId: string, data: any) => Promise<Campaign>;
  submitCampaignForApproval: (campaignId: string) => Promise<Campaign>;
  approveCampaign: (campaignId: string) => Promise<Campaign>;
  rejectCampaign: (campaignId: string, reason?: string) => Promise<Campaign>;
  joinCampaign: (campaignId: string, selectedPlatforms?: string[]) => Promise<CampaignApplication>;
  submitContent: (data: any) => Promise<CampaignSubmission>;
  getCampaignWithCreators: (campaignId: string) => Promise<Campaign>;
}

export const useCampaigns = ({ userId, userType }: UseCampaignsProps = {}): UseCampaignsReturn => {
  const [brandCampaigns, setBrandCampaigns] = useState<Campaign[]>([]);
  const [availableCampaigns, setAvailableCampaigns] = useState<Campaign[]>([]);
  const [creatorCampaigns, setCreatorCampaigns] = useState<Campaign[]>([]);
  const [pendingCampaigns, setPendingCampaigns] = useState<Campaign[]>([]);
  const [creatorApplications, setCreatorApplications] = useState<CampaignApplication[]>([]);
  const [creatorSubmissions, setCreatorSubmissions] = useState<CampaignSubmission[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch campaigns based on user type
  const refreshCampaigns = useCallback(async () => {
    if (!userId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // For brands, fetch their campaigns
      if (userType === 'brand') {
        console.log('🔄 Fetching brand campaigns for user ID:', userId);
        try {
          const campaigns = await campaignService.getBrandCampaigns(userId);
          setBrandCampaigns(campaigns);
          console.log('✅ Successfully fetched brand campaigns:', campaigns.length);
        } catch (err: any) {
          console.error('❌ Error fetching brand campaigns:', err);
          
          // Check if the error is related to missing tables
          if (err.message?.includes('relation') || err.message?.includes('does not exist')) {
            console.log('ℹ️ Database tables not found. Creating mock campaigns for demo purposes.');
            
            // Create mock campaigns for demo purposes
            const mockCampaigns = createMockCampaigns(userId);
            setBrandCampaigns(mockCampaigns);
            
            console.log('✅ Using mock campaign data:', mockCampaigns);
          } else {
            // For other errors, propagate them
            throw err;
          }
        }
      }
      
      // For creators, fetch available campaigns and their applications
      else if (userType === 'creator') {
        try {
          const [available, applications, submissions] = await Promise.all([
            campaignService.getAvailableCampaigns(),
            campaignService.getCreatorApplications(userId),
            campaignService.getCreatorSubmissions(userId)
          ]);
          
          setAvailableCampaigns(available);
          setCreatorApplications(applications);
          setCreatorSubmissions(submissions);
          
          // Extract campaigns from applications to get creator's campaigns
          const creatorCampaignsFromApps = applications
            .filter(app => app.status === 'approved')
            .map(app => app.campaign)
            .filter((campaign): campaign is Campaign => Boolean(campaign));
          
          setCreatorCampaigns(creatorCampaignsFromApps);
        } catch (err: any) {
          console.error('❌ Error fetching creator campaigns:', err);
          
          // Handle missing tables for creator view
          if (err.message?.includes('relation') || err.message?.includes('does not exist')) {
            console.log('ℹ️ Database tables not found. Using empty data for creator view.');
            setAvailableCampaigns([]);
            setCreatorApplications([]);
            setCreatorSubmissions([]);
            setCreatorCampaigns([]);
          } else {
            throw err;
          }
        }
      }
      
      // For admins, fetch pending campaigns
      else if (userType === 'admin') {
        try {
          const pending = await campaignService.getAllPendingCampaigns();
          setPendingCampaigns(pending);
        } catch (err: any) {
          console.error('❌ Error fetching admin campaigns:', err);
          
          // Handle missing tables for admin view
          if (err.message?.includes('relation') || err.message?.includes('does not exist')) {
            console.log('ℹ️ Database tables not found. Using empty data for admin view.');
            setPendingCampaigns([]);
          } else {
            throw err;
          }
        }
      }
    } catch (err) {
      console.error('Error in refreshCampaigns:', err);
      setError('Failed to load campaigns. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, [userId, userType]);

  // Load campaigns on mount and when userId/userType changes
  useEffect(() => {
    if (userId) {
      refreshCampaigns();
    }
  }, [userId, userType, refreshCampaigns]);

  // Create campaign
  const createCampaign = useCallback(async (data: any): Promise<Campaign> => {
    if (!userId) throw new Error('User ID is required');
    setLoading(true);
    try {
      // Try to get the brand profile, but handle the case where it doesn't exist
      let brandProfileId: string;
      
      try {
        const brandProfile = await getBrandProfileByUserId(userId);
        if (!brandProfile || !brandProfile.id) {
          throw new Error('Could not find brand profile for current user');
        }
        brandProfileId = brandProfile.id;
      } catch (err: any) {
        console.error('❌ Error getting brand profile:', err);
        
        // If this is a database table issue, generate a temporary brand ID 
        if (err.message?.includes('relation') || 
            err.message?.includes('does not exist') ||
            err.message?.includes('No brand association')) {
          
          console.log('ℹ️ Using user ID as brand ID for mock campaign creation.');
          brandProfileId = `temp-${userId}`;
        } else {
          throw err;
        }
      }
      
      console.log(`✅ Creating campaign with brand ID: ${brandProfileId}`);
      
      try {
        // Try to create the actual campaign
        const campaign = await campaignService.createCampaign(brandProfileId, data);
        setBrandCampaigns(prev => [...prev, campaign]);
        return campaign;
      } catch (err: any) {
        console.error('❌ Error creating campaign in database:', err);
        
        // If this is a database table issue, create a mock campaign
        if (err.message?.includes('relation') || err.message?.includes('does not exist')) {
          console.log('ℹ️ Creating mock campaign object for demo purposes');
          
          // Create a mock campaign object
          const mockCampaign: Campaign = {
            id: `mock-${Date.now()}`,
            brand_id: brandProfileId,
            title: data.title || 'New Campaign',
            description: data.description || 'Campaign description',
            status: 'draft',
            budget: data.budget || 0,
            content_type: data.content_type || 'post',
            requirements: data.requirements || {},
            metrics: { views: 0, engagement: 0 },
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            start_date: data.start_date || new Date().toISOString(),
            end_date: data.end_date || new Date(Date.now() + 2592000000).toISOString(), // 30 days from now
          };
          
          // Add to local state and return
          setBrandCampaigns(prev => [...prev, mockCampaign]);
          return mockCampaign;
        } else {
          throw err;
        }
      }
    } catch (err) {
      console.error('Error in createCampaign:', err);
      setError('Failed to create campaign');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Update campaign
  const updateCampaign = useCallback(async (campaignId: string, data: any): Promise<Campaign> => {
    setLoading(true);
    try {
      try {
        const updatedCampaign = await campaignService.updateCampaign(campaignId, data);
        
        // Update the campaign in the brandCampaigns array
        setBrandCampaigns(prev => 
          prev.map(c => c.id === campaignId ? updatedCampaign : c)
        );
        
        return updatedCampaign;
      } catch (err: any) {
        console.error('❌ Error updating campaign in database:', err);
        
        // If this is a database table issue, update the local campaign object
        if (err.message?.includes('relation') || err.message?.includes('does not exist')) {
          console.log('ℹ️ Updating mock campaign object for demo purposes');
          
          // Find the campaign in current state
          const existingCampaign = brandCampaigns.find(c => c.id === campaignId);
          
          if (!existingCampaign) {
            throw new Error('Campaign not found');
          }
          
          // Create updated mock campaign
          const updatedMockCampaign: Campaign = {
            ...existingCampaign,
            ...data,
            updated_at: new Date().toISOString()
          };
          
          // Update state and return
          setBrandCampaigns(prev => 
            prev.map(c => c.id === campaignId ? updatedMockCampaign : c)
          );
          
          return updatedMockCampaign;
        } else {
          throw err;
        }
      }
    } catch (err) {
      console.error('Error in updateCampaign:', err);
      setError('Failed to update campaign');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [brandCampaigns]);

  // Submit campaign for approval
  const submitCampaignForApproval = useCallback(async (campaignId: string): Promise<Campaign> => {
    setLoading(true);
    try {
      try {
        const campaign = await campaignService.submitCampaignForApproval(campaignId);
        setBrandCampaigns(prev => 
          prev.map(c => c.id === campaignId ? campaign : c)
        );
        return campaign;
      } catch (err: any) {
        console.error('❌ Error submitting campaign for approval:', err);
        
        // If this is a database table issue, update the local campaign status
        if (err.message?.includes('relation') || err.message?.includes('does not exist')) {
          console.log('ℹ️ Updating mock campaign status for demo purposes');
          
          // Find the campaign in current state
          const existingCampaign = brandCampaigns.find(c => c.id === campaignId);
          
          if (!existingCampaign) {
            throw new Error('Campaign not found');
          }
          
          // Create updated mock campaign with pending status
          const updatedMockCampaign: Campaign = {
            ...existingCampaign,
            status: 'pending_approval',
            updated_at: new Date().toISOString()
          };
          
          // Update state and return
          setBrandCampaigns(prev => 
            prev.map(c => c.id === campaignId ? updatedMockCampaign : c)
          );
          
          return updatedMockCampaign;
        } else {
          throw err;
        }
      }
    } catch (err) {
      console.error('Error in submitCampaignForApproval:', err);
      setError('Failed to submit campaign for approval');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [brandCampaigns]);

  // Approve campaign
  const approveCampaign = useCallback(async (campaignId: string): Promise<Campaign> => {
    setLoading(true);
    try {
      try {
        const campaign = await campaignService.approveCampaign(campaignId);
        setPendingCampaigns(prev => 
          prev.filter(c => c.id !== campaignId)
        );
        return campaign;
      } catch (err: any) {
        console.error('❌ Error approving campaign:', err);
        
        // If this is a database table issue, update the local campaign status
        if (err.message?.includes('relation') || err.message?.includes('does not exist')) {
          // Find the campaign in current state
          const existingCampaign = pendingCampaigns.find(c => c.id === campaignId);
          
          if (!existingCampaign) {
            throw new Error('Campaign not found');
          }
          
          // Create updated mock campaign with approved status
          const updatedMockCampaign: Campaign = {
            ...existingCampaign,
            status: 'active',
            updated_at: new Date().toISOString()
          };
          
          // Update state and return
          setPendingCampaigns(prev => 
            prev.filter(c => c.id !== campaignId)
          );
          
          return updatedMockCampaign;
        } else {
          throw err;
        }
      }
    } catch (err) {
      console.error('Error in approveCampaign:', err);
      setError('Failed to approve campaign');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [pendingCampaigns]);

  // Reject campaign
  const rejectCampaign = useCallback(async (campaignId: string, reason?: string): Promise<Campaign> => {
    setLoading(true);
    try {
      try {
        const campaign = await campaignService.rejectCampaign(campaignId, reason);
        setPendingCampaigns(prev => 
          prev.filter(c => c.id !== campaignId)
        );
        return campaign;
      } catch (err: any) {
        console.error('❌ Error rejecting campaign:', err);
        
        // If this is a database table issue, update the local campaign status
        if (err.message?.includes('relation') || err.message?.includes('does not exist')) {
          // Find the campaign in current state
          const existingCampaign = pendingCampaigns.find(c => c.id === campaignId);
          
          if (!existingCampaign) {
            throw new Error('Campaign not found');
          }
          
          // Create updated mock campaign with rejected status
          const updatedMockCampaign: Campaign = {
            ...existingCampaign,
            status: 'rejected',
            rejection_reason: reason || 'Does not meet our requirements',
            updated_at: new Date().toISOString()
          };
          
          // Update state and return
          setPendingCampaigns(prev => 
            prev.filter(c => c.id !== campaignId)
          );
          
          return updatedMockCampaign;
        } else {
          throw err;
        }
      }
    } catch (err) {
      console.error('Error in rejectCampaign:', err);
      setError('Failed to reject campaign');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [pendingCampaigns]);

  // Join campaign
  const joinCampaign = useCallback(async (campaignId: string, selectedPlatforms?: string[]): Promise<CampaignApplication> => {
    if (!userId) throw new Error('User ID is required');
    setLoading(true);
    try {
      let application: CampaignApplication;
      
      try {
        // Try to apply to the campaign
        application = await campaignService.applyToCampaign(userId, { 
          campaign_id: campaignId,
          platforms: selectedPlatforms
        });
      } catch (err: any) {
        // Check if it's a database issue
        if (err && (err.message?.includes('relation') || err.message?.includes('does not exist'))) {
          console.log('ℹ️ Creating mock application for demo purposes');
          
          // Create a mock application
          application = {
            id: `mock-app-${Date.now()}`,
            campaign_id: campaignId,
            creator_id: userId,
            status: 'pending',
            application_date: new Date().toISOString(),
            platforms: selectedPlatforms || [],
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
        }
        // If it's a duplicate key error, fetch the existing application
        else if (err && err.code === '23505') {
          console.log('Duplicate application detected, fetching existing record');
          const { data, error } = await supabase
            .from('campaign_creators')
            .select('*')
            .eq('campaign_id', campaignId)
            .eq('creator_id', userId)
            .single();
          
          if (error) {
            if (error.message?.includes('relation') || error.message?.includes('does not exist')) {
              // Create mock application for duplicate cases too
              application = {
                id: `mock-app-${Date.now()}`,
                campaign_id: campaignId,
                creator_id: userId,
                status: 'pending',
                application_date: new Date().toISOString(),
                platforms: selectedPlatforms || [],
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              };
            } else {
              throw error;
            }
          } else {
            application = data;
          }
        } else {
          throw err;
        }
      }
      
      // Update the application list only if we don't already have this application
      const applicationExists = creatorApplications.some(app => 
        app.campaign_id === application.campaign_id && app.creator_id === application.creator_id
      );
      
      if (!applicationExists) {
        setCreatorApplications(prev => [...prev, application]);
      }
      
      return application;
    } catch (err) {
      console.error('Error in joinCampaign:', err);
      setError('Failed to join campaign');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [userId, creatorApplications]);

  // Submit content
  const submitContent = useCallback(async (data: any): Promise<CampaignSubmission> => {
    if (!userId) throw new Error('User ID is required');
    setLoading(true);
    try {
      try {
        const submission = await campaignService.submitContent(userId, data);
        setCreatorSubmissions(prev => [...prev, submission]);
        return submission;
      } catch (err: any) {
        console.error('❌ Error submitting content:', err);
        
        // If this is a database table issue, create a mock submission
        if (err.message?.includes('relation') || err.message?.includes('does not exist')) {
          console.log('ℹ️ Creating mock submission for demo purposes');
          
          // Create a mock submission
          const mockSubmission: CampaignSubmission = {
            id: `mock-sub-${Date.now()}`,
            campaign_id: data.campaign_id,
            creator_id: userId,
            content_url: data.content_url || 'https://example.com/mock-content',
            platform: data.platform || 'instagram',
            status: 'pending_review',
            notes: data.notes || '',
            metrics: data.metrics || { views: 0, likes: 0, comments: 0, shares: 0 },
            feedback: '',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
          
          setCreatorSubmissions(prev => [...prev, mockSubmission]);
          return mockSubmission;
        } else {
          throw err;
        }
      }
    } catch (err) {
      console.error('Error in submitContent:', err);
      setError('Failed to submit content');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Get a campaign with its creators
  const getCampaignWithCreators = useCallback(async (campaignId: string): Promise<Campaign> => {
    setLoading(true);
    try {
      try {
        const campaign = await campaignService.getCampaignWithCreators(campaignId);
        return campaign;
      } catch (err: any) {
        console.error('❌ Error fetching campaign with creators:', err);
        
        // If this is a database table issue, return a mock campaign with creators
        if (err.message?.includes('relation') || err.message?.includes('does not exist')) {
          console.log('ℹ️ Returning mock campaign with creators for demo purposes');
          
          // Find the campaign in current state
          const existingCampaign = brandCampaigns.find(c => c.id === campaignId);
          
          if (!existingCampaign) {
            throw new Error('Campaign not found');
          }
          
          // Add mock creators to the campaign
          return {
            ...existingCampaign,
            creators: [
              {
                id: 'mock-creator-1',
                username: 'creator1',
                name: 'Demo Creator 1',
                email: 'creator1@example.com',
                avatar_url: 'https://ui-avatars.com/api/?name=Demo+Creator',
                status: 'approved',
                platforms: ['instagram', 'tiktok']
              }
            ]
          };
        } else {
          throw err;
        }
      }
    } catch (err) {
      console.error('Error in getCampaignWithCreators:', err);
      setError('Failed to fetch campaign details');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [brandCampaigns]);

  return {
    brandCampaigns,
    availableCampaigns,
    creatorCampaigns,
    pendingCampaigns,
    creatorApplications,
    creatorSubmissions,
    loading,
    error,
    refreshCampaigns,
    createCampaign,
    updateCampaign,
    submitCampaignForApproval,
    approveCampaign,
    rejectCampaign,
    joinCampaign,
    submitContent,
    getCampaignWithCreators
  };
}; 