// ============================================================================
// UNIVERSAL SCRAPING AGENT
// Scrapes ALL accessible sources for car reputation data
// ============================================================================

import {
  scrapeDuckDuckGo,
  scrapeGoogleSearch,
  scrapeOldReddit,
  scrapeAutoevolution,
  scrapeEdmunds,
  scrapeKbb,
  scrapeMoroccanForums,
  scrapeWithFirecrawl,
  scrapeAutoscout24,
  type ScrapedItem,
} from './scrapers';
import { searchYouTubeVideos, extractVideoSentiment } from './youtube';
import { classifyBatch } from './classifier';
import {
  findVehicleByMakeModel,
  insertSocialReview,
  updateVehicleReputation,
} from './db';

// --- Priority models for Moroccan market ---
export const PRIORITY_MODELS = [
  { make: 'Dacia', model: 'Sandero' },
  { make: 'Dacia', model: 'Logan' },
  { make: 'Dacia', model: 'Duster' },
  { make: 'Renault', model: 'Clio' },
  { make: 'Renault', model: 'Captur' },
  { make: 'Renault', model: 'Megane' },
  { make: 'Peugeot', model: '208' },
  { make: 'Peugeot', model: '2008' },
  { make: 'Peugeot', model: '3008' },
  { make: 'Toyota', model: 'Yaris' },
  { make: 'Toyota', model: 'Corolla' },
  { make: 'Toyota', model: 'RAV4' },
  { make: 'Hyundai', model: 'Tucson' },
  { make: 'Hyundai', model: 'i20' },
  { make: 'Kia', model: 'Sportage' },
  { make: 'Kia', model: 'Picanto' },
  { make: 'Volkswagen', model: 'Golf' },
  { make: 'Volkswagen', model: 'Polo' },
  { make: 'BMW', model: 'Série 3' },
  { make: 'Mercedes', model: 'Classe A' },
  { make: 'BYD', model: 'Atto 3' },
  { make: 'MG', model: 'ZS EV' },
];

interface ScrapeResult {
  source: string;
  items: number;
  stored: number;
  errors: string[];
}

/**
 * Scrape ALL sources for a specific car model.
 * Returns items stored in database.
 */
