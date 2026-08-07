import { describe, it, expect } from "vitest";
import { extractBrandFromTitle, extractModelFromTitle } from "../src/lib/sources/moteur";

const brandOf = (title: string) => extractBrandFromTitle(title) ?? "Autre";

describe("extractBrandFromTitle (moteur.ma) — marque n'importe où dans le titre", () => {
  it.each([
    ["1851 - Toyota Yaris Cross 2023 - 4x4", "Toyota"],
    ["polo Volkswagen", "Volkswagen"],
    ["206 plus diesel", "Autre"],
    ["🚗 Fiat 500 – Très bon état", "Fiat"],
    ["Kénitra Kénitra [modèle]", "Autre"],
    ["LAND ROVER DISCOVERY SPORT – 2017", "Land Rover"],
    ["1929 - Mercedes GLE Coupé 2025", "Mercedes"],
    ["Mazda3 2024", "Mazda"],
    ["Citroën C3 Aircross 2023", "Citroën"],
    ["VW Golf 7 TDI", "Volkswagen"],
    ["Skoda Octavia 2021", "Škoda"],
    ["Mercedes-Benz Classe C 2020", "Mercedes"],
    ["daciya logan 2019", "Autre"],
    ["SUV hybride familiale", "Autre"],
    ["Daihatsu Sirion Essence Manuelle 2008", "Daihatsu"],
    ["DS 7 Crossback – 2024", "DS"],
  ])("%s → make=%s", (title, expected) => {
    expect(brandOf(title)).toBe(expected);
  });
});

describe("extractModelFromTitle (moteur.ma) — modèle lisible sans la marque", () => {
  it.each([
    ["1851 - Toyota Yaris Cross 2023 - 4x4", "Toyota", "Yaris Cross 2023 4x4"],
    ["polo Volkswagen", "Volkswagen", "polo"],
    ["206 plus diesel", "Autre", "206 plus diesel"],
    ["🚗 Fiat 500 – Très bon état", "Fiat", "500 Très bon état"],
    ["Kénitra Kénitra [modèle]", "Autre", "modèle"],
    ["LAND ROVER DISCOVERY SPORT – 2017", "Land Rover", "DISCOVERY SPORT 2017"],
    ["1929 - Mercedes GLE Coupé 2025", "Mercedes", "GLE Coupé 2025"],
    ["Mazda3 2024", "Mazda", "Mazda3 2024"],
    ["Citroën C3 Aircross 2023", "Citroën", "C3 Aircross 2023"],
    ["DS 7 Crossback – 2024", "DS", "7 Crossback 2024"],
    ["Daihatsu Sirion Essence Manuelle 2008", "Daihatsu", "Sirion Essence Manuelle 2008"],
  ])("%s (make=%s) → model=%s", (title, make, expected) => {
    expect(extractModelFromTitle(title, make)).toBe(expected);
  });
});
