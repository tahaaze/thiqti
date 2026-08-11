// ============================================================================
// AGREGATEUR DE SOURCES MAROCAINES
// ============================================================================
//
// Comportement :
//   1. Les annonces REELLES au Maroc sont chargees depuis sept sources
//      nationales (autera.ma, moteur.ma, electrodrive.ma, autohall.ma, auto24.ma, avito.ma, moteur-neuf). Quand une source
//      renvoie des annonces, elles portent leurs vraies photos, prix MAD, km,
//      ville, leur réputation réelle et un moyen de contacter le vendeur.
//   2. Le catalogue de reference hors-ligne (fallback.ts) n'est utilise QU'EN
//      SECOURS : si toutes les sources live échouent, il sert de socle de
//      DEMONSTRATION. Toutes ses entrées portent `isDemoData: true` et l'API
//      renvoie `demoData: true` pour que l'UI affiche un avertissement clair.
//   3. Le tout est fusionne dans un cache en memoire (TTL 10 min).
// ============================================================================

import { promises as fs } from "fs";
import path from "path";
import { UnifiedCar, InventoryType, inferBodyType } from "./types";
import { getFallbackCars } from "./fallback";
import { fetchAuteraCars } from "./autera";
import { fetchMoteurCars } from "./moteur";
import { fetchElectroDriveCars } from "./electrodrive";
import { fetchAutohallCars } from "./autohall";
import { fetchAuto24Cars } from "./auto24";
import { fetchAvitoCars } from "./avito";
import { fetchMoteurNeufCars } from "./moteur-neuf";
import { cachedImageFor } from "@/lib/images";
import { safetyRatingFor } from "@/lib/safetyRatings";

const CACHE_TTL = 10 * 60 * 1000;
const CACHE_FILE = path.join(process.cwd(), ".cache", "thiqti-cars.json");

interface DiskCacheShape {
  cars: UnifiedCar[];
  fetchedAt: number;
}

let cache: { cars: UnifiedCar[]; fetchedAt: number; liveSources: boolean } | null = null;
let coldLoad: Promise<UnifiedCar[]> | null = null;

function withInferredBody(car: UnifiedCar): UnifiedCar {
  if (car.bodyType !== "Non précisé") return car;
  const bodyType = inferBodyType(car.make, car.model, car.title);
  if (bodyType === "Non précisé") return car;
  return { ...car, bodyType };
}

async function readDiskCache(): Promise<DiskCacheShape | null> {
  if (process.env.NODE_ENV === "test") return null;
  try {
    const parsed = JSON.parse(await fs.readFile(CACHE_FILE, "utf8")) as DiskCacheShape;
    if (!Array.isArray(parsed.cars)) return null;
    return { cars: parsed.cars.map(withInferredBody), fetchedAt: parsed.fetchedAt };
  } catch {
    return null;
  }
}

async function writeDiskCache(cars: UnifiedCar[], fetchedAt: number): Promise<void> {
  if (process.env.NODE_ENV === "test") return;
  try {
    await fs.mkdir(path.dirname(CACHE_FILE), { recursive: true });
    await fs.writeFile(CACHE_FILE, JSON.stringify({ cars, fetchedAt }), "utf8");
  } catch {
    // Le cache disque est optionnel : un échec d'écriture ne doit pas casser la réponse.
  }
}

async function loadAndCache(): Promise<UnifiedCar[]> {
  const cars = await loadMergedCars();
  const fetchedAt = Date.now();
  // Anti-régression : les sources live sont lentes et parfois instables
  // (Moteur.ma ~100 s, AutoHall ~160 s, Auto24/Avito parfois vides). Un
  // rechargement partiel ne doit JAMAIS remplacer un catalogue plus riche :
  // on garde le plus grand des deux.
  if (cache && cars.length < cache.cars.length) {
    return cache.cars;
  }
  cache = { cars, fetchedAt, liveSources: cars.some((c) => c.contact || c.reputation) };
  void writeDiskCache(cars, fetchedAt);
  return cars;
}

function withDedup(loader: () => Promise<UnifiedCar[]>): Promise<UnifiedCar[]> {
  if (!coldLoad) {
    coldLoad = loader().finally(() => {
      coldLoad = null;
    });
  }
  return coldLoad;
}

async function loadMergedCars(): Promise<UnifiedCar[]> {
  const [autera, moteur, electro, autohall, auto24, avito, moteurNeuf] = await Promise.all([
    fetchAuteraCars(),
    fetchMoteurCars(),
    fetchElectroDriveCars(),
    fetchAutohallCars(),
    fetchAuto24Cars(),
    fetchAvitoCars(),
    fetchMoteurNeufCars(),
  ]);
  const live = [...autera, ...moteur, ...electro, ...autohall, ...auto24, ...avito, ...moteurNeuf].map(withInferredBody);

  const withSafety = (car: UnifiedCar): UnifiedCar => ({
    ...car,
    safety: safetyRatingFor(car.make, car.model),
  });

  // Source primaire : vraies annonces marocaines (photos, prix MAD, km reels).
  if (live.length > 0) {
    return live.map(withSafety);
  }

  // Secours hors-ligne : catalogue de DEMONSTRATION (donnees fictives, marquees
  // isDemoData). L'UI doit afficher un bandeau "Catalogue de reference".
  const byId = new Map<string, UnifiedCar>();
  for (const car of getFallbackCars()) {
    if (byId.has(car.id)) continue;
    const realPhoto = cachedImageFor(car.make, car.model);
    byId.set(car.id, {
      ...car,
      image: realPhoto || car.image,
      photos: realPhoto && car.photos.length === 0 ? [realPhoto] : car.photos,
      safety: safetyRatingFor(car.make, car.model),
    });
  }
  return [...byId.values()].map(withInferredBody);
}

