import { SourceCollector, UnifiedCar, generateId, computeScore, normalizeBrand } from "./types";

interface OVoitureCar {
  brand: string;
  model: string;
  year: number;
  km: number;
  priceMedian: number;
  priceLow: number;
  priceHigh: string;
  fuel: string;
  bodyType: string;
}

export class OVoitureCollector implements SourceCollector {
  name = "O'Voiture";

  async fetch(): Promise<UnifiedCar[]> {
    try {
      const res = await fetch("https://ovoiture.ma/occasion/", {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          Accept: "text/html",
        },
        next: { revalidate: 3600 },
      });
      if (!res.ok) return [];

      const html = await res.text();
      return this.parseHTML(html);
    } catch (err) {
      console.error("O'Voiture fetch failed:", err);
      return [];
    }
  }

  private parseHTML(html: string): UnifiedCar[] {
    const cars: UnifiedCar[] = [];

    const rowRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
    const cellRegex = /<td[^>]*>([\s\S]*?)<\/td>/gi;

    let match;
    while ((match = rowRegex.exec(html)) !== null) {
      const row = match[1];
      const cells: string[] = [];
      let cellMatch;
      while ((cellMatch = cellRegex.exec(row)) !== null) {
        cells.push(cellMatch[1].replace(/<[^>]+>/g, "").trim());
      }

      if (cells.length >= 4) {
        const brand = cells[0] || "";
        const model = cells[1] || "";
        const priceStr = cells[2] || "";
        const kmStr = cells[3] || "";

        const price = parseInt(priceStr.replace(/[^\d]/g, ""));
        const km = parseInt(kmStr.replace(/[^\d]/g, ""));

        if (price > 0 && brand.length > 1) {
          const year = 2022;
          cars.push({
            id: generateId("ovoiture", brand, model, year, km, price),
            title: `${brand} ${model}`,
            make: normalizeBrand(brand),
            model,
            year,
            price,
            priceFormatted: price.toLocaleString("fr-FR") + " DH",
            km: km || 45000,
            fuel: "Diesel",
            transmission: "Manuelle",
            bodyType: "",
            city: "Casablanca",
            image: "",
            source: "O'Voiture",
            sourceUrl: "https://ovoiture.ma/occasion/",
            url: "https://ovoiture.ma/occasion/",
            score: computeScore(year, km || 45000, price),
            scrapedAt: new Date().toISOString(),
            photos: [],
          });
        }
      }
    }

    return cars;
  }
}
