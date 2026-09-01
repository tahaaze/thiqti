// ============================================================================
// IMAGES REELLES — resolution + cache de photos authentiques par modele.
// Source : Wikipedia/Wikimedia Commons (licence libre, sans cle API). Les photos
// sont resolues une fois par le script scripts/fetch-images.ts et stockees dans
// scripts/image-cache.json. Ce module ne sert que des URLs en cache (aucun appel
// reseau au moment de la requete) : rapide, sans cle, sans blocage.
// ============================================================================

import { readFileSync } from "fs";
import { join } from "path";

let cache: Record<string, string> | null = null;

function cachePath(): string {
  return join(process.cwd(), "scripts", "image-cache.json");
}

function loadCache(): Record<string, string> {
  if (cache) return cache;
  try {
    cache = JSON.parse(readFileSync(cachePath(), "utf-8")) as Record<string, string>;
  } catch {
    cache = {};
  }
  return cache;
}

function stripAccents(s: string): string {
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

/** Cle de cache normalisee (marque + modele, sans accents ni majuscules). */
export function imageKey(make: string, model: string): string {
  return `${stripAccents(make).toLowerCase()}_${stripAccents(model).toLowerCase()}`;
}

/** Photo reelle en cache pour une marque/modele donnee ("" si absente). */
export function cachedImageFor(make: string, model: string): string {
  return loadCache()[imageKey(make, model)] || "";
}
