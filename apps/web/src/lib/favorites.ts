// ---------------------------------------------------------------------------
// FAVORIS — stockage local
// ---------------------------------------------------------------------------
//
// Les ids des annonces live (Moteur.ma, Avito, Auto24...) derivent de pages
// scrapees qui bougent avec le temps : un favori ne peut plus etre retrouve
// via /api/search une fois que l'annonce a tourne ou que la source est en panne.
// On sauvegarde donc un SNAPSHOT complet de la voiture (thiqti_favorites_data)
// a cote de la liste des ids (thiqti_favorites, conservee pour compatibilite).

export interface FavoriteCar {
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
  photos?: string[];
  score: number;
  source: string;
  url: string;
  inventoryType?: "new" | "used";
  bodyType?: string;
  contact?: {
    name?: string;
    phone?: string;
    phoneHref?: string;
    whatsappHref?: string;
    url?: string;
  };
  reputation?: {
    verified?: boolean;
    trustBadge?: boolean;
    views?: number;
    label?: string;
  };
  safety?: {
    stars: number;
    ratingYear?: number;
    source?: string;
  } | null;
}

const FAV_KEY = "thiqti_favorites";
const DATA_KEY = "thiqti_favorites_data";

/** Lecture tolerante de la liste des ids de favoris. */
export function loadFavoriteIds(): string[] {
  try {
    const raw = localStorage.getItem(FAV_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((x): x is string => typeof x === "string" && x.length > 0);
  } catch {
    return [];
  }
}

/** Lecture des snapshots (id -> voiture). */
export function loadFavoriteCars(): Record<string, FavoriteCar> {
  try {
    const raw = localStorage.getItem(DATA_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return {};
    const out: Record<string, FavoriteCar> = {};
    for (const [id, car] of Object.entries(parsed)) {
      if (car && typeof car === "object" && (car as FavoriteCar).title) {
        out[id] = car as FavoriteCar;
      }
    }
    return out;
  } catch {
    return {};
  }
}

function writeIds(ids: string[]) {
  localStorage.setItem(FAV_KEY, JSON.stringify(ids));
}

function writeCars(cars: Record<string, FavoriteCar>) {
  localStorage.setItem(DATA_KEY, JSON.stringify(cars));
}

/** Ajoute un favori (id + snapshot). */
export function saveFavorite(id: string, car: FavoriteCar) {
  const ids = loadFavoriteIds();
  if (!ids.includes(id)) writeIds([...ids, id]);
  const cars = loadFavoriteCars();
  cars[id] = car;
  writeCars(cars);
}

/** Retire un favori (id + snapshot). */
export function removeFavorite(id: string) {
  const ids = loadFavoriteIds().filter((x) => x !== id);
  writeIds(ids);
  const cars = loadFavoriteCars();
  delete cars[id];
  writeCars(cars);
}
