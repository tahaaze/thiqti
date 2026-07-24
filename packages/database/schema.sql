-- Thiqti - Database Schema
-- PostgreSQL 16 + pgvector

CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ===================== VEHICLES =====================
CREATE TABLE vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  make VARCHAR(100) NOT NULL,
  model VARCHAR(100) NOT NULL,
  year INT NOT NULL DEFAULT 2026,
  trim VARCHAR(200) NOT NULL,
  body_type VARCHAR(50) NOT NULL CHECK (body_type IN ('suv','berline','citadine','pick-up','monospace','crossover')),
  fuel_type VARCHAR(50) NOT NULL CHECK (fuel_type IN ('hybride','electrique','diesel','essence','plug-in-hybride')),
  transmission VARCHAR(30) NOT NULL CHECK (transmission IN ('automatique','manuelle')),
  seats INT NOT NULL DEFAULT 5,
  price_mad INT NOT NULL,
  price_old_mad INT,
  power_ch INT,
  consumption_l100 REAL,
  co2_gkm INT,
  accel_0_100 REAL,
  trunk_liters INT,
  length_mm INT,
  width_mm INT,
  height_mm INT,
  wheelbase_mm INT,
  image_url TEXT,
  embedding vector(1536),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_vehicles_make ON vehicles(make);
CREATE INDEX idx_vehicles_body ON vehicles(body_type);
CREATE INDEX idx_vehicles_fuel ON vehicles(fuel_type);
CREATE INDEX idx_vehicles_price ON vehicles(price_mad);
CREATE INDEX idx_vehicles_embedding ON ivfflat_ops(embedding vector_cosine_ops) WITH (lists = 10);

-- Full text search
ALTER TABLE vehicles ADD COLUMN search_vector tsvector;
CREATE INDEX idx_vehicles_fts ON vehicles USING GIN(search_vector);

CREATE OR REPLACE FUNCTION vehicles_search_vector_trigger() RETURNS trigger AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('french', COALESCE(NEW.make, '')), 'A') ||
    setweight(to_tsvector('french', COALESCE(NEW.model, '')), 'A') ||
    setweight(to_tsvector('french', COALESCE(NEW.trim, '')), 'B') ||
    setweight(to_tsvector('french', COALESCE(NEW.body_type, '')), 'C') ||
    setweight(to_tsvector('french', COALESCE(NEW.fuel_type, '')), 'C');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_vehicles_search
  BEFORE INSERT OR UPDATE ON vehicles
  FOR EACH ROW EXECUTE FUNCTION vehicles_search_vector_trigger();

-- ===================== REVIEWS / REPUTATION =====================
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  source VARCHAR(50) NOT NULL DEFAULT 'aggregated',
  author_name VARCHAR(200),
  rating REAL CHECK (rating >= 1 AND rating <= 10),
  title VARCHAR(300),
  body TEXT,
  pros TEXT[],
  cons TEXT[],
  verified BOOLEAN DEFAULT FALSE,
  published_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_reviews_vehicle ON reviews(vehicle_id);
CREATE INDEX idx_reviews_rating ON reviews(rating);

-- ===================== REPUTATION SCORES (materialized) =====================
CREATE TABLE reputation_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE UNIQUE,
  avg_rating REAL NOT NULL DEFAULT 0,
  total_reviews INT NOT NULL DEFAULT 0,
  reliability VARCHAR(20) CHECK (reliability IN ('fiable','moyen','insuffisant')),
  top_pros TEXT[],
  top_cons TEXT[],
  computed_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===================== USERS (via Supabase Auth) =====================
CREATE TABLE user_favorites (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, vehicle_id)
);

-- ===================== SEARCH QUERIES LOG =====================
CREATE TABLE search_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  query TEXT NOT NULL,
  filters JSONB,
  results_count INT DEFAULT 0,
  response_time_ms INT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===================== DEALERS / OFFERS =====================
CREATE TABLE dealers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(200) NOT NULL,
  city VARCHAR(100) NOT NULL,
  address TEXT,
  phone VARCHAR(20),
  lat REAL,
  lng REAL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE dealer_offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dealer_id UUID NOT NULL REFERENCES dealers(id) ON DELETE CASCADE,
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  offer_price_mad INT NOT NULL,
  delivery_weeks INT,
  promotion TEXT,
  valid_until DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_offers_vehicle ON dealer_offers(vehicle_id);
CREATE INDEX idx_offers_dealer ON dealer_offers(dealer_id);
