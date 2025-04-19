import React, { useState, useEffect } from 'react';
import { X, Eye, Calendar, DollarSign, Check, AlertCircle, Youtube, Instagram, Twitter, FileText, ArrowUpRight, ChevronRight } from 'lucide-react';
import type { Campaign, AvailableCampaign, Post } from './types';
import { formatMoney, formatNumber } from '@/utils/format';
import { motion, AnimatePresence } from 'framer-motion';
import CampaignDetailModal from '@/components/shared/CampaignDetailModal';

interface ConnectedAccount {
  id: string;
  username: string;
  followers: string;
  isVerified: boolean;
  isPrimary: boolean;
  addedOn: string;
}

interface AccountSelection {
  [platform: string]: {
    accountIds: string[];
    contentType: 'original' | 'repurposed' | null;
  };
}

interface CreatorCampaignDetailModalProps {
  campaign: Campaign | AvailableCampaign;
  onClose: () => void;
  onJoin?: () => void;
  onEdit?: (campaign: Campaign | AvailableCampaign) => void;
}

// Sample connected accounts data (in a real app, this would come from your user state/context)
const connectedAccounts = {
  instagram: [
    {
      id: 'ig1',
      username: 'creator.main',
      followers: '180K',
      isVerified: true,
      isPrimary: true,
      addedOn: '2025-01-15'
    },
    {
      id: 'ig2',
      username: 'creator.gaming',
      followers: '85K',
      isVerified: true,
      isPrimary: false,
      addedOn: '2025-02-01'
    }
  ],
  tiktok: [
    {
      id: 'tt1',
      username: 'creator',
      followers: '500K',
      isVerified: true,
      isPrimary: true,
      addedOn: '2024-12-20'
    }
  ],
  youtube: [
    {
      id: 'yt1',
      username: 'Creator Official',
      followers: '250K',
      isVerified: true,
      isPrimary: true,
      addedOn: '2025-01-10'
    }
  ]
};

// Helper to check if campaign is active
const isActiveCampaign = (campaign: Campaign | AvailableCampaign): campaign is Campaign => {
  return 'posts' in campaign;
};

// Status Label Component
const StatusLabel = ({ status }: { status: string }) => {
  let bgColor, textColor;

  switch (status.toLowerCase()) {
    case 'approved':
      bgColor = 'bg-green-900/20';
      textColor = 'text-green-400';
      break;
    case 'denied':
      bgColor = 'bg-red-900/20';
      textColor = 'text-red-400';
      break;
    case 'pending':
      bgColor = 'bg-yellow-900/20';
      textColor = 'text-yellow-400';
      break;
    default:
      bgColor = 'bg-gray-900/20';
      textColor = 'text-gray-400';
  }

  return (
    <span className={`px-3 py-1 rounded-full text-sm font-medium ${bgColor} ${textColor}`} role="status">
      {status.toUpperCase()}
    </span>
  );
};

const BrandCampaignDetailModal: React.FC<CreatorCampaignDetailModalProps> = ({ 
  campaign, 
  onClose, 
  onJoin,
  onEdit 
}) => {
  return (
    <CampaignDetailModal
      campaign={campaign}
      onClose={onClose}
      onJoin={onJoin}
      onEdit={onEdit}
      userType="brand"
    />
  );
};

export default BrandCampaignDetailModal;