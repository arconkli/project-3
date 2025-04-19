import { supabase } from '@/lib/supabaseClient';
import * as apis from '@/lib/apis';
import type { Campaign } from '@/types/brand';

interface ContentCheck {
  platform: string;
  postId: string;
  hashtags: string[];
  campaignId: string;
  creatorId: string;
}

export class ContentMonitor {
  private checkInterval: NodeJS.Timeout | null = null;
  private readonly INTERVAL_MS = Number(import.meta.env.VITE_CONTENT_CHECK_INTERVAL) || 300000;

  async start() {
    // Initial check
    await this.checkAllPlatforms();
    
    // Set up interval for regular checks
    this.checkInterval = setInterval(() => {
      this.checkAllPlatforms();
    }, this.INTERVAL_MS);
  }

  stop() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  private async checkAllPlatforms() {
    try {
      // Get all active campaigns and their hashtags
      const { data: campaigns, error } = await supabase
        .from('brand_campaigns')
        .select('*')
        .eq('status', 'active');

      if (error) throw error;

      // Get all connected creator accounts
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, platforms');

      if (!profiles) return;

      // Check each platform for each creator
      for (const profile of profiles) {
        if (profile.platforms) {
          await this.checkInstagramPosts(profile.id, campaigns);
          await this.checkTikTokPosts(profile.id, campaigns);
          await this.checkYouTubePosts(profile.id, campaigns);
          await this.checkTwitterPosts(profile.id, campaigns);
        }
      }
    } catch (error) {
      console.error('Error in content monitoring:', error);
    }
  }

  private async checkInstagramPosts(creatorId: string, campaigns: Campaign[]) {
    try {
      const { data: account } = await supabase
        .from('profiles')
        .select('platforms->instagram')
        .eq('id', creatorId)
        .single();

      if (!account?.instagram) return;

      // Get recent posts
      const posts = await apis.getInstagramPostStats(account.instagram.userId);
      
      // Check each post for campaign hashtags
      for (const post of posts) {
        const matchingCampaign = this.findMatchingCampaign(post.hashtags, campaigns);
        if (matchingCampaign) {
          await this.saveContentReview({
            platform: 'instagram',
            postId: post.id,
            hashtags: post.hashtags,
            campaignId: matchingCampaign.id,
            creatorId
          });
        }
      }
    } catch (error) {
      console.error('Error checking Instagram posts:', error);
    }
  }

  private async checkTikTokPosts(creatorId: string, campaigns: Campaign[]) {
    try {
      const { data: account } = await supabase
        .from('profiles')
        .select('platforms->tiktok')
        .eq('id', creatorId)
        .single();

      if (!account?.tiktok) return;

      // Get recent posts
      const posts = await apis.getTikTokVideoStats(account.tiktok.accessToken, account.tiktok.userId);
      
      // Check each post for campaign hashtags
      for (const post of posts) {
        const matchingCampaign = this.findMatchingCampaign(post.hashtags, campaigns);
        if (matchingCampaign) {
          await this.saveContentReview({
            platform: 'tiktok',
            postId: post.id,
            hashtags: post.hashtags,
            campaignId: matchingCampaign.id,
            creatorId
          });
        }
      }
    } catch (error) {
      console.error('Error checking TikTok posts:', error);
    }
  }

  private async checkYouTubePosts(creatorId: string, campaigns: Campaign[]) {
    try {
      const { data: account } = await supabase
        .from('profiles')
        .select('platforms->youtube')
        .eq('id', creatorId)
        .single();

      if (!account?.youtube) return;

      // Get recent videos
      const videos = await apis.getYouTubeVideoStats(account.youtube.channelId, account.youtube.accessToken);
      
      // Check each video for campaign hashtags
      for (const video of videos) {
        const matchingCampaign = this.findMatchingCampaign(video.hashtags, campaigns);
        if (matchingCampaign) {
          await this.saveContentReview({
            platform: 'youtube',
            postId: video.id,
            hashtags: video.hashtags,
            campaignId: matchingCampaign.id,
            creatorId
          });
        }
      }
    } catch (error) {
      console.error('Error checking YouTube posts:', error);
    }
  }

  private async checkTwitterPosts(creatorId: string, campaigns: Campaign[]) {
    try {
      const { data: account } = await supabase
        .from('profiles')
        .select('platforms->twitter')
        .eq('id', creatorId)
        .single();

      if (!account?.twitter) return;

      // Get recent tweets
      const tweets = await apis.getTwitterTweetStats(account.twitter.accessToken, account.twitter.userId);
      
      // Check each tweet for campaign hashtags
      for (const tweet of tweets) {
        const matchingCampaign = this.findMatchingCampaign(tweet.hashtags, campaigns);
        if (matchingCampaign) {
          await this.saveContentReview({
            platform: 'twitter',
            postId: tweet.id,
            hashtags: tweet.hashtags,
            campaignId: matchingCampaign.id,
            creatorId
          });
        }
      }
    } catch (error) {
      console.error('Error checking Twitter posts:', error);
    }
  }

  private findMatchingCampaign(postHashtags: string[], campaigns: Campaign[]) {
    return campaigns.find(campaign => {
      const campaignHashtags = [
        campaign.requirements.hashtags?.original,
        campaign.requirements.hashtags?.repurposed
      ].filter(Boolean);

      return campaignHashtags.some(tag => 
        postHashtags.includes(tag.toLowerCase())
      );
    });
  }

  private async saveContentReview(check: ContentCheck) {
    try {
      // Check if we already have this post
      const { data: existing } = await supabase
        .from('content_reviews')
        .select('id')
        .eq('post_id', check.postId)
        .single();

      if (existing) return; // Skip if already exists

      // Save new content review
      const { error } = await supabase
        .from('content_reviews')
        .insert({
          post_id: check.postId,
          campaign_id: check.campaignId,
          creator_id: check.creatorId,
          platform: check.platform,
          status: 'pending',
          review_priority: 'normal'
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error saving content review:', error);
    }
  }
}

// Export singleton instance
export const contentMonitor = new ContentMonitor();