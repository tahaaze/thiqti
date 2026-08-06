// ============================================================================
// REPUTATION AU MAROC — sources marocaines verifiees (sites officiels,
// reseaux sociaux, reseau de concessionnaires, essais Moteur.ma).
// Source : scripts/maroc-reputation-cache.json. Aucun appel reseau a la
// requete : lecture synchrone d'un cache JSON, comme safetyRatings.ts.
// Aucune donnee inventee : chaque URL provient d'une recherche verifiee.
// ============================================================================

import { readFileSync } from "fs";
import { join } from "path";
import { makeKey, modelKey } from "./safetyAliases";

export interface MarocSource {
  label: string;
  url: string;
  note?: string;
  verifiedAt?: string;
}

export interface MarocSocial {
  network: "facebook" | "instagram" | "youtube" | "tiktok";
  label: string;
  url: string;
  followers?: number;
  verifiedAt?: string;
}

export interface MarocTest {
  model: string;
  title: string;
  url: string;
  verdict?: string;
  verifiedAt?: string;
}

export interface MarocBrandReputation {
  make: string;
  distributor?: string;
  officialSite?: MarocSource | null;
  resellers?: MarocSource | null;
  socials: MarocSocial[];
  tests: MarocTest[];
  verifiedAt: string;
}

interface MarocCache {
  generatedAt: string;
  source: string;
  brands: MarocBrandReputation[];
}

let cache: MarocBrandReputation[] | null = null;

function cachePath(): string {
  return join(process.cwd(), "scripts", "maroc-reputation-cache.json");
}

function loadBrands(): MarocBrandReputation[] {
  if (cache) return cache;
  try {
    const raw = JSON.parse(readFileSync(cachePath(), "utf-8")) as MarocCache;
    cache = Array.isArray(raw.brands) ? raw.brands : [];
  } catch {
    cache = [];
  }
  return cache;
}

/** Bloc reputation marocaine pour une marque (ou null si non reference). */
export function marocReputationFor(make: string): MarocBrandReputation | null {
  const key = makeKey(make);
  const brands = loadBrands();
  for (const brand of brands) {
    if (makeKey(brand.make) === key) return brand;
  }
  return null;
}

/** Essais (Moteur.ma) trouves pour un modele donne, toutes marques confondues. */
export function marocTestsFor(make: string, model: string): MarocTest[] {
  const brand = marocReputationFor(make);
  if (!brand) return [];
  const mm = modelKey(model);
  return brand.tests.filter((t) => modelKey(t.model) === mm);
}

/** Tous les essais d'une marque (pour le bloc marque). */
export function marocBrandTests(make: string): MarocTest[] {
  return marocReputationFor(make)?.tests ?? [];
}
