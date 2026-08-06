// ============================================================================
// ALIASES & MATCHING — notation de securite par modele.
// Partage entre scripts/fetch-safety-ratings.ts (collecte) et
// src/lib/safetyRatings.ts (resolution runtime). Un seul endroit pour les
// equivalences marque/modele afin d'eviter toute divergence.
// ============================================================================

import { normalizeBrand } from "./sources/types";

export interface SafetyEntry {
  make: string;
  model: string;
  stars: number;
  ratingYear: number;
  className: string;
  source: "euroncap" | "nhtsa";
  id: string;
}

function stripAccents(s: string): string {
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

export function modelKey(model: string): string {
  return stripAccents(model).toLowerCase().replace(/[^a-z0-9]+/g, "");
}

/** Marque normalisee (alias + accents), ex. "Mercedes-Benz" -> "Mercedes". */
export function makeKey(make: string): string {
  return normalizeBrand(stripAccents(make).toLowerCase());
}

// Variantes de nommage entre le catalogue et les sources (modele -> formes).
export const MODEL_VARIANTS: Record<string, string[]> = {
  "serie1": ["1series", "1seriesgrancoupe"],
  "serie2": ["2series"],
  "serie3": ["3series"],
  "serie4": ["4series"],
  "serie5": ["5series"],
  "classea": ["aclass"],
  "classeb": ["bclass"],
  "classec": ["cclass"],
  "classecoupe": ["cclasscoupe"],
  "classecla": ["claclass"],
  "zs ev": ["zs", "zsev", "zshybrid"],
  "mg4": ["4electric", "mg4ev", "mg4evurban", "mg4evlongrange"],
  "mg5": ["mg5"],
  "seal u": ["sealu", "seal-u"],
  "atto 3": ["atto3", "atto3plus"],
  "land cruiser prado": ["landcruiser"],
  "corolla cross": ["corollacross"],
  "c-hr": ["chr"],
  "t-cross": ["tcross"],
  "t-roc": ["troc"],
  "glory 580": ["glory580"],
  "ex30": ["ex30"],
  "c5 aircross": ["c5aircross"],
  "c4 x": ["c4x"],
  "3008": ["3008"],
  "5008": ["5008"],
  "2008": ["2008"],
  "megane": ["meganee-tech", "meganeev", "megane"],
  "captur": ["captur"],
  "arkana": ["arkana"],
  "jogger": ["jogger"],
  "sandero": ["sandero", "sanderostepway"],
  "duster": ["duster"],
  "clio": ["clio"],
  "austral": ["austral"],
  "tucson": ["tucson"],
  "kona": ["kona", "konaev"],
  "sportage": ["sportage"],
  "niro": ["niro", "niroev", "niroplus"],
  "picanto": ["picanto"],
  "sorento": ["sorento"],
  "stonic": ["stonic"],
  "carnival": ["carnival"],
  "qashqai": ["qashqai"],
  "x-trail": ["x-trail", "xtrail"],
  "juke": ["juke"],
  "pathfinder": ["pathfinder"],
  "puma": ["puma"],
  "fiesta": ["fiesta"],
  "kuga": ["kuga"],
  "mustang": ["mustang", "mustang-mach-e"],
  "yaris": ["yaris"],
  "yaris cross": ["yariscross"],
  "corolla": ["corolla"],
  "rav4": ["rav4"],
  "hilux": ["hilux"],
  "golf": ["golf"],
  "tiguan": ["tiguan"],
  "polo": ["polo"],
  "octavia": ["octavia"],
  "kamiq": ["kamiq"],
  "leon": ["leon"],
  "ibiza": ["ibiza"],
  "arona": ["arona"],
  "vitara": ["vitara"],
  "swift": ["swift"],
  "jimny": ["jimny"],
  "xc40": ["xc40"],
  "xc60": ["xc60"],
  "hr-v": ["hr-v", "hrv"],
  "cr-v": ["cr-v", "crv"],
  "cx-30": ["cx-30", "cx30"],
  "cx-5": ["cx-5", "cx5"],
  "mazda3": ["3", "mazda3"],
  "x1": ["x1"],
  "x3": ["x3"],
  "x5": ["x5"],
  "gla": ["gla"],
  "glc": ["glc"],
  "gle": ["gle"],
  "eqb": ["eqb"],
  "a3": ["a3"],
  "q5": ["q5"],
  "500": ["500"],
  "tipo": ["tipo"],
  "partner": ["rifter"],
  "doblo": ["doblo"],
  "c3": ["c3"],
  "c4": ["c4"],
  "corsa": ["corsa"],
  "grandland": ["grandland"],
  "mokka": ["mokka"],
  "renegade": ["renegade"],
  "compass": ["compass"],
  "wrangler": ["wrangler"],
  "twingo": ["twingo"],
  "kadjar": ["kadjar"],
  "elantra": ["elantra"],
  "3": ["3", "mazda3"],
};

// Marques croisees : un modele du catalogue peut etre evalue sous une autre
// marque (ex. Renault Duster = Dacia Duster, meme vehicule).
export const MAKE_CROSS_ALIASES: Record<string, string> = {
  "Renault_Duster": "Dacia",
};

// Nom NHTSA pour certains modeles du catalogue (forme US).
export const NHTSA_MODEL_ALIASES: Record<string, string> = {
  "Land Cruiser Prado": "Land Cruiser",
};

/** Variantes normalisees de modele (alias catalogue -> formes des sources). */
export function modelVariants(model: string): string[] {
  const key = modelKey(model);
  const explicit = MODEL_VARIANTS[key];
  const all = explicit ? [...explicit] : [];
  if (!all.includes(key)) all.push(key);
  return all;
}

/** Marque alternative (marques croisees) pour un modele du catalogue. */
export function crossMake(make: string, model: string): string | null {
  return MAKE_CROSS_ALIASES[`${make}_${model}`] || null;
}

/** Meilleure correspondance (marque + modele) d'une entree source. */
export function findMatch(candidates: SafetyEntry[], make: string, model: string): SafetyEntry | null {
  const mk = makeKey(make);
  const variants = modelVariants(model);
  const makes = new Set<string>([mk]);
  const cross = crossMake(make, model);
  if (cross) makes.add(makeKey(cross));

  const pool = candidates.filter((c) => makes.has(makeKey(c.make)));
  let best: SafetyEntry | null = null;
  let bestScore = 0;
  for (const c of pool) {
    const cm = modelKey(c.model);
    let score = 0;
    if (variants.includes(cm)) score = 100;
    else if (cm.length >= 2 && variants.some((v) => v.includes(cm) || cm.includes(v))) score = 80;
    else {
      for (const v of variants) {
        const shorter = v.length <= cm.length ? v : cm;
        const longer = v.length <= cm.length ? cm : v;
        if (shorter.length >= 3 && longer.startsWith(shorter)) {
          score = Math.max(score, 60);
        }
      }
    }
    if (score > bestScore) {
      bestScore = score;
      best = c;
    }
  }
  return best;
}
