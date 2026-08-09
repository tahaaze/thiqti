import { describe, it, expect, vi } from "vitest";
import { normalizeFuel, normalizeBody, normalizeBrand, generateId, computeScore, inferBodyType } from "@/lib/sources/types";
import { fetchAllSources, searchAllSources } from "@/lib/sources/aggregator";
import { getFallbackCars } from "@/lib/sources/fallback";

vi.mock("@/lib/sources/autera", () => ({ fetchAuteraCars: async () => [] }));
vi.mock("@/lib/sources/moteur", () => ({ fetchMoteurCars: async () => [] }));
vi.mock("@/lib/sources/electrodrive", () => ({ fetchElectroDriveCars: async () => [] }));
vi.mock("@/lib/sources/autohall", () => ({ fetchAutohallCars: async () => [] }));
vi.mock("@/lib/sources/moteur-neuf", () => ({ fetchMoteurNeufCars: async () => [] }));

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
    expect(normalizeBrand("ziggurat")).toBe("ziggurat");
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

  it("relache un mot courant si l'intersection est vide, sans perdre la marque", async () => {
    const result = await searchAllSources("Toyota SUV Diesel");
    expect(result.length).toBeGreaterThan(0);
    for (const car of result) {
      const haystack = `${car.make} ${car.model} ${car.title}`.toLowerCase();
      expect(haystack).toContain("toyota");
    }
  });
});

describe("catalogue de démonstration (isDemoData)", () => {
  it("getFallbackCars ne contient que des véhicules neufs, tous marqués isDemoData", () => {
    const cars = getFallbackCars();
    expect(cars.length).toBe(196);
    expect(cars.every((c) => c.inventoryType === "new")).toBe(true);
    expect(cars.every((c) => c.isDemoData === true)).toBe(true);
  });

  it("aucune occasion n'est dérivée du catalogue de démo", () => {
    expect(getFallbackCars().some((c) => c.inventoryType === "used")).toBe(false);
  });

  it("quand les sources live échouent, le secours sert le catalogue démo marqué", async () => {
    const cars = await fetchAllSources();
    expect(cars.length).toBe(196);
    expect(cars.every((c) => c.isDemoData === true)).toBe(true);
    const used = await searchAllSources("", "used");
    expect(used).toHaveLength(0);
  });

  it("le bug MG ZS 1.5 est corrigé (modèle 'ZS', pas 'ZS EV')", () => {
    const car = getFallbackCars().find((c) => c.title === "MG ZS 1.5 2024");
    expect(car?.model).toBe("ZS");
    expect(car?.fuel).toBe("Essence");
  });

  it("les carrosseries Pickup sont unifiées en Utilitaire", () => {
    const cars = getFallbackCars();
    expect(cars.some((c) => c.bodyType === "Pickup")).toBe(false);
    expect(cars.filter((c) => c.bodyType === "Utilitaire").length).toBeGreaterThanOrEqual(10);
  });

  it("aucun prix n'est stocké en notation scientifique", () => {
    const cars = getFallbackCars();
    const sci = cars.filter((c) => Number(c.price).toString().toLowerCase().includes("e"));
    expect(sci).toHaveLength(0);
    expect(cars.find((c) => c.model === "iX")?.price).toBe(1000000);
    expect(cars.find((c) => c.model === "GLE")?.price).toBe(1000000);
  });
});

describe("inferBodyType", () => {
  it("classifie les SUV courants du marche marocain", () => {
    expect(inferBodyType("Dacia", "Duster", "Dacia Duster 4x4 2023")).toBe("SUV");
    expect(inferBodyType("Renault", "Captur", "Renault Captur 2022")).toBe("SUV");
    expect(inferBodyType("Peugeot", "3008", "Peugeot 3008 GT 2023")).toBe("SUV");
    expect(inferBodyType("Toyota", "RAV4", "Toyota RAV4 Aventure")).toBe("SUV");
    expect(inferBodyType("Hyundai", "Tucson", "Hyundai Tucson 2022")).toBe("SUV");
    expect(inferBodyType("Kia", "Sportage", "Kia Sportage GT Line")).toBe("SUV");
    expect(inferBodyType("Mercedes", "GLC", "Mercedes GLC 300 4MATIC")).toBe("SUV");
    expect(inferBodyType("Volkswagen", "Tiguan", "Volkswagen Tiguan R-Line")).toBe("SUV");
  });

  it("classifie berlines et citadines", () => {
    expect(inferBodyType("Dacia", "Logan", "Dacia Logan 2022")).toBe("Berline");
    expect(inferBodyType("Toyota", "Corolla", "Toyota Corolla 2023")).toBe("Berline");
    expect(inferBodyType("Peugeot", "208", "Peugeot 208 2023")).toBe("Citadine");
    expect(inferBodyType("Renault", "Clio", "Renault Clio 2023")).toBe("Citadine");
    expect(inferBodyType("Volkswagen", "Polo", "Volkswagen Polo 2022")).toBe("Citadine");
  });

  it("fait gagner le modele le plus specifique (yaris vs yaris cross)", () => {
    expect(inferBodyType("Toyota", "Yaris", "Toyota Yaris 2022")).toBe("Citadine");
    expect(inferBodyType("Toyota", "Yaris Cross", "Toyota Yaris Cross 2023")).toBe("SUV");
    expect(inferBodyType("Toyota", "Corolla", "Toyota Corolla 2023")).toBe("Berline");
    expect(inferBodyType("Toyota", "Corolla Cross", "Toyota Corolla Cross 2023")).toBe("SUV");
  });

  it("utilise le titre en filet de securite", () => {
    expect(inferBodyType("Land Rover", "Range Rover", "Range Rover 4x4 2020")).toBe("SUV");
    expect(inferBodyType("Peugeot", "508", "Peugeot 508 SW 2022")).toBe("Break");
    expect(inferBodyType("Citroën", "Berlingo", "Citroën Berlingo fourgon")).toBe("Utilitaire");
  });

  it("reste sur Non precisé si rien ne correspond", () => {
    expect(inferBodyType("Ziggurat", "Zx-9", "Annonce exotique")).toBe("Non précisé");
    expect(inferBodyType("Suzuki", "Swift", "Suzuki Swift 2023")).toBe("Citadine");
  });
});
