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
  /** Catalogue de démonstration hors-ligne (données fictives non garanties). */
  isDemoData?: boolean;
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

export function normalizeFuel(raw: string): string {
  const lower = raw.toLowerCase().trim();
  return FUEL_MAP[lower] || raw;
}

export function normalizeBody(raw: string): string {
  const lower = raw.toLowerCase().trim();
  return BODY_MAP[lower] || raw;
}

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
  daihatsu: "Daihatsu",
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
  ds: "DS",
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
  // Aliases arabes : titres Moteur.ma rédigés en arabe (transcription sans hamza,
  // stripAccents normalise أ/إ/آ en ا).
  بيجو: "Peugeot",
  داسيا: "Dacia",
  دسيا: "Dacia",
  رونو: "Renault",
  رينو: "Renault",
  تويوتا: "Toyota",
  مرسيدس: "Mercedes",
  مرسيديس: "Mercedes",
  ميرييديس: "Mercedes",
  ميرسيدس: "Mercedes",
  فيات: "Fiat",
  فياط: "Fiat",
  نيسان: "Nissan",
  "فولكس فاجن": "Volkswagen",
  هوندا: "Honda",
  كيا: "Kia",
  هيونداي: "Hyundai",
  "بي ام دبليو": "BMW",
  مازدا: "Mazda",
  فورد: "Ford",
  اودي: "Audi",
  سوزوكي: "Suzuki",
  شيفروليه: "Chevrolet",
  ميتسوبيشي: "Mitsubishi",
  "لاند روفر": "Land Rover",
  "رنج روفر": "Range Rover",
  فولفو: "Volvo",
  جيب: "Jeep",
  سيات: "Seat",
  سكودا: "Škoda",
  لكزس: "Lexus",
  تسلا: "Tesla",
  جاكوار: "Jaguar",
  كاديلاك: "Cadillac",
  بورش: "Porsche",
  ميني: "Mini",
};

function stripAccents(s: string): string {
  return s.normalize("NFD").replace(/[\u0300-\u036f\u0653\u0654]+/g, "");
}

