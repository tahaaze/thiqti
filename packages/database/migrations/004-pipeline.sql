-- 004-pipeline.sql
-- Data pipeline tables for vehicle scraping + social media reputation

-- ============================================================================
-- VEHICLES: Extend existing table with new columns
-- ============================================================================
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS images TEXT[] DEFAULT '{}';
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS source_url TEXT;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS source TEXT;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS price_old_mad NUMERIC;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS km INTEGER;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS year_first_reg INTEGER;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- ============================================================================
-- PIPELINE RUNS: Track scraping jobs
-- ============================================================================
CREATE TABLE IF NOT EXISTS pipeline_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pipeline_type VARCHAR(50) NOT NULL, -- 'vehicles', 'reputation_youtube', 'reputation_reddit', 'reputation_firecrawl', 'reputation_scrapecreators'
  source VARCHAR(100), -- 'autera', 'moteur', 'youtube', 'reddit', etc.
  status VARCHAR(20) NOT NULL DEFAULT 'running', -- 'running', 'completed', 'failed'
  items_found INTEGER DEFAULT 0,
  items_stored INTEGER DEFAULT 0,
  error_message TEXT,
  duration_ms INTEGER,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_pipeline_runs_type ON pipeline_runs(pipeline_type, source);
CREATE INDEX IF NOT EXISTS idx_pipeline_runs_started ON pipeline_runs(started_at DESC);

-- ============================================================================
-- SOCIAL MEDIA REVIEWS: Platform-specific reviews from YouTube, Reddit, etc.
-- ============================================================================
CREATE TABLE IF NOT EXISTS social_media_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID REFERENCES vehicles(id) ON DELETE CASCADE,
  platform VARCHAR(50) NOT NULL, -- 'youtube', 'reddit', 'firecrawl', 'scrapecreators', 'duckduckgo'
  platform_id TEXT, -- Video ID, post ID, etc.
  author_name TEXT,
  author_url TEXT,
  title TEXT,
  body TEXT,
  url TEXT NOT NULL, -- Original URL
  rating REAL, -- Normalized 0-10 if available
  likes INTEGER DEFAULT 0,
  views INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  published_at TIMESTAMPTZ,
  scraped_at TIMESTAMPTZ DEFAULT NOW(),
  sentiment VARCHAR(20), -- 'positive', 'neutral', 'negative' (AI classified)
  sentiment_score REAL, -- 0-1 confidence
  language VARCHAR(10), -- 'fr', 'en', 'ar', 'darija'
  UNIQUE (platform, platform_id)
);

CREATE INDEX IF NOT EXISTS idx_social_reviews_vehicle ON social_media_reviews(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_social_reviews_platform ON social_media_reviews(platform);
CREATE INDEX IF NOT EXISTS idx_social_reviews_sentiment ON social_media_reviews(sentiment);

-- ============================================================================
-- PIPELINE CONFIG: Which sources are active + schedules
-- ============================================================================
CREATE TABLE IF NOT EXISTS pipeline_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pipeline_type VARCHAR(50) NOT NULL UNIQUE,
  source VARCHAR(100) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  config JSONB DEFAULT '{}', -- API keys, rate limits, etc.
  last_run_at TIMESTAMPTZ,
  next_run_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default pipeline configs
INSERT INTO pipeline_config (pipeline_type, source, is_active, config) VALUES
  ('vehicles', 'autera', true, '{"url": "https://autera.ma"}'),
  ('vehicles', 'moteur', true, '{"url": "https://moteur.ma"}'),
  ('vehicles', 'moteur-neuf', true, '{"url": "https://moteur.ma/neuf"}'),
  ('vehicles', 'electrodrive', true, '{"url": "https://electrodrive.ma"}'),
  ('vehicles', 'autohall', true, '{"url": "https://autohall.ma"}'),
  ('vehicles', 'auto24', true, '{"url": "https://auto24.ma"}'),
  ('vehicles', 'avito', true, '{"url": "https://avito.ma"}'),
  ('reputation', 'youtube', true, '{"max_results": 10, "search_queries": ["{make} {model} review", "{make} {model} avis", "{make} {model} problème"]}'),
  ('reputation', 'reddit', true, '{"subreddits": ["cars", "whatcarshouldIbuy", "Morocco"], "max_results": 20}'),
  ('reputation', 'firecrawl', true, '{"max_pages": 5, "urls": ["https://www.autoevolution.com/{make.toLowerCase()}/{model.toLowerCase()}/", "https://www.edmunds.com/{make.toLowerCase()}/{model.toLowerCase()}/"]}')
ON CONFLICT (pipeline_type) DO NOTHING;

-- ============================================================================
-- VEHICLE IMAGES: Store image references per vehicle
-- ============================================================================
CREATE TABLE IF NOT EXISTS vehicle_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID REFERENCES vehicles(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  alt TEXT,
  source VARCHAR(100), -- 'autera', 'moteur', 'youtube', etc.
  is_primary BOOLEAN DEFAULT false,
  width INTEGER,
  height INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_vehicle_images_vehicle ON vehicle_images(vehicle_id);
