import type { LLMReputationResult, CachedReputation, ScrapedReview } from "./types";
import { scrapeAllReviews } from "./scrapeReviews";
import { analyzeReviewsLLM } from "./llmAnalysis";
import { getCachedReputation, setCachedReputation, getStaleReputation } from "./reputationCache";

export type { LLMReputationResult, CachedReputation, ScrapedReview };

const STALE_REVALIDATE_MS = 60 * 60 * 1000; // 1h

/**
 * Obtenir la réputation d'un modèle de voiture.
 * Stratégie :
 * 1. Cache frais → retour immédiat
 * 2. Cache périmé → retour stale + revalidation en arrière-plan
 * 3. Pas de cache → scrape + analyse + cache + retour
 */
export async function getReputation(
  make: string,
  model: string,
  options?: { forceRefresh?: boolean; maxAgeDays?: number }
): Promise<{ data: LLMReputationResult; fresh: boolean }> {
  const maxAge = options?.maxAgeDays ?? 7;

  // 1. Cache frais
  if (!options?.forceRefresh) {
    const cached = await getCachedReputation(make, model, maxAge);
    if (cached) {
      return { data: cached.result, fresh: true };
    }
  }

  // 2. Cache stale → retourner + revalider en arrière-plan
  const stale = await getStaleReputation(make, model);
  if (stale && !options?.forceRefresh) {
    const staleAge = Date.now() - new Date(stale.computedAt).getTime();
    if (staleAge < STALE_REVALIDATE_MS * 24) {
      // Revalider en arrière-plan (ne pas attendre)
      refreshReputation(make, model).catch(() => {});
      return { data: stale.result, fresh: false };
    }
  }

  // 3. Pas de cache ou refresh forcé → scrape complet
  const result = await refreshReputation(make, model);
  return { data: result, fresh: true };
}

/**
 * Scrape les avis et calcule la réputation.
 * Sauvegarde dans le cache.
 */
export async function refreshReputation(
  make: string,
  model: string
): Promise<LLMReputationResult> {
  const reviews = await scrapeAllReviews(make, model);
  const result = await analyzeReviewsLLM(make, model, reviews);
  await setCachedReputation(make, model, result, reviews);
  return result;
}

/**
 * Version synchrone pour les pages véhicule — retourne la réputation
 * depuis le cache sans faire de scraping.
 */
export async function getReputationSync(
  make: string,
  model: string
): Promise<LLMReputationResult | null> {
  const cached = await getCachedReputation(make, model, 30);
  return cached?.result ?? null;
}

/**
 * Enrichir une liste de véhicules avec leurs scores de réputation.
 */
export async function enrichWithReputation<T extends { make: string; model: string }>(
  vehicles: T[]
): Promise<(T & { reputationResult?: LLMReputationResult })[]> {
  const uniqueModels = new Map<string, { make: string; model: string }>();
  for (const v of vehicles) {
    const key = `${v.make}_${v.model}`;
    if (!uniqueModels.has(key)) uniqueModels.set(key, { make: v.make, model: v.model });
  }

  const reputationMap = new Map<string, LLMReputationResult>();
  const entries = [...uniqueModels.values()];

  // Batch : récupérer les reputations en parallèle (max 5 à la fois)
  for (let i = 0; i < entries.length; i += 5) {
    const batch = entries.slice(i, i + 5);
    const results = await Promise.allSettled(
      batch.map(async (e) => {
        const cached = await getCachedReputation(e.make, e.model, 30);
        return { key: `${e.make}_${e.model}`, result: cached?.result ?? null };
      })
    );
    for (const r of results) {
      if (r.status === "fulfilled" && r.value.result) {
        reputationMap.set(r.value.key, r.value.result);
      }
    }
  }

  return vehicles.map((v) => ({
    ...v,
    reputationResult: reputationMap.get(`${v.make}_${v.model}`) ?? undefined,
  }));
}
