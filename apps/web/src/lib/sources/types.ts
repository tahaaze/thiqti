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

const BRAND_ALIASES: Record<string, string> = {
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
