import { promises as fs } from "fs";
import path from "path";
import type { CachedReputation, LLMReputationResult, ScrapedReview } from "./types";

const CACHE_DIR = path.join(process.cwd(), ".cache", "reputation");
const TTL_DAYS_DEFAULT = 7;

// In-memory cache for Vercel serverless (filesystem is ephemeral)
const memCache = new Map<string, CachedReputation>();

function makeKey(make: string, model: string): string {
  return `${make.toLowerCase().replace(/\s+/g, "-")}_${model.toLowerCase().replace(/\s+/g, "-")}`;
}

function makePath(make: string, model: string): string {
  return path.join(CACHE_DIR, `${makeKey(make, model)}.json`);
}

async function ensureCacheDir(): Promise<void> {
  try {
    await fs.access(CACHE_DIR);
  } catch {
    await fs.mkdir(CACHE_DIR, { recursive: true });
  }
}

export async function getCachedReputation(
  make: string,
  model: string,
  ttlDays = TTL_DAYS_DEFAULT
): Promise<CachedReputation | null> {
  const key = makeKey(make, model);
  const now = new Date();

  // Try memory cache first
  const mem = memCache.get(key);
  if (mem) {
    const expiresAt = new Date(mem.expiresAt);
    if (expiresAt > now) return mem;
  }

  // Try filesystem cache
  try {
    const raw = await fs.readFile(makePath(make, model), "utf-8");
    const cached: CachedReputation = JSON.parse(raw);
    const expiresAt = new Date(cached.expiresAt);
    // Populate memory cache
    memCache.set(key, cached);
    if (expiresAt > now) return cached;
    return { ...cached, expiresAt: new Date(0).toISOString() } as CachedReputation;
  } catch {
    return null;
  }
}

export async function setCachedReputation(
  make: string,
  model: string,
  result: LLMReputationResult,
  reviews: ScrapedReview[],
  ttlDays = TTL_DAYS_DEFAULT
): Promise<void> {
  const key = makeKey(make, model);
  const now = new Date();
  const expiresAt = new Date(now.getTime() + ttlDays * 86400000);
  const data: CachedReputation = {
    make,
    model,
    result,
    reviews,
    computedAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
  };

  // Save to memory cache
  memCache.set(key, data);

  // Try filesystem cache (may fail on Vercel, that's OK)
  try {
    await ensureCacheDir();
    await fs.writeFile(makePath(make, model), JSON.stringify(data, null, 2), "utf-8");
  } catch {
    // Filesystem unavailable (Vercel serverless) — memory cache is enough
  }
}

export async function getStaleReputation(
  make: string,
  model: string
): Promise<CachedReputation | null> {
  const key = makeKey(make, model);

  // Try memory cache first
  const mem = memCache.get(key);
  if (mem) return mem;

  // Try filesystem
  try {
    const raw = await fs.readFile(makePath(make, model), "utf-8");
    const cached = JSON.parse(raw);
    memCache.set(key, cached);
    return cached;
  } catch {
    return null;
  }
}

export async function listCachedModels(): Promise<{ make: string; model: string }[]> {
  const fromMem = [...memCache.keys()].map((k) => {
    const [make, model] = k.split("_");
    return { make, model };
  });
  return fromMem;
}

export async function invalidateCache(make: string, model: string): Promise<void> {
  memCache.delete(makeKey(make, model));
  try {
    await fs.unlink(makePath(make, model));
  } catch { /* ignore */ }
}
