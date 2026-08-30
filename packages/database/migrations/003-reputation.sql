-- 003-reputation.sql
-- Tables for vehicle reputation system

CREATE TABLE IF NOT EXISTS vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  make TEXT NOT NULL,
  model TEXT NOT NULL,
  year INTEGER,
  trim TEXT,
  body_type TEXT,
  fuel_type TEXT,
  transmission TEXT,
  seats INTEGER DEFAULT 5,
  price_mad NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (lower(make), lower(model))
);

CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  source TEXT DEFAULT 'web',
  author_name TEXT,
  rating NUMERIC(3,1),
  title TEXT,
  body TEXT,
  pros TEXT[],
  cons TEXT[],
  verified BOOLEAN DEFAULT false,
  published_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS reputation_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  avg_rating NUMERIC(3,1),
  total_reviews INTEGER DEFAULT 0,
  reliability TEXT,
  top_pros TEXT[],
  top_cons TEXT[],
  computed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (vehicle_id)
);

CREATE INDEX IF NOT EXISTS idx_reviews_vehicle ON reviews(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_reputation_vehicle ON reputation_scores(vehicle_id);
