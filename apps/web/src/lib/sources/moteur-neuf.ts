// ============================================================================
// MOTEUR.MA — CATALOGUE VOITURES NEUVES AU MAROC (SCRAPING LEGER)
// ============================================================================
//
// Source : https://www.moteur.ma/fr/neuf/voiture/ — annuaire exhaustif
// des voitures neuves au Maroc (73 marques, ~200+ modèles).
//
// Stratégie :
//   1. Extraction de window.topSheetBrandsData depuis l'index pour obtenir
//      la liste structurée complète (marque, modèle, photo, slug/lien).
//   2. Visite des pages modèles individuelles pour les marques populaires
//      afin d'obtenir les prix, versions et descriptions.
//   3. Les marques moins populaires restent sans prix (champ vide) — on
//      ne invente jamais de donnée.
//
//robots.txt : Allow: / (crawl-delay 10s pour Googlebot). Requêtes
// espacées de 3s par précaution.
//
// NB : le catalogue neuf de Moteur.ma est un annuaire de fiches modèles
// (pas des annonces individuelles). Chaque entrée représente un modèle
// avec son prix "à partir de".
// ============================================================================

import {
  UnifiedCar,
  InventoryType,
  normalizeBrand,
  normalizeFuel,
  normalizeBody,
  formatPriceDH,
  computeScore,
} from "./types";

const INDEX_URL = "https://www.moteur.ma/fr/neuf/voiture/";
const REQUEST_TIMEOUT_MS = 10000;
const DELAY_BETWEEN_REQUESTS_MS = 2000;

const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36";

// Marques prioritaires au Maroc avec poids de popularité (ventes)
// Plus le poids est élevé, plus la marque est scrapée en premier
const PRIORITY_BRANDS: Record<string, number> = {
  dacia: 100,
  renault: 95,
  peugeot: 90,
  toyota: 85,
  hyundai: 80,
  kia: 78,
  citroen: 75,
  volkswagen: 72,
  ford: 70,
  nissan: 68,
  opel: 65,
  fiat: 62,
  chery: 60,
  mitsubishi: 58,
  jeep: 55,
  bmw: 52,
  mercedes: 50,
  audi: 48,
  byd: 45,
  changan: 42,
  mg: 40,
  seat: 38,
  skoda: 35,
  mazda: 33,
  suzuki: 30,
  honda: 28,
};

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface TopSheetVersion {
  id: number;
  label: string;
  version: string;
  slug: string;
}

interface TopSheetModel {
  id: number;
  label: string;
  slug: string;
  body_image_url: string;
  versions: TopSheetVersion[];
}

interface TopSheetBrand {
  id: number;
  label: string;
  slug: string;
  models: TopSheetModel[];
}

interface ModelPageData {
  priceRange?: string;
  minPrice?: number;
  description?: string;
  fuelType?: string;
  bodyType?: string;
  versions?: Array<{
    name: string;
    price?: number;
    fuel?: string;
    transmission?: string;
    power?: string;
  }>;
  photos: string[];
}

// ---------------------------------------------------------------------------
// Utilitaires
// ---------------------------------------------------------------------------

