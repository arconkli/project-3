import type { ContentReview, SupportTicket } from '@/types/admin';

export const mockContentReviews: ContentReview[] = [
  {
    id: '1',
    post_id: 'post_1',
    campaign_id: 'campaign_1',
    creator_id: 'creator_1',
    reviewer_id: 'admin_1',
    status: 'pending',
    platform: 'TikTok',
    contentType: 'original',
    postUrl: 'https://example.com/video1',
    viewCount: 245000,
    submittedAt: '2025-03-12T10:00:00Z',
    created_at: '2025-03-12T10:00:00Z',
    updated_at: '2025-03-12T10:00:00Z',
    notes: [
      'Content follows guidelines',
      'High engagement rate'
    ]
  },
  {
    id: '2',
    post_id: 'post_2',
    campaign_id: 'campaign_2',
    creator_id: 'creator_2',
    reviewer_id: 'admin_1',
    status: 'pending',
    platform: 'Instagram',
    contentType: 'repurposed',
    postUrl: 'https://example.com/video2',
    viewCount: 180000,
    submittedAt: '2025-03-12T09:30:00Z',
    created_at: '2025-03-12T09:30:00Z',
    updated_at: '2025-03-12T09:30:00Z',
    notes: [
      'Missing required hashtags',
      'Good production quality'
    ]
  },
  {
    id: '3',
    post_id: 'post_3',
    campaign_id: 'campaign_3',
    creator_id: 'creator_3',
    reviewer_id: 'admin_1',
    status: 'pending',
    platform: 'YouTube',
    contentType: 'original',
    postUrl: 'https://example.com/video3',
    viewCount: 320000,
    submittedAt: '2025-03-12T09:00:00Z',
    created_at: '2025-03-12T09:00:00Z',
    updated_at: '2025-03-12T09:00:00Z',
    notes: [
      'Excellent brand integration',
      'High watch time'
    ]
  }
];

export const mockSupportTickets: SupportTicket[] = [
  {
    id: '1',
    user_id: 'user_1',
    type: 'payment',
    status: 'open',
    priority: 'high',
    title: 'Payment Processing Issue',
    description: 'Payment pending for over 48 hours',
    category: 'billing',
    responseCount: 2,
    created_at: '2025-03-12T08:00:00Z',
    updated_at: '2025-03-12T10:00:00Z'
  },
  {
    id: '2',
    user_id: 'user_2',
    type: 'technical',
    status: 'in_progress',
    priority: 'medium',
    title: 'Video Upload Failed',
    description: 'Unable to upload content for review',
    category: 'platform',
    responseCount: 1,
    created_at: '2025-03-12T09:00:00Z',
    updated_at: '2025-03-12T09:30:00Z'
  },
  {
    id: '3',
    user_id: 'user_3',
    type: 'account',
    status: 'open',
    priority: 'low',
    title: 'Update Account Details',
    description: 'Need to change connected platforms',
    category: 'general',
    responseCount: 0,
    created_at: '2025-03-12T10:00:00Z',
    updated_at: '2025-03-12T10:00:00Z'
  }
];