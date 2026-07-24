export interface SearchCriteria {
  carrosserie: string | null;
  motorisation: string | null;
  transmission: string | null;
  marque: string | null;
  budgetMin: number | null;
  budgetMax: number | null;
  budgetTolerance: number;
  ville: string | null;
  anneeMin: number | null;
  anneeMax: number | null;
  kmMax: number | null;
  intent: string[];
}

const CARROSSERIES: Record<string, string> = {
  suv: "SUV",
  "suv ": "SUV",
  berline: "Berline",
  citadine: "Citadine",
  compacte: "Compacte",
  utilitaire: "Utilitaire",
  crossover: "Crossover",
  break: "Break",
  coupé: "Coupé",
  cabriolet: "Cabriolet",
  monospace: "Monospace",
  "4x4": "SUV",
  pickup: "Utilitaire",
  van: "Utilitaire",
};

const FUELS: Record<string, string> = {
  diesel: "Diesel",
  essence: "Essence",
  hybride: "Hybride",
  electrique: "Électrique",
  "électrique": "Électrique",
  gnv: "GNV",
  gpl: "GPL",
};

const TRANSMISSIONS: Record<string, string> = {
  manuelle: "Manuelle",
  automatique: "Automatique",
  auto: "Automatique",
  "boîte auto": "Automatique",
  "boite auto": "Automatique",
};

const BRANDS = [
  "Dacia", "Renault", "Peugeot", "Toyota", "Hyundai", "Kia",
  "Volkswagen", "BMW", "Mercedes", "Audi", "Ford", "Fiat",
  "Nissan", "Opel", "Citroën", "Citroen", "Skoda", "Seat",
  "Mazda", "Suzuki", "Honda", "Mitsubishi", "Volvo", "Jeep",
  "Chevrolet", "Toyota", "Lexus", "Infiniti", "Alfa Romeo",
];

const CITIES = [
  "Casablanca", "Rabat", "Marrakech", "Fès", "Tanger",
  "Agadir", "Meknès", "Oujda", "Kénitra", "Tétouan",
  "Tetouan", "Nador", "El Jadida", "Béni Mellal", "Beni Mellal",
];

const INTENT_KEYWORDS: Record<string, string[]> = {
  familial: ["famille", "familial", "familiale", "enfant", "enfants", "bébé", "bebe", "pratique"],
  sportif: ["sport", "sportif", "sportive", "puissant", "puissance", "vitesse", "performance"],
  economique: ["économique", "economique", "petit budget", "abordable", "pas cher", "moins cher", "pas trop cher", "budget serré"],
  confort: ["confort", "confortable", "luxueux", "luxe", "premium", "haut de gamme"],
  ville: ["ville", "urbain", "urbaine", "parking", "stationnement"],
  route: ["autoroute", "route", "longue distance", "voyage"],
  tout_terrain: ["tout-terrain", "tout terrain", "piste", "chemin", "offroad", "boue"],
};

