// ============================================================================
// AVITO.MA — PLACE DE MARCHE MAROCAINE (SCRAPING ANNONCES VOITURES)
// ============================================================================
//
// Source : https://www.avito.ma — rubrique voitures occasion.
// La plus grande plateforme de petites annonces au Maroc avec des milliers
// d'annonces de voitures. Pas d'API JSON publique : extraction depuis le HTML.
//
// NB : scraping non officiel — si Avito change son HTML, cette source
// retourne simplement une liste vide.
// ============================================================================

import {
  UnifiedCar,
  normalizeBrand,
  formatPriceDH,
  computeScore,
} from "./types";

const BASE_URL = "https://www.avito.ma";
const SEARCH_URL = `${BASE_URL}/voitures`;
const PAGES_TO_SCRAPE = 20;
const PAGE_DELAY_MS = 800;
const REQUEST_TIMEOUT_MS = 8000;

const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36";

interface AvitoItem {
  id: string;
  title: string;
  price: number;
  city: string;
  image: string;
  photos: string[];
  url: string;
  year?: number;
  km?: number;
  fuel?: string;
  transmission?: string;
}

async function fetchPage(pageNum: number): Promise<string> {
  const url = pageNum === 1 ? SEARCH_URL : `${SEARCH_URL}?o=${pageNum}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": USER_AGENT, "Accept-Language": "fr-FR,fr;q=0.9" },
      signal: controller.signal,
    });
    if (!res.ok) return "";
    return await res.text();
  } catch {
    return "";
  } finally {
    clearTimeout(timer);
  }
}

function extractItems(html: string): AvitoItem[] {
  const items: AvitoItem[] = [];

  const jsonLdRegex = /<script type="application\/ld\+json">([\s\S]*?)<\/script>/gi;

  let match: RegExpExecArray | null;

  while ((match = jsonLdRegex.exec(html)) !== null) {
    try {
      const data = JSON.parse(match[1]);
      if (data["@type"] === "Product" || data["@type"] === "Car") {
        const title = data.name || "";
        const price = data.offers?.price || data.offers?.lowPrice || 0;
        const url = data.url || "";
        const image = data.image || "";
        const photos = Array.isArray(image) ? image.filter(Boolean) : image ? [image] : [];

        if (title && price > 0) {
          const idMatch = url.match(/\/(\d+)/);
          items.push({
            id: idMatch ? idMatch[1] : `avito_${items.length}`,
            title,
            price: Number(price),
            city: data.seller?.address?.addressLocality || "",
            image: photos[0] || "",
            photos,
            url: url.startsWith("http") ? url : `${BASE_URL}${url}`,
          });
        }
      }
    } catch { /* skip malformed JSON-LD */ }
  }

  if (items.length > 0) return items;

  const titleRegex = /<h2[^>]*>([\s\S]*?)<\/h2>/gi;
  const priceRegex = /<span[^>]*class="[^"]*price[^"]*"[^>]*>([\s\S]*?)<\/span>/gi;
  const linkRegex = /<a[^>]*href="(\/voitures\/[^"]*\/\d+)"[^>]*>/gi;
  const imgRegex = /<img[^>]*src="([^"]*\.(?:jpg|jpeg|png|webp)[^"]*)"[^>]*data-testid="[^"]*item[^"]*"/gi;

  const titles: string[] = [];
  const prices: string[] = [];
  const links: string[] = [];
  const imgs: string[] = [];

  while ((match = titleRegex.exec(html)) !== null) {
    const text = match[1].replace(/<[^>]+>/g, "").trim();
    if (text.length > 5 && text.length < 200) titles.push(text);
  }
  while ((match = priceRegex.exec(html)) !== null) {
    const text = match[1].replace(/<[^>]+>/g, "").trim();
    if (text) prices.push(text);
  }
  while ((match = linkRegex.exec(html)) !== null) {
    links.push(match[1]);
  }
  while ((match = imgRegex.exec(html)) !== null) {
    imgs.push(match[1]);
  }

  const count = Math.min(titles.length, prices.length, links.length);
  for (let i = 0; i < count; i++) {
    const priceText = prices[i].replace(/[^\d]/g, "");
    const price = parseInt(priceText, 10);
    if (!price || price < 5000) continue;

    const title = titles[i];
    const link = links[i];
    const img = imgs[i] || "";

    const fullImg = img.startsWith("http") ? img : img ? `${BASE_URL}${img}` : "";

    items.push({
      id: `avito_${link.match(/\/(\d+)$/)?.[1] || i}`,
      title,
      price,
      city: "",
      image: fullImg,
      photos: fullImg ? [fullImg] : [],
      url: link.startsWith("http") ? link : `${BASE_URL}${link}`,
    });
  }

  return items;
}

function parseTitle(title: string): { make: string; model: string; year: number } {
  const yearMatch = title.match(/\b(20[0-2]\d|19\d\d)\b/);
  const year = yearMatch ? parseInt(yearMatch[1], 10) : 0;

  let make = "";
  let model = "";

  const brands = [
    "Toyota", "Dacia", "Renault", "Peugeot", "Hyundai", "Kia", "Volkswagen", "VW",
    "Mercedes", "BMW", "Audi", "Ford", "Fiat", "Nissan", "Opel", "Citroën", "Citroen",
    "Škoda", "Skoda", "Seat", "Mazda", "Suzuki", "Honda", "Mitsubishi", "Volvo",
    "Jeep", "Chevrolet", "Lexus", "Porsche", "Land Rover", "Range Rover", "Jaguar",
    "Subaru", "Smart", "Tesla", "BYD", "Changan", "Chery", "Haval", "Geely", "DFSK",
    "MG", "GWM", "Omoda", "Jaecoo", "EXEED",
  ];

  const lower = title.toLowerCase();
  for (const b of brands) {
    if (lower.includes(b.toLowerCase())) {
      make = b;
      const afterBrand = title.substring(lower.indexOf(b.toLowerCase()) + b.length).trim();
      const modelMatch = afterBrand.match(/^(\S+)/);
      model = modelMatch ? modelMatch[1] : "";
      break;
    }
  }

  if (!make) {
    const words = title.split(/\s+/);
    make = words[0] || "";
    model = words[1] || "";
  }

  return { make: normalizeBrand(make), model, year };
}

function extractKm(title: string): number {
  const kmMatch = title.match(/(\d[\d\s]*)\s*(?:km|kms)/i);
  if (kmMatch) return parseInt(kmMatch[1].replace(/\s/g, ""), 10);
  return 0;
}

function extractFuel(title: string): string {
  const lower = title.toLowerCase();
  if (/\bdiesel\b|dizel/.test(lower)) return "Diesel";
  if (/\bessence\b/.test(lower)) return "Essence";
  if (/\bhybride\b|hybrid/.test(lower)) return "Hybride";
  if (/\belectrique\b|electrique|ev\b/.test(lower)) return "Électrique";
  return "Non précisé";
}

function extractTransmission(title: string): string {
  const lower = title.toLowerCase();
  if (/\bauto(?:matique)?\b/.test(lower)) return "Automatique";
  if (/\bmanuelle?\b|meca(?:nique)?\b/.test(lower)) return "Manuelle";
  return "Non précisé";
}

function mapItem(item: AvitoItem): UnifiedCar | null {
  const { make, model, year } = parseTitle(item.title);
  const km = extractKm(item.title);
  const fuel = extractFuel(item.title);
  const transmission = extractTransmission(item.title);

  if (!make || item.price <= 0) return null;

  return {
    id: item.id,
    title: item.title,
    make,
    model: model || "Non précisé",
    year: year || new Date().getFullYear(),
    price: item.price,
    priceFormatted: formatPriceDH(item.price),
    km,
    fuel,
    transmission,
    bodyType: "Non précisé",
    city: item.city || "Maroc",
    image: item.image,
    source: "Avito.ma (annonces)",
    sourceUrl: item.url,
    url: item.url,
    score: computeScore(year || 2020, km, item.price),
    scrapedAt: new Date().toISOString(),
    photos: item.photos.length > 0 ? item.photos : item.image ? [item.image] : [],
    inventoryType: "used",
    safety: null,
  };
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Annonces occasion depuis Avito.ma */
export async function fetchAvitoCars(): Promise<UnifiedCar[]> {
  try {
    const allCars: UnifiedCar[] = [];
    const pagePromises: Promise<UnifiedCar[]>[] = [];

    for (let page = 1; page <= PAGES_TO_SCRAPE; page++) {
      pagePromises.push(
        fetchPage(page)
          .then((html) => {
            if (!html) return [];
            const items = extractItems(html);
            return items.map(mapItem).filter((c): c is UnifiedCar => c !== null);
          })
          .catch(() => [] as UnifiedCar[])
      );

      if (page % 5 === 0) {
        await sleep(PAGE_DELAY_MS);
      }
    }

    const results = await Promise.all(pagePromises);
    for (const r of results) allCars.push(...r);
    return allCars;
  } catch {
    return [];
  }
}
