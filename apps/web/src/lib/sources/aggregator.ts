import { UnifiedCar } from "./types";
import { Auto24Collector } from "./auto24";
import { SoeezAutoCollector } from "./soeezauto";
import { AvitoCollector } from "./avito";
import { getFallbackCars } from "./fallback";

const collectors = [
  new Auto24Collector(),
  new SoeezAutoCollector(),
  new AvitoCollector(),
];

function deduplicate(cars: UnifiedCar[]): UnifiedCar[] {
  const seen = new Map<string, UnifiedCar>();

  for (const car of cars) {
    const key = `${car.make.toLowerCase()}_${car.model.toLowerCase()}_${car.year}_${car.price}`;
    const existing = seen.get(key);

    if (!existing) {
      seen.set(key, car);
    } else {
      if (car.km < existing.km) {
        seen.set(key, car);
      }
      if (car.source === "Auto24" || car.source === "Moteur.ma") {
        const better = { ...car };
        better.title = existing.title;
        better.image = existing.image || car.image;
        better.photos = [...new Set([...existing.photos, ...car.photos])];
        seen.set(key, better);
      }
    }
  }

  return Array.from(seen.values());
}

function scoreCar(car: UnifiedCar, query: string): UnifiedCar {
  let boost = 0;
  const q = query.toLowerCase();
  if (car.make.toLowerCase().includes(q)) boost += 20;
  if (car.model.toLowerCase().includes(q)) boost += 15;
  if (car.fuel.toLowerCase().includes(q)) boost += 10;
  if (car.city.toLowerCase().includes(q)) boost += 5;
  if (car.year >= 2022) boost += 5;
  if (car.km < 30000) boost += 5;
  if (car.photos.length > 3) boost += 3;
  if (car.photos.length === 0) boost -= 2;

  return { ...car, score: Math.min(99, car.score + boost) };
}

let cachedAllCars: UnifiedCar[] | null = null;
let cacheTimestamp = 0;
const CACHE_TTL = 5 * 60 * 1000;

export async function fetchAllSources(): Promise<UnifiedCar[]> {
  const now = Date.now();
  if (cachedAllCars && now - cacheTimestamp < CACHE_TTL) return cachedAllCars;

  const results = await Promise.allSettled(
    collectors.map((c) => c.fetch())
  );

  let allCars: UnifiedCar[] = [];

  allCars.push(...getFallbackCars());
  console.log(`[Sources] Fallback dataset: ${allCars.length} cars`);

  for (let i = 0; i < results.length; i++) {
    const result = results[i];
    if (result.status === "fulfilled") {
      allCars.push(...result.value);
      console.log(`[Sources] ${collectors[i].name}: ${result.value.length} cars`);
    } else {
      console.error(`[Sources] ${collectors[i].name} failed:`, result.reason);
    }
  }

  console.log(`[Sources] Total before dedup: ${allCars.length}`);
  allCars = deduplicate(allCars);
  console.log(`[Sources] Total after dedup: ${allCars.length}`);

  cachedAllCars = allCars;
  cacheTimestamp = now;

  return allCars;
}

export async function searchAllSources(query: string): Promise<UnifiedCar[]> {
  const allCars = await fetchAllSources();
  if (!query) return allCars;

  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  return allCars
    .map((car) => scoreCar(car, query))
    .filter((car) =>
      words.some((w) =>
        car.make.toLowerCase().includes(w) ||
        car.model.toLowerCase().includes(w) ||
        car.title.toLowerCase().includes(w) ||
        car.fuel.toLowerCase().includes(w) ||
        car.city.toLowerCase().includes(w) ||
        car.year.toString().includes(w) ||
        car.source.toLowerCase().includes(w)
      )
    );
}
