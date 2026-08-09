// ============================================================================
// AUTOHALL.MA — CATALOGUE OFFICIEL DU CONCESSIONNAIRE MULTI-MARQUES
// ============================================================================
//
// Source : https://www.autohall.ma — plus gros distributeur automobile
// multi-marques au Maroc (Opel, Ford, DFSK, Nissan, Mitsubishi, Fiat,
// Fuso, Chery, Foton, Seres, Jeep, GAZ, Alfa Romeo, Ford Trucks).
// Réseau de 60+ sites.
//
// Stratégie :
//   1. Index /fr/vehicules-neufs (5 pages) — JSON-LD ItemList pour la
//      liste de base (nom, marque, prix "à partir de", photo, lien).
//   2. Pages modèles individuelles — JSON-LD Product pour descriptions,
//      versions/finitions, options, fiches techniques.
//
// Robots.txt : User-agent: * Allow: / (pas de crawl-delay). Requêtes
// espacées de 2-3s par précaution.
//
// NB : les prix affichés sont des prix "À partir de" (fourchette basse),
// pas le prix exact de chaque configuration. On conserve ce libellé.
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

const SITE_BASE = "https://www.autohall.ma";
const INDEX_URL = `${SITE_BASE}/fr/vehicules-neufs`;
const INDEX_PAGES = 5;
const REQUEST_TIMEOUT_MS = 10000;
const DELAY_BETWEEN_REQUESTS_MS = 2500;

const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36";

// ---------------------------------------------------------------------------
// Types pour le parsing JSON-LD
// ---------------------------------------------------------------------------

interface JsonLdOffer {
  "@type"?: string;
  priceCurrency?: string;
  price?: string;
  itemCondition?: string;
  availability?: string;
  url?: string;
  seller?: { "@type"?: string; name?: string; url?: string };
}

interface JsonLdProduct {
  "@type"?: string;
  name?: string;
  image?: string;
  url?: string;
  description?: string;
  brand?: { "@type"?: string; name?: string };
  model?: string;
  offers?: JsonLdOffer;
}

interface JsonLdItemList {
  "@type"?: string;
  numberOfItems?: number;
  itemListElement?: Array<{
    "@type"?: string;
    position?: number;
    item?: JsonLdProduct;
  }>;
}

// Données de base extraites de l'index
interface AutohallIndexEntry {
  name: string;
  brand: string;
  price: number;
  image: string;
  modelUrl: string;
  monthlyPayment?: string;
}

