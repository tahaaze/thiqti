import { getFallbackCars } from "./fallback";

let cachedCars: ReturnType<typeof getFallbackCars> | null = null;
let cacheTimestamp = 0;
const CACHE_TTL = 5 * 60 * 1000;

function getCars() {
  const now = Date.now();
  if (!cachedCars || now - cacheTimestamp > CACHE_TTL) {
    cachedCars = getFallbackCars();
    cacheTimestamp = now;
  }
  return cachedCars;
}

export async function fetchAllSources() {
  return getCars();
}

export async function searchAllSources(query: string) {
  const allCars = getCars();
  if (!query) return allCars;

  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  return allCars.filter((car) =>
    words.every((w) =>
      car.make.toLowerCase().includes(w) ||
      car.model.toLowerCase().includes(w) ||
      car.title.toLowerCase().includes(w) ||
      car.fuel.toLowerCase().includes(w) ||
      car.bodyType.toLowerCase().includes(w) ||
      car.transmission.toLowerCase().includes(w) ||
      car.city.toLowerCase().includes(w) ||
      car.year.toString().includes(w) ||
      car.source.toLowerCase().includes(w)
    )
  );
}
