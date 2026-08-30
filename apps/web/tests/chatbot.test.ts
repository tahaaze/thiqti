import { describe, it, expect } from "vitest";
import { answer, createInitialState, initialMessage, buildSearchRequest, recommendationText, detectLanguage } from "@/lib/chatbot";

const car = (id: string, title: string, priceFormatted: string, score: number) => ({
  id, title, make: "Dacia", model: "Duster", year: 2024, price: 200000, priceFormatted,
  km: 0, fuel: "Essence", city: "Casablanca", image: "", source: "Données Maroc", score,
});

describe("conversation chatbot — conseiller conversationnel", () => {
  it("ne lance PAS la recherche dès le premier critère : il pose une question", () => {
    const s = createInitialState();
    const r = answer(s, "SUV");
    expect(r.search).toBe(false);
    expect(r.done).toBe(false);
    expect(r.state.criteria.carrosserie).toBe("SUV");
    expect(r.text).toContain("Compris");
    expect(r.text).toContain("budget");
    expect(r.state.stage).toBe("collecting");
  });

  it("accepte un nombre seul comme budget (bug fixe)", () => {
    const s = createInitialState();
    const r = answer(s, "200000");
    expect(r.state.criteria.budgetMax).toBe(230000);
    expect(r.state.criteria.budgetMin).toBe(170000);
    expect(r.search).toBe(false);
  });

  it("accumule les critères dans n'importe quel ordre", () => {
    const s = createInitialState();
    let r = answer(s, "diesel");
    expect(r.state.criteria.motorisation).toBe("Diesel");
    r = answer(r.state, "200000");
    expect(r.state.criteria.budgetMax).toBe(230000);
    r = answer(r.state, "Toyota");
    expect(r.state.criteria.marque).toBe("Toyota");
    expect(r.search).toBe(false);
    expect(r.state.criteria.motorisation).toBe("Diesel");
  });

  it("comprend une phrase complete d'un coup, sans chercher immédiatement", () => {
    const s = createInitialState();
    const r = answer(s, "Dacia SUV essence 2022 moins de 250000 DH");
    expect(r.search).toBe(false);
    expect(r.state.criteria.carrosserie).toBe("SUV");
    expect(r.state.criteria.motorisation).toBe("Essence");
    expect(r.state.criteria.marque).toBe("Dacia");
    expect(r.state.criteria.anneeMin).toBe(2022);
    expect(r.text).toContain("Compris");
  });

  it("detecte neuf/occasion", () => {
    const s = createInitialState();
    const r = answer(s, "neuf 250000");
    expect(r.state.inventoryType).toBe("new");
    expect(r.search).toBe(false);
  });

  it("comprend une phrase complete en darija", () => {
    const s = createInitialState();
    const r = answer(s, "بغيت ربع ديزل اقل من 250000 درهم");
    expect(r.state.criteria.carrosserie).toBe("SUV");
    expect(r.state.criteria.motorisation).toBe("Diesel");
    expect(r.state.criteria.budgetMax).toBe(250000);
    expect(r.search).toBe(false);
    expect(/\d/.test(buildSearchRequest(r.state).q)).toBe(false);
  });

  it("ne lance la recherche que sur demande explicite des résultats", () => {
    const s = createInitialState();
    let r = answer(s, "SUV");
    expect(r.search).toBe(false);
    r = answer(r.state, "voir les résultats");
    expect(r.search).toBe(true);
    expect(r.state.criteria.carrosserie).toBe("SUV");
  });

  it("affiche plus de resultats avec les memes criteres", () => {
    const s = createInitialState();
    let r = answer(s, "SUV");
    expect(r.search).toBe(false);
    r = answer(r.state, "voir plus");
    expect(r.search).toBe(true);
    expect(r.state.criteria.carrosserie).toBe("SUV");
    expect(r.state.criteria.motorisation).toBeNull();
  });

  it("lance les résultats sur c'est bon quand des critères sont connus", () => {
    const s = createInitialState();
    let r = answer(s, "Toyota SUV diesel");
    expect(r.search).toBe(false);
    r = answer(r.state, "c'est bon");
    expect(r.search).toBe(true);
    expect(r.state.stage).toBe("done");
  });

  it("ne cherche pas sur c'est bon sans critères", () => {
    const s = createInitialState();
    const r = answer(s, "c'est bon");
    expect(r.search).toBe(false);
  });

  it("répond à la question essence ou mazot par un avis en darija, puis pose une question", () => {
    const s = createInitialState();
    const r = answer(s, "chno li hsen mazot ola essence");
    expect(r.search).toBe(false);
    expect(r.text).toContain("مازوط");
    expect(r.text).toContain("كاز");
    expect(r.text).toContain("الميزانية");
    expect(r.state.criteria.motorisation).toBeNull();
    expect(r.state.lang).toBe("darija");
  });

  it("pose une question à la fois, dans un ordre logique", () => {
    const s = createInitialState();
    let r = answer(s, "200000");
    expect(r.search).toBe(false);
    expect(r.text).toContain("usage");
    r = answer(r.state, "familiale");
    expect(r.search).toBe(false);
    expect(r.text.toLowerCase()).toContain("diesel");
    r = answer(r.state, "voir les résultats");
    expect(r.search).toBe(true);
    const req = buildSearchRequest(r.state);
    expect(req.filters.maxPrice).toBeGreaterThanOrEqual(230000);
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

  it("envoie les criteres en filtres structures et PAS dans le texte libre (bug trouve vehicules)", () => {
    const s = createInitialState();
    const r = answer(s, "Toyota SUV diesel 250 000 à 400 000 DH");
    const req = buildSearchRequest(r.state);
    expect(req.q).toBe("");
    expect(req.filters.brand).toBe("Toyota");
    expect(req.filters.bodyType).toBe("SUV");
    expect(req.filters.fuel).toBe("Diesel");
    expect(req.filters.minPrice).toBe(250000);
    expect(req.filters.maxPrice).toBe(400000);
    expect(/\d/.test(req.q)).toBe(false);
  });

  it("refine les criteres a chaque nouvel indice (filtres cumules)", () => {
    let r = answer(createInitialState(), "SUV");
    expect(buildSearchRequest(r.state).filters.bodyType).toBe("SUV");
    r = answer(r.state, "diesel");
    expect(buildSearchRequest(r.state).filters.bodyType).toBe("SUV");
    expect(buildSearchRequest(r.state).filters.fuel).toBe("Diesel");
    r = answer(r.state, "Toyota");
    const req = buildSearchRequest(r.state);
    expect(req.filters.bodyType).toBe("SUV");
    expect(req.filters.fuel).toBe("Diesel");
    expect(req.filters.brand).toBe("Toyota");
  });

  it("applique l'annee en filtre minYear", () => {
    const s = createInitialState();
    const r = answer(s, "Toyota SUV diesel moins de 150 000 DH 2022 et plus");
    const req = buildSearchRequest(r.state);
    expect(req.q).toBe("");
    expect(req.filters.brand).toBe("Toyota");
    expect(req.filters.bodyType).toBe("SUV");
    expect(req.filters.fuel).toBe("Diesel");
    expect(req.filters.minYear).toBe(2022);
    expect(req.filters.maxPrice).toBe(150000);
  });

  it("cherche un modele en texte libre", () => {
    const s = createInitialState();
    const r = answer(s, "Duster 2022");
    const req = buildSearchRequest(r.state);
    expect(req.q).toBe("Duster");
    expect(req.filters.minYear).toBe(2022);
  });

  it("propose des suggestions par defaut des l'ouverture", () => {
    const init = initialMessage();
    expect(init.quickReplies).toContain("SUV");
    expect(init.quickReplies).toContain("Moins de 150 000 DH");
  });

  it("comprend l'intention d'achat en darija sans critères", () => {
    const s = createInitialState();
    const r = answer(s, "bghit nchri tomobil");
    expect(r.search).toBe(false);
    expect(r.text).toContain("الميزانية");
    expect(r.text).toContain("نوع");
    expect(r.quickReplies.length).toBeGreaterThan(0);
    expect(r.state.lang).toBe("darija");
  });

  it("comprend l'intention d'achat en français", () => {
    const s = createInitialState();
    const r = answer(s, "je veux acheter une voiture");
    expect(r.search).toBe(false);
    expect(r.text).toContain("budget");
  });

  it("détecte l'intent familial dans l'achat", () => {
    const s = createInitialState();
    const r = answer(s, "je veux acheter une voiture familiale");
    expect(r.search).toBe(false);
    expect(r.text).toContain("budget");
    expect(r.text).toContain("type");
  });

  it("fonctionne avec acheteur + critère structuré, sans chercher immédiatement", () => {
    const s = createInitialState();
    const r = answer(s, "je veux acheter une voiture SUV diesel Toyota");
    expect(r.search).toBe(false);
    expect(r.state.criteria.carrosserie).toBe("SUV");
    expect(r.state.criteria.motorisation).toBe("Diesel");
    expect(r.state.criteria.marque).toBe("Toyota");
    expect(r.text).toContain("Compris");
  });

  describe("langue (darija / français)", () => {
    it("détecte la darija (arabizi et arabe)", () => {
      expect(detectLanguage("chno li hsen mazot ola essence")).toBe("darija");
      expect(detectLanguage("بغيت ربع ديزل")).toBe("darija");
      expect(detectLanguage("بغيت نتوما")).toBe("darija");
    });

    it("détecte la darija avec marqueurs étendus (sans coller au français)", () => {
      expect(detectLanguage("wakh bghit nchri tomobil fkaza")).toBe("darija");
      expect(detectLanguage("khasni SUV rkhiss")).toBe("darija");
      expect(detectLanguage("واخا بغيت نتوما")).toBe("darija");
      expect(detectLanguage("chouf lih hadik caroussa")).toBe("darija");
    });

    it("détecte le français et garde la langue précédente si ambigu", () => {
      expect(detectLanguage("je veux acheter une voiture")).toBe("fr");
      expect(detectLanguage("200000", "darija")).toBe("darija");
      expect(detectLanguage("SUV", "darija")).toBe("darija");
      expect(detectLanguage("oui", "darija")).toBe("darija");
      expect(detectLanguage("c'est bon", "fr")).toBe("fr");
    });

    it("répond en darija dès que l'utilisateur parle darija, et accuse réception en darija", () => {
      const s = createInitialState();
      const r = answer(s, "بغيت ربع ديزل اقل من 250000 درهم");
      expect(r.state.lang).toBe("darija");
      expect(r.text).toContain("فهمت");
      expect(r.text).toContain("ربع");
      expect(r.text).toContain("مازوط");
    });

    it("reste en darija sur la demande de résultats", () => {
      const s = createInitialState();
      let r = answer(s, "بغيت ربع ديزل");
      expect(r.state.lang).toBe("darija");
      r = answer(r.state, "voir les résultats");
      expect(r.search).toBe(true);
      expect(r.text).toContain("واخا، هاهي النتائج");
    });

    it("reprend le français si l'utilisateur écrit en français", () => {
      const s = createInitialState();
      let r = answer(s, "بغيت ربع ديزل");
      expect(r.state.lang).toBe("darija");
      r = answer(r.state, "je veux une voiture sportive");
      expect(r.state.lang).toBe("fr");
      expect(r.text).toContain("Compris");
    });
  });

  describe("propose « voir les résultats » à chaque réponse", () => {
    it("ajoute la proposition et la suggestion de résultats quand un critère est connu", () => {
      const s = createInitialState();
      const r = answer(s, "SUV 200000");
      expect(r.text).toContain("Voir les résultats");
      expect(r.quickReplies).toContain("Voir les résultats");
      expect(r.search).toBe(false);
    });

    it("n'ajoute pas la suggestion de résultats quand aucun critère n'est connu", () => {
      const s = createInitialState();
      const r = answer(s, "bonjour");
      expect(r.quickReplies).not.toContain("Voir les résultats");
    });

    it("propose en darija à chaque réponse", () => {
      const s = createInitialState();
      const r = answer(s, "بغيت ربع ديزل");
      expect(r.text).toContain("Voir les résultats");
      expect(r.quickReplies).toContain("Voir les résultats");
    });
  });

  it("genere une recommandation en darija si la conversation est en darija", () => {
    const s = createInitialState();
    const r = answer(s, "بغيت ربع ديزل اقل من 250000 درهم");
    const t = recommendationText([car("a", "Duster", "200 000 DH", 92)], r.state);
    expect(t).toContain("Duster");
    expect(t).toContain("92/100");
    expect(t).toContain("هاهي أحسن اقتراحاتي");
  });

  describe("compréhension élargie (darija / commandes comme Jeep)", () => {
    it("comprend « riyadia » / « رياضية » comme une voiture sportive", () => {
      const r = answer(createInitialState(), "riyadia");
      expect(r.search).toBe(false);
      expect(r.state.criteria.intent).toContain("sportif");
      expect(r.text).toContain("Compris");
    });

    it("ne repose pas la question du type de carrosserie quand un usage est donné", () => {
      const s = createInitialState();
      s.criteria.budgetMax = 400000; // budget déjà renseigné
      const r = answer(s, "بغيت طوموبيل رياضية");
      expect(r.state.criteria.intent).toContain("sportif");
      expect(r.text).not.toContain("أشنو تفضل : ربع");
      expect(r.text).not.toMatch(/SUV, une berline, une citadine/);
    });

    it("comprend « bghit tiomobil mazot » comme un achat de voiture diesel", () => {
      const r = answer(createInitialState(), "bghit tiomobil mazot");
      expect(r.search).toBe(false);
      expect(r.state.lang).toBe("darija");
      expect(r.state.criteria.motorisation).toBe("Diesel");
      expect(r.state.criteria.intent).toContain("achat");
    });

    it("change de langue sur « dwi meaya b arabe » et répond en darija", () => {
      const s = createInitialState();
      const r = answer(s, "dwi meaya b arabe");
      expect(r.state.lang).toBe("darija");
      expect(r.text).toContain("داريجة");
      expect(r.search).toBe(false);
    });

    it("change de langue sur « dwi meaya b francais »", () => {
      const s = createInitialState();
      const r = answer(s, "dwi meaya b francais");
      expect(r.state.lang).toBe("fr");
      expect(r.text).toContain("français");
    });

    it("ne considère pas « machi mochkil » comme du texte libre", () => {
      let r = answer(createInitialState(), "بغيت ربع");
      expect(r.state.lang).toBe("darija");
      r = answer(r.state, "machi mochkil");
      expect(r.search).toBe(false);
      expect(r.text).toContain("لا مشكل");
    });

    it("déclenche les résultats sur « passe a result » avec des critères", () => {
      let r = answer(createInitialState(), "SUV 200000");
      expect(r.search).toBe(false);
      r = answer(r.state, "passe a result");
      expect(r.search).toBe(true);
    });
  });

  describe("résumé + bouton quand assez d'infos (budget + carburant ou type)", () => {
    it("exemple de l'utilisateur : budget + mazot + sport → résumé et « Voir les résultats » en avant", () => {
      const r = answer(createInitialState(), "salam bghit tomobil b 200000dh mazot sport");
      expect(r.search).toBe(false);
      expect(r.state.criteria.motorisation).toBe("Diesel");
      expect(r.state.criteria.intent).toContain("sportif");
      expect(r.quickReplies[0]).toBe("Voir les résultats");
      expect(r.text).toContain("Voir les résultats");
      // On ne pose plus « neuf ou occasion » en tant que blocage.
      expect(r.text).not.toContain("بغيتي جديدة ولا مستعملة");
    });

    it("propose le bouton quand budget + type sont connus", () => {
      const r = answer(createInitialState(), "SUV 200000");
      expect(r.search).toBe(false);
      expect(r.quickReplies[0]).toBe("Voir les résultats");
      expect(r.quickReplies).toContain("Voir les résultats");
    });

    it("reste en darija et met le bouton en avant", () => {
      const r = answer(createInitialState(), "بغيت ربع ديزل 200000 درهم");
      expect(r.state.lang).toBe("darija");
      expect(r.quickReplies[0]).toBe("Voir les résultats");
      expect(r.text).toContain("الخلاصة");
    });

    it("pose encore la question du carburant quand seul budget + usage sont donnés", () => {
      let r = answer(createInitialState(), "200000");
      r = answer(r.state, "familiale");
      // Pas assez d'infos (pas de carburant/type) : on repose la question du carburant.
      expect(r.text.toLowerCase()).toContain("diesel");
      expect(r.text).not.toContain("Récapitulatif");
      expect(r.text).not.toContain("الخلاصة");
    });

    it("n'active pas le résumé sans budget (pose encore la question du budget)", () => {
      const r = answer(createInitialState(), "بغيت ربع ديزل");
      expect(r.text).toContain("الميزانية");
      expect(r.text).not.toContain("الخلاصة");
      expect(r.text).not.toContain("Récapitulatif");
    });
  });
});

describe("phrases naturelles « je cherche ... » (régression)", () => {
  it("extrait SUV + budget + ville dans « Je cherche un SUV autour de 200000 DH à Rabat »", () => {
    const r = answer(createInitialState(), "Je cherche un SUV autour de 200000 DH à Rabat");
    expect(r.state.criteria.carrosserie).toBe("SUV");
    expect(r.state.criteria.ville).toBe("Rabat");
    expect(r.state.criteria.budgetMin).toBe(160000);
    expect(r.state.criteria.budgetMax).toBe(240000);
    expect(r.search).toBe(false);
  });

  it("extrait le budget dans « Je cherche une voiture familiale 200000 DH »", () => {
    const r = answer(createInitialState(), "Je cherche une voiture familiale 200000 DH");
    expect(r.state.criteria.budgetMax).toBe(230000);
    expect(r.state.criteria.budgetMin).toBe(170000);
  });

  it("garde « Voir les résultats » comme lancement de recherche quand il n'y a pas de critère", () => {
    const s = createInitialState();
    let r = answer(s, "SUV");
    r = answer(r.state, "200000");
    const res = answer(r.state, "Voir les résultats");
    expect(res.search).toBe(true);
    expect(res.state.criteria.budgetMax).toBe(230000);
  });
});