// Inference de carrosserie pour les annonces occasion (moteur.ma / autera.ma)
// qui ne publient pas ce champ. La liste des modeles SUV est la plus large :
// c'est la recherche la plus frequente, et la plus penalisee par l'absence de
// donnee. Les mots du titre ("4x4", "suv"...) servent de filet de securite.
const BODY_MODEL_KEYWORDS: Record<string, string[]> = {
  SUV: [
    "duster", "sandero stepway", "jogger", "bigster", "captur", "arkana",
    "kadjar", "koleos", "austral", "kardian", "2008", "3008", "4008", "5008",
    "avenger", "c3 aircross", "c5 aircross", "c4 aircross", "rav4", "yaris cross",
    "c-hr", "chr", "corolla cross", "land cruiser", "fortuner", "highlander",
    "prado", "4runner", "fj cruiser", "hilux", "qashqai", "juke", "x-trail",
    "xtrail", "xterra", "pathfinder", "patrol", "kicks", "terra", "murano",
    "tucson", "santa fe", "sante fe", "kona", "creta", "venue", "palisade",
    "ioniq 5", "ioniq5", "ix35", "sportage", "sorento", "stonic", "niro",
    "soul", "telluride", "seltos", "ev6", "kuga", "puma", "ecosport", "edge",
    "explorer", "escape", "bronco", "everest", "ranger", "endeavour",
    "territory", "tiguan", "t-roc", "troc", "t-cross", "tcross", "touareg",
    "atlas", "teramont", "id.4", "id4", "id.5", "gla", "glb", "glc", "gle",
    "gls", "glk", "eqa", "eqb", "eqc", "eqs", "x1", "x2", "x3", "x4", "x5",
    "x6", "x7", "ix", "ix3", "q2", "q3", "q5", "q7", "q8", "e-tron", "etron",
    "q4 e-tron", "kamiq", "karoq", "kodiaq", "enyaq", "yeti", "arona", "ateca",
    "tarraco", "vitara", "s-cross", "scross", "jimny", "brezza", "grand vitara",
    "hr-v", "hrv", "vezel", "cr-v", "crv", "pilot", "br-v", "passport",
    "cx-3", "cx3", "cx-30", "cx30", "cx-5", "cx5", "cx-50", "cx50", "cx-60",
    "cx60", "cx-8", "cx-9", "xc40", "xc60", "xc90", "ex30", "ex40", "ec40",
    "cherokee", "grand cherokee", "compass", "wrangler", "renegade", "gladiator",
    "liberty", "range rover", "evoque", "discovery", "defender", "freelander",
    "outlander", "pajero", "montero", "eclipse cross", "asx", "pajero sport",
    "countryman", "paceman", "nx", "rx", "ux", "gx", "lx", "tx", "mg zs", "zs ev",
    "zs hybrid", "zsev", "zshybrid", "hs", "marvel", "rx5", "hector", "atto 3", "atto3", "song", "tang", "seal u",
    "sealu", "h6", "jolion", "dargo", "tiggo", "omoda", "jaecoo", "exeed",
    "cs35", "cs55", "cs75", "cs95", "uni-t", "uni-k", "glory", "gs3", "gs4",
    "gs8", "emkoo", "coolray", "boyue", "bj40", "tank 300", "neta", "korando",
    "tivoli", "rexton", "qx50", "qx60", "qx80", "navigator", "avaitor",
    "nautilus", "escalade", "captiva", "tracker", "trailblazer", "equinox",
    "tahoe", "suburban", "blazer", "traverse", "yukon", "terrain", "acadia",
    "crossland", "frontera", "antara", "mokka", "grandland", "4x4", "4wd",
    "suv",
  ],
  Berline: [
    "logan", "symbol", "megane", "talisman", "laguna", "508", "408", "407",
    "406", "301", "elantra", "sonata", "accent", "corolla", "camry", "accord",
    "mazda6", "classe c", "classe e", "classe s", "classe ce", "cclass",
    "octavia", "superb", "passat", "arteon", "tipo", "mondeo", "insignia",
    "seal", "han", "mg5", "alsvin", "sunny", "sentra", "altima", "maxima",
    "cerato", "rio", "k3", "a4", "a5", "a6", "a8", "serie 5", "serie 7",
    "serie5", "serie7", "avensis", "prius", "eado", "uni-v", "empire", "5",
    "berline",
  ],
  Citadine: [
    "clio", "twingo", "c1", "c3", "picanto", "i10", "i20", "mirage", "spark",
    "alto", "500", "107", "108", "207", "208", "corsa", "fiesta", "ka", "swift",
    "baleno", "ignis", "jazz", "yaris", "aygo", "up", "mii", "citigo", "ibiza",
    "panda", "punto", "polo", "spring", "dolphin", "mg3", "benni", "byd qq", "go",
    "picanto", "mi", "city",
  ],
  Compacte: [
    "golf", "focus", "308", "307", "leon", "serie 1", "serie1", "classe a",
    "a3", "mazda3", "mazda 3", "astra", "civic", "auris", "i30", "ceed", "ds4",
    "ds3", "impreza", "megane e-tech", "megane 4", "e-tech",
  ],
  Crossover: ["c4", "c4 x", "c4x", "c4 picasso", "408", "3008 hybrid", "ds5"],
  Utilitaire: [
    "doblo", "partner", "berlingo", "rifter", "kangoo", "doc", "transporter",
    "crafter", "expert", "jumpy", "scudo", "vivaro", "trafic", "boxer",
    "ducato", "nv200", "caddy", "combo", "caravan", "jumper", "master",
    "pickup", "utilitaire",
  ],
  Break: ["508 sw", "508sw", "octavia combi", "megane estate", "golf variant", "passat variant", "superb combi", "logan mcv", "break"],
  Monospace: [
    "scenic", "espace", "c4 picasso", "grand c4 picasso", "sharan", "alhambra",
    "galaxy", "s-max", "touran", "spacia", "monospace",
  ],
};

const BODY_TITLE_KEYWORDS: Record<string, string[]> = {
  SUV: ["4x4", "4wd", "suv", "crossover", "pickup", "suv 4x4"],
  Break: ["break", "sw", "combi", "estate"],
  Utilitaire: ["utilitaire", "fourgon", "camionnette", "pickup"],
  Monospace: ["monospace"],
};

function normalizeKey(s: string): string {
  return stripAccents(s).toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function hasKey(haystack: string, key: string): boolean {
  if (key.length === 0) return false;
  return ` ${haystack} `.includes(` ${key} `);
}

/** Devine la carrosserie d'une annonce dont le champ est absent ("Non précisé"). */
export function inferBodyType(_make: string, model: string, title: string): string {
  const modelN = normalizeKey(model);
  const candidates: { body: string; key: string }[] = [];
  for (const [body, keys] of Object.entries(BODY_MODEL_KEYWORDS)) {
    for (const raw of keys) {
      const key = normalizeKey(raw);
      if (hasKey(modelN, key)) candidates.push({ body, key });
    }
  }
  if (candidates.length > 0) {
    candidates.sort((a, b) => b.key.length - a.key.length);
    const body = candidates[0].body;
    const titleN = normalizeKey(title);
    if (
      (body === "Berline" || body === "Compacte") &&
      BODY_TITLE_KEYWORDS.Break.some((k) => hasKey(titleN, normalizeKey(k)))
    ) {
      return "Break";
    }
    return body;
  }
  const titleN = normalizeKey(title);
  for (const [body, keys] of Object.entries(BODY_TITLE_KEYWORDS)) {
    if (keys.some((k) => hasKey(titleN, normalizeKey(k)))) return body;
  }
  return "Non précisé";
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

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function computeScore(year: number, km: number, _price: number): number {
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
