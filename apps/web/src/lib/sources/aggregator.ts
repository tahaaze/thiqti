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

const STOP_WORDS = new Set([
  "je", "cherche", "chercher", "trouver", "veux", "vouloir", "souhaite",
  "aimerais", "un", "une", "des", "du", "de", "la", "le", "les", "au", "aux",
  "pour", "avec", "sans", "et", "ou", "dans", "sur", "en", "que", "qui",
  "quoi", "dont", "est", "suis", "sont", "il", "elle", "on", "mon", "ma",
  "mes", "ton", "ta", "tes", "son", "sa", "ses", "ne", "pas", "plus",
  "moins", "autour", "environ", "type", "genre", "voiture", "auto", "marque",
  "modele", "modèle", "budget", "prix", "dirhams", "dirham", "dh", "mad",
  "confortable", "confort", "famille", "familial", "familiale", "boite",
  "boîte", "neuf", "neuve", "occasion", "cher", "chere",
  "the", "a", "an", "of", "to", "for", "and", "or", "i", "we", "you",
]);

function carMatches(car: ReturnType<typeof getFallbackCars>[number], word: string): boolean {
  return (
    car.make.toLowerCase().includes(word) ||
    car.model.toLowerCase().includes(word) ||
    car.title.toLowerCase().includes(word) ||
    car.fuel.toLowerCase().includes(word) ||
    car.bodyType.toLowerCase().includes(word) ||
    car.transmission.toLowerCase().includes(word) ||
    car.city.toLowerCase().includes(word) ||
    car.year.toString().includes(word) ||
    car.source.toLowerCase().includes(word)
  );
}

export async function searchAllSources(query: string) {
  const allCars = getCars();
  if (!query) return allCars;

  const words = query
    .toLowerCase()
    .replace(/['\u2019]/g, " ")
    .split(/\s+/)
    .map((w) => w.replace(/^[^\p{L}\p{N}]+/u, "").replace(/[^\p{L}\p{N}]+$/u, ""))
    .filter((w) => w.length > 1 && !STOP_WORDS.has(w));

  const searchable = words.filter((w) => allCars.some((car) => carMatches(car, w)));

  if (words.length === 0) return allCars;
  if (searchable.length === 0) return [];

  return allCars.filter((car) => searchable.every((w) => carMatches(car, w)));
}
