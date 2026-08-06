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
  "4x4": "SUV",
  berline: "Berline",
  citadine: "Citadine",
  compacte: "Compacte",
  utilitaire: "Utilitaire",
  crossover: "Crossover",
  break: "Break",
  coupé: "Coupé",
  cabriolet: "Cabriolet",
  monospace: "Monospace",
  pickup: "Utilitaire",
  van: "Utilitaire",
  coupe: "Coupé",
  // Darija
  "ربع": "SUV",
  "كاروسة": "Berline",
  "مدينة": "Citadine",
};

const FUELS: Record<string, string> = {
  diesel: "Diesel",
  essence: "Essence",
  hybride: "Hybride",
  electrique: "Électrique",
  "électrique": "Électrique",
  gnv: "GNV",
  gpl: "GPL",
  // Darija
  "مازوت": "Diesel",
  "مازوط": "Diesel",
  "كازوال": "Diesel",
  "كاز": "Essence",
  "سانس": "Darija",
  "هجين": "Hybride",
  "بطارية": "Électrique",
  "كهرباء": "Électrique",
};

const TRANSMISSIONS: Record<string, string> = {
  manuelle: "Manuelle",
  automatique: "Automatique",
  auto: "Automatique",
  "boîte auto": "Automatique",
  "boite auto": "Automatique",
  // Darija
  "اوتوماتيك": "Automatique",
  "اوماتيك": "Automatique",
  "ماتيك": "Automatique",
  "اليدوي": "Manuelle",
  "يدوي": "Manuelle",
};

const BRANDS = [
  "Dacia", "Renault", "Peugeot", "Toyota", "Hyundai", "Kia",
  "Volkswagen", "BMW", "Mercedes", "Audi", "Ford", "Fiat",
  "Nissan", "Opel", "Citroën", "Citroen", "Skoda", "Seat",
  "Mazda", "Suzuki", "Honda", "Mitsubishi", "Volvo", "Jeep",
  "Chevrolet", "Lexus", "Infiniti", "Alfa Romeo",
  // Arabic brand mentions
  "تويوتا", "هيونداي", "كيا", "رونو", "رينو", "بيجو",
  "مرسيدس", "بي ام", "بي إم", "فولكس", "دacia",
];

const CITIES = [
  "Casablanca", "Rabat", "Marrakech", "Fès", "Tanger",
  "Agadir", "Meknès", "Oujda", "Kénitra", "Tétouan",
  "Tetouan", "Nador", "El Jadida", "Béni Mellal", "Beni Mellal",
  // Arabic
  "الدار البيضاء", "كازا", "الرباط", "مراكش", "فاس",
  "طنجة", "أكادير", "مكناس", "وجدة", "تطوان",
];

const INTENT_KEYWORDS: Record<string, string[]> = {
  familial: ["famille", "familial", "familiale", "enfant", "enfants", "bébé", "bebe", "pratique", "7aml", "عائلة", "اولاد", "دراري", "صغار"],
  sportif: ["sport", "sportif", "sportive", "puissant", "puissance", "vitesse", "performance", "sari3", "سريع", "قوي"],
  economique: ["économique", "economique", "petit budget", "abordable", "pas cher", "moins cher", "pas trop cher", "budget serré", "رخيص", "رخص", "اقتصادي"],
  confort: ["confort", "confortable", "luxueux", "luxe", "premium", "haut de gamme", "مرتاح", "فخم", "راحة", "هادئ"],
  ville: ["ville", "urbain", "urbaine", "parking", "stationnement", "مدينة"],
  route: ["autoroute", "route", "longue distance", "voyage", "سفر", "طريق", "طويلة"],
  tout_terrain: ["tout-terrain", "tout terrain", "piste", "chemin", "offroad", "boue", "وعر"],
};

