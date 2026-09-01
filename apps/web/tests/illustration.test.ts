import { describe, it, expect } from "vitest";
import { uid } from "@/lib/svgId";

describe("CarIllustration.uid", () => {
  it("ne contient jamais d'espace ou d'accent", () => {
    for (const m of ["Série 1", "Classe A", "Yaris Cross", "Tiggo 8 Pro", "S-Max", "C-HR"]) {
      expect(uid("paint", "BMW", m)).toMatch(/^[A-Za-z0-9_-]+$/);
    }
  });

  it("normalise les modeles problematiques", () => {
    expect(uid("paint", "BMW", "Série 1")).toBe("paint-BMW-Serie-1");
    expect(uid("paint", "Škoda", "Octavia")).toBe("paint-Skoda-Octavia");
    expect(uid("paint", "Dacia", "Duster")).toBe("paint-Dacia-Duster");
  });

  it("est deterministe", () => {
    expect(uid("sky", "Toyota", "Corolla")).toBe(uid("sky", "Toyota", "Corolla"));
  });
});
