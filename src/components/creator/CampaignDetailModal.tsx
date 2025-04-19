import React, { useState, useEffect } from 'react';
import type { Campaign, AvailableCampaign } from './types';
import CampaignDetailModal from '@/components/shared/CampaignDetailModal';
import { useCampaigns } from '@/hooks/useCampaigns';
import { supabase } from '@/lib/supabaseClient';

interface CreatorCampaignDetailModalProps {
  campaign: Campaign | AvailableCampaign;
  onClose: () => void;
  onJoin?: () => void;
}

const CreatorCampaignDetailModal: React.FC<CreatorCampaignDetailModalProps> = ({ campaign, onClose, onJoin }) => {
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
      }
    };
    getUser();
  }, []);

  const { joinCampaign } = useCampaigns({ userId: userId || undefined, userType: 'creator' });
  
  const handleJoin = async () => {
    try {
      setJoining(true);
      setError(null);
      
      if (!userId) {
        throw new Error('User not logged in');
      }
      
      // Join campaign with selected platforms
      await joinCampaign(campaign.id, campaign.requirements?.platforms || []);
      
      // Call parent handler
      if (onJoin) onJoin();
      
      // Close modal
      onClose();
    } catch (err) {
      console.error('Error joining campaign:', err);
      setError('Failed to join campaign. Please try again.');
    } finally {
      setJoining(false);
    }
  };
  
  return (
    <CampaignDetailModal
      campaign={campaign}
      onClose={onClose}
      onJoin={handleJoin}
      isLoading={joining}
      error={error}
    />
  );
};

export default CreatorCampaignDetailModal; 