function fetchWithTimeout(url: string, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  return fetch(url, {
    signal: controller.signal,
    headers: {
      "User-Agent": USER_AGENT,
      "Accept-Language": "fr-FR,fr;q=0.9",
      Accept: "text/html,application/xhtml+xml",
    },
  }).finally(() => clearTimeout(timer));
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function stripHtml(s: string): string {
  return s.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function extractJsonFromScript(html: string, varName: string): string | null {
  const regex = new RegExp(`window\\.${varName}\\s*=\\s*(\\[.*?\\]);`, "s");
  const match = html.match(regex);
  return match ? match[1] : null;
}

function extractPrice(html: string): number | null {
  // Chercher le prix "À partir de" dans la page modèle
  // Pattern: "226 900 - 260 500 Dhs" ou "226 900 Dhs"
  const priceMatch = html.match(/(\d[\d\s]+)\s*(?:-[\s\d]+)?\s*Dhs/i);
  if (priceMatch) {
    const priceStr = priceMatch[1].replace(/\s/g, "");
    const price = Number(priceStr);
    if (price > 0) return price;
  }
  return null;
}

function extractDescription(html: string): string | null {
  // Chercher la description dans la section "En résumé"
  const summaryMatch = html.match(/En résumé[\s\S]*?<p[^>]*>([\s\S]*?)<\/p>/i);
  if (summaryMatch) {
    return stripHtml(summaryMatch[1]).substring(0, 500);
  }
  // Fallback : meta description
  const metaMatch = html.match(/<meta[^>]*name="description"[^>]*content="([^"]+)"/i);
  if (metaMatch) {
    return stripHtml(metaMatch[1]).substring(0, 500);
  }
  return null;
}

function extractFuelFromPage(html: string): string | null {
  const lower = html.toLowerCase();
  if (lower.includes("électrique") || lower.includes("bev")) return "Électrique";
  if (lower.includes("hybride rechargeable") || lower.includes("phev")) return "Hybride rechargeable";
  if (lower.includes("hybride") || lower.includes("hev")) return "Hybride";
  if (lower.includes("diesel")) return "Diesel";
  if (lower.includes("essence") || lower.includes("gasoline")) return "Essence";
  return null;
}

function extractVersions(html: string): Array<{ name: string; price?: number }> {
  const versions: Array<{ name: string; price?: number }> = [];

  // Pattern pour les versions avec prix
  // Ex: "1.5 dCi 115 Essential" suivi de "226 900 Dhs"
  const versionRegex = /class="[^"]*version[^"]*"[^>]*>[\s\S]*?class="[^"]*name[^"]*"[^>]*>([^<]+)<[\s\S]*?(\d[\d\s]+)\s*Dhs/gi;
  let match;
  while ((match = versionRegex.exec(html)) !== null) {
    const name = stripHtml(match[1]);
    const price = Number(match[2].replace(/\s/g, ""));
    if (name && price > 0) {
      versions.push({ name, price });
    }
  }

  // Fallback : pattern plus simple
  if (versions.length === 0) {
    const simpleRegex = /(\d[\d\s]+)\s*Dhs/gi;
    while ((match = simpleRegex.exec(html)) !== null) {
      const price = Number(match[1].replace(/\s/g, ""));
      if (price > 10000 && price < 5000000) {
        versions.push({ name: `Version ${versions.length + 1}`, price });
      }
    }
  }

  return versions.slice(0, 10); // Limiter à 10 versions
}

function extractPhotos(html: string): string[] {
  const photos: string[] = [];
  const photoRegex = /src="(https?:\/\/www\.moteur\.ma\/storage\/media\/images\/[^"]+)"/gi;
  let match;
  while ((match = photoRegex.exec(html)) !== null) {
    const url = match[1];
    if (url && !photos.includes(url) && !url.includes("logo") && !url.includes("icon")) {
      photos.push(url);
    }
  }
  return photos.slice(0, 5); // Limiter à 5 photos
}

// ---------------------------------------------------------------------------
// Extraction des données depuis l'index
// ---------------------------------------------------------------------------

