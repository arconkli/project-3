// Import the shared supabase instance
import { supabase } from '@/lib/supabaseClient';

import {
    Campaign,
    CampaignApplication,
    CampaignSubmission,
    CreateCampaignDTO,
    UpdateCampaignDTO,
    CreateApplicationDTO,
    CreateSubmissionDTO
} from './types';

// Add at the top of the file, after other imports
/// <reference types="vite/client" />

// Add at the top of the file, after other imports
import type { ImportMetaEnv } from '@vite/env';

declare global {
    interface ImportMeta {
        readonly env: ImportMetaEnv;
    }
}

export class CampaignService {
    // Use the imported supabase instance directly
    private readonly supabase = supabase;

    constructor() {
        // Optional: Can keep a check here if needed, but the shared client should handle it
        if (!this.supabase) {
            console.error('CRITICAL: Shared Supabase client instance is not available in CampaignService!');
        }
    }

    // Generate a UUID v4 (browser-compatible)
    private generateUUID(): string {
        // This is a simple implementation of UUID v4 that works in browsers
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    // Brand methods
    async createCampaign(brandId: string, data: CreateCampaignDTO): Promise<Campaign> {
        try {
            console.log("=================================================================");
            console.log("CREATING NEW CAMPAIGN - Detailed Debug");
            console.log(`Campaign title: "${data.title}" for brand ID: ${brandId}`);
            
            // Check authenticated user - this can help diagnose RLS issues
            let isAdmin = false;
            try {
                const { data: authData, error: authError } = await this.supabase.auth.getUser();
                if (authError) {
                    console.error("Error getting authenticated user:", authError);
                } else {
                    console.log("Current authenticated user:", authData?.user);
                    
                    // Check if user has admin role - CRITICAL for determining initial status
                    isAdmin = authData?.user?.app_metadata?.role === 'admin';
                    console.log("👑 USER IS ADMIN:", isAdmin);
                    console.log("User app_metadata:", authData?.user?.app_metadata);
                    
                    // If the authenticated user ID doesn't match brandId, this could be an RLS issue
                    if (authData?.user?.id !== brandId) {
                        console.warn("WARNING: User ID mismatch - authenticated as", 
                            authData?.user?.id, "but creating campaign for brand_id", brandId);
                    }
                }
            } catch (authCheckError) {
                console.error("Auth check failed:", authCheckError);
            }
            
            // Prepare insert data
            const initialStatus = 'draft'; // Brands always create drafts first
            console.log(`⭐ Setting initial campaign status to '${initialStatus}'`);
            
            const insertData = {
                title: data.title,
                brand_id: brandId,
                status: initialStatus,
                brief: {
                    original: data.brief?.original || null,
                    repurposed: data.brief?.repurposed || null
                },
                content_type: data.content_type,
                budget: data.budget,
                start_date: data.start_date,
                end_date: data.end_date,
                // Store new view targets directly
                total_view_target: data.total_view_target,
                original_view_target: data.original_view_target,
                repurposed_view_target: data.repurposed_view_target,
                requirements: {
                    platforms: data.platforms || [],
                    contentGuidelines: data.requirements?.contentGuidelines || [],
                    minViewsForPayout: data.requirements?.minViewsForPayout || "1000",
                    totalBudget: data.budget?.toString() || "1000",
                    payoutRate: {
                        original: data.requirements?.payoutRate?.original?.toString() || "500",
                        repurposed: data.requirements?.payoutRate?.repurposed?.toString() || "250"
                    },
                    hashtags: data.requirements?.hashtags || {
                        original: "#ad",
                        repurposed: "#ad"
                    },
                    budget_allocation: data.requirements?.budget_allocation || {
                        original: data.content_type === 'original' ? 100 : 
                                  data.content_type === 'repurposed' ? 0 : 50,
                        repurposed: data.content_type === 'repurposed' ? 100 : 
                                    data.content_type === 'original' ? 0 : 50
                    }
                },
                metrics: {
                    views: 0,
                    engagement: 0,
                    creators_joined: 0,
                    posts_submitted: 0,
                    posts_approved: 0
                }
            };

            console.log(`✅ Final campaign status to be saved: ${insertData.status}`);
            console.log("Full campaign data being inserted:", insertData);
            
            try {
                // Try the RPC function first since we've fixed it
                console.log("Attempting to create campaign using RPC function...");
                try {
                    const { data: rpcResult, error: rpcError } = await this.supabase.rpc(
                        'create_campaign', 
                        { 
                            brand_id: brandId,
                            campaign_data: insertData
                        }
                    );
                    
                    if (rpcError) {
                        console.error("RPC fallback failed:", rpcError);

                        // Check if the error is related to the function not existing
                        if (rpcError.message && rpcError.message.includes('Could not find the function')) {
                            console.log("Function not found. You need to create the 'create_campaign' function in Supabase.");
                            console.log("Run the SQL script provided to create the helper function.");
                            
                            // Fall back to direct insert
                            throw new Error("RPC function not available, trying direct insert");
                        }
                        
                        throw rpcError;
                    }
                    
                    console.log("Successfully created campaign using RPC function:", rpcResult);
                    return rpcResult[0]; // RPC function returns an array with one element
                } catch (rpcError: any) { // Added : any type annotation
                    // Only try direct insert if RPC function isn't available
                    if (rpcError.message && rpcError.message.includes('Could not find the function')) {
                        console.log("Falling back to direct insert since RPC function isn't available");
                    } else {
                        console.error("RPC attempt failed with error:", rpcError);
                        throw rpcError; // If it's another error with the RPC, throw it
                    }
                }
                
                // If we're here, either the RPC function doesn't exist or some other RPC error occurred
                // Try a minimal insert first to test if it's a data issue
                const testMinimalData = {
                    title: data.title,
                    brand_id: brandId,
                    status: initialStatus, // Use the proper initial status based on role
                    content_type: data.content_type || 'original',
                    budget: data.budget || 1000,
                    spent: 0,
                    start_date: data.start_date,
                    end_date: data.end_date
                };
                
                console.log("Trying minimal campaign insert to diagnose RLS issue:", testMinimalData);
                
                // If admin, try using service role for direct insert first
                let insertClient = this.supabase;
                // No service role in production - always use standard client
                // Still log the admin status for debugging
                if (isAdmin) {
                    console.log("Admin user detected - using standard client with admin privileges");
                }
                
                try {
                    // Use the standard client for insert
                    const { data: testCampaign, error: testError } = await insertClient
                        .from('campaigns')
                        .insert(testMinimalData)
                        .select()
                        .single();
                        
                    if (testError) {
                        console.error("Test insert failed with error:", testError);
                        throw testError;
                    }
                    
                    // If minimal insert worked, try adding the rest of the data with an update
                    console.log("Minimal insert succeeded with status:", testCampaign.status);
                    console.log("Campaign saved with ID:", testCampaign.id);
                    
                    const { data: updatedCampaign, error: updateError } = await insertClient
                        .from('campaigns')
                        .update({
                            brief: insertData.brief,
                            requirements: insertData.requirements,
                            metrics: insertData.metrics
                        })
                        .eq('id', testCampaign.id)
                        .select()
                        .single();

                    if (updateError) {
                        console.error("Update with full data failed:", updateError);
                        throw updateError;
                    }
                    
                    console.log("Campaign fully updated with all data");
                    console.log("Final campaign status:", updatedCampaign.status);
                    console.log("=================================================================");
                    return updatedCampaign;
                } catch (testError) {
                    // If minimal test failed, it might be an RLS policy issue
                    console.error("Minimal insert failed, attempting full insert:", testError);
                    
                    // Fallback to full insert
                    const { data: campaign, error } = await this.supabase
                        .from('campaigns')
                        .insert(insertData)
                        .select()
                        .single();

                    if (error) {
                        console.error("Supabase error creating campaign:", error);
                        throw error;
                    }
                    
                    console.log("Full insert succeeded with status:", campaign.status);
                    console.log("=================================================================");
                    return campaign;
                }
            } catch (error) {
                console.error("Error creating campaign:", error);
                throw error;
            }
        } catch (error) {
            console.error('Error creating campaign:', error);
            throw error;
        }
    }

    async updateCampaign(campaignId: string, data: UpdateCampaignDTO): Promise<Campaign> {
        try {
            console.log("=================================================================");
            console.log("UPDATING CAMPAIGN - Detailed Debug");
            console.log(`Updating campaign ID: ${campaignId}`);
            
            // Log incoming data for debugging
            console.log("Incoming update data:", data);

            // Prepare update data
            const updateData: Partial<Campaign> = {
                title: data.title,
                status: data.status,
                pause_reason: data.pauseReason,
                brief: data.brief,
                content_type: data.content_type,
                budget: data.budget,
                start_date: data.start_date,
                end_date: data.end_date,
                platforms: data.platforms,
                // Update view targets
                total_view_target: data.total_view_target,
                original_view_target: data.original_view_target,
                repurposed_view_target: data.repurposed_view_target,
                requirements: {
                    ...data.requirements,
                    // Ensure view_estimates is not included if it exists in data.requirements
                    view_estimates: undefined 
                },
                updated_at: new Date().toISOString()
            };
            
            // Remove undefined keys to avoid overwriting existing values unintentionally
            Object.keys(updateData).forEach(key => updateData[key] === undefined && delete updateData[key]);
            if (updateData.requirements) {
                 Object.keys(updateData.requirements).forEach(key => updateData.requirements[key] === undefined && delete updateData.requirements[key]);
            }

            console.log("Prepared update data (undefined keys removed):", updateData);

            // Attempt to update the campaign
            const { data: campaign, error } = await this.supabase
                .from('campaigns')
                .update(updateData)
                .eq('id', campaignId)
                .select()
                .single();

            if (error) {
                console.error(`Supabase error updating campaign ID ${campaignId}:`, error);
                // Check for specific errors, e.g., RLS
                if (error.code === '42501') { // permission denied
                    console.error("Potential RLS issue: The current user might not have permission to update this campaign.");
                }
                throw error;
            }
            
            if (!campaign) {
                console.error(`Campaign with ID ${campaignId} not found after update attempt.`);
                throw new Error('Campaign not found after update.');
            }

            console.log("Campaign updated successfully:", campaign);
            console.log("=================================================================");
            return campaign;
        } catch (error) {
            console.error(`Error updating campaign ${campaignId}:`, error);
            throw error;
        }
    }

    async getBrandCampaigns(brandId: string, withCreators: boolean = false): Promise<Campaign[]> {
        try {
            // Fetch campaigns with all fields
            const { data: campaigns, error } = await this.supabase
                .from('campaigns')
                .select(`
                    *,
                    requirements
                `)
                .eq('brand_id', brandId)
                .order('created_at', { ascending: false });

            if (error) throw error;

            // Add default values for missing fields to each campaign
            if (campaigns) {
                for (const campaign of campaigns) {
                    if (campaign.requirements) {
                        let requirementsUpdated = false;
                        
                        // Add default budget_allocation if missing
                        if (!campaign.requirements.budget_allocation) {
                            console.log(`Adding default budget_allocation for campaign ${campaign.id}`);
                            campaign.requirements.budget_allocation = {
                                original: campaign.content_type === 'original' ? "100" : 
                                          campaign.content_type === 'repurposed' ? "0" : "50",
                                repurposed: campaign.content_type === 'repurposed' ? "100" : 
                                           campaign.content_type === 'original' ? "0" : "50"
                            };
                            requirementsUpdated = true;
                        }
                        
                        // Add default view_estimates if missing
                        if (!campaign.requirements.view_estimates) {
                            console.log(`Adding default view_estimates for campaign ${campaign.id}`);
                            campaign.requirements.view_estimates = {
                                total: 0,
                                original: 0,
                                repurposed: 0
                            };
                            requirementsUpdated = true;
                        }
                        
                        // If we added missing fields, update the campaign in the database
                        if (requirementsUpdated) {
                            console.log(`Updating campaign ${campaign.id} in database with missing fields`);
                            const { error: updateError } = await this.supabase
                                .from('campaigns')
                                .update({
                                    requirements: campaign.requirements
                                })
                                .eq('id', campaign.id);
                            
                            if (updateError) {
                                console.error(`Error updating campaign ${campaign.id} with missing fields:`, updateError);
                            } else {
                                console.log(`Successfully updated campaign ${campaign.id} with missing fields`);
                            }
                        }
                    }
                }
            }

            // Log the retrieved data for debugging
            console.log('Retrieved brand campaigns:', campaigns);
            if (campaigns?.[0]) {
                console.log('Sample campaign requirements:', campaigns[0].requirements);
                console.log('Budget allocation:', campaigns[0].requirements?.budget_allocation);
                console.log('View estimates:', campaigns[0].requirements?.view_estimates);
            }
            
            // If withCreators flag is true, fetch and attach creator data for each campaign
            if (withCreators && campaigns) {
                for (const campaign of campaigns) {
                    const { data: creators, error: creatorsError } = await this.supabase
                        .from('campaign_creators')
                        .select('*, creator:creator_id(id, email)')
                        .eq('campaign_id', campaign.id);

                    if (creatorsError) {
                        console.error(`Error fetching creators for campaign ${campaign.id}:`, creatorsError);
                        continue;
                    }

                    campaign.creators = creators || [];
                    
                    if (!campaign.metrics) campaign.metrics = {};
                    const activeCreatorsCount = (creators || []).filter(c => c.status === 'active').length;
                    if (campaign.metrics.creators_joined !== activeCreatorsCount) {
                        console.log(`Fixing inconsistent creator count for campaign ${campaign.id}: ${campaign.metrics.creators_joined} → ${activeCreatorsCount}`);
                        campaign.metrics.creators_joined = activeCreatorsCount;
                    }
                }
            }

            return campaigns || [];
        } catch (error) {
            console.error('Error fetching brand campaigns:', error);
            throw error;
        }
    }

    async getBrandCampaignsWithCreators(brandId: string): Promise<Campaign[]> {
        return this.getBrandCampaigns(brandId, true);
    }

    async getCampaignById(campaignId: string, withCreators: boolean = false): Promise<Campaign> {
        try {
            // First query the database directly to check what's in the requirements
            console.log(`Fetching raw campaign data for ${campaignId} to debug requirements...`);
            const { data: rawCampaign, error: rawError } = await this.supabase
                .from('campaigns')
                .select('*')
                .eq('id', campaignId)
                .single();
            
            if (rawError) {
                console.error('Error fetching raw campaign:', rawError);
            } else {
                console.log('RAW CAMPAIGN DATA:', rawCampaign);
                console.log('RAW REQUIREMENTS:', rawCampaign.requirements);
                if (rawCampaign.requirements) {
                    console.log('REQUIREMENTS KEYS:', Object.keys(rawCampaign.requirements));
                    console.log('HAS BUDGET_ALLOCATION:', 'budget_allocation' in rawCampaign.requirements);
                    console.log('HAS view_estimates:', 'view_estimates' in rawCampaign.requirements);
                }
            }

            // Now fetch with our normal method
            const { data: campaign, error } = await this.supabase
                .from('campaigns')
                .select(`
                    *,
                    requirements
                `)
                .eq('id', campaignId)
                .single();

            if (error) throw error;
            if (!campaign) throw new Error(`Campaign with ID ${campaignId} not found.`); // Handle case where campaign is null

            // Fetch the brand profile separately
            console.log(`Fetching brand profile for campaign ${campaignId} with brand_id: ${campaign.brand_id}`);
            const { data: brandData, error: brandError } = await this.supabase
                .from('brands')
                .select('*')
                .eq('id', campaign.brand_id)
                .maybeSingle();

            if (brandError) {
                console.error(`Error fetching brand profile for brand_id ${campaign.brand_id}:`, brandError);
                campaign.brand = { 
                    id: campaign.brand_id, 
                    name: 'Brand (Error)', 
                    email: '', 
                    industry: '', 
                    website: null, 
                    logo_url: null, 
                    profile_id: null, 
                    user_id: null, 
                    contactName: null, 
                    contactPhone: null, 
                    verificationLevel: 'Unverified', 
                    status: 'active' 
                };
            } else if (brandData) {
                console.log('Successfully fetched brand profile:', brandData);
                campaign.brand = {
                    id: brandData.id,
                    name: brandData.name || `Brand ${brandData.id.substring(0, 6)}`,
                    email: brandData.contact_email || '',
                    industry: brandData.industry || 'Not specified',
                    website: brandData.website || null,
                    contactName: brandData.contact_name || null,
                    contactPhone: brandData.contact_phone || null,
                    verificationLevel: brandData.verification_level || 'Unverified',
                    status: brandData.status || 'active',
                    logo_url: brandData.logo_url || null,
                    profile_id: brandData.profile_id || null,
                    user_id: brandData.user_id || null
                };
                console.log('Brand info attached to campaign:', campaign.brand);
            } else {
                console.warn(`No brand profile found for brand_id ${campaign.brand_id}`);
                campaign.brand = { 
                    id: campaign.brand_id, 
                    name: 'Brand (Not Found)', 
                    email: '', 
                    industry: 'Unknown', 
                    website: null, 
                    contactName: null, 
                    contactPhone: null, 
                    verificationLevel: 'Unverified', 
                    status: 'active',
                    logo_url: null,
                    profile_id: null,
                    user_id: null
                };
            }

            let requirementsUpdated = false;
            
            // If budget_allocation doesn't exist in requirements, add default values
            if (campaign && campaign.requirements && !campaign.requirements.budget_allocation) {
                console.log('Adding default budget_allocation since it was missing');
                campaign.requirements.budget_allocation = {
                    original: campaign.content_type === 'original' ? "100" : 
                              campaign.content_type === 'repurposed' ? "0" : "50",
                    repurposed: campaign.content_type === 'repurposed' ? "100" : 
                               campaign.content_type === 'original' ? "0" : "50"
                };
                requirementsUpdated = true;
            }
            
            // If view_estimates doesn't exist in requirements, add default values
            if (campaign && campaign.requirements && !campaign.requirements.view_estimates) {
                console.log('Adding default view_estimates since it was missing');
                campaign.requirements.view_estimates = {
                    total: 0,
                    original: 0,
                    repurposed: 0
                };
                requirementsUpdated = true;
            }
            
            // If we added missing fields, update the campaign in the database
            if (requirementsUpdated) {
                console.log('Updating campaign in database with missing fields');
                const { error: updateError } = await this.supabase
                    .from('campaigns')
                    .update({
                        requirements: campaign.requirements
                    })
                    .eq('id', campaignId);
                
                if (updateError) {
                    console.error('Error updating campaign with missing fields:', updateError);
                } else {
                    console.log('Successfully updated campaign with missing fields');
                }
            }
            
            // Log the retrieved data for debugging
            console.log('Retrieved campaign data:', {
                requirements: campaign?.requirements,
                budget_allocation: campaign?.requirements?.budget_allocation,
                view_estimates: campaign?.requirements?.view_estimates
            });
            
            // If withCreators flag is true, fetch and attach creator data
            if (withCreators) {
                console.log(`Fetching creators for campaign: ${campaignId}`);
                
                // Always initialize creators array
                campaign.creators = [];
                
                // STEP 1: Fetch basic creator records without complex join
                console.log('Fetching basic creator records without join...');
                const { data: campaignCreators, error: creatorsError } = await this.supabase
                    .from('campaign_creators')
                    .select('*')
                    .eq('campaign_id', campaignId);
                
                if (creatorsError) {
                    console.error('Error fetching campaign creators:', creatorsError);
                } else {
                    console.log(`Found ${campaignCreators?.length || 0} creators for campaign:`, campaignCreators);
                    
                    if (campaignCreators && campaignCreators.length > 0) {
                        // STEP 2: Fetch creator profiles separately
                        const creatorIds = campaignCreators.map(cc => cc.creator_id);
                        console.log(`Fetching profiles for ${creatorIds.length} creators...`);
                        
                        const { data: creatorProfiles, error: profilesError } = await this.supabase
                            .from('profiles')
                            .select('id, email, full_name, username, avatar_url, bio')
                            .in('id', creatorIds);
                        
                        if (profilesError) {
                            console.error('Error fetching creator profiles:', profilesError);
                            // Continue with partial data
                        }
                        
                        // Create a map of creator profiles by ID for easy lookup
                        const profileMap: { [key: string]: any } = {}; // Add explicit type
                        (creatorProfiles || []).forEach(profile => {
                            profileMap[profile.id] = profile;
                        });
                        
                        // STEP 3: Combine creator records with their profiles
                        console.log('Processing creator data...');
                        const processedCreators: CampaignApplication[] = campaignCreators.map(cc => ({ // Add type
                            id: cc.id,
                            creator_id: cc.creator_id,
                            campaign_id: cc.campaign_id,
                            status: cc.status || 'pending',
                            platforms: Array.isArray(cc.platforms) ? cc.platforms : [cc.platforms].filter(Boolean),
                            // Provide default values for missing application fields if needed (or adjust types)
                            earned: cc.earned ?? 0, // Add default
                            engagement: cc.engagement ?? 0, // Add default
                            created_at: cc.created_at || new Date(), // Add default
                            updated_at: cc.updated_at || new Date(), // Add default
                            application_data: cc.application_data ?? {},
                            creator: {
                                id: cc.creator_id,
                                email: profileMap[cc.creator_id]?.email || '',
                                full_name: profileMap[cc.creator_id]?.full_name || '',
                                username: profileMap[cc.creator_id]?.username || '',
                                avatar_url: profileMap[cc.creator_id]?.avatar_url || null,
                                bio: profileMap[cc.creator_id]?.bio || '',
                                // Add missing profile fields or adjust types if needed
                                followers: 0, // Using default values since we can't join with these fields
                                views: 0,
                                engagement_rate: 0
                            }
                        }));
                        
                        // Assign the processed creators to the campaign
                        // Type assertion might be needed if structure differs significantly
                        campaign.creators = processedCreators;
                    } else {
                        console.log('No creators found for this campaign');
                        campaign.creators = [];
                    }
                    
                    if (!campaign.metrics) {
                        // Initialize with all required properties
                        campaign.metrics = {
                            views: 0,
                            engagement: 0,
                            creators_joined: 0,
                            posts_submitted: 0,
                            posts_approved: 0
                        };
                    }
                    const activeCreatorsCount = (campaign.creators || []).filter((c: CampaignApplication) => c.status === 'active').length; // Add type to 'c'
                    if (campaign.metrics.creators_joined !== activeCreatorsCount) {
                        console.log(`Fixing inconsistent creator count for campaign ${campaignId}: ${campaign.metrics.creators_joined} → ${activeCreatorsCount}`);
                        campaign.metrics.creators_joined = activeCreatorsCount;
                    }
                    console.log('Campaign with creators data:', {
                        id: campaign.id,
                        title: campaign.title,
                        creatorCount: campaign.creators.length,
                        hasCreators: !!campaign.creators.length,
                        creatorsArray: Array.isArray(campaign.creators),
                        creatorsAttachedToCampaign: campaign.hasOwnProperty('creators')
                    });
                }
            } else {
                console.log(`NOT fetching creators for campaign: ${campaignId} because withCreators flag is false`);
            }

            return campaign;
        } catch (error) { // Use default error type
            console.error('Error fetching campaign:', error);
            throw error;
        }
    }

    async getCampaignWithCreators(campaignId: string): Promise<Campaign> {
        return this.getCampaignById(campaignId, true);
    }

    async deleteCampaign(campaignId: string): Promise<void> {
        try {
            const { error } = await this.supabase
                .from('campaigns')
                .delete()
                .eq('id', campaignId);

            if (error) throw error;
        } catch (error) { // Use default error type
            console.error('Error deleting campaign:', error);
            throw error;
        }
    }

    // Creator methods
    async getAvailableCampaigns(creatorId?: string): Promise<Campaign[]> {
        try {
            console.log('Getting available campaigns' + (creatorId ? ' for creator: ' + creatorId : ''));
            
            // First, get all active campaigns with proper filtering
            const { data: campaigns, error: campaignsError } = await this.supabase
                .from('campaigns')
                .select('*')
                .eq('status', 'active')
                .order('created_at', { ascending: false });  // Order by creation date to show newest first

            if (campaignsError) {
                console.error('Error fetching active campaigns:', campaignsError);
                throw campaignsError;
            }

            console.log(`Found ${campaigns?.length || 0} active campaigns`);
            
            // If no campaigns or no creator ID, return all campaigns
            if (!campaigns || campaigns.length === 0 || !creatorId) {
                console.log('Returning all available campaigns');
                // Return transformed campaigns, ensure structure matches Campaign type
                 return await this.transformCampaigns(campaigns || []); // Call with await as it's async now
            }
            
            // If creator ID is provided, get the campaigns they've already joined
            const { data: creatorCampaigns, error: creatorCampaignsError } = await this.supabase
                .from('campaign_creators')
                .select('campaign_id')
                .eq('creator_id', creatorId);
                
            if (creatorCampaignsError) {
                console.error('Error fetching creator campaigns:', creatorCampaignsError);
                // Continue anyway, but log detailed error for debugging
                console.error('Detailed error:', creatorCampaignsError.message, creatorCampaignsError.details);
            }
            
            // Get the IDs of campaigns the creator has already joined
            const joinedCampaignIds = new Set((creatorCampaigns || []).map(cc => cc.campaign_id));
            console.log(`Creator has already joined ${joinedCampaignIds.size} campaigns:`,
                joinedCampaignIds.size > 0 ? Array.from(joinedCampaignIds) : 'None');
            
            // Filter out campaigns the creator has already joined
            // Make sure we're comparing the correct id format
            const availableCampaigns = campaigns.filter(campaign => {
                const campaignId = String(campaign.id); // Ensure string comparison
                const isAlreadyJoined = joinedCampaignIds.has(campaignId);
                
                if (isAlreadyJoined) {
                    console.log(`Campaign ${campaignId} (${campaign.title}) is already joined by creator`);
                } else {
                    console.log(`Campaign ${campaignId} (${campaign.title}) is available for creator`);
                }
                
                return !isAlreadyJoined;
            });
            
            console.log(`${availableCampaigns.length} campaigns are available for the creator to join`);
            
            // Add additional logging for debugging
            if (availableCampaigns.length === 0) {
                console.log('No available campaigns found for creator after filtering');
            } else {
                console.log('Available campaign IDs:', availableCampaigns.map(c => c.id));
            }
            
            // Return transformed campaigns, ensure structure matches Campaign type
            return await this.transformCampaigns(availableCampaigns); // Call with await as it's async now
        } catch (error) { // Use default error type
            console.error('Error in getAvailableCampaigns:', error);
            // Return empty array instead of throwing to prevent UI from breaking
            return [];
        }
    }
    
    // Helper method to transform campaigns with brand data
    async transformCampaigns(campaigns: any[]): Promise<Campaign[]> {
        if (!campaigns || campaigns.length === 0) {
            return [];
        }
        
        try {
            // Get all brand IDs
            const brandIds = [...new Set(campaigns.map(c => c.brand_id))];
            console.log(`Fetching details for ${brandIds.length} unique brands`);
            
            // Fetch brand profiles
            const { data: brandProfiles, error: brandError } = await this.supabase
                .from('brands')
                .select('*')
                .in('id', brandIds);

            if (brandError) {
                console.error('Error fetching brand profiles:', brandError);
                // Continue without brand data
            }
            
            // Create a map for quick lookups
            const brandProfileMap: { [key: string]: any } = {}; // Add explicit type
            (brandProfiles || []).forEach(profile => {
                brandProfileMap[profile.id] = profile;
            });
            
            // Ensure the returned object matches the Campaign type definition
            const transformedCampaigns = campaigns.map((campaign): Campaign => { // Add return type Campaign
                const brandProfile = brandProfileMap[campaign.brand_id] || {};

                // Log requirements for debugging
                console.log(`Transforming campaign ${campaign.id} requirements:`, campaign.requirements);
                if (campaign.requirements) {
                    console.log('  budget_allocation:', campaign.requirements.budget_allocation);
                    console.log('  view_estimates:', campaign.requirements.view_estimates);
                }
                
                return {
                    id: campaign.id,
                    brand_id: campaign.brand_id, // Add missing field
                    title: campaign.title,
                    status: campaign.status, // Use the actual status
                    budget: campaign.budget || 0,
                    spent: campaign.spent || 0,
                    // Add other potentially missing fields from Campaign type
                    created_at: campaign.created_at || new Date(),
                    updated_at: campaign.updated_at || new Date(),
                    start_date: campaign.start_date,
                    end_date: campaign.end_date,
                    content_type: campaign.content_type || 'both',
                    brief: campaign.brief || {
                        original: null,
                        repurposed: null
                    },
                    requirements: { // Ensure this matches CampaignRequirements structure
                        platforms: campaign.requirements?.platforms || [],
                        contentGuidelines: campaign.requirements?.contentGuidelines || [],
                        minViewsForPayout: campaign.requirements?.minViewsForPayout || "100K", // Ensure type consistency (string/number)
                        totalBudget: campaign.requirements?.totalBudget || campaign.budget?.toString() || "1000",
                        payoutRate: campaign.requirements?.payoutRate || { original: "500", repurposed: "250" },
                        hashtags: campaign.requirements?.hashtags || { original: "#ad", repurposed: "#ad" },
                        budget_allocation: campaign.requirements?.budget_allocation || { original: 50, repurposed: 50 },
                        view_estimates: campaign.requirements?.view_estimates ? {
                            total: Number(campaign.requirements.view_estimates.total || 0),
                            original: Number(campaign.requirements.view_estimates.original || 0),
                            repurposed: Number(campaign.requirements.view_estimates.repurposed || 0)
                        } : { total: 0, original: 0, repurposed: 0 }
                    },
                    brand: { // Map brand data
                        id: campaign.brand_id,
                        name: brandProfile.company_name || brandProfile.name || `Brand ${campaign.brand_id.substring(0, 6)}`,
                        email: brandProfile.contact_email || `contact@brand${campaign.brand_id.substring(0, 6)}.com`,
                        industry: brandProfile.industry || 'Not specified',
                        website: brandProfile.website || null,
                        contactName: brandProfile.contact_name || null,
                        contactPhone: brandProfile.contact_phone || null,
                        verificationLevel: brandProfile.verification_level || 'Unverified',
                        status: brandProfile.status || 'active',
                        // Add potentially missing brand fields
                        logo_url: brandProfile.logo_url || null,
                        profile_id: brandProfile.profile_id || null,
                        user_id: brandProfile.user_id || null
                    },
                    targetAudience: { // Ensure this matches TargetAudience structure
                        age: campaign.target_audience?.age || [18, 65],
                        locations: campaign.target_audience?.locations || ['Global'],
                        interests: campaign.target_audience?.interests || []
                    },
                    metrics: campaign.metrics || { // Use actual metrics if available, otherwise default
                        views: 0,
                        engagement: 0,
                        creators_joined: 0,
                        posts_submitted: 0,
                        posts_approved: 0
                    },
                    campaign_goal: campaign.goal || campaign.objective || 'Brand Awareness', // Add campaign goal (assuming DB field is 'goal' or 'objective')
                    joined_creators_count: campaign.metrics?.creators_joined || campaign.joined_creators_count || 0, // Add joined creators count
                    creators: campaign.creators || [], // This should be CampaignApplication[] now
                };
            });

            console.log(`Successfully transformed ${transformedCampaigns.length} campaigns`);
            // The transformation should now produce objects matching Campaign type
            return transformedCampaigns;
        } catch (error) { // Use default error type
            console.error('Error transforming campaigns:', error);
            throw error;
        }
    }

    async joinCampaign(campaignId: string, platforms: string[]): Promise<CampaignApplication> {
        console.log("[CampaignService] Creator joining campaign:", campaignId);
        try {
            const { session } = await this.supabase.auth.getSession();
            const userId = session?.user?.id;
            
            if (!userId) {
                throw new Error('Creator must be authenticated to join campaigns');
            }
            
            // Use the SQL function we created
            const { data: application, error: joinError } = await this.supabase
                .rpc('join_campaign', { 
                    campaign_id: campaignId,
                    user_id: userId,
                    platforms: platforms
                });
                
            if (joinError) {
                console.error("[CampaignService] Error joining campaign:", joinError);
                throw joinError;
            }
            
            if (!application || application.length === 0) {
                throw new Error(`Could not join campaign with ID ${campaignId}`);
            }
            
            console.log("[CampaignService] Campaign joined successfully:", application[0]);
            return application[0];
        } catch (error) {
            console.error("[CampaignService] Error in joinCampaign:", error);
            throw error;
        }
    }

    async applyToCampaign(creatorId: string, data: CreateApplicationDTO): Promise<CampaignApplication> {
        try {
            console.log(`Creator ${creatorId} applying to campaign ${data.campaign_id} with platforms:`, data.platforms);
            
            // First check if the creator has already applied to this campaign
            const { data: existingApplication, error: checkError } = await this.supabase
                .from('campaign_creators')
                .select('*')
                .eq('campaign_id', data.campaign_id)
                .eq('creator_id', creatorId)
                .single();
                
            // If we found an existing application, return it instead of creating a duplicate
            if (existingApplication && !checkError) {
                console.log(`Creator ${creatorId} has already applied to campaign ${data.campaign_id}`);
                return existingApplication;
            }
            
            console.log('No existing application found, creating new one...');
            
            // Verify we can access the campaign_creators table
            const { count, error: countError } = await this.supabase
                .from('campaign_creators')
                .select('*', { count: 'exact', head: true });
                
            if (countError) {
                console.error('Error accessing campaign_creators table:', countError);
                console.error('This might be an RLS policy issue or table permissions problem');
            } else {
                console.log(`Current count of records in campaign_creators table: ${count}`);
            }
            
            // Get current user to verify authentication
            const { data: { user }, error: authError } = await this.supabase.auth.getUser();
            if (authError) {
                console.error('Authentication error when applying to campaign:', authError);
            } else {
                console.log('User authenticated as:', user?.id, 'Applying as creator:', creatorId);
                if (user?.id !== creatorId) {
                    console.warn('WARNING: User ID mismatch - authenticated as',
                        user?.id, 'but applying as creator', creatorId);
                    console.warn('This might cause RLS policy issues if policies are strict');
                }
            }
            
            // Create campaign_creator record with detailed logging
            console.log('Inserting new record into campaign_creators table with data:', {
                campaign_id: data.campaign_id,
                creator_id: creatorId,
                status: 'active', // Set to active immediately, as requested
                platforms: data.platforms || []
                // Removed non-existent 'application_data' field
            });
            
            // If no existing application, proceed with creating a new one
            const { data: application, error } = await this.supabase
                .from('campaign_creators')
                .insert({
                    campaign_id: data.campaign_id,
                    creator_id: creatorId,
                    status: 'active', // Set to active immediately, as requested
                    platforms: data.platforms || []
                    // Removed non-existent 'application_data' field
                })
                .select()
                .single();

            if (error) {
                // Detailed error logging
                console.error('Error inserting record into campaign_creators:', error);
                console.error('Error details:', {
                    code: error.code,
                    message: error.message,
                    details: error.details,
                    hint: error.hint
                });
                
                // If this is a permission error, try to provide more guidance
                if (error.code === '42501' || error.message?.includes('permission denied')) {
                    console.error('This appears to be a permission issue. Check RLS policies for the campaign_creators table.');
                    console.error('The user might not have INSERT permission on this table.');
                }
                
                // If this is a foreign key error, the campaign_id or creator_id might not exist
                if (error.code === '23503') {
                    console.error('This appears to be a foreign key constraint failure.');
                    console.error('Make sure both the campaign and creator exist in their respective tables.');
                }
                
                // If this is a duplicate key error, get and return the existing record
                if (error.code === '23505') { // PostgreSQL duplicate key error code
                    console.log('Duplicate application detected, fetching existing record');
                    const { data: existingApp, error: fetchError } = await this.supabase
                        .from('campaign_creators')
                        .select('*')
                        .eq('campaign_id', data.campaign_id)
                        .eq('creator_id', creatorId)
                        .single();
                        
                    if (fetchError) {
                        console.error('Error fetching existing application:', fetchError);
                        throw fetchError;
                    }
                    console.log('Successfully retrieved existing application:', existingApp);
                    return existingApp;
                }
                
                // No service role in production
                console.error('Unable to apply to campaign - database error:', error);
                throw error;
            }
            
            console.log('Successfully created new application:', application);
            
            // First get the current campaign to update metrics
            const { data: campaign, error: fetchError } = await this.supabase
                .from('campaigns')
                .select('metrics')
                .eq('id', data.campaign_id)
                .single();
                
            if (fetchError) {
                console.warn('Could not fetch campaign metrics, skipping metrics update:', fetchError);
            } else {
                // Update campaign metrics
                const currentMetrics = campaign.metrics || {};
                const updatedMetrics = {
                    ...currentMetrics,
                    creators_joined: (currentMetrics.creators_joined || 0) + 1,
                    applications_received: (currentMetrics.applications_received || 0) + 1
                };
                
                const { error: updateError } = await this.supabase
                    .from('campaigns')
                    .update({ metrics: updatedMetrics })
                    .eq('id', data.campaign_id);
                    
                if (updateError) {
                    console.warn('Could not update campaign metrics:', updateError);
                } else {
                    console.log(`Updated campaign metrics for ${data.campaign_id}, creators_joined: ${updatedMetrics.creators_joined}`);
                }
            }
            
            // Make sure to update the creator count correctly
            await this.updateCampaignCreatorCount(data.campaign_id);
            
            return application;
        } catch (error) { // Use default error type
            console.error('Error applying to campaign:', error);
            // Create a fallback application object for resilience
            throw error; // Re-throw the original error
        }
    }

    async submitContent(creatorId: string, data: CreateSubmissionDTO): Promise<CampaignSubmission> {
        try {
        const { data: submission, error } = await this.supabase
                .from('campaign_posts')  // Using campaign_posts table for submissions
            .insert({
                    campaign_id: data.campaign_id,
                creator_id: creatorId,
                    platform: data.platform,
                    content_type: data.content_type,
                    post_url: data.post_url,
                    status: 'pending'
            })
            .select()
            .single();

        if (error) throw error;
            
            // Update campaign metrics
            await this.updateCampaignMetrics(data.campaign_id);
            
        return submission;
        } catch (error) { // Use default error type
            console.error('Error submitting content:', error);
            throw error;
        }
    }

    async getCreatorApplications(creatorId: string): Promise<CampaignApplication[]> {
      console.log(`Fetching applications for creator: ${creatorId}`);
      if (!creatorId) {
          console.error('getCreatorApplications called without creatorId');
          throw new Error('Creator ID is required');
      }
      
      try {
        // Fetch campaign creator records associated with this creator
        const { data, error } = await this.supabase
            .from('campaign_creators')
            .select(`
                id,
                campaign_id,
                creator_id,
                status,
                created_at,
                updated_at,
                platforms
            `)
            .eq('creator_id', creatorId)
            .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching creator applications:', error);
          throw error;
        }

        if (!data) {
          console.log('No applications found for creator:', creatorId);
          return [];
        }

        // Fetch campaign details for each application
        const campaignIds = data.map(app => app.campaign_id).filter(id => id != null);
        let campaignDetails = new Map<string, any>();

        if (campaignIds.length > 0) {
          const { data: campaignsData, error: campaignsError } = await this.supabase
              .from('campaigns')
              .select('id, title, brand_id, start_date, end_date, content_type, requirements, brands ( name ) ')
              .in('id', campaignIds);

          if (campaignsError) {
            console.error('Error fetching campaign details for applications:', campaignsError);
            // Continue without campaign details if there's an error
          } else if (campaignsData) {
            campaignDetails = new Map(campaignsData.map(c => [c.id, c]));
          }
        }

        // Combine application data with campaign details
        const applications = data.map(app => ({
          id: app.id,
          campaign_id: app.campaign_id,
          creator_id: app.creator_id,
          status: app.status,
          created_at: app.created_at,
          updated_at: app.updated_at,
          platforms: app.platforms,
          // Merge campaign details
          campaign: campaignDetails.get(app.campaign_id) || { title: 'Campaign details unavailable' },
        }));
        
        console.log(`Found ${applications.length} applications for creator ${creatorId}`);
        return applications as CampaignApplication[];
      } catch (error) {
        console.error('Error in getCreatorApplications:', error);
        throw error;
      }
    }

