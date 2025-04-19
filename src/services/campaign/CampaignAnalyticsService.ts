// Import the shared supabase instance
import { supabase } from '@/lib/supabaseClient';
import { Campaign, CampaignAnalytics } from './types';

export class CampaignAnalyticsService {
    // Use the imported supabase instance directly
    private readonly supabase = supabase;

    constructor() {
        // Remove the constructor logic that creates a new client
        // const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        // const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
        // 
        // if (!supabaseUrl || !supabaseAnonKey) {
        //     console.warn('Supabase credentials not found in CampaignAnalyticsService. Using fallback configuration.');
        // }
        // 
        // this.supabase = createClient(
        //     supabaseUrl || '',
        //     supabaseAnonKey || ''
        // );

        // Optional: Can keep a check here if needed
        if (!this.supabase) {
            console.error('CRITICAL: Shared Supabase client instance is not available in CampaignAnalyticsService!');
        }
    }

    /**
     * Get complete analytics for a campaign
     */
    async getCampaignAnalytics(campaignId: string): Promise<CampaignAnalytics> {
        try {
            // Get the campaign
            const { data: campaign, error: campaignError } = await this.supabase
                .from('campaigns')
                .select('*')
                .eq('id', campaignId)
                .single();

            if (campaignError) throw campaignError;

            // Get all campaign posts
            const { data: posts, error: postsError } = await this.supabase
                .from('campaign_posts')
                .select(`
                    *,
                    creator:auth.users!creator_id(name)
                `)
                .eq('campaign_id', campaignId);

            if (postsError) throw postsError;

            // Get creators
            const { data: creators, error: creatorsError } = await this.supabase
                .from('campaign_creators')
                .select(`
                    *,
                    creator:auth.users!creator_id(name)
                `)
                .eq('campaign_id', campaignId)
                .eq('status', 'approved');

            if (creatorsError) throw creatorsError;

            // Calculate total views and engagement
            const totalViews = posts?.reduce((sum, post) => sum + (post.views || 0), 0) || 0;
            const totalEngagement = posts?.reduce((sum, post) => sum + (parseFloat(post.engagement) || 0), 0) || 0;

            // Calculate platform performance
            const platformPerformance: { [key: string]: { views: number; engagement: number; spent: number } } = {};
            
            posts?.forEach(post => {
                const platform = post.platform;
                
                if (!platformPerformance[platform]) {
                    platformPerformance[platform] = {
                        views: 0,
                        engagement: 0,
                        spent: 0
                    };
                }
                
                platformPerformance[platform].views += post.views || 0;
                platformPerformance[platform].engagement += parseFloat(post.engagement) || 0;
                platformPerformance[platform].spent += parseFloat(post.earned) || 0;
            });

            // Top creators
            const creatorPerformance: { [id: string]: { 
                creator_id: string;
                name: string;
                views: number;
                engagement: number;
                earned: number;
            } } = {};
            
            posts?.forEach(post => {
                const creatorId = post.creator_id;
                
                if (!creatorPerformance[creatorId]) {
                    creatorPerformance[creatorId] = {
                        creator_id: creatorId,
                        name: post.creator?.name || 'Unknown Creator',
                        views: 0,
                        engagement: 0,
                        earned: 0
                    };
                }
                
                creatorPerformance[creatorId].views += post.views || 0;
                creatorPerformance[creatorId].engagement += parseFloat(post.engagement) || 0;
                creatorPerformance[creatorId].earned += parseFloat(post.earned) || 0;
            });
            
            const topCreators = Object.values(creatorPerformance)
                .sort((a, b) => b.views - a.views)
                .slice(0, 5);

            // Create time series data (last 30 days)
            const today = new Date();
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(today.getDate() - 30);
            
            const timeSeriesData: { 
                date: string;
                views: number;
                engagement: number;
                spent: number;
            }[] = [];
            
            // Generate empty data for all 30 days
            for (let i = 0; i < 30; i++) {
                const date = new Date(thirtyDaysAgo);
                date.setDate(date.getDate() + i);
                const dateString = date.toISOString().split('T')[0];
                
                timeSeriesData.push({
                    date: dateString,
                    views: 0,
                    engagement: 0,
                    spent: 0
                });
            }
            
            // Fill in data from posts
            posts?.forEach(post => {
                if (!post.posted_at) return;
                
                const postDate = new Date(post.posted_at).toISOString().split('T')[0];
                const dataPoint = timeSeriesData.find(d => d.date === postDate);
                
                if (dataPoint) {
                    dataPoint.views += post.views || 0;
                    dataPoint.engagement += parseFloat(post.engagement) || 0;
                    dataPoint.spent += parseFloat(post.earned) || 0;
                }
            });

            // Calculate ROI (simple version: views / spent)
            const roi = campaign.spent > 0 ? totalViews / campaign.spent : 0;

            return {
                views: totalViews,
                engagement: totalEngagement,
                creators_joined: creators?.length || 0,
                posts_submitted: campaign.metrics?.posts_submitted || 0,
                posts_approved: campaign.metrics?.posts_approved || 0,
                spent: parseFloat(campaign.spent) || 0,
                roi: roi,
                performance_by_platform: platformPerformance,
                top_creators: topCreators,
                time_series: timeSeriesData
            };
        } catch (error) {
            console.error('Error fetching campaign analytics:', error);
            throw error;
        }
    }

