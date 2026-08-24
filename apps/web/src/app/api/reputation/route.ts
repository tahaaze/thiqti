import { NextRequest, NextResponse } from "next/server";
import { Pool } from "pg";
import { safetyRatingFor, safetyLabel, safetyLevel } from "@/lib/safetyRatings";
import { marocReputationFor, marocTestsFor } from "@/lib/marocReputation";
import { MarocBrandReputation, MarocTest } from "@/lib/marocReputation";

interface SafetyInfo {
  stars: number;
  ratingYear: number;
  className: string;
  source: "euroncap" | "nhtsa";
  label: string;
  level: "elevee" | "moyenne" | "faible";
}

interface ReputationData {
  modelKey: string;
  dataAvailable: boolean;
  totalReviews: number;
  avgScore: number | null;
  windowMonths: number;
  lastUpdated: string;
  positiveTags: string[];
  negativeTags: string[];
  categories: { name: string; score: number | null }[];
  excerpts: { text: string; sentiment: "positive" | "negative" | "neutral"; score: number }[];
  volume: { total: number; positive: number; negative: number; neutral: number };
  reliability: "elevee" | "moyenne" | "faible";
  reliabilityLabel: string;
  safety: SafetyInfo | null;
  maroc: { brand: MarocBrandReputation | null; tests: MarocTest[] };
}

interface ReviewRow {
  title: string | null;
  body: string | null;
  rating: number | null;
  pros: string[] | null;
  cons: string[] | null;
}

interface ScoreRow {
  avg_rating: number | null;
  total_reviews: number | null;
  reliability: string | null;
  top_pros: string[] | null;
  top_cons: string[] | null;
  computed_at: Date | null;
}

let pool: Pool | null = null;

function getPool(): Pool {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL;
    pool = new Pool(
      connectionString
        ? {
            connectionString,
            ssl: { rejectUnauthorized: false },
            connectionTimeoutMillis: 5000,
          }
        : {
            host: process.env.DB_HOST || "localhost",
            port: Number(process.env.DB_PORT) || 5432,
            user: process.env.DB_USER || "thiqti",
            password: process.env.DB_PASSWORD || "thiqti_secret",
            database: process.env.DB_NAME || "thiqti",
            connectionTimeoutMillis: 3000,
          }
    );
  }
  return pool;
}

const CATEGORY_KEYWORDS: { name: string; keywords: string[] }[] = [
  { name: "Confort", keywords: ["confort", "suspension", "tenue", "conduite"] },
  { name: "Consommation", keywords: ["consommation", "économique", "economique", "hybride"] },
  { name: "Fiabilité", keywords: ["fiabilité", "fiabilite", "fiable", "solide"] },
  { name: "Rapport qualité-prix", keywords: ["qualité-prix", "qualite-prix", "rapport", "prix"] },
  { name: "Tenue de route", keywords: ["tenue de route", "route", "conduite"] },
  { name: "Finition", keywords: ["finition", "design", "intérieur", "interieur"] },
];