async function getCars(): Promise<UnifiedCar[]> {
  const now = Date.now();
  if (cache && now - cache.fetchedAt < CACHE_TTL) {
    return cache.cars;
  }

  const disk = await readDiskCache();

  // Cache disque valide (frais ou perime) : on le sert immediatement et on
  // rafraichit en arriere-plan. Aucune requete ne bloque sur un rechargement
  // live qui peut prendre plusieurs dizaines de secondes.
  if (disk) {
    cache = { cars: disk.cars, fetchedAt: disk.fetchedAt, liveSources: true };
    void withDedup(loadAndCache).catch(() => {});
    return disk.cars;
  }

  // Cache memoire perime uniquement : on le sert et on rafraichit derriere.
  if (cache) {
    void withDedup(loadAndCache).catch(() => {});
    return cache.cars;
  }

  // Premier demarrage froid : on lance le scraping en arriere-plan et on
  // retourne les donnees fallback immediatement pour eviter de bloquer l'UI.
  void withDedup(loadAndCache).then((live) => {
    // Anti-régression (même principe qu'au-dessus) : ne pas remplacer un
    // catalogue plus riche par un rechargement partiel.
    if (cache && live.length < cache.cars.length) return;
    cache = { cars: live, fetchedAt: Date.now(), liveSources: live.some((c) => c.contact || c.reputation) };
  }).catch(() => {});
  const fallback = getFallbackCars().map((c) => {
    const realPhoto = cachedImageFor(c.make, c.model);
    return withInferredBody({
      ...c,
      image: realPhoto || c.image,
      photos: realPhoto && c.photos.length === 0 ? [realPhoto] : c.photos,
      safety: safetyRatingFor(c.make, c.model),
    });
  });
  cache = { cars: fallback, fetchedAt: Date.now(), liveSources: false };
  return fallback;
}

export async function fetchAllSources(): Promise<UnifiedCar[]> {
  return getCars();
}

/** Vraies annonces neuves (API si active, sinon derivees du catalogue). */
export async function fetchNewCars(): Promise<UnifiedCar[]> {
  const cars = await getCars();
  return cars.filter((c) => c.inventoryType === "new");
}

/** Vraies annonces occasion (API si active, sinon derivees du catalogue). */
export async function fetchUsedCars(): Promise<UnifiedCar[]> {
  const cars = await getCars();
  return cars.filter((c) => c.inventoryType === "used");
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

function carMatches(car: UnifiedCar, word: string): boolean {
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

export async function searchAllSources(query: string, type?: InventoryType): Promise<UnifiedCar[]> {
  const allCars = await getCars();
  let pool = allCars;
  if (type === "new" || type === "used") {
    pool = allCars.filter((c) => c.inventoryType === type);
  }
  if (!query) return pool;

  const words = query
    .toLowerCase()
    .replace(/['\u2019]/g, " ")
    .split(/\s+/)
    .map((w) => w.replace(/^[^\p{L}\p{N}]+/u, "").replace(/[^\p{L}\p{N}]+$/u, ""))
    .filter((w) => w.length > 1 && !STOP_WORDS.has(w));

  const searchable = words.filter((w) => pool.some((car) => carMatches(car, w)));

  if (words.length === 0) return pool;
  if (searchable.length === 0) return [];

  // Recherche "ET" stricte, avec relachement automatique : si l'intersection
  // est vide (ex. "SUV" absent des titres des annonces occasion), on retire le
  // mot le plus courant / le moins discriminant (jamais la marque ni le modele)
  // et on reessaie, sans jamais vider des resultats pour une requete valide.
  // La precision est assuree ensuite par rankVehicles.
  const matchCount = (word: string): number =>
    pool.reduce((n, car) => n + (carMatches(car, word) ? 1 : 0), 0);

  const remaining = [...searchable].sort((a, b) => matchCount(b) - matchCount(a));
  let matched = pool.filter((car) => remaining.every((w) => carMatches(car, w)));
  while (matched.length === 0 && remaining.length > 1) {
    remaining.shift();
    matched = pool.filter((car) => remaining.every((w) => carMatches(car, w)));
  }

  return matched;
}

/** Statistiques par source (nombre d'annonces). */
export async function getSourceStats(): Promise<Record<string, number>> {
  const cars = await getCars();
  const stats: Record<string, number> = {};
  for (const car of cars) {
    stats[car.source] = (stats[car.source] || 0) + 1;
  }
  return stats;
}