const CANONICAL_BRANDS: Record<string, string> = {
  "تويوتا": "Toyota",
  "هيونداي": "Hyundai",
  "كيا": "Kia",
  "رونو": "Renault",
  "رينو": "Renault",
  "بيجو": "Peugeot",
  "مرسيدس": "Mercedes",
  "بي ام": "BMW",
  "بي إم": "BMW",
  "فولكس": "Volkswagen",
  "دacia": "Dacia",
};

function normalizeText(text: string): string {
  const arabicDigits: Record<string, string> = {
    "٠": "0", "١": "1", "٢": "2", "٣": "3", "٤": "4", "٥": "5", "٦": "6", "٧": "7", "٨": "8", "٩": "9",
    "۰": "0", "۱": "1", "۲": "2", "۳": "3", "۴": "4", "۵": "5", "۶": "6", "۷": "7", "۸": "8", "۹": "9",
  };
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[\u0660-\u0669\u06F0-\u06F9]/g, (d) => arabicDigits[d])
    .replace(/[^\w\s\d\u0600-\u06FF\u0400-\u04FF]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function hasKeyword(text: string, key: string): boolean {
  if (key.includes(" ")) return text.includes(key);
  return new RegExp(`(^|[^a-z0-9])${key}([^a-z0-9]|$)`).test(text);
}

function extractBudget(text: string): { min: number | null; max: number | null; tolerance: number } {
  let min: number | null = null;
  let max: number | null = null;
  let tolerance = 0.15;

  const aroundMatch = text.match(/autour\s+d[e']\s*(\d[\d\s]*\d)\s*(dh)?/i);
  if (aroundMatch) {
    const val = parseInt(aroundMatch[1].replace(/\s/g, ""));
    if (val >= 10000 && val <= 5000000) {
      max = Math.round(val * 1.2);
      min = Math.round(val * 0.8);
      tolerance = 0.2;
    }
  }

  if (min === null) {
    const rangeMatch = text.match(/entre\s+(\d[\d\s]*\d)\s*(?:et|a|à)\s+(\d[\d\s]*\d)\s*(dh)?/i);
    if (rangeMatch) {
      const v1 = parseInt(rangeMatch[1].replace(/\s/g, ""));
      const v2 = parseInt(rangeMatch[2].replace(/\s/g, ""));
      if (v1 >= 10000 && v2 >= 10000) { min = Math.min(v1, v2); max = Math.max(v1, v2); }
    }
  }

  if (min === null) {
    const underMatch = text.match(/(?:sous|moins de|max|maximum|plafond)\s+(\d[\d\s]*\d)\s*(dh)?/i);
    if (underMatch) {
      const val = parseInt(underMatch[1].replace(/\s/g, ""));
      if (val >= 10000 && val <= 5000000) max = val;
    }
  }

  if (min === null) {
    const aboveMatch = text.match(/(?:plus de|au-dessus de|min|minimum|a partir de|a partir)\s+(\d[\d\s]*\d)\s*(dh)?/i);
    if (aboveMatch) {
      const val = parseInt(aboveMatch[1].replace(/\s/g, ""));
      if (val >= 10000 && val <= 5000000) min = val;
    }
  }

  if (min === null && max === null) {
    const budgetWordMatch = text.match(/(?:budget|ميزانية)\s+(\d[\d\s]*\d)/i);
    if (budgetWordMatch) {
      const val = parseInt(budgetWordMatch[1].replace(/\s/g, ""));
      if (val >= 10000 && val <= 5000000) {
        max = Math.round(val * 1.15);
        min = Math.round(val * 0.85);
      }
    }
  }

  // Darija patterns
  if (min === null && max === null) {
    const darMatch = text.match(/(?:ف|على)\s*(\d[\d\s]*\d)\s*(?:درهم|دهم|dh)?/i);
    if (darMatch) {
      const val = parseInt(darMatch[1].replace(/\s/g, ""));
      if (val >= 10000 && val <= 5000000) {
        max = Math.round(val * 1.15);
        min = Math.round(val * 0.85);
        tolerance = 0.15;
      }
    }
  }

  if (min === null && max === null) {
    const budgetMatch = text.match(/(\d[\d\s]*\d)\s*(dh|mad|درهم|دهم)/i);
    if (budgetMatch) {
      const val = parseInt(budgetMatch[1].replace(/\s/g, ""));
      if (val >= 10000 && val <= 5000000) {
        max = Math.round(val * 1.15);
        min = Math.round(val * 0.85);
        tolerance = 0.15;
      }
    }
  }

  // Nombre seul (ex. "200000", "200 000") : consideré comme un budget en DH,
  // sauf s'il s'agit d'une année (20xx) ou d'une petite valeur (modèle, km).
  if (min === null && max === null) {
    const bareMatch = text.match(/(\d[\d\s]*\d)/);
    if (bareMatch) {
      const val = parseInt(bareMatch[1].replace(/\s/g, ""));
      if (val >= 10000 && val <= 9000000 && !(val >= 2000 && val <= 2026)) {
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

  const sinceMatch = text.match(/(?:depuis|a partir de|apres|post|من|بعد)\s*(\d{4})/i);
  if (sinceMatch) {
    const year = parseInt(sinceMatch[1]);
    if (year >= 2000 && year <= 2026) min = year;
  }

  const beforeMatch = text.match(/(?:avant|jusqua|قبل)\s*(\d{4})/i);
  if (beforeMatch) {
    const year = parseInt(beforeMatch[1]);
    if (year >= 2000 && year <= 2026) max = year;
  }

  if (min === null && max === null) {
    const yearMatch = text.match(/(?<!\d)(20[0-2]\d)(?!\d)/g);
    if (yearMatch) {
      const years = yearMatch.map(Number).filter((y) => y >= 2000 && y <= 2026);
      if (years.length === 1) { min = years[0]; max = years[0] + 1; }
      else if (years.length >= 2) { min = Math.min(...years); max = Math.max(...years); }
    }
  }

  return { min, max };
}

function extractKmMax(text: string): number | null {
  const kmMatch = text.match(/(?:moins de|sous|max|maximum|تحت|اقل|اقصى)\s*(\d[\d\s]*)\s*(?:km|كلم|كيلومتر)/i);
  if (kmMatch) {
    const val = parseInt(kmMatch[1].replace(/\s/g, ""));
    if (val > 0 && val <= 500000) return val;
  }
  const kmExact = text.match(/(\d[\d\s]*)\s*(?:km|كلم|كيلومتر)/i);
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
    if (normalized.includes(key)) { carrosserie = value; break; }
  }

  let motorisation: string | null = null;
  for (const [key, value] of Object.entries(FUELS)) {
    if (normalized.includes(key)) { motorisation = value; break; }
  }

  let transmission: string | null = null;
  for (const [key, value] of Object.entries(TRANSMISSIONS)) {
    if (hasKeyword(normalized, key)) { transmission = value; break; }
  }

  let marque: string | null = null;
  for (const brand of BRANDS) {
    const b = brand.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    if (normalized.includes(b)) { marque = CANONICAL_BRANDS[brand] ?? brand; break; }
  }

  let ville: string | null = null;
  for (const city of CITIES) {
    const c = city.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    if (normalized.includes(c)) { ville = city; break; }
  }

  const { min: budgetMin, max: budgetMax, tolerance: budgetTolerance } = extractBudget(normalized);
  const { min: anneeMin, max: anneeMax } = extractYear(normalized);
  const kmMax = extractKmMax(normalized);

  const intent: string[] = [];
  for (const [key, keywords] of Object.entries(INTENT_KEYWORDS)) {
    for (const kw of keywords) {
      if (normalized.includes(kw.toLowerCase())) { intent.push(key); break; }
    }
  }

  return {
    carrosserie, motorisation, transmission, marque,
    budgetMin, budgetMax, budgetTolerance,
    ville, anneeMin, anneeMax, kmMax, intent,
  };
}
