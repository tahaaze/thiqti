import { UnifiedCar, SourceCollector, generateId, computeScore, normalizeFuel, normalizeBrand, normalizeBody } from "./types";

const MOTEUR_BASE = "https://www.moteur.ma";

interface MoteurListing {
  title: string;
  price: number;
  year: number;
  km: number;
  fuel: string;
  transmission: string;
  city: string;
  url: string;
  image: string;
}

function parsePrice(text: string): number {
  const cleaned = text.replace(/[^\d]/g, "");
  const num = parseInt(cleaned);
  return isNaN(num) ? 0 : num;
}

function parseKm(text: string): number {
  const cleaned = text.replace(/[^\d]/g, "");
  const num = parseInt(cleaned);
  return isNaN(num) ? 0 : num;
}

function extractBrandModel(title: string): { make: string; model: string } {
  const knownBrands = [
    "Renault", "Peugeot", "Citroën", "Citroen", "Dacia", "Toyota", "Hyundai",
    "Kia", "Volkswagen", "BMW", "Mercedes", "Mercedes-Benz", "Audi", "Ford",
    "Fiat", "Nissan", "Opel", "Seat", "Škoda", "Skoda", "Mazda", "Suzuki",
    "Honda", "Mitsubishi", "Volvo", "Jeep", "Chevrolet", "Lexus", "Mini",
    "Alfa Romeo", "Cupra", "DS", "Land Rover", "Porsche", "MG", "BYD",
    "Changan", "Chery", "DFSK", "JAC", "Geely", "GAC", "BAIC", "Haval",
    "Omoda", "Jaecoo", "EXEED", "XPENG", "Dongfeng", "GWM", "Jetour",
    "KGM", "Leapmotor", "Deepal", "Exeed", "Smart", "Rox",
  ];

  for (const brand of knownBrands) {
    if (title.toLowerCase().startsWith(brand.toLowerCase())) {
      const model = title.slice(brand.length).trim();
      return { make: brand, model: model || title };
    }
  }

  const parts = title.split(/\s+/);
  if (parts.length >= 2) {
    return { make: parts[0], model: parts.slice(1).join(" ") };
  }
  return { make: title, model: "" };
}

export class MoteurCollector implements SourceCollector {
  name = "Moteur.ma";

  async fetch(): Promise<UnifiedCar[]> {
    const allCars: UnifiedCar[] = [];
    const pagesToFetch = [1, 2, 3, 4, 5];

    for (const page of pagesToFetch) {
      try {
        const url = `${MOTEUR_BASE}/fr/voiture/achat-voiture-occasion/?page=${page}`;
        const res = await fetch(url, {
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            Accept: "text/html,application/xhtml+xml",
            "Accept-Language": "fr-FR,fr;q=0.9",
          },
          next: { revalidate: 600 },
        });
        if (!res.ok) continue;

        const html = await res.text();
        const listings = this.parseHTML(html);
        allCars.push(...listings);
      } catch (err) {
        console.error(`Moteur.ma page ${page} failed:`, err);
      }
    }

    return allCars;
  }

  private parseHTML(html: string): UnifiedCar[] {
    const cars: UnifiedCar[] = [];

    const cardRegex = /<div[^>]*class="[^"]*annonce-card[^"]*"[^>]*>([\s\S]*?)<\/div>\s*<\/div>\s*<\/div>/gi;
    const linkRegex = /href="(\/fr\/voiture[^"]*)"/i;
    const titleRegex = /<h[23][^>]*>([^<]+)<\/h[23]>/i;
    const priceRegex = /(\d[\d\s,.]*)\s*(?:Dhs|MAD|DH)/i;
    const yearRegex = /(20[0-2]\d)/;
    const kmRegex = /(\d[\d\s]*)\s*km/i;
    const fuelRegex = /(Essence|Diesel|Hybride|Electrique|Électrique)/i;
    const imgRegex = /src="([^"]*(?:jpg|jpeg|png|webp)[^"]*)"/i;

    const sections = html.split(/(?=class="[^"]*annonce)/i);

    for (const section of sections) {
      try {
        const linkMatch = linkRegex.exec(section);
        const titleMatch = titleRegex.exec(section);
        const priceMatch = priceRegex.exec(section);
        const yearMatch = yearRegex.exec(section);
        const kmMatch = kmRegex.exec(section);
        const fuelMatch = fuelRegex.exec(section);
        const imgMatch = imgRegex.exec(section);

        if (!titleMatch) continue;

        const rawTitle = titleMatch[1].trim();
        const { make, model } = extractBrandModel(rawTitle);
        const year = yearMatch ? parseInt(yearMatch[1]) : 2020;
        const price = priceMatch ? parsePrice(priceMatch[1]) : 0;
        const km = kmMatch ? parseKm(kmMatch[1]) : 0;

        if (price <= 0 || make.length < 2) continue;

        const cityMatch = section.match(/(?:Casablanca|Rabat|Marrakech|Fès|Tanger|Agadir|Meknès|Oujda|Kénitra|Tétouan|Nador|El Jadida)/i);

        cars.push({
          id: generateId("moteur", make, model, year, km, price),
          title: rawTitle,
          make: normalizeBrand(make),
          model,
          year,
          price,
          priceFormatted: price.toLocaleString("fr-FR") + " DH",
          km,
          fuel: normalizeFuel(fuelMatch ? fuelMatch[1] : ""),
          transmission: section.includes("Automatique") ? "Automatique" : "Manuelle",
          bodyType: "",
          city: cityMatch ? cityMatch[0] : "Casablanca",
          image: imgMatch ? (imgMatch[1].startsWith("http") ? imgMatch[1] : `${MOTEUR_BASE}${imgMatch[1]}`) : "",
          source: "Moteur.ma",
          sourceUrl: linkMatch ? `${MOTEUR_BASE}${linkMatch[1]}` : `${MOTEUR_BASE}/fr/voiture/`,
          url: linkMatch ? `${MOTEUR_BASE}${linkMatch[1]}` : `${MOTEUR_BASE}/fr/voiture/`,
          score: computeScore(year, km, price),
          scrapedAt: new Date().toISOString(),
          photos: [],
        });
      } catch {
        continue;
      }
    }

    return cars;
  }
}
