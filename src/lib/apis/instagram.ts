import { IgApiClient } from 'instagram-private-api';

const ig = new IgApiClient();

export const initializeInstagramAPI = async (username: string, password: string) => {
  ig.state.generateDevice(username);
  await ig.account.login(username, password);
  return ig;
};

export const getInstagramUserStats = async (username: string) => {
  try {
    const user = await ig.user.searchExact(username);
    const userInfo = await ig.user.info(user.pk);
    
    return {
      followers: userInfo.follower_count,
      following: userInfo.following_count,
      posts: userInfo.media_count,
      engagement: userInfo.mutual_followers_count,
      biography: userInfo.biography,
      isVerified: userInfo.is_verified,
      isPrivate: userInfo.is_private,
      profilePicture: userInfo.profile_pic_url
    };
  } catch (error) {
    console.error('Error fetching Instagram stats:', error);
    throw error;
  }
};

export const getInstagramPostStats = async (mediaId: string) => {
  try {
    const mediaInfo = await ig.media.info(mediaId);
    
    return {
      likes: mediaInfo.like_count,
      comments: mediaInfo.comment_count,
      views: mediaInfo.view_count,
      engagement: mediaInfo.engagement,
      saves: mediaInfo.saved_count,
      shares: mediaInfo.share_count,
      impressions: mediaInfo.impression_count,
      reach: mediaInfo.reach_count
    };
  } catch (error) {
    console.error('Error fetching Instagram post stats:', error);
    throw error;
  }
};

export const getInstagramInsights = async (userId: string) => {
  try {
    const insights = await ig.insights.userStory(userId);
    
    return {
      impressions: insights.impressions,
      reach: insights.reach,
      profileViews: insights.profile_views,
      websiteClicks: insights.website_clicks,
      followersGained: insights.follower_delta,
      audienceGenderAge: insights.gender_age,
      audienceLocations: insights.locations
    };
  } catch (error) {
    console.error('Error fetching Instagram insights:', error);
    throw error;
  }
};