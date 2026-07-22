const AUTO24_API = "https://api.auto24.ma/api/cars";

export interface CarListing {
  id: string;
  title: string;
  make: string;
  model: string;
  year: number;
  price: number;
  priceFormatted: string;
  km: number;
  fuel: string;
  city: string;
  image: string;
  score: number;
  source: string;
  url: string;
}

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
  exteriorColor: string | { details?: { lang: string; color: string }[]; slug?: string };
  images: string;
  slug: string;
  engineSize: number | null;
  status: string;
}

const MAPPING_FUEL: Record<string, string> = {
  diesel: "Diesel",
  petrol: "Essence",
  hybrid: "Hybride",
  ev: "Électrique",
};

const MAPPING_BODY: Record<string, string> = {
  suv: "SUV",
  citadine: "Citadine",
  berline: "Berline",
  utilitaire: "Utilitaire",
  crossover: "Crossover",
  compacte: "Compacte",
};

function extractBrand(car: Auto24Car): string {
  if (typeof car.brand === "string") return car.brand;
  return car.brand?.brand || "";
}

function extractModel(car: Auto24Car): string {
  if (typeof car.model === "string") return car.model;
  return car.model?.model || "";
}

function extractFuel(car: Auto24Car): string {
  if (typeof car.fuelType === "string") return MAPPING_FUEL[car.fuelType] || car.fuelType;
  if (car.fuelType?.fuelType) return MAPPING_FUEL[car.fuelType.fuelType] || car.fuelType.fuelType;
  if (car.fuelType?.details?.[0]?.fuelType) return MAPPING_FUEL[car.fuelType.details[0].fuelType] || car.fuelType.details[0].fuelType;
  return "Inconnu";
}

function extractBodyType(car: Auto24Car): string {
  if (typeof car.bodyType === "string") return MAPPING_BODY[car.bodyType.toLowerCase().trim()] || car.bodyType;
  if (car.bodyType?.details?.[0]?.bodyType) return MAPPING_BODY[car.bodyType.details[0].bodyType.toLowerCase().trim()] || car.bodyType.details[0].bodyType;
  return "";
}

function extractColor(car: Auto24Car): string {
  if (typeof car.exteriorColor === "string") return car.exteriorColor;
  if (car.exteriorColor?.details?.[0]?.color) return car.exteriorColor.details[0].color;
  return "";
}

function extractImage(car: Auto24Car): string {
  try {
    const images = typeof car.images === "string" ? JSON.parse(car.images) : car.images;
    if (Array.isArray(images) && images.length > 0) {
      return `https://api.auto24.ma/${images[0]}`;
    }
  } catch {}
  return `https://picsum.photos/seed/${car._id}/600/400`;
}

function formatPrice(price: number): string {
  return price.toLocaleString("fr-FR") + " DH";
}

function computeScore(car: Auto24Car): number {
  let score = 70;
  const year = parseInt(car.modelYear || "2020");
  const currentYear = 2026;
  const age = currentYear - year;
  if (age <= 1) score += 15;
  else if (age <= 2) score += 10;
  else if (age <= 3) score += 5;
  else if (age > 5) score -= 10;
  if (car.mileage < 30000) score += 10;
  else if (car.mileage < 60000) score += 5;
  else if (car.mileage > 120000) score -= 10;
  return Math.max(55, Math.min(98, score));
}

function normalizeCar(car: Auto24Car): CarListing {
  const brand = extractBrand(car);
  const model = extractModel(car);
  const year = parseInt(car.modelYear || "2022");
  return {
    id: car._id,
    title: car.name || `${brand} ${model}`,
    make: brand,
    model,
    year,
    price: car.price,
    priceFormatted: formatPrice(car.price),
    km: car.mileage || 0,
    fuel: extractFuel(car),
    city: "Casablanca",
    image: extractImage(car),
    score: computeScore(car),
    source: "Auto24.ma",
    url: `https://auto24.ma/cars/${car.slug}`,
  };
}

let cachedCars: CarListing[] | null = null;
let cacheTime = 0;
const CACHE_TTL = 5 * 60 * 1000;

async function fetchAuto24Cars(): Promise<CarListing[]> {
  const now = Date.now();
  if (cachedCars && now - cacheTime < CACHE_TTL) return cachedCars;

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

    if (!res.ok) throw new Error(`Auto24 API error: ${res.status}`);

    const data = await res.json();
    const cars: Auto24Car[] = data.cars || [];

    cachedCars = cars
      .filter((c) => c.status === "online" && c.price > 0)
      .map(normalizeCar);

    cacheTime = now;
    return cachedCars!;
  } catch (err) {
    console.error("Auto24 API failed, using fallback:", err);
    if (cachedCars) return cachedCars;
    return getFallbackCars();
  }
}

