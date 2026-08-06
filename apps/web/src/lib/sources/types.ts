export type InventoryType = "new" | "used";

import type { SafetyEntry } from "@/lib/safetyAliases";

/** Moyen de joindre directement le vendeur / le conseiller de l'annonce. */
export interface CarContact {
  /** Nom du vendeur ou du conseiller (si connu). */
  name?: string;
  /** Numéro de téléphone lisible (ex. "06 81 55 77 85"). */
  phone?: string;
  /** Lien cliquable tel: vers le numéro international. */
  phoneHref?: string;
  /** Lien cliquable WhatsApp (wa.me/...). */
  whatsappHref?: string;
  /** Page d'annonce sur le site de la source où contacter le vendeur. */
  url?: string;
}

/** Réputation réelle de l'annonce fournie par la source. */
export interface CarReputation {
  /** Annonce vérifiée par la source. */
  verified?: boolean;
  /** Badge de confiance accordé par la source. */
  trustBadge?: boolean;
  /** Nombre de vues réelles de l'annonce. */
  views?: number;
  /** Nombre d'avis réels collectés. */
  reviews?: number;
  /** Note réelle sur 10 (avis réels), null si absente. */
  score?: number;
  /** Note réelle sur 5 (avis réels du vendeur), null si absente. */
  rating5?: number;
  /** Ancienneté du vendeur sur la plateforme (ex. "Vendeur depuis juillet 2026"). */
  sellerSince?: string;
  /** Texte court affiché à l'utilisateur (ex. "Annonce vérifiée"). */
  label?: string;
}

export interface UnifiedCar {
  id: string;
  title: string;
  make: string;
  model: string;
  year: number;
  price: number;
  priceFormatted: string;
  km: number;
  fuel: string;
  transmission: string;
  bodyType: string;
  city: string;
  image: string;
  source: string;
  sourceUrl: string;
  url: string;
  score: number;
  scrapedAt: string;
  photos: string[];
  inventoryType: InventoryType;
  /** Notation de securite officielle (Euro NCAP / NHTSA), null si non evalue. */
  safety: SafetyEntry | null;
  /** Coordonnées réelles du vendeur / conseiller (tel, WhatsApp, page d'annonce). */
  contact?: CarContact;
  /** Réputation réelle de l'annonce fournie par la source. */
  reputation?: CarReputation;
}

/** Taux de conversion indicatif USD -> MAD utilisé pour les annonces API étrangères. */
export const USD_TO_MAD = 10;

/** Formate un prix en DH (séparateur de milliers français). */
export function formatPriceDH(price: number): string {
  return `${Math.round(price).toLocaleString("fr-FR")} DH`;
}

/** Convertit un prix USD en DH et le formate. */
export function usdToDh(usd: number): number {
  return Math.round(usd * USD_TO_MAD);
}

export interface SourceCollector {
  name: string;
  fetch(): Promise<UnifiedCar[]>;
}

const FUEL_MAP: Record<string, string> = {
  diesel: "Diesel",
  essence: "Essence",
  gasoline: "Essence",
  hybride: "Hybride",
  hybrid: "Hybride",
  electrique: "Électrique",
  electric: "Électrique",
  "électrique": "Électrique",
};

const BODY_MAP: Record<string, string> = {
  suv: "SUV",
  berline: "Berline",
  citadine: "Citadine",
  compacte: "Compacte",
  crossover: "Crossover",
  utilitaire: "Utilitaire",
  break: "Break",
  "4x4": "SUV",
  monospace: "Monospace",
  pickup: "Utilitaire",
};

export const BRAND_ALIASES: Record<string, string> = {
  volkswagen: "Volkswagen",
  vw: "Volkswagen",
  mercedes: "Mercedes",
  "mercedes-benz": "Mercedes",
  bmw: "BMW",
  renault: "Renault",
  peugeot: "Peugeot",
  citroen: "Citroën",
  "citroën": "Citroën",
  dacia: "Dacia",
  toyota: "Toyota",
  hyundai: "Hyundai",
  kia: "Kia",
  ford: "Ford",
  fiat: "Fiat",
  nissan: "Nissan",
  opel: "Opel",
  seat: "Seat",
  skoda: "Škoda",
  mazda: "Mazda",
  suzuki: "Suzuki",
  honda: "Honda",
  mitsubishi: "Mitsubishi",
  volvo: "Volvo",
  jeep: "Jeep",
  chevrolet: "Chevrolet",
  lexus: "Lexus",
  audi: "Audi",
  byd: "BYD",
  changan: "Changan",
  chery: "Chery",
  mg: "MG",
  dfsk: "DFSK",
  jac: "JAC",
  geely: "Geely",
  gac: "GAC",
  baic: "BAIC",
  haval: "Haval",
  omoda: "Omoda",
  jaecoo: "Jaecoo",
  exeed: "EXEED",
  xpeng: "XPENG",
  dongfeng: "Dongfeng",
  "rolls-royce": "Rolls-Royce",
  "land-rover": "Land Rover",
  "range-rover": "Range Rover",
  porsche: "Porsche",
  tesla: "Tesla",
  bentley: "Bentley",
  lamborghini: "Lamborghini",
  ferrari: "Ferrari",
  "aston-martin": "Aston Martin",
  mclaren: "McLaren",
  maserati: "Maserati",
  "alfa-romeo": "Alfa Romeo",
  jaguar: "Jaguar",
  infiniti: "Infiniti",
  acura: "Acura",
  dodge: "Dodge",
  chrysler: "Chrysler",
  gmc: "GMC",
  buick: "Buick",
  cadillac: "Cadillac",
  subaru: "Subaru",
  ram: "Ram",
  mini: "Mini",
  smart: "Smart",
  polestar: "Polestar",
  rivian: "Rivian",
  lucid: "Lucid",
  vinfast: "VinFast",
  lada: "Lada",
  "great-wall": "Great Wall",
  wey: "WEY",
  tank: "Tank",
  isuzu: "Isuzu",
  mahindra: "Mahindra",
  tata: "Tata",
};

export function normalizeFuel(raw: string): string {
  const lower = raw.toLowerCase().trim();
  return FUEL_MAP[lower] || raw;
}

export function normalizeBody(raw: string): string {
  const lower = raw.toLowerCase().trim();
  return BODY_MAP[lower] || raw;
}

export function normalizeBrand(raw: string): string {
  const lower = raw.toLowerCase().trim();
  return BRAND_ALIASES[lower] || raw;
}

export function generateId(source: string, make: string, model: string, year: number, km: number, price: number): string {
  const base = `${source}_${make}_${model}_${year}_${km}_${price}`.toLowerCase().replace(/[^a-z0-9]/g, "");
  let hash = 0;
  for (let i = 0; i < base.length; i++) {
    const char = base.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return `src_${Math.abs(hash).toString(36)}`;
}

export function computeScore(year: number, km: number, price: number): number {
  let score = 70;
  const age = 2026 - year;
  if (age <= 1) score += 15;
  else if (age <= 2) score += 10;
  else if (age <= 3) score += 5;
  else if (age > 5) score -= 10;
  if (km < 30000) score += 10;
  else if (km < 60000) score += 5;
  else if (km > 120000) score -= 10;
  return Math.max(55, Math.min(98, score));
}
