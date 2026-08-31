import { Pool } from 'pg';
import type { PipelineRun, SocialMediaReview, VehicleCandidate } from './types';

let pool: Pool | null = null;

function getPool(): Pool {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error('DATABASE_URL required');
  if (!pool) {
    pool = new Pool({
      connectionString,
      ssl: { rejectUnauthorized: false },
      max: 2,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    });
  }
  return pool;
}

// --- Pipeline Runs ---

export async function createPipelineRun(run: PipelineRun): Promise<string> {
  const client = await getPool().connect();
  try {
    const res = await client.query(
      `INSERT INTO pipeline_runs (pipeline_type, source, status, items_found, items_stored)
       VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      [run.pipeline_type, run.source, run.status, run.items_found, run.items_stored]
    );
    return res.rows[0].id;
  } finally { client.release(); }
}

export async function completePipelineRun(
  id: string,
  status: 'completed' | 'failed',
  itemsFound: number,
  itemsStored: number,
  errorMsg?: string,
  durationMs?: number
): Promise<void> {
  const client = await getPool().connect();
  try {
    await client.query(
      `UPDATE pipeline_runs SET status=$1, items_found=$2, items_stored=$3, error_message=$4, duration_ms=$5, completed_at=NOW() WHERE id=$6`,
      [status, itemsFound, itemsStored, errorMsg || null, durationMs || null, id]
    );
  } finally { client.release(); }
}

// --- Vehicles ---

export async function findOrCreateVehicle(v: VehicleCandidate): Promise<string> {
  const client = await getPool().connect();
  try {
    const existing = await client.query(
      `SELECT id FROM vehicles WHERE lower(make) = lower($1) AND lower(model) = lower($2)`,
      [v.make, v.model]
    );
    if (existing.rowCount && existing.rowCount > 0) {
      // Update last_seen_at
      await client.query(
        `UPDATE vehicles SET last_seen_at = NOW(), is_active = true WHERE id = $1`,
        [existing.rows[0].id]
      );
      return existing.rows[0].id;
    }
    const res = await client.query(
      `INSERT INTO vehicles (make, model, year, source, source_url, image_url, price_mad, city, km)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id`,
      [v.make, v.model, v.year || null, v.source, v.source_url || null, v.image_url || null, v.price_mad || null, v.city || null, v.km || null]
    );
    return res.rows[0].id;
  } finally { client.release(); }
}

export async function findVehicleByMakeModel(make: string, model: string): Promise<string | null> {
  const client = await getPool().connect();
  try {
    const res = await client.query(
      `SELECT id FROM vehicles WHERE lower(make) = lower($1) AND lower(model) = lower($2)`,
      [make, model]
    );
    return res.rowCount && res.rowCount > 0 ? res.rows[0].id : null;
  } finally { client.release(); }
}

export async function getVehiclesWithReviews(): Promise<{ id: string; make: string; model: string }[]> {
  const client = await getPool().connect();
  try {
    const res = await client.query(
      `SELECT DISTINCT v.id, v.make, v.model FROM vehicles v
       INNER JOIN social_media_reviews smr ON smr.vehicle_id = v.id
       WHERE smr.sentiment IS NOT NULL`
    );
    return res.rows;
  } finally { client.release(); }
}

// --- Social Media Reviews ---

export async function insertSocialReview(review: SocialMediaReview): Promise<boolean> {
  const client = await getPool().connect();
  try {
    // Generate a clean platform_id (max 80 chars)
    const rawId = `${review.platform}_${review.platform_id || Date.now()}`;
    const cleanId = rawId.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 80);
    
    // Check if already exists
    const existing = await client.query(
      `SELECT id FROM social_media_reviews WHERE platform = $1 AND platform_id = $2`,
      [review.platform, cleanId]
    );
    if (existing.rowCount && existing.rowCount > 0) {
      // Update existing
      await client.query(
        `UPDATE social_media_reviews SET title=$1, body=$2, likes=$3, views=$4, comments_count=$5, sentiment=$6, sentiment_score=$7 WHERE id=$8`,
        [review.title || null, review.body || null, review.likes || 0, review.views || 0, review.comments_count || 0, review.sentiment || null, review.sentiment_score || null, existing.rows[0].id]
      );
      return true;
    }
    
    await client.query(
      `INSERT INTO social_media_reviews (vehicle_id, platform, platform_id, author_name, author_url, title, body, url, rating, likes, views, comments_count, published_at, sentiment, sentiment_score, language)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)`,
      [
        review.vehicle_id, review.platform, cleanId,
        review.author_name || null, review.author_url || null,
        review.title || null, review.body || null, review.url,
        review.rating || null, review.likes || 0, review.views || 0,
        review.comments_count || 0, review.published_at || null,
        review.sentiment || null, review.sentiment_score || null,
        review.language || null,
      ]
    );
    return true;
  } catch (err) {
    console.error('[pipeline] insertSocialReview error:', (err as Error).message);
    return false;
  } finally { client.release(); }
}

export async function updateVehicleReputation(vehicleId: string): Promise<void> {
  const client = await getPool().connect();
  try {
    const stats = await client.query(
      `SELECT
         COUNT(*) as total,
         AVG(rating) as avg_rating,
         COUNT(*) FILTER (WHERE sentiment = 'positive') as positive,
         COUNT(*) FILTER (WHERE sentiment = 'negative') as negative
       FROM social_media_reviews WHERE vehicle_id = $1 AND rating IS NOT NULL`,
      [vehicleId]
    );
    if (stats.rowCount === 0 || parseInt(stats.rows[0].total) === 0) return;

    const { total, avg_rating } = stats.rows[0];
    const avg = parseFloat(avg_rating) || 0;
    const reliability = avg >= 7 ? 'fiable' : avg >= 5 ? 'moyen' : 'problematique';

    await client.query(
      `INSERT INTO reputation_scores (vehicle_id, avg_rating, total_reviews, reliability, computed_at)
       VALUES ($1, $2, $3, $4, NOW())
       ON CONFLICT (vehicle_id) DO UPDATE SET
         avg_rating = $2, total_reviews = $3, reliability = $4, computed_at = NOW()`,
      [vehicleId, Math.round(avg * 10) / 10, parseInt(total), reliability]
    );
  } finally { client.release(); }
}

export async function getRecentPipelineRuns(limit = 20): Promise<PipelineRun[]> {
  const client = await getPool().connect();
  try {
    const res = await client.query(
      `SELECT * FROM pipeline_runs ORDER BY started_at DESC LIMIT $1`,
      [limit]
    );
    return res.rows;
  } finally { client.release(); }
}

// --- Pipeline Config ---

export async function getActivePipelines(): Promise<{ pipeline_type: string; source: string; config: Record<string, unknown> }[]> {
  const client = await getPool().connect();
  try {
    const res = await client.query(
      `SELECT pipeline_type, source, config FROM pipeline_config WHERE is_active = true`
    );
    return res.rows;
  } finally { client.release(); }
}

export async function updatePipelineLastRun(pipelineType: string, source: string): Promise<void> {
  const client = await getPool().connect();
  try {
    await client.query(
      `UPDATE pipeline_config SET last_run_at = NOW(), updated_at = NOW()
       WHERE pipeline_type = $1 AND source = $2`,
      [pipelineType, source]
    );
  } finally { client.release(); }
}