export async function searchCars(query: string): Promise<CarListing[]> {
  const allCars = await fetchAuto24Cars();
  if (!query) return allCars;

  const q = query.toLowerCase();
  return allCars.filter(
    (c) =>
      c.make.toLowerCase().includes(q) ||
      c.model.toLowerCase().includes(q) ||
      c.title.toLowerCase().includes(q) ||
      c.fuel.toLowerCase().includes(q) ||
      c.city.toLowerCase().includes(q) ||
      c.year.toString().includes(q)
  );
}

export function getAllCars(): CarListing[] {
  return cachedCars || [];
}

export function getCarById(id: string): CarListing | undefined {
  return (cachedCars || []).find((c) => c.id === id);
}

function getFallbackCars(): CarListing[] {
  return [
    { id: "fb1", title: "Dacia Duster TCe 130", make: "Dacia", model: "Duster", year: 2023, price: 195000, priceFormatted: "195 000 DH", km: 12000, fuel: "Essence", city: "Casablanca", image: "https://picsum.photos/seed/duster/600/400", score: 91, source: "Données loc", url: "#" },
    { id: "fb2", title: "Renault Clio V Intens", make: "Renault", model: "Clio", year: 2022, price: 155000, priceFormatted: "155 000 DH", km: 28000, fuel: "Essence", city: "Rabat", image: "https://picsum.photos/seed/clio/600/400", score: 85, source: "Données loc", url: "#" },
    { id: "fb3", title: "Toyota Corolla Hybrid", make: "Toyota", model: "Corolla", year: 2023, price: 275000, priceFormatted: "275 000 DH", km: 8000, fuel: "Hybride", city: "Marrakech", image: "https://picsum.photos/seed/corolla/600/400", score: 95, source: "Données loc", url: "#" },
    { id: "fb4", title: "Hyundai Tucson 1.6 T-GDi", make: "Hyundai", model: "Tucson", year: 2022, price: 215000, priceFormatted: "215 000 DH", km: 32000, fuel: "Essence", city: "Fès", image: "https://picsum.photos/seed/tucson/600/400", score: 89, source: "Données loc", url: "#" },
    { id: "fb5", title: "Kia Sportage 1.6 CRDi", make: "Kia", model: "Sportage", year: 2023, price: 318000, priceFormatted: "318 000 DH", km: 15000, fuel: "Diesel", city: "Tanger", image: "https://picsum.photos/seed/sportage/600/400", score: 88, source: "Données loc", url: "#" },
    { id: "fb6", title: "Peugeot 208 Active Pack", make: "Peugeot", model: "208", year: 2021, price: 128000, priceFormatted: "128 000 DH", km: 45000, fuel: "Essence", city: "Agadir", image: "https://picsum.photos/seed/peugeot208/600/400", score: 78, source: "Données loc", url: "#" },
    { id: "fb7", title: "Dacia Sandero Stepway", make: "Dacia", model: "Sandero", year: 2022, price: 140000, priceFormatted: "140 000 DH", km: 22000, fuel: "Essence", city: "Meknès", image: "https://picsum.photos/seed/sandero/600/400", score: 82, source: "Données loc", url: "#" },
    { id: "fb8", title: "Volkswagen Golf 8 1.5 TSI", make: "Volkswagen", model: "Golf", year: 2022, price: 285000, priceFormatted: "285 000 DH", km: 30000, fuel: "Essence", city: "Casablanca", image: "https://picsum.photos/seed/golf8/600/400", score: 90, source: "Données loc", url: "#" },
    { id: "fb9", title: "Ford Kuga 2.0 TDCi", make: "Ford", model: "Kuga", year: 2022, price: 245000, priceFormatted: "245 000 DH", km: 42000, fuel: "Diesel", city: "Tétouan", image: "https://picsum.photos/seed/kuga/600/400", score: 76, source: "Données loc", url: "#" },
    { id: "fb10", title: "Nissan Qashqai 1.3 DIG-T", make: "Nissan", model: "Qashqai", year: 2022, price: 190000, priceFormatted: "190 000 DH", km: 35000, fuel: "Essence", city: "Rabat", image: "https://picsum.photos/seed/qashqai/600/400", score: 86, source: "Données loc", url: "#" },
  ];
}
