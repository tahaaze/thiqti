// ============================================================================
// PIPELINE TYPES
// ============================================================================

export interface PipelineRun {
  id?: string;
  pipeline_type: 'vehicles' | 'reputation_youtube' | 'reputation_reddit' | 'reputation_firecrawl' | 'reputation_scrapecreators';
  source: string;
  status: 'running' | 'completed' | 'failed';
  items_found: number;
  items_stored: number;
  error_message?: string;
  duration_ms?: number;
  started_at?: Date;
  completed_at?: Date;
}

export interface SocialMediaReview {
  id?: string;
  vehicle_id: string;
  platform: 'youtube' | 'reddit' | 'firecrawl' | 'scrapecreators' | 'duckduckgo';
  platform_id: string;
  author_name?: string;
  author_url?: string;
  title?: string;
  body?: string;
  url: string;
  rating?: number;
  likes?: number;
  views?: number;
  comments_count?: number;
  published_at?: Date;
  scraped_at?: Date;
  sentiment?: 'positive' | 'neutral' | 'negative';
  sentiment_score?: number;
  language?: string;
}

export interface YouTubeVideo {
  id: string;
  title: string;
  description: string;
  channelTitle: string;
  channelUrl: string;
  publishedAt: string;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  thumbnailUrl: string;
  url: string;
}

export interface RedditPost {
  id: string;
  title: string;
  selftext: string;
  author: string;
  authorUrl: string;
  subreddit: string;
  score: number;
  numComments: number;
  url: string;
  permalink: string;
  createdUtc: number;
}

export interface FirecrawlResult {
  url: string;
  title: string;
  markdown: string;
  metadata?: Record<string, unknown>;
}

export interface SentimentResult {
  sentiment: 'positive' | 'neutral' | 'negative';
  score: number; // 0-1 confidence
  language: string;
  summary?: string;
}

export interface VehicleCandidate {
  make: string;
  model: string;
  year?: number;
  source: string;
  source_url?: string;
  image_url?: string;
  price_mad?: number;
  city?: string;
  km?: number;
}
