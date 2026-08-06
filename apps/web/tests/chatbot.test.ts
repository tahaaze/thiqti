import { describe, it, expect } from "vitest";
import { answer, createInitialState, initialMessage, buildSearchRequest, recommendationText } from "@/lib/chatbot";

const car = (id: string, title: string, priceFormatted: string, score: number) => ({
  id, title, make: "Dacia", model: "Duster", year: 2024, price: 200000, priceFormatted,
  km: 0, fuel: "Essence", city: "Casablanca", image: "", source: "Données Maroc", score,
});

describe("conversation chatbot", () => {
  it("accepte un nombre seul comme budget (bug fixe)", () => {
    let s = createInitialState();
    const r = answer(s, "200000");
    expect(r.state.criteria.budgetMax).toBe(230000);
    expect(r.state.criteria.budgetMin).toBe(170000);
  });

  it("comprend une phrase complete et passe direct aux recommandations", () => {
    let s = createInitialState();
    const r = answer(s, "Dacia SUV essence 2022 moins de 250000 DH");
    expect(r.done).toBe(true);
    expect(r.state.criteria.carrosserie).toBe("SUV");
    expect(r.state.criteria.motorisation).toBe("Essence");
    expect(r.state.criteria.marque).toBe("Dacia");
    expect(buildSearchRequest(r.state).type).toBeUndefined();
  });

  it("guide pas a pas et permet de passer les questions", () => {
    let s = createInitialState();
    let r = answer(s, "200000");
    expect(r.done).toBe(false);
    expect(r.text).toContain("Compris");
    r = answer(r.state, "SUV");
    expect(r.state.criteria.carrosserie).toBe("SUV");
    r = answer(r.state, "Passer"); // carburant ignore
    expect(r.state.skipped).toContain("carburant");
    r = answer(r.state, "Passer"); // marque ignoree
    expect(r.state.skipped).toContain("marque");
    r = answer(r.state, "2022"); // annee renseignee
    expect(r.state.criteria.anneeMin).toBe(2022);
    expect(r.done).toBe(true);
  });

  it("detecte neuf/occasion", () => {
    let s = createInitialState();
    const r = answer(s, "neuf 250000");
    expect(r.state.inventoryType).toBe("new");
  });

  it("gere la politesse et les messages incompris", () => {
    let s = createInitialState();
    const g = answer(s, "bonjour");
    expect(g.text).toContain("Bonjour");
    const u = answer(s, "blablabla");
    expect(u.text).toContain("pas bien compris");
  });

  it("genere un message de recommandation", () => {
    const s = createInitialState();
    const r = answer(s, "SUV 200000 diesel");
    const t = recommendationText([car("a", "Duster", "200 000 DH", 92)], r.state);
    expect(t).toContain("Duster");
    expect(t).toContain("92/100");
  });
});
