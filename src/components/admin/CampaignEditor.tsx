import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Save, Calendar, DollarSign, Plus, Trash2, Info, Eye } from 'lucide-react';
import { formatMoney } from '@/utils/format';
import type { Campaign } from '@/types/brand';
import { supabase } from '@/lib/supabaseClient';
import { calculateViewTargets } from '@/components/brand/CampaignCreationForm/utils'; // Import the shared calculation function

// Add new interface for brand options
interface BrandOption {
  id: string;
  name: string;
}

interface CampaignEditorProps {
  campaign?: Campaign; // Optional - if provided, we're editing
  onClose: () => void;
  onSave: (campaign: Partial<Campaign>) => void;
  isAdmin?: boolean; // Add prop to determine if admin-specific features should be shown
}

const CampaignEditor: React.FC<CampaignEditorProps> = ({
  campaign,
  onClose,
  onSave,
  isAdmin = false // Default to false
}) => {
  const [formData, setFormData] = useState({
    title: '',
    brief: {
      original: '',
      repurposed: ''
    },
    contentType: 'original' as 'original' | 'repurposed' | 'both',
    startDate: '',
    endDate: '',
    platforms: {
      tiktok: false,
      instagram: false,
      youtube: false,
      twitter: false
    },
    minViewsForPayout: '100K',
    guidelines: {
      original: [''],
      repurposed: ['']
    },
    hashtags: {
      original: '#BrandAd',
      repurposed: '#BrandPartner'
    },
    budget: '1000',
    payoutRate: {
      original: '500',
      repurposed: '250'
    },
    budgetAllocation: {
      original: 50,
      repurposed: 50
    }
  });

  // Add loading state
  const [isSaving, setIsSaving] = useState(false);
  
  // Add state for brands for admin selection
  const [brands, setBrands] = useState<BrandOption[]>([]);
  const [brandsLoading, setBrandsLoading] = useState(false);
  const [selectedBrandId, setSelectedBrandId] = useState<string>('');
  const [brandInputMode, setBrandInputMode] = useState<'select' | 'create'>('select');
  const [newBrandName, setNewBrandName] = useState('');
  const [newBrandContactEmail, setNewBrandContactEmail] = useState('');

  // Fetch brands for admin users
  useEffect(() => {
    if (isAdmin) {
      const fetchBrands = async () => {
        setBrandsLoading(true);
        try {
          // Fetch from the correct 'brands' table
          const { data: brandsData, error: brandsError } = await supabase
            .from('brands') // Use 'brands' table
            .select('id, name'); // Select 'name' column

          // Log the error specifically
          if (brandsError) {
             console.error('Supabase error fetching brands:', brandsError);
             throw brandsError;
          }

          console.log('Fetched brands:', brandsData); // Log fetched data

          if (brandsData && brandsData.length > 0) {
            // Map using the correct 'name' column
            const mappedBrands = brandsData.map((brand) => {
              return {
                id: brand.id,
                name: brand.name || 'Unknown Brand' // Use 'name'
              };
            });

            setBrands(mappedBrands);
            
            // Set default selected brand for new campaigns
            if (!campaign && mappedBrands.length > 0 && brandInputMode === 'select') {
              setSelectedBrandId(mappedBrands[0].id);
            }
          }
        } catch (error) {
          console.error('Error fetching brands:', error);
        } finally {
          setBrandsLoading(false);
        }
      };

      fetchBrands();
    }
  }, [isAdmin, campaign, brandInputMode]);

  // Calculate target views based on budget and payout rates
  const calculateTargetViews = () => {
    const budget = parseInt(formData.budget) || 0;
    const originalRate = parseInt(formData.payoutRate.original) || 500;
    const repurposedRate = parseInt(formData.payoutRate.repurposed) || 250;
    
    // If there's no budget, return zeros
    if (budget <= 0) return { total: 0, original: 0, repurposed: 0 };
    
    let originalViews = 0;
    let repurposedViews = 0;
    
    // Calculate based on content type and budget allocation
    if (formData.contentType === 'original') {
      originalViews = (budget / originalRate) * 1000000;
    } else if (formData.contentType === 'repurposed') {
      repurposedViews = (budget / repurposedRate) * 1000000;
    } else {
      // For 'both', use the budget allocation percentages
      const originalBudget = budget * (formData.budgetAllocation.original / 100);
      const repurposedBudget = budget * (formData.budgetAllocation.repurposed / 100);
      
      originalViews = (originalBudget / originalRate) * 1000000;
      repurposedViews = (repurposedBudget / repurposedRate) * 1000000;
    }
    
    return {
      total: originalViews + repurposedViews,
      original: originalViews,
      repurposed: repurposedViews
    };
  };

  // Format numbers for display
  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return Math.round(num).toString();
  };

  // Format date strings to ensure proper format for the date input
  const formatDateForInput = (dateString: string) => {
    if (!dateString) return '';
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '';
      
      // Format as YYYY-MM-DD
      return date.toISOString().split('T')[0];
    } catch (error) {
      console.error('Error formatting date:', error);
      return '';
    }
  };

  // Initialize form data when campaign is provided
  useEffect(() => {
    if (campaign) {
      const brief = campaign.brief || { original: null, repurposed: null };
      const requirements = campaign.requirements || {
        contentGuidelines: [],
        platforms: [],
        minViewsForPayout: '100K',
        payoutRate: {
          original: '$500 per 1M views',
          repurposed: '$250 per 1M views'
        },
        hashtags: {
          original: '#BrandAd',
          repurposed: '#BrandPartner'
        },
        budget_allocation: {
          original: 50,
          repurposed: 50
        }
      };

      // Normalize platform names for case-insensitive comparison
      const normalizedPlatforms = campaign.platforms && Array.isArray(campaign.platforms) 
        ? campaign.platforms.map(p => p.toLowerCase())
        : [];

      // Format dates properly for input fields
      const formattedStartDate = formatDateForInput(campaign.startDate);
      const formattedEndDate = formatDateForInput(campaign.endDate);

      setFormData({
        title: campaign.title,
        brief: {
          original: brief.original || '',
          repurposed: brief.repurposed || ''
        },
        contentType: campaign.contentType,
        startDate: formattedStartDate,
        endDate: formattedEndDate,
        platforms: {
          tiktok: normalizedPlatforms.includes('tiktok'),
          instagram: normalizedPlatforms.includes('instagram'),
          youtube: normalizedPlatforms.includes('youtube'),
          twitter: normalizedPlatforms.includes('x') || normalizedPlatforms.includes('twitter')
        },
        minViewsForPayout: requirements.minViewsForPayout,
        guidelines: {
          original: requirements.contentGuidelines.length ? requirements.contentGuidelines : [''],
          repurposed: requirements.contentGuidelines.length ? requirements.contentGuidelines : ['']
        },
        hashtags: {
          original: requirements.hashtags?.original || '#BrandAd',
          repurposed: requirements.hashtags?.repurposed || '#BrandPartner'
        },
        budget: campaign.budget.toString(),
        payoutRate: {
          original: requirements.payoutRate.original.split(' ')[0].replace('$', '') || '500',
          repurposed: requirements.payoutRate.repurposed?.split(' ')[0].replace('$', '') || '250'
        },
        budgetAllocation: {
          original: requirements.budget_allocation?.original || 50,
          repurposed: requirements.budget_allocation?.repurposed || 50
        }
      });

      // If this is an existing campaign with a brand_id, set the selectedBrandId
      if (campaign.brand_id && isAdmin) {
        setSelectedBrandId(campaign.brand_id);
      } else if (campaign.brand && typeof campaign.brand === 'object' && campaign.brand.id && isAdmin) {
        setSelectedBrandId(campaign.brand.id);
      }
    }
  }, [campaign]);

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Basic validation
    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (parseInt(formData.budget) < 1000) {
      newErrors.budget = 'Minimum budget is $1,000';
    }

    const selectedPlatforms = Object.entries(formData.platforms)
      .filter(([_, enabled]) => enabled)
      .length;
    if (selectedPlatforms === 0) {
      newErrors.platforms = 'Select at least one platform';
    }

    // Date validation
    const startInput = formData.startDate;
    const endInput = formData.endDate;
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalize today to midnight
    
    let start: Date | null = null;
    let end: Date | null = null;

    try {
      // Add time zone offset to interpret the date as local midnight
      start = startInput ? new Date(startInput + 'T00:00:00') : null;
    } catch (e) { /* Ignore parse error for validation */ }
    
    try {
      end = endInput ? new Date(endInput + 'T00:00:00') : null;
    } catch (e) { /* Ignore parse error for validation */ }
    
    if (start && start < today) {
      newErrors.startDate = 'Start date cannot be in the past';
    }
    if (end && start && end <= start) {
      newErrors.endDate = 'End date must be after start date';
    }
    
    // For admin users, validate brand selection or creation
    if (isAdmin) {
      if (brandInputMode === 'select' && !selectedBrandId) {
        newErrors.selectedBrandId = 'Please select a brand for this campaign';
      }
      if (brandInputMode === 'create' && !newBrandName.trim()) {
        newErrors.newBrandName = 'Please enter a brand name';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    console.log('Submit button clicked');
    
    // Check if validation passes using the direct return value
    const isValid = validateForm();
    if (!isValid) {
      // Log the errors state *after* setErrors has likely updated
      // Use a slight delay or rely on the fact that validateForm already called setErrors
      console.error('Form validation failed. Errors object:', errors); 
      return;
    }

    // Set loading state
    setIsSaving(true);

    // Calculate view targets
    const viewTargets = calculateViewTargets(
      formData.budget,
      formData.payoutRate.original, // Use payoutRate as cost per million views
      formData.payoutRate.repurposed,
      formData.contentType,
      formData.budgetAllocation
    );
    console.log('Calculated View Targets:', viewTargets);

    // Building campaign data object
    try {
      const brandInfo = brandInputMode === 'select' 
        ? {
            brand: {
              id: selectedBrandId,
              name: brands.find(b => b.id === selectedBrandId)?.name || 'Unknown Brand'
            },
            brand_id: selectedBrandId
          } 
        : {
            brand: {
              name: newBrandName,
              isNew: true
            },
            new_brand_name: newBrandName,
            new_brand_contact_email: newBrandContactEmail
          };

      const campaignData: Partial<Campaign> = {
        // If we're editing an existing campaign, preserve its ID
        ...(campaign?.id ? { id: campaign.id } : {}),
        title: formData.title,
        brief: {
          original: formData.brief.original,
          repurposed: formData.brief.repurposed
        },
        contentType: formData.contentType as 'original' | 'repurposed' | 'both',
        startDate: formData.startDate,
        endDate: formData.endDate,
        platforms: Object.entries(formData.platforms)
          .filter(([_, enabled]) => enabled)
          .map(([platform, _]) => platform === 'twitter' ? 'X' : platform.charAt(0).toUpperCase() + platform.slice(1)),
        budget: parseInt(formData.budget),
        // Set brand information based on mode (select or create)
        ...(isAdmin ? brandInfo : campaign?.brand ? { brand: campaign.brand } : {}),
        // Add createdAt timestamp if available, otherwise use current date
        ...(campaign?.createdAt ? { createdAt: campaign.createdAt } : { createdAt: new Date().toISOString() }),
        // Always set updatedAt to the current timestamp
        updatedAt: new Date().toISOString(),
        requirements: {
          contentGuidelines: [
              ...(formData.contentType === 'original' || formData.contentType === 'both' ? formData.guidelines.original : []),
              ...(formData.contentType === 'repurposed' || formData.contentType === 'both' ? formData.guidelines.repurposed : [])
            ].filter(g => g.trim() !== ''),
          minViewsForPayout: formData.minViewsForPayout,
          payoutRate: {
            original: formData.payoutRate.original,
            repurposed: formData.payoutRate.repurposed
          },
          hashtags: {
            original: formData.hashtags.original,
            repurposed: formData.hashtags.repurposed
          },
          budget_allocation: {
            original: formData.budgetAllocation.original,
            repurposed: formData.budgetAllocation.repurposed
          },
          // REMOVED: view_estimates no longer stored here
        },
        // Add new view target fields
        total_view_target: viewTargets.total,
        original_view_target: viewTargets.original,
        repurposed_view_target: viewTargets.repurposed,
        
        // Set status explicitly based on context if needed (handled by onSave prop)
        // ...(campaign?.status ? { status: campaign.status } : {})
      };

      console.log('Calling onSave with campaign data:', campaignData);

      // Call the onSave prop with the constructed campaign data
      await onSave(campaignData);

      // Optional: Close the modal on success
      // onClose();
    } catch (error) {
      console.error('Error saving campaign:', error);
      // Handle error (e.g., show error message to user)
      alert(`Error saving campaign: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      // Reset loading state
      setIsSaving(false);
    }
  };

  const handleAddGuideline = (type: 'original' | 'repurposed') => {
    setFormData({
      ...formData,
      guidelines: {
        ...formData.guidelines,
        [type]: [...formData.guidelines[type], '']
      }
    });
  };

  const handleRemoveGuideline = (type: 'original' | 'repurposed', index: number) => {
    if (formData.guidelines[type].length <= 1) return; // Keep at least one guideline field
    
    setFormData({
      ...formData,
      guidelines: {
        ...formData.guidelines,
        [type]: formData.guidelines[type].filter((_, i) => i !== index)
      }
    });
  };

  const handleGuidelineChange = (type: 'original' | 'repurposed', index: number, value: string) => {
    const updatedGuidelines = [...formData.guidelines[type]];
    updatedGuidelines[index] = value;
    
    setFormData({
      ...formData,
      guidelines: {
        ...formData.guidelines,
        [type]: updatedGuidelines
      }
    });
  };

  const handleBudgetAllocationChange = (value: number) => {
    setFormData({
      ...formData,
      budgetAllocation: {
        original: value,
        repurposed: 100 - value
      }
    });
  };

  // Handle form field changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;

    if (name.includes('.')) {
      // Handle nested properties like "brief.original"
      const [parent, child] = name.split('.');
      setFormData({
        ...formData,
        [parent]: {
          ...formData[parent as keyof typeof formData],
          [child]: value
        }
      });
    } else if (name === 'contentType') {
      // Handle change in content type, which affects other fields
      setFormData({
        ...formData,
        contentType: value as 'original' | 'repurposed' | 'both',
        // Reset budget allocation depending on content type
        budgetAllocation: value === 'original' 
          ? { original: 100, repurposed: 0 }
          : value === 'repurposed'
            ? { original: 0, repurposed: 100 }
            : { original: 50, repurposed: 50 }
      });
    } else {
      // Handle regular fields
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  // Handle checkbox changes
  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    
    if (name.includes('.')) {
      // Handle nested properties like "platforms.tiktok"
      const [parent, child] = name.split('.');
      setFormData({
        ...formData,
        [parent]: {
          ...formData[parent as keyof typeof formData],
          [child]: checked
        }
      });
    } else {
      setFormData({
        ...formData,
        [name]: checked
      });
    }
  };

  // Handle brand selection change
  const handleBrandChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedBrandId(e.target.value);
    
    // Clear error if brand is selected
    if (e.target.value) {
      setErrors(prev => ({ ...prev, selectedBrandId: undefined }));
    }
  };

  // Add function to handle new brand name input
  const handleNewBrandNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewBrandName(e.target.value);
    
    // Clear error if brand name is provided
    if (e.target.value.trim()) {
      setErrors(prev => ({ ...prev, newBrandName: undefined }));
    }
  };
  
  // Add handler for new brand contact email
  const handleNewBrandContactEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewBrandContactEmail(e.target.value);
    
    // Clear error if email is provided and looks valid
    if (e.target.value.trim() && /\\S+@\\S+\\.\\S+/.test(e.target.value)) {
      setErrors(prev => ({ ...prev, newBrandContactEmail: undefined }));
    }
  };

  // Add function to toggle between select and create modes
  const toggleBrandInputMode = (mode: 'select' | 'create') => {
    setBrandInputMode(mode);
    
    // Clear any existing errors
    setErrors(prev => ({
      ...prev,
      selectedBrandId: undefined,
      newBrandName: undefined,
      newBrandContactEmail: undefined
    }));
  };

  return (
    <motion.div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div 
        className="w-full max-w-5xl max-h-[90vh] overflow-y-auto bg-black/40 border border-gray-800 rounded-lg shadow-xl"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 20, opacity: 0 }}
      >
        <div className="sticky top-0 z-10 flex justify-between items-center p-4 border-b border-gray-800 bg-black/80">
          <h2 className="text-xl font-semibold">
            {campaign ? 'Edit Campaign' : 'Create Campaign'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-full"
            aria-label="Close"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        
        {/* Campaign Info Section - Streamlined to a single row */}
        <div className="px-6 py-3 border-b border-gray-800/50 bg-black/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {campaign?.id && (
                <div className="pr-4 border-r border-gray-800/50">
                  <div className="text-xs text-gray-500">ID</div>
                  <div className="text-sm font-mono">{campaign.id}</div>
                </div>
              )}
              
              <div className="pr-4 border-r border-gray-800/50">
                <div className="text-xs text-gray-500">Budget</div>
                <div className="text-sm">{formatMoney(parseInt(formData.budget) || 0)}</div>
              </div>
              
              {campaign?.brand && (
                <div>
                  <div className="text-xs text-gray-500">Brand</div>
                  <div className="text-sm">{typeof campaign.brand === 'object' ? campaign.brand.name : campaign.brand}</div>
                </div>
              )}
            </div>
            
            {/* Views metrics without label */}
            <div className="flex items-center gap-6">
              <div className="flex items-center text-right">
                <Eye className="h-4 w-4 mr-1 text-gray-500" />
                <div className="text-sm">{formatNumber(calculateTargetViews().total)}</div>
              </div>
              
              {(formData.contentType === 'original' || formData.contentType === 'both') && (
                <div className="text-right border-l border-gray-800/50 pl-6 flex items-center gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-400/70"></div>
                  <div className="text-sm">{formatNumber(calculateTargetViews().original)}</div>
                </div>
              )}
              
              {(formData.contentType === 'repurposed' || formData.contentType === 'both') && (
                <div className="text-right border-l border-gray-800/50 pl-6 flex items-center gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-purple-400/70"></div>
                  <div className="text-sm">{formatNumber(calculateTargetViews().repurposed)}</div>
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="p-6 space-y-6">
          {/* Basic Campaign Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Basic Information</h3>
            
            {/* Admin Brand Selector */}
            {isAdmin && (
              <div>
                <label className="block text-sm text-gray-400 mb-1">
                  Brand <span className="text-red-500">*</span>
                </label>
                
                {/* Brand input mode toggle */}
                <div className="flex gap-4 mb-3">
                  <div 
                    className={`flex items-center gap-2 cursor-pointer ${brandInputMode === 'select' ? 'text-white' : 'text-gray-400'}`}
                    onClick={() => toggleBrandInputMode('select')}
                  >
                    <div className={`w-4 h-4 rounded-full border ${brandInputMode === 'select' ? 'border-red-500 bg-red-500' : 'border-gray-500'}`}>
                      {brandInputMode === 'select' && <div className="w-2 h-2 bg-black rounded-full m-auto mt-1"></div>}
                    </div>
                    <span>Select existing brand</span>
                  </div>
                  <div 
                    className={`flex items-center gap-2 cursor-pointer ${brandInputMode === 'create' ? 'text-white' : 'text-gray-400'}`}
                    onClick={() => toggleBrandInputMode('create')}
                  >
                    <div className={`w-4 h-4 rounded-full border ${brandInputMode === 'create' ? 'border-red-500 bg-red-500' : 'border-gray-500'}`}>
                      {brandInputMode === 'create' && <div className="w-2 h-2 bg-black rounded-full m-auto mt-1"></div>}
                    </div>
                    <span>Create new brand</span>
                  </div>
                </div>
                
                {/* Show brand selection dropdown or brand name input based on mode */}
                {brandInputMode === 'select' ? (
                  <>
                    <select
                      value={selectedBrandId}
                      onChange={handleBrandChange}
                      className={`w-full p-3 bg-black/40 border rounded-lg ${
                        errors.selectedBrandId ? 'border-red-500' : 'border-gray-700 focus:border-red-500'
                      } focus:outline-none`}
                      disabled={brandsLoading}
                    >
                      {brandsLoading ? (
                        <option>Loading brands...</option>
                      ) : brands.length === 0 ? (
                        <option value="">No brands available</option>
                      ) : (
                        <>
                          <option value="">Select a brand</option>
                          {brands.map(brand => (
                            <option key={brand.id} value={brand.id}>
                              {brand.name}
                            </option>
                          ))}
                        </>
                      )}
                    </select>
                    {errors.selectedBrandId && (
                      <p className="mt-1 text-sm text-red-500">{errors.selectedBrandId}</p>
                    )}
                  </>
                ) : (
                  <>
                    <div className="space-y-3">
                      <input
                        type="text"
                        placeholder="Enter new brand name"
                        value={newBrandName}
                        onChange={handleNewBrandNameChange}
                        className={`w-full p-3 bg-black/40 border rounded-lg ${
                          errors.newBrandName ? 'border-red-500' : 'border-gray-700 focus:border-red-500'
                        } focus:outline-none`}
                      />
                      {errors.newBrandName && (
                        <p className="mt-1 text-sm text-red-500">{errors.newBrandName}</p>
                      )}
                      
                      {/* Add input for contact email */}
                      <input
                        type="email"
                        placeholder="Enter brand contact email"
                        value={newBrandContactEmail}
                        onChange={handleNewBrandContactEmailChange}
                        className={`w-full p-3 bg-black/40 border rounded-lg ${
                          errors.newBrandContactEmail ? 'border-red-500' : 'border-gray-700 focus:border-red-500'
                        } focus:outline-none`}
                      />
                      {errors.newBrandContactEmail && (
                        <p className="mt-1 text-sm text-red-500">{errors.newBrandContactEmail}</p>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}
            
            <div>
              <label className="block text-sm text-gray-400 mb-1">
                Campaign Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                className={`w-full p-3 bg-black/40 border rounded-lg ${
                  errors.title ? 'border-red-500' : 'border-gray-700 focus:border-red-500'
                } focus:outline-none`}
                placeholder="Enter campaign title"
              />
              {errors.title && <p className="mt-1 text-sm text-red-500">{errors.title}</p>}
            </div>
            
            <div>
              <label className="block text-sm text-gray-400 mb-1">
                Content Type <span className="text-red-500">*</span>
              </label>
              <select
                name="contentType"
                value={formData.contentType}
                onChange={handleChange}
                className="w-full p-3 bg-black/40 border border-gray-700 rounded-lg focus:border-red-500 focus:outline-none"
              >
                <option value="original">Original Content Only</option>
                <option value="repurposed">Repurposed Content Only</option>
                <option value="both">Both Original & Repurposed</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm text-gray-400 mb-1">
                Platforms <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(formData.platforms).map(([platform, enabled]) => (
                  <button
                    key={platform}
                    onClick={() => {
                      const event = {
                        target: {
                          name: `platforms.${platform}`,
                          checked: !enabled
                        }
                      } as unknown as React.ChangeEvent<HTMLInputElement>;
                      handleCheckboxChange(event);
                    }}
                    className={`p-4 border rounded-lg text-left ${
                      enabled ? 'border-red-500 bg-red-900/20' : 'border-gray-700 hover:bg-white/5'
                    }`}
                  >
                    {platform === 'twitter' ? 'X (Twitter)' : platform.charAt(0).toUpperCase() + platform.slice(1)}
                  </button>
                ))}
              </div>
              {errors.platforms && <p className="mt-1 text-sm text-red-500">{errors.platforms}</p>}
            </div>
          </div>
          
          {/* Campaign Schedule and Budget */}
          <div className="space-y-4 pt-4 border-t border-gray-800">
            <h3 className="text-lg font-medium">Schedule & Budget</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">
                  Start Date <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="date"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleChange}
                    className={`w-full p-3 pl-10 bg-black/40 border rounded-lg ${
                      errors.startDate ? 'border-red-500' : 'border-gray-700 focus:border-red-500'
                    } focus:outline-none`}
                  />
                  <Calendar className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                </div>
                {errors.startDate && <p className="mt-1 text-sm text-red-500">{errors.startDate}</p>}
              </div>
              
              <div>
                <label className="block text-sm text-gray-400 mb-1">
                  End Date <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="date"
                    name="endDate"
                    value={formData.endDate}
                    onChange={handleChange}
                    className={`w-full p-3 pl-10 bg-black/40 border rounded-lg ${
                      errors.endDate ? 'border-red-500' : 'border-gray-700 focus:border-red-500'
                    } focus:outline-none`}
                  />
                  <Calendar className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                </div>
                {errors.endDate && <p className="mt-1 text-sm text-red-500">{errors.endDate}</p>}
              </div>
            </div>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-300 mb-1">Budget</label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-4 w-4" />
                <input
                  type="number"
                  name="budget"
                  value={formData.budget}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-2 bg-black border border-gray-700 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-white"
                  placeholder="Minimum $1,000"
                  min="1000"
                />
              </div>
              {errors.budget && <p className="text-red-500 text-xs mt-1">{errors.budget}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Original Content Payout Rate ($ per 1M views)</label>
                <input
                  type="number"
                  name="payoutRate.original"
                  value={formData.payoutRate.original}
                  onChange={handleChange}
                  className={`w-full p-2 bg-gray-700 border border-gray-600 rounded-md ${formData.contentType === 'repurposed' ? 'opacity-50 cursor-not-allowed' : ''}`}
                  min="500"
                  disabled={formData.contentType === 'repurposed'}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Repurposed Content Payout Rate ($ per 1M views)</label>
                <input
                  type="number"
                  name="payoutRate.repurposed"
                  value={formData.payoutRate.repurposed}
                  onChange={handleChange}
                  className={`w-full p-2 bg-gray-700 border border-gray-600 rounded-md ${formData.contentType === 'original' ? 'opacity-50 cursor-not-allowed' : ''}`}
                  min="250"
                  disabled={formData.contentType === 'original'}
                />
              </div>
            </div>

            {/* Budget Allocation Slider - Only show if content type is 'both' */}
            {formData.contentType === 'both' && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-300 mb-2">Budget Allocation</label>
                <div className="flex items-center space-x-4">
                  <span className="text-xs">Original ({formData.budgetAllocation.original}%)</span>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="5" // Allow finer control
                    value={formData.budgetAllocation.original}
                    onChange={(e) => handleBudgetAllocationChange(parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-red-600"
                  />
                  <span className="text-xs">Repurposed ({formData.budgetAllocation.repurposed}%)</span>
                </div>
              </div>
            )}

            {/* Display Calculated View Targets */}
            <div className="mb-6 bg-gray-800 p-4 rounded-lg">
              <h4 className="text-md font-semibold mb-3 flex items-center">
                <Eye className="h-5 w-5 mr-2 text-indigo-400" />
                Calculated View Targets
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                <div className="bg-gray-700 p-3 rounded-md">
                  <p className="text-xs text-gray-400 mb-1">Total Target</p>
                  <p className="text-xl font-bold">{formatNumber(calculateTargetViews().total)}</p>
                </div>
                <div className={`bg-gray-700 p-3 rounded-md ${formData.contentType === 'repurposed' ? 'opacity-50' : ''}`}>
                  <p className="text-xs text-gray-400 mb-1">Original Target</p>
                  <p className="text-xl font-bold">{formatNumber(calculateTargetViews().original)}</p>
                </div>
                <div className={`bg-gray-700 p-3 rounded-md ${formData.contentType === 'original' ? 'opacity-50' : ''}`}>
                  <p className="text-xs text-gray-400 mb-1">Repurposed Target</p>
                  <p className="text-xl font-bold">{formatNumber(calculateTargetViews().repurposed)}</p>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                * Targets based on budget and payout rates per million views. Rounded.
              </p>
            </div>
          </div>
          
          {/* Campaign brief */}
          <div className="space-y-4 pt-4 border-t border-gray-800">
            <h3 className="text-lg font-medium">Campaign Brief</h3>
            
            {(formData.contentType === 'original' || formData.contentType === 'both') && (
              <div>
                <label className="block text-sm text-gray-400 mb-1">
                  Original Content Brief
                </label>
                <textarea
                  name="brief.original"
                  value={formData.brief.original}
                  onChange={handleChange}
                  className="w-full p-3 bg-black/40 border border-gray-700 rounded-lg focus:border-red-500 focus:outline-none min-h-[100px]"
                  placeholder="Describe what kind of original content you're looking for"
                ></textarea>
              </div>
            )}
            
            {(formData.contentType === 'repurposed' || formData.contentType === 'both') && (
              <div>
                <label className="block text-sm text-gray-400 mb-1">
                  Repurposed Content Brief
                </label>
                <textarea
                  name="brief.repurposed"
                  value={formData.brief.repurposed}
                  onChange={handleChange}
                  className="w-full p-3 bg-black/40 border border-gray-700 rounded-lg focus:border-red-500 focus:outline-none min-h-[100px]"
                  placeholder="Describe what kind of repurposed content you're looking for"
                ></textarea>
              </div>
            )}
          </div>
          
          {/* Payment details */}
          <div className="space-y-4 pt-4 border-t border-gray-800">
            <h3 className="text-lg font-medium">Payment Details</h3>
            
            <div>
              <label className="block text-sm text-gray-400 mb-1">
                Minimum Views for Payout
              </label>
              <select
                name="minViewsForPayout"
                value={formData.minViewsForPayout}
                onChange={handleChange}
                className="w-full p-3 bg-black/40 border border-gray-700 rounded-lg focus:border-red-500 focus:outline-none"
              >
                <option value="10K">10,000 views</option>
                <option value="50K">50,000 views</option>
                <option value="100K">100,000 views</option>
                <option value="500K">500,000 views</option>
                <option value="1M">1,000,000 views</option>
              </select>
            </div>
          </div>
          
          {/* Content guidelines */}
          <div className="space-y-4 pt-4 border-t border-gray-800">
            <h3 className="text-lg font-medium">Content Guidelines</h3>
            
            {(formData.contentType === 'original' || formData.contentType === 'both') && (
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-gray-300">
                    Original Content Guidelines
                  </label>
                  <button
                    type="button"
                    onClick={() => handleAddGuideline('original')}
                    className="text-sm text-red-400 hover:text-red-300 flex items-center gap-1"
                  >
                    <Plus className="h-4 w-4" /> Add Guideline
                  </button>
                </div>
                {formData.guidelines.original.map((guideline, index) => (
                  <div key={`original-${index}`} className="flex mb-2">
                    <input
                      type="text"
                      value={guideline}
                      onChange={(e) => handleGuidelineChange('original', index, e.target.value)}
                      className="flex-grow p-3 bg-black/40 border border-gray-700 rounded-lg focus:border-red-500 focus:outline-none"
                      placeholder="Add guideline for original content"
                    />
                    {formData.guidelines.original.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveGuideline('original', index)}
                        className="ml-2 p-3 border border-gray-700 rounded-lg hover:bg-red-900/20 hover:border-red-500"
                        aria-label="Remove guideline"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}
                
                <div>
                  <label className="block text-sm text-gray-400 mb-1">
                    Original Content Hashtag
                  </label>
                  <input
                    type="text"
                    name="hashtags.original"
                    value={formData.hashtags.original}
                    onChange={handleChange}
                    className="w-full p-3 bg-black/40 border border-gray-700 rounded-lg focus:border-red-500 focus:outline-none"
                    placeholder="#BrandAd"
                  />
                  <p className="text-xs text-gray-500 mt-1">Must include "#" and "ad"</p>
                </div>
              </div>
            )}
            
            {(formData.contentType === 'repurposed' || formData.contentType === 'both') && (
              <div className="mt-4">
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-gray-300">
                    Repurposed Content Guidelines
                  </label>
                  <button
                    type="button"
                    onClick={() => handleAddGuideline('repurposed')}
                    className="text-sm text-red-400 hover:text-red-300 flex items-center gap-1"
                  >
                    <Plus className="h-4 w-4" /> Add Guideline
                  </button>
                </div>
                {formData.guidelines.repurposed.map((guideline, index) => (
                  <div key={`repurposed-${index}`} className="flex mb-2">
                    <input
                      type="text"
                      value={guideline}
                      onChange={(e) => handleGuidelineChange('repurposed', index, e.target.value)}
                      className="flex-grow p-3 bg-black/40 border border-gray-700 rounded-lg focus:border-red-500 focus:outline-none"
                      placeholder="Add guideline for repurposed content"
                    />
                    {formData.guidelines.repurposed.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveGuideline('repurposed', index)}
                        className="ml-2 p-3 border border-gray-700 rounded-lg hover:bg-red-900/20 hover:border-red-500"
                        aria-label="Remove guideline"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}
                
                <div>
                  <label className="block text-sm text-gray-400 mb-1">
                    Repurposed Content Hashtag
                  </label>
                  <input
                    type="text"
                    name="hashtags.repurposed"
                    value={formData.hashtags.repurposed}
                    onChange={handleChange}
                    className="w-full p-3 bg-black/40 border border-gray-700 rounded-lg focus:border-red-500 focus:outline-none"
                    placeholder="#BrandPartner"
                  />
                  <p className="text-xs text-gray-500 mt-1">Must include "#" and "ad"</p>
                </div>
              </div>
            )}
          </div>
        </div>
        
        <div className="sticky bottom-0 flex justify-end gap-3 p-4 border-t border-gray-800 bg-black/80">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-gray-300 border border-gray-700 rounded-lg hover:bg-white/5"
            disabled={isSaving}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className={`px-4 py-2 bg-red-600 text-white rounded-lg ${isSaving ? 'opacity-70' : 'hover:bg-red-700'} flex items-center`}
            disabled={isSaving}
          >
            {isSaving ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Saving...
              </>
            ) : (
              <>
                <Save className="h-5 w-5 mr-2" />
                Save Campaign
              </>
            )}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default CampaignEditor;