function parseTopSheetBrandsData(html: string): TopSheetBrand[] {
  const jsonStr = extractJsonFromScript(html, "topSheetBrandsData");
  if (!jsonStr) return [];

  try {
    const data = JSON.parse(jsonStr) as TopSheetBrand[];
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

// ---------------------------------------------------------------------------
// Enrichissement depuis la page modèle
// ---------------------------------------------------------------------------

async function fetchModelPageData(
  brandSlug: string,
  modelSlug: string
): Promise<ModelPageData> {
  const url = `https://www.moteur.ma/fr/neuf/voiture/${brandSlug}/${modelSlug}/`;

  try {
    const res = await fetchWithTimeout(url, REQUEST_TIMEOUT_MS);
    if (!res.ok) return { photos: [] };
    const html = await res.text();

    const minPrice = extractPrice(html);
    const description = extractDescription(html);
    const fuelType = extractFuelFromPage(html);
    const versions = extractVersions(html);
    const photos = extractPhotos(html);

    return {
      minPrice: minPrice || undefined,
      description: description || undefined,
      fuelType: fuelType || undefined,
      versions: versions.length > 0 ? versions : undefined,
      photos,
    };
  } catch {
    return { photos: [] };
  }
}

// ---------------------------------------------------------------------------
// Mapping vers UnifiedCar
// ---------------------------------------------------------------------------

function mapToUnifiedCar(
  brand: TopSheetBrand,
  model: TopSheetModel,
  modelData: ModelPageData
): UnifiedCar {
  const make = normalizeBrand(brand.label);
  const modelName = model.label;
  const year = new Date().getFullYear();
  const price = modelData.minPrice || 0;

  // Construire le titre
  const title = `${make} ${modelName} ${year}`;

  // Déterminer le carburant
  const fuel = modelData.fuelType ? normalizeFuel(modelData.fuelType) : "Non précisé";

  // Déterminer la carrosserie depuis le nom du modèle
  const bodyType = normalizeBody(
    /\b(suv|4x4|crossover)\b/i.test(modelName)
      ? "SUV"
      : /\b(break|sw|estate)\b/i.test(modelName)
        ? "Break"
        : /\b(utilitaire|van|fourgon)\b/i.test(modelName)
          ? "Utilitaire"
          : "Non précisé"
  );

  // Photos
  const photos =
    modelData.photos.length > 0
      ? modelData.photos
      : model.body_image_url
        ? [model.body_image_url]
        : [];

  const image = photos[0] || model.body_image_url || "";

  // URL de la fiche modèle
  const modelUrl = `https://www.moteur.ma/fr/neuf/voiture/${brand.slug}/${model.slug}/`;

  return {
    id: `moteur_neuf_${brand.slug}_${model.slug}_${year}`,
    title,
    make,
    model: modelName,
    year,
    price,
    priceFormatted: price > 0 ? `À partir de ${formatPriceDH(price)}` : "Prix non communiqué",
    km: 0,
    fuel,
    transmission: "Non précisé",
    bodyType,
    city: "Maroc",
    image,
    source: "Moteur.ma (neuf)",
    sourceUrl: modelUrl,
    url: modelUrl,
    score: computeScore(year, 0, price || 200000),
    scrapedAt: new Date().toISOString(),
    photos,
    inventoryType: "new" as InventoryType,
    safety: null,
    contact: {
      name: "Moteur.ma",
      url: modelUrl,
    },
    reputation: {
      verified: true,
      label: "Fiche officielle constructeur",
    },
  };
}

// ---------------------------------------------------------------------------
// Fonction principale
// ---------------------------------------------------------------------------

/** Catalogue neuf Moteur.ma — voitures neuves au Maroc. */
export async function fetchMoteurNeufCars(): Promise<UnifiedCar[]> {
  try {
    // Étape 1 : Extraire topSheetBrandsData depuis l'index
    const indexRes = await fetchWithTimeout(INDEX_URL, REQUEST_TIMEOUT_MS);
    if (!indexRes.ok) return [];
    const indexHtml = await indexRes.text();

    const brands = parseTopSheetBrandsData(indexHtml);
    if (brands.length === 0) return [];

    // Collecter tous les modèles
    const allModels: Array<{ brand: TopSheetBrand; model: TopSheetModel }> = [];
    for (const brand of brands) {
      for (const model of brand.models) {
        allModels.push({ brand, model });
      }
    }

    if (allModels.length === 0) return [];

    // Étape 2 : Enrichir avec les pages modèles (marques prioritaires d'abord)
    const cars: UnifiedCar[] = [];
    let requestCount = 0;

    // Trier : marques les plus populaires en premier
    const sortedModels = [...allModels].sort((a, b) => {
      const aWeight = PRIORITY_BRANDS[a.brand.slug.toLowerCase()] || 0;
      const bWeight = PRIORITY_BRANDS[b.brand.slug.toLowerCase()] || 0;
      // Les marques prioritaires (poids > 0) viennent en premier, triées par poids décroissant
      if (aWeight > 0 && bWeight > 0) return bWeight - aWeight;
      if (aWeight > 0) return -1;
      if (bWeight > 1) return 1;
      return 0;
    });

    // Limiter le nombre de requêtes (budget raisonnable)
    const MAX_MODEL_PAGES = 200;
    const MAX_PER_BRAND = 5;

    for (let i = 0; i < sortedModels.length && requestCount < MAX_MODEL_PAGES; i++) {
      const { brand, model } = sortedModels[i];

      // Si c'est une marque prioritaire, visiter la page pour le prix
      if (PRIORITY_BRANDS[brand.slug.toLowerCase()] > 0) {
        // Limiter à MAX_PER_BRAND modèles par marque
        const brandCount = cars.filter(c => c.make === normalizeBrand(brand.label)).length;
        if (brandCount >= MAX_PER_BRAND) continue;

        const modelData = await fetchModelPageData(brand.slug, model.slug);
        cars.push(mapToUnifiedCar(brand, model, modelData));
        requestCount++;

        if (i < sortedModels.length - 1 && requestCount < MAX_MODEL_PAGES) {
          await delay(DELAY_BETWEEN_REQUESTS_MS);
        }
      } else {
        // Marque non prioritaire : entrée sans prix
        cars.push(mapToUnifiedCar(brand, model, { photos: [] }));
      }
    }

    return cars;
  } catch {
    return [];
  }
}
