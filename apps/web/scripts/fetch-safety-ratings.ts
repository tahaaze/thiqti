// ============================================================================
// COLLECTE DE NOTATIONS DE SECURITE REELLES PAR MODELE
// ============================================================================
//
// Sources (gratuites, sans cle API) :
//   1. Euro NCAP — API publique de www.euroncap.com : chaque evaluation contient
//      le nombre d'etoiles officiel (0-5), l'annee d'evaluation et la classe.
//   2. NHTSA (5-Star Safety Ratings) — api.nhtsa.gov pour les modeles absents
//      du programme Euro NCAP (marques US / hors Europe principalement).
//
// Resultat : scripts/euroncap-cache.json, consomme ensuite par
// src/lib/safetyRatings.ts (aucun appel reseau au moment de la requete).
//
// Usage : npx tsx scripts/fetch-safety-ratings.ts
// ============================================================================

import { writeFileSync } from "fs";
import { join } from "path";
import { getFallbackCars } from "../src/lib/sources/fallback";
import {
  SafetyEntry,
  findMatch,
  makeKey,
  modelKey,
  NHTSA_MODEL_ALIASES,
} from "../src/lib/safetyAliases";

const EURO_NCAP_LIST = "https://www.euroncap.com/api/CarListRoute?path=/assessments&limit=100&offset=";
const NHTSA_SEARCH = "https://api.nhtsa.gov/SafetyRatings/modelyear/{year}/make/{make}/model/{model}?format=json";
const NHTSA_BY_ID = "https://api.nhtsa.gov/SafetyRatings/VehicleId/{id}?format=json";
const USER_AGENT = "Thiqti/1.0 (safety ratings resolver; contact: dev@thiqti.ma)";

async function getJson(url: string): Promise<any> {
  const res = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
  if (!res.ok) return null;
  try {
    return await res.json();
  } catch {
    return null;
  }
}

async function fetchEuroNcap(): Promise<SafetyEntry[]> {
  const entries: SafetyEntry[] = [];
  let offset = 0;
  for (;;) {
    const data = await getJson(`${EURO_NCAP_LIST}${offset}`);
    if (!data?.items?.length) break;
    for (const item of data.items) {
      if (item?.assessmentType?.code !== "CAR_SAFETY") continue;
      const stars = item?.carSafety?.safetyRatingStars;
      if (typeof stars !== "number" || stars < 0 || stars > 5) continue;
      const make = item?.make?.name;
      const model = item?.model?.name;
      if (!make || !model) continue;
      entries.push({
        make,
        model,
        stars,
        ratingYear: item.ratingYear || item.publicationYear || 0,
        className: item?.model?.class?.name || "",
        source: "euroncap",
        id: String(item.id || ""),
      });
    }
    const total = data.meta?.totalCount ?? 0;
    if (offset + data.items.length >= total) break;
    offset += data.items.length;
    await sleep(150);
  }
  return entries;
}

/** Derniere evaluation (la plus recente) par marque+modele. */
function dedupeLatest(entries: SafetyEntry[]): SafetyEntry[] {
  const best = new Map<string, SafetyEntry>();
  for (const entry of entries) {
    const key = `${makeKey(entry.make)}__${modelKey(entry.model)}`;
    const current = best.get(key);
    if (!current || entry.ratingYear > current.ratingYear) best.set(key, entry);
  }
  return [...best.values()];
}

const NHTSA_MAKES: Record<string, string> = {
  "Mercedes": "Mercedes-Benz",
  "Volkswagen": "Volkswagen",
  "Škoda": "Skoda",
  "Mitsubishi": "Mitsubishi",
  "Haval": "Haval",
  "MG": "MG",
  "BYD": "BYD",
};

async function fetchNhtsa(make: string, model: string, years: number[]): Promise<SafetyEntry | null> {
  const nhtsaMake = NHTSA_MAKES[make] || make;
  const nhtsaModel = NHTSA_MODEL_ALIASES[model] || model;
  for (const year of years) {
    const url = NHTSA_SEARCH
      .replace("{year}", String(year))
      .replace("{make}", encodeURIComponent(nhtsaMake))
      .replace("{model}", encodeURIComponent(nhtsaModel));
    const data = await getJson(url);
    const vehicleId = data?.Results?.[0]?.VehicleId;
    if (!vehicleId) {
      await sleep(120);
      continue;
    }
    const rating = await getJson(NHTSA_BY_ID.replace("{id}", String(vehicleId)));
    const overall = rating?.Results?.[0]?.OverallRating;
    if (overall != null && /^\d(\.\d)?$/.test(String(overall))) {
      return {
        make,
        model,
        stars: Number(overall),
        ratingYear: year,
        className: data.Results[0].VehicleDescription || "",
        source: "nhtsa",
        id: String(vehicleId),
      };
    }
    await sleep(120);
  }
  return null;
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function coverageReport(catalogue: ReturnType<typeof getFallbackCars>, entries: SafetyEntry[]) {
  const seen = new Set<string>();
  let covered = 0;
  let total = 0;
  const missing: string[] = [];
  for (const car of catalogue) {
    const key = `${makeKey(car.make)}__${modelKey(car.model)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    total++;
    const match = findMatch(entries, car.make, car.model);
    if (match) covered++;
    else missing.push(`${car.make} ${car.model}`);
  }
  console.log(`\n=== Couverture catalogue : ${covered}/${total} modeles avec notation reelle ===`);
  if (missing.length) {
    console.log("Sans notation : " + missing.join(", "));
  }
  return covered;
}

async function main() {
  console.log("Recuperation des evaluations Euro NCAP...");
  const euroncap = dedupeLatest(await fetchEuroNcap());
  console.log(`${euroncap.length} modeles Euro NCAP (derniere evaluation chacun).`);

  const catalogue = getFallbackCars();
  const seen = new Set<string>();
  const missingEuro: { make: string; model: string }[] = [];
  for (const car of catalogue) {
    const key = `${makeKey(car.make)}__${modelKey(car.model)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    if (!findMatch(euroncap, car.make, car.model)) {
      missingEuro.push({ make: car.make, model: car.model });
    }
  }

  console.log(`\n${missingEuro.length} modeles du catalogue hors Euro NCAP. Complement NHTSA...`);
  const nhtsa: SafetyEntry[] = [];
  for (const { make, model } of missingEuro) {
    const found = await fetchNhtsa(make, model, [2024, 2023, 2022, 2021]);
    if (found) nhtsa.push(found);
    process.stdout.write(`  ${make} ${model} -> ${found ? `${found.stars} etoiles NHTSA` : "aucune note"}\n`);
  }

  const all = [...euroncap, ...nhtsa];
  const outPath = join(__dirname, "euroncap-cache.json");
  writeFileSync(
    outPath,
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        source: "Euro NCAP (euroncap.com/api/CarListRoute) + NHTSA (api.nhtsa.gov)",
        entries: all,
      },
      null,
      2
    )
  );
  console.log(`\n${all.length} entrees -> ${outPath}`);

  coverageReport(catalogue, all);
}

main();
