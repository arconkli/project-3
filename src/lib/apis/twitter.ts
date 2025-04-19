import { TwitterApi } from 'twitter-api-v2';

export const initializeTwitterAPI = (
  apiKey: string,
  apiSecret: string,
  accessToken: string,
  accessSecret: string
) => {
  return new TwitterApi({
    appKey: apiKey,
    appSecret: apiSecret,
    accessToken: accessToken,
    accessSecret: accessSecret,
  });
};

export const getTwitterUserStats = async (client: TwitterApi, username: string) => {
  try {
    const user = await client.v2.userByUsername(username, {
      'user.fields': [
        'public_metrics',
        'verified',
        'description',
        'created_at',
        'location',
        'profile_image_url'
      ]
    });

    return {
      followers: user.data.public_metrics?.followers_count,
      following: user.data.public_metrics?.following_count,
      tweets: user.data.public_metrics?.tweet_count,
      listed: user.data.public_metrics?.listed_count,
      isVerified: user.data.verified,
      bio: user.data.description,
      joinDate: user.data.created_at,
      location: user.data.location,
      profileImage: user.data.profile_image_url
    };
  } catch (error) {
    console.error('Error fetching Twitter user stats:', error);
    throw error;
  }
};

export const getTwitterTweetStats = async (client: TwitterApi, tweetId: string) => {
  try {
    const tweet = await client.v2.singleTweet(tweetId, {
      'tweet.fields': [
        'public_metrics',
        'created_at',
        'entities',
        'attachments',
        'conversation_id'
      ]
    });

    return {
      likes: tweet.data.public_metrics?.like_count,
      retweets: tweet.data.public_metrics?.retweet_count,
      replies: tweet.data.public_metrics?.reply_count,
      quotes: tweet.data.public_metrics?.quote_count,
      impressions: tweet.data.public_metrics?.impression_count,
      createdAt: tweet.data.created_at,
      entities: tweet.data.entities,
      hasMedia: !!tweet.data.attachments?.media_keys?.length
    };
  } catch (error) {
    console.error('Error fetching Twitter tweet stats:', error);
    throw error;
  }
};

export const getTwitterAnalytics = async (client: TwitterApi, userId: string) => {
  try {
    // Note: Twitter API v2 requires Elevated access for analytics
    const metrics = await client.v2.userTweets(userId, {
      'tweet.fields': ['public_metrics', 'created_at'],
      max_results: 100
    });

    const tweets = metrics.data || [];
    const totalEngagement = tweets.reduce((sum, tweet) => {
      const metrics = tweet.public_metrics || {};
      return sum + (
        (metrics.like_count || 0) +
        (metrics.retweet_count || 0) +
        (metrics.reply_count || 0) +
        (metrics.quote_count || 0)
      );
    }, 0);

    return {
      totalTweets: tweets.length,
      totalEngagement,
      avgEngagementPerTweet: totalEngagement / (tweets.length || 1),
      tweetHistory: tweets.map(tweet => ({
        id: tweet.id,
        metrics: tweet.public_metrics,
        createdAt: tweet.created_at
      }))
    };
  } catch (error) {
    console.error('Error fetching Twitter analytics:', error);
    throw error;
  }
};