import type { YouTubeVideo, RedditPost } from './types';
import { createPipelineRun, completePipelineRun, findVehicleByMakeModel, insertSocialReview, updateVehicleReputation, updatePipelineLastRun } from './db';
import { searchYouTubeVideos, extractVideoSentiment } from './youtube';
import { searchRedditPosts, extractRedditSentiment } from './reddit';
import { scrapeCarReviewPages, extractReviewsFromMarkdown } from './firecrawl';
import { classifyBatch } from './classifier';

// --- Top 20 Moroccan car models to scrape reputation for ---
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
];

// --- YouTube Pipeline ---

export async function runYouTubePipeline(make: string, model: string): Promise<number> {
  const runId = await createPipelineRun({
    pipeline_type: 'reputation_youtube',
    source: 'youtube',
    status: 'running',
    items_found: 0,
    items_stored: 0,
  });

  const startTime = Date.now();
  let totalFound = 0;
  let totalStored = 0;

  try {
    // Find vehicle in DB
    const vehicleId = await findVehicleByMakeModel(make, model);
    if (!vehicleId) {
      await completePipelineRun(runId, 'completed', 0, 0, 'Vehicle not in DB');
      return 0;
    }

    // Search YouTube
    const queries = [
      `${make} ${model} review 2026`,
      `${make} ${model} avis`,
      `${make} ${model} problem issue`,
    ];

    const allVideos: YouTubeVideo[] = [];
    for (const query of queries) {
      const videos = await searchYouTubeVideos(query, 5);
      allVideos.push(...videos);
      await new Promise(r => setTimeout(r, 1000)); // Rate limit
    }

    // Deduplicate
    const seen = new Set<string>();
    const uniqueVideos = allVideos.filter(v => {
      if (seen.has(v.id)) return false;
      seen.add(v.id);
      return true;
    });

    totalFound = uniqueVideos.length;

    // Classify sentiment
    const reviews = uniqueVideos.map(v => ({
      text: `${v.title} ${v.description}`,
      id: v.id,
    }));
    const sentiments = await classifyBatch(reviews, { make, model });

    // Store in Supabase
    for (const video of uniqueVideos) {
      const sentiment = sentiments.get(video.id);
      const videoSentiment = extractVideoSentiment(video);
      
      const stored = await insertSocialReview({
        vehicle_id: vehicleId,
        platform: 'youtube',
        platform_id: video.id,
        author_name: video.channelTitle,
        author_url: video.channelUrl,
        title: video.title,
        body: video.description.slice(0, 2000),
        url: video.url,
        rating: sentiment?.sentiment === 'positive' ? videoSentiment.rating : sentiment?.sentiment === 'negative' ? videoSentiment.rating : videoSentiment.rating,
        likes: video.likeCount,
        views: video.viewCount,
        comments_count: video.commentCount,
        published_at: new Date(video.publishedAt),
        sentiment: sentiment?.sentiment || (videoSentiment.positive ? 'positive' : 'neutral'),
        sentiment_score: sentiment?.score || 0.5,
        language: sentiment?.language || 'en',
      });
      if (stored) totalStored++;
    }

    // Update vehicle reputation
    await updateVehicleReputation(vehicleId);
    await updatePipelineLastRun('reputation_youtube', 'youtube');
    
    await completePipelineRun(runId, 'completed', totalFound, totalStored, undefined, Date.now() - startTime);
  } catch (err) {
    await completePipelineRun(runId, 'failed', totalFound, totalStored, (err as Error).message, Date.now() - startTime);
  }

  return totalStored;
}

// --- Reddit Pipeline ---

