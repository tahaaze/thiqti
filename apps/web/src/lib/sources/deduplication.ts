import { normalizeBrand, UnifiedCar } from "./types";

const PRICE_TOLERANCE = 0.05;

function normalizedMake(car: UnifiedCar): string {
  return normalizeBrand(car.make).toLowerCase().trim();
}

function normalizedModel(car: UnifiedCar): string {
  return car.model.toLowerCase().trim();
}

function normalizedCity(car: UnifiedCar): string {
  return car.city.toLowerCase().trim();
}

function sameCity(a: UnifiedCar, b: UnifiedCar): boolean {
  const ca = normalizedCity(a);
  const cb = normalizedCity(b);
  if (ca === "" || cb === "") return true;
  return ca === cb;
}

function closePrice(a: UnifiedCar, b: UnifiedCar): boolean {
  if (a.price === 0 || b.price === 0) return true;
  const ratio = Math.abs(a.price - b.price) / Math.max(a.price, b.price);
  return ratio <= PRICE_TOLERANCE;
}

function fieldCount(car: UnifiedCar): number {
  let n = 0;
  if (car.title) n++;
  if (car.make) n++;
  if (car.model) n++;
  if (car.year) n++;
  if (car.price) n++;
  if (car.km) n++;
  if (car.fuel) n++;
  if (car.transmission) n++;
  if (car.bodyType && car.bodyType !== "Non précisé") n++;
  if (car.city) n++;
  if (car.image) n++;
  if (car.photos && car.photos.length > 0) n++;
  if (car.contact) n++;
  if (car.reputation) n++;
  if (car.safety) n++;
  return n;
}

function preferred(a: UnifiedCar, b: UnifiedCar): UnifiedCar {
  const photosA = a.photos?.length ?? 0;
  const photosB = b.photos?.length ?? 0;
  if (photosA !== photosB) return photosA > photosB ? a : b;

  if (a.reputation?.verified && !b.reputation?.verified) return a;
  if (b.reputation?.verified && !a.reputation?.verified) return b;

  const fieldsA = fieldCount(a);
  const fieldsB = fieldCount(b);
  if (fieldsA !== fieldsB) return fieldsA > fieldsB ? a : b;

  return a;
}

export function deduplicateVehicles(cars: UnifiedCar[]): UnifiedCar[] {
  const result: UnifiedCar[] = [];

  for (const car of cars) {
    const existingIdx = result.findIndex(
      (r) =>
        normalizedMake(r) === normalizedMake(car) &&
        normalizedModel(r) === normalizedModel(car) &&
        r.year === car.year &&
        sameCity(r, car) &&
        closePrice(r, car),
    );

    if (existingIdx === -1) {
      result.push(car);
    } else {
      result[existingIdx] = preferred(result[existingIdx], car);
    }
  }

  return result;
}
