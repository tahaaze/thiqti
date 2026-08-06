import { describe, it, expect } from "vitest";
import { parseQuery } from "@/lib/nlp";

describe("parseQuery - extraction budget", () => {
  it("extrait 'autour de X dh' avec tolerance 0.2", () => {
    const c = parseQuery("autour de 200000 dh");
    expect(c.budgetMin).toBe(160000);
    expect(c.budgetMax).toBe(240000);
    expect(c.budgetTolerance).toBe(0.2);
  });

  it("extrait 'entre X et Y dh'", () => {
    const c = parseQuery("entre 200000 et 300000 dh");
    expect(c.budgetMin).toBe(200000);
    expect(c.budgetMax).toBe(300000);
  });

  it("extrait 'sous X dh' (plafond)", () => {
    const c = parseQuery("sous 250000 dh");
    expect(c.budgetMin).toBeNull();
    expect(c.budgetMax).toBe(250000);
  });

  it("extrait 'plus de X dh' (minimum)", () => {
    const c = parseQuery("plus de 400000 dh");
    expect(c.budgetMin).toBe(400000);
    expect(c.budgetMax).toBeNull();
  });

  it("extrait 'budget X DH' avec tolerance 0.15", () => {
    const c = parseQuery("budget 300000 DH");
    expect(c.budgetMin).toBe(255000);
    expect(c.budgetMax).toBe(345000);
    expect(c.budgetTolerance).toBe(0.15);
  });

  it("extrait le montant bare 'X dh'", () => {
    const c = parseQuery("une voiture 350000 dh");
    expect(c.budgetMin).toBe(297500);
    expect(c.budgetMax).toBe(402500);
  });

  it("extrait le budget darija 'على X درهم'", () => {
    const c = parseQuery("على 250000 درهم");
    expect(c.budgetMin).toBe(212500);
    expect(c.budgetMax).toBe(287500);
    expect(c.budgetTolerance).toBe(0.15);
  });

  it("ignore les montants hors bornes", () => {
    const c = parseQuery("budget 500 dh");
    expect(c.budgetMin).toBeNull();
    expect(c.budgetMax).toBeNull();
  });
});

describe("parseQuery - extraction annee", () => {
  it("extrait 'depuis XXXX'", () => {
    const c = parseQuery("depuis 2022");
    expect(c.anneeMin).toBe(2022);
    expect(c.anneeMax).toBeNull();
  });

  it("extrait 'avant XXXX'", () => {
    const c = parseQuery("avant 2015");
    expect(c.anneeMin).toBeNull();
    expect(c.anneeMax).toBe(2015);
  });

  it("extrait une annee isolee en intervalle +1", () => {
    const c = parseQuery("toyota 2022");
    expect(c.anneeMin).toBe(2022);
    expect(c.anneeMax).toBe(2023);
  });

  it("extrait un intervalle sur deux annees", () => {
    const c = parseQuery("voiture 2020 ou 2023");
    expect(c.anneeMin).toBe(2020);
    expect(c.anneeMax).toBe(2023);
  });

  it("ne confond pas 200000 km avec une annee", () => {
    const c = parseQuery("200000 km");
    expect(c.anneeMin).toBeNull();
    expect(c.anneeMax).toBeNull();
    expect(c.kmMax).toBe(200000);
  });
});

describe("parseQuery - extraction km", () => {
  it("extrait 'moins de X km'", () => {
    const c = parseQuery("moins de 50000 km");
    expect(c.kmMax).toBe(50000);
  });

  it("extrait 'X كيلومتر' (darija)", () => {
    const c = parseQuery("اقل من 30000 كيلومتر");
    expect(c.kmMax).toBe(30000);
  });

  it("ignore les km hors bornes", () => {
    const c = parseQuery("600000 km");
    expect(c.kmMax).toBeNull();
  });
});

