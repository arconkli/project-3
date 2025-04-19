import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Save, AlertTriangle, ArrowLeft, Eye, Calendar, DollarSign, Plus, Trash2, Info } from 'lucide-react';
import { formatMoney } from '@/utils/format';
import { useCampaigns } from '@/hooks/useCampaigns';
import { supabase } from '@/lib/supabaseClient';
import { campaignService } from '@/services/campaign';
import type { Campaign } from '@/types/brand';

const CampaignEditPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    brief: '',
    contentType: 'original' as 'original' | 'repurposed' | 'both',
    startDate: '',
    endDate: '',
    platforms: {
      tiktok: false,
      instagram: false,
      youtube: false,
      twitter: false
    },
    guidelines: {
      original: [''],
      repurposed: ['']
    },
    hashtags: {
      original: '',
      repurposed: ''
    },
    budget: '',
    payoutRate: {
      original: '500',
      repurposed: '250'
    },
    changeReason: '',
    payoutRateDisplay: {
      original: `$${formData.payoutRate.original}`,
      repurposed: `$${formData.payoutRate.repurposed}`
    },
  });
  const [showConfirm, setShowConfirm] = useState(false);

  // Use the campaign hook
  const { 
    getCampaignWithCreators,
    refreshCampaigns,
    loading: campaignLoading,
    error: campaignError
  } = useCampaigns();

  // Helper function to format date for input fields
  const formatDateForInput = (dateString?: string) => {
    if (!dateString) return '';
    
    try {
      // Create a date object from the string
      const date = new Date(dateString);
      
      // Format as YYYY-MM-DD for input[type="date"]
      return date.toISOString().split('T')[0];
    } catch (err) {
      console.error('Error formatting date:', err);
      return '';
    }
  };

  useEffect(() => {
    // Fetch campaign data from the database
    const fetchCampaign = async () => {
      setLoading(true);
      setError(null);
      try {
        if (!id) {
          setError('Campaign ID is missing');
          return;
        }
        
        // Get campaign with creators from the database
        const fetchedCampaign = await getCampaignWithCreators(id);
        
        if (!fetchedCampaign) {
          setError('Campaign not found. It may have been deleted or you do not have permission to edit it.');
          return;
        }

        setCampaign(fetchedCampaign);
        
        // Get platforms from requirements or fallback to an empty array
        const platforms = fetchedCampaign.requirements?.platforms || [];
        console.log('Platforms from API:', platforms);
        
        // Ensure platforms are case-insensitive by converting everything to lowercase for comparison
        const normalizedPlatforms = platforms.map(p => p.toLowerCase());
        
        // Format dates properly for the date input
        const formattedStartDate = formatDateForInput(fetchedCampaign.start_date);
        const formattedEndDate = formatDateForInput(fetchedCampaign.end_date);
        
        // Set form data based on fetched campaign
        setFormData({
          title: fetchedCampaign.title || '',
          brief: fetchedCampaign.brief?.original || '',
          contentType: fetchedCampaign.content_type || 'original',
          startDate: formattedStartDate,
          endDate: formattedEndDate,
          platforms: {
            tiktok: normalizedPlatforms.includes('tiktok'),
            instagram: normalizedPlatforms.includes('instagram'),
            youtube: normalizedPlatforms.includes('youtube'),
            twitter: normalizedPlatforms.includes('x')
          },
          guidelines: {
            original: fetchedCampaign.requirements?.contentGuidelines || [''],
            repurposed: fetchedCampaign.requirements?.contentGuidelines || ['']
          },
          hashtags: {
            original: fetchedCampaign.requirements?.hashtags?.original || '#YourBrandAd',
            repurposed: fetchedCampaign.requirements?.hashtags?.repurposed || '#YourBrandAd'
          },
          budget: String(fetchedCampaign.budget) || '',
          payoutRate: {
            original: fetchedCampaign.requirements?.payoutRate?.original?.split(' ')[0]?.replace('$', '') || '500',
            repurposed: fetchedCampaign.requirements?.payoutRate?.repurposed?.split(' ')[0]?.replace('$', '') || '250'
          },
          changeReason: '',
          payoutRateDisplay: {
            original: `$${formData.payoutRate.original}`,
            repurposed: `$${formData.payoutRate.repurposed}`
          },
        });
        
        console.log('Platform settings:', {
          tiktok: normalizedPlatforms.includes('tiktok'),
          instagram: normalizedPlatforms.includes('instagram'),
          youtube: normalizedPlatforms.includes('youtube'),
          twitter: normalizedPlatforms.includes('x')
        });
        
      } catch (err) {
        console.error('Error fetching campaign:', err);
        setError('An error occurred while loading the campaign. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchCampaign();
  }, [id, getCampaignWithCreators]);

  const handleAddGuideline = (type: 'original' | 'repurposed') => {
    setFormData(prev => ({
      ...prev,
      guidelines: {
        ...prev.guidelines,
        [type]: [...prev.guidelines[type], '']
      }
    }));
  };

  const handleRemoveGuideline = (type: 'original' | 'repurposed', index: number) => {
    setFormData(prev => ({
      ...prev,
      guidelines: {
        ...prev.guidelines,
        [type]: prev.guidelines[type].filter((_, i) => i !== index)
      }
    }));
  };

  const handleGuidelineChange = (type: 'original' | 'repurposed', index: number, value: string) => {
    setFormData(prev => {
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
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowConfirm(true);
  };

  const handleConfirmSubmit = async () => {
    if (!id || !campaign) return;
    
    try {
      setSubmitting(true);
      
      // Convert platform selections to array format
      const selectedPlatforms = Object.entries(formData.platforms)
        .filter(([_, enabled]) => enabled)
        .map(([platform]) => {
          // Convert platform name to proper format
          if (platform === 'twitter') return 'X';
          return platform.charAt(0).toUpperCase() + platform.slice(1);
        });
      
      // Create update data object
      const updateData = {
        title: formData.title,
        brief: {
          original: formData.brief,
          repurposed: formData.brief
        },
        content_type: formData.contentType,
        start_date: formData.startDate,
        end_date: formData.endDate,
        budget: parseInt(formData.budget),
        status: 'pending_approval', // Set to pending approval since it was edited
        platforms: selectedPlatforms,
        requirements: {
          contentGuidelines: formData.guidelines.original.filter(g => g.trim()),
          platforms: selectedPlatforms,
          minViewsForPayout: campaign.requirements?.minViewsForPayout || '100K', // Preserve original value
          totalBudget: `$${formData.budget}`,
          payoutRate: {
            original: `$${formData.payoutRate.original}`,
            repurposed: `$${formData.payoutRate.repurposed}`
          },
          hashtags: {
            original: formData.hashtags.original,
            repurposed: formData.hashtags.repurposed
          }
        },
        edit_notes: formData.changeReason
      };
      
      // Call the campaign service to update the campaign
      const updatedCampaign = await campaignService.updateCampaign(id, updateData);
      
      // Store edit history in a separate table to track changes
      await supabase.from('campaign_edit_history').insert({
        campaign_id: id,
        brand_id: campaign.brand_id,
        changes: JSON.stringify(updateData),
        reason: formData.changeReason,
        status: 'pending'
      });
      
      // Refresh campaigns to update the state
      await refreshCampaigns();
      
      // Show success message
      alert('Campaign changes submitted for approval!');
      
      // Navigate back to dashboard
      navigate('/brand/dashboard');
    } catch (err) {
      console.error('Error updating campaign:', err);
      alert('Failed to update campaign. Please try again.');
    } finally {
      setSubmitting(false);
      setShowConfirm(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black">
        <header className="border-b border-gray-800 bg-black bg-opacity-80 backdrop-blur-sm sticky top-0 z-40">
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => navigate('/brand/dashboard')}
                  className="p-2 hover:bg-white/10 rounded-lg"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
                <h1 className="text-xl font-bold">Edit Campaign</h1>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-5xl mx-auto px-4 py-8">
          <div className="p-6 bg-black/40 border border-gray-800 rounded-lg flex flex-col items-center justify-center min-h-[400px]">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-red-500 border-t-transparent mb-4"></div>
            <p className="text-gray-400">Loading campaign details...</p>
          </div>
        </main>
      </div>
    );
  }

  if (error || !campaign) {
    return (
      <div className="min-h-screen bg-black">
        <header className="border-b border-gray-800 bg-black bg-opacity-80 backdrop-blur-sm sticky top-0 z-40">
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => navigate('/brand/dashboard')}
                  className="p-2 hover:bg-white/10 rounded-lg"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
                <h1 className="text-xl font-bold">Edit Campaign</h1>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-5xl mx-auto px-4 py-8">
          <div className="p-6 bg-black/40 border border-gray-800 rounded-lg flex flex-col items-center justify-center min-h-[400px]">
            <AlertTriangle className="h-12 w-12 text-red-500 mb-4" />
            <p className="text-red-400 text-lg font-medium mb-2">Error Loading Campaign</p>
            <p className="text-gray-400 mb-6 text-center">{error || "Campaign not found or you don't have permission to edit it."}</p>
            <button
              onClick={() => navigate('/brand/dashboard')}
              className="px-6 py-2 bg-red-600 hover:bg-red-700 rounded-lg"
            >
              Back to Dashboard
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="border-b border-gray-800 bg-black bg-opacity-80 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/brand/dashboard')}
                className="p-2 hover:bg-white/10 rounded-lg"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <h1 className="text-xl font-bold">Edit Campaign</h1>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/brand/dashboard')}
                className="px-4 py-2 border border-gray-700 rounded-lg hover:bg-white/5 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg flex items-center gap-2 transition-colors"
              >
                <Save className="h-4 w-4" />
                Submit for Review
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="space-y-8">
          {/* Review Notice Banner */}
          <div className="p-5 bg-blue-900/20 border border-blue-700 rounded-lg">
            <div className="flex items-start gap-3">
              <Info className="h-6 w-6 text-blue-400 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-medium text-blue-400 mb-1">Campaign Changes Require Review</h3>
                <p className="text-sm text-gray-300">
                  All modifications to campaigns are subject to review by our team before being applied. 
                  This ensures brand safety and compliance with our platform guidelines. 
                  You'll be notified once your changes are approved or if additional information is needed.
                </p>
              </div>
            </div>
          </div>

          {/* Current Status */}
          <div className="p-6 bg-black/40 border border-gray-800 rounded-lg">
            <h2 className="text-lg font-bold mb-4">Current Campaign Status</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <p className="text-sm text-gray-400">Status</p>
                <span className={`px-3 py-1 rounded-full text-sm inline-flex ${
                  campaign.status === 'active' ? 'bg-green-900/20 text-green-400' :
                  campaign.status === 'draft' ? 'bg-gray-900/20 text-gray-400' :
                  'bg-gray-900/20 text-gray-400'
                }`}>
                  {campaign.status.toUpperCase()}
                </span>
              </div>
              <div>
                <p className="text-sm text-gray-400">Views</p>
                <p className="font-medium">{campaign.views}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Creators</p>
                <p className="font-medium">{campaign.creatorCount || 0}</p>
              </div>
            </div>
          </div>

          {/* Edit Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="p-6 bg-black/40 border border-gray-800 rounded-lg">
              <h3 className="text-lg font-bold mb-4">Campaign Details</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">
                    Campaign Title
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full p-3 bg-black/40 border border-gray-700 rounded-lg focus:border-red-500 focus:outline-none text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-1">
                    Campaign Brief
                  </label>
                  <textarea
                    value={formData.brief}
                    onChange={(e) => setFormData({ ...formData, brief: e.target.value })}
                    className="w-full p-3 bg-black/40 border border-gray-700 rounded-lg focus:border-red-500 focus:outline-none text-white"
                    rows={4}
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-1">
                    Content Type
                  </label>
                  <select
                    value={formData.contentType}
                    onChange={(e) => setFormData({ ...formData, contentType: e.target.value as 'original' | 'repurposed' | 'both' })}
                    className="w-full p-3 bg-black/40 border border-gray-700 rounded-lg focus:border-red-500 focus:outline-none text-white"
                  >
                    <option value="original">Original Content Only</option>
                    <option value="repurposed">Repurposed Content Only</option>
                    <option value="both">Both Original & Repurposed</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-1">
                    Platforms
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {Object.entries(formData.platforms).map(([platform, enabled]) => (
                      <button
                        key={platform}
                        type="button"
                        onClick={() => setFormData(prev => ({
                          ...prev,
                          platforms: {
                            ...prev.platforms,
                            [platform]: !enabled
                          }
                        }))}
                        className={`p-4 border rounded-lg text-left transition-colors ${
                          enabled ? 'border-red-500 bg-red-900/20' : 'border-gray-700 hover:border-gray-500'
                        }`}
                      >
                        {platform === 'twitter' ? 'X (Twitter)' : platform.charAt(0).toUpperCase() + platform.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Payout Rates */}
                <div className="space-y-4">
                  <h4 className="font-medium">Payout Rates</h4>
                  
                  {(formData.contentType === 'original' || formData.contentType === 'both') && (
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">
                        Original Content Rate (per 1M views)
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                          <span className="text-gray-400">per 1M views</span>
                        </div>
                        <input
                          type="number"
                          value={formData.payoutRate.original}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            payoutRate: {
                              ...prev.payoutRate,
                              original: e.target.value
                            }
                          }))}
                          className="w-full pl-3 pr-24 p-3 bg-black/40 border border-gray-700 rounded-lg focus:border-red-500 focus:outline-none text-white"
                          min="500"
                          step="50"
                        />
                      </div>
                      <div className="flex items-center justify-between mt-1">
                        <p className="text-xs text-gray-500">Minimum rate: $500</p>
                        <p className="text-xs text-gray-400">per 1M views</p>
                      </div>
                    </div>
                  )}
                  
                  {(formData.contentType === 'repurposed' || formData.contentType === 'both') && (
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">
                        Repurposed Content Rate (per 1M views)
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                          <span className="text-gray-400">per 1M views</span>
                        </div>
                        <input
                          type="number"
                          value={formData.payoutRate.repurposed}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            payoutRate: {
                              ...prev.payoutRate,
                              repurposed: e.target.value
                            }
                          }))}
                          className="w-full pl-3 pr-24 p-3 bg-black/40 border border-gray-700 rounded-lg focus:border-red-500 focus:outline-none text-white"
                          min="250"
                          step="50"
                        />
                      </div>
                      <div className="flex items-center justify-between mt-1">
                        <p className="text-xs text-gray-500">Minimum rate: $250</p>
                        <p className="text-xs text-gray-400">per 1M views</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">
                      Campaign Budget
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        <span className="text-gray-400">USD</span>
                      </div>
                      <input
                        type="number"
                        value={formData.budget}
                        onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                        className="w-full pl-3 pr-16 p-3 bg-black/40 border border-gray-700 rounded-lg focus:border-red-500 focus:outline-none text-white"
                        min="1000"
                        step="100"
                      />
                      <div className="flex items-center justify-between mt-1">
                        <p className="text-xs text-gray-500">Minimum budget: $1,000</p>
                        <p className="text-xs text-gray-400">total</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm text-gray-400 mb-1">
                      Start Date
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Calendar className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="date"
                        value={formData.startDate}
                        onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                        className="w-full pl-10 p-3 bg-black/40 border border-gray-700 rounded-lg focus:border-red-500 focus:outline-none text-white"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">
                      Campaign Hashtags
                    </label>
                    <div className="space-y-3">
                      {(formData.contentType === 'original' || formData.contentType === 'both') && (
                        <input
                          type="text"
                          value={formData.hashtags.original}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            hashtags: {
                              ...prev.hashtags,
                              original: e.target.value
                            }
                          }))}
                          className="w-full p-3 bg-black/40 border border-gray-700 rounded-lg focus:border-red-500 focus:outline-none text-white"
                          placeholder="#OriginalContentAd"
                        />
                      )}
                      {(formData.contentType === 'repurposed' || formData.contentType === 'both') && (
                        <input
                          type="text"
                          value={formData.hashtags.repurposed}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            hashtags: {
                              ...prev.hashtags,
                              repurposed: e.target.value
                            }
                          }))}
                          className="w-full p-3 bg-black/40 border border-gray-700 rounded-lg focus:border-red-500 focus:outline-none text-white"
                          placeholder="#RepurposedContentAd"
                        />
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm text-gray-400 mb-1">
                      End Date
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Calendar className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="date"
                        value={formData.endDate}
                        onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                        className="w-full pl-10 p-3 bg-black/40 border border-gray-700 rounded-lg focus:border-red-500 focus:outline-none text-white"
                      />
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mt-4 p-4 bg-black/20 border border-gray-700 rounded-lg">
                <div className="flex items-start gap-3">
                  <Info className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-gray-300">
                    Changes to rates and budget will only affect new creator submissions. Existing approved content will maintain their original rates.
                  </p>
                </div>
              </div>
            </div>
            
            {/* Content Guidelines */}
            <div className="p-6 bg-black/40 border border-gray-800 rounded-lg mt-6">
              <h3 className="text-lg font-bold mb-4">Content Guidelines</h3>
              
              {(formData.contentType === 'original' || formData.contentType === 'both') && (
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-sm text-gray-400">Original Content Guidelines</label>
                    <button
                      type="button"
                      onClick={() => handleAddGuideline('original')}
                      className="text-sm text-red-400 hover:text-red-300 flex items-center gap-1"
                    >
                      <Plus className="h-4 w-4" /> Add Guideline
                    </button>
                  </div>
                  
                  <div className="space-y-3">
                    {formData.guidelines.original.map((guideline, index) => (
                      <div key={index} className="flex gap-2">
                        <input
                          type="text"
                          value={guideline}
                          onChange={(e) => handleGuidelineChange('original', index, e.target.value)}
                          className="flex-1 p-3 bg-black/40 border border-gray-700 rounded-lg focus:border-red-500 focus:outline-none text-white"
                          placeholder="Add content guideline..."
                        />
                        {index > 0 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveGuideline('original', index)}
                            className="p-3 border border-gray-700 rounded-lg hover:bg-red-900/20 hover:border-red-500"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {(formData.contentType === 'repurposed' || formData.contentType === 'both') && (
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-sm text-gray-400">Repurposed Content Guidelines</label>
                    <button
                      type="button"
                      onClick={() => handleAddGuideline('repurposed')}
                      className="text-sm text-red-400 hover:text-red-300 flex items-center gap-1"
                    >
                      <Plus className="h-4 w-4" /> Add Guideline
                    </button>
                  </div>
                  
                  <div className="space-y-3">
                    {formData.guidelines.repurposed.map((guideline, index) => (
                      <div key={index} className="flex gap-2">
                        <input
                          type="text"
                          value={guideline}
                          onChange={(e) => handleGuidelineChange('repurposed', index, e.target.value)}
                          className="flex-1 p-3 bg-black/40 border border-gray-700 rounded-lg focus:border-red-500 focus:outline-none text-white"
                          placeholder="Add content guideline..."
                        />
                        {index > 0 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveGuideline('repurposed', index)}
                            className="p-3 border border-gray-700 rounded-lg hover:bg-red-900/20 hover:border-red-500"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Change Reason */}
            <div className="p-6 bg-black/40 border border-gray-800 rounded-lg">
              <h3 className="text-lg font-bold mb-4">Reason for Changes</h3>
              <div className="flex items-start gap-3 mb-4">
                <Info className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-gray-300">
                  Please provide a detailed explanation for the proposed changes. This information is critical for our review team
                  and will help us approve your modifications faster. Be specific about why these changes are necessary for your campaign.
                </p>
              </div>
              <textarea
                value={formData.changeReason}
                onChange={(e) => setFormData({ ...formData, changeReason: e.target.value })}
                className="w-full p-3 bg-black/40 border border-gray-700 rounded-lg focus:border-red-500 focus:outline-none text-white"
                rows={4}
                placeholder="Explain why these changes are necessary..."
                required
              />
            </div>
          </form>
        </div>
      </main>

      {/* Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-80 backdrop-blur-sm z-50 p-4">
          <div className="bg-black/40 border border-gray-800 rounded-lg p-6 w-full max-w-lg">
            <h3 className="text-xl font-bold mb-4">Submit Changes for Review</h3>
            
            <div className="p-4 bg-yellow-900/20 border border-yellow-800 rounded-lg mb-6">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm">
                  Your changes will be reviewed by our team before being applied to the campaign. 
                  We'll notify you once the changes are approved or if we need additional information.
                </p>
              </div>
            </div>

            <div className="space-y-4 mb-6">
              <div className="p-4 bg-black/20 border border-gray-700 rounded-lg">
                <h4 className="text-sm font-medium text-gray-300 mb-2">Review Process:</h4>
                <ul className="text-sm text-gray-400 space-y-2 list-disc pl-5">
                  <li>Our team will review your changes within 24-48 hours</li>
                  <li>Your current campaign will remain active during the review process</li>
                  <li>You'll receive an email notification when your changes are approved</li>
                  <li>If we need more information, we'll contact you directly</li>
                </ul>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="px-4 py-2 border border-gray-700 rounded-lg hover:bg-white/5 transition-colors"
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmSubmit}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg flex items-center gap-2 transition-colors"
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    Processing...
                  </>
                ) : (
                  <>Submit for Review</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CampaignEditPage;