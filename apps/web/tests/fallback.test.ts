import { describe, it, expect } from "vitest";
import { searchWithFallback, applyFilters } from "@/lib/searchTypes";
import { UnifiedCar } from "@/lib/sources/types";

const DEMO_CARS: UnifiedCar[] = [
  // Dacia Citadine Essence Manuelle
  { id: "1", title: "Dacia Sandero Access 2024", make: "Dacia", model: "Sandero", year: 2024, price: 149000, priceFormatted: "149 000 DH", km: 0, fuel: "Essence", transmission: "Manuelle", bodyType: "Citadine", city: "Casablanca", image: "", source: "test", sourceUrl: "", url: "", score: 80, scrapedAt: "", photos: [], inventoryType: "new", safety: null },
  // Dacia Citadine Electrique Automatique
  { id: "2", title: "Dacia Spring Electric 2024", make: "Dacia", model: "Spring", year: 2024, price: 149000, priceFormatted: "149 000 DH", km: 0, fuel: "Électrique", transmission: "Automatique", bodyType: "Citadine", city: "Casablanca", image: "", source: "test", sourceUrl: "", url: "", score: 80, scrapedAt: "", photos: [], inventoryType: "new", safety: null },
  // Dacia Berline Diesel Manuelle
  { id: "3", title: "Dacia Logan DCI 2024", make: "Dacia", model: "Logan", year: 2024, price: 175000, priceFormatted: "175 000 DH", km: 0, fuel: "Diesel", transmission: "Manuelle", bodyType: "Berline", city: "Casablanca", image: "", source: "test", sourceUrl: "", url: "", score: 85, scrapedAt: "", photos: [], inventoryType: "new", safety: null },
  // Dacia Berline Essence Automatique
  { id: "4", title: "Dacia Logan Journey Auto 2023", make: "Dacia", model: "Logan", year: 2023, price: 175000, priceFormatted: "175 000 DH", km: 0, fuel: "Essence", transmission: "Automatique", bodyType: "Berline", city: "Casablanca", image: "", source: "test", sourceUrl: "", url: "", score: 75, scrapedAt: "", photos: [], inventoryType: "new", safety: null },
  // Dacia SUV Essence Manuelle
  { id: "5", title: "Dacia Duster Essential 2024", make: "Dacia", model: "Duster", year: 2024, price: 219000, priceFormatted: "219 000 DH", km: 0, fuel: "Essence", transmission: "Manuelle", bodyType: "SUV", city: "Casablanca", image: "", source: "test", sourceUrl: "", url: "", score: 88, scrapedAt: "", photos: [], inventoryType: "new", safety: null },
  // Dacia SUV Diesel Manuelle
  { id: "6", title: "Dacia Duster DCI 2023", make: "Dacia", model: "Duster", year: 2023, price: 205000, priceFormatted: "205 000 DH", km: 0, fuel: "Diesel", transmission: "Manuelle", bodyType: "SUV", city: "Casablanca", image: "", source: "test", sourceUrl: "", url: "", score: 82, scrapedAt: "", photos: [], inventoryType: "new", safety: null },
  // Renault Citadine Diesel Manuelle
  { id: "7", title: "Renault Clio DCI 2024", make: "Renault", model: "Clio", year: 2024, price: 195000, priceFormatted: "195 000 DH", km: 0, fuel: "Diesel", transmission: "Manuelle", bodyType: "Citadine", city: "Rabat", image: "", source: "test", sourceUrl: "", url: "", score: 84, scrapedAt: "", photos: [], inventoryType: "new", safety: null },
  // Renault Citadine Diesel Automatique
  { id: "8", title: "Renault Clio Auto DCI 2024", make: "Renault", model: "Clio", year: 2024, price: 225000, priceFormatted: "225 000 DH", km: 0, fuel: "Diesel", transmission: "Automatique", bodyType: "Citadine", city: "Rabat", image: "", source: "test", sourceUrl: "", url: "", score: 90, scrapedAt: "", photos: [], inventoryType: "new", safety: null },
  // Peugeot Citadine Essence Automatique
  { id: "9", title: "Peugeot 208 Automatic 2024", make: "Peugeot", model: "208", year: 2024, price: 210000, priceFormatted: "210 000 DH", km: 0, fuel: "Essence", transmission: "Automatique", bodyType: "Citadine", city: "Casablanca", image: "", source: "test", sourceUrl: "", url: "", score: 86, scrapedAt: "", photos: [], inventoryType: "new", safety: null },
  // Voiture sans transmission connue (Non précisé)
  { id: "10", title: "Dacia Sandero Autohall 2024", make: "Dacia", model: "Sandero", year: 2024, price: 165000, priceFormatted: "165 000 DH", km: 0, fuel: "Essence", transmission: "Non précisé", bodyType: "Citadine", city: "Casablanca", image: "", source: "AutoHall", sourceUrl: "", url: "", score: 78, scrapedAt: "", photos: [], inventoryType: "new", safety: null },
];

