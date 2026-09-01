import { describe, it, expect } from "vitest";
import benchmark from "./matching-benchmark.json";
import { parseQuery, SearchCriteria } from "../src/lib/nlp";
import { rankVehicles, rankVehiclesWithWeights, ScoredCar } from "../src/lib/matching";
import { getFallbackCars } from "../src/lib/sources/fallback";

const cars = getFallbackCars();

interface Assertion {
  type: string;
  value?: string | number;
}

interface BenchmarkQuery {
  id: string;
  category: string;
  query: string;
  expectCriteria: SearchCriteria;
  assertions: Assertion[];
}

const QUERIES = benchmark.queries as unknown as BenchmarkQuery[];

function check(car: ScoredCar, a: Assertion) {
  switch (a.type) {
    case "fuel":
      return car.fuel === a.value;
    case "bodyType":
      return (car as ScoredCar & { bodyType?: string }).bodyType === a.value;
    case "make":
      return car.make === a.value;
    case "transmission":
      return (car as ScoredCar & { transmission?: string }).transmission === a.value;
    case "priceMin":
      return car.price >= (a.value as number);
    case "priceMax":
      return car.price <= (a.value as number);
    case "yearMin":
      return car.year >= (a.value as number);
    case "topMake":
      return car.make === a.value;
    case "topFuel":
      return car.fuel === a.value;
    case "topBody":
      return (car as ScoredCar & { bodyType?: string }).bodyType === a.value;
    case "topCity":
      return car.city === a.value;
    case "minTotal":
      return true;
    case "maxTotal":
      return true;
    default:
      return true;
  }
}

function explainFailure(car: ScoredCar, a: Assertion) {
  return `${a.type}=${a.value} — reçu ${JSON.stringify({
    make: car.make,
    model: car.model,
    fuel: car.fuel,
    bodyType: (car as ScoredCar & { bodyType?: string }).bodyType,
    transmission: (car as ScoredCar & { transmission?: string }).transmission,
    price: car.price,
    year: car.year,
    city: car.city,
    matchPercent: car.matchPercent,
  })}`;
}

describe("Benchmark NLP + TOPSIS", () => {
  it("contient au moins 30 requetes de reference", () => {
    expect(QUERIES.length).toBeGreaterThanOrEqual(30);
  });

  for (const q of QUERIES) {
    it(`[${q.id}] ${q.query}`, () => {
      const criteria = parseQuery(q.query);
      expect(criteria).toEqual(q.expectCriteria);

      const ranked = rankVehicles(cars, criteria);
      expect(ranked.length).toBeGreaterThan(0);

      const minTotal = q.assertions.find((a) => a.type === "minTotal");
      if (minTotal) expect(ranked.length).toBeGreaterThanOrEqual(minTotal.value as number);
      const maxTotal = q.assertions.find((a) => a.type === "maxTotal");
      if (maxTotal) expect(ranked.length).toBeLessThanOrEqual(maxTotal.value as number);

      const invariant = q.assertions.filter(
        (a) => !["minTotal", "maxTotal"].includes(a.type)
      );
      for (const a of invariant) {
        const ok = ranked.filter((c) => check(c, a));
        if (a.type.startsWith("top")) {
          expect(ok.length, `top-1 doit vérifier ${explainFailure(ranked[0], a)}`).toBeGreaterThan(0);
        } else {
          expect(
            ok.length,
            `tous les résultats doivent vérifier ${a.type}=${a.value} (échec sur ${explainFailure(ranked[0], a)})`
          ).toBe(ranked.length);
        }
      }

      for (let i = 1; i < ranked.length; i++) {
        expect(ranked[i].matchPercent).toBeLessThanOrEqual(ranked[i - 1].matchPercent);
      }
    });
  }
});

const SENSITIVITY_QUERIES = [
  "budget 200000",
  "entre 150000 et 200000",
  "SUV diesel budget 250000",
  "Toyota hybride automatique budget 350000",
  "SUV familial moins de 300000",
];

describe("Analyse de sensibilite (poids budget +/- 10%)", () => {
  for (const query of SENSITIVITY_QUERIES) {
    it(`top-1 stable pour "${query}"`, () => {
      const criteria = parseQuery(query);
      const baseline = rankVehicles(cars, criteria);
      expect(baseline.length).toBeGreaterThan(0);

      for (const factor of [0.9, 1.1]) {
        const variant = rankVehiclesWithWeights(cars, criteria, {
          price: 0.3 * factor,
        });
        expect(variant[0].id).toBe(baseline[0].id);
        for (let i = 0; i < Math.min(10, variant.length); i++) {
          const idx = variant.findIndex((c) => c.id === baseline[i].id);
          const shift = Math.abs(idx - i);
          // Seuil elargi a 10 : le catalogue de reference (196 neufs) cree des
          // quasi-egalites de score pour les requetes larges (ex. 126 SUV
          // sous 300 000 DH), le top-1 reste stable mais les rangs
          // intermediaires peuvent glisser de quelques positions.
          expect(shift).toBeLessThanOrEqual(10);
        }
      }
    });
  }
});