describe("parseQuery - extraction marque et ville", () => {
  it("extrait une marque francaise", () => {
    const c = parseQuery("je cherche une Toyota Corolla");
    expect(c.marque).toBe("Toyota");
  });

  it("mappe une marque arabe vers sa forme canonique", () => {
    const c = parseQuery("تويوتا سيفيك");
    expect(c.marque).toBe("Toyota");
  });

  it("mappe هيونداي vers Hyundai", () => {
    const c = parseQuery("هيونداي i10");
    expect(c.marque).toBe("Hyundai");
  });

  it("extrait une ville francaise", () => {
    const c = parseQuery("une voiture à Casablanca");
    expect(c.ville).toBe("Casablanca");
  });

  it("extrait une ville arabe (canonique)", () => {
    const c = parseQuery("سيارة في الدار البيضاء");
    expect(c.ville).toBe("Casablanca");
  });

  it("extrait une ville darija (كازا)", () => {
    const c = parseQuery("بغيت سيارة في كازا");
    expect(c.ville).toBe("Casablanca");
  });
});

describe("parseQuery - extraction carrosserie, carburant, transmission", () => {
  it("extrait SUV", () => {
    const c = parseQuery("un SUV");
    expect(c.carrosserie).toBe("SUV");
  });

  it("extrait ربع (darija) vers SUV", () => {
    const c = parseQuery("ربع");
    expect(c.carrosserie).toBe("SUV");
  });

  it("extrait coupe via la cle sans accent", () => {
    const c = parseQuery("une coupé");
    expect(c.carrosserie).toBe("Coupé");
  });

  it("extrait diesel", () => {
    const c = parseQuery("diesel");
    expect(c.motorisation).toBe("Diesel");
  });

  it("extrait electrique malgre l'accent", () => {
    const c = parseQuery("voiture électrique");
    expect(c.motorisation).toBe("Électrique");
  });

  it("extrait مازوت (darija) vers Diesel", () => {
    const c = parseQuery("مازوت");
    expect(c.motorisation).toBe("Diesel");
  });

  it("extrait une transmission automatique", () => {
    const c = parseQuery("boite automatique");
    expect(c.transmission).toBe("Automatique");
  });

  it("ne confond pas 'autour' avec la transmission auto", () => {
    const c = parseQuery("autour de 200000 dh");
    expect(c.transmission).toBeNull();
  });

  it("extrait 'auto' comme transmission automatique", () => {
    const c = parseQuery("voiture auto");
    expect(c.transmission).toBe("Automatique");
  });

  it("extrait اوتوماتيك (darija)", () => {
    const c = parseQuery("اوتوماتيك");
    expect(c.transmission).toBe("Automatique");
  });
});

describe("parseQuery - intentions", () => {
  it("detecte l'intention economique", () => {
    const c = parseQuery("une voiture économique");
    expect(c.intent).toContain("economique");
  });

  it("detecte l'intention familiale", () => {
    const c = parseQuery("SUV familial pour 4 enfants");
    expect(c.intent).toContain("familial");
  });

  it("detecte l'intention sportive en darija", () => {
    const c = parseQuery("سيارة سريعة");
    expect(c.intent).toContain("sportif");
  });
});

describe("parseQuery - requete combinee", () => {
  it("extrait tous les criteres d'une requete complete", () => {
    const c = parseQuery("toyota diesel budget 300000 casablanca SUV 2022");
    expect(c.marque).toBe("Toyota");
    expect(c.motorisation).toBe("Diesel");
    expect(c.carrosserie).toBe("SUV");
    expect(c.ville).toBe("Casablanca");
    expect(c.budgetMin).toBe(255000);
    expect(c.budgetMax).toBe(345000);
    expect(c.anneeMin).toBe(2022);
    expect(c.anneeMax).toBe(2023);
  });
});