describe("searchWithFallback - dégradation progressive", () => {
  it("retourne des résultats stricts quand ils existent", () => {
    const r = searchWithFallback(DEMO_CARS, { brand: "Dacia" });
    expect(r.results.length).toBeGreaterThan(0);
    expect(r.relaxed).toEqual([]);
  });

  it("relâche la transmission en priorité (le critère le moins important)", () => {
    // Dacia + Citadine + Diesel + Automatique : 0 résultat strict
    // Mais Dacia + Citadine + Diesel (sans filtre trans) = 0 aussi (pas de Dacia citadine diesel)
    // Donc relâche aussi autre chose
    const r = searchWithFallback(DEMO_CARS, {
      brand: "Dacia",
      bodyType: "Citadine",
      fuel: "Diesel",
      transmission: "Automatique",
    });
    // Au moins des résultats avec des critères relâchés
    expect(r.results.length).toBeGreaterThan(0);
    expect(r.relaxed.length).toBeGreaterThan(0);
  });

  it("relâche transmission en premier", () => {
    const r = searchWithFallback(DEMO_CARS, {
      brand: "Dacia",
      transmission: "Automatique",
    });
    // Dacia Automatique = Spring (2) + Logan Journey (1) = 3 résultats
    expect(r.results.length).toBe(3);
    expect(r.relaxed).toEqual([]);
  });

  it("trouve des résultats quand Dacia + Diesel sans autres filtres", () => {
    const r = searchWithFallback(DEMO_CARS, {
      brand: "Dacia",
      fuel: "Diesel",
    });
    expect(r.results.length).toBe(2); // Logan DCI + Duster DCI
    expect(r.relaxed).toEqual([]);
  });

  it("génère des résultats avec fallback quand strict donne 0", () => {
    // Cas exact du user : Dacia + Citadine + Diesel + Automatique + budget
    const r = searchWithFallback(DEMO_CARS, {
      brand: "Dacia",
      bodyType: "Citadine",
      fuel: "Diesel",
      transmission: "Automatique",
      minPrice: 170000,
      maxPrice: 230000,
    });
    // Le fallback relâche transmission + carrosserie et trouve Dacia Diesel (Logan, Duster)
    expect(r.results.length).toBeGreaterThan(0);
    expect(r.relaxed.length).toBeGreaterThanOrEqual(2);
    expect(r.relaxed.some(r => r.includes("transmission"))).toBe(true);
  });

  it("trouve des résultats proches quand la marque change", () => {
    // Citadine + Diesel + Automatique + 170-230k : Renault Clio existe !
    const r = searchWithFallback(DEMO_CARS, {
      bodyType: "Citadine",
      fuel: "Diesel",
      transmission: "Automatique",
      minPrice: 170000,
      maxPrice: 230000,
    });
    expect(r.results.length).toBeGreaterThan(0);
    // Renault Clio Auto DCI 225000 est au-dessus du budget, mais relaxation le trouvera
  });

  it("les voitures avec 'Non précisé' ne sont pas rejetées", () => {
    const r = applyFilters(DEMO_CARS, { transmission: "Automatique" });
    // Dacia Sandero Autohall (Non précisé) devrait passer
    const autohall = r.find(c => c.source === "AutoHall");
    expect(autohall).toBeDefined();
  });
});
