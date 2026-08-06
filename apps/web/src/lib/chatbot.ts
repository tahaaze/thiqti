// ============================================================================
// CHATBOT THIQTI — GUIDE D'ACHAT CONVERSATIONNEL
// ============================================================================
//
// L'assistant guide l'utilisateur pas a pas (budget, carrosserie, carburant,
// marque, annee) tout en comprenant les messages libres completes. Il accuse
// reception, pose une question a la fois (avec option "Passer"), gere la
// politesse en francais/darija, et propose les meilleures options a la fin.
// Chaque reponse est pure et rejouable.
// ============================================================================

import { parseQuery, SearchCriteria } from "./nlp";
import { InventoryType } from "./sources/types";

export type InventoryChoice = InventoryType | null;

export type ChatStage = "budget" | "carrosserie" | "carburant" | "marque" | "annee" | "done";

export interface ChatState {
  criteria: SearchCriteria;
  inventoryType: InventoryChoice;
  stage: ChatStage;
  skipped: ChatStage[];
}

export interface BotReply {
  text: string;
  quickReplies: string[];
  done: boolean;
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
export const BRAND_OPTIONS = ["Dacia", "Renault", "Peugeot", "Toyota", "Hyundai", "Kia"];
export const YEAR_OPTIONS = ["2022 et plus", "2024 et plus"];

export const CHAT_STEPS: { stage: ChatStage; label: string }[] = [
  { stage: "budget", label: "Budget" },
  { stage: "carrosserie", label: "Type" },
  { stage: "carburant", label: "Carburant" },
  { stage: "marque", label: "Marque" },
  { stage: "annee", label: "Année" },
];

export function createInitialState(): ChatState {
  return { criteria: { ...EMPTY_CRITERIA }, inventoryType: null, stage: "budget", skipped: [] };
}

// ---------------------------------------------------------------------------
// Petites conversations
// ---------------------------------------------------------------------------

const GREETING_RE = /\b(?:salut|bonjour|bonsoir|bonj|hello|hi|hey|salam|salamo|salam 3alikom|assalam|lhala|lachak|la chak)\b|(?:صباح|مساء|السلام|السلام عليكم|سلام)/i;
const THANKS_RE = /\b(?:merci|choukran|chokran|chokra|choukra|shukran|thanks|thank you|thx)\b|(?:شكرا|الله يخليك|بارك الله)/i;
const HELP_RE = /\b(?:aide|help|comment|aidez|besoin|exemple)\b|(?:شنو|فهمني|كيفاش|عاونني)/i;
const SKIP_RE = /\b(?:passer|passe|skip|sauter|peu importe|nimporte|n'importe|aucune|aucun|je ne sais pas|jsp)\b|(?:لا فرق|غير مهم|اي شيء)/i;
const YES_RE = /\b(?:oui|ouais|yes|yep|ok|dac|daccord|d'accord|bien sur|aaah)\b|(?:نعم|ايه|اوك|واه|يه)/i;

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
// Machine d'avancement : question suivante non renseignee / non ignoree
// ---------------------------------------------------------------------------

function advanceNext(state: ChatState): ChatStage {
  const { criteria, skipped } = state;
  if (!budgetStatus(criteria) && !skipped.includes("budget")) return "budget";
  if (!criteria.carrosserie && !skipped.includes("carrosserie")) return "carrosserie";
  if (!criteria.motorisation && !skipped.includes("carburant")) return "carburant";
  if (!criteria.marque && !skipped.includes("marque")) return "marque";
  if (criteria.anneeMin === null && criteria.anneeMax === null && !skipped.includes("annee")) return "annee";
  return "done";
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
// Questions
// ---------------------------------------------------------------------------

function budgetQuestion(newState: ChatState, prev: ChatState): BotReply {
  const ack = acknowledgment(newState, prev);
  return {
    text: `${ack}Commençons par le plus important : quel est votre budget approximatif (en DH) ?`,
    quickReplies: [...BUDGET_BRACKETS.map((b) => b.label), ...INVENTORY_OPTIONS],
    done: false,
    state: newState,
  };
}

function carrosserieQuestion(newState: ChatState, prev: ChatState): BotReply {
  const ack = acknowledgment(newState, prev);
  return {
    text: `${ack}Quelle carrosserie vous attire le plus ?`,
    quickReplies: [...BODY_OPTIONS, "Passer"],
    done: false,
    state: newState,
  };
}

function carburantQuestion(newState: ChatState, prev: ChatState): BotReply {
  const ack = acknowledgment(newState, prev);
  return {
    text: `${ack}Quelle motorisation préférez-vous ?`,
    quickReplies: [...FUEL_OPTIONS, "Passer"],
    done: false,
    state: newState,
  };
}

function marqueQuestion(newState: ChatState, prev: ChatState): BotReply {
  const ack = acknowledgment(newState, prev);
  return {
    text: `${ack}Une marque préférée ?`,
    quickReplies: [...BRAND_OPTIONS, "Passer"],
    done: false,
    state: newState,
  };
}

function anneeQuestion(newState: ChatState, prev: ChatState): BotReply {
  const ack = acknowledgment(newState, prev);
  return {
    text: `${ack}À partir de quelle année ?`,
    quickReplies: [...YEAR_OPTIONS, "Passer"],
    done: false,
    state: newState,
  };
}

export function summaryText(state: ChatState): string {
  const { criteria, inventoryType } = state;
  const lines: string[] = [];
  if (budgetStatus(criteria)) lines.push(`• Budget : ${formatBudget(criteria)}`);
  if (inventoryType) lines.push(`• Statut : ${inventoryType === "new" ? "Neuf" : "Occasion"}`);
  if (criteria.carrosserie) lines.push(`• Carrosserie : ${criteria.carrosserie}`);
  if (criteria.motorisation) lines.push(`• Carburant : ${criteria.motorisation}`);
  if (criteria.marque) lines.push(`• Marque : ${criteria.marque}`);
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
      "Je vais vous guider pas à pas : d'abord le budget, puis le type de voiture, la motorisation, la marque et l'année.\n\n" +
      "Vous pouvez aussi tout me dire d'un coup, comme :\n" +
      "« un SUV essence 2024 moins de 250 000 DH »\n\n" +
      "C'est parti ! Quel est votre budget ?",
    quickReplies: [...BUDGET_BRACKETS.map((b) => b.label), ...INVENTORY_OPTIONS],
    done: false,
    state: createInitialState(),
  };
}

// ---------------------------------------------------------------------------
// Traitement principal d'un message utilisateur
// ---------------------------------------------------------------------------

export function answer(prev: ChatState, input: string): BotReply {
  const raw = input.trim();

  // Politesse / meta
  if (matches(HELP_RE, raw)) {
    return {
      text:
        "Pas de panique 😊 Je vous guide étape par étape : budget, type de voiture, carburant, marque et année.\n" +
        "Dites « Passer » pour sauter une question, ou décrivez tout d'un coup, ex. « Toyota SUV diesel 200 000 DH ».",
      quickReplies: [...BUDGET_BRACKETS.map((b) => b.label), ...BODY_OPTIONS],
      done: false,
      state: prev,
    };
  }
  if (matches(THANKS_RE, raw)) {
    const q = questionForStage(prev.stage, prev, prev);
    return { ...q, text: `Avec plaisir ! 😊\n${q.text}` };
  }

  // "Passer" / "non" sur une question optionnelle -> ignorer et avancer
  const wantsSkip = matches(SKIP_RE, raw) || /^non$/.test(raw.trim().toLowerCase());
  if (wantsSkip && prev.stage !== "budget" && prev.stage !== "done") {
    const skipped = prev.skipped.includes(prev.stage) ? prev.skipped : [...prev.skipped, prev.stage];
    const ns: ChatState = { ...prev, skipped };
    const next = advanceNext(ns);
    const q = questionForStage(next, ns, prev);
    return {
      ...q,
      text: `Pas de souci, on continue ! 😉\n${q.text}`,
    };
  }

  const bracket = applyBracketLabel(raw);
  const parsed = parseQuery(raw);

  const criteria: SearchCriteria = {
    carrosserie: parsed.carrosserie ?? prev.criteria.carrosserie,
    motorisation: parsed.motorisation ?? prev.criteria.motorisation,
    transmission: parsed.transmission ?? prev.criteria.transmission,
    marque: parsed.marque ?? prev.criteria.marque,
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
  const state: ChatState = { criteria, inventoryType, stage: prev.stage, skipped: prev.skipped };

  // Rien de nouveau compris ?
  const somethingNew =
    parsed.carrosserie !== null ||
    parsed.motorisation !== null ||
    parsed.transmission !== null ||
    parsed.marque !== null ||
    parsed.ville !== null ||
    parsed.budgetMin !== null ||
    parsed.budgetMax !== null ||
    parsed.anneeMin !== null ||
    parsed.anneeMax !== null ||
    parsed.kmMax !== null ||
    inventoryType !== prev.inventoryType;

  if (!somethingNew) {
    if (matches(GREETING_RE, raw)) {
      const q = questionForStage(prev.stage, prev, prev);
      return {
        text: `Bonjour et bienvenue sur Thiqti 👋 Je suis votre guide d'achat auto.\n\n${q.text}`,
        quickReplies: q.quickReplies,
        done: false,
        state: prev,
      };
    }
    if (matches(YES_RE, raw)) {
      const q = questionForStage(prev.stage, prev, prev);
      return {
        text: `Excellent ! 😄 ${q.text}`,
        quickReplies: q.quickReplies,
        done: false,
        state: prev,
      };
    }
    return {
      text:
        "Je n'ai pas bien compris 🤔 Pouvez-vous reformuler ?\n" +
        "Exemples : « 150 000 DH », « SUV diesel », « Toyota », « occasion à Casablanca », ou dites « Passer ».",
      quickReplies: [...BUDGET_BRACKETS.map((b) => b.label), ...BODY_OPTIONS],
      done: false,
      state: prev,
    };
  }

  const stage = advanceNext(state);

  if (stage === "done") {
    const ack = acknowledgment(state, prev);
    return {
      text: `${ack}Parfait, voici votre profil :\n${summaryText(state)}\n\nJe cherche les meilleures options pour vous... 🚀`,
      quickReplies: ["Recommencer"],
      done: true,
      state: { ...state, stage: "done" },
    };
  }

  return questionForStage(stage, state, prev);
}

function questionForStage(stage: ChatStage, state: ChatState, prev: ChatState): BotReply {
  let q: BotReply;
  if (stage === "budget") q = budgetQuestion(state, prev);
  else if (stage === "carrosserie") q = carrosserieQuestion(state, prev);
  else if (stage === "carburant") q = carburantQuestion(state, prev);
  else if (stage === "marque") q = marqueQuestion(state, prev);
  else q = anneeQuestion(state, prev);
  return { ...q, state: { ...state, stage } };
}

/** Construit la requete GET /api/search a partir de l'etat de la conversation. */
export function buildSearchRequest(state: ChatState): { q: string; type?: InventoryType } {
  const { criteria, inventoryType } = state;
  const parts: string[] = [];

  if (criteria.marque) parts.push(criteria.marque);
  if (criteria.carrosserie) parts.push(criteria.carrosserie);
  if (criteria.motorisation) parts.push(criteria.motorisation);
  if (criteria.transmission) parts.push(criteria.transmission);
  if (criteria.ville) parts.push(criteria.ville);

  if (criteria.budgetMin !== null && criteria.budgetMax !== null && criteria.budgetMin !== criteria.budgetMax) {
    if (criteria.budgetMin === 0) parts.push(`moins de ${criteria.budgetMax.toLocaleString("fr-FR")} DH`);
    else parts.push(`${criteria.budgetMin.toLocaleString("fr-FR")} à ${criteria.budgetMax.toLocaleString("fr-FR")} DH`);
  } else if (criteria.budgetMax !== null) {
    parts.push(`moins de ${criteria.budgetMax.toLocaleString("fr-FR")} DH`);
  } else if (criteria.budgetMin !== null) {
    parts.push(`plus de ${criteria.budgetMin.toLocaleString("fr-FR")} DH`);
  }

  return {
    q: parts.join(" ").trim(),
    type: inventoryType ?? undefined,
  };
}

// ---------------------------------------------------------------------------
// Message de recommandation genere a partir des resultats de la recherche
// ---------------------------------------------------------------------------

export function recommendationText(results: RecommendableCar[], state: ChatState): string {
  if (results.length === 0) {
    return (
      "Désolé, aucune voiture ne correspond exactement à votre profil 😕\n" +
      "Essayez d'élargir un peu le budget ou changez un critère (ex. « Passer » pour la marque), je trouverai sûrement votre perle !"
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
