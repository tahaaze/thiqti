import type { YouTubeVideo } from './types';

const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3';

/**
 * Search YouTube for car review videos.
 * Requires YOUTUBE_API_KEY env var.
 */
export async function searchYouTubeVideos(
  query: string,
  maxResults = 10
): Promise<YouTubeVideo[]> {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    console.warn('[youtube] YOUTUBE_API_KEY not set, skipping');
    return [];
  }

  const params = new URLSearchParams({
    part: 'snippet',
    q: query,
    type: 'video',
    order: 'relevance',
    maxResults: String(Math.min(maxResults, 50)),
    key: apiKey,
  });

  try {
    const searchRes = await fetch(`${YOUTUBE_API_BASE}/search?${params}`);
    if (!searchRes.ok) {
      console.error('[youtube] Search failed:', searchRes.status, await searchRes.text());
      return [];
    }
    const searchData = await searchRes.json();
    const videoIds = (searchData.items || []).map((item: { id: { videoId: string } }) => item.id.videoId).filter(Boolean);

    if (videoIds.length === 0) return [];

    // Get video details (view count, like count, etc.)
    const detailsParams = new URLSearchParams({
      part: 'statistics,contentDetails',
      id: videoIds.join(','),
      key: apiKey,
    });
    const detailsRes = await fetch(`${YOUTUBE_API_BASE}/videos?${detailsParams}`);
    if (!detailsRes.ok) return [];
    const detailsData = await detailsRes.json();

    const detailsMap = new Map<string, { viewCount: string; likeCount: string; commentCount: string; duration: string }>();
    for (const item of detailsData.items || []) {
      detailsMap.set(item.id, {
        viewCount: item.statistics?.viewCount || '0',
        likeCount: item.statistics?.likeCount || '0',
        commentCount: item.statistics?.commentCount || '0',
        duration: item.contentDetails?.duration || '',
      });
    }

    return (searchData.items || []).map((item: { id: { videoId: string }; snippet: { title: string; description: string; channelTitle: string; channelId: string; publishedAt: string; thumbnails: Record<string, { url: string }> } }) => {
      const videoId = item.id.videoId;
      const snippet = item.snippet;
      const stats = detailsMap.get(videoId);
      return {
        id: videoId,
        title: snippet.title,
        description: snippet.description,
        channelTitle: snippet.channelTitle,
        channelUrl: `https://www.youtube.com/channel/${snippet.channelId}`,
        publishedAt: snippet.publishedAt,
        viewCount: parseInt(stats?.viewCount || '0'),
        likeCount: parseInt(stats?.likeCount || '0'),
        commentCount: parseInt(stats?.commentCount || '0'),
        thumbnailUrl: snippet.thumbnails?.high?.url || snippet.thumbnails?.default?.url || '',
        url: `https://www.youtube.com/watch?v=${videoId}`,
      };
    });
  } catch (err) {
    console.error('[youtube] Error:', (err as Error).message);
    return [];
  }
}

/**
 * Extract review sentiment hints from YouTube video metadata.
 */
export function extractVideoSentiment(video: YouTubeVideo): { rating: number; positive: boolean } {
  const text = `${video.title} ${video.description}`.toLowerCase();
  
  const positiveWords = ['best', 'great', 'excellent', 'amazing', 'love', 'perfect', 'recommend', 'awesome', 'superb', 'fantastic', 'review', 'test', 'essai', 'excellent', 'parfait', 'recommande'];
  const negativeWords = ['bad', 'terrible', 'awful', 'worst', 'problem', 'issue', 'fail', 'broken', 'disappointing', 'overpriced', 'problème', 'défaut', 'panne', 'casse', 'nul', 'mauvais'];
  
  const positiveCount = positiveWords.filter(w => text.includes(w)).length;
  const negativeCount = negativeWords.filter(w => text.includes(w)).length;
  
  const likesRatio = video.viewCount > 0 ? video.likeCount / video.viewCount : 0.5;
  
  let rating = 5;
  if (positiveCount > negativeCount) rating = 7 + Math.min(positiveCount - negativeCount, 3);
  else if (negativeCount > positiveCount) rating = 3 - Math.min(negativeCount - positiveCount, 2);
  
  // Adjust by engagement
  if (likesRatio > 0.05) rating += 0.5;
  if (likesRatio < 0.01) rating -= 0.5;
  
  return {
    rating: Math.max(0, Math.min(10, rating)),
    positive: rating >= 6,
  };
}
