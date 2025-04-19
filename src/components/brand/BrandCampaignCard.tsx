import React, { useState, useEffect } from 'react';
import { Calendar, Eye, ArrowUpRight, FileText, Check, Edit, X, AlertTriangle, Mail, MessageSquare, PenTool } from 'lucide-react';
import { Campaign } from '@/types/brand';
import { formatMoney, formatNumber } from '@/utils/format';

interface BrandCampaignCardProps {
  campaign: Campaign;
  onView: () => void;
  onEdit: () => void;
  onContinueDraft?: () => void;
  isSelected?: boolean;
  onSelect?: (e: React.MouseEvent) => void;
  viewMode?: 'grid' | 'list';
  onSubmitForApproval?: (campaignId: string) => Promise<void>;
}

const BrandCampaignCard: React.FC<BrandCampaignCardProps> = ({
  campaign,
  onView,
  onEdit,
  onContinueDraft,
  isSelected,
  onSelect,
  viewMode = 'grid',
  onSubmitForApproval
}) => {
  // Add state for rejection feedback modal
  const [showRejectionFeedback, setShowRejectionFeedback] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showEmailInfo, setShowEmailInfo] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  
  // State to store parsed rejection reasons and recommendations
  const [rejectionReasons, setRejectionReasons] = useState<string[]>([]);
  const [rejectionRecommendations, setRejectionRecommendations] = useState<string[]>([]);
  
  // Parse rejection information when campaign data changes
  useEffect(() => {
    if (campaign.status === 'rejected') {
      console.log("Campaign data for rejected campaign:", campaign);
      console.log("Campaign metrics:", campaign.metrics);
      console.log("Checking rejectionReason field:", campaign.rejectionReason);
      
      // Process rejection reason
      let reasons: string[] = [];
      if (campaign.metrics?.rejection_reason) {
        console.log("Found rejection_reason:", campaign.metrics.rejection_reason);
        
        // Try to parse JSON if the rejection reason is stored as a JSON string
        try {
          // Check if it's a JSON string containing a reasons field
          const parsedData = JSON.parse(campaign.metrics.rejection_reason);
          if (parsedData && parsedData.reasons) {
            console.log("Parsed JSON reasons:", parsedData.reasons);
            reasons = Array.isArray(parsedData.reasons) 
              ? parsedData.reasons
              : [parsedData.reasons];
          } else {
            // If it's JSON but doesn't have a reasons field, use the whole content
            reasons = [campaign.metrics.rejection_reason];
          }
        } catch (e) {
          // Not JSON, proceed with normal string processing
          // Split by line breaks or convert string to array with single item
          reasons = campaign.metrics.rejection_reason.includes('\n') 
            ? campaign.metrics.rejection_reason.split('\n').filter(r => r.trim()) 
            : [campaign.metrics.rejection_reason];
        }
      } else if (campaign.metrics?.rejection) {
        // Check for alternate field name
        console.log("Checking alternate rejection field:", campaign.metrics.rejection);
        reasons = typeof campaign.metrics.rejection === 'string' 
          ? [campaign.metrics.rejection] 
          : [];
      } else {
        console.log("No rejection_reason found in campaign metrics");
        // Fallback for campaigns without structured feedback
        if (campaign.rejectionReason) {
          console.log("Using legacy rejectionReason:", campaign.rejectionReason);
          
          // Try to parse JSON if the rejection reason is stored as a JSON string
          try {
            const parsedData = JSON.parse(campaign.rejectionReason);
            if (parsedData && parsedData.reasons) {
              reasons = Array.isArray(parsedData.reasons) 
                ? parsedData.reasons
                : [parsedData.reasons];
            } else {
              reasons = [campaign.rejectionReason];
            }
          } catch (e) {
            reasons = [campaign.rejectionReason];
          }
        }
      }
      setRejectionReasons(reasons);
      
      // Process recommendations
      let recommendations: string[] = [];
      if (campaign.metrics?.rejection_recommendations) {
        console.log("Found rejection_recommendations:", campaign.metrics.rejection_recommendations);
        // Split by line breaks or convert string to array with single item
        recommendations = campaign.metrics.rejection_recommendations.includes('\n') 
          ? campaign.metrics.rejection_recommendations.split('\n').filter(r => r.trim()) 
          : [campaign.metrics.rejection_recommendations];
      } else if (campaign.metrics?.rejection_reason) {
        // Check if recommendations are stored inside the rejection_reason as JSON
        try {
          const parsedData = JSON.parse(campaign.metrics.rejection_reason);
          if (parsedData && parsedData.recommendations) {
            console.log("Found recommendations in JSON:", parsedData.recommendations);
            recommendations = Array.isArray(parsedData.recommendations) 
              ? parsedData.recommendations
              : [parsedData.recommendations];
          }
        } catch (e) {
          // Not JSON, so no recommendations available
        }
      } else {
        console.log("No rejection_recommendations found in campaign metrics");
      }
      setRejectionRecommendations(recommendations);
      
      console.log("Processed rejection data:", { reasons, recommendations });
    }
  }, [campaign]);
  
  // Add function to submit campaign for approval
  const handleSubmitForApproval = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!onSubmitForApproval) {
      console.error("Submit for approval handler not provided");
      return;
    }
    
    setSubmitting(true);
    try {
      console.log("Submitting campaign for approval:", campaign.id);
      await onSubmitForApproval(campaign.id.toString());
      alert("Campaign submitted for approval successfully!");
      // Reload the page to refresh campaign status
      window.location.reload();
    } catch (error) {
      console.error("Error submitting campaign for approval:", error);
      alert("Failed to submit campaign for approval. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // Get status display info
  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'active':
        return { bgColor: 'bg-green-900/20', textColor: 'text-green-400', label: 'ACTIVE' };
      case 'draft':
        return { bgColor: 'bg-gray-900/20', textColor: 'text-gray-400', label: 'DRAFT' };
      case 'pending_approval':
      case 'pending-approval':
        return { bgColor: 'bg-yellow-900/20', textColor: 'text-yellow-400', label: 'PENDING APPROVAL' };
      case 'rejected':
        return { bgColor: 'bg-red-900/20', textColor: 'text-red-400', label: 'REJECTED' };
      case 'approved':
        return { bgColor: 'bg-green-900/20', textColor: 'text-green-400', label: 'APPROVED' };
      case 'completed':
        return { bgColor: 'bg-gray-900/20', textColor: 'text-gray-400', label: 'COMPLETED' };
      default:
        return { bgColor: 'bg-gray-900/20', textColor: 'text-gray-400', label: status.toUpperCase() };
    }
  };

  const statusInfo = getStatusInfo(campaign.status);

  const handleShowEmailInfo = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowEmailInfo(true);
  };

  const handleViewFeedback = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowFeedback(true);
  };

  // Add function to handle continuing draft
  const handleContinueDraft = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onContinueDraft) {
      onContinueDraft();
    } else {
      // Fallback to edit if onContinueDraft isn't provided
      onEdit();
    }
  };

  return (
    <div 
      className={`relative border border-gray-800 rounded-lg bg-black/40 hover:border-gray-600 transition-colors overflow-hidden focus-within:ring-2 focus-within:ring-red-500 focus:outline-none cursor-pointer ${
        isSelected ? 'border-red-500 bg-red-900/10' : ''
      }`}
      role="article"
      aria-label={`Campaign: ${campaign.title}`}
      onClick={() => onView()}
    >
      <div className={`${viewMode === 'grid' ? 'p-3 sm:p-4' : 'p-4 sm:p-5'} relative`}>
        {onSelect && (
          <button
            className={`absolute ${viewMode === 'grid' ? 'top-4 right-4' : 'top-1/2 -translate-y-1/2 left-4'} w-7 h-7 rounded-full border-2 transition-colors ${
              isSelected 
                ? 'bg-red-500 border-red-500' 
                : 'border-gray-600 hover:border-red-500 hover:bg-red-500/10'
            }`}
            onClick={(e) => {
              e.stopPropagation();
              if (onSelect) onSelect(e);
            }}
            aria-label={isSelected ? 'Deselect campaign' : 'Select campaign'}
            aria-pressed={isSelected}
          >
            {isSelected && (
              <Check className="h-5 w-5 text-white absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
            )}
          </button>
        )}
        
        <div className={`${viewMode === 'grid' ? 'mb-4 pr-6' : 'flex items-start gap-4 sm:gap-6'} ${viewMode === 'list' && onSelect ? 'pl-14' : ''}`}>
          <div className={viewMode === 'list' ? 'flex-1 min-w-0 pr-64' : ''}>
          <div 
            className="flex items-center gap-2 mb-3"
          >
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusInfo.bgColor} ${statusInfo.textColor}`}
              role="status"
              aria-label={`Campaign status: ${statusInfo.label}`}
            >
              {statusInfo.label}
            </span>
            
            {/* Replace the text label with a button for draft campaigns */}
            {campaign.status === 'draft' && (
              <button
                onClick={handleContinueDraft}
                className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-full text-xs font-medium flex items-center gap-1 transition-colors"
              >
                <PenTool className="h-3 w-3" />
                Continue Draft
              </button>
            )}
            
            {/* Add buttons for rejected campaigns */}
            {campaign.status === 'rejected' && (
              <div className="flex gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowRejectionFeedback(true);
                  }}
                  className="px-3 py-1 bg-red-600 hover:bg-red-700 rounded-full text-xs font-medium flex items-center gap-1"
                >
                  <AlertTriangle className="h-3 w-3" />
                  View Feedback
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit();
                  }}
                  className="px-3 py-1 bg-gray-800 hover:bg-gray-700 rounded-full text-xs font-medium flex items-center gap-1"
                >
                  <Edit className="h-3 w-3" />
                  Edit to Resubmit
                </button>
              </div>
            )}
          </div>
          <h3 className="text-lg font-bold text-white mb-2">
            {campaign.title}
          </h3>
          <div className="flex flex-wrap gap-2 mb-2">
            {(campaign.platforms || []).map(platform => (
              <span 
                key={platform}
                className="inline-flex items-center px-2 py-1 rounded text-xs bg-gray-800 text-gray-300"
              >
                {platform}
              </span>
            ))}
          </div>
          <div className="space-y-2">
            {campaign.brief?.original && (
              <p className="text-sm text-gray-400 line-clamp-2">
                <span className="text-green-400 font-medium mr-2">Original:</span>
                {campaign.brief.original}
              </p>
            )}
            {campaign.brief?.repurposed && (
              <p className="text-sm text-gray-400 line-clamp-2">
                <span className="text-gray-400 font-medium mr-2">Repurposed:</span>
                {campaign.brief.repurposed}
              </p>
            )}
          </div>
          </div>
          
          {viewMode === 'list' && (
            <div className="absolute right-5 top-1/2 -translate-y-1/2 flex items-center gap-8 flex-shrink-0">
              <div>
                <p className="text-xs text-gray-400">Budget</p>
                <p className="font-medium">{formatMoney(campaign.budget || 0)}</p>
                {campaign.status === 'active' && (
                  <p className="text-xs text-gray-500">{formatMoney(campaign.spent || 0)} spent</p>
                )}
              </div>
              <div>
                <p className="text-xs text-gray-400">Views</p>
                <p className="font-medium">
                  {campaign.status === 'active' ? formatNumber(campaign.views || 0) : campaign.reachEstimate || 'N/A'}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onView();
                  }}
                  className="p-2.5 border border-gray-700 rounded-lg hover:bg-white/5 transition-colors group"
                  aria-label="View campaign details"
                >
                  <div className="relative">
                    <Eye className="h-4 w-4" />
                    <div className="absolute opacity-0 group-hover:opacity-100 bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-black text-xs text-white rounded whitespace-nowrap transition-opacity">
                      View Details
                    </div>
                  </div>
                </button>
                
                {campaign.status === 'draft' || campaign.status === 'rejected' ? (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit();
                    }}
                    className={`p-2.5 border ${campaign.status === 'rejected' ? 'border-gray-800 bg-gray-800/10' : 'border-gray-700'} rounded-lg hover:bg-white/5 transition-colors group`}
                    aria-label={campaign.status === 'rejected' ? "Edit and resubmit campaign" : "Complete draft campaign"}
                  >
                    <div className="relative">
                      <Edit className="h-4 w-4 text-gray-400" />
                      <div className="absolute opacity-0 group-hover:opacity-100 bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-black text-xs text-white rounded whitespace-nowrap transition-opacity">
                        {campaign.status === 'rejected' ? 'Edit & Resubmit' : 'Complete Draft'}
                      </div>
                    </div>
                  </button>
                ) : (
                  <button
                    onClick={(e) => handleShowEmailInfo(e)}
                    className="p-2.5 border border-gray-700 rounded-lg hover:bg-white/5 transition-colors group"
                    aria-label="Request campaign edit"
                  >
                    <div className="relative">
                      <Mail className="h-4 w-4 text-gray-400" />
                      <div className="absolute opacity-0 group-hover:opacity-100 bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-black text-xs text-white rounded whitespace-nowrap transition-opacity">
                        Request Edit
                      </div>
                    </div>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
        
        {viewMode === 'grid' && <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-xs text-gray-400">Budget</p>
            <p className="font-medium">{formatMoney(campaign.budget || 0)}</p>
            {campaign.status === 'active' && (
              <p className="text-xs text-gray-500">{formatMoney(campaign.spent || 0)} spent</p>
            )}
          </div>
          <div>
            <p className="text-xs text-gray-400">Views</p>
            <p className="font-medium">
              {campaign.status === 'active' ? formatNumber(campaign.views || 0) : campaign.reachEstimate || 'N/A'}
            </p>
          </div>
        </div>}
        
        {viewMode === 'grid' && <div className="flex justify-between mt-4 pt-4 border-t border-gray-800">
          <div className="flex items-center text-sm">
            <Calendar className="h-4 w-4 mr-1 text-gray-400" />
            <span>{campaign.endDate ? new Date(campaign.endDate).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric'
            }) : 'No end date'}</span>
          </div>
          
          <div className="flex items-center gap-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onView();
              }}
              className="p-2 border border-gray-700 rounded-lg hover:bg-white/5 transition-colors group"
              aria-label="View campaign details"
            >
              <Eye className="h-4 w-4" />
            </button>
            
            {campaign.status === 'draft' || campaign.status === 'rejected' ? (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit();
                }}
                className="px-3 py-1 bg-gray-800 hover:bg-gray-700 rounded-full text-xs font-medium flex items-center gap-1"
              >
                <Edit className="h-3 w-3" />
                Edit to Resubmit
              </button>
            ) : (
              <button
                onClick={(e) => handleShowEmailInfo(e)}
                className="p-2 border border-gray-700 rounded-lg hover:bg-white/5 transition-colors group"
                aria-label="Request campaign edit"
              >
                <Mail className="h-4 w-4 text-gray-400" />
              </button>
            )}
          </div>
        </div>}
        
        {/* Rejected Campaign */}
        {campaign.status === 'rejected' && (
          <div className="flex flex-col mt-4 pt-4 border-t border-gray-800 gap-2">
            <div className="flex items-center text-gray-400 gap-1 mb-1">
              <AlertTriangle className="h-4 w-4 text-orange-500" />
              <span className="text-sm">This campaign was rejected</span>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={(e) => handleViewFeedback(e)}
                className="flex-1 px-3 py-2 bg-black border border-gray-700 hover:bg-gray-800 rounded-lg text-sm transition-colors flex items-center justify-center gap-1"
              >
                <MessageSquare className="h-4 w-4" /> 
                <span>View Feedback</span>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit();
                }}
                className="flex-1 px-3 py-2 bg-black border border-gray-700 hover:bg-gray-800 rounded-lg text-sm transition-colors flex items-center justify-center gap-1"
              >
                <Edit className="h-4 w-4" /> 
                <span>Edit to Resubmit</span>
              </button>
            </div>
          </div>
        )}
      </div>
      
      {/* Rejection Feedback Modal */}
      {showRejectionFeedback && (
        <div className="fixed inset-0 z-50 overflow-y-auto" 
             onClick={(e) => {
               e.stopPropagation();
               e.preventDefault();
               setShowRejectionFeedback(false);
             }}>
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity bg-black" aria-hidden="true"></div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="inline-block p-6 overflow-hidden text-left align-bottom transition-all transform bg-black border border-gray-800 rounded-lg shadow-xl sm:my-8 sm:align-middle sm:max-w-lg sm:w-full"
                 onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                  Rejection Feedback
                </h3>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowRejectionFeedback(false);
                  }}
                  className="p-1 hover:bg-gray-800 rounded-full"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              {/* Show fallback message if no rejection reasons */}
              {rejectionReasons.length === 0 && (
                <div className="border border-red-800 rounded-lg bg-red-900/10 p-4 mb-4">
                  <h4 className="font-medium text-red-400 mb-2">Campaign Rejected:</h4>
                  <p className="text-gray-300">
                    {campaign.rejectionReason || "Your campaign was reviewed and could not be approved with its current content or settings."}
                  </p>
                  <p className="mt-2 text-sm text-gray-400">
                    Please review your campaign details to ensure they meet our guidelines.
                  </p>
                </div>
              )}
              
              {/* Show rejection reasons if available */}
              {rejectionReasons.length > 0 && (
                <div className="border border-red-800 rounded-lg bg-red-900/10 p-4 mb-4">
                  <h4 className="font-medium text-red-400 mb-2">Reasons for Rejection:</h4>
                  <ul className="text-gray-300 space-y-2 ml-6 list-disc">
                    {rejectionReasons.map((reason, index) => (
                      <li key={index}>{reason}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              {/* Generic recommendations if none provided */}
              {rejectionRecommendations.length === 0 && (
                <div className="border border-gray-700 rounded-lg bg-gray-900/30 p-4">
                  <h4 className="font-medium text-gray-400 mb-2">General Recommendations:</h4>
                  <ul className="text-gray-300 space-y-2 ml-6 list-disc">
                    <li>Review your campaign's target audience and content for alignment with our guidelines</li>
                    <li>Check that your budget allocation is appropriate for your campaign goals</li>
                    <li>Ensure your creative brief provides clear direction for content creators</li>
                    <li>Consider revising any content that may not comply with our community standards</li>
                  </ul>
                </div>
              )}
              
              {rejectionRecommendations.length > 0 && (
                <div className="border border-gray-700 rounded-lg bg-gray-900/30 p-4 mb-4">
                  <h4 className="font-medium text-gray-400 mb-2">Recommendations:</h4>
                  <ul className="text-gray-300 space-y-2 ml-6 list-disc">
                    {rejectionRecommendations.map((recommendation, index) => (
                      <li key={index}>{recommendation}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowRejectionFeedback(false);
                    setShowEmailInfo(true);
                  }}
                  className="px-4 py-2 bg-black hover:bg-gray-900 border border-gray-700 transition-colors rounded-lg text-white"
                >
                  Request Help
                </button>
                <button
                  onClick={() => {
                    setShowRejectionFeedback(false);
                    onEdit();
                  }}
                  className="px-4 py-2 bg-black hover:bg-gray-900 border border-gray-700 transition-colors rounded-lg text-white"
                >
                  Edit Campaign
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Email Info Modal */}
      {showEmailInfo && (
        <div className="fixed inset-0 z-50 overflow-y-auto" 
             onClick={(e) => {
               e.stopPropagation();
               e.preventDefault();
               setShowEmailInfo(false);
             }}>
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity bg-black" aria-hidden="true"></div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="inline-block p-6 overflow-hidden text-left align-bottom transition-all transform bg-black border border-gray-800 rounded-lg shadow-xl sm:my-8 sm:align-middle sm:max-w-lg sm:w-full"
                 onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <Mail className="h-5 w-5 text-gray-400" />
                  Request Campaign Edit
                </h3>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowEmailInfo(false);
                  }}
                  className="p-1 hover:bg-gray-800 rounded-full"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <div className="border border-gray-700 rounded-lg bg-gray-900/30 p-4 mb-4">
                <p className="text-gray-300 mb-3">
                  To make any changes to your campaign, please email us with your request at:
                </p>
                <div className="flex items-center justify-center gap-2 p-3 bg-gray-800 rounded-lg border border-gray-700">
                  <Mail className="h-5 w-5 text-gray-400" />
                  <a href="mailto:support@adcrew.io" className="text-lg font-medium text-gray-300 hover:text-gray-200">
                    support@adcrew.io
                  </a>
                </div>
              </div>

              <div className="p-4 bg-gray-900/30 border border-gray-700 rounded-lg mb-6">
                <div className="flex items-start gap-3">
                  <div className="h-5 w-5 flex items-center justify-center text-yellow-400 mt-0.5">
                    <AlertTriangle className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-white font-medium mb-1">Campaign Reference</h4>
                    <p className="text-gray-300 text-sm">In your email, please include:</p>
                    <ul className="list-disc list-inside text-gray-300 ml-2 mt-1">
                      <li>Campaign ID: <span className="text-yellow-300 font-mono">{campaign.id}</span></li>
                      <li>Campaign Name: <span className="text-yellow-300">{campaign.name}</span></li>
                      <li>Specific changes needed</li>
                      <li>Timeline for changes (if applicable)</li>
                    </ul>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setShowEmailInfo(false)}
                  className="px-4 py-2 bg-black hover:bg-gray-900 border border-gray-700 transition-colors rounded-lg text-white"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Feedback Modal */}
      {showFeedback && (
        <div className="fixed inset-0 z-50 overflow-y-auto" 
             onClick={(e) => {
               e.stopPropagation();
               e.preventDefault();
               setShowFeedback(false);
             }}>
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity bg-black" aria-hidden="true"></div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="inline-block p-6 overflow-hidden text-left align-bottom transition-all transform bg-black border border-gray-800 rounded-lg shadow-xl sm:my-8 sm:align-middle sm:max-w-lg sm:w-full"
                 onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-red-500" />
                  Campaign Feedback
                </h3>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowFeedback(false);
                  }}
                  className="p-1 hover:bg-gray-800 rounded-full"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <div className="border border-red-800 rounded-lg bg-red-900/10 p-4 mb-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-red-500 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="text-white font-medium mb-1">Campaign Rejected</h4>
                    <p className="text-gray-300">
                      {rejectionReasons.length > 0 
                        ? rejectionReasons.join(', ') 
                        : campaign.rejectionReason || "Your campaign was reviewed and could not be approved with its current content or settings."}
                    </p>
                    
                    {/* Display additional message when no reasons or recommendations are available */}
                    {rejectionReasons.length === 0 && rejectionRecommendations.length === 0 && !campaign.rejectionReason && (
                      <p className="mt-2 text-sm text-gray-400">
                        Please review your campaign details to ensure they meet our guidelines. For specific assistance, contact our support team at support@adcrew.io.
                      </p>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Generic recommendations if none provided */}
              {rejectionRecommendations.length === 0 && (
                <div className="border border-gray-700 rounded-lg bg-gray-900/30 p-4 mb-4">
                  <h4 className="font-medium text-gray-400 mb-2">General Recommendations:</h4>
                  <ul className="text-gray-300 space-y-2 ml-6 list-disc">
                    <li>Review your campaign's target audience and content for alignment with our guidelines</li>
                    <li>Check that your budget allocation is appropriate for your campaign goals</li>
                    <li>Ensure your creative brief provides clear direction for content creators</li>
                    <li>Consider revising any content that may not comply with our community standards</li>
                  </ul>
                </div>
              )}

              {rejectionRecommendations.length > 0 && (
                <div className="border border-gray-700 rounded-lg bg-gray-900/30 p-4 mb-4">
                  <h4 className="font-medium text-gray-400 mb-2">Recommendations:</h4>
                  <ul className="text-gray-300 space-y-2 ml-6 list-disc">
                    {rejectionRecommendations.map((recommendation, index) => (
                      <li key={index}>{recommendation}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="flex flex-col gap-4">
                <button
                  onClick={() => {
                    setShowFeedback(false);
                    onEdit();
                  }}
                  className="w-full px-4 py-3 bg-black hover:bg-gray-900 border border-gray-700 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <Edit className="h-5 w-5" />
                  <span>Edit Campaign to Resubmit</span>
                </button>
                
                <button
                  onClick={() => setShowFeedback(false)}
                  className="w-full px-4 py-3 bg-black hover:bg-gray-900 border border-gray-700 rounded-lg transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BrandCampaignCard;