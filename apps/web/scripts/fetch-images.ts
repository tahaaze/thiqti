// ============================================================================
// RESOLUTION DE PHOTOS REELLES PAR MODELE (Wikipedia / Wikimedia Commons)
// ============================================================================
//
// Sans cle API, sans scraping : les photos proviennent de Wikipedia/Commons
// (licence libre). Le script parcourt le catalogue marocain + les modeles du
// seed, trouve pour chaque modele une photo reelle et enregistre l'URL dans
// scripts/image-cache.json (consommee ensuite par src/lib/images.ts).
//
// Usage : npx tsx scripts/fetch-images.ts [--limit N]
// ============================================================================

import { writeFileSync, readFileSync } from "fs";
import { join } from "path";
import { getFallbackCars } from "../src/lib/sources/fallback";
import { imageKey } from "../src/lib/images";

const WIKI_REST = "https://en.wikipedia.org/api/rest_v1/page/summary/";
const WIKI_API = "https://en.wikipedia.org/w/api.php";
const COMMONS_API = "https://commons.wikimedia.org/w/api.php";
const USER_AGENT = "Thiqti/1.0 (image resolver; contact: dev@thiqti.ma)";

interface ImageResult {
  url: string;
  title: string;
}

async function getJson(url: string): Promise<any> {
  const res = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
  if (!res.ok) return null;
  try {
    return await res.json();
  } catch {
    return null;
  }
}

/** Meilleur titre de page Wikipedia pour une requete (opensearch). */
async function searchTitle(query: string): Promise<string> {
  const url = `${WIKI_API}?action=opensearch&format=json&limit=5&redirects=resolve&search=${encodeURIComponent(query)}`;
  const data = await getJson(url);
  const titles: string[] = data && Array.isArray(data[1]) ? data[1] : [];
  return titles[0] || "";
}

/** Photo principale (vignette <=800px, generation a la demande par Commons). */
async function photoForTitle(title: string): Promise<string> {
  const data = await getJson(`${WIKI_REST}${encodeURIComponent(title)}`);
  const thumb: string | undefined = data?.thumbnail?.source;
  const orig: string | undefined = data?.originalimage?.source;
  const raw = thumb || orig || "";
  if (!raw) return "";
  // Le nom de fichier est le dernier segment (ex. "330px-Dacia_Duster_....jpg").
  // On passe par Special:FilePath?width=800 : Commons genere une vignette valide
  // (les autres largeurs fixes sont refusees par upload.wikimedia.org, HTTP 400).
  const file = decodeURIComponent(raw.split("?")[0].split("/").pop() || "").replace(/^\d+px-/, "");
  if (!file) return "";
  return `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(file)}?width=800`;
}

/** Secours : recherche d'une photo sur Wikimedia Commons. */
async function photoFromCommons(query: string): Promise<string> {
  const url =
    `${COMMONS_API}?action=query&format=json&generator=search&gsrnamespace=6&gsrlimit=5` +
    `&gsrsearch=${encodeURIComponent(`${query} car`)}&prop=imageinfo&iiprop=url&iiurlwidth=1000`;
  const data = await getJson(url);
  const pages = data?.query?.pages;
  if (!pages) return "";
  for (const p of Object.values<any>(pages)) {
    const url = p.imageinfo?.[0]?.thumburl || p.imageinfo?.[0]?.url || "";
    if (/\.(jpe?g|png|webp)($|\?)/i.test(url)) return url;
  }
  return "";
}

async function resolvePhoto(make: string, model: string): Promise<ImageResult> {
  const queries = [
    `${make} ${model}`,
    `${make} ${model} car`,
  ];
  for (const q of queries) {
    const title = await searchTitle(q);
    if (!title) continue;
    const url = await photoForTitle(title);
    if (url) return { url, title };
  }
  const url = await photoFromCommons(`${make} ${model}`);
  return url ? { url, title: `${make} ${model}` } : { url: "", title: "" };
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  const limitIdx = process.argv.indexOf("--limit");
  const limit = limitIdx !== -1 ? Number(process.argv[limitIdx + 1]) : Infinity;

  const catalogue = getFallbackCars();
  const extras: [string, string][] = [
    ["Mitsubishi", "Outlander"],
    ["Toyota", "RAV4"],
    ["Hyundai", "Tucson"],
    ["Kia", "Sportage"],
    ["Nissan", "Qashqai"],
    ["Ford", "Kuga"],
  ];

  const seen = new Set<string>();
  const entries: [string, string][] = [];
  for (const car of catalogue) {
    const key = imageKey(car.make, car.model);
    if (!seen.has(key)) {
      seen.add(key);
      entries.push([car.make, car.model]);
    }
  }
  for (const [make, model] of extras) {
    const key = imageKey(make, model);
    if (!seen.has(key)) {
      seen.add(key);
      entries.push([make, model]);
    }
  }

  const outPath = join(__dirname, "image-cache.json");
  let cache: Record<string, string> = {};
  try {
    cache = JSON.parse(readFileSync(outPath, "utf-8"));
  } catch {}

  let updated = 0;
  const total = Math.min(entries.length, limit);
  for (let i = 0; i < total; i++) {
    const [make, model] = entries[i];
    const key = imageKey(make, model);
    if (cache[key]) {
      process.stdout.write(`[${i + 1}/${total}] ${make} ${model} (cache)\n`);
      continue;
    }
    process.stdout.write(`[${i + 1}/${total}] ${make} ${model} ... `);
    const res = await resolvePhoto(make, model);
    if (res.url) {
      cache[key] = res.url;
      updated++;
      console.log(`OK (${res.title})`);
    } else {
      console.log("AUCUNE PHOTO");
    }
    await sleep(120);
  }

  writeFileSync(outPath, JSON.stringify(cache, null, 2));
  console.log(`\n${Object.keys(cache).length} modeles avec photo. ${updated} nouveaux. -> ${outPath}`);
}

main();
