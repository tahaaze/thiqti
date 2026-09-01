import type { UnifiedCar } from "@/lib/sources/types";

export interface SearchFilters {
  minPrice?: number;
  maxPrice?: number;
  minYear?: number;
  maxKm?: number;
  bodyType?: string;
  fuel?: string;
  brand?: string;
  city?: string;
  transmission?: string;
  minSafety?: number;
}

export interface SearchFacets {
  priceMin: number;
  priceMax: number;
  yearMin: number;
  yearMax: number;
  brands: string[];
  bodyTypes: string[];
  fuels: string[];
  cities: string[];
  safety: { evaluated: number; fiveStars: number };
}

export const EMPTY_FILTERS: SearchFilters = {};

export function countActiveFilters(filters: SearchFilters): number {
  return Object.values(filters).filter((v) => v !== undefined && v !== "").length;
}

function toNum(value: string | null): number | undefined {
  if (value === null || value === "") return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}

export function parseFilters(params: URLSearchParams): SearchFilters {
  return {
    minPrice: toNum(params.get("minPrice")),
    maxPrice: toNum(params.get("maxPrice")),
    minYear: toNum(params.get("minYear")),
    maxKm: toNum(params.get("maxKm")),
    bodyType: params.get("bodyType") || undefined,
    fuel: params.get("fuel") || undefined,
    brand: params.get("brand") || undefined,
    city: params.get("city") || undefined,
    transmission: params.get("transmission") || undefined,
    minSafety: toNum(params.get("minSafety")),
  };
}

function norm(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function filterMatches(car: UnifiedCar, f: SearchFilters): boolean {
  if (f.minPrice != null && car.price < f.minPrice) return false;
  if (f.maxPrice != null && car.price > f.maxPrice) return false;
  if (f.minYear != null && car.year < f.minYear) return false;
  if (f.maxKm != null && car.km > f.maxKm) return false;
  if (f.bodyType) {
    const b = norm(f.bodyType);
    const carBody = norm(car.bodyType);
    // "Non précisé" ne doit pas rejeter un filtre carrosserie
    if (carBody !== "non precise") {
      const ok = carBody.includes(b) || norm(car.title).includes(b);
      if (!ok) return false;
    }
  }
  if (f.fuel) {
    const carFuel = norm(car.fuel);
    if (carFuel !== "non precise" && !carFuel.includes(norm(f.fuel))) return false;
  }
  if (f.brand && !norm(car.make).includes(norm(f.brand))) return false;
  if (f.city && !norm(car.city).includes(norm(f.city))) return false;
  if (f.transmission) {
    const carTrans = norm(car.transmission);
    // "Non précisé" ne doit pas rejeter un filtre transmission
    if (carTrans !== "non precise" && carTrans !== norm(f.transmission)) return false;
  }
  if (f.minSafety != null && !(car.safety && car.safety.stars >= f.minSafety)) return false;
  return true;
}

export function applyFilters(cars: UnifiedCar[], f: SearchFilters): UnifiedCar[] {
  const hasAny = Object.values(f).some((v) => v !== undefined);
  if (!hasAny) return cars;
  return cars.filter((c) => filterMatches(c, f));
}

// ---------------------------------------------------------------------------
// Dégradation progressive : relaxe un critère à la fois
// ---------------------------------------------------------------------------

const RELAX_ORDER: (keyof SearchFilters)[] = [
  "transmission",
  "fuel",
  "bodyType",
  "brand",
  "minPrice",
  "maxPrice",
];

export interface RelaxedSearchResult {
  results: UnifiedCar[];
  relaxed: string[];
  expandedBudget: boolean;
}

/** Essaie la recherche avec des critères progressivement assouplis. */
export function searchWithFallback(
  cars: UnifiedCar[],
  filters: SearchFilters,
  maxRelaxations = 3
): RelaxedSearchResult {
  const strict = applyFilters(cars, filters);
  if (strict.length > 0) {
    return { results: strict, relaxed: [], expandedBudget: false };
  }

  const relaxed: string[] = [];
  let expandedBudget = false;

  // Étape 1 : relâcher les critères un par un (ordre de priorité)
  // À chaque étape, on crée un nouvel objet sans le critère relâché
  let currentFilters = { ...filters };
  for (const key of RELAX_ORDER) {
    if (relaxed.length >= maxRelaxations) break;
    if (currentFilters[key] !== undefined) {
      const label = describeFilter(key, currentFilters[key]!);
      const rest = Object.fromEntries(
        Object.entries(currentFilters).filter(([k]) => k !== key)
      );
      currentFilters = rest;
      relaxed.push(label);
      const attempt = applyFilters(cars, currentFilters);
      if (attempt.length > 0) {
        return { results: attempt, relaxed, expandedBudget };
      }
    }
  }

  // Étape 2 : élargir le budget de ±20%
  if (filters.minPrice != null || filters.maxPrice != null) {
    expandedBudget = true;
    const bf = { ...currentFilters };
    if (bf.minPrice != null) bf.minPrice = Math.round(bf.minPrice * 0.8);
    if (bf.maxPrice != null) bf.maxPrice = Math.round(bf.maxPrice * 1.2);
    relaxed.push("élargissement budget ±20%");
    const attempt = applyFilters(cars, bf);
    if (attempt.length > 0) {
      return { results: attempt, relaxed, expandedBudget };
    }
  }

  // Étape 3 : relâcher les budgets restants
  if (currentFilters.minPrice !== undefined) {
    currentFilters = Object.fromEntries(
      Object.entries(currentFilters).filter(([k]) => k !== "minPrice")
    );
    relaxed.push("prix minimum");
  }
  if (currentFilters.maxPrice !== undefined) {
    currentFilters = Object.fromEntries(
      Object.entries(currentFilters).filter(([k]) => k !== "maxPrice")
    );
    relaxed.push("prix maximum");
  }
  const finalAttempt = applyFilters(cars, currentFilters);
  return { results: finalAttempt, relaxed, expandedBudget };
}

function describeFilter(key: string, value: unknown): string {
  const labels: Record<string, string> = {
    transmission: `transmission ${value}`,
    bodyType: `carrosserie ${value}`,
    fuel: `carburant ${value}`,
    brand: `marque ${value}`,
    minPrice: `budget minimum ${value} DH`,
    maxPrice: `budget maximum ${value} DH`,
  };
  return labels[key] || `${key} (${value})`;
}
