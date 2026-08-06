import { describe, it, expect } from "vitest";
import { answer, createInitialState, initialMessage, buildSearchRequest, recommendationText } from "@/lib/chatbot";

const car = (id: string, title: string, priceFormatted: string, score: number) => ({
  id, title, make: "Dacia", model: "Duster", year: 2024, price: 200000, priceFormatted,
  km: 0, fuel: "Essence", city: "Casablanca", image: "", source: "Données Maroc", score,
});

describe("conversation chatbot", () => {
  it("lance une recherche dès qu'un seul critère est donné", () => {
    const s = createInitialState();
    const r = answer(s, "SUV");
    expect(r.search).toBe(true);
    expect(r.done).toBe(false);
    expect(r.state.criteria.carrosserie).toBe("SUV");
    expect(r.state.stage).toBe("collecting");
  });

  it("accepte un nombre seul comme budget (bug fixe)", () => {
    const s = createInitialState();
    const r = answer(s, "200000");
    expect(r.state.criteria.budgetMax).toBe(230000);
    expect(r.state.criteria.budgetMin).toBe(170000);
    expect(r.search).toBe(true);
  });

  it("accumule les critères dans n'importe quel ordre", () => {
    const s = createInitialState();
    let r = answer(s, "diesel");
    expect(r.state.criteria.motorisation).toBe("Diesel");
    r = answer(r.state, "200000");
    expect(r.state.criteria.budgetMax).toBe(230000);
    r = answer(r.state, "Toyota");
    expect(r.state.criteria.marque).toBe("Toyota");
    expect(r.search).toBe(true);
    expect(r.state.criteria.motorisation).toBe("Diesel");
  });

  it("comprend une phrase complete d'un coup", () => {
    const s = createInitialState();
    const r = answer(s, "Dacia SUV essence 2022 moins de 250000 DH");
    expect(r.search).toBe(true);
    expect(r.state.criteria.carrosserie).toBe("SUV");
    expect(r.state.criteria.motorisation).toBe("Essence");
    expect(r.state.criteria.marque).toBe("Dacia");
    expect(r.state.criteria.anneeMin).toBe(2022);
  });

  it("detecte neuf/occasion", () => {
    const s = createInitialState();
    const r = answer(s, "neuf 250000");
    expect(r.state.inventoryType).toBe("new");
    expect(r.search).toBe(true);
  });

  it("comprend une phrase complete en darija", () => {
    const s = createInitialState();
    const r = answer(s, "بغيت ربع ديزل اقل من 250000 درهم");
    expect(r.state.criteria.carrosserie).toBe("SUV");
    expect(r.state.criteria.motorisation).toBe("Diesel");
    expect(r.state.criteria.budgetMax).toBe(250000);
    expect(r.search).toBe(true);
    expect(/\d/.test(buildSearchRequest(r.state).q)).toBe(false);
  });

  it("affiche plus de resultats avec les memes criteres", () => {
    const s = createInitialState();
    let r = answer(s, "SUV");
    expect(r.search).toBe(true);
    r = answer(r.state, "voir plus");
    expect(r.search).toBe(true);
    expect(r.state.criteria.carrosserie).toBe("SUV");
    expect(r.state.criteria.motorisation).toBeNull();
  });

  it("termine la conversation sur c'est bon", () => {
    const s = createInitialState();
    let r = answer(s, "Toyota SUV diesel");
    expect(r.done).toBe(false);
    r = answer(r.state, "c'est bon");
    expect(r.done).toBe(true);
    expect(r.state.stage).toBe("done");
  });

  it("gere la politesse et les messages incompris", () => {
    const s = createInitialState();
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

  it("envoie le budget en filtre et PAS dans le texte libre (bug trouve vehicules)", () => {
    const s = createInitialState();
    const r = answer(s, "Toyota SUV diesel 250 000 à 400 000 DH");
    const req = buildSearchRequest(r.state);
    expect(req.q).toBe("Toyota SUV Diesel");
    expect(req.filters.minPrice).toBe(250000);
    expect(req.filters.maxPrice).toBe(400000);
    expect(/\d/.test(req.q)).toBe(false);
  });

  it("applique l'annee en filtre minYear", () => {
    const s = createInitialState();
    const r = answer(s, "Toyota SUV diesel moins de 150 000 DH 2022 et plus");
    const req = buildSearchRequest(r.state);
    expect(req.q).toBe("Toyota SUV Diesel");
    expect(req.filters.minYear).toBe(2022);
    expect(req.filters.maxPrice).toBe(150000);
  });

  it("propose des suggestions par defaut des l'ouverture", () => {
    const init = initialMessage();
    expect(init.quickReplies).toContain("SUV");
    expect(init.quickReplies).toContain("Moins de 150 000 DH");
  });
});
