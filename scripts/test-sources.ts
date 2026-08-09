// Script de test — scraping réel Autohall + Moteur.neuf
// Utilisation : npx tsx scripts/test-sources.ts

import { fetchAutohallCars } from "../apps/web/src/lib/sources/autohall";
import { fetchMoteurNeufCars } from "../apps/web/src/lib/sources/moteur-neuf";

async function main() {
  console.log("=".repeat(60));
  console.log("SCRAPING RÉEL — Autohall.ma + Moteur.ma neuf");
  console.log("=".repeat(60));

  // --- AUTOHALL ---
  console.log("\n--- AUTOHALL.MA ---");
  const t0 = Date.now();
  let autohallCars: Awaited<ReturnType<typeof fetchAutohallCars>> = [];
  try {
    autohallCars = await fetchAutohallCars();
  } catch (e) {
    console.error("ERREUR Autohall:", e);
  }
  const autohallTime = ((Date.now() - t0) / 1000).toFixed(1);
  console.log(`Véhicules récupérés : ${autohallCars.length}`);
  console.log(`Temps total : ${autohallTime}s`);

  // Stats autohall
  const autohallBrands: Record<string, number> = {};
  let autohallWithPrice = 0;
  let autohallWithoutPrice = 0;
  for (const car of autohallCars) {
    autohallBrands[car.make] = (autohallBrands[car.make] || 0) + 1;
    if (car.price > 0) autohallWithPrice++;
    else autohallWithoutPrice++;
  }
  console.log("\nRépartition par marque :");
  for (const [brand, count] of Object.entries(autohallBrands).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${brand}: ${count}`);
  }
  console.log(`\nAvec prix : ${autohallWithPrice}`);
  console.log(`Sans prix : ${autohallWithoutPrice}`);

  // --- MOTEUR NEUF ---
  console.log("\n--- MOTEUR.MA NEUF ---");
  const t1 = Date.now();
  let moteurNeufCars: Awaited<ReturnType<typeof fetchMoteurNeufCars>> = [];
  try {
    moteurNeufCars = await fetchMoteurNeufCars();
  } catch (e) {
    console.error("ERREUR Moteur.neuf:", e);
  }
  const moteurNeufTime = ((Date.now() - t1) / 1000).toFixed(1);
  console.log(`Véhicules récupérés : ${moteurNeufCars.length}`);
  console.log(`Temps total : ${moteurNeufTime}s`);

  // Stats moteur neuf
  const moteurBrands: Record<string, number> = {};
  let moteurWithPrice = 0;
  let moteurWithoutPrice = 0;
  for (const car of moteurNeufCars) {
    moteurBrands[car.make] = (moteurBrands[car.make] || 0) + 1;
    if (car.price > 0) moteurWithPrice++;
    else moteurWithoutPrice++;
  }
  console.log("\nRépartition par marque :");
  for (const [brand, count] of Object.entries(moteurBrands).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${brand}: ${count}`);
  }
  console.log(`\nAvec prix : ${moteurWithPrice}`);
  console.log(`Sans prix : ${moteurWithoutPrice}`);

  // --- TOTAL ---
  console.log("\n" + "=".repeat(60));
  console.log("RÉCAPITULATIF");
  console.log("=".repeat(60));
  console.log(`Autohall : ${autohallCars.length} véhicules (${autohallTime}s)`);
  console.log(`Moteur.neuf : ${moteurNeufCars.length} véhicules (${moteurNeufTime}s)`);
  console.log(`TOTAL : ${autohallCars.length + moteurNeufCars.length} véhicules`);
  console.log(`Temps total : ${((Date.now() - t0) / 1000).toFixed(1)}s`);
}

main().catch(console.error);
