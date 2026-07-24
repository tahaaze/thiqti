import { UnifiedCar, SourceCollector, generateId, computeScore, normalizeFuel, normalizeBrand } from "./types";

const AUTO24_API = "https://api.auto24.ma/api/cars";

interface Auto24Car {
  _id: string;
  name: string;
  modelYear: string;
  price: number;
  mileage: number;
  transmission: string;
  fuelType: string | { fuelType?: string; details?: { lang: string; fuelType: string }[] };
  bodyType: string | { details?: { lang: string; bodyType: string }[]; slug?: string };
  brand: { brand: string; slug?: string } | string;
  model: { model: string } | string;
  exteriorColor: string | { details?: { lang: string; color: string }[] };
  images: string;
  slug: string;
  status: string;
}

function extract(car: Auto24Car, field: string): string {
  const val = (car as any)[field];
  if (typeof val === "string") return val;
  if (val?.brand) return String(val.brand);
  if (val?.model) return String(val.model);
  if (val?.fuelType) return String(val.fuelType);
  if (val?.bodyType) return String(val.bodyType);
  if (val?.details?.[0]) return String(Object.values(val.details[0])[0] || "");
  return "";
}

function extractImages(car: Auto24Car): string[] {
  try {
    const images = typeof car.images === "string" ? JSON.parse(car.images) : car.images;
    if (Array.isArray(images)) return images.map((img: string) => `https://api.auto24.ma/${img}`);
  } catch {}
  return [];
}

export class Auto24Collector implements SourceCollector {
  name = "Auto24";

  async fetch(): Promise<UnifiedCar[]> {
    try {
      const res = await fetch(AUTO24_API, {
        headers: {
          "User-Agent": "Mozilla/5.0",
          Accept: "application/json",
          Origin: "https://auto24.ma",
          Referer: "https://auto24.ma/",
        },
        next: { revalidate: 300 },
      });
      if (!res.ok) throw new Error(`Auto24 API: ${res.status}`);
      const data = await res.json();
      const cars: Auto24Car[] = data.cars || [];

      return cars
        .filter((c) => c.status === "online" && c.price > 0)
        .map((car) => {
          const make = normalizeBrand(extract(car, "brand"));
          const model = extract(car, "model");
          const year = parseInt(car.modelYear || "2022");
          const images = extractImages(car);
          const price = car.price;

          return {
            id: generateId("auto24", make, model, year, car.mileage || 0, price),
            title: car.name || `${make} ${model}`,
            make,
            model,
            year,
            price,
            priceFormatted: price.toLocaleString("fr-FR") + " DH",
            km: car.mileage || 0,
            fuel: normalizeFuel(extract(car, "fuelType")),
            transmission: extract(car, "transmission") || "Manuelle",
            bodyType: "",
            city: "Casablanca",
            image: images[0] || "",
            source: "Auto24",
            sourceUrl: `https://auto24.ma/cars/${car.slug}`,
            url: `https://auto24.ma/cars/${car.slug}`,
            score: computeScore(year, car.mileage || 0, price),
            scrapedAt: new Date().toISOString(),
            photos: images,
          };
        });
    } catch (err) {
      console.error("Auto24 fetch failed:", err);
      return [];
    }
  }
}