function getModelKey(make: string, model: string): string {
  return `${make.toLowerCase()}_${model.toLowerCase()}`;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

function sentimentFromRating(rating: number): "positive" | "negative" | "neutral" {
  if (rating >= 7) return "positive";
  if (rating <= 4) return "negative";
  return "neutral";
}

function insufficientData(modelKey: string): ReputationData {
  return {
    modelKey,
    dataAvailable: false,
    totalReviews: 0,
    avgScore: null,
    windowMonths: 18,
    lastUpdated: new Date().toISOString().split("T")[0],
    positiveTags: [],
    negativeTags: [],
    categories: [
      { name: "Confort", score: null },
      { name: "Consommation", score: null },
      { name: "Fiabilité", score: null },
      { name: "Rapport qualité-prix", score: null },
      { name: "Tenue de route", score: null },
      { name: "Finition", score: null },
    ],
    excerpts: [],
    volume: { total: 0, positive: 0, negative: 0, neutral: 0 },
    reliability: "faible",
    reliabilityLabel: "Faible",
    safety: null,
    maroc: { brand: null, tests: [] },
  };
}

function reliabilityFromDb(raw: string | null | undefined): { key: "elevee" | "moyenne" | "faible"; label: string } {
  if (raw === "fiable") return { key: "elevee", label: "Élevée" };
  if (raw === "moyen") return { key: "moyenne", label: "Moyenne" };
  return { key: "faible", label: "Faible" };
}

function topTagsFromReviews(reviews: ReviewRow[], field: "pros" | "cons"): string[] {
  const counts = new Map<string, number>();
  for (const review of reviews) {
    const items = review[field] || [];
    for (const item of items) {
      const key = item.trim();
      if (key) counts.set(key, (counts.get(key) || 0) + 1);
    }
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([tag]) => tag);
}

function buildFromDb(modelKey: string, reviews: ReviewRow[], score: ScoreRow | null): ReputationData {
  const totalReviews = reviews.length;
  const avgScore =
    totalReviews > 0
      ? round1(reviews.reduce((sum, r) => sum + (Number(r.rating) || 0), 0) / totalReviews)
      : score?.avg_rating != null
        ? round1(Number(score.avg_rating))
        : null;

  const prosJoined = reviews
    .flatMap((r) => r.pros || [])
    .join(" ")
    .toLowerCase();
  const consJoined = reviews
    .flatMap((r) => r.cons || [])
    .join(" ")
    .toLowerCase();

  const categories = CATEGORY_KEYWORDS.map((cat) => {
    if (avgScore == null) return { name: cat.name, score: null };
    let value = avgScore;
    if (cat.keywords.some((k) => prosJoined.includes(k))) value += 0.5;
    if (cat.keywords.some((k) => consJoined.includes(k))) value -= 0.5;
    return { name: cat.name, score: round1(clamp(value, 0, 10)) };
  });

  const positiveTags = score?.top_pros?.length
    ? score.top_pros
    : topTagsFromReviews(reviews, "pros");
  const negativeTags = score?.top_cons?.length
    ? score.top_cons
    : topTagsFromReviews(reviews, "cons");

  const excerpts = reviews.slice(0, 6).map((r) => ({
    text: (r.body || r.title || "Avis sans texte").trim(),
    sentiment: sentimentFromRating(Number(r.rating) || 0),
    score: round1(clamp(Number(r.rating) || 0, 0, 10)),
  }));

  const positive = reviews.filter((r) => (Number(r.rating) || 0) >= 7).length;
  const negative = reviews.filter((r) => (Number(r.rating) || 0) <= 4).length;
  const neutral = totalReviews - positive - negative;

  const reliability = reliabilityFromDb(score?.reliability);
  const lastUpdated = score?.computed_at
    ? new Date(score.computed_at).toISOString().split("T")[0]
    : new Date().toISOString().split("T")[0];

  return {
    modelKey,
    dataAvailable: true,
    totalReviews,
    avgScore,
    windowMonths: 18,
    lastUpdated,
    positiveTags,
    negativeTags,
    categories,
    excerpts,
    volume: { total: totalReviews, positive, negative, neutral },
    reliability: reliability.key,
    reliabilityLabel: reliability.label,
    safety: null,
    maroc: { brand: null, tests: [] },
  };
}

async function loadReputation(make: string, model: string): Promise<ReputationData> {
  const modelKey = getModelKey(make, model);
  const client = await getPool().connect();
  try {
    const vehicleResult = await client.query(
      `SELECT id FROM vehicles WHERE lower(make) = lower($1) AND lower(model) = lower($2)`,
      [make, model]
    );
    if (vehicleResult.rowCount === 0) {
      return insufficientData(modelKey);
    }
    const vehicleId = vehicleResult.rows[0].id;

    const [reviewsResult, scoreResult] = await Promise.all([
      client.query(
        `SELECT title, body, rating, pros, cons FROM reviews WHERE vehicle_id = $1 ORDER BY published_at DESC`,
        [vehicleId]
      ),
      client.query(
        `SELECT avg_rating, total_reviews, reliability, top_pros, top_cons, computed_at
         FROM reputation_scores WHERE vehicle_id = $1`,
        [vehicleId]
      ),
    ]);

    const reviews: ReviewRow[] = reviewsResult.rows.map((row) => ({
      title: row.title,
      body: row.body,
      rating: row.rating,
      pros: row.pros,
      cons: row.cons,
    }));

    if (reviews.length === 0) {
      return insufficientData(modelKey);
    }

    const score: ScoreRow | null = scoreResult.rowCount ? scoreResult.rows[0] : null;
    return buildFromDb(modelKey, reviews, score);
  } finally {
    client.release();
  }
}

function safetyInfoFor(make: string, model: string): SafetyInfo | null {
  const entry = safetyRatingFor(make, model);
  if (!entry) return null;
  return {
    stars: entry.stars,
    ratingYear: entry.ratingYear,
    className: entry.className,
    source: entry.source,
    label: safetyLabel(entry),
    level: safetyLevel(entry.stars) ?? "faible",
  };
}

function marocBlockFor(make: string, model: string): { brand: MarocBrandReputation | null; tests: MarocTest[] } {
  return {
    brand: marocReputationFor(make),
    tests: marocTestsFor(make, model),
  };
}

// --- Normalisation vers les enums PostgreSQL (schema.sql) ---
function dbBodyType(bodyType: string | undefined): string {
  const v = (bodyType || "").toLowerCase();
  if (v.includes("suv") || v.includes("4x4") || v.includes("4x4")) return "suv";
  if (v.includes("berline")) return "berline";
  if (v.includes("citadine")) return "citadine";
  if (v.includes("monospace")) return "monospace";
  if (v.includes("pick") || v.includes("utilitaire")) return "pick-up";
  return "crossover";
}

function dbFuelType(fuel: string | undefined): string {
  const v = (fuel || "").toLowerCase();
  if (v.includes("électr") || v.includes("electr")) return "electrique";
  if (v.includes("hybr")) return "hybride";
  if (v.includes("diesel")) return "diesel";
  if (v.includes("essence")) return "essence";
  return "essence";
}

function dbTransmission(transmission: string | undefined): string {
  const v = (transmission || "").toLowerCase();
  if (v.includes("manuel")) return "manuelle";
  return "automatique";
}

/** Trouve le vehicle_id par marque/modele, ou cree la ligne si absente. */
async function getOrCreateVehicle(
  client: { query: (sql: string, params?: unknown[]) => Promise<{ rowCount: number; rows: { id: string }[] }> },
  make: string,
  model: string,
  car: { year?: number; fuel?: string; bodyType?: string; transmission?: string }
): Promise<string> {
  const existing = await client.query(
    `SELECT id FROM vehicles WHERE lower(make) = lower($1) AND lower(model) = lower($2)`,
    [make, model]
  );
  if (existing.rowCount && existing.rowCount > 0) return existing.rows[0].id;
  const inserted = await client.query(
    `INSERT INTO vehicles (make, model, year, trim, body_type, fuel_type, transmission, seats, price_mad)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id`,
    [
      make,
      model,
      car.year || 2026,
      model,
      dbBodyType(car.bodyType),
      dbFuelType(car.fuel),
      dbTransmission(car.transmission),
      5,
      0,
    ]
  );
  return inserted.rows[0].id;
}

export async function GET(request: NextRequest) {
  const make = request.nextUrl.searchParams.get("make") || "";
  const model = request.nextUrl.searchParams.get("model") || "";

  if (!make || !model) {
    return NextResponse.json({ error: "make and model are required" }, { status: 400 });
  }

  try {
    const data = await loadReputation(make, model);
    data.safety = safetyInfoFor(make, model);
    data.maroc = marocBlockFor(make, model);
    return NextResponse.json(data);
  } catch {
    const fallback = insufficientData(getModelKey(make, model));
    fallback.safety = safetyInfoFor(make, model);
    fallback.maroc = marocBlockFor(make, model);
    return NextResponse.json(fallback);
  }
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { make, model, text, score, sentiment, year, fuel, bodyType, transmission } = body;

  if (!make || !model || !text || score === undefined) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  let client;
  try {
    client = await getPool().connect();
    const vehicleId = await getOrCreateVehicle(client, make, model, { year, fuel, bodyType, transmission });

    const rating = round1(clamp(Number(score), 0, 10));
    const title = String(text).slice(0, 300);
    const bodyText = String(text);
    const isPositive = sentiment === "positive";
    const isNegative = sentiment === "negative";

    await client.query(
      `INSERT INTO reviews (vehicle_id, source, author_name, rating, title, body, pros, cons, verified, published_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())`,
      [
        vehicleId,
        "web",
        null,
        rating,
        title,
        bodyText,
        isPositive ? [] : null,
        isNegative ? [] : null,
        false,
      ]
    );

    const data = await loadReputation(make, model);
    data.safety = safetyInfoFor(make, model);
    data.maroc = marocBlockFor(make, model);
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  } finally {
    client?.release();
  }
}
