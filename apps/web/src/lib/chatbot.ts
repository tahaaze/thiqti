// ============================================================================
// CHATBOT THIQTI — GUIDE D'ACHAT CONVERSATIONNEL
// ============================================================================
//
// L'assistant comprend les messages libres (francais/darija) sans imposer un
// parcours rigide : des qu'un critere est compris (budget, carrosserie,
// carburant, marque, ville...), il propose immediatement des voitures et
// relance avec une question ouverte. L'utilisateur affine dans l'ordre qu'il
// veut, dit « Voir plus » pour davantage de resultats, ou « C'est bon » pour
// valider. Chaque reponse est pure et rejouable.
// ============================================================================

import { parseQuery, SearchCriteria } from "./nlp";
import { InventoryType } from "./sources/types";

export type InventoryChoice = InventoryType | null;

export type ChatStage = "collecting" | "done";

export interface ChatState {
  criteria: SearchCriteria;
  inventoryType: InventoryChoice;
  stage: ChatStage;
}

export interface BotReply {
  text: string;
  quickReplies: string[];
  done: boolean;
  /** Vrai quand le composant doit lancer une recherche et afficher les suggestions. */
  search: boolean;
  state: ChatState;
}

export interface RecommendableCar {
  id: string;
  title: string;
  make: string;
  model: string;
  year: number;
  price: number;
  priceFormatted: string;
  km: number;
  fuel: string;
  city: string;
  image: string;
  source: string;
  score: number;
  inventoryType?: "new" | "used";
}

const EMPTY_CRITERIA: SearchCriteria = {
  carrosserie: null,
  motorisation: null,
  transmission: null,
  marque: null,
  modele: null,
  budgetMin: null,
  budgetMax: null,
  budgetTolerance: 0.15,
  ville: null,
  anneeMin: null,
  anneeMax: null,
  kmMax: null,
  intent: [],
};

export interface BudgetBracket {
  label: string;
  min: number;
  max: number;
}

export const BUDGET_BRACKETS: BudgetBracket[] = [
  { label: "Moins de 150 000 DH", min: 0, max: 150000 },
  { label: "150 000 à 250 000 DH", min: 150000, max: 250000 },
  { label: "250 000 à 400 000 DH", min: 250000, max: 400000 },
  { label: "Plus de 400 000 DH", min: 400000, max: 900000 },
];

export const BODY_OPTIONS = ["SUV", "Berline", "Citadine", "Compacte", "Crossover"];
export const FUEL_OPTIONS = ["Essence", "Diesel", "Hybride", "Électrique"];
export const INVENTORY_OPTIONS = ["Neuf", "Occasion"];
export const TRANSMISSION_OPTIONS = ["Automatique", "Manuelle"];
export const BRAND_OPTIONS = ["Dacia", "Renault", "Peugeot", "Toyota"];
export const CITY_OPTIONS = ["Casablanca", "Rabat", "Marrakech", "Tanger"];
export const YEAR_OPTIONS = ["2022 et plus", "2024 et plus"];

export function createInitialState(): ChatState {
  return { criteria: { ...EMPTY_CRITERIA }, inventoryType: null, stage: "collecting" };
}

// ---------------------------------------------------------------------------
// Petites conversations
// ---------------------------------------------------------------------------

