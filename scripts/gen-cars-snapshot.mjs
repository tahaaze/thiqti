#!/usr/bin/env node
/**
 * Génère apps/web/src/data/cars-snapshot.ts depuis le cache disque local
 * (.cache/thiqti-cars.json). L'instantané sert de données de démarrage en
 * production (serverless : pas de cache disque persistant ni de mémoire
 * partagée entre instances).
 *
 * Usage : node scripts/gen-cars-snapshot.mjs
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const cacheFile = join(root, "apps", "web", ".cache", "thiqti-cars.json");
const outFile = join(root, "apps", "web", "src", "data", "cars-snapshot.ts");

const raw = readFileSync(cacheFile, "utf8");
const parsed = JSON.parse(raw);
if (!Array.isArray(parsed.cars) || parsed.cars.length === 0) {
  console.error("Cache vide ou invalide :", cacheFile);
  process.exit(1);
}

// Embarqué en chaîne template : on échappe backslash, backtick et ${
const escaped = raw.replace(/\\/g, "\\\\").replace(/`/g, "\\`").replace(/\$\{/g, "\\${");

mkdirSync(dirname(outFile), { recursive: true });
writeFileSync(
  outFile,
  `// AUTO-GÉNÉRÉ par scripts/gen-cars-snapshot.mjs — NE PAS ÉDITER
// Instantané du catalogue (${parsed.cars.length} annonces) généré le ${new Date().toISOString()}
export const CARS_SNAPSHOT_FETCHED_AT = ${JSON.stringify(parsed.fetchedAt)};
export const CARS_SNAPSHOT_JSON = \`${escaped}\`;
`,
  "utf8"
);
console.log(`OK ${outFile} (${parsed.cars.length} annonces, ${Math.round(raw.length / 1024)} Ko)`);