function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s\d]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function extractBudget(text: string): { min: number | null; max: number | null; tolerance: number } {
  let min: number | null = null;
  let max: number | null = null;
  let tolerance = 0.15;

  const aroundMatch = text.match(/autour\s+d[e']\s*(\d[\d\s]*\d)\s*(dh)?/);
  if (aroundMatch) {
    const val = parseInt(aroundMatch[1].replace(/\s/g, ""));
    if (val >= 10000 && val <= 5000000) {
      max = Math.round(val * 1.2);
      min = Math.round(val * 0.8);
      tolerance = 0.2;
    }
  }

  if (min === null) {
    const rangeMatch = text.match(/entre\s+(\d[\d\s]*\d)\s*(?:et|a|à)\s+(\d[\d\s]*\d)\s*(dh)?/);
    if (rangeMatch) {
      const v1 = parseInt(rangeMatch[1].replace(/\s/g, ""));
      const v2 = parseInt(rangeMatch[2].replace(/\s/g, ""));
      if (v1 >= 10000 && v2 >= 10000) {
        min = Math.min(v1, v2);
        max = Math.max(v1, v2);
      }
    }
  }

  if (min === null) {
    const underMatch = text.match(/(?:sous|moins de|max|maximum|plafond)\s+(\d[\d\s]*\d)\s*(dh)?/);
    if (underMatch) {
      const val = parseInt(underMatch[1].replace(/\s/g, ""));
      if (val >= 10000 && val <= 5000000) {
        max = val;
      }
    }
  }

  if (min === null) {
    const aboveMatch = text.match(/(?:plus de|au-dessus de|min|minimum|a partir de|a partir)\s+(\d[\d\s]*\d)\s*(dh)?/);
    if (aboveMatch) {
      const val = parseInt(aboveMatch[1].replace(/\s/g, ""));
      if (val >= 10000 && val <= 5000000) {
        min = val;
      }
    }
  }

  if (min === null && max === null) {
    const budgetMatch = text.match(/(\d[\d\s]*\d)\s*(dh|mad)/);
    if (budgetMatch) {
      const val = parseInt(budgetMatch[1].replace(/\s/g, ""));
      if (val >= 10000 && val <= 5000000) {
        max = Math.round(val * 1.15);
        min = Math.round(val * 0.85);
        tolerance = 0.15;
      }
    }
  }

  return { min, max, tolerance };
}

function extractYear(text: string): { min: number | null; max: number | null } {
  let min: number | null = null;
  let max: number | null = null;

  const sinceMatch = text.match(/(?:depuis|a partir de|apres|post)\s*(\d{4})/);
  if (sinceMatch) {
    const year = parseInt(sinceMatch[1]);
    if (year >= 2000 && year <= 2026) min = year;
  }

  const beforeMatch = text.match(/(?:avant|jusqua)\s*(\d{4})/);
  if (beforeMatch) {
    const year = parseInt(beforeMatch[1]);
    if (year >= 2000 && year <= 2026) max = year;
  }

  if (min === null && max === null) {
    const yearMatch = text.match(/(20[0-2]\d)/g);
    if (yearMatch) {
      const years = yearMatch.map(Number).filter((y) => y >= 2000 && y <= 2026);
      if (years.length === 1) {
        min = years[0];
        max = years[0] + 1;
      } else if (years.length >= 2) {
        min = Math.min(...years);
        max = Math.max(...years);
      }
    }
  }

  return { min, max };
}

function extractKmMax(text: string): number | null {
  const kmMatch = text.match(/(?:moins de|sous|max|maximum)\s*(\d[\d\s]*)\s*(?:km)/);
  if (kmMatch) {
    const val = parseInt(kmMatch[1].replace(/\s/g, ""));
    if (val > 0 && val <= 500000) return val;
  }
  const kmExact = text.match(/(\d[\d\s]*)\s*km/);
  if (kmExact) {
    const val = parseInt(kmExact[1].replace(/\s/g, ""));
    if (val > 0 && val <= 500000) return val;
  }
  return null;
}

export function parseQuery(query: string): SearchCriteria {
  const normalized = normalizeText(query);

  let carrosserie: string | null = null;
  for (const [key, value] of Object.entries(CARROSSERIES)) {
    if (normalized.includes(key)) {
      carrosserie = value;
      break;
    }
  }

  let motorisation: string | null = null;
  for (const [key, value] of Object.entries(FUELS)) {
    if (normalized.includes(key)) {
      motorisation = value;
      break;
    }
  }

  let transmission: string | null = null;
  for (const [key, value] of Object.entries(TRANSMISSIONS)) {
    if (normalized.includes(key)) {
      transmission = value;
      break;
    }
  }

  let marque: string | null = null;
  for (const brand of BRANDS) {
    if (normalized.includes(brand.toLowerCase())) {
      marque = brand;
      break;
    }
  }

  let ville: string | null = null;
  for (const city of CITIES) {
    if (normalized.includes(city.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""))) {
      ville = city;
      break;
    }
  }

  const { min: budgetMin, max: budgetMax, tolerance: budgetTolerance } = extractBudget(normalized);
  const { min: anneeMin, max: anneeMax } = extractYear(normalized);
  const kmMax = extractKmMax(normalized);

  const intent: string[] = [];
  for (const [key, keywords] of Object.entries(INTENT_KEYWORDS)) {
    for (const kw of keywords) {
      if (normalized.includes(kw)) {
        intent.push(key);
        break;
      }
    }
  }

  return {
    carrosserie,
    motorisation,
    transmission,
    marque,
    budgetMin,
    budgetMax,
    budgetTolerance,
    ville,
    anneeMin,
    anneeMax,
    kmMax,
    intent,
  };
}
