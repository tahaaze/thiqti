import { describe, it, expect } from "vitest";
import { safetyRatingFor, exactSafetyRatingFor, safetyLabel, safetyLevel } from "../src/lib/safetyRatings";
import { getFallbackCars } from "../src/lib/sources/fallback";

describe("Notation de securite reelle — resolution", () => {
  it("Toyota RAV4 : 5 etoiles Euro NCAP", () => {
    const safety = safetyRatingFor("Toyota", "RAV4");
    expect(safety).not.toBeNull();
    expect(safety!.stars).toBe(5);
    expect(safety!.source).toBe("euroncap");
  });

  it("Dacia Sandero : 2 etoiles (note reelle, pas inventee)", () => {
    const safety = safetyRatingFor("Dacia", "Sandero");
    expect(safety).not.toBeNull();
    expect(safety!.stars).toBeLessThan(5);
    expect(safety!.stars).toBeGreaterThan(0);
  });

  it("Hyundai Elantra : 5 etoiles NHTSA (hors Europe)", () => {
    const safety = safetyRatingFor("Hyundai", "Elantra");
    expect(safety).not.toBeNull();
    expect(safety!.stars).toBe(5);
    expect(safety!.source).toBe("nhtsa");
  });

  it("variants : Mercedes Classe A et BMW Serie 1", () => {
    expect(safetyRatingFor("Mercedes", "Classe A")?.stars).toBe(5);
    expect(safetyRatingFor("BMW", "Série 1")?.stars).toBeGreaterThanOrEqual(1);
  });

  it("marque croisee : Renault Duster = Dacia Duster", () => {
    const safety = safetyRatingFor("Renault", "Duster");
    expect(safety).not.toBeNull();
    expect(safety!.make).toBe("Dacia");
  });

  it("modele jamais evalue -> null (honnete)", () => {
    expect(safetyRatingFor("Renault", "Kardian")).toBeNull();
    expect(safetyRatingFor("Haval", "Jolion")).toBeNull();
  });
});

describe("Notation de securite reelle — cache du catalogue", () => {
  it("toutes les notations resolues sont officielles (0-5 etoiles)", () => {
    const seen = new Set<string>();
    for (const car of getFallbackCars()) {
      const key = `${car.make}_${car.model}`;
      if (seen.has(key)) continue;
      seen.add(key);
      const safety = safetyRatingFor(car.make, car.model);
      if (!safety) continue;
      expect(safety.stars).toBeGreaterThanOrEqual(0);
      expect(safety.stars).toBeLessThanOrEqual(5);
      expect(["euroncap", "nhtsa"]).toContain(safety.source);
      expect(safety.ratingYear).toBeGreaterThan(0);
    }
  });

  it("la majorite des modeles du catalogue disposent d'une note reelle", () => {
    const seen = new Set<string>();
    let total = 0;
    let covered = 0;
    for (const car of getFallbackCars()) {
      const key = `${car.make}_${car.model}`;
      if (seen.has(key)) continue;
      seen.add(key);
      total++;
      if (safetyRatingFor(car.make, car.model)) covered++;
    }
    expect(covered / total).toBeGreaterThan(0.7);
  });
});

describe("Libelles et niveaux", () => {
  it("safetyLabel rend la source et l'annee", () => {
    expect(safetyLabel(safetyRatingFor("Toyota", "RAV4"))).toMatch(/5 étoiles/);
    expect(safetyLabel(safetyRatingFor("Hyundai", "Elantra"))).toMatch(/NHTSA/);
    expect(safetyLabel(null)).toBe("Non évalué");
  });

  it("safetyLevel traduit les etoiles en niveau", () => {
    expect(safetyLevel(5)).toBe("elevee");
    expect(safetyLevel(3)).toBe("moyenne");
    expect(safetyLevel(1)).toBe("faible");
    expect(safetyLevel(null)).toBeNull();
  });
});
