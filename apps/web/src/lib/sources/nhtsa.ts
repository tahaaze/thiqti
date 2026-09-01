// ============================================================================
// NHTSA VPIC — CATALOGUE CONSTRUCTEURS REEL (SANS CLE, SERVEUR)
// ============================================================================
//
// API officielle du DOT americain (National Highway Traffic Safety
// Administration) : https://vpic.nhtsa.dot.gov/apis/
// Renvoie la liste reelle des constructeurs et modeles de voitures
// particulières. Sans cle, sans quota. Utilisée pour alimenter les
// suggestions de marques du chat et le catalogue constructeur de l'admin.
// Toutes les erreurs réseau sont absorbées : aucune dépendance bloquante.
// ============================================================================

const API_BASE = "https://vpic.nhtsa.dot.gov/api/vehicles";
const CACHE_TTL = 24 * 60 * 60 * 1000;
const TIMEOUT_MS = 6000;

export interface NHTSAMake {
  id: number;
  name: string;
}

let makesCache: { data: NHTSAMake[]; fetchedAt: number } | null = null;

async function getJson<T>(path: string): Promise<T | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(`${API_BASE}${path}`, { signal: controller.signal });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

interface MakesResponse {
  Results?: { MakeId: number; MakeName: string }[];
}

interface ModelsResponse {
  Results?: { Model_Name: string }[];
}

/** Liste reelle des constructeurs de voitures particulières (cachee 24h). */
export async function getNHTSAMakes(): Promise<NHTSAMake[]> {
  const now = Date.now();
  if (makesCache && now - makesCache.fetchedAt < CACHE_TTL) {
    return makesCache.data;
  }
  const data = await getJson<MakesResponse>("/GetMakesForVehicleType/car?format=json");
  const makes = (data?.Results || [])
    .map((m) => ({ id: m.MakeId, name: m.MakeName }))
    .filter((m) => m.name && m.name.length > 1)
    .sort((a, b) => a.name.localeCompare(b.name));
  makesCache = { data: makes, fetchedAt: now };
  return makes;
}

/** Modeles reels d'un constructeur (par nom, cachee 24h). */
export async function getNHTSAModels(make: string): Promise<string[]> {
  const data = await getJson<ModelsResponse>(
    `/GetModelsForMake/${encodeURIComponent(make)}?format=json`
  );
  const models = (data?.Results || [])
    .map((m) => m.Model_Name)
    .filter((m) => m && m.length > 0)
    .filter((value, index, self) => self.indexOf(value) === index)
    .sort();
  return models;
}