// Données enrichies depuis la page modèle
interface AutohallModelDetail {
  description?: string;
  versions?: string[];
  photos: string[];
  fuelType?: string;
  bodyType?: string;
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

function extractJsonLd<T>(html: string, type: string): T | null {
  const regex = new RegExp(
    `<script[^>]*type="application/ld\\+json"[^>]*>([\\s\\S]*?)</script>`,
    "gi"
  );
  let match;
  while ((match = regex.exec(html)) !== null) {
    try {
      const parsed = JSON.parse(match[1]);
      // Chercher le type demandé dans @graph ou directement
      if (parsed["@graph"]) {
        for (const item of parsed["@graph"]) {
          if (item["@type"] === type) return item as T;
        }
      }
      if (parsed["@type"] === type) return parsed as T;
    } catch {
      // JSON invalide, on ignore
    }
  }
  return null;
}

function stripHtml(s: string): string {
  return s.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function extractFuelFromDescription(desc: string): string {
  const lower = desc.toLowerCase();
  if (lower.includes("électrique") || lower.includes("electrique") || lower.includes("bev"))
    return "Électrique";
  if (lower.includes("hybride rechargeable") || lower.includes("phev")) return "Hybride rechargeable";
  if (lower.includes("hybride") || lower.includes("hev")) return "Hybride";
  if (lower.includes("diesel")) return "Diesel";
  if (lower.includes("essence") || lower.includes("gasoline")) return "Essence";
  return "Non précisé";
}

function extractBodyFromName(name: string): string {
  const lower = name.toLowerCase();
  if (/\b(suv|4x4|crossover)\b/.test(lower)) return "SUV";
  if (/\b(berline|sedan)\b/.test(lower)) return "Berline";
  if (/\b(compact|c compacte)\b/.test(lower)) return "Compacte";
  if (/\b(citadine|city)\b/.test(lower)) return "Citadine";
  if (/\b(utilitaire|van|fourgon|cargo|pickup)\b/.test(lower)) return "Utilitaire";
  if (/\b(pick[- ]?up)\b/.test(lower)) return "Utilitaire";
  if (/\b(camion)\b/.test(lower)) return "Utilitaire";
  if (/\b(ludospace)\b/.test(lower)) return "Monospace";
  if (/\b(berline)\b/.test(lower)) return "Berline";
  return "Non précisé";
}

// ---------------------------------------------------------------------------
// Extraction de l'index (JSON-LD ItemList)
// ---------------------------------------------------------------------------

function parseIndexPage(html: string): AutohallIndexEntry[] {
  const entries: AutohallIndexEntry[] = [];

  // Extraire le JSON-LD ItemList
  const itemList = extractJsonLd<JsonLdItemList>(html, "ItemList");
  if (itemList?.itemListElement) {
    for (const element of itemList.itemListElement) {
      const product = element.item;
      if (!product) continue;

      const name = (product.name || "").trim();
      const brand = product.brand?.name || "";
      const price = Number(product.offers?.price) || 0;
      const image = (product.image || "").trim();
      const modelUrl = (product.url || "").trim();

      if (!name || !brand || price <= 0) continue;

      entries.push({
        name,
        brand,
        price,
        image,
        modelUrl: modelUrl.startsWith("http") ? modelUrl : `${SITE_BASE}${modelUrl}`,
      });
    }
  }

  // Fallback : parsing HTML si JSON-LD absent
  if (entries.length === 0) {
    const cardRegex = /<div class="model-card">([\s\S]*?)<\/div>\s*<\/div>\s*<\/div>/g;
    let cardMatch;
    while ((cardMatch = cardRegex.exec(html)) !== null) {
      const block = cardMatch[1];
      const name = stripHtml(block.match(/<h3 class="model-name">([^<]+)<\/h3>/)?.[1] || "");
      const priceStr = block.match(/<div class="model-price">([^<]+)<\/div>/)?.[1] || "";
      const price = Number(priceStr.replace(/[^\d]/g, "")) || 0;
      const image = block.match(/<img[^>]*src="([^"]+)"[^>]*>/)?.[1] || "";
      const modelUrl = block.match(/href="([^"]+)"/)?.[1] || "";

      if (!name || price <= 0) continue;

      // Extraire la marque du nom ou du lien
      const brandFromUrl = modelUrl.match(/\/marque\/([^/]+)\//)?.[1] || "";
      const brand =
        brandFromUrl.charAt(0).toUpperCase() + brandFromUrl.slice(1).replace(/-/g, " ");

      entries.push({
        name,
        brand: brand || "Autre",
        price,
        image: image.startsWith("http") ? image : `${SITE_BASE}${image}`,
        modelUrl: modelUrl.startsWith("http") ? modelUrl : `${SITE_BASE}${modelUrl}`,
      });
    }
  }

  return entries;
}

// ---------------------------------------------------------------------------
// Enrichissement depuis la page modèle
// ---------------------------------------------------------------------------

async function fetchModelDetail(modelUrl: string): Promise<AutohallModelDetail> {
  try {
    const res = await fetchWithTimeout(modelUrl, REQUEST_TIMEOUT_MS);
    if (!res.ok) return { photos: [] };
    const html = await res.text();

    // Extraire le JSON-LD Product
    const product = extractJsonLd<JsonLdProduct>(html, "Product");
    const description = product?.description || undefined;

    // Extraire les photos depuis la galerie
    const photos: string[] = [];
    const photoRegex = /<a[^>]*href="([^"]*\/uploads\/[^"]*)"[^>]*class="popup-gallery"/gi;
    let photoMatch;
    while ((photoMatch = photoRegex.exec(html)) !== null) {
      const url = photoMatch[1];
      if (url && !photos.includes(url)) photos.push(url);
    }

    // Fallback : images de la galerie grid
    if (photos.length === 0) {
      const gridRegex = /<img[^>]*src="(https?:\/\/[^"]*\/uploads\/[^"]*)"[^>]*>/gi;
      let gridMatch;
      while ((gridMatch = gridRegex.exec(html)) !== null) {
        const url = gridMatch[1];
        if (url && !photos.includes(url)) photos.push(url);
      }
    }

    // Extraire les versions/finitions depuis les onglets
    const versions: string[] = [];
    const tabRegex = /<button[^>]*class="nav-link[^"]*"[^>]*>([^<]+)<\/button>/gi;
    let tabMatch;
    while ((tabMatch = tabRegex.exec(html)) !== null) {
      const version = stripHtml(tabMatch[1]);
      if (version && version !== "Voir plus" && !versions.includes(version)) {
        versions.push(version);
      }
    }

    // Extraire le carburant depuis la description
    const fuelType = description ? extractFuelFromDescription(description) : undefined;

    return {
      description,
      versions: versions.length > 0 ? versions : undefined,
      photos,
      fuelType,
    };
  } catch {
    return { photos: [] };
  }
}

