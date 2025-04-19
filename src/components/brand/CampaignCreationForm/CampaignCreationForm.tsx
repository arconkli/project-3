import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowLeft, ArrowRight, Check, FileText } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import Calendar from './components/Calendar';
import type { CampaignFormData, Step, FieldErrors } from './types';
import { getInitialFormData, formatDate, calculateEstimatedViews, calculateViewTargets } from './utils';
import {
  DetailsStep,
  GuidelinesStep,
  CreatorViewStep,
  BudgetStep,
  PaymentStep,
  FinalReviewStep
} from './steps';
import { campaignService } from '@/services/campaign';
import { supabase } from '@/lib/supabaseClient';
import { getBrandProfileByUserId } from '@/services/brand/brandService';

// Helper functions for dates (in case they're not exported from utils)
const getToday = () => new Date().toISOString().split('T')[0];
const getDefaultEndDate = () => {
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
  return thirtyDaysFromNow.toISOString().split('T')[0];
};

interface CampaignCreationFormProps {
  onCancel: () => void;
  onComplete: () => void;
}

const CampaignCreationForm: React.FC<CampaignCreationFormProps> = ({
  onCancel,
  onComplete
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { state } = location;
  const isEditMode = state?.editMode === true;
  const campaignToEdit = state?.campaignData;
  
  // Add state for brand ID
  const [brandId, setBrandId] = useState<string>('');
  
  // Utility function to create a brand_users link
  const createBrandUserLink = async (userId: string, brandId: string) => {
    console.log(`Creating brand_users link between user ${userId} and brand ${brandId}`);
    
    try {
      // First check if the link already exists
      const { data: existingData, error: existingError } = await supabase
        .from('brand_users')
        .select('*')
        .eq('user_id', userId)
        .eq('brand_id', brandId);
        
      if (!existingError && existingData && existingData.length > 0) {
        console.log("Brand_users link already exists:", existingData[0]);
        return existingData[0];
      }
      
      // Create the link
      const { data, error } = await supabase
        .from('brand_users')
        .insert({
          user_id: userId,
          brand_id: brandId,
          role: 'owner',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select('*');
        
      if (error) {
        if (error.code === '23505') { // Unique violation
          console.log("Brand_users link already exists (detected during insert)");
          return { user_id: userId, brand_id: brandId };
        }
        
        console.error("Error creating brand_users link:", error);
        throw error;
      }
      
      console.log("Successfully created brand_users link:", data?.[0]);
      return data?.[0] || { user_id: userId, brand_id: brandId };
    } catch (error) {
      console.error("Exception creating brand_users link:", error);
      throw error;
    }
  };

  // Fetch the correct brand ID on component mount
  useEffect(() => {
    const fetchBrandId = async () => {
      try {
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          console.error("No authenticated user found");
          return;
        }
        
        console.log("Attempting to get brand ID for user:", user.id);
        
        // Diagnostic function to log the user's entire brand relationship
        const diagnoseAndFixBrandRecords = async (userId: string) => {
          console.log("🔍 DIAGNOSING BRAND RECORDS for user:", userId);
          
          // Step 1: Check profile
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('user_id', userId);
            
          if (profileError) {
            console.error("❌ Error querying profiles:", profileError);
          } else if (!profileData || profileData.length === 0) {
            console.error("❌ No profile found for user");
            
            // Try to create a profile
            try {
              console.log("🛠️ Attempting to create a profile for user");
              const { data: newProfile, error: newProfileError } = await supabase
                .from('profiles')
                .insert({
                  user_id: userId,
                  full_name: user.user_metadata?.full_name || "Brand User",
                  email: user.email,
                  role: "brand",
                  status: "active",
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString()
                })
                .select('*')
                .single();
                
              if (newProfileError) {
                console.error("❌ Failed to create profile:", newProfileError);
              } else {
                console.log("✅ Created new profile:", newProfile);
                // Create a new variable instead of reassigning the constant
                const updatedProfileData = [newProfile];
                // Continue processing with the new variable
                return processProfiles(updatedProfileData);
              }
            } catch (err) {
              console.error("❌ Exception creating profile:", err);
            }
          } else {
            console.log("✅ Found profile(s):", profileData);
            
            // Check if any profile is pending and update to active
            const pendingProfiles = profileData.filter(p => p.status === 'pending' && p.role === 'brand');
            if (pendingProfiles.length > 0) {
              for (const profile of pendingProfiles) {
                console.log("🛠️ Updating pending profile to active:", profile.id);
                try {
                  const { error: updateError } = await supabase
                    .from('profiles')
                    .update({ status: 'active', updated_at: new Date().toISOString() })
                    .eq('id', profile.id);
                    
                  if (updateError) {
                    console.error("❌ Failed to update profile status:", updateError);
                  } else {
                    console.log("✅ Updated profile status to active");
                  }
                } catch (err) {
                  console.error("❌ Exception updating profile:", err);
                }
              }
            }
          }
          
          // Step 2: Check for brands
          if (profileData && profileData.length > 0) {
            for (const profile of profileData) {
              console.log(`Checking brands for profile: ${profile.id}`);
              
              const { data: brandData, error: brandError } = await supabase
                .from('brands')
                .select('*')
                .eq('profile_id', profile.id);
                
              if (brandError) {
                console.error(`❌ Error querying brands for profile ${profile.id}:`, brandError);
              } else if (!brandData || brandData.length === 0) {
                console.log(`❌ No brands found for profile ${profile.id}`);
                
                // Create a brand for this profile
                try {
                  console.log(`🛠️ Creating brand for profile ${profile.id}`);
                  const { data: newBrand, error: newBrandError } = await supabase
                    .from('brands')
                    .insert({
                      profile_id: profile.id,
                      name: profile.full_name ? `${profile.full_name}'s Brand` : "My Brand",
                      description: "Brand automatically created during diagnosis",
                      contact_email: profile.email || user.email,
                      status: "active",
                      created_at: new Date().toISOString(),
                      updated_at: new Date().toISOString()
                    })
                    .select('*')
                    .single();
                    
                  if (newBrandError) {
                    console.error(`❌ Failed to create brand for profile ${profile.id}:`, newBrandError);
                  } else {
                    console.log(`✅ Created new brand: ${newBrand.id}`);
                    
                    // Brand created, now create the brand_users link
                    await createBrandUserLink(userId, newBrand.id);
                    
                    // Return the brand ID to use
                    return newBrand.id;
                  }
                } catch (err) {
                  console.error(`❌ Exception creating brand for profile ${profile.id}:`, err);
                }
              } else {
                console.log(`✅ Found brand(s) for profile ${profile.id}:`, brandData);
                
                // Check brand_users links for these brands
                for (const brand of brandData) {
                  console.log(`Checking brand_users link for brand ${brand.id}`);
                  
                  const { data: linkData, error: linkError } = await supabase
                    .from('brand_users')
                    .select('*')
                    .eq('user_id', userId)
                    .eq('brand_id', brand.id);
                    
                  if (linkError) {
                    console.error(`❌ Error querying brand_users for brand ${brand.id}:`, linkError);
                  } else if (!linkData || linkData.length === 0) {
                    console.log(`❌ No brand_users link found for brand ${brand.id}`);
                    
                    // Create the link
                    try {
                      await createBrandUserLink(userId, brand.id);
                    } catch (err) {
                      console.error(`❌ Exception creating brand_users link for brand ${brand.id}:`, err);
                    }
                  } else {
                    console.log(`✅ Found brand_users link for brand ${brand.id}:`, linkData);
                  }
                  
                  // Return the first valid brand ID
                  return brand.id;
                }
              }
            }
          }
          
          return null;
        };
        
        // Run diagnostics and fixes
        const diagnosedBrandId = await diagnoseAndFixBrandRecords(user.id);
        if (diagnosedBrandId) {
          console.log(`✅ Diagnosed and fixed brand data. Using brand ID: ${diagnosedBrandId}`);
          setBrandId(diagnosedBrandId);
          localStorage.setItem('currentBrandId', diagnosedBrandId);
          return;
        }
        
        // Try to get brand profile using our enhanced method
        try {
          const brandProfile = await getBrandProfileByUserId(user.id);
          if (brandProfile && brandProfile.id) {
            console.log(`✅ Using brand ID: ${brandProfile.id} from brand profile lookup`);
            setBrandId(brandProfile.id);
            
            // Store in localStorage for future fallback
            try {
              localStorage.setItem('currentBrandId', brandProfile.id);
              console.log("Saved brand ID to localStorage for fallback");
            } catch (storageError) {
              console.warn("Could not save to localStorage:", storageError);
            }
            
            return;
          }
        } catch (profileError) {
          console.error("Error from getBrandProfileByUserId:", profileError);
          // Continue to fallback methods
        }
        
        // Fallback 1: Direct query to brand_users table without using the service
        try {
          console.log("Attempting fallback 1: direct query to brand_users");
          const { data: brandUserData, error: brandUserError } = await supabase
            .from('brand_users')
            .select('brand_id')
            .eq('user_id', user.id);
            
          if (!brandUserError && brandUserData && brandUserData.length > 0) {
            const brandId = brandUserData[0].brand_id;
            console.log(`✅ Using brand ID: ${brandId} from direct brand_users query`);
            setBrandId(brandId);
            localStorage.setItem('currentBrandId', brandId);
            return;
          } else {
            console.log("Direct brand_users query returned no results or error:", brandUserError);
          }
        } catch (directQueryError) {
          console.error("Fallback 1 failed:", directQueryError);
        }
        
        // Fallback 2: Get profile ID first, then find brand by profile_id
        try {
          console.log("Attempting fallback 2: profile -> brand lookup");
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('id')
            .eq('user_id', user.id);
            
          if (profileError || !profileData || profileData.length === 0) {
            console.error("Error getting profile ID:", profileError);
            throw new Error("Failed to get profile ID");
          }
          
          // Use the first profile if multiple exist
          const profileId = profileData[0].id;
          console.log("Found profile ID:", profileId);
          
          const { data: brandData, error: brandError } = await supabase
            .from('brands')
            .select('id')
            .eq('profile_id', profileId);
            
          if (brandError) {
            console.error("Error querying brands table:", brandError);
            throw new Error("Failed to query brands table");
          }
          
          if (!brandData || brandData.length === 0) {
            // No brand found for this profile - try to create one
            console.log("No brand found for profile. Attempting to create one...");
            
            // Get the user's full profile information
            const { data: fullProfileData, error: fullProfileError } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', profileId)
              .single();
              
            if (fullProfileError || !fullProfileData) {
              console.error("Error getting full profile data:", fullProfileError);
              throw new Error("Failed to get full profile data");
            }
            
            // Create a brand for this profile
            const { data: newBrandData, error: newBrandError } = await supabase
              .from('brands')
              .insert({
                profile_id: profileId,
                name: fullProfileData.company_name || fullProfileData.full_name || "My Brand",
                description: "Brand automatically created for user profile",
                contact_email: fullProfileData.email || user.email,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              })
              .select('id')
              .single();
              
            if (newBrandError || !newBrandData) {
              console.error("Error creating brand:", newBrandError);
              throw new Error("Failed to create brand");
            }
            
            const brandId = newBrandData.id;
            console.log(`✅ Created new brand with ID: ${brandId} for profile`);
            
            // Create the brand_users link for this new brand
            await createBrandUserLink(user.id, brandId);
            
            setBrandId(brandId);
            localStorage.setItem('currentBrandId', brandId);
            return;
          }
          
          // Use the first brand if multiple exist
          const brandId = brandData[0].id;
          console.log(`✅ Using brand ID: ${brandId} from profile lookup`);
          setBrandId(brandId);
          localStorage.setItem('currentBrandId', brandId);
          
          // Create the missing brand_users link
          await createBrandUserLink(user.id, brandId);
          
          return;
        } catch (fallbackError) {
          console.error("Fallback 2 failed:", fallbackError);
          // Continue to final fallback
        }
        
        // Fallback 3: Check localStorage for brand data
        console.log("Attempting fallback 3: localStorage");
        const storedBrandId = localStorage.getItem('currentBrandId');
        if (storedBrandId) {
          console.log(`✅ Using brand ID from localStorage: ${storedBrandId}`);
          setBrandId(storedBrandId);
          
          // Try to create the missing brand_users link
          try {
            await createBrandUserLink(user.id, storedBrandId);
          } catch (linkError) {
            console.warn("Failed to create brand_users link with stored brand ID:", linkError);
          }
          
          return;
        }
        
        const storedBrandData = localStorage.getItem('brandData');
        const storedUserData = localStorage.getItem('userData');
        
        if (storedUserData) {
          const userData = JSON.parse(storedUserData);
          if (userData.brandProfileId) {
            console.log(`✅ Using brand ID from userData in localStorage: ${userData.brandProfileId}`);
            setBrandId(userData.brandProfileId);
            localStorage.setItem('currentBrandId', userData.brandProfileId);
            
            // Try to create the missing brand_users link
            try {
              await createBrandUserLink(user.id, userData.brandProfileId);
            } catch (linkError) {
              console.warn("Failed to create brand_users link with stored brand ID:", linkError);
            }
            
            return;
          }
        }
        
        // EMERGENCY FALLBACK: Create a dummy brand and establish links
        try {
          console.log("EMERGENCY FALLBACK: All methods failed. Creating a new brand and links...");
          
          // Get or create profile
          let profileId;
          const { data: existingProfile, error: profileQueryError } = await supabase
            .from('profiles')
            .select('id')
            .eq('user_id', user.id)
            .single();
            
          if (profileQueryError || !existingProfile) {
            // Create profile if it doesn't exist
            const { data: newProfile, error: newProfileError } = await supabase
              .from('profiles')
              .insert({
                user_id: user.id,
                full_name: user.user_metadata?.full_name || "Brand User",
                email: user.email,
                role: "brand",
                status: "active",
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              })
              .select('id')
              .single();
              
            if (newProfileError || !newProfile) {
              throw new Error("Failed to create profile in emergency fallback");
            }
            
            profileId = newProfile.id;
          } else {
            profileId = existingProfile.id;
          }
          
          // Create a new brand
          const brandName = user.user_metadata?.full_name ? `${user.user_metadata.full_name}'s Brand` : "My Brand";
          const { data: newBrand, error: newBrandError } = await supabase
            .from('brands')
            .insert({
              profile_id: profileId,
              name: brandName,
              description: "Automatically created brand",
              contact_email: user.email,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .select('id')
            .single();
            
            if (newBrandError || !newBrand) {
              throw new Error("Failed to create brand in emergency fallback");
            }
            
            // Create brand_users link
            await createBrandUserLink(user.id, newBrand.id);
            
            console.log(`✅ EMERGENCY FALLBACK SUCCESS: Created brand ID ${newBrand.id}`);
            setBrandId(newBrand.id);
            localStorage.setItem('currentBrandId', newBrand.id);
            return;
          } catch (emergencyError) {
            console.error("EMERGENCY FALLBACK FAILED:", emergencyError);
          }
          
          console.error("All brand ID lookup methods failed. Unable to create campaign.");
          // Show an error to the user with the retry button
          alert("Unable to fetch your brand information. Please refresh the page or try again later.");
        } catch (error) {
          console.error("Error fetching brand ID:", error);
        }
      };
      
      fetchBrandId();
    }, []);
  
  // Log the entire campaign structure to console for debugging
  useEffect(() => {
    if (isEditMode && campaignToEdit) {
      console.log("CAMPAIGN EDIT MODE - Campaign data structure:", campaignToEdit);
      // Also log as JSON for better inspection
      console.log("Campaign JSON:", JSON.stringify(campaignToEdit, null, 2));
    }
  }, [isEditMode, campaignToEdit]);
  
  const [step, setStep] = useState(0);
  const [showPreview, setShowPreview] = useState(false);
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [validationErrors, setValidationErrors] = useState<FieldErrors>({});

  // Sample payment methods (in a real app, this would come from an API)
  const paymentMethods = useMemo(
    () => [
      {
        id: 'pm_1',
        type: 'visa',
        last4: '4242',
        expiry: '12/25',
        isDefault: true,
      },
      {
        id: 'pm_2',
        type: 'mastercard',
        last4: '5555',
        expiry: '10/26',
        isDefault: false,
      },
    ],
    []
  );

  // Function to map campaign data to form data structure
  const mapCampaignToFormData = (campaign: any, defaultPaymentMethodId?: string): CampaignFormData => {
    console.log("Mapping campaign to form data:", campaign);
    
    // Debug log the campaign fields to help troubleshoot
    console.log("Campaign fields:", {
      title: campaign.title,
      description: campaign.description,
      platforms: campaign.platforms,
      content_type: campaign.content_type,
      budget: campaign.budget,
      start_date: campaign.start_date,
      end_date: campaign.end_date,
      requirements: campaign.requirements,
      brief: campaign.brief
    });
    
    // Check for platforms in different possible locations in the data structure
    let platformsArray = [];
    if (Array.isArray(campaign.platforms)) {
      platformsArray = campaign.platforms;
    } else if (campaign.requirements && Array.isArray(campaign.requirements.platforms)) {
      platformsArray = campaign.requirements.platforms;
    }
    
    console.log("Platforms array:", platformsArray);
    
    // Handle case where platforms might be stored as an object with boolean values
    let platformsObject = null;
    if (typeof campaign.platforms === 'object' && !Array.isArray(campaign.platforms)) {
      platformsObject = campaign.platforms;
    }
    
    console.log("Platforms object:", platformsObject);
    
    // Convert campaign platforms to the expected format
    const platforms = {
      tiktok: platformsArray.some((p: string) => p?.toLowerCase?.() === 'tiktok') || 
              (platformsObject && platformsObject.tiktok === true),
      instagram: platformsArray.some((p: string) => p?.toLowerCase?.() === 'instagram') || 
                (platformsObject && platformsObject.instagram === true),
      youtube: platformsArray.some((p: string) => p?.toLowerCase?.() === 'youtube') || 
               (platformsObject && platformsObject.youtube === true),
      twitter: platformsArray.some((p: string) => p?.toLowerCase?.() === 'twitter') || 
               (platformsObject && platformsObject.twitter === true),
    };
    
    console.log("Mapped platforms:", platforms);
    
    // Default content type to 'original' if not specified
    const contentType = campaign.content_type || 'original';
    
    // Handle empty values in budget
    const budget = campaign.budget ? campaign.budget.toString() : '1000';
    
    // Handle possible null values in the brief
    const brief = {
      original: campaign.brief?.original || '',
      repurposed: campaign.brief?.repurposed || ''
    };
    
    // Ensure hashtags are properly formatted
    const hashtags = {
      original: campaign.requirements?.hashtags?.original || '#ad',
      repurposed: campaign.requirements?.hashtags?.repurposed || '#ad'
    };
    
    // Handle payout rates with defaults
    const payoutRate = {
      original: campaign.requirements?.payoutRate?.original || '500',
      repurposed: campaign.requirements?.payoutRate?.repurposed || '250'
    };
    
    // Properly handle content guidelines without duplication
    let originalGuidelines = [''];
    let repurposedGuidelines = [''];
    
    if (campaign.requirements?.contentGuidelines) {
      if (Array.isArray(campaign.requirements.contentGuidelines)) {
        // If we're in edit mode and have both content types, try to separate guidelines
        // or assign them based on content type
        if (contentType === 'both') {
          // Split the guidelines array between original and repurposed
          const guidelinesCount = campaign.requirements.contentGuidelines.length;
          const halfIndex = Math.ceil(guidelinesCount / 2);
          
          // Use the first half for original content, second half for repurposed
          originalGuidelines = campaign.requirements.contentGuidelines
            .slice(0, halfIndex)
            .filter((g: string) => g.trim() !== '') || [''];
            
          repurposedGuidelines = campaign.requirements.contentGuidelines
            .slice(halfIndex)
            .filter((g: string) => g.trim() !== '') || [''];
            
          // If either is empty, give it at least one empty string for the UI
          if (originalGuidelines.length === 0) originalGuidelines = [''];
          if (repurposedGuidelines.length === 0) repurposedGuidelines = [''];
        } else if (contentType === 'original') {
          // All guidelines go to original content
          originalGuidelines = campaign.requirements.contentGuidelines
            .filter((g: string) => g.trim() !== '') || [''];
          repurposedGuidelines = [''];
        } else if (contentType === 'repurposed') {
          // All guidelines go to repurposed content
          originalGuidelines = [''];
          repurposedGuidelines = campaign.requirements.contentGuidelines
            .filter((g: string) => g.trim() !== '') || [''];
        }
      }
    }
    
    // Always set default dates when editing a campaign to ensure they are confirmed
    const today = getToday();
    const defaultEndDate = getDefaultEndDate();
    
    const formData = {
      title: campaign.title || '',
      brief,
      goal: '', // We no longer need this field, but the type probably still expects it
      platforms,
      contentType,
      budgetAllocation: {
        original: 70,
        repurposed: 30,
      },
      startDate: today,
      endDate: defaultEndDate,
      budget,
      payoutRate,
      hashtags,
      guidelines: {
        original: originalGuidelines,
        repurposed: repurposedGuidelines,
      },
      assets: [],
      paymentMethod: defaultPaymentMethodId || '',
      termsAccepted: false
    };
    
    console.log("Final mapped form data:", formData);
    return formData;
  };

  // Initialize form data with existing campaign data if in edit mode
  const [formData, setFormData] = useState<CampaignFormData>(() => {
    // If we're in edit mode and have campaign data, initialize with that
    if (isEditMode && campaignToEdit) {
      return mapCampaignToFormData(campaignToEdit, paymentMethods.find(m => m.isDefault)?.id);
    }
    // Otherwise use default initial data
    return getInitialFormData(paymentMethods.find(m => m.isDefault)?.id);
  });

  // Define steps
  const steps: Step[] = useMemo(
    () => [
      {
        title: 'Campaign Details',
        subtitle: "Let's set up your basic campaign information",
        isComplete: (data) => {
          return data.title.trim().length > 0 &&
            (data.platforms.tiktok || data.platforms.instagram || data.platforms.youtube || data.platforms.twitter) &&
            Boolean(data.contentType);
        }
      },
      {
        title: 'Content Guidelines',
        subtitle: 'Create your campaign brief, hashtags, and assets',
        isComplete: (data) => {
          let isValid = true;

          // Validate dates
          if (!data.startDate) {
            isValid = false;
          }
          if (!data.endDate) {
            isValid = false;
          }

          // Validate original content if applicable
          if (data.contentType === 'original' || data.contentType === 'both') {
            if (!data.brief.original.trim()) {
              isValid = false;
            }

            const validGuidelinesOriginal = data.guidelines.original.filter(g => g.trim().length > 0).length > 0;
            if (!validGuidelinesOriginal) {
              isValid = false;
            }

            const originalHashtag = data.hashtags.original.trim();
            if (!originalHashtag || !originalHashtag.startsWith('#') || originalHashtag.includes(' ') || !originalHashtag.toLowerCase().includes('ad')) {
              isValid = false;
            }
          }

          // Validate repurposed content if applicable
          if (data.contentType === 'repurposed' || data.contentType === 'both') {
            if (!data.brief.repurposed.trim()) {
              isValid = false;
            }

            const validGuidelinesRepurposed = data.guidelines.repurposed.filter(g => g.trim().length > 0).length > 0;
            if (!validGuidelinesRepurposed) {
              isValid = false;
            }

            const repurposedHashtag = data.hashtags.repurposed.trim();
            if (!repurposedHashtag || !repurposedHashtag.startsWith('#') || repurposedHashtag.includes(' ') || !repurposedHashtag.toLowerCase().includes('ad')) {
              isValid = false;
            }
          }

          return isValid;
        }
      },
      {
        title: 'Creator View',
        subtitle: 'Preview how your campaign appears to creators',
        isComplete: (data) => true // This step is always completable
      },
      {
        title: 'Budget & Rates',
        subtitle: 'Set your campaign budget for views',
        isComplete: (data) => {
          let isValid = true;

          const budgetValue = parseFloat(data.budget);
          const originalRateValue = parseFloat(data.payoutRate.original);
          const repurposedRateValue = parseFloat(data.payoutRate.repurposed);

          // Check if budget is at least $1000
          if (isNaN(budgetValue) || budgetValue < 1000) {
            isValid = false;
          }

          // Check original rate if applicable
          if (data.contentType === 'original' || data.contentType === 'both') {
            if (isNaN(originalRateValue) || originalRateValue < 500) {
              isValid = false;
            }
          }

          // Check repurposed rate if applicable
          if (data.contentType === 'repurposed' || data.contentType === 'both') {
            if (isNaN(repurposedRateValue) || repurposedRateValue < 250) {
              isValid = false;
            }
          }

          return isValid;
        }
      },
      {
        title: 'Payment Summary',
        subtitle: 'Review your payment details',
        isComplete: (data) => {
          return Boolean(data.paymentMethod);
        }
      },
      {
        title: 'Final Review',
        subtitle: 'Review your campaign before submission',
        isComplete: (data) => {
          return data.termsAccepted;
        }
      }
    ],
    []
  );

  // Handle form changes
  const handleChange = useCallback(
    (
      e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
    ) => {
      const { name, value, type } = e.target;
      
      // Clear validation error when field is changed
      if (validationErrors[name]) {
        setValidationErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors[name];
          return newErrors;
        });
      }

      // For checkbox inputs, handle the checked property
      if (type === 'checkbox') {
        const checkboxInput = e.target as HTMLInputElement;
        setFormData((prev) => ({
          ...prev,
          [name]: checkboxInput.checked,
        }));
        return;
      }

      // Special handling for budget to prevent rounding issues
      if (name === 'budget') {
        // Store budget as string exactly as entered, without any calculations
        setFormData((prev) => ({
          ...prev,
          budget: value,
        }));
        return;
      }
      
      // Special handling for dates
      if (name === 'startDate' || name === 'endDate') {
        const startDate = name === 'startDate' ? value : formData.startDate;
        const endDate = name === 'endDate' ? value : formData.endDate;
        
        // Validate dates
        const start = new Date(startDate);
        const end = new Date(endDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const errors: FieldErrors = {};
        
        if (start < today) {
          errors.startDate = 'Start date cannot be in the past';
        }
        
        if (end <= start) {
          errors.endDate = 'End date must be after start date';
        }
        
        const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
        if (daysDiff < 30) {
          errors.endDate = 'Campaign must run for at least 30 days';
        }
        
        setValidationErrors(prev => ({ ...prev, ...errors }));
      }

      // Special handling for hashtags
      if (name === 'hashtags.original' || name === 'hashtags.repurposed') {
        const hashtagType = name.split('.')[1] as 'original' | 'repurposed';
        let newValue = value.replace(/\s+/g, '').trim();
        if (newValue && !newValue.startsWith('#')) {
          newValue = '#' + newValue;
        }

        setFormData((prev) => ({
          ...prev,
          hashtags: {
            ...prev.hashtags,
            [hashtagType]: newValue,
          },
        }));
        return;
      }

      // Handle nested fields
      if (name.includes('.')) {
        const [parent, child] = name.split('.');
        setFormData((prev) => ({
          ...prev,
          [parent]: {
            ...prev[parent as keyof typeof prev],
            [child]: value,
          },
        }));
        return;
      }

      // Handle regular fields
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    },
    [validationErrors]
  );

  // Handle platform selection
  const handlePlatformChange = useCallback((platform: keyof CampaignFormData['platforms']) => {
    setFormData((prev) => ({
      ...prev,
      platforms: {
        ...prev.platforms,
        [platform]: !prev.platforms[platform],
      },
    }));
  }, []);

  // Handle content type selection
  const handleContentTypeChange = useCallback((type: 'original' | 'repurposed' | 'both') => {
    setFormData((prev) => ({
      ...prev,
      contentType: type,
    }));
  }, []);

  // Handle date selection
  const handleDateSelect = useCallback((type: 'start' | 'end', date: string) => {
    setFormData((prev) => ({
      ...prev,
      [type === 'start' ? 'startDate' : 'endDate']: date,
    }));
  }, []);

  // Handle file uploads
  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setFormData((prev) => ({
        ...prev,
        assets: [...prev.assets, ...newFiles],
      }));
    }
  }, []);

  const handleRemoveFile = useCallback((index: number) => {
    setFormData((prev) => ({
      ...prev,
      assets: prev.assets.filter((_, i) => i !== index),
    }));
  }, []);

  // Navigation
  const handleNext = useCallback(() => {
    if (step < steps.length - 1) {
      setStep((prev) => prev + 1);
      window.scrollTo(0, 0);
    } else {
      setShowPreview(true);
    }
  }, [step, steps.length]);

  // Handle adding/removing guidelines
  const handleAddGuideline = useCallback((type: 'original' | 'repurposed') => {
    setFormData((prev) => ({
      ...prev,
      guidelines: {
        ...prev.guidelines,
        [type]: [...prev.guidelines[type], '']
      }
    }));
  }, []);

  const handleRemoveGuideline = useCallback((type: 'original' | 'repurposed', index: number) => {
    setFormData((prev) => ({
      ...prev,
      guidelines: {
        ...prev.guidelines,
        [type]: prev.guidelines[type].filter((_, i) => i !== index)
      }
    }));
  }, []);

  const handleGuidelineChange = useCallback((type: 'original' | 'repurposed', index: number, value: string) => {
    setFormData((prev) => {
      const newGuidelines = [...prev.guidelines[type]];
      newGuidelines[index] = value;
      return {
        ...prev,
        guidelines: {
          ...prev.guidelines,
          [type]: newGuidelines
        }
      };
    });
  }, []);

  const handleBack = useCallback(() => {
    if (step > 0) {
      setStep((prev) => prev - 1);
      window.scrollTo(0, 0);
    } else {
      onCancel();
    }
  }, [step, onCancel]);

  // Save campaign
  const handleSaveCampaign = useCallback(() => {
    // Check if we have a valid brand ID
    if (!brandId) {
      console.error("No valid brand ID available. Please refresh the page and try again.");
      alert("Unable to save campaign: Brand information could not be loaded. Please refresh the page and try again.");
      return;
    }

    // Calculate view targets using the new logic
    const viewTargets = calculateViewTargets(
      formData.budget,
      formData.payoutRate.original, // Using payoutRate as cost per million views
      formData.payoutRate.repurposed, // Using payoutRate as cost per million views
      formData.contentType,
      formData.budgetAllocation
    );
    
    // Debug log for view targets and budget allocation
    console.log('Calculated view targets:', viewTargets);
    console.log('Budget allocation:', formData.budgetAllocation);
    console.log('Content type:', formData.contentType);
    
    // Convert form data to the format expected by the API
    const campaignData = {
      title: formData.title,
      brief: {
        original: formData.brief.original || null,
        repurposed: formData.brief.repurposed || null
      },
      content_type: formData.contentType,
      budget: parseFloat(formData.budget) || 0, // Ensure budget is a number
      start_date: formData.startDate,
      end_date: formData.endDate,
      platforms: Object.entries(formData.platforms)
        .filter(([_, isSelected]) => isSelected)
        .map(([platform]) => platform),
      requirements: {
        // Create a fresh array of guidelines to prevent duplication
        contentGuidelines: [
          ...(formData.contentType === 'original' || formData.contentType === 'both' ? formData.guidelines.original : []),
          ...(formData.contentType === 'repurposed' || formData.contentType === 'both' ? formData.guidelines.repurposed : [])
        ].filter(guideline => guideline.trim() !== ''),
        minViewsForPayout: "1000", // This might need review - unrelated to target calculation
        totalBudget: parseFloat(formData.budget) || 0, // Ensure budget is a number
        payoutRate: { // Keep sending original payout rates as they might be used elsewhere
          original: formData.payoutRate.original,
          repurposed: formData.payoutRate.repurposed
        },
        hashtags: {
          original: formData.hashtags.original,
          repurposed: formData.hashtags.repurposed
        },
        // Add budget allocation information
        budget_allocation: {
          original: formData.budgetAllocation.original,
          repurposed: formData.budgetAllocation.repurposed
        }
        // REMOVED: view_estimates calculation and field are no longer needed here
      },
      // Add the new view target fields at the top level
      total_view_target: viewTargets.total,
      original_view_target: viewTargets.original,
      repurposed_view_target: viewTargets.repurposed
    };

    // Log debug information
    console.log("Save operation:", isEditMode ? "EDIT" : "CREATE");
    console.log("Using brand ID:", brandId);
    if (isEditMode) {
      console.log("Campaign to edit:", campaignToEdit);
      console.log("Campaign ID:", campaignToEdit?.id);
    }
    
    // Simulate API call
    setTimeout(() => {
      // Call campaign service based on whether we're editing or creating
      const savePromise = isEditMode && campaignToEdit && campaignToEdit.id 
        ? campaignService.updateCampaign(campaignToEdit.id.toString(), campaignData)
        : campaignService.createCampaign(brandId, campaignData);
      
      savePromise
        .then(() => {
          setShowSaveSuccess(true);
          setTimeout(() => {
            navigate('/brand/dashboard');
          }, 2000);
        })
        .catch(error => {
          console.error('Error saving campaign:', error);
          
          // Show error with guidance for the RLS issue
          alert(`Database error encountered: ${error.message || 'Unknown error'}\n\nThe campaign has been saved locally but not to the server. This may be due to a database policy issue. Please contact your administrator.`);
          
          // Enhanced localStorage fallback with additional console logging for debugging
          console.log('Using localStorage fallback to save campaign data');
          try {
            // If editing, update the existing campaign in localStorage
            if (isEditMode && campaignToEdit && campaignToEdit.id) {
              const campaigns = JSON.parse(localStorage.getItem('brandCampaigns') || '[]');
              const updatedCampaigns = campaigns.map((c: any) => {
                if (c.id === campaignToEdit.id) {
                  return {
                    ...c,
                    ...campaignData,
                    updated_at: new Date().toISOString()
                  };
                }
                return c;
              });
              localStorage.setItem('brandCampaigns', JSON.stringify(updatedCampaigns));
              console.log('Campaign updated in localStorage:', campaignData);
            } else {
              // Create new campaign in localStorage
              const campaignId = `campaign-${Date.now()}`;
              const campaigns = JSON.parse(localStorage.getItem('brandCampaigns') || '[]');
              
              // Create a well-formed campaign object
              const localCampaign = {
                ...campaignData,
                id: campaignId,
                brand_id: brandId,
                status: 'draft',
                spent: 0,
                metrics: {
                  views: 0,
                  engagement: 0,
                  creators_joined: 0,
                  posts_submitted: 0,
                  posts_approved: 0
                },
                createdAt: new Date().toISOString(),
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              };
              
              campaigns.push(localCampaign);
              localStorage.setItem('brandCampaigns', JSON.stringify(campaigns));
              console.log('Campaign saved to localStorage:', localCampaign);
            }
          } catch (localStorageError) {
            console.error('Error saving to localStorage:', localStorageError);
          }
          
          setShowSaveSuccess(true);
          setTimeout(() => {
            navigate('/brand/dashboard');
          }, 2000);
        });
    }, 1000);
  }, [formData, navigate, isEditMode, campaignToEdit, brandId]);

  // Submit campaign
  const handleSubmitCampaign = useCallback(() => {
    // Check if we have a valid brand ID
    if (!brandId) {
      console.error("No valid brand ID available. Please refresh the page and try again.");
      alert("Unable to submit campaign: Brand information could not be loaded. Please refresh the page and try again.");
      return;
    }
    
    setIsProcessingPayment(true);
    
    // Calculate view targets using the new logic
    const viewTargets = calculateViewTargets(
      formData.budget,
      formData.payoutRate.original, // Using payoutRate as cost per million views
      formData.payoutRate.repurposed, // Using payoutRate as cost per million views
      formData.contentType,
      formData.budgetAllocation
    );
    
    // Debug log for view targets and budget allocation
    console.log('Calculated view targets:', viewTargets);
    console.log('Budget allocation:', formData.budgetAllocation);
    console.log('Content type:', formData.contentType);
    
    // Convert form data to the format expected by the API
    const campaignData = {
      title: formData.title,
      brief: {
        original: formData.brief.original || null,
        repurposed: formData.brief.repurposed || null
      },
      content_type: formData.contentType,
      budget: parseFloat(formData.budget) || 0, // Ensure budget is a number
      start_date: formData.startDate,
      end_date: formData.endDate,
      platforms: Object.entries(formData.platforms)
        .filter(([_, isSelected]) => isSelected)
        .map(([platform]) => platform),
      requirements: {
        // Create a fresh array of guidelines to prevent duplication
        contentGuidelines: [
          ...(formData.contentType === 'original' || formData.contentType === 'both' ? formData.guidelines.original : []),
          ...(formData.contentType === 'repurposed' || formData.contentType === 'both' ? formData.guidelines.repurposed : [])
        ].filter(guideline => guideline.trim() !== ''),
        minViewsForPayout: "1000", // This might need review - unrelated to target calculation
        totalBudget: parseFloat(formData.budget) || 0, // Ensure budget is a number
        payoutRate: { // Keep sending original payout rates as they might be used elsewhere
          original: formData.payoutRate.original,
          repurposed: formData.payoutRate.repurposed
        },
        hashtags: {
          original: formData.hashtags.original,
          repurposed: formData.hashtags.repurposed
        },
        // Add budget allocation information
        budget_allocation: {
          original: formData.budgetAllocation.original,
          repurposed: formData.budgetAllocation.repurposed
        }
        // REMOVED: view_estimates calculation and field are no longer needed here
      },
      // Add the new view target fields at the top level
      total_view_target: viewTargets.total,
      original_view_target: viewTargets.original,
      repurposed_view_target: viewTargets.repurposed
    };

    // Log debug information
    console.log("Submit operation:", isEditMode ? "EDIT" : "CREATE");
    console.log("Using brand ID:", brandId);
    if (isEditMode && campaignToEdit) {
      console.log("Campaign to edit:", campaignToEdit);
      console.log("Campaign ID:", campaignToEdit.id);
    }
    
    setTimeout(() => {
      // Call campaign service
      const savePromise = isEditMode && campaignToEdit && campaignToEdit.id
        ? campaignService.updateCampaign(campaignToEdit.id.toString(), campaignData)
        : campaignService.createCampaign(brandId, campaignData);
        
      savePromise
        .then(campaign => {
          console.log("Campaign created/updated successfully:", campaign);
          
          // Get the appropriate campaign ID
          const campaignId = isEditMode && campaignToEdit && campaignToEdit.id 
            ? campaignToEdit.id.toString() 
            : campaign.id.toString();
          
          // For a new campaign, or if updating a draft campaign, submit for approval
          if (!isEditMode || (campaignToEdit && (campaignToEdit.status === 'draft' || campaignToEdit.status === 'rejected'))) {
            console.log("Submitting campaign for approval with ID:", campaignId);
            return campaignService.submitCampaignForApproval(campaignId)
              .catch(approvalError => {
                console.error("Error submitting for approval:", approvalError);
                
                // If it's a constraint error, we can still consider it a partial success
                if (approvalError.message && approvalError.message.includes('constraint')) {
                  console.warn("Campaign was created but couldn't be submitted for approval due to status constraint");
                  alert("Campaign created successfully but couldn't be automatically submitted for approval. Please contact support.");
                  return campaign; // Return the original campaign
                }
                
                throw approvalError; // Re-throw if it's a different error
              });
          }
          
          return campaign; // If we're not submitting for approval, just return the campaign
        })
        .then(() => {
          setIsProcessingPayment(false);
          setShowSaveSuccess(true);
          setTimeout(() => {
            navigate('/brand/dashboard');
          }, 2000);
        })
        .catch(error => {
          console.error('Error submitting campaign:', error);
          console.error('Error message:', error.message);
          
          // More detailed error handling with specific guidance
          let errorMessage = "Database error encountered";
          
          if (error.message && error.message.includes('violates check constraint "valid_status"')) {
            errorMessage = "Campaign was created but couldn't be submitted for approval due to a status constraint. Please check your database settings.";
          } else if (error.message && error.message.includes('infinite recursion')) {
            errorMessage = "Database policy error detected. Please contact your administrator to fix the RLS policy on the campaigns table.";
          } else {
            errorMessage = `Error: ${error.message || 'Unknown error'}`;
          }
          
          alert(`${errorMessage}\n\nThe campaign has been saved locally as a fallback.`);
          
          // Enhanced localStorage fallback
          console.log('Using localStorage fallback to save campaign data');
          try {
            if (isEditMode && campaignToEdit && campaignToEdit.id) {
              // Update existing campaign in localStorage
              const campaigns = JSON.parse(localStorage.getItem('brandCampaigns') || '[]');
              const updatedCampaigns = campaigns.map((c: any) => {
                if (c.id === campaignToEdit.id) {
                  return {
                    ...c,
                    ...campaignData,
                    status: 'pending_approval',
                    updated_at: new Date().toISOString()
                  };
                }
                return c;
              });
              localStorage.setItem('brandCampaigns', JSON.stringify(updatedCampaigns));
            } else {
              // Create new campaign
              const campaignId = `campaign-${Date.now()}`;
              const campaigns = JSON.parse(localStorage.getItem('brandCampaigns') || '[]');
              
              // Create a well-formed campaign object for local storage
              const localCampaign = {
                ...campaignData,
                id: campaignId,
                brand_id: brandId,
                status: 'pending_approval',
                spent: 0,
                metrics: {
                  views: 0,
                  engagement: 0,
                  creators_joined: 0,
                  posts_submitted: 0,
                  posts_approved: 0
                },
                createdAt: new Date().toISOString(),
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              };
              
              campaigns.push(localCampaign);
              localStorage.setItem('brandCampaigns', JSON.stringify(campaigns));
              console.log('Campaign saved to localStorage with pending_approval status:', localCampaign);
            }
          } catch (localStorageError) {
            console.error('Error saving to localStorage:', localStorageError);
          }
          
          setIsProcessingPayment(false);
          setShowSaveSuccess(true);
          setTimeout(() => {
            navigate('/brand/dashboard');
          }, 2000);
        });
    }, 2500);
  }, [formData, navigate, isEditMode, campaignToEdit, brandId]);

  // Helper function to continue processing with profile data
  const processProfiles = (profiles: any[]) => {
    // If we get here, we can assume there's at least one profile
    console.log("✅ Processing profiles:", profiles);
    
    // Continue with brand checks for these profiles
    for (const profile of profiles) {
      // Check for brands logic can go here
      // This replaces the duplicate brand checking code
      return checkBrandsForProfile(profile);
    }
    return null;
  };

  const checkBrandsForProfile = async (profile: any) => {
    console.log(`Checking brands for profile: ${profile.id}`);
    
    const { data: brandData, error: brandError } = await supabase
      .from('brands')
      .select('*')
      .eq('profile_id', profile.id);
      
    if (brandError) {
      console.error(`❌ Error querying brands for profile ${profile.id}:`, brandError);
    } else if (!brandData || brandData.length === 0) {
      console.log(`❌ No brands found for profile ${profile.id}`);
      
      // Create a brand for this profile
      try {
        console.log(`🛠️ Creating brand for profile ${profile.id}`);
        const { data: newBrand, error: newBrandError } = await supabase
          .from('brands')
          .insert({
            profile_id: profile.id,
            name: profile.full_name ? `${profile.full_name}'s Brand` : "My Brand",
            description: "Brand automatically created during diagnosis",
            contact_email: profile.email || user.email,
            status: "active",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select('*')
          .single();
          
        if (newBrandError) {
          console.error(`❌ Failed to create brand for profile ${profile.id}:`, newBrandError);
        } else {
          console.log(`✅ Created new brand: ${newBrand.id}`);
          
          // Brand created, now create the brand_users link
          await createBrandUserLink(userId, newBrand.id);
          
          // Return the brand ID to use
          return newBrand.id;
        }
      } catch (err) {
        console.error(`❌ Exception creating brand for profile ${profile.id}:`, err);
      }
    } else {
      console.log(`✅ Found brand(s) for profile ${profile.id}:`, brandData);
      
      // Check brand_users links for these brands
      for (const brand of brandData) {
        console.log(`Checking brand_users link for brand ${brand.id}`);
        
        const { data: linkData, error: linkError } = await supabase
          .from('brand_users')
          .select('*')
          .eq('user_id', userId)
          .eq('brand_id', brand.id);
          
        if (linkError) {
          console.error(`❌ Error querying brand_users for brand ${brand.id}:`, linkError);
        } else if (!linkData || linkData.length === 0) {
          console.log(`❌ No brand_users link found for brand ${brand.id}`);
          
          // Create the link
          try {
            await createBrandUserLink(userId, brand.id);
          } catch (err) {
            console.error(`❌ Exception creating brand_users link for brand ${brand.id}:`, err);
          }
        } else {
          console.log(`✅ Found brand_users link for brand ${brand.id}:`, linkData);
        }
        
        // Return the first valid brand ID
        return brand.id;
      }
    }
    
    return null;
  }

  return (
    <div className="min-h-screen bg-black" role="main">
      {/* Header */}
      <header className="border-b border-gray-800 bg-black bg-opacity-80 backdrop-blur-sm sticky top-0 z-40" role="banner">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            <h1 className="text-xl font-bold">{isEditMode ? 'Edit Campaign' : 'Create Campaign'}</h1>

            <button
              type="button"
              onClick={onCancel}
              className="p-2 text-gray-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-red-500 rounded-lg transition-colors"
              aria-label="Close"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Success message */}
        <AnimatePresence>
          {showSaveSuccess && (
            <motion.div
              className="fixed top-4 right-4 flex items-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg shadow-lg z-50 max-w-[90vw]"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              role="alert"
            >
              <Check className="h-5 w-5" />
              <span>Campaign saved successfully</span>
            </motion.div>
          )}
        </AnimatePresence>

        {showPreview ? (
          <FinalReviewStep
            formData={formData}
            onBack={() => setShowPreview(false)}
            onSave={handleSaveCampaign}
            onSubmit={handleSubmitCampaign}
            isProcessingPayment={isProcessingPayment}
            paymentMethods={paymentMethods}
          />
        ) : (
          <>
            {/* Progress bar */}
            <div className="mb-8" role="progressbar" aria-valuenow={step + 1} aria-valuemin={1} aria-valuemax={steps.length}>
              <div className="flex gap-1">
                {steps.map((_, index) => (
                  <div
                    key={index}
                    className={`h-1 flex-1 rounded-full ${
                      index < step
                        ? 'bg-red-500'
                        : index === step
                        ? 'bg-red-500/70'
                        : 'bg-gray-700'
                    }`}
                  />
                ))}
              </div>
              <div className="flex justify-between mt-2 text-sm text-gray-400">
                <span>Step {step + 1} of {steps.length}</span>
                <span>{steps[step].title}</span>
              </div>
            </div>

            {/* Step content */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold mb-2">{steps[step].title}</h2>
              <p className="text-gray-400 mb-6">{steps[step].subtitle}</p>

              {/* Render current step */}
              {step === 0 && (
                <DetailsStep
                  formData={formData}
                  validationErrors={validationErrors}
                  onChange={handleChange}
                  onPlatformChange={handlePlatformChange}
                  onContentTypeChange={handleContentTypeChange}
                />
              )}
              {step === 1 && (
                <GuidelinesStep
                  formData={formData}
                  validationErrors={validationErrors}
                  onChange={handleChange}
                  onAddGuideline={handleAddGuideline}
                  onRemoveGuideline={handleRemoveGuideline}
                  onGuidelineChange={handleGuidelineChange}
                  onDateSelect={handleDateSelect}
                  onFileUpload={handleFileUpload}
                  onRemoveFile={handleRemoveFile}
                  startDate={formData.startDate}
                  endDate={formData.endDate}
                />
              )}
              {step === 2 && (
                <CreatorViewStep
                  formData={formData}
                />
              )}
              {step === 3 && (
                <BudgetStep
                  formData={formData}
                  validationErrors={validationErrors}
                  onChange={handleChange}
                />
              )}
              {step === 4 && (
                <PaymentStep
                  formData={formData}
                  validationErrors={validationErrors}
                  onChange={handleChange}
                  paymentMethods={paymentMethods}
                />
              )}
              {step === 5 && (
                <FinalReviewStep
                  formData={formData}
                  validationErrors={validationErrors}
                  onChange={handleChange}
                  onBack={() => setShowPreview(false)}
                  onSave={handleSaveCampaign}
                  onSubmit={handleSubmitCampaign}
                  isProcessingPayment={isProcessingPayment}
                  paymentMethods={paymentMethods}
                />
              )}
            </div>

            {/* Navigation buttons */}
            <div className="flex flex-col sm:flex-row justify-between gap-3 pt-4 border-t border-gray-800">
              <button
                type="button"
                onClick={handleBack}
                className="px-4 py-2 flex items-center justify-center gap-2 border border-gray-700 rounded-lg hover:bg-white/5 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors w-full sm:w-auto"
              >
                <ArrowLeft className="h-4 w-4" />
                {step === 0 ? 'Cancel' : 'Back'}
              </button>

              <div className="flex gap-3 w-full sm:w-auto">
                {/* Save as Draft button for all steps except final review */}
                {step < steps.length - 1 && (
                  <button
                    type="button"
                    onClick={handleSaveCampaign}
                    className="px-4 py-2 flex items-center justify-center gap-2 border border-gray-700 bg-black hover:bg-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors w-full sm:w-auto"
                  >
                    <FileText className="h-4 w-4" />
                    Save as Draft
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleNext}
                  className={`px-4 py-2 flex items-center justify-center gap-2 rounded-lg transition-colors w-full sm:w-auto ${step === steps.length - 1 ? 'hidden' : ''} ${
                    steps[step].isComplete(formData)
                      ? 'bg-red-600 hover:bg-red-700 text-white'
                      : 'bg-gray-800 text-gray-500'
                  }`}
                  disabled={!steps[step].isComplete(formData)}
                  aria-label={steps[step].isComplete(formData) ? 'Continue to next step' : 'Complete current step to continue'}
                >
                  Continue
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default CampaignCreationForm;