const GREETING_RE = /\b(?:salut|bonjour|bonsoir|bonj|hello|hi|hey|salam|salamo|salam 3alikom|assalam|lhala|lachak|la chak)\b|(?:صباح|مساء|السلام|السلام عليكم|سلام)/i;
const THANKS_RE = /\b(?:merci|choukran|chokran|chokra|choukra|shukran|thanks|thank you|thx)\b|(?:شكرا|الله يخليك|بارك الله)/i;
const HELP_RE = /\b(?:aide|help|comment|aidez|besoin|exemple)\b|(?:شنو|فهمني|كيفاش|عاونني)/i;
const SKIP_RE = /\b(?:passer|passe|skip|sauter|peu importe|nimporte|n'importe|aucune|aucun|je ne sais pas|jsp)\b|(?:لا فرق|غير مهم|اي شيء)/i;
const YES_RE = /\b(?:oui|ouais|yes|yep|ok|dac|daccord|d'accord|bien sur|aaah)\b|(?:نعم|ايه|اوك|واه|يه)/i;
const SEE_MORE_RE =
  /\b(?:voir|afficher)\s+(?:plus|tous|toutes|plus de)\s*(?:options|annonces|r.sultats)?|voir les r.sultats|plus de r.sultats|tous les r.sultats|d'autres (?:options|annonces|r.sultats)|show more|other results/i;
const REFINE_RE = /\b(?:affiner|affinez|pr.ciser|pr.cisez|revoir|modifier|change)\b|(?:بغيت نزيد|نعدل)/i;
const DONE_RE = /\b(?:c'?est bon|ca me va|ca va comme|ca va|parfait|suffit|fini|termin[ée]|stop|arrete|j'ai? trouv[ée]|trouv[ée] mon|ca y est|okay)\b|(?:خلاص|كفى|بلاها)/i;

function matches(re: RegExp, text: string): boolean {
  return re.test(text.trim().toLowerCase());
}

// ---------------------------------------------------------------------------
// Detection neuf / occasion
// ---------------------------------------------------------------------------

export function detectInventory(input: string): InventoryChoice {
  const n = input.toLowerCase();
  if (/\bneuf\b|neuve|nouveau|\bnew\b|0 km|0km|zero km|km 0|جديد|جديدة/.test(n)) return "new";
  if (/\boccasion\b|occasions|d'occasion|usag|used|seconde main|مستعمل|مستعملة/.test(n)) return "used";
  return null;
}

// ---------------------------------------------------------------------------
// Aides de formatage
// ---------------------------------------------------------------------------

function formatBudget(criteria: SearchCriteria): string {
  const { budgetMin, budgetMax } = criteria;
  if (budgetMin !== null && budgetMax !== null) {
    if (budgetMin === 0) return `moins de ${budgetMax.toLocaleString("fr-FR")} DH`;
    if (budgetMin === budgetMax) return budgetMin.toLocaleString("fr-FR");
    return `${budgetMin.toLocaleString("fr-FR")} à ${budgetMax.toLocaleString("fr-FR")} DH`;
  }
  if (budgetMax !== null) return `moins de ${budgetMax.toLocaleString("fr-FR")} DH`;
  if (budgetMin !== null) return `plus de ${budgetMin.toLocaleString("fr-FR")} DH`;
  return "";
}

function applyBracketLabel(input: string): Partial<SearchCriteria> | null {
  const lower = input.toLowerCase();
  for (const bracket of BUDGET_BRACKETS) {
    if (lower.includes(bracket.label.toLowerCase())) {
      return { budgetMin: bracket.min, budgetMax: bracket.max, budgetTolerance: 0.15 };
    }
  }
  return null;
}

function budgetStatus(criteria: SearchCriteria): boolean {
  return criteria.budgetMin !== null || criteria.budgetMax !== null;
}

// ---------------------------------------------------------------------------
// Accuse de reception de ce qui vient d'etre compris
// ---------------------------------------------------------------------------

function acknowledgment(newState: ChatState, prev: ChatState): string {
  const parts: string[] = [];
  const c = newState.criteria;
  const p = prev.criteria;

  if (newState.inventoryType && newState.inventoryType !== prev.inventoryType) {
    parts.push(newState.inventoryType === "new" ? "un véhicule neuf" : "un véhicule d'occasion");
  }
  if (c.carrosserie && c.carrosserie !== p.carrosserie) parts.push(`un ${c.carrosserie}`);
  if (c.motorisation && c.motorisation !== p.motorisation) parts.push(c.motorisation.toLowerCase());
  if (c.marque && c.marque !== p.marque) parts.push(c.marque);
  if (c.modele && c.modele !== p.modele) parts.push(`un modèle ${c.modele}`);
  if (c.ville && c.ville !== p.ville) parts.push(`à ${c.ville}`);
  if (c.transmission && c.transmission !== p.transmission) parts.push(c.transmission.toLowerCase());
  if (c.anneeMin && c.anneeMin !== p.anneeMin) parts.push(`à partir de ${c.anneeMin}`);
  const newBudget =
    (c.budgetMin !== null || c.budgetMax !== null) &&
    !(p.budgetMin !== null || p.budgetMax !== null);
  if (newBudget) parts.push(`un budget de ${formatBudget(c)}`);

  if (parts.length === 0) return "";
  const sentence = parts.length === 1 ? parts[0] : parts.slice(0, -1).join(", ") + " et " + parts[parts.length - 1];
  return `Compris : ${sentence}. `;
}

// ---------------------------------------------------------------------------
// Aides d'aperçu des critères
// ---------------------------------------------------------------------------

function hasCriteria(state: ChatState): boolean {
  const c = state.criteria;
  return (
    budgetStatus(c) ||
    !!c.carrosserie ||
    !!c.motorisation ||
    !!c.transmission ||
    !!c.marque ||
    !!c.modele ||
    !!c.ville ||
    c.anneeMin !== null ||
    c.anneeMax !== null ||
    !!c.kmMax ||
    state.inventoryType !== null
  );
}

/** Résumé compact des critères connus, en une ligne (ex: "SUV, diesel, Toyota"). */
export function criteriaLine(state: ChatState): string {
  const parts: string[] = [];
  const c = state.criteria;
  if (budgetStatus(c)) parts.push(`un budget de ${formatBudget(c)}`);
  if (state.inventoryType) parts.push(state.inventoryType === "new" ? "du neuf" : "de l'occasion");
  if (c.carrosserie) parts.push(c.carrosserie);
  if (c.motorisation) parts.push(c.motorisation.toLowerCase());
  if (c.marque) parts.push(c.marque);
  if (c.modele) parts.push(c.modele);
  if (c.transmission) parts.push(c.transmission.toLowerCase());
  if (c.ville) parts.push(`à ${c.ville}`);
  if (c.anneeMin) parts.push(`${c.anneeMin} et plus`);
  if (c.kmMax) parts.push(`${c.kmMax.toLocaleString("fr-FR")} km max`);
  return parts.length ? parts.join(", ") : "aucun critère précis";
}

/** Liste de puces pour l'interface (ex: ["Budget : 150 000 à 250 000 DH", "Type : SUV"]). */
export function criteriaSummary(state: ChatState): string[] {
  const c = state.criteria;
  const out: string[] = [];
  if (budgetStatus(c)) out.push(`Budget : ${formatBudget(c)}`);
  if (state.inventoryType) out.push(state.inventoryType === "new" ? "Neuf" : "Occasion");
  if (c.carrosserie) out.push(`Type : ${c.carrosserie}`);
  if (c.motorisation) out.push(`Carburant : ${c.motorisation}`);
  if (c.marque) out.push(`Marque : ${c.marque}`);
  if (c.modele) out.push(`Modèle : ${c.modele}`);
  if (c.transmission) out.push(`Boîte : ${c.transmission}`);
  if (c.ville) out.push(`Ville : ${c.ville}`);
  if (c.anneeMin) out.push(`Année : ${c.anneeMin} et plus`);
  if (c.kmMax) out.push(`Km max : ${c.kmMax.toLocaleString("fr-FR")} km`);
  return out;
}

export function summaryText(state: ChatState): string {
  const { criteria, inventoryType } = state;
  const lines: string[] = [];
  if (budgetStatus(criteria)) lines.push(`• Budget : ${formatBudget(criteria)}`);
  if (inventoryType) lines.push(`• Statut : ${inventoryType === "new" ? "Neuf" : "Occasion"}`);
  if (criteria.carrosserie) lines.push(`• Carrosserie : ${criteria.carrosserie}`);
  if (criteria.motorisation) lines.push(`• Carburant : ${criteria.motorisation}`);
  if (criteria.marque) lines.push(`• Marque : ${criteria.marque}`);
  if (criteria.modele) lines.push(`• Modèle : ${criteria.modele}`);
  if (criteria.anneeMin) lines.push(`• Année : à partir de ${criteria.anneeMin}`);
  if (criteria.transmission) lines.push(`• Transmission : ${criteria.transmission}`);
  if (criteria.ville) lines.push(`• Ville : ${criteria.ville}`);
  if (criteria.kmMax) lines.push(`• Km max : ${criteria.kmMax.toLocaleString("fr-FR")} km`);
  return lines.length ? lines.join("\n") : "En attente de vos critères...";
}

// ---------------------------------------------------------------------------
// Message de bienvenue
// ---------------------------------------------------------------------------

export function initialMessage(): BotReply {
  return {
    text:
      "Salut 👋 Je suis Thiqti, votre conseiller auto pour le Maroc.\n\n" +
      "Décrivez votre envie en quelques mots, dans l'ordre que vous voulez : budget, type, carburant, boîte, marque, ville, année...\n" +
      "Dès que j'ai quelques critères, je vous propose tout de suite des voitures à comparer.\n\n" +
      "Exemples : « SUV diesel 250 000 DH » ou « بغيت ربع ديزل اقل من 250000 درهم »\n\n" +
      "Alors, qu'est-ce qui vous ferait plaisir ?",
    quickReplies: ["SUV", "Moins de 150 000 DH", "Toyota", "Diesel"],
    done: false,
    search: false,
    state: createInitialState(),
  };
}

// ---------------------------------------------------------------------------
// Traitement principal d'un message utilisateur
// ---------------------------------------------------------------------------

export function answer(prev: ChatState, input: string): BotReply {
  const raw = input.trim();
  const criteriaKnown = hasCriteria(prev);

  // Politesse / meta
  if (matches(HELP_RE, raw)) {
    return {
      text:
        "Pas de panique 😊 Dites-moi ce que vous cherchez, dans n'importe quel ordre : budget, type de voiture, carburant, boîte, marque, ville, année...\n" +
        "Exemples : « SUV diesel 200 000 DH », « Toyota », « automatique à Casablanca », ou « بغيت ربع ديزل ».\n" +
        "Dès que j'ai quelques critères, je vous propose des voitures — vous pourrez dire « Voir plus » ou « C'est bon ».",
      quickReplies: ["SUV", "Moins de 150 000 DH", "Toyota", "C'est bon"],
      done: false,
      search: false,
      state: prev,
    };
  }

  if (matches(THANKS_RE, raw)) {
    return {
      text: "Avec plaisir ! 😊 Si vous voulez, on continue : donnez-moi un critère de plus ou dites « C'est bon » pour valider.",
      quickReplies: ["Voir plus", "C'est bon", "Recommencer"],
      done: false,
      search: criteriaKnown,
      state: prev,
    };
  }

  if (matches(SEE_MORE_RE, raw)) {
    return {
      text: criteriaKnown
        ? "Bien sûr, voici d'autres options qui correspondent à vos critères 🚗"
        : "Bien sûr ! D'abord, dites-moi ce que vous cherchez : budget, type, carburant...",
      quickReplies: ["C'est bon", "Recommencer"],
      done: false,
      search: criteriaKnown,
      state: prev,
    };
  }

  if (matches(REFINE_RE, raw)) {
    return {
      text:
        "Bien sûr ! Qu'est-ce que vous voulez préciser ? Par exemple : carburant (« Diesel »), budget (« 250 000 DH »), marque (« Toyota »), boîte (« automatique »), ville (« à Casablanca ») ou année (« 2022 et plus »).",
      quickReplies: ["Voir plus", "C'est bon"],
      done: false,
      search: false,
      state: prev,
    };
  }

  if (matches(DONE_RE, raw) || (/^non$/.test(raw.toLowerCase()) && criteriaKnown)) {
    return {
      text: criteriaKnown
        ? `Parfait, on s'arrête là ! 🎉 Voici votre profil final :\n${summaryText(prev)}\n\nConsultez les cartes ci-dessus ou « Voir tous les résultats » pour explorer tout le catalogue.`
        : "D'accord ! N'hésitez pas à revenir quand vous voulez : dites-moi simplement votre budget, votre type de voiture, ou « Recommencer ». 😉",
      quickReplies: ["Recommencer"],
      done: true,
      search: false,
      state: { ...prev, stage: "done" },
    };
  }

  if (matches(SKIP_RE, raw) && criteriaKnown) {
    return {
      text: "Pas de souci, on garde ce qu'on a ! 😉 Donnez-moi un critère de plus ou dites « C'est bon » pour valider.",
      quickReplies: ["Voir plus", "C'est bon", "Recommencer"],
      done: false,
      search: false,
      state: prev,
    };
  }

  const bracket = applyBracketLabel(raw);
  const parsed = parseQuery(raw);

  const criteria: SearchCriteria = {
    carrosserie: parsed.carrosserie ?? prev.criteria.carrosserie,
    motorisation: parsed.motorisation ?? prev.criteria.motorisation,
    transmission: parsed.transmission ?? prev.criteria.transmission,
    marque: parsed.marque ?? prev.criteria.marque,
    modele: parsed.modele ?? prev.criteria.modele,
    budgetMin: bracket?.budgetMin ?? parsed.budgetMin ?? prev.criteria.budgetMin,
    budgetMax: bracket?.budgetMax ?? parsed.budgetMax ?? prev.criteria.budgetMax,
    budgetTolerance: bracket?.budgetTolerance ?? parsed.budgetTolerance ?? prev.criteria.budgetTolerance,
    ville: parsed.ville ?? prev.criteria.ville,
    anneeMin: parsed.anneeMin ?? prev.criteria.anneeMin,
    anneeMax: parsed.anneeMax ?? prev.criteria.anneeMax,
    kmMax: parsed.kmMax ?? prev.criteria.kmMax,
    intent: [...new Set([...prev.criteria.intent, ...parsed.intent])],
  };

  const inventoryType = detectInventory(raw) ?? prev.inventoryType;
  const state: ChatState = { criteria, inventoryType, stage: "collecting" };

  // Rien de nouveau compris ?
  const somethingNew =
    parsed.carrosserie !== null ||
    parsed.motorisation !== null ||
    parsed.transmission !== null ||
    parsed.marque !== null ||
    parsed.modele !== null ||
    parsed.ville !== null ||
    parsed.budgetMin !== null ||
    parsed.budgetMax !== null ||
    parsed.anneeMin !== null ||
    parsed.anneeMax !== null ||
    parsed.kmMax !== null ||
    inventoryType !== prev.inventoryType;

  if (!somethingNew) {
    if (matches(GREETING_RE, raw)) {
      return {
        text:
          "Bonjour et bienvenue sur Thiqti 👋 Je suis votre conseiller auto.\n" +
          "Dites-moi ce que vous cherchez : budget, type, carburant, marque, ville, année — dans l'ordre que vous voulez !",
        quickReplies: ["SUV", "Moins de 150 000 DH", "Toyota", "Diesel"],
        done: false,
        search: false,
        state: prev,
      };
    }
    if (matches(YES_RE, raw)) {
      return {
        text: "Excellent ! 😄 Dites-moi ce qui compte pour vous (budget, type, carburant, marque...) et je vous trouve des propositions.",
        quickReplies: ["SUV", "Moins de 150 000 DH", "Toyota", "Diesel"],
        done: false,
        search: false,
        state: prev,
      };
    }
    return {
      text:
        "Je n'ai pas bien compris 🤔 Pouvez-vous reformuler ?\n" +
        "Exemples : « 150 000 DH », « SUV diesel », « Toyota », « occasion à Casablanca », ou dites « C'est bon » pour valider vos critères actuels.",
      quickReplies: ["Voir plus", "C'est bon"],
      done: false,
      search: false,
      state: prev,
    };
  }

  const ack = acknowledgment(state, prev);
  return {
    text: `${ack}Voici quelques options qui correspondent déjà à : ${criteriaLine(state)}\n\nVous pouvez affiner (carburant, budget, marque, boîte, ville, année...) ou me dire « Voir plus » pour d'autres résultats.`,
    quickReplies: ["Voir plus", "C'est bon", "Recommencer"],
    done: false,
    search: true,
    state,
  };
}

export interface SearchRequestFilters {
  minPrice?: number;
  maxPrice?: number;
  minYear?: number;
  maxKm?: number;
}

export interface SearchRequest {
  q: string;
  type?: InventoryType;
  filters: SearchRequestFilters;
}

/** Construit la requete de recherche a partir de l'etat de la conversation.
 *
 * Le budget, l'annee et le kilometrage sont envoyes en filtres structurels
 * (minPrice/maxPrice/minYear/maxKm) et NON dans le texte libre : des nombres
 * dans `q` cassent la recherche par mots-cles (`searchAllSources` force chaque
 * mot a matcher chaque annonce).
 */
export function buildSearchRequest(state: ChatState): SearchRequest {
  const { criteria, inventoryType } = state;
  const parts: string[] = [];

  if (criteria.marque) parts.push(criteria.marque);
  if (criteria.modele) parts.push(criteria.modele);
  if (criteria.carrosserie) parts.push(criteria.carrosserie);
  if (criteria.motorisation) parts.push(criteria.motorisation);
  if (criteria.transmission) parts.push(criteria.transmission);
  if (criteria.ville) parts.push(criteria.ville);

  const filters: SearchRequestFilters = {};
  if (criteria.budgetMin !== null && criteria.budgetMin > 0) filters.minPrice = criteria.budgetMin;
  if (criteria.budgetMax !== null) filters.maxPrice = criteria.budgetMax;
  if (criteria.anneeMin !== null) filters.minYear = criteria.anneeMin;
  if (criteria.kmMax !== null) filters.maxKm = criteria.kmMax;

  return {
    q: parts.join(" ").trim(),
    type: inventoryType ?? undefined,
    filters,
  };
}

// ---------------------------------------------------------------------------
// Message de recommandation genere a partir des resultats de la recherche
// ---------------------------------------------------------------------------

export function recommendationText(results: RecommendableCar[], state: ChatState): string {
  if (results.length === 0) {
    return (
      "Désolé, aucune voiture ne correspond exactement à ces critères 😕\n" +
      "Essayez d'élargir un peu le budget, de retirer un critère ou de changer de marque — je trouverai sûrement votre perle !"
    );
  }

  const medals = ["🏆", "🥈", "🥉"];
  const lines = results.slice(0, 3).map((car, i) => {
    const label = car.inventoryType ? ` (${car.inventoryType === "new" ? "neuf" : "occasion"})` : "";
    return `${medals[i] || "•"} ${car.title}${label} — ${car.priceFormatted} · score ${car.score}/100`;
  });

  const extra =
    results.length > 3 ? `\n\nEt ${results.length - 3} autres excellentes options dans les cartes ci-dessous.` : "";

  return (
    `Voici mes meilleures recommandations pour ${summaryText(state).replace(/\n/g, " · ")} :\n\n` +
    lines.join("\n") +
    extra +
    "\n\nCliquez sur une carte pour les détails, ou « Voir tous les résultats » pour comparer."
  );
}