    /**
     * Get analytics overview for all brand campaigns
     */
    async getBrandCampaignsAnalytics(brandId: string): Promise<{ 
        total_campaigns: number;
        active_campaigns: number;
        completed_campaigns: number;
        total_views: number;
        total_engagement: number;
        total_spent: number;
        total_creators: number;
        campaigns: Array<Campaign & { 
            views: number;
            engagement: number;
            creators: number;
            posts: number;
        }>;
    }> {
        try {
            // Get all brand campaigns
            const { data: campaigns, error: campaignsError } = await this.supabase
                .from('campaigns')
                .select('*')
                .eq('brand_id', brandId)
                .order('created_at', { ascending: false });

            if (campaignsError) throw campaignsError;

            let totalViews = 0;
            let totalEngagement = 0;
            let totalSpent = 0;
            let totalCreators = 0;
            
            // Enhanced campaign data
            const enhancedCampaigns = campaigns.map(campaign => {
                const views = campaign.metrics?.views || 0;
                const engagement = campaign.metrics?.engagement || 0;
                const creators = campaign.metrics?.creators_joined || 0;
                const posts = campaign.metrics?.posts_approved || 0;
                
                totalViews += views;
                totalEngagement += engagement;
                totalSpent += parseFloat(campaign.spent) || 0;
                totalCreators += creators;
                
                return {
                    ...campaign,
                    views,
                    engagement,
                    creators,
                    posts
                };
            });

            return {
                total_campaigns: campaigns.length,
                active_campaigns: campaigns.filter(c => c.status === 'active').length,
                completed_campaigns: campaigns.filter(c => c.status === 'completed').length,
                total_views: totalViews,
                total_engagement: totalEngagement,
                total_spent: totalSpent,
                total_creators: totalCreators,
                campaigns: enhancedCampaigns
            };
        } catch (error) {
            console.error('Error fetching brand campaigns analytics:', error);
            throw error;
        }
    }

    /**
     * Generate performance report for a completed campaign
     */
    async generateCampaignReport(campaignId: string): Promise<{
        campaign: Campaign;
        analytics: CampaignAnalytics;
        roi_analysis: {
            cost_per_view: number;
            cost_per_engagement: number;
            platform_comparison: Array<{
                platform: string;
                performance_index: number;
                recommendation: string;
            }>;
        };
    }> {
        try {
            // Get campaign
            const { data: campaign, error: campaignError } = await this.supabase
                .from('campaigns')
                .select('*')
                .eq('id', campaignId)
                .single();

            if (campaignError) throw campaignError;
            
            // Get analytics
            const analytics = await this.getCampaignAnalytics(campaignId);
            
            // Calculate ROI metrics
            const spent = parseFloat(campaign.spent) || 0;
            const costPerView = spent > 0 && analytics.views > 0 
                ? spent / analytics.views 
                : 0;
                
            const costPerEngagement = spent > 0 && analytics.engagement > 0 
                ? spent / analytics.engagement 
                : 0;
            
            // Platform comparison
            const platformComparison = Object.entries(analytics.performance_by_platform).map(([platform, data]) => {
                const platformSpent = data.spent || 0;
                const platformViews = data.views || 0;
                const platformEngagement = data.engagement || 0;
                
                // Calculate performance index (higher is better)
                const performanceIndex = platformSpent > 0 
                    ? ((platformViews * 0.7) + (platformEngagement * 0.3)) / platformSpent 
                    : 0;
                
                // Generate recommendation
                let recommendation = '';
                if (performanceIndex > 1.2) {
                    recommendation = `Strong performance on ${platform}. Increase budget allocation in future campaigns.`;
                } else if (performanceIndex >= 0.8) {
                    recommendation = `Average performance on ${platform}. Maintain similar budget allocation.`;
                } else {
                    recommendation = `Below average performance on ${platform}. Consider reducing budget or improving content strategy.`;
                }
                
                return {
                    platform,
                    performance_index: performanceIndex,
                    recommendation
                };
            });
            
            return {
                campaign,
                analytics,
                roi_analysis: {
                    cost_per_view: costPerView,
                    cost_per_engagement: costPerEngagement,
                    platform_comparison: platformComparison
                }
            };
        } catch (error) {
            console.error('Error generating campaign report:', error);
            throw error;
        }
    }
} 