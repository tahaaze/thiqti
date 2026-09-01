#!/usr/bin/env node
/**
 * Migrates schema.sql + seed.sql to a remote PostgreSQL (e.g. Neon).
 * Usage: node scripts/db-migrate.mjs
 * Reads DATABASE_URL from process env or .env file.
 */
import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function loadEnv() {
  const envPath = join(root, ".env");
  if (!existsSync(envPath)) return;
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
}

loadEnv();

const connectionString = process.env.DATABASE_URL || process.argv[2];
if (!connectionString) {
  console.error("Missing DATABASE_URL (env var or first argument)");
  process.exit(1);
}

const seedOnly = process.argv.includes("--seed-only");

const files = [
  ...(!seedOnly ? [join(root, "packages", "database", "schema.sql")] : []),
  join(root, "packages", "database", "seed.sql"),
];

const client = new pg.Client({
  connectionString,
  ssl: { rejectUnauthorized: false },
});

await client.connect();
for (const file of files) {
  const name = file.split(/[\\/]/).pop();
  console.log(`Running ${name}...`);
  await client.query(readFileSync(file, "utf8"));
  console.log(`OK ${name}`);
}
const counts = await client.query(
  "SELECT (SELECT COUNT(*) FROM vehicles) AS vehicles, (SELECT COUNT(*) FROM reviews) AS reviews"
);
console.log("Rows:", counts.rows[0]);
await client.end();
console.log("Migration done.");
