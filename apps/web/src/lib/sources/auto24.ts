// ============================================================================
// AUTO24.MA — ANNONCES OCCASION MAROC (SCRAPING)
// ============================================================================
//
// Source : https://www.auto24.ma — marketplace marocaine de voitures occasion.
// Pas d'API JSON publique : extraction depuis le HTML des pages de recherche.
//
// NB : scraping non officiel — retourne une liste vide si le site change.
// ============================================================================

import {
  UnifiedCar,
  normalizeBrand,
  formatPriceDH,
  computeScore,
} from "./types";

const BASE_URL = "https://www.auto24.ma";
const SEARCH_URL = `${BASE_URL}/voitures-occasion`;
const PAGES_TO_SCRAPE = 15;
const PAGE_DELAY_MS = 1000;
const REQUEST_TIMEOUT_MS = 8000;

const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36";

interface Auto24Item {
  id: string;
  title: string;
  price: number;
  city: string;
  image: string;
  url: string;
  year?: number;
  km?: number;
  fuel?: string;
}

async function fetchPage(pageNum: number): Promise<string> {
  const url = pageNum === 1 ? SEARCH_URL : `${SEARCH_URL}?page=${pageNum}`;
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

function extractItems(html: string): Auto24Item[] {
  const items: Auto24Item[] = [];

  const jsonLdRegex = /<script type="application\/ld\+json">([\s\S]*?)<\/script>/gi;
  let match: RegExpExecArray | null;

  while ((match = jsonLdRegex.exec(html)) !== null) {
    try {
      const data = JSON.parse(match[1]);
      const listings = Array.isArray(data) ? data : [data];
      for (const item of listings) {
        if (item["@type"] === "Car" || item["@type"] === "Product") {
          const title = item.name || "";
          const price = item.offers?.price || item.offers?.lowPrice || 0;
          const url = item.url || "";
          const image = item.image || "";
          if (title && price > 0) {
            const idMatch = url.match(/\/(\d+)/);
            items.push({
              id: idMatch ? idMatch[1] : `auto24_${items.length}`,
              title,
              price: Number(price),
              city: item.seller?.address?.addressLocality || "",
              image: Array.isArray(image) ? image[0] : image,
              url: url.startsWith("http") ? url : `${BASE_URL}${url}`,
            });
          }
        }
      }
    } catch { /* skip */ }
  }

  if (items.length > 0) return items;

  const titleRegex = /<h[23][^>]*>([\s\S]*?)<\/h[23]>/gi;
  const priceRegex = /<span[^>]*class="[^"]*price[^"]*"[^>]*>([\s\S]*?)<\/span>/gi;
  const linkRegex = /<a[^>]*href="(\/voiture[^"]*\/\d+)"[^>]*>/gi;
  const imgRegex = /<img[^>]*src="([^"]*\.(?:jpg|jpeg|png|webp)[^"]*)"[^>]*alt="[^"]*"/gi;

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

    items.push({
      id: `auto24_${links[i]?.match(/\/(\d+)$/)?.[1] || i}`,
      title: titles[i],
      price,
      city: "",
      image: imgs[i] || "",
      url: links[i]?.startsWith("http") ? links[i] : `${BASE_URL}${links[i] || ""}`,
    });
  }

  return items;
}

function parseTitle(title: string): { make: string; model: string; year: number } {
  const yearMatch = title.match(/\b(20[0-2]\d|19\d\d)\b/);
  const year = yearMatch ? parseInt(yearMatch[1], 10) : 0;

  const brands = [
    "Toyota", "Dacia", "Renault", "Peugeot", "Hyundai", "Kia", "Volkswagen", "VW",
    "Mercedes", "BMW", "Audi", "Ford", "Fiat", "Nissan", "Opel", "Citroën", "Citroen",
    "Škoda", "Skoda", "Seat", "Mazda", "Suzuki", "Honda", "Mitsubishi", "Volvo",
    "Jeep", "Chevrolet", "Lexus", "Porsche", "BYD", "Changan", "Chery", "Haval",
    "Geely", "MG", "GWM", "Omoda", "Jaecoo", "EXEED",
  ];

  let make = "";
  let model = "";
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
  if (/\bdiesel\b/.test(lower)) return "Diesel";
  if (/\bessence\b/.test(lower)) return "Essence";
  if (/\bhybride\b/.test(lower)) return "Hybride";
  if (/\belectrique\b/.test(lower)) return "Électrique";
  return "Non précisé";
}

function mapItem(item: Auto24Item): UnifiedCar | null {
  const { make, model, year } = parseTitle(item.title);
  const km = extractKm(item.title);
  const fuel = extractFuel(item.title);

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
    transmission: "Non précisé",
    bodyType: "Non précisé",
    city: item.city || "Maroc",
    image: item.image,
    source: "Auto24.ma (occasion)",
    sourceUrl: item.url,
    url: item.url,
    score: computeScore(year || 2020, km, item.price),
    scrapedAt: new Date().toISOString(),
    photos: item.image ? [item.image] : [],
    inventoryType: "used",
    safety: null,
  };
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Annonces occasion depuis Auto24.ma */
export async function fetchAuto24Cars(): Promise<UnifiedCar[]> {
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