// ---------------------------------------------------------------------------
// Mapping vers UnifiedCar
// ---------------------------------------------------------------------------

function mapToUnifiedCar(
  entry: AutohallIndexEntry,
  detail: AutohallModelDetail
): UnifiedCar {
  const make = normalizeBrand(entry.brand);
  const model = entry.name;
  const price = entry.price;
  const year = new Date().getFullYear();

  // Déterminer le body type depuis le nom
  const bodyType = normalizeBody(extractBodyFromName(entry.name));

  // Déterminer le fuel depuis le détail
  const fuel = detail.fuelType ? normalizeFuel(detail.fuelType) : "Non précisé";

  // Photos : d'abord celles du détail, sinon celle de l'index
  const photos =
    detail.photos.length > 0
      ? detail.photos
      : entry.image
        ? [entry.image]
        : [];

  const image = photos[0] || entry.image || "";

  // Construire le titre avec versions si disponibles
  const versionStr =
    detail.versions && detail.versions.length > 0
      ? ` ${detail.versions.join(" / ")}`
      : "";
  const title = `${make} ${model}${versionStr} ${year}`;

  return {
    id: `autohall_${make.toLowerCase()}_${model.toLowerCase().replace(/\s+/g, "_")}_${year}`,
    title,
    make,
    model,
    year,
    price,
    priceFormatted: `À partir de ${formatPriceDH(price)}`,
    km: 0,
    fuel,
    transmission: "Non précisé",
    bodyType,
    city: "Maroc",
    image,
    source: "AutoHall.ma (catalogue)",
    sourceUrl: entry.modelUrl,
    url: entry.modelUrl,
    score: computeScore(year, 0, price),
    scrapedAt: new Date().toISOString(),
    photos,
    inventoryType: "new" as InventoryType,
    safety: null,
    contact: {
      name: "Auto Hall",
      url: SITE_BASE,
    },
    reputation: {
      verified: true,
      label: "Concessionnaire officiel · Neuf",
    },
  };
}

// ---------------------------------------------------------------------------
// Fonction principale
// ---------------------------------------------------------------------------

/** Catalogue officiel AutoHall.ma — véhicules neufs au Maroc. */
export async function fetchAutohallCars(): Promise<UnifiedCar[]> {
  try {
    // Étape 1 : Scrape l'index (5 pages) pour la liste de base
    const allEntries: AutohallIndexEntry[] = [];

    for (let page = 1; page <= INDEX_PAGES; page++) {
      const url = page === 1 ? INDEX_URL : `${INDEX_URL}/${page}`;
      try {
        const res = await fetchWithTimeout(url, REQUEST_TIMEOUT_MS);
        if (!res.ok) break;
        const html = await res.text();
        const entries = parseIndexPage(html);
        allEntries.push(...entries);
      } catch {
        break;
      }
      if (page < INDEX_PAGES) await delay(DELAY_BETWEEN_REQUESTS_MS);
    }

    if (allEntries.length === 0) return [];

    // Dédupliquer par URL
    const seen = new Set<string>();
    const uniqueEntries = allEntries.filter((e) => {
      if (seen.has(e.modelUrl)) return false;
      seen.add(e.modelUrl);
      return true;
    });

    // Étape 2 : Enrichir avec les pages modèles individuelles
    const cars: UnifiedCar[] = [];

    for (let i = 0; i < uniqueEntries.length; i++) {
      const entry = uniqueEntries[i];
      const detail = await fetchModelDetail(entry.modelUrl);
      cars.push(mapToUnifiedCar(entry, detail));

      // Délai entre les requêtes (sauf après la dernière)
      if (i < uniqueEntries.length - 1) {
        await delay(DELAY_BETWEEN_REQUESTS_MS);
      }
    }

    return cars;
  } catch {
    return [];
  }
}
