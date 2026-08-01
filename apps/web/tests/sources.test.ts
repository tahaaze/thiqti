import { describe, it, expect } from "vitest";
import { normalizeFuel, normalizeBody, normalizeBrand, generateId, computeScore } from "@/lib/sources/types";
import { fetchAllSources, searchAllSources } from "@/lib/sources/aggregator";

describe("normalizeFuel", () => {
  it("normalise les carburants connus", () => {
    expect(normalizeFuel("diesel")).toBe("Diesel");
    expect(normalizeFuel("gasoline")).toBe("Essence");
    expect(normalizeFuel("hybrid")).toBe("Hybride");
    expect(normalizeFuel("électrique")).toBe("Électrique");
  });

  it("retourne la valeur brute si inconnue", () => {
    expect(normalizeFuel("gpl")).toBe("gpl");
  });
});

describe("normalizeBody", () => {
  it("normalise les carrosseries connues", () => {
    expect(normalizeBody("suv")).toBe("SUV");
    expect(normalizeBody("4x4")).toBe("SUV");
    expect(normalizeBody("pickup")).toBe("Utilitaire");
    expect(normalizeBody("compacte")).toBe("Compacte");
  });

  it("retourne la valeur brute si inconnue", () => {
    expect(normalizeBody("roadster")).toBe("roadster");
  });
});

describe("normalizeBrand", () => {
  it("resout les alias de marques", () => {
    expect(normalizeBrand("vw")).toBe("Volkswagen");
    expect(normalizeBrand("mercedes-benz")).toBe("Mercedes");
    expect(normalizeBrand("citroen")).toBe("Citroën");
    expect(normalizeBrand("skoda")).toBe("Škoda");
  });

  it("retourne la valeur brute si inconnue", () => {
    expect(normalizeBrand("tata")).toBe("tata");
  });
});

describe("generateId", () => {
  it("est deterministe pour les memes entrees", () => {
    const a = generateId("fallback", "toyota", "corolla", 2023, 0, 250000);
    const b = generateId("fallback", "toyota", "corolla", 2023, 0, 250000);
    expect(a).toBe(b);
    expect(a).toMatch(/^src_/);
  });

  it("produit des ids differents pour des entrees differentes", () => {
    const a = generateId("fallback", "toyota", "corolla", 2023, 0, 250000);
    const b = generateId("fallback", "toyota", "corolla", 2024, 0, 250000);
    expect(a).not.toBe(b);
  });
});

describe("computeScore", () => {
  it("bonifie les vehicules recents", () => {
    expect(computeScore(2026, 0, 250000)).toBe(95);
    expect(computeScore(2025, 0, 250000)).toBe(95);
    expect(computeScore(2024, 0, 250000)).toBe(90);
  });

  it("penalise les vehicules anciens et fortement kilometres", () => {
    expect(computeScore(2018, 150000, 100000)).toBe(55);
  });

  it("borne le score entre 55 et 98", () => {
    const s = computeScore(2010, 300000, 50000);
    expect(s).toBeGreaterThanOrEqual(55);
    expect(s).toBeLessThanOrEqual(98);
  });
});

describe("aggregator", () => {
  it("fournit le catalogue via fetchAllSources", async () => {
    const cars = await fetchAllSources();
    expect(cars.length).toBeGreaterThanOrEqual(100);
    expect(cars[0].id).toBeTruthy();
  });

  it("met en cache et retourne la meme reference", async () => {
    const first = await fetchAllSources();
    const second = await fetchAllSources();
    expect(second).toBe(first);
  });

  it("retourne tout le catalogue sur une requete vide", async () => {
    const all = await fetchAllSources();
    const result = await searchAllSources("");
    expect(result).toHaveLength(all.length);
  });

  it("filtre sur un mot cle", async () => {
    const result = await searchAllSources("toyota");
    expect(result.length).toBeGreaterThan(0);
    for (const car of result) {
      const haystack = `${car.make} ${car.model} ${car.title}`.toLowerCase();
      expect(haystack).toContain("toyota");
    }
  });

  it("filtre sur plusieurs mots (ET logique)", async () => {
    const result = await searchAllSources("diesel casablanca");
    expect(result.length).toBeGreaterThan(0);
    for (const car of result) {
      const haystack = `${car.make} ${car.model} ${car.title} ${car.fuel} ${car.city}`.toLowerCase();
      expect(haystack).toContain("diesel");
      expect(haystack).toContain("casablanca");
    }
  });

  it("retourne une liste vide si aucun vehicule ne correspond", async () => {
    const result = await searchAllSources("zzzqqqx");
    expect(result).toHaveLength(0);
  });
});
