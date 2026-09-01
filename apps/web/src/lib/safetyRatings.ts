// ============================================================================
// NOTATION DE SECURITE REELLE — resolution runtime par modele.
// Source : scripts/euroncap-cache.json, genere par scripts/fetch-safety-ratings.ts
// (Euro NCAP + NHTSA, notations officielles). Aucun appel reseau au moment de
// la requete : le module ne lit qu'un cache JSON, comme images.ts.
// ============================================================================

import { readFileSync } from "fs";
import { join } from "path";
import { SafetyEntry, findMatch, makeKey, modelKey } from "./safetyAliases";

interface SafetyCache {
  generatedAt: string;
  source: string;
  entries: SafetyEntry[];
}

let cache: SafetyEntry[] | null = null;

function cachePath(): string {
  return join(process.cwd(), "scripts", "euroncap-cache.json");
}

function loadEntries(): SafetyEntry[] {
  if (cache) return cache;
  try {
    const raw = JSON.parse(readFileSync(cachePath(), "utf-8")) as SafetyCache;
    cache = Array.isArray(raw.entries) ? raw.entries : [];
  } catch {
    cache = [];
  }
  return cache;
}

/** Meilleure notation reelle (derniere evaluation) pour une marque/modele. */
export function safetyRatingFor(make: string, model: string): SafetyEntry | null {
  return findMatch(loadEntries(), make, model);
}

/** Notation exacte (marque + modele normalises, sans fuzzy match). */
export function exactSafetyRatingFor(make: string, model: string): SafetyEntry | null {
  const mk = makeKey(make);
  const mm = modelKey(model);
  const entries = loadEntries();
  let best: SafetyEntry | null = null;
  for (const entry of entries) {
    if (makeKey(entry.make) !== mk) continue;
    if (modelKey(entry.model) !== mm) continue;
    if (!best || entry.ratingYear > best.ratingYear) best = entry;
  }
  return best;
}

/** Libelle court d'une note (ex. "4 etoiles — Euro NCAP 2018"). */
export function safetyLabel(safety: SafetyEntry | null): string {
  if (!safety) return "Non évalué";
  const program = safety.source === "nhtsa" ? "NHTSA" : "Euro NCAP";
  const year = safety.ratingYear ? ` ${safety.ratingYear}` : "";
  return `${safety.stars} étoile${safety.stars > 1 ? "s" : ""} — ${program}${year}`;
}

/** Niveau qualitatif (/5) en cle ASCII (ex. "elevee"), ou null. */
export function safetyLevel(stars: number | null | undefined): "elevee" | "moyenne" | "faible" | null {
  if (stars == null) return null;
  if (stars >= 4) return "elevee";
  if (stars >= 2) return "moyenne";
  return "faible";
}
