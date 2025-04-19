import React, { useState, useMemo, useEffect } from 'react';
import { Search, Filter, Plus, Copy, Archive, Trash2, X, Grid, List, Check } from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';
import BrandCampaignCard from './BrandCampaignCard';
import type { Campaign } from '@/types/brand';

interface BrandCampaignsProps {
  campaigns: Campaign[];
  onCreateCampaign: () => void;
  onViewCampaign: (campaign: Campaign) => void;
  onEditCampaign?: (campaign: Campaign) => void;
  onContinueDraft?: (campaign: Campaign) => void;
  onSubmitForApproval?: (campaignId: string) => Promise<void>;
}

const BrandCampaigns: React.FC<BrandCampaignsProps> = ({
  campaigns,
  onCreateCampaign,
  onViewCampaign,
  onEditCampaign,
  onContinueDraft,
  onSubmitForApproval
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedCampaigns, setSelectedCampaigns] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const isMobile = window.innerWidth < 768;
  
  // Debounce search term updates
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Force list view on mobile for better readability
  useEffect(() => {
    if (isMobile) {
      setViewMode('list');
    }
  }, [isMobile]);

  // Filter campaigns based on search and status
  const filteredCampaigns = useMemo(() => {
    return campaigns.filter(campaign => {
      const matchesSearch = !debouncedSearchTerm || 
        campaign.title.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        campaign.platforms.some(platform => 
          platform.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
        );
      
      // Handle status filtering with special cases for pending_approval
      const matchesStatus = 
        statusFilter === 'all' || 
        campaign.status === statusFilter || 
        (statusFilter === 'pending-approval' && campaign.status === 'pending_approval') || 
        (statusFilter === 'pending_approval' && campaign.status === 'pending-approval');
      
      return matchesSearch && matchesStatus;
    });
  }, [campaigns, debouncedSearchTerm, statusFilter]);

  // Handle select all functionality
  const handleSelectAll = () => {
    if (selectedCampaigns.length === filteredCampaigns.length) {
      setSelectedCampaigns([]);
    } else {
      setSelectedCampaigns(filteredCampaigns.map(c => c.id));
    }
  };

  const toggleCampaignSelection = (campaignId: string) => {
    setSelectedCampaigns(prev => {
      if (prev.includes(campaignId)) {
        return prev.filter(id => id !== campaignId);
      }
      return [...prev, campaignId];
    });
  };

  const handleBatchAction = (action: 'duplicate' | 'archive' | 'delete') => {
    console.log(`Performing ${action} on campaigns:`, selectedCampaigns);
    setSelectedCampaigns([]);
  };

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="p-4 sm:p-6 bg-black/40 border border-gray-800 rounded-lg">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex-1">
            <div className="text-xl font-bold mb-2">Campaign Management</div>
            <p className="text-sm text-gray-400">View, edit and analyze all your campaigns in one place</p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto space-y-2 sm:space-y-0">
            <div className="relative w-full sm:w-64">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                className="pl-10 pr-4 py-2 w-full bg-black/40 border border-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                placeholder="Search campaigns..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                aria-label="Search campaigns"
              />
            </div>
            
            <div className="flex gap-3 w-full sm:w-auto">
              <div className="relative flex-1">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 w-full bg-black/40 border border-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 appearance-none pr-8 transition-colors"
                  aria-label="Filter by status"
                >
                  <option value="all">All Campaigns</option>
                  <option value="draft">Drafts</option>
                  <option value="pending_approval">Pending Approval</option>
                  <option value="approved">Approved</option>
                  <option value="active">Active</option>
                  <option value="rejected">Rejected</option>
                  <option value="completed">Completed</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                  <Filter className="h-4 w-4 text-gray-400" />
                </div>
              </div>
              
              <button
                onClick={onCreateCampaign}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 transition-colors rounded-lg text-white font-medium focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50"
                aria-label="Create new campaign"
              >
                <Plus className="h-4 w-4" />
                <span>New Campaign</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Batch Actions */}
      {selectedCampaigns.length > 0 && (
        <div className="flex items-center justify-between gap-3 bg-black/60 border border-gray-700 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <button
              onClick={handleSelectAll}
              className={`p-2 rounded-lg hover:bg-white/10 transition-colors ${
                selectedCampaigns.length === filteredCampaigns.length
                  ? 'text-red-400'
                  : 'text-gray-300'
              }`}
              title={selectedCampaigns.length === filteredCampaigns.length ? 'Deselect all' : 'Select all'}
            >
              <Check className="h-5 w-5" />
            </button>
            <span className="text-sm text-gray-400">
              {selectedCampaigns.length} of {filteredCampaigns.length} selected
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <button 
              className="p-2 rounded-lg hover:bg-white/10 transition-colors text-gray-300 hover:text-white" 
              onClick={() => handleBatchAction('duplicate')}
              title="Duplicate selected"
            >
              <Copy className="h-5 w-5" />
            </button>
          
            <button 
              className="p-2 rounded-lg hover:bg-white/10 transition-colors text-gray-300 hover:text-white" 
              onClick={() => handleBatchAction('archive')}
              title="Archive selected"
            >
              <Archive className="h-5 w-5" />
            </button>
          
            <button 
              className="p-2 rounded-lg hover:bg-white/10 transition-colors text-red-400 hover:text-red-300" 
              onClick={() => handleBatchAction('delete')}
              title="Delete selected"
            >
              <Trash2 className="h-5 w-5" />
            </button>
          
            <button 
              className="p-2 rounded-lg hover:bg-white/10 transition-colors text-gray-300 hover:text-white" 
              onClick={() => setSelectedCampaigns([])}
              title="Clear selection"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}

      {/* View Toggle */}
      <div className="hidden md:flex justify-end mb-6">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-400">View:</span>
          <button
            className={`p-2 rounded-lg transition-colors ${
              viewMode === 'list' 
                ? 'bg-gray-800 text-white' 
                : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
            }`}
            onClick={() => setViewMode('list')}
            aria-label="List view"
            aria-pressed={viewMode === 'list'}
          >
            <List className="h-5 w-5" />
          </button>
          <button
            className={`p-2 rounded-lg transition-colors ${
              viewMode === 'grid' 
                ? 'bg-gray-800 text-white' 
                : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
            }`}
            onClick={() => setViewMode('grid')}
            aria-label="Grid view"
            aria-pressed={viewMode === 'grid'}
          >
            <Grid className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Campaign Grid */}
      <div className={`${
        viewMode === 'grid'
          ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6'
          : 'space-y-4'
      }`}>
        {filteredCampaigns.map((campaign) => (
          <BrandCampaignCard
            key={campaign.id}
            campaign={campaign}
            onView={() => onViewCampaign(campaign)}
            onEdit={() => onEditCampaign ? onEditCampaign(campaign) : onViewCampaign(campaign)}
            onContinueDraft={() => onContinueDraft ? onContinueDraft(campaign) : (onEditCampaign ? onEditCampaign(campaign) : onViewCampaign(campaign))}
            isSelected={selectedCampaigns.includes(campaign.id)}
            onSelect={(e) => {
              e.stopPropagation();
              toggleCampaignSelection(campaign.id);
            }}
            viewMode={viewMode}
            onSubmitForApproval={onSubmitForApproval}
          />
        ))}
        
        {/* Create Campaign Card */}
        <div className="border border-dashed border-gray-700 rounded-lg bg-black/20 hover:border-red-500 transition-all">
          <button
            className="w-full h-full p-6 flex flex-col items-center justify-center gap-3 text-gray-400 hover:text-white transition-colors"
            onClick={onCreateCampaign}
          >
            <div className="w-12 h-12 rounded-full bg-black/40 flex items-center justify-center">
              <Plus className="h-6 w-6" />
            </div>
            <span className="font-medium">Create New Campaign</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default BrandCampaigns;