/**
 * Script de mise à jour périodique de la réputation.
 *
 * Usage :
 *   npx tsx src/scripts/refresh-reputation.ts
 *   npx tsx src/scripts/refresh-reputation.ts --model "Toyota RAV4"
 *   npx tsx src/scripts/refresh-reputation.ts --top 20
 *
 * Lit les modèles les plus recherchés depuis search_logs,
 * scrape les avis, analyse via LLM, met à jour le cache.
 */

import { Pool } from "pg";
import { refreshReputation } from "../lib/reputation/reputationService";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

interface ModelCount {
  make: string;
  model: string;
  count: number;
}

async function getTopModels(limit: number): Promise<ModelCount[]> {
  try {
    const result = await pool.query(`
      SELECT
        COALESCE(
          (query->>'brand')::text,
          (query->>'make')::text,
          'Inconnu'
        ) AS make,
        COALESCE(
          (query->>'model')::text,
          'Inconnu'
        ) AS model,
        COUNT(*) AS count
      FROM search_logs
      WHERE query IS NOT NULL
      GROUP BY make, model
      ORDER BY count DESC
      LIMIT $1
    `, [limit]);
    return result.rows.filter((r) => r.make !== "Inconnu" && r.model !== "Inconnu");
  } catch {
    // Fallback: modèles populaires au Maroc
    return [
      { make: "Dacia", model: "Duster", count: 100 },
      { make: "Renault", model: "Clio", count: 80 },
      { make: "Toyota", model: "RAV4", count: 70 },
      { make: "Hyundai", model: "Tucson", count: 65 },
      { make: "Kia", model: "Sportage", count: 60 },
      { make: "Dacia", model: "Logan", count: 55 },
      { make: "Peugeot", model: "208", count: 50 },
      { make: "Renault", model: "Captur", count: 45 },
      { make: "Toyota", model: "Corolla", count: 40 },
      { make: "Hyundai", model: "i10", count: 35 },
      { make: "Ford", model: "Ranger", count: 30 },
      { make: "Nissan", model: "Qashqai", count: 28 },
      { make: "Volkswagen", model: "Golf", count: 25 },
      { make: "Mercedes-Benz", model: "Classe A", count: 22 },
      { make: "BMW", model: "Série 3", count: 20 },
    ];
  }
}

async function main() {
  const args = process.argv.slice(2);
  const singleModel = args.includes("--model") ? args[args.indexOf("--model") + 1] : null;
  const topN = args.includes("--top") ? parseInt(args[args.indexOf("--top") + 1]) : 20;

  console.log("🔄 Mise à jour de la réputation des véhicules...\n");

  let models: ModelCount[];
  if (singleModel) {
    const [make, ...rest] = singleModel.split(" ");
    models = [{ make, model: rest.join(" "), count: 1 }];
  } else {
    models = await getTopModels(topN);
  }

  console.log(`📊 ${models.length} modèles à traiter\n`);

  let success = 0;
  let errors = 0;

  for (const { make, model, count } of models) {
    process.stdout.write(`  ${make} ${model} (${count} recherches)... `);
    try {
      const result = await refreshReputation(make, model);
      console.log(`✅ Score: ${result.score}/100 (${result.reviewCount} avis)`);
      success++;
    } catch (e) {
      console.log(`❌ Erreur: ${e}`);
      errors++;
    }
    // Pause entre les modèles pour ne pas surcharger
    await new Promise((r) => setTimeout(r, 2000));
  }

  console.log(`\n✨ Terminé : ${success} réussis, ${errors} erreurs`);
  await pool.end();
}

main().catch((e) => {
  console.error("Fatal:", e);
  process.exit(1);
});