    async getCreatorSubmissions(creatorId: string): Promise<CampaignSubmission[]> {
      console.log(`Fetching submissions for creator: ${creatorId}`);
      if (!creatorId) {
          console.error('getCreatorSubmissions called without creatorId');
          throw new Error('Creator ID is required');
      }
      
      try {
        // Corrected to query 'content_submissions' table
        const { data, error } = await this.supabase
            .from('content_submissions') 
            .select('*') // Select all columns for now, adjust if needed
            .eq('creator_id', creatorId)
            .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching creator submissions:', error);
          // If the error is specifically about the table not existing, log a more helpful message
          if ((error as any).code === '42P01') { // Check for PostgreSQL relation does not exist error code
             console.error('SCHEMA ERROR: The table "content_submissions" might not exist or is inaccessible.');
          }
          throw error;
        }

        if (!data) {
          console.log('No submissions found for creator:', creatorId);
          return [];
        }

        // Fetch campaign details for each submission (if needed)
        const campaignIds = [...new Set(data.map(sub => sub.campaign_id).filter(id => id != null))];
        let campaignDetails = new Map<string, any>();

        if (campaignIds.length > 0) {
          const { data: campaignsData, error: campaignsError } = await this.supabase
              .from('campaigns')
              .select('id, title, brand_id, brands ( name ) ')
              .in('id', campaignIds);

          if (campaignsError) {
            console.error('Error fetching campaign details for submissions:', campaignsError);
          } else if (campaignsData) {
            campaignDetails = new Map(campaignsData.map(c => [c.id, c]));
          }
        }

        // Combine submission data with campaign details
        const submissions = data.map(sub => ({
          ...sub,
          campaign: campaignDetails.get(sub.campaign_id) || { title: 'Campaign details unavailable' },
        }));
        
        console.log(`Found ${submissions.length} submissions for creator ${creatorId}`);
        return submissions as CampaignSubmission[];
      } catch (error) {
        // Log the error caught by the outer try-catch block
        console.error('Error in getCreatorSubmissions:', error);
        throw error;
      }
    }

    // Admin methods
    // New helper method to get brand names for campaigns
    private async getBrandNamesForCampaigns(campaigns: any[]): Promise<Map<string, string>> {
        const brandMap = new Map<string, string>();
        
        try {
            // Get unique brand IDs from the campaigns
            const brandIds = [...new Set(campaigns.map(camp => camp.brand_id))].filter(Boolean);
            
            if (brandIds.length === 0) {
                console.log('No brand IDs found in campaigns');
                return brandMap;
            }
            
            // Chunk brand IDs into smaller groups to avoid large queries
            // Create chunks of 20 brand IDs each
            const chunkSize = 20;
            const brandIdChunks = [];
            for (let i = 0; i < brandIds.length; i += chunkSize) {
                brandIdChunks.push(brandIds.slice(i, i + chunkSize));
            }
            
            console.log(`Split ${brandIds.length} brand IDs into ${brandIdChunks.length} chunks`);
            
            // Process each chunk separately with a small delay to avoid rate limits
            for (const chunk of brandIdChunks) {
                try {
                    // Create a timeout promise to handle slow queries
                    const timeoutPromise = new Promise<{data: null, error: Error}>((_, reject) => 
                        setTimeout(() => reject({
                            data: null, 
                            error: new Error('Brand fetch timed out after 2 seconds')
                        }), 2000)
                    );
                    
                    // Fetch brand data with timeout
                    const brandQueryPromise = this.supabase
                        .from('brands')
                        .select('id, name')
                        .in('id', chunk);
                    
                    const { data: brands, error } = await Promise.race([
                        brandQueryPromise,
                        timeoutPromise
                    ]) as any;
                    
                    if (error) {
                        console.warn(`Warning fetching brands chunk: ${error.message}`);
                        continue; // Continue with next chunk
                    }
                    
                    // Add brand names to map
                    brands?.forEach(brand => {
                        if (brand.id && brand.name) {
                            brandMap.set(brand.id, brand.name);
                        }
                    });
                    
                    // Add a small delay between chunks
                    if (brandIdChunks.length > 1) {
                        await new Promise(resolve => setTimeout(resolve, 100));
                    }
                } catch (chunkError) {
                    console.warn(`Error processing brand chunk: ${chunkError}`);
                    // Continue with the next chunk
                }
            }
            
            console.log(`Successfully mapped ${brandMap.size} of ${brandIds.length} brand IDs to names`);
            
            // Fill in missing brands with placeholder names to ensure all campaigns have some brand name
            brandIds.forEach(id => {
                if (id && !brandMap.has(id)) {
                    brandMap.set(id, `Brand ${id.substring(0, 6)}`);
                }
            });
            
            return brandMap;
        } catch (error) {
            console.error('Error in getBrandNamesForCampaigns:', error);
            
            // Provide fallback brand names for all brand IDs
            brandIds?.forEach(id => {
                if (id && !brandMap.has(id)) {
                    brandMap.set(id, `Brand ${id.substring(0, 6)}`);
                }
            });
            
            return brandMap;
        }
    }

    // Private helper to handle RPC calls with potential fallbacks
    private async callCampaignRpc(functionName: string, params: any): Promise<any[]> {
        try {
            console.log(`[CampaignService] Calling RPC: ${functionName} with params:`, params);
            const { data, error } = await this.supabase.rpc(functionName, params);

            if (error) {
                console.error(`[CampaignService] Error calling RPC ${functionName}:`, error);
                // Check for specific function not found error (PGRST202)
                if (error.code === 'PGRST202') {
                    console.warn(`[CampaignService] RPC function ${functionName} not found. Did the migration run correctly?`);
                }
                throw error; // Re-throw the original Supabase error
            }
            
            console.log(`[CampaignService] RPC ${functionName} successful. Records returned:`, data?.length || 0);
            return data || []; // Ensure we always return an array
        } catch (error) {
            console.error(`[CampaignService] Top-level error in callCampaignRpc (${functionName}):`, error);
            // Return empty array on failure to prevent breaking Promise.allSettled
            return []; 
        }
    }
    
    // Fetches active/paused campaigns using RPC, with pagination
    async getAllActiveCampaigns(page = 1, pageSize = 25): Promise<any[]> { // Return type might need adjustment based on RPC result
        console.log(`[CampaignService] Fetching active/paused campaigns (page: ${page}, size: ${pageSize}) via RPC`);
        // Correct the parameter name to match the SQL function definition
        return this.callCampaignRpc('get_admin_active_campaigns', { 
            page_number: page, // Ensure this matches the SQL function parameter name
            page_size: pageSize  // Ensure this matches the SQL function parameter name
        });
    }

    async getAllCompletedCampaigns(): Promise<Campaign[]> {
        try {
            console.log('Fetching all completed campaigns...');
            const { data: campaigns, error } = await this.supabase
                .from('campaigns')
                .select('*') // Select fields needed by transformCampaigns
                .eq('status', 'completed')
                .order('updated_at', { ascending: false }); 
            
            if (error) throw error;
            console.log(`Fetched ${campaigns?.length || 0} completed campaigns`);
            if (!campaigns || campaigns.length === 0) return [];

            return await this.transformCampaigns(campaigns); // Use simplified transform
        } catch (error) { 
            console.error('Error in getAllCompletedCampaigns:', error);
            throw error;
        }
    }

    async getPendingCampaignEdits(): Promise<any[]> {
        try {
            console.log('Fetching pending campaign edits');

            // Get all pending edits with their corresponding campaign data
            // Use a JOIN to get related campaign data in a single query

            // Placeholder implementation - needs actual logic
            return []; // Add return statement

        } catch (error) { // Use default error type
            console.error('Error in getPendingCampaignEdits:', error);
            throw error;
        }
    }

    async getPendingSubmissions(campaignId: string): Promise<CampaignSubmission[]> {
        try {
            const submissionsResponse = await this.supabase
                .from('campaign_submissions')
                .select('*, profiles:profile_id(*)')
                .eq('campaign_id', campaignId)
                .eq('status', 'pending')
                .order('created_at', { ascending: false });

            if (submissionsResponse.error) {
                console.error('Error fetching pending submissions:', submissionsResponse.error);
                throw new Error('Failed to fetch pending submissions');
            }

            return submissionsResponse.data;
        } catch (error) {
            console.error('Error in getPendingSubmissions:', error);
            throw error;
        }
    }

    async updateSubmissionStatus(
        submissionId: string,
        status: 'pending' | 'approved' | 'rejected',
        reasonIfRejected?: string
    ): Promise<void> {
        try {
            const updateData: any = { status };
            if (reasonIfRejected) {
                updateData.rejection_reason = reasonIfRejected;
            }

            const { error } = await this.supabase
                .from('campaign_submissions')
                .update(updateData)
                .eq('id', submissionId);

            if (error) {
                console.error('Error updating submission status:', error);
                throw new Error('Failed to update submission status');
            }
        } catch (error) {
            console.error('Error in updateSubmissionStatus:', error);
            throw error;
        }
    }

    // Methods for admin dashboard
    /**
     * Creates a campaign from the admin dashboard
     * This method supports both creating with an existing brand ID or creating a new brand
     */
    async createCampaignFromAdmin(data: {
        title: string;
        brand_id?: string;
        new_brand_name?: string;
        new_brand_contact_email?: string; // Added for brand creation
        content_type: string;
        brief: { original: string | null; repurposed: string | null };
        budget: number;
        start_date: string;
        end_date: string;
        platforms?: string[];
        requirements?: any;
        // Add view targets to the input type
        total_view_target?: number;
        original_view_target?: number;
        repurposed_view_target?: number;
    }): Promise<Campaign> {
        try {
            console.log("Admin creating campaign...");
            let brandId = data.brand_id;

            // Create new brand if specified
            if (data.new_brand_name) {
                console.log(`Creating new brand: ${data.new_brand_name}`);
                // Simplified brand creation - assumes basic fields
                const { data: newBrand, error: brandError } = await this.supabase
                    .from('brands')
                    .insert({ 
                        name: data.new_brand_name,
                        contact_email: data.new_brand_contact_email || null
                        // Add other default brand fields if necessary 
                    })
                    .select('id')
                    .single();

                if (brandError || !newBrand) {
                    console.error("Error creating new brand:", brandError);
                    throw brandError || new Error('Failed to create brand.');
                }
                brandId = newBrand.id;
                console.log(`New brand created with ID: ${brandId}`);
            }

            if (!brandId) {
                throw new Error('Brand ID is required to create a campaign.');
            }
            
            // Status should be pending_approval for admin-created campaigns
            const adminInsertData = {
                title: data.title,
                brand_id: brandId,
                status: 'pending_approval', // Admin-created campaigns start as pending
                brief: data.brief,
                content_type: data.content_type,
                budget: data.budget,
                start_date: data.start_date,
                end_date: data.end_date,
                // Add view targets directly
                total_view_target: data.total_view_target,
                original_view_target: data.original_view_target,
                repurposed_view_target: data.repurposed_view_target,
                requirements: {
                    platforms: data.platforms || [],
                    contentGuidelines: data.requirements?.contentGuidelines || [],
                    minViewsForPayout: data.requirements?.minViewsForPayout || "1000",
                    totalBudget: data.budget?.toString() || "1000",
                    payoutRate: {
                        original: data.requirements?.payoutRate?.original?.toString() || "500",
                        repurposed: data.requirements?.payoutRate?.repurposed?.toString() || "250"
                    },
                    hashtags: data.requirements?.hashtags || {
                        original: "#ad",
                        repurposed: "#ad"
                    },
                    budget_allocation: data.requirements?.budget_allocation || {
                        original: data.content_type === 'original' ? 100 : 
                                  data.content_type === 'repurposed' ? 0 : 50,
                        repurposed: data.content_type === 'repurposed' ? 100 : 
                                    data.content_type === 'original' ? 0 : 50
                    }
                },
                metrics: { /* Default metrics */
                     views: 0, engagement: 0, creators_joined: 0, 
                     posts_submitted: 0, posts_approved: 0 
                }
            };

            console.log("Inserting campaign from admin with data:", adminInsertData);

            // Using service role key for admin creation
            // NOTE: Ensure SUPABASE_SERVICE_ROLE_KEY is set in your environment
            // We need to create a separate client instance for this ONLY IF NEEDED.
            // For now, assume RLS allows admin role to insert directly.
            const { data: campaign, error } = await this.supabase
                .from('campaigns')
                .insert(adminInsertData)
                .select()
                .single();

            if (error) {
                console.error("Supabase error creating campaign from admin:", error);
                throw error;
            }

            console.log("Campaign created successfully from admin:", campaign);
            return campaign;
        } catch (error) {
            console.error('Error in createCampaignFromAdmin:', error);
            throw error;
        }
    }

    /**
     * Gets all available brands for admin selection
     * Returns a list of brands with their IDs and names
     */
    async getAllBrandsForAdmin(): Promise<{id: string, name: string}[]> {
        try {
            console.log('[AdminCampaignService] Fetching all brands for admin selection');
            
            const { data: brands, error } = await this.supabase
                .from('brand_profiles')
                .select('id, name')
                .order('name', { ascending: true });
                
            if (error) {
                console.error('[AdminCampaignService] Error fetching brands:', error);
                throw error;
            }
            
            console.log(`[AdminCampaignService] Fetched ${brands?.length || 0} brands`);
            return brands || [];
            
        } catch (error) {
            console.error('[AdminCampaignService] Error in getAllBrandsForAdmin:', error);
            return [];
        }
    }

    // Fetches pending campaigns directly, with pagination and necessary fields
    async getAllPendingCampaigns(page = 1, pageSize = 25): Promise<Campaign[]> {
        console.log(`[CampaignService] Fetching pending campaigns (page: ${page}, size: ${pageSize}) via SELECT query`);
        const from = (page - 1) * pageSize;
        const to = from + pageSize - 1;

        try {
            const { data, error } = await this.supabase
                .from('campaigns')
                .select(`
                    id,
                    title,
                    status,
                    content_type,
                    start_date,
                    end_date,
                    budget,
                    requirements,
                    brand_id,
                    brands (  
                      id,
                      name,
                      logo_url
                    )
                `)
                // Include all relevant pending statuses
                .in('status', ['pending_approval', 'pending-approval', 'pending', 'review', 'draft'])
                .order('created_at', { ascending: false })
                .range(from, to);

            if (error) {
                console.error("Error fetching pending campaigns directly:", error);
                throw error;
            }

            // Corrected transformation to access nested 'brands' data
            const transformedData = (data || []).map(campaign => ({
              ...campaign,
              brand: campaign.brands ? { // Access nested 'brands' object
                  id: campaign.brands.id,
                  name: campaign.brands.name || 'Unknown Brand', // Use name from 'brands' table
                  logo_url: campaign.brands.logo_url
              } : {
                  id: campaign.brand_id, // Fallback using brand_id
                  name: 'Brand Not Found',
                  logo_url: null
              },
              // Remove the extra 'brands' key from the final object
              brands: undefined
            }));


            console.log(`[CampaignService] Fetched ${transformedData.length} pending campaigns directly.`);
            return transformedData as Campaign[]; // Cast to Campaign[] assuming transformation matches

        } catch (error) {
            console.error('[CampaignService] Error in getAllPendingCampaigns (direct query):', error);
            // Return empty array or re-throw based on desired error handling
            return [];
        }
    }

    // Keep core approval/rejection logic if needed, but simplify
    async approveCampaign(campaignId: string): Promise<Campaign> {
        console.log("[CampaignService] Approving campaign (step 1: calling RPC):", campaignId);
        try {
            const { data: user } = await this.supabase.auth.getUser();
            if (!user?.user?.id) throw new Error('Admin must be authenticated');
            
            // Call the RPC function to perform the approval logic in the database
            const { error: rpcError } = await this.supabase
                .rpc('approve_campaign', { 
                    campaign_id: campaignId,
                    admin_user_id: user.user.id
                });
                
            // If the RPC itself threw a database error, re-throw it
            if (rpcError) {
                 console.error("[CampaignService] RPC 'approve_campaign' failed:", rpcError);
                 throw rpcError;
            }
            
            // If RPC succeeded without error, fetch the updated campaign data separately
            console.log("[CampaignService] RPC 'approve_campaign' succeeded. Fetching updated campaign data...");
            const updatedCampaign = await this.getCampaignById(campaignId, true); // Fetch with creators

            if (!updatedCampaign) {
                 throw new Error('Campaign approved via RPC, but failed to fetch updated record.');
            }
            
            console.log("[CampaignService] Campaign approved and fetched successfully:", updatedCampaign.id, updatedCampaign.status);
            return updatedCampaign; 
            
        } catch (error) {
            // Catch errors from either the RPC call or the subsequent fetch
            console.error("[CampaignService] Error in approveCampaign process:", error);
            throw error; // Re-throw the caught error
        }
    }

    async rejectCampaign(campaignId: string, reason: string = ''): Promise<Campaign> {
        console.log("[CampaignService] Rejecting campaign (simplified):", campaignId);
        try {
             const { data: user } = await this.supabase.auth.getUser();
            if (!user?.user?.id) throw new Error('Admin must be authenticated');
            
            const { data, error } = await this.supabase
                .rpc('reject_campaign', { 
                    campaign_id: campaignId,
                    admin_user_id: user.user.id,
                    rejection_reason: reason
                });
            if (error) throw error;
             if (!data || data.length === 0) throw new Error('Rejection failed or campaign not found');
            console.log("[CampaignService] Campaign rejected successfully (simplified)");
            return data[0]; // Assuming RPC returns the updated campaign
        } catch (error) {
            console.error("[CampaignService] Error in rejectCampaign (simplified):", error);
            throw error;
        }
    }
    
     // Simplified approve/reject edit methods (can add later if complex logic needed)
     async approveCampaignEdit(editId: string, notes?: string): Promise<any> {
        console.log("[CampaignService] Approving campaign edit (simplified):", editId);
        // Placeholder: Implement direct DB update or RPC call
        // Ensure to update campaign_edits status and apply changes to campaigns table
        // For now, just log
         return { id: editId, status: 'approved' };
     }
     
     async rejectCampaignEdit(editId: string, reason: string): Promise<any> {
        console.log("[CampaignService] Rejecting campaign edit (simplified):", editId);
        // Placeholder: Implement direct DB update or RPC call
        // Ensure to update campaign_edits status
         // For now, just log
         return { id: editId, status: 'rejected' };
     }

    // Method to mark a campaign as completed
    async completeCampaign(campaignId: string): Promise<Campaign> {
        console.log("[CampaignService] Marking campaign as completed:", campaignId);
        try {
            const { data: updatedCampaign, error } = await this.supabase
                .from('campaigns')
                .update({ 
                    status: 'completed',
                    updated_at: new Date().toISOString()
                })
                .eq('id', campaignId)
                .select()
                .single();

            if (error) {
                console.error("[CampaignService] Error completing campaign:", error);
                throw error;
            }
            
            if (!updatedCampaign) {
                throw new Error('Failed to complete campaign or campaign not found.');
            }
            
            console.log("[CampaignService] Campaign marked as completed successfully:", updatedCampaign.id, updatedCampaign.status);
            // Return the full campaign data after updating
            return await this.getCampaignById(campaignId, true); // Fetch full data
            
        } catch (error) {
            console.error("[CampaignService] Error in completeCampaign process:", error);
            throw error; // Re-throw the caught error
        }
    }

    private async updateCampaignCreatorCount(campaignId: string): Promise<void> {
        console.log(`Updating creator count for campaign: ${campaignId}`);
        try {
            // Count active/approved creators for the campaign
            const { count, error: countError } = await this.supabase
                .from('campaign_creators')
                .select('*', { count: 'exact', head: true })
                .eq('campaign_id', campaignId)
                // Consider which statuses mean "joined" - 'active' and 'approved'?
                .in('status', ['active', 'approved']);

            if (countError) {
                console.error(`Error counting creators for campaign ${campaignId}:`, countError);
                // Don't throw, just log the error and skip the metric update
                return;
            }

            const creatorCount = count ?? 0;
            console.log(`Found ${creatorCount} active/approved creators for campaign ${campaignId}.`);

            // Fetch current metrics
            const { data: campaignData, error: fetchError } = await this.supabase
                .from('campaigns')
                .select('metrics')
                .eq('id', campaignId)
                .single();

            if (fetchError) {
                console.error(`Error fetching campaign ${campaignId} to update creator count:`, fetchError);
                return;
            }

            // Update the creators_joined metric
            const currentMetrics = campaignData.metrics || {};
            const updatedMetrics = {
                ...currentMetrics,
                creators_joined: creatorCount
            };

            // Only update if the count has actually changed
            if (currentMetrics.creators_joined !== creatorCount) {
                const { error: updateError } = await this.supabase
                    .from('campaigns')
                    .update({ metrics: updatedMetrics })
                    .eq('id', campaignId);

                if (updateError) {
                    console.warn(`Could not update creators_joined metric for campaign ${campaignId}:`, updateError);
                } else {
                    console.log(`Successfully updated creators_joined count for campaign ${campaignId} to ${creatorCount}`);
                }
            } else {
                 console.log(`Creator count for campaign ${campaignId} is already up-to-date (${creatorCount}). No update needed.`);
            }

        } catch (error) {
            console.error(`Unexpected error in updateCampaignCreatorCount for campaign ${campaignId}:`, error);
            // Log the error but don't let it crash the main operation
        }
    }
} 