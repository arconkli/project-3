import type { Campaign, AvailableCampaign } from '@/components/creator/types';

export const activeCampaigns: Campaign[] = [
  {
    id: '1',
    title: 'Summer Product Launch',
    status: 'active',
    budget: 10000,
    spent: 4200,
    views: 1200000,
    engagement: 320000,
    platforms: ['TikTok', 'Instagram'],
    startDate: '2025-06-01',
    endDate: '2025-06-30',
    brief: {
      original: 'Create authentic content showcasing our new summer collection in real-world settings. Focus on lifestyle shots that highlight the versatility and style of the pieces.',
      repurposed: 'Integrate our summer collection pieces into your existing content style. Show how the pieces fit into your daily lifestyle content.'
    },
    creatorCount: 8,
    contentType: 'both',
    engagement_rate: 4.2,
    completedPosts: 15,
    pendingPosts: 3,
    reachEstimate: '1.5M - 2.2M',
    requirements: {
      contentGuidelines: [
        'Show product being used in real-life situations',
        'Include lifestyle shots that align with brand aesthetic',
        'Tag @brandname in all posts'
      ],
      platforms: ['TikTok', 'Instagram'],
      minViewsForPayout: '100K',
      totalBudget: '$10,000',
      payoutRate: {
        original: '$500 per 1M views',
        repurposed: '$250 per 1M views'
      },
      hashtags: {
        original: '#BrandSummerAd',
        repurposed: '#BrandSummerPartner'
      },
      files: [
        {
          name: 'brand_guidelines.pdf',
          url: 'https://example.com/files/brand_guidelines.pdf',
          type: 'application/pdf',
          size: 2500000
        },
        {
          name: 'product_photos.zip',
          url: 'https://example.com/files/product_photos.zip',
          type: 'application/zip',
          size: 15000000
        }
      ]
    }
  },
  {
    id: '2',
    title: 'Gaming Stream Highlights',
    status: 'active',
    budget: 15000,
    spent: 8200,
    views: 2700000,
    engagement: 580000,
    platforms: ['TikTok', 'YouTube'],
    startDate: '2025-05-15',
    endDate: '2025-07-15',
    brief: {
      original: 'Create engaging gameplay content featuring exciting moments and genuine reactions from our latest game release. Focus on showcasing unique features and gameplay mechanics.',
      repurposed: null
    },
    creatorCount: 12,
    contentType: 'original',
    engagement_rate: 5.8,
    completedPosts: 24,
    pendingPosts: 6,
    reachEstimate: '2.8M - 3.5M',
    requirements: {
      contentGuidelines: [
        'Capture genuine reactions to key game moments',
        'Showcase different game features/modes',
        'Include game title and platform info'
      ],
      platforms: ['TikTok', 'YouTube'],
      minViewsForPayout: '100K',
      totalBudget: '$15,000',
      payoutRate: {
        original: '$600 per 1M views'
      },
      hashtags: {
        original: '#GameTitleAd',
        repurposed: '#GameTitlePartner'
      },
      files: [
        {
          name: 'game_assets.zip',
          url: 'https://example.com/files/game_assets.zip',
          type: 'application/zip',
          size: 25000000
        },
        {
          name: 'gameplay_clips.mp4',
          url: 'https://example.com/files/gameplay_clips.mp4',
          type: 'video/mp4',
          size: 50000000
        }
      ]
    }
  },
  {
    id: '3',
    title: 'Music Artist Promotion',
    status: 'active',
    budget: 20000,
    spent: 12000,
    views: 3500000,
    engagement: 850000,
    platforms: ['TikTok', 'Instagram', 'YouTube'],
    startDate: '2025-06-15',
    endDate: '2025-07-30',
    brief: {
      original: null,
      repurposed: 'Incorporate the artist\'s new track into your existing content style. Show how the music enhances and fits with your regular content themes.'
    },
    creatorCount: 15,
    contentType: 'repurposed',
    engagement_rate: 6.2,
    completedPosts: 30,
    pendingPosts: 8,
    reachEstimate: '4M - 5M',
    requirements: {
      contentGuidelines: [
        'Use the provided song clip in your existing content style',
        'Add music visualization or lyrics overlay',
        'Tag @artistname in description'
      ],
      platforms: ['TikTok', 'Instagram', 'YouTube'],
      minViewsForPayout: '50K',
      totalBudget: '$20,000',
      payoutRate: {
        repurposed: '$300 per 1M views'
      },
      hashtags: {
        original: '#ArtistNameAd',
        repurposed: '#ArtistNamePartner'
      }
    }
  }
];

export const completedCampaigns: Campaign[] = [
  {
    id: '1',
    title: 'Summer Fashion Collection',
    brand: 'StyleCo',
    status: 'completed',
    views: 150000,
    earnings: 2500,
    deadline: '2025-02-15',
    description: 'Showcase our summer collection with a focus on beachwear and accessories.',
    platforms: ['Instagram', 'TikTok'],
    requirements: [
      'Create 2 posts featuring our products',
      'Include brand hashtags',
      'Tag our official account'
    ]
  },
  {
    id: '2',
    title: 'Gaming Headset Launch',
    brand: 'TechGear',
    status: 'completed',
    views: 200000,
    earnings: 3000,
    deadline: '2025-02-28',
    description: 'Review our new gaming headset with emphasis on sound quality and comfort.',
    platforms: ['YouTube', 'TikTok'],
    requirements: [
      'Create an unboxing video',
      'Demonstrate key features',
      'Share honest feedback'
    ]
  }
];

export const availableCampaigns: AvailableCampaign[] = [
  {
    id: '3',
    title: 'Fitness App Promotion',
    brand: 'FitLife',
    status: 'pending',
    views: 0,
    earnings: 1500,
    deadline: '2025-04-15',
    budget: 5000,
    description: 'Create content showcasing your fitness journey using our app.',
    platforms: ['Instagram', 'TikTok'],
    requirements: [
      'Create 3 posts over 2 weeks',
      'Show app interface and features',
      'Share personal results'
    ],
    startDate: '2025-04-01',
    endDate: '2025-04-15',
    targetAudience: {
      age: [18, 35],
      interests: ['fitness', 'health', 'wellness'],
      locations: ['United States', 'Canada', 'UK']
    },
    metrics: {
      minFollowers: 10000,
      minEngagementRate: 3.5,
      averageViews: 5000
    }
  },
  {
    id: '4',
    title: 'Sustainable Fashion',
    brand: 'EcoWear',
    status: 'pending',
    views: 0,
    earnings: 2000,
    deadline: '2025-04-30',
    budget: 8000,
    description: 'Promote our eco-friendly clothing line and sustainable practices.',
    platforms: ['Instagram', 'TikTok', 'YouTube'],
    requirements: [
      'Create a lookbook video',
      'Highlight sustainable materials',
      'Share styling tips'
    ],
    startDate: '2025-04-10',
    endDate: '2025-04-30',
    targetAudience: {
      age: [16, 40],
      interests: ['fashion', 'sustainability', 'lifestyle'],
      locations: ['United States', 'Europe']
    },
    metrics: {
      minFollowers: 15000,
      minEngagementRate: 4.0,
      averageViews: 8000
    }
  }
];