export async function runRedditPipeline(make: string, model: string): Promise<number> {
  const runId = await createPipelineRun({
    pipeline_type: 'reputation_reddit',
    source: 'reddit',
    status: 'running',
    items_found: 0,
    items_stored: 0,
  });

  const startTime = Date.now();
  let totalFound = 0;
  let totalStored = 0;

  try {
    const vehicleId = await findVehicleByMakeModel(make, model);
    if (!vehicleId) {
      await completePipelineRun(runId, 'completed', 0, 0, 'Vehicle not in DB');
      return 0;
    }

    const queries = [
      `${make} ${model}`,
      `${make} ${model} review`,
      `${make} ${model} problem`,
    ];

    const allPosts: RedditPost[] = [];
    for (const query of queries) {
      const posts = await searchRedditPosts(query, ['cars', 'whatcarshouldIbuy'], 5);
      allPosts.push(...posts);
    }

    const seen = new Set<string>();
    const uniquePosts = allPosts.filter(p => {
      if (seen.has(p.id)) return false;
      seen.add(p.id);
      return true;
    });

    totalFound = uniquePosts.length;

    // Classify sentiment
    const reviews = uniquePosts.map(p => ({
      text: `${p.title} ${p.selftext}`.slice(0, 1000),
      id: p.id,
    }));
    const sentiments = await classifyBatch(reviews, { make, model });

    for (const post of uniquePosts) {
      const sentiment = sentiments.get(post.id);
      const redditSentiment = extractRedditSentiment(post);
      
      const stored = await insertSocialReview({
        vehicle_id: vehicleId,
        platform: 'reddit',
        platform_id: post.id,
        author_name: post.author,
        author_url: post.authorUrl,
        title: post.title,
        body: post.selftext.slice(0, 2000),
        url: post.url,
        rating: redditSentiment.rating,
        likes: post.score,
        comments_count: post.numComments,
        published_at: new Date(post.createdUtc * 1000),
        sentiment: sentiment?.sentiment || (redditSentiment.positive ? 'positive' : 'neutral'),
        sentiment_score: sentiment?.score || 0.5,
        language: sentiment?.language || 'en',
      });
      if (stored) totalStored++;
    }

    await updateVehicleReputation(vehicleId);
    await updatePipelineLastRun('reputation_reddit', 'reddit');
    
    await completePipelineRun(runId, 'completed', totalFound, totalStored, undefined, Date.now() - startTime);
  } catch (err) {
    await completePipelineRun(runId, 'failed', totalFound, totalStored, (err as Error).message, Date.now() - startTime);
  }

  return totalStored;
}

// --- Firecrawl Pipeline ---

export async function runFirecrawlPipeline(make: string, model: string): Promise<number> {
  const runId = await createPipelineRun({
    pipeline_type: 'reputation_firecrawl',
    source: 'firecrawl',
    status: 'running',
    items_found: 0,
    items_stored: 0,
  });

  const startTime = Date.now();
  let totalFound = 0;
  let totalStored = 0;

  try {
    const vehicleId = await findVehicleByMakeModel(make, model);
    if (!vehicleId) {
      await completePipelineRun(runId, 'completed', 0, 0, 'Vehicle not in DB');
      return 0;
    }

    const pages = await scrapeCarReviewPages(make, model, 2);
    const extractedReviews: { text: string; id: string }[] = [];

    for (const page of pages) {
      const reviews = extractReviewsFromMarkdown(page.markdown);
      for (const r of reviews) {
        extractedReviews.push({ text: r.text, id: `${vehicleId}_${page.url}_${extractedReviews.length}` });
      }
    }

    totalFound = extractedReviews.length;

    if (extractedReviews.length > 0) {
      const sentiments = await classifyBatch(extractedReviews, { make, model });

      for (const review of extractedReviews) {
        const sentiment = sentiments.get(review.id);
        const stored = await insertSocialReview({
          vehicle_id: vehicleId,
          platform: 'firecrawl',
          platform_id: review.id,
          title: `Review from web`,
          body: review.text,
          url: pages[0]?.url || '',
          sentiment: sentiment?.sentiment || 'neutral',
          sentiment_score: sentiment?.score || 0.5,
          language: sentiment?.language || 'en',
        });
        if (stored) totalStored++;
      }
    }

    await updateVehicleReputation(vehicleId);
    await updatePipelineLastRun('reputation_firecrawl', 'firecrawl');
    
    await completePipelineRun(runId, 'completed', totalFound, totalStored, undefined, Date.now() - startTime);
  } catch (err) {
    await completePipelineRun(runId, 'failed', totalFound, totalStored, (err as Error).message, Date.now() - startTime);
  }

  return totalStored;
}

// --- Full Pipeline Run ---

export async function runFullReputationPipeline(models?: { make: string; model: string }[]): Promise<{
  youtube: number;
  reddit: number;
  firecrawl: number;
  modelsProcessed: number;
}> {
  const targetModels = models || PRIORITY_MODELS;
  let youtubeTotal = 0;
  let redditTotal = 0;
  let firecrawlTotal = 0;

  for (const { make, model } of targetModels) {
    console.log(`[pipeline] Processing ${make} ${model}...`);
    
    try {
      const yt = await runYouTubePipeline(make, model);
      youtubeTotal += yt;
    } catch (err) {
      console.error(`[pipeline] YouTube error for ${make} ${model}:`, (err as Error).message);
    }

    try {
      const rd = await runRedditPipeline(make, model);
      redditTotal += rd;
    } catch (err) {
      console.error(`[pipeline] Reddit error for ${make} ${model}:`, (err as Error).message);
    }

    try {
      const fc = await runFirecrawlPipeline(make, model);
      firecrawlTotal += fc;
    } catch (err) {
      console.error(`[pipeline] Firecrawl error for ${make} ${model}:`, (err as Error).message);
    }
  }

  return {
    youtube: youtubeTotal,
    reddit: redditTotal,
    firecrawl: firecrawlTotal,
    modelsProcessed: targetModels.length,
  };
}
