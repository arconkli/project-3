export * from './types';
export * from './CampaignService';
export * from './CampaignAnalyticsService';

import { CampaignService } from './CampaignService';
import { CampaignAnalyticsService } from './CampaignAnalyticsService';

// Create singleton instances
const campaignService = new CampaignService();
const campaignAnalyticsService = new CampaignAnalyticsService();

export { campaignService, campaignAnalyticsService }; 