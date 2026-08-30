import { promises as fs } from "fs";
import path from "path";
import type { CachedReputation, LLMReputationResult, ScrapedReview } from "./types";

const CACHE_DIR = path.join(process.cwd(), ".cache", "reputation");
const TTL_DAYS_DEFAULT = 7;

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
  try {
    const raw = await fs.readFile(makePath(make, model), "utf-8");
    const cached: CachedReputation = JSON.parse(raw);
    const expiresAt = new Date(cached.expiresAt);
    if (expiresAt > new Date()) return cached;
    // Expired — return null but keep for stale-while-revalidate
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
  await ensureCacheDir();
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
  await fs.writeFile(makePath(make, model), JSON.stringify(data, null, 2), "utf-8");
}

export async function getStaleReputation(
  make: string,
  model: string
): Promise<CachedReputation | null> {
  try {
    const raw = await fs.readFile(makePath(make, model), "utf-8");
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export async function listCachedModels(): Promise<{ make: string; model: string }[]> {
  await ensureCacheDir();
  try {
    const files = await fs.readdir(CACHE_DIR);
    return files
      .filter((f) => f.endsWith(".json"))
      .map((f) => {
        const [make, model] = f.replace(".json", "").split("_");
        return { make, model };
      });
  } catch {
    return [];
  }
}

export async function invalidateCache(make: string, model: string): Promise<void> {
  try {
    await fs.unlink(makePath(make, model));
  } catch { /* ignore */ }
}
