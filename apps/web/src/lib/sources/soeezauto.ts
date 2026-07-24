import { SourceCollector, UnifiedCar, generateId, computeScore, normalizeBrand } from "./types";

export class SoeezAutoCollector implements SourceCollector {
  name = "SoeezAuto";

  async fetch(): Promise<UnifiedCar[]> {
    try {
      const res = await fetch("https://www.soeezauto.ma/prix", {
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
      console.error("SoeezAuto fetch failed:", err);
      return [];
    }
  }

  private parseHTML(html: string): UnifiedCar[] {
    const cars: UnifiedCar[] = [];

    const brandSections = html.split(/(?=<h[23][^>]*>.*?(?:DACIA|RENAULT|PEUGEOT|TOYOTA|HYUNDAI|KIA|VOLKSWAGEN|BMW|MERCEDES|FORD|FIAT|NISSAN|OPEL|CITROEN|CITROËN|MAZDA|SUZUKI|HONDA|BYD|MG|CHANGAN|CHERY))/i);

    for (const section of brandSections) {
      const brandMatch = section.match(/<h[23][^>]*>(.*?)<\/h[23]>/i);
      if (!brandMatch) continue;

      const brand = brandMatch[1].replace(/<[^>]+>/g, "").trim();
      if (brand.length < 2 || brand.length > 20) continue;

      const priceMatch = section.match(/(\d[\d\s]*\d)\s*(?:MAD|DH)/);
      const price = priceMatch ? parseInt(priceMatch[1].replace(/\s/g, "")) : 0;

      if (price > 0) {
        const modelMatch = section.match(/(?:À partir de|Dès)\s*(\d[\d\s]*\d)/i);
        const modelName = section.match(/<strong>([^<]+)<\/strong>/i);

        const model = modelName ? modelName[1].trim() : brand;
        const year = 2026;

        cars.push({
          id: generateId("soeezauto", brand, model, year, 0, price),
          title: `${brand} ${model} Neuf`,
          make: normalizeBrand(brand),
          model,
          year,
          price,
          priceFormatted: price.toLocaleString("fr-FR") + " DH",
          km: 0,
          fuel: "",
          transmission: "",
          bodyType: "",
          city: "",
          image: "",
          source: "SoeezAuto",
          sourceUrl: "https://www.soeezauto.ma/prix",
          url: "https://www.soeezauto.ma/prix",
          score: 95,
          scrapedAt: new Date().toISOString(),
          photos: [],
        });
      }
    }

    return cars;
  }
}