describe("parseQuery - extraction modele", () => {
  it("extrait un modele francais", () => {
    const c = parseQuery("je cherche une Toyota Corolla");
    expect(c.modele).toBe("Corolla");
  });

  it("extrait un modele Dacia", () => {
    const c = parseQuery("Dacia Duster essence 2022");
    expect(c.modele).toBe("Duster");
  });

  it("extrait un modele arabe (داستر)", () => {
    const c = parseQuery("بغيت داسيا داستر");
    expect(c.modele).toBe("Duster");
  });

  it("extrait un modele renvoie la marque correspondante", () => {
    const c = parseQuery("Kia Sportage hybride");
    expect(c.marque).toBe("Kia");
    expect(c.modele).toBe("Sportage");
  });

  it("ne confond pas un modele numerique (2008) avec une annee", () => {
    const c = parseQuery("Peugeot 2008 essence");
    expect(c.modele).toBe("2008");
    expect(c.anneeMin).toBeNull();
    expect(c.anneeMax).toBeNull();
  });

  it("extrait le modele et l'annee quand les deux sont presents", () => {
    const c = parseQuery("Peugeot 2008 2022");
    expect(c.modele).toBe("2008");
    expect(c.anneeMin).toBe(2022);
  });
});

describe("parseQuery - budgets mille / k / darija", () => {
  it("comprend '200 mille DH'", () => {
    const c = parseQuery("200 mille DH");
    expect(c.budgetMin).toBe(170000);
    expect(c.budgetMax).toBe(230000);
  });

  it("comprend '300k dh'", () => {
    const c = parseQuery("300k dh");
    expect(c.budgetMin).toBe(255000);
    expect(c.budgetMax).toBe(345000);
  });

  it("comprend 'ألف' (darija) avec multiplicateur", () => {
    const c = parseQuery("بغيت سيارة 300 ألف درهم");
    expect(c.budgetMin).toBe(255000);
    expect(c.budgetMax).toBe(345000);
  });

  it("comprend '1 مليون درهم'", () => {
    const c = parseQuery("1 مليون درهم");
    expect(c.budgetMin).toBe(850000);
    expect(c.budgetMax).toBe(1150000);
  });
});

describe("parseQuery - darija combine", () => {
  it("comprend une phrase complete en darija", () => {
    const c = parseQuery("بغيت ربع ديزل اقل من 250000 درهم");
    expect(c.carrosserie).toBe("SUV");
    expect(c.motorisation).toBe("Diesel");
    expect(c.budgetMin).toBeNull();
    expect(c.budgetMax).toBe(250000);
  });

  it("comprend une phrase complete avec marque et ville en darija", () => {
    const c = parseQuery("بغيت تويوتا ربع في الدار البيضاء");
    expect(c.marque).toBe("Toyota");
    expect(c.carrosserie).toBe("SUV");
    expect(c.ville).toBe("Casablanca");
  });

  it("comprend une transmission automatique en darija", () => {
    const c = parseQuery("بغيت سيارة ماتيك");
    expect(c.transmission).toBe("Automatique");
  });
});

describe("parseQuery - cas limites", () => {
  it("retourne des criteres vides sur une entree vide", () => {
    const c = parseQuery("");
    expect(c.carrosserie).toBeNull();
    expect(c.motorisation).toBeNull();
    expect(c.transmission).toBeNull();
    expect(c.marque).toBeNull();
    expect(c.ville).toBeNull();
    expect(c.budgetMin).toBeNull();
    expect(c.budgetMax).toBeNull();
    expect(c.anneeMin).toBeNull();
    expect(c.anneeMax).toBeNull();
    expect(c.kmMax).toBeNull();
    expect(c.intent).toEqual([]);
  });

  it("neutralise un script XSS", () => {
    const c = parseQuery("<script>alert(1)</script>");
    expect(c.carrosserie).toBeNull();
    expect(c.motorisation).toBeNull();
    expect(c.marque).toBeNull();
    expect(c.budgetMin).toBeNull();
    expect(c.budgetMax).toBeNull();
    expect(c.intent).toEqual([]);
  });

  it("neutralise les caracteres speciaux sans fusionner les mots", () => {
    const c = parseQuery("voiture +++ electrique ###");
    expect(c.motorisation).toBe("Électrique");
  });
});
