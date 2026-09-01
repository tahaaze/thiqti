// ============================================================================
// AUTERA.MA — PLACE DE MARCHE MAROCAINE (API JSON OFFICIELLE DU SITE)
// ============================================================================
//
// Source : https://autera.ma — endpoint public https://autera.ma/api/listings
// (gratuit, sans clé). Vraies annonces d'occasion au Maroc : prix MAD, km,
// ville, photos réelles, statut de vérification, badge de confiance, nombre de
// vues et coordonnées du vendeur (téléphone). C'est la source la plus proche
// d'un "MarketCheck marocain" : données réelles + réputation réelle.
//
// Filtres pris en charge par l'API : limit / skip (pagination),
// manufacturer / location / search.
// ============================================================================

import {
  UnifiedCar,
  normalizeBrand,
  normalizeFuel,
  formatPriceDH,
  computeScore,
} from "./types";
import { telHref, whatsappHref, displayPhone } from "./contact";

const API_BASE = "https://autera.ma/api/listings";
const LISTING_BASE = "https://autera.ma/listings";
const MAX_LISTINGS = 200;
const PAGE_SIZE = 50;
const TIMEOUT_MS = 12000;

interface AuteraListing {
  _id?: string;
  manufacturer?: string;
  model?: string;
  description?: string;
  year?: number;
  mileage?: number;
  transmission?: string;
  location?: string;
  fuelType?: string;
  price?: number;
  images?: string[];
  status?: string;
  verificationStatus?: string;
  trustBadge?: boolean;
  views?: number;
  slug?: string;
  seller?: {
    username?: string;
    phone?: string;
  };
}

interface AuteraResponse {
  data?: {
    listings?: AuteraListing[];
    pagination?: { total?: number };
  };
}

function mapListing(l: AuteraListing): UnifiedCar | null {
  const make = normalizeBrand(l.manufacturer || "");
  const model = (l.model || "").trim();
  const year = Number(l.year) || 0;
  const price = Number(l.price) || 0;
  const km = Number(l.mileage) || 0;
  const photos = (l.images || []).filter(Boolean);
  if (!make || !model || year <= 0 || price <= 0 || photos.length === 0) return null;

  const phone = l.seller?.phone;
  const slug = l.slug || "";
  const listingUrl = slug ? `${LISTING_BASE}/${slug}` : "https://autera.ma/listings";
  const verified = l.verificationStatus === "verified";

  return {
    id: `autera_${l._id || slug}`,
    title: `${make} ${model} ${year}`,
    make,
    model,
    year,
    price,
    priceFormatted: formatPriceDH(price),
    km,
    fuel: normalizeFuel(l.fuelType || "Non précisé"),
    transmission:
      l.transmission === "automatic" || l.transmission === "auto"
        ? "Automatique"
        : l.transmission === "manual" || l.transmission === "manuelle"
          ? "Manuelle"
          : "Non précisé",
    bodyType: "Non précisé",
    city: (l.location || "Maroc").replace(/^./, (c) => c.toUpperCase()),
    image: photos[0],
    source: "Autera.ma (API)",
    sourceUrl: listingUrl,
    url: listingUrl,
    score: computeScore(year, km, price),
    scrapedAt: new Date().toISOString(),
    photos,
    inventoryType: "used",
    safety: null,
    contact: {
      name: l.seller?.username || "Vendeur Autera",
      phone: displayPhone(phone),
      phoneHref: telHref(phone),
      whatsappHref: whatsappHref(phone),
      url: listingUrl,
    },
    reputation: {
      verified,
      trustBadge: Boolean(l.trustBadge),
      views: Number(l.views) || 0,
      label: verified ? "Annonce vérifiée" : "Annonce récente",
    },
  };
}

async function fetchWithTimeout(url: string, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

/** Vraies annonces d'occasion marocaines d'Autera.ma. */
export async function fetchAuteraCars(): Promise<UnifiedCar[]> {
  try {
    const allCars: UnifiedCar[] = [];
    const pages = Math.ceil(MAX_LISTINGS / PAGE_SIZE);
    const fetches = Array.from({ length: pages }, (_, i) =>
      fetchWithTimeout(`${API_BASE}?limit=${PAGE_SIZE}&skip=${i * PAGE_SIZE}`, TIMEOUT_MS)
        .then(async (res) => {
          if (!res.ok) return [];
          const data = (await res.json()) as AuteraResponse;
          const listings = data.data?.listings;
          if (!Array.isArray(listings)) return [];
          return listings.map(mapListing).filter((c): c is UnifiedCar => c !== null);
        })
        .catch(() => [] as UnifiedCar[])
    );
    const results = await Promise.all(fetches);
    for (const r of results) allCars.push(...r);
    return allCars;
  } catch {
    return [];
  }
}
