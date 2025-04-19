import { google } from 'googleapis';

const youtube = google.youtube('v3');

export const initializeYouTubeAPI = (apiKey: string) => {
  return google.youtube({
    version: 'v3',
    auth: apiKey
  });
};

export const getYouTubeChannelStats = async (channelId: string, auth: string) => {
  try {
    const response = await youtube.channels.list({
      auth,
      part: ['statistics', 'snippet', 'contentDetails'],
      id: [channelId]
    });

    const channel = response.data.items?.[0];
    if (!channel) throw new Error('Channel not found');

    return {
      subscribers: channel.statistics?.subscriberCount,
      views: channel.statistics?.viewCount,
      videos: channel.statistics?.videoCount,
      country: channel.snippet?.country,
      joinDate: channel.snippet?.publishedAt,
      playlists: channel.contentDetails?.relatedPlaylists,
      description: channel.snippet?.description,
      thumbnails: channel.snippet?.thumbnails
    };
  } catch (error) {
    console.error('Error fetching YouTube channel stats:', error);
    throw error;
  }
};

export const getYouTubeVideoStats = async (videoId: string, auth: string) => {
  try {
    const response = await youtube.videos.list({
      auth,
      part: ['statistics', 'contentDetails', 'liveStreamingDetails'],
      id: [videoId]
    });

    const video = response.data.items?.[0];
    if (!video) throw new Error('Video not found');

    return {
      views: video.statistics?.viewCount,
      likes: video.statistics?.likeCount,
      comments: video.statistics?.commentCount,
      duration: video.contentDetails?.duration,
      definition: video.contentDetails?.definition,
      dimension: video.contentDetails?.dimension,
      caption: video.contentDetails?.caption === 'true',
      concurrentViewers: video.liveStreamingDetails?.concurrentViewers
    };
  } catch (error) {
    console.error('Error fetching YouTube video stats:', error);
    throw error;
  }
};

export const getYouTubeAnalytics = async (channelId: string, auth: string) => {
  try {
    const analytics = google.youtubeAnalytics('v2');
    
    const response = await analytics.reports.query({
      auth,
      ids: `channel==${channelId}`,
      startDate: '30daysAgo',
      endDate: 'today',
      metrics: 'views,estimatedMinutesWatched,averageViewDuration,subscribersGained',
      dimensions: 'day',
      sort: 'day'
    });

    return {
      viewTrends: response.data.rows,
      totalViews: response.data.rows?.reduce((sum, row) => sum + Number(row[1]), 0),
      watchTime: response.data.rows?.reduce((sum, row) => sum + Number(row[2]), 0),
      avgViewDuration: response.data.rows?.reduce((sum, row) => sum + Number(row[3]), 0) / (response.data.rows?.length || 1),
      subscribersGained: response.data.rows?.reduce((sum, row) => sum + Number(row[4]), 0)
    };
  } catch (error) {
    console.error('Error fetching YouTube analytics:', error);
    throw error;
  }
};