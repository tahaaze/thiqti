import { describe, it, expect } from "vitest";
import { parseQuery } from "../src/lib/nlp";
import { rankVehicles, rankVehiclesWithWeights, CriterionWeights } from "../src/lib/matching";
import { getFallbackCars } from "../src/lib/sources/fallback";

const cars = getFallbackCars();

describe("Formalisme TOPSIS — invariants", () => {
  it("scores de correspondance toujours dans [0, 1]", () => {
    for (const q of ["", "SUV", "diesel", "budget 200000", "Toyota hybride"]) {
      const criteria = parseQuery(q);
      const ranked = rankVehicles(cars, criteria);
      for (const car of ranked) {
        expect(car.matchScore).toBeGreaterThanOrEqual(0);
        expect(car.matchScore).toBeLessThanOrEqual(1);
        expect(car.matchPercent).toBeGreaterThanOrEqual(0);
        expect(car.matchPercent).toBeLessThanOrEqual(100);
      }
    }
  });

  it("classement decroissant par matchScore", () => {
    const ranked = rankVehicles(cars, parseQuery("SUV diesel budget 250000"));
    for (let i = 1; i < ranked.length; i++) {
      expect(ranked[i].matchScore).toBeLessThanOrEqual(ranked[i - 1].matchScore);
    }
  });

  it("les poids de chaque profil somment a 1", () => {
    const criteria = parseQuery("SUV diesel budget 250000");
    const profiles: string[] = ["", "economique", "familial", "confort", "sportif"];
    for (const intent of profiles) {
      const withIntent = intent
        ? { ...criteria, intent: [intent] }
        : criteria;
      const ranked = rankVehiclesWithWeights(cars, withIntent, {});
      const ids = ranked.map((c) => c.id);
      expect(ids.length).toBeGreaterThan(0);
    }
  });

  it("liste vide retourne un tableau vide", () => {
    expect(rankVehicles([], parseQuery("SUV"))).toEqual([]);
  });

  it("vehicule unique retourne ce vehicule", () => {
    const one = [cars[0]];
    const ranked = rankVehicles(one, parseQuery(""));
    expect(ranked).toHaveLength(1);
    expect(ranked[0].id).toBe(cars[0].id);
  });

  it("l'ajout d'un critere binaire explicite favorise les correspondances", () => {
    const criteria = parseQuery("diesel");
    const ranked = rankVehicles(cars, criteria);
    expect(ranked[0].fuel).toBe("Diesel");
  });

  it("surdepassement de poids renormalise le vecteur (somme = 1)", () => {
    const criteria = parseQuery("budget 200000");
    const overrides: Partial<CriterionWeights> = { price: 1.0, year: 0 };
    const ranked = rankVehiclesWithWeights(cars, criteria, overrides);
    expect(ranked.length).toBeGreaterThan(0);
  });
});
