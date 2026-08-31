import type { RedditPost } from './types';

const REDDIT_BASE = 'https://www.reddit.com';

/**
 * Search Reddit for car discussions.
 * Uses the public JSON API (no auth required for read-only).
 */
export async function searchRedditPosts(
  query: string,
  subreddits: string[] = ['cars', 'whatcarshouldIbuy', 'Morocco'],
  maxResults = 20
): Promise<RedditPost[]> {
  const allPosts: RedditPost[] = [];
  
  for (const sub of subreddits) {
    try {
      const params = new URLSearchParams({
        q: query,
        restrict_sr: '1',
        sort: 'relevance',
        t: 'year',
        limit: String(Math.min(maxResults, 100)),
      });
      
      const res = await fetch(`${REDDIT_BASE}/r/${sub}/search.json?${params}`, {
        headers: {
          'User-Agent': 'ThiqtiBot/1.0 (car assistant; +https://thiqti.vercel.app)',
        },
      });
      
      if (!res.ok) {
        console.warn(`[reddit] r/${sub} search failed: ${res.status}`);
        continue;
      }
      
      const data = await res.json();
      const posts = (data?.data?.children || [])
        .filter((child: { kind: string }) => child.kind === 't3')
        .map((child: { data: { id: string; title: string; selftext: string; author: string; subreddit: string; score: number; num_comments: number; permalink: string; url: string; created_utc: number } }) => {
          const d = child.data;
          return {
            id: d.id,
            title: d.title,
            selftext: d.selftext || '',
            author: d.author,
            authorUrl: `https://www.reddit.com/user/${d.author}`,
            subreddit: d.subreddit,
            score: d.score || 0,
            numComments: d.num_comments || 0,
            url: `https://www.reddit.com${d.permalink}`,
            permalink: d.permalink,
            createdUtc: d.created_utc || 0,
          };
        });
      
      allPosts.push(...posts);
      
      // Rate limit: 1 req/sec for unauthenticated
      await new Promise(r => setTimeout(r, 1200));
    } catch (err) {
      console.error(`[reddit] r/${sub} error:`, (err as Error).message);
    }
  }
  
  // Deduplicate by id
  const seen = new Set<string>();
  return allPosts.filter(p => {
    if (seen.has(p.id)) return false;
    seen.add(p.id);
    return true;
  }).slice(0, maxResults);
}

/**
 * Extract sentiment hints from Reddit post.
 */
export function extractRedditSentiment(post: RedditPost): { rating: number; positive: boolean } {
  const text = `${post.title} ${post.selftext}`.toLowerCase();
  
  const positiveWords = ['love', 'great', 'best', 'perfect', 'recommend', 'happy', 'satisfied', 'excellent', 'amazing', 'solid', 'reliable', 'bon', 'bien', 'excellent', 'fiable', 'satisfait'];
  const negativeWords = ['hate', 'worst', 'terrible', 'problem', 'issue', 'broken', 'regret', 'avoid', 'bad', 'awful', 'problème', 'défaut', 'panne', 'nul', 'mauvais', 'évitez'];
  
  const positiveCount = positiveWords.filter(w => text.includes(w)).length;
  const negativeCount = negativeWords.filter(w => text.includes(w)).length;
  
  // Reddit score ratio (upvotes)
  let rating = 5;
  if (positiveCount > negativeCount) rating = 7 + Math.min(positiveCount - negativeCount, 2);
  else if (negativeCount > positiveCount) rating = 3 - Math.min(negativeCount - positiveCount, 2);
  
  // Adjust by score
  if (post.score > 50) rating += 0.5;
  if (post.score < -5) rating -= 0.5;
  
  return {
    rating: Math.max(0, Math.min(10, rating)),
    positive: rating >= 6,
  };
}