export async function scrapeAllSources(
  make: string,
  model: string
): Promise<{ total: number; bySource: ScrapeResult[] }> {
  const query = `${make} ${model}`;
  const allItems: ScrapedItem[] = [];
  const results: ScrapeResult[] = [];
  const errors: string[] = [];

  // === 1. DuckDuckGo (works from anywhere) ===
  try {
    const items = await scrapeDuckDuckGo(`${query} review avis`, 10);
    results.push({ source: 'duckduckgo', items: items.length, stored: 0, errors: [] });
    allItems.push(...items);
  } catch (err) {
    errors.push(`duckduckgo: ${(err as Error).message}`);
  }

  // === 2. Google Search ===
  try {
    const items = await scrapeGoogleSearch(`${make} ${model} review verdict`, 10);
    results.push({ source: 'google', items: items.length, stored: 0, errors: [] });
    allItems.push(...items);
  } catch (err) {
    errors.push(`google: ${(err as Error).message}`);
  }

  // === 3. Old Reddit ===
  try {
    const items = await scrapeOldReddit(query, ['cars', 'whatcarshouldIbuy'], 10);
    results.push({ source: 'reddit', items: items.length, stored: 0, errors: [] });
    allItems.push(...items);
  } catch (err) {
    errors.push(`reddit: ${(err as Error).message}`);
  }

  // === 4. Car Review Sites ===
  const reviewSites = [
    { fn: scrapeAutoevolution, name: 'autoevolution' },
    { fn: scrapeEdmunds, name: 'edmunds' },
    { fn: scrapeKbb, name: 'kbb' },
  ];
  for (const site of reviewSites) {
    try {
      const items = await site.fn(make, model);
      results.push({ source: site.name, items: items.length, stored: 0, errors: [] });
      allItems.push(...items);
      await new Promise(r => setTimeout(r, 1500)); // Rate limit
    } catch (err) {
      errors.push(`${site.name}: ${(err as Error).message}`);
    }
  }

  // === 5. Moroccan Sites ===
  try {
    const items = await scrapeMoroccanForums(make, model);
    results.push({ source: 'moroccan_sites', items: items.length, stored: 0, errors: [] });
    allItems.push(...items);
  } catch (err) {
    errors.push(`moroccan: ${(err as Error).message}`);
  }

  // === 6. AutoScout24 ===
  try {
    const items = await scrapeAutoscout24(make, model);
    results.push({ source: 'autoscout24', items: items.length, stored: 0, errors: [] });
    allItems.push(...items);
  } catch (err) {
    errors.push(`autoscout24: ${(err as Error).message}`);
  }

  // === 7. YouTube (needs API key) ===
  if (process.env.YOUTUBE_API_KEY) {
    try {
      const queries = [`${make} ${model} review`, `${make} ${model} avis`, `${make} ${model} test`];
      for (const q of queries) {
        const videos = await searchYouTubeVideos(q, 5);
        for (const v of videos) {
          const sentiment = extractVideoSentiment(v);
          allItems.push({
            source: 'youtube',
            platform: 'youtube',
            url: v.url,
            title: v.title,
            body: v.description.slice(0, 2000),
            author: v.channelTitle,
            rating: sentiment.rating,
            likes: v.likeCount,
            views: v.viewCount,
            comments: v.commentCount,
            publishedAt: new Date(v.publishedAt),
          });
        }
        await new Promise(r => setTimeout(r, 1500));
      }
      const ytCount = allItems.filter(i => i.source === 'youtube').length;
      results.push({ source: 'youtube', items: ytCount, stored: 0, errors: [] });
    } catch (err) {
      errors.push(`youtube: ${(err as Error).message}`);
    }
  }

  // === 8. Firecrawl (if API key available) ===
  if (process.env.FIRECRAWL_API_KEY) {
    try {
      const firecrawlUrls = [
        `https://www.autoevolution.com/${make.toLowerCase()}/${model.toLowerCase()}/`,
        `https://www.edmunds.com/${make.toLowerCase()}/${model.toLowerCase()}/`,
      ];
      for (const url of firecrawlUrls) {
        const item = await scrapeWithFirecrawl(url);
        if (item) {
          results.push({ source: 'firecrawl', items: 1, stored: 0, errors: [] });
          allItems.push(item);
        }
        await new Promise(r => setTimeout(r, 2000));
      }
    } catch (err) {
      errors.push(`firecrawl: ${(err as Error).message}`);
    }
  }

  // === Store in Supabase ===
  const vehicleId = await findVehicleByMakeModel(make, model);
  if (!vehicleId) {
    return { total: 0, bySource: results };
  }

  // Deduplicate by URL + title
  const seen = new Set<string>();
  const uniqueItems = allItems.filter(item => {
    const key = `${item.url}_${item.title}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  // Classify sentiment for all items (batch, skip if too many to avoid timeout)
  const toClassify = uniqueItems.length <= 20
    ? uniqueItems
        .filter(item => item.body.length > 20 || item.title.length > 10)
        .map((item, idx) => ({
          text: `${item.title} ${item.body}`.slice(0, 1000),
          id: `${vehicleId}_${idx}`,
        }))
    : [];

  const sentiments = toClassify.length > 0
    ? await classifyBatch(toClassify, { make, model })
    : new Map();

  // Store each item
  let totalStored = 0;
  for (let i = 0; i < uniqueItems.length; i++) {
    const item = uniqueItems[i];
    const sentimentKey = `${vehicleId}_${i}`;
    const sentiment = sentiments.get(sentimentKey);

    const rating = item.rating || inferRating(item);
    const sentimentLabel = sentiment?.sentiment || inferSentiment(rating);

    // Use source + vehicle + index as unique ID (avoids cross-model dedup)
    const platformId = `${item.source}_${make}_${model}_${i}`.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 80);

    const stored = await insertSocialReview({
      vehicle_id: vehicleId,
      platform: item.platform as 'youtube' | 'reddit' | 'firecrawl' | 'duckduckgo',
      platform_id: platformId,
      author_name: item.author,
      title: item.title.slice(0, 500),
      body: item.body.slice(0, 2000),
      url: item.url,
      rating,
      likes: item.likes || 0,
      views: item.views || 0,
      comments_count: item.comments || 0,
      published_at: item.publishedAt || new Date(),
      sentiment: sentimentLabel,
      sentiment_score: sentiment?.score || 0.5,
      language: sentiment?.language || 'en',
    });

    if (stored) {
      totalStored++;
      // Update result counter
      const r = results.find(r => r.source === item.source);
      if (r) r.stored++;
    }
  }

  // Update vehicle reputation score
  if (totalStored > 0) {
    await updateVehicleReputation(vehicleId);
  }

  return { total: totalStored, bySource: results };
}

function inferRating(item: ScrapedItem): number {
  if (item.rating) return item.rating;
  const text = `${item.title} ${item.body}`.toLowerCase();
  const positive = ['excellent', 'great', 'best', 'love', 'perfect', 'recommend', 'bien', 'excellent', 'fiable'].filter(w => text.includes(w)).length;
  const negative = ['bad', 'terrible', 'worst', 'problem', 'nul', 'mauvais', 'problème'].filter(w => text.includes(w)).length;
  if (positive > negative) return 7 + Math.min(positive - negative, 2);
  if (negative > positive) return 3 - Math.min(negative - positive, 2);
  return 5;
}

function inferSentiment(rating: number): 'positive' | 'neutral' | 'negative' {
  if (rating >= 7) return 'positive';
  if (rating <= 4) return 'negative';
  return 'neutral';
}

/**
 * Run full scraping agent for ALL priority models.
 */
export async function runFullAgent(): Promise<{
  modelsProcessed: number;
  totalStored: number;
  byModel: { make: string; model: string; stored: number; sources: string }[];
}> {
  const byModel: { make: string; model: string; stored: number; sources: string }[] = [];
  let totalStored = 0;

  for (const { make, model } of PRIORITY_MODELS) {
    console.log(`[agent] Scraping ${make} ${model}...`);
    try {
      const result = await scrapeAllSources(make, model);
      totalStored += result.total;
      const sourceList = result.bySource
        .filter(s => s.stored > 0)
        .map(s => `${s.source}:${s.stored}`)
        .join(', ');
      byModel.push({ make, model, stored: result.total, sources: sourceList || 'none' });
      console.log(`[agent]   → ${result.total} items stored (${sourceList || 'no data'})`);
    } catch (err) {
      console.error(`[agent]   → ERROR: ${(err as Error).message}`);
      byModel.push({ make, model, stored: 0, sources: `error: ${(err as Error).message}` });
    }
  }

  return { modelsProcessed: PRIORITY_MODELS.length, totalStored, byModel };
}
