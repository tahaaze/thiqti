// ============================================================================
// CHATBOT THIQTI — CONSEILLER CONVERSATIONNEL
// ============================================================================
//
// L'assistant dialogue d'abord avec l'utilisateur pour cerner son besoin :
// il pose UNE question à la fois (usage, budget, carburant, marque, ville...),
// accuse reception de chaque info, répond aux questions d'avis (ex: "essence
// ou mazot ?", "quelle marque ?") selon le profil, et NE lance la recherche
// que lorsque l'utilisateur le demande explicitement (« Voir les résultats »,
// « C'est bon », « voir plus »...). Chaque reponse est pure et rejouable.
// ============================================================================

import { parseQuery, SearchCriteria, isComparisonQuestion, parseComparisonOptions } from "./nlp";
import { InventoryType } from "./sources/types";

export type InventoryChoice = InventoryType | null;

export type ChatStage = "collecting" | "done";

export type ChatLanguage = "fr" | "darija";

export interface ChatState {
  criteria: SearchCriteria;
  inventoryType: InventoryChoice;
  stage: ChatStage;
  /** Langue active de la conversation (detectée depuis la langue de l'utilisateur). */
  lang: ChatLanguage;
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
  return { criteria: { ...EMPTY_CRITERIA }, inventoryType: null, stage: "collecting", lang: "fr" };
}

// ---------------------------------------------------------------------------
// Détection de la langue de l'utilisateur (darija / français)
// ---------------------------------------------------------------------------

const DARIJA_MARKERS =
  /\b(?:mazot|mazout|mazwot|kaz|kazwal|kazwa|banzin|benzin|bnzin|hjin|haibred|kahraba|rab3|rba3|rab3a|karosa|caroussa|madina|mdina|matik|manyal|manyouil|manwal|bghit|nchri|nechri|tomobil|tomobila|toumobil|khasni|rkhiss|ghalya|jmi3a|ryadi|chouf|choufni|3andi|walo|shi|shwiya|bzaaf|daba|ola|walaw|imma|wakh|wah|bgha|bghaw|khoud|takhod|fayn|wfin|kat2bel|drari|weldi|taz|bekri|kathir|ktir)\b/i;
const FR_MARKERS =
  /\b(?:je|j'|tu|vous|nous|mon|ma|mes|pour|avec|quelle|quel|quelles|quels|voulez|pouvez|souhaite|aimerais|cherche|cherchez|besoin|veux|pense|prefere|préfère|preferer|préférer)\b/i;

/** Détecte la langue d'un message en gardant la langue précédente si ambigu. */
export function detectLanguage(input: string, prev: ChatLanguage = "fr"): ChatLanguage {
  const t = input.trim();
  if (!t) return prev;
  if (/[\u0600-\u06FF]/.test(t)) return "darija";
  if (DARIJA_MARKERS.test(t)) return "darija";
  if (FR_MARKERS.test(t)) return "fr";
  return prev;
}

function pick(lang: ChatLanguage, fr: string, darija: string): string {
  return lang === "darija" ? darija : fr;
}

// ---------------------------------------------------------------------------
// Conseils courts pour les questions d'avis (essence/mazot, marques...)
// ---------------------------------------------------------------------------

const COMPARISON_ADVICE: Record<string, { fr: string; darija: string }> = {
  motorisation: {
    fr:
      "Pour le carburant, tout dépend de vos trajets : le mazot est idéal si vous roulez beaucoup (autoroute, longues distances) et il coûte moins cher au litre ; l'essence convient mieux à un usage urbain et aux petits trajets ; l'hybride offre un bon compromis entre les deux.",
    darija:
      "بالنسبة للكاز، كيعتمد على المسافات ديالك : المازوط أحسن إلا كنت كتسير بزاف (أوتوروت، مسافات طويلة) و أرخص فالليتر؛ الكاز أحسن للاستعمال فالمدينة والمسافات القصيرة؛ الهجين حل وسط بين الاتنين.",
  },
  marque: {
    fr:
      "La meilleure marque dépend surtout de votre budget et de votre usage : Dacia/Renault = excellent rapport qualité/prix, Toyota/Hyundai = fiabilité, BMW/Mercedes = premium. Donnez-moi votre budget et votre usage et je vous oriente !",
    darija:
      "أحسن ماركة كتعتمد على الميزانية والاستعمال : داسيا/رونو = أحسن جودة مقابل الثمن، تويوتا/هيونداي = الموثوقية، BMW/مرسيدس = الفخامة. عطيني الميزانية والاستعمال و أنا نوجهك !",
  },
  carrosserie: {
    fr:
      "Le bon type dépend de votre usage : SUV/crossover = espace et polyvalence, berline = confort sur route, citadine = pratique en ville, monospace = idéal famille.",
    darija:
      "النوع المناسب كيعتمد على الاستعمال : ربع/كروسوفر = اتساع وتعدد الاستعمال، كاروسة = الراحة فالطريق، مدينة = عملية فالمدينة، مونوسباص = مثالية للعائلة.",
  },
  transmission: {
    fr:
      "L'automatique est plus confortable en ville et dans les embouteillages ; la manuelle est souvent un peu plus économique à l'achat et à l'entretien.",
    darija:
      "الماتيك مريح أكثر فالمدينة والزمام؛ المانيال غالباً أرخص فالشراء والصيانة.",
  },
  inventory: {
    fr:
      "Le neuf offre garantie et 0 km ; l'occasion donne un meilleur rapport prix pour un modèle plus récent ou mieux équipé.",
    darija:
      "الجديدة = الضمانة و0 كم؛ المستعملة = أحسن قيمة مقابل الثمن لموديل أحدث ولا مجهز أكثر.",
  },
};

// ---------------------------------------------------------------------------
// Petites conversations
// ---------------------------------------------------------------------------

const GREETING_RE = /\b(?:salut|bonjour|bonsoir|bonj|hello|hi|hey|salam|salamo|salam 3alikom|assalam|lhala|lachak|la chak)\b|(?:صباح|مساء|السلام|السلام عليكم|سلام)/i;
const THANKS_RE = /\b(?:merci|choukran|chokran|chokra|choukra|shukran|thanks|thank you|thx)\b|(?:شكرا|الله يخليك|بارك الله)/i;
const HELP_RE = /\b(?:aide|help|comment|aidez|besoin|exemple)\b|(?:فهمني|كيفاش|عاونني)/i;
const SKIP_RE = /\b(?:passer|passe|skip|sauter|peu importe|nimporte|n'importe|aucune|aucun|je ne sais pas|jsp)\b|(?:لا فرق|غير مهم|اي شيء|ماشي مشكل|ما شي مشكل|ما في مشكل)|machi\s*m(?:o|u)ch?kil|machi\s*mushkil/i;
const YES_RE = /\b(?:oui|ouais|yes|yep|ok|dac|daccord|d'accord|bien sur|aaah)\b|(?:نعم|ايه|اوك|واه|يه)/i;
const SEE_MORE_RE =
  /\b(?:voir|voire)\s+(?:plus|tous|toutes|plus de)\s*(?:options|annonces|r.sultats?)?|(?:voir|voire)\s+les?\s*r.sultats?|plus de r.sultats?|tous les r.sultats?|d'autres (?:options|annonces|r.sultats?)|show more|other results/i;
const WANTS_RESULTS_RE =
  /\b(?:voir|voire)\s*(?:les?\s*)?r.sultats?|\b(?:montre|montrer|affiche|afficher|cherche|chercher|donne|donner|propose|proposer|je veux voir|valide|valider)\b|(?:les?|des?)\s*r.sultats?|nchof|nchouf|nata2ij|nata2ej|chouf|werini|wreni|goul\s*l[ia]|passe?\s*(?:a|aux|to|vers)\s*r.sult|بغيت نشوف|وريني|اريني|شوف|نشوف|عطيني|نتائج|خلاص/i;
/** Demande de changement de langue (ex: « dwi meaya b arabe », « parle darija »). */
const LANGUAGE_RE =
  /(?:\b(?:dwi|hadr|hadar|tkallam|tkellem|tekellem|parle|parlez|speak|dis|gbili|gol)\b[^ا-ي]*\b(?:b|be|bi|en|in|a|bas)\b\s*)?(?:(?:darija|darja|darija|arabia|arabe|arabic|3arabi|3arabia|francais|francaise|français|française|fr))\b|(?:هدر|هضر|دوي|تكلم|كلم)\s*(?:معايا?|بال|ب)?\s*(?:عربية|عربي|داريجا|فرنسية|فرنسا)/i;
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
  if (/\boccasion\b|occasions|d'occasion|usag|used|seconde main|مستعمل|مستعملة|mesta[3a]ml[ae]?|msthml[ae]?|msthm[ae]?|mst[ae]m[la]/.test(n)) return "used";
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

const INTENT_LABELS: Record<string, { fr: string; darija: string }> = {
  achat: { fr: "", darija: "" },
  familial: { fr: "une voiture familiale", darija: "طوموبيل عائلية" },
  sportif: { fr: "une voiture sportive", darija: "طوموبيل رياضية" },
  economique: { fr: "une voiture économique", darija: "طوموبيل اقتصادية" },
  confort: { fr: "une voiture confortable", darija: "طوموبيل مريحة" },
  ville: { fr: "un usage urbain", darija: "استعمال حضري" },
  route: { fr: "un usage routier", darija: "استعمال للطرق" },
  tout_terrain: { fr: "un usage tout-terrain", darija: "استعمال للوعر" },
  mixte: { fr: "un usage mixte", darija: "استعمال مختلط" },
};

const BODY_LABELS: Record<string, { fr: string; darija: string }> = {
  "SUV": { fr: "un SUV", darija: "ربع (SUV)" },
  "Berline": { fr: "une berline", darija: "كاروسة" },
  "Citadine": { fr: "une citadine", darija: "مدينة (citadine)" },
  "Compacte": { fr: "une compacte", darija: "كومباك" },
  "Crossover": { fr: "un crossover", darija: "كروسوفر" },
  "Utilitaire": { fr: "un utilitaire", darija: "أوتيليتير" },
  "Monospace": { fr: "un monospace", darija: "مونوسباص" },
  "Break": { fr: "un break", darija: "بريك" },
  "Coupé": { fr: "un coupé", darija: "كوبيه" },
  "Cabriolet": { fr: "un cabriolet", darija: "كابريوليه" },
};

const FUEL_LABELS: Record<string, { fr: string; darija: string }> = {
  "Diesel": { fr: "diesel", darija: "مازوط" },
  "Essence": { fr: "essence", darija: "كاز" },
  "Hybride": { fr: "hybride", darija: "هجين" },
  "Électrique": { fr: "électrique", darija: "كهرباء" },
  "GNV": { fr: "gnv", darija: "غاز" },
  "GPL": { fr: "gpl", darija: "غاز" },
};

const TRANS_LABELS: Record<string, { fr: string; darija: string }> = {
  "Automatique": { fr: "automatique", darija: "ماتيك" },
  "Manuelle": { fr: "manuelle", darija: "مانيال" },
};

function formatBudgetDarija(criteria: SearchCriteria): string {
  const { budgetMin, budgetMax } = criteria;
  const n = (v: number) => v.toLocaleString("fr-FR");
  if (budgetMin !== null && budgetMax !== null) {
    if (budgetMin === 0) return `أقل من ${n(budgetMax)} درهم`;
    if (budgetMin === budgetMax) return `${n(budgetMin)} درهم`;
    return `من ${n(budgetMin)} حتى ${n(budgetMax)} درهم`;
  }
  if (budgetMax !== null) return `أقل من ${n(budgetMax)} درهم`;
  if (budgetMin !== null) return `أكثر من ${n(budgetMin)} درهم`;
  return "";
}

function acknowledgment(newState: ChatState, prev: ChatState): string {
  const lang = newState.lang;
  const parts: string[] = [];
  const c = newState.criteria;
  const p = prev.criteria;

  if (newState.inventoryType && newState.inventoryType !== prev.inventoryType) {
    parts.push(
      newState.inventoryType === "new"
        ? pick(lang, "un véhicule neuf", "طوموبيل جديدة")
        : pick(lang, "un véhicule d'occasion", "طوموبيل مستعملة")
    );
  }
  if (c.carrosserie && c.carrosserie !== p.carrosserie) {
    parts.push(BODY_LABELS[c.carrosserie]?.[lang] ?? `un ${c.carrosserie}`);
  }
  if (c.motorisation && c.motorisation !== p.motorisation) {
    parts.push(FUEL_LABELS[c.motorisation]?.[lang] ?? c.motorisation.toLowerCase());
  }
  if (c.marque && c.marque !== p.marque) parts.push(c.marque);
  if (c.modele && c.modele !== p.modele) {
    parts.push(pick(lang, `un modèle ${c.modele}`, `موديل ${c.modele}`));
  }
  if (c.ville && c.ville !== p.ville) parts.push(pick(lang, `à ${c.ville}`, `فـ${c.ville}`));
  if (c.transmission && c.transmission !== p.transmission) {
    parts.push(TRANS_LABELS[c.transmission]?.[lang] ?? c.transmission.toLowerCase());
  }
  if (c.anneeMin && c.anneeMin !== p.anneeMin) {
    parts.push(pick(lang, `à partir de ${c.anneeMin}`, `من عام ${c.anneeMin}`));
  }
  const newBudget =
    (c.budgetMin !== null || c.budgetMax !== null) &&
    !(p.budgetMin !== null || p.budgetMax !== null);
  if (newBudget) {
    parts.push(
      pick(
        lang,
        `un budget de ${formatBudget(c)}`,
        `ميزانية ديال ${formatBudgetDarija(c)}`
      )
    );
  }
  const newIntents = c.intent.filter((i) => !p.intent.includes(i));
  for (const i of newIntents) {
    const label = INTENT_LABELS[i]?.[lang];
    if (label) parts.push(label);
  }

  if (parts.length === 0) return "";
  const sentence = parts.length === 1 ? parts[0] : parts.slice(0, -1).join(", ") + pick(lang, " et ", " و ") + parts[parts.length - 1];
  return pick(lang, `Compris : ${sentence}. `, `فهمت : ${sentence}. `);
}

// ---------------------------------------------------------------------------
// Question suivante : le conseiller pose UNE question à la fois
// ---------------------------------------------------------------------------

const USAGE_INTERESTS = ["familial", "sportif", "economique", "confort", "ville", "route", "tout_terrain", "mixte"];

const PROPOSE_RESULTS_LINE = {
  fr: "\n\n💡 « Voir les résultats » si vous en avez assez, sinon donnez-moi une autre info.",
  darija: "\n\n💡 قول « Voir les résultats » إلا بغيتي تشوف النتائج دابا، ولّا عطيني معلومة أخرى.",
};

export function nextQuestion(state: ChatState): { text: string; quickReplies: string[] } {
  const lang = state.lang;
  const c = state.criteria;
  const hasUsage = c.intent.some((i) => USAGE_INTERESTS.includes(i));
  const questions: { condition: boolean; fr: string; darija: string; quickReplies: string[] }[] = [
    {
      condition: c.budgetMin === null && c.budgetMax === null,
      fr: "Quel est votre budget approximatif ? (ex : 200 000 DH)",
      darija: "شحال هي الميزانية ديالك تقريباً ؟ (مثلا : 200 000 درهم)",
      quickReplies: ["Moins de 150 000 DH", "150 000 à 250 000 DH", "250 000 à 400 000 DH", "Plus de 400 000 DH"],
    },
    {
      condition: !hasUsage && !c.carrosserie,
      fr: "Quel sera l'usage principal ? (familiale, sportive, urbaine, mixte...)",
      darija: "شنو غادي يكون الاستعمال الأساسي ؟ (عائلية، رياضية، حضرية، مختلطة...)",
      quickReplies: ["Familiale", "Sportive", "Urbaine", "Mixte"],
    },
    {
      condition: !c.carrosserie && !hasUsage,
      fr: "Plutôt un SUV, une berline, une citadine ou un crossover ?",
      darija: "أشنو تفضل : ربع (SUV)، كاروسة، مدينة ولا كروسوفر ؟",
      quickReplies: ["SUV", "Berline", "Citadine", "Crossover"],
    },
    {
      condition: !c.motorisation,
      fr: "Plutôt diesel, essence ou hybride ?",
      darija: "أشنو تفضل : مازوط، كاز ولا هجين ؟",
      quickReplies: ["Diesel", "Essence", "Hybride", "Électrique"],
    },
    {
      condition: !state.inventoryType,
      fr: "Vous cherchez du neuf ou de l'occasion ?",
      darija: "بغيتي جديدة ولا مستعملة ؟",
      quickReplies: ["Neuf", "Occasion"],
    },
    {
      condition: !c.marque,
      fr: "Une marque préférée ?",
      darija: "واش عندك ماركة مفضلة ؟",
      quickReplies: ["Toyota", "Dacia", "Renault", "Peugeot"],
    },
    {
      condition: !c.transmission,
      fr: "Boîte automatique ou manuelle ?",
      darija: "ماتيك ولا مانيال ؟",
      quickReplies: ["Automatique", "Manuelle"],
    },
    {
      condition: !c.ville,
      fr: "Dans quelle ville cherchez-vous ?",
      darija: "في أي مدينة كاتقلب ؟",
      quickReplies: ["Casablanca", "Rabat", "Marrakech", "Tanger"],
    },
    {
      condition: c.anneeMin === null && c.anneeMax === null,
      fr: "À partir de quelle année ?",
      darija: "من عام شحال بغيتي ؟",
      quickReplies: ["2022 et plus", "2024 et plus"],
    },
    {
      condition: c.kmMax === null,
      fr: "Un kilométrage maximum ?",
      darija: "واش عندك حد أقصى ديال الكيلومترات ؟",
      quickReplies: ["50 000 km max", "100 000 km max"],
    },
  ];

  for (const q of questions) {
    if (q.condition) {
      const replies = hasCriteria(state)
        ? ["Voir les résultats", ...q.quickReplies.slice(0, 3)]
        : q.quickReplies;
      return {
        text: pick(lang, q.fr, q.darija) + PROPOSE_RESULTS_LINE[lang],
        quickReplies: replies,
      };
    }
  }

  return {
    text: pick(
      lang,
      "Voulez-vous voir les résultats ou ajouter un dernier critère ?",
      "بغيتي تشوف النتائج ولا تزيد معلومة أخرى ؟"
    ),
    quickReplies: ["Voir les résultats", "C'est bon"],
  };
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

/**
 * Assez d'infos pour proposer les résultats : un budget est connu ET au moins
 * un critère de profil (carburant ou type). L'usage seul (ex: « familiale »)
 * ne suffit pas : on pose encore la question du carburant avant de proposer.
 */
export function hasEnoughForResults(state: ChatState): boolean {
  const c = state.criteria;
  const budgetKnown = c.budgetMin !== null || c.budgetMax !== null;
  const profileKnown = !!c.motorisation || !!c.carrosserie;
  return budgetKnown && profileKnown;
}

/** Résumé compact des critères connus, en une ligne (ex: "SUV, diesel, Toyota"). */
export function criteriaLine(state: ChatState): string {
  const lang = state.lang;
  const c = state.criteria;
  const parts: string[] = [];
  if (budgetStatus(c)) parts.push(pick(lang, `un budget de ${formatBudget(c)}`, `ميزانية ديال ${formatBudgetDarija(c)}`));
  if (state.inventoryType) parts.push(state.inventoryType === "new" ? pick(lang, "du neuf", "جديدة") : pick(lang, "de l'occasion", "مستعملة"));
  if (c.carrosserie) parts.push(BODY_LABELS[c.carrosserie]?.[lang] ?? c.carrosserie);
  if (c.motorisation) parts.push(FUEL_LABELS[c.motorisation]?.[lang] ?? c.motorisation.toLowerCase());
  if (c.marque) parts.push(c.marque);
  if (c.modele) parts.push(c.modele);
  if (c.transmission) parts.push(TRANS_LABELS[c.transmission]?.[lang] ?? c.transmission.toLowerCase());
  if (c.ville) parts.push(pick(lang, `à ${c.ville}`, `فـ${c.ville}`));
  if (c.anneeMin) parts.push(pick(lang, `${c.anneeMin} et plus`, `من عام ${c.anneeMin}`));
  if (c.kmMax) parts.push(pick(lang, `${c.kmMax.toLocaleString("fr-FR")} km max`, `أقصى ${c.kmMax.toLocaleString("fr-FR")} كم`));
  return parts.length ? parts.join(", ") : pick(lang, "aucun critère précis", "ما زال حتى معيار دقيق");
}

/** Liste de puces pour l'interface (ex: ["Budget : 150 000 à 250 000 DH", "Type : SUV"]). */
export function criteriaSummary(state: ChatState): string[] {
  const lang = state.lang;
  const c = state.criteria;
  const out: string[] = [];
  if (budgetStatus(c)) out.push(pick(lang, `Budget : ${formatBudget(c)}`, `الميزانية : ${formatBudgetDarija(c)}`));
  if (state.inventoryType) out.push(state.inventoryType === "new" ? pick(lang, "Neuf", "جديدة") : pick(lang, "Occasion", "مستعملة"));
  if (c.carrosserie) out.push(pick(lang, `Type : ${c.carrosserie}`, `النوع : ${BODY_LABELS[c.carrosserie]?.darija ?? c.carrosserie}`));
  if (c.motorisation) out.push(pick(lang, `Carburant : ${c.motorisation}`, `الكاز : ${FUEL_LABELS[c.motorisation]?.darija ?? c.motorisation}`));
  if (c.marque) out.push(pick(lang, `Marque : ${c.marque}`, `الماركة : ${c.marque}`));
  if (c.modele) out.push(pick(lang, `Modèle : ${c.modele}`, `الموديل : ${c.modele}`));
  if (c.transmission) out.push(pick(lang, `Boîte : ${c.transmission}`, `الماتيك : ${TRANS_LABELS[c.transmission]?.darija ?? c.transmission}`));
  if (c.ville) out.push(pick(lang, `Ville : ${c.ville}`, `المدينة : ${c.ville}`));
  if (c.anneeMin) out.push(pick(lang, `Année : ${c.anneeMin} et plus`, `السنة : ${c.anneeMin} فأكثر`));
  if (c.kmMax) out.push(pick(lang, `Km max : ${c.kmMax.toLocaleString("fr-FR")} km`, `أقصى كم : ${c.kmMax.toLocaleString("fr-FR")}`));
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
      "Pour trouver la voiture idéale, je vais vous poser quelques questions (usage, budget, carburant, marque...).\n" +
      "Répondez comme vous voulez, ou décrivez directement votre envie : « SUV diesel 250 000 DH », « بغيت ربع ديزل اقل من 250000 درهم »...\n\n" +
      "On commence : quelle est votre idée de voiture ?",
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
  const lang = detectLanguage(raw, prev.lang);
  const criteriaKnown = hasCriteria(prev);

  // Politesse / meta
  if (matches(LANGUAGE_RE, raw)) {
    const wantsFr =
      /\b(?:francais|francaise|français|française|fr|french)\b|(?:فرنسية|فرنسا)/i.test(raw);
    const target: ChatLanguage = wantsFr ? "fr" : "darija";
    const replyFr =
      "D'accord ! Je vous parle en français désormais 😊\n" +
      (criteriaKnown
        ? "Nous gardons vos critères, dites-moi ce que vous voulez ajouter (ex : « 250 000 DH », « Toyota », « SUV »)."
        : "Comment puis-je vous aider ? Dites-moi votre budget, le type de voiture ou la marque.");
    const replyDarija =
      "واخا خاصك بالداريجة ! 😊\n" +
      (criteriaKnown
        ? "حافظنا على المعايير ديالك، قول ليا شنو بغيتي تزيد (مثلا : « 250000 درهم », « Toyota », « ربع »)."
        : "كيفاش نقدر نعاونك ؟ قول ليا الميزانية، نوع الطوموبيل ولا الماركة.");
    return {
      text: wantsFr ? replyFr : replyDarija,
      quickReplies: criteriaKnown
        ? ["Voir les résultats", "Recommencer"]
        : ["SUV", "Moins de 150 000 DH", "Toyota", "Diesel"],
      done: false,
      search: false,
      state: { ...prev, lang: target },
    };
  }

  if (matches(HELP_RE, raw)) {
    return {
      text: pick(
        lang,
        "Pas de panique 😊 Dites-moi ce que vous cherchez, dans n'importe quel ordre : budget, type de voiture, carburant, boîte, marque, ville, année...\n" +
          "Exemples : « SUV diesel 200 000 DH », « Toyota », « automatique à Casablanca », ou « بغيت ربع ديزل ».\n" +
          "Dès que j'ai quelques critères, je vous propose des voitures — vous pourrez dire « Voir plus » ou « C'est bon ».",
        "ما تخافش 😊 قول ليا شنو كاتقلب، بأي ترتيب بغيتي : الميزانية، نوع الطوموبيل، الكاز، الماتيك، الماركة، المدينة، السنة...\n" +
          "مثلا : « ربع ديزل 200000 درهم », « Toyota », « ماتيك فكازا »...\n" +
          "ملي يكون عندي شي معايير، نقترح عليك سيارات — تقدر تقول « Voir plus » ولا « C'est bon »."
      ),
      quickReplies: ["SUV", "Moins de 150 000 DH", "Toyota", "C'est bon"],
      done: false,
      search: false,
      state: { ...prev, lang },
    };
  }

  if (matches(THANKS_RE, raw)) {
    return {
      text: pick(
        lang,
        "Avec plaisir ! 😊 Si vous voulez, on continue : donnez-moi un critère de plus ou dites « C'est bon » pour valider.",
        "بلا جميل ! 😊 إلا بغيتي نكمّلوا : عطيني معيار آخر ولّا قول « C'est bon » باش نشوف النتائج."
      ),
      quickReplies: ["Voir plus", "C'est bon", "Recommencer"],
      done: false,
      search: criteriaKnown,
      state: { ...prev, lang },
    };
  }

  if (matches(SEE_MORE_RE, raw) || matches(WANTS_RESULTS_RE, raw)) {
    // « voir les résultats » / « je cherche » : si la phrase contient en fait de
    // nouveaux critères (ex. « Je cherche un SUV autour de 200000 DH »), on ne
    // court-circuite pas : on laisse le traitement normal les appliquer.
    const mayContainCriteria = /(?:de |d[e']|a |à |un |une )?\d|\b(?:SUV|berline|citadine|diesel|essence|hybride|toyota|renault|dacia|automatique|manuel|rabat|casablanca)\b/i.test(raw);
    const shouldResolve = !mayContainCriteria;
    if (shouldResolve) {
      if (criteriaKnown) {
        return {
          text: pick(
            lang,
            `Parfait, voici vos résultats pour : ${criteriaLine(prev)} 🚗`,
            `واخا، هاهي النتائج ديالك على حساب : ${criteriaLine(prev)} 🚗`
          ),
          quickReplies: ["C'est bon", "Recommencer"],
          done: false,
          search: true,
          state: { ...prev, lang },
        };
      }
      const q = nextQuestion({ ...prev, lang });
      return {
        text: pick(
          lang,
          `Bien sûr ! Avant de chercher, j'ai besoin de quelques infos.\n\n${q.text}`,
          `بلا مشكل ! قبل ما نقلب، خاصني شي معلومات.\n\n${q.text}`
        ),
        quickReplies: q.quickReplies,
        done: false,
        search: false,
        state: { ...prev, lang },
      };
    }
  }

  if (matches(REFINE_RE, raw)) {
    return {
      text: pick(
        lang,
        "Bien sûr ! Qu'est-ce que vous voulez préciser ? Par exemple : carburant (« Diesel »), budget (« 250 000 DH »), marque (« Toyota »), boîte (« automatique »), ville (« à Casablanca ») ou année (« 2022 et plus »).",
        "بلا مشكل ! شنو بغيتي تزبط بالضبط ؟ مثلا : الكاز (« مازوط »), الميزانية (« 250000 درهم »), الماركة (« Toyota »), الماتيك (« ماتيك »), المدينة (« فكازا ») ولا السنة (« 2022 فأكثر »)."
      ),
      quickReplies: ["Voir plus", "C'est bon"],
      done: false,
      search: false,
      state: { ...prev, lang },
    };
  }

  if (matches(DONE_RE, raw) || (/^non$/.test(raw.toLowerCase()) && criteriaKnown)) {
    return {
      text: criteriaKnown
        ? pick(
            lang,
            `Parfait ! 🎉 Voici vos résultats selon votre profil :\n${summaryText(prev)}`,
            `واخا ! 🎉 هاهي النتائج على حساب الملف ديالك :\n${summaryText(prev)}`
          )
        : pick(
            lang,
            "D'accord ! N'hésitez pas à revenir quand vous voulez : dites-moi simplement votre budget, votre type de voiture, ou « Recommencer ». 😉",
            "واخا ! ما تخافش ترجع أي وقت بغيتي : قول ليا الميزانية، نوع الطوموبيل، ولا « Recommencer ». 😉"
          ),
      quickReplies: criteriaKnown ? ["Voir les résultats", "Recommencer"] : ["Recommencer"],
      done: false,
      search: criteriaKnown,
      state: { ...prev, stage: "done", lang },
    };
  }

  if (matches(SKIP_RE, raw) && criteriaKnown) {
    return {
      text: pick(
        lang,
        "Pas de souci, on garde ce qu'on a ! 😉 Donnez-moi un critère de plus ou dites « C'est bon » pour voir les résultats.",
        "لا مشكل، نخليو اللي عندنا ! 😉 عطيني معيار آخر ولّا قول « C'est bon » باش تشوف النتائج."
      ),
      quickReplies: ["Voir plus", "C'est bon", "Recommencer"],
      done: false,
      search: false,
      state: { ...prev, lang },
    };
  }

  // Question d'avis ("essence ou mazot ?", "quelle marque ?", "meilleure voiture ?")
  if (isComparisonQuestion(raw)) {
    const parsed = parseQuery(raw);
    const options = parseComparisonOptions(raw);
    const dim = options[0]?.dimension ?? "marque";
    const advice = COMPARISON_ADVICE[dim]?.[lang] ?? COMPARISON_ADVICE[dim]?.fr ?? "";
    const state: ChatState = {
      criteria: {
        ...prev.criteria,
        intent: [...new Set([...prev.criteria.intent, ...parsed.intent])],
      },
      inventoryType: prev.inventoryType,
      stage: "collecting",
      lang,
    };
    const ack = acknowledgment(state, prev);
    const q = nextQuestion(state);
    return {
      text: `${ack}${advice}\n\n${q.text}`,
      quickReplies: q.quickReplies,
      done: false,
      search: false,
      state,
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
  const state: ChatState = { criteria, inventoryType, stage: "collecting", lang };

  // Rien de nouveau compris ?
  const prevIntent = new Set(prev.criteria.intent);
  const newIntents = parsed.intent.filter((i) => !prevIntent.has(i));

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
    inventoryType !== prev.inventoryType ||
    newIntents.length > 0;

  if (!somethingNew) {
    if (matches(GREETING_RE, raw)) {
      return {
        text: pick(
          lang,
          "Bonjour et bienvenue sur Thiqti 👋 Je suis votre conseiller auto.\n" +
            "Dites-moi ce que vous cherchez : budget, type, carburant, marque, ville, année — dans l'ordre que vous voulez !",
          "مرحبا بيك ف ثيقتي 👋 أنا مستشارك ديال السيارات.\n" +
            "قول ليا شنو كاتقلب : الميزانية، النوع، الكاز، الماركة، المدينة، السنة — بأي ترتيب بغيتي !"
        ),
        quickReplies: ["SUV", "Moins de 150 000 DH", "Toyota", "Diesel"],
        done: false,
        search: false,
        state: { ...prev, lang },
      };
    }
    if (matches(YES_RE, raw)) {
      if (criteriaKnown) {
        return {
          text: pick(
            lang,
            "Parfait, je lance la recherche avec vos critères ! 🚗",
            "واخا، كنطلق البحث بالمعايير ديالك ! 🚗"
          ),
          quickReplies: ["Voir les résultats", "Recommencer"],
          done: false,
          search: true,
          state: { ...prev, lang },
        };
      }
      return {
        text: pick(
          lang,
          "Excellent ! 😄 Dites-moi ce qui compte pour vous (budget, type, carburant, marque...) et je vous trouve des propositions.",
          "ممتاز ! 😄 قول ليا شنو مهم عندك (الميزانية، النوع، الكاز، الماركة...) وأنا نلاقي ليك اقتراحات."
        ),
        quickReplies: ["SUV", "Moins de 150 000 DH", "Toyota", "Diesel"],
        done: false,
        search: false,
        state: { ...prev, lang },
      };
    }
    if (matches(WANTS_RESULTS_RE, raw) || matches(DONE_RE, raw)) {
      if (criteriaKnown) {
        return {
          text: pick(
            lang,
            "Recherche en cours... 🔍 Je te montre les résultats !",
            "كنقلب دابا... 🔍 نوريك النتائج !"
          ),
          quickReplies: [],
          done: false,
          search: true,
          state: { ...prev, lang },
        };
      }
      return {
        text: pick(
          lang,
          "Il me manque encore un critère ! Donnez-moi au moins votre budget ou le type de voiture cherché.",
          "لا زال ناقصني شي معايير ! عطيني الميزانية على الأقل ولا نوع الطوموبيل."
        ),
        quickReplies: ["SUV", "Moins de 150 000 DH", "Toyota", "Diesel"],
        done: false,
        search: false,
        state: { ...prev, lang },
      };
    }
    return {
      text: pick(
        lang,
        "Je n'ai pas bien compris 🤔 Pouvez-vous reformuler ?\n" +
          "Exemples : « 150 000 DH », « SUV diesel », « Toyota », « occasion à Casablanca », ou dites « C'est bon » pour valider vos critères actuels.",
        "ما فهمتكش مليح 🤔 واش يمكن تعاود تصوغ ؟\n" +
          "مثلا : « 150000 درهم », « ربع ديزل », « Toyota », « مستعملة فكازا », ولّا قول « C'est bon » باش تثبت المعايير الحالية."
      ),
      quickReplies: ["Voir plus", "C'est bon"],
      done: false,
      search: false,
      state: { ...prev, lang },
    };
  }

  const ack = acknowledgment(state, prev);
  const hasStructured = hasCriteria(state);

  if (!hasStructured && newIntents.includes("achat")) {
    return {
      text: pick(
        lang,
        "Très bien ! 🚗 Pour vous trouver la voiture idéale, parlez-moi de vous :\n\n" +
          "• Quel est votre **budget** ? (ex: 200 000 DH)\n" +
          "• Un type de voiture ? (SUV, citadine, berline…)\n" +
          "• **Diesel**, essence, hybride ?\n" +
          "• Une **marque** en tête ? (Toyota, Dacia…)\n" +
          "• Dans quelle **ville** ?\n\n" +
          "Donnez-moi ce que vous savez, même un seul critère suffit !",
        "مزيان ! 🚗 باش نلاقي ليك الطوموبيل المثالية، هضر معايا على روحك :\n\n" +
          "• شحال هي **الميزانية** ؟ (مثلا : 200000 درهم)\n" +
          "• نوع ديال الطوموبيل ؟ (ربع، مدينة، كاروسة…)\n" +
          "• **مازوط**، كاز، ولا هجين ؟\n" +
          "• واش عندك **ماركة** معينة ؟ (Toyota, Dacia…)\n" +
          "• فاش **المدينة** ؟\n\n" +
          "عطيني اللي كتعرف، حتى معيار واحد كافي !"
      ),
      quickReplies: ["Moins de 200 000 DH", "SUV diesel", "Toyota", "Casablanca"],
      done: false,
      search: false,
      state,
    };
  }

  // Assez d'infos (budget + carburant/type) : on résume et on met en avant
  // le bouton « Voir les résultats », avec les critères restants en option.
  if (hasEnoughForResults(state)) {
    const summary = summaryText(state).replace(/\n/g, " · ");
    const nq = nextQuestion(state);
    const optionalReplies = nq.quickReplies.filter((x) => x !== "Voir les résultats").slice(0, 3);
    const text = `${ack}\n\n${pick(
      lang,
      `Récapitulatif : ${summary}`,
      `الخلاصة : ${summary}`
    )}\n\n${pick(
      lang,
      "Vous pouvez appuyer sur « Voir les résultats » pour lancer la recherche maintenant, ou continuer à préciser (neuf/occasion, marque, boîte, ville...).",
      "تقدر تضغط « Voir les résultats » باش نطلقو البحث دابا، ولا نكمّل نزيدو (جديدة/مستعملة، الماركة، الماتيك، المدينة...)."
    )}`;
    return {
      text,
      quickReplies: ["Voir les résultats", ...optionalReplies],
      done: false,
      search: false,
      state,
    };
  }

  const q = nextQuestion(state);
  return {
    text: `${ack}${q.text}`,
    quickReplies: q.quickReplies,
    done: false,
    search: false,
    state,
  };
}

export interface SearchRequestFilters {
  minPrice?: number;
  maxPrice?: number;
  minYear?: number;
  maxKm?: number;
  brand?: string;
  bodyType?: string;
  fuel?: string;
  city?: string;
  transmission?: string;
}

export interface SearchRequest {
  q: string;
  type?: InventoryType;
  filters: SearchRequestFilters;
}

/** Construit la requete de recherche a partir de l'etat de la conversation.
 *
 * Les criteres structures (marque, carrosserie, carburant, boite, ville,
 * budget, annee, kilometrage) sont envoyes en FILTRES (brand/bodyType/fuel/
 * transmission/city/minPrice/maxPrice/minYear/maxKm) et NON dans le texte
 * libre : une conjonction ET de mots dans `q` viderait les resultats des
 * qu'un mot comme "SUV" n'apparait pas dans le titre des annonces.
 * Le texte libre ne porte que le modele, que l'API cherche par mots-cles.
 */
export function buildSearchRequest(state: ChatState): SearchRequest {
  const { criteria, inventoryType } = state;

  const q = criteria.modele ? criteria.modele : "";

  const filters: SearchRequestFilters = {};
  if (criteria.marque) filters.brand = criteria.marque;
  if (criteria.carrosserie) filters.bodyType = criteria.carrosserie;
  if (criteria.motorisation) filters.fuel = criteria.motorisation;
  if (criteria.transmission) filters.transmission = criteria.transmission;
  if (criteria.ville) filters.city = criteria.ville;
  if (criteria.budgetMin !== null && criteria.budgetMin > 0) filters.minPrice = criteria.budgetMin;
  if (criteria.budgetMax !== null) filters.maxPrice = criteria.budgetMax;
  if (criteria.anneeMin !== null) filters.minYear = criteria.anneeMin;
  if (criteria.kmMax !== null) filters.maxKm = criteria.kmMax;

  return {
    q,
    type: inventoryType ?? undefined,
    filters,
  };
}

// ---------------------------------------------------------------------------
// Message de recommandation genere a partir des resultats de la recherche
// ---------------------------------------------------------------------------

export function recommendationText(results: RecommendableCar[], state: ChatState): string {
  const lang = state.lang;
  if (results.length === 0) {
    return pick(
      lang,
      "Désolé, aucune voiture ne correspond exactement à ces critères 😕\n" +
        "Essayez d'élargir un peu le budget, de retirer un critère ou de changer de marque — je trouverai sûrement votre perle !",
      "عفواً، ما لقينا حتى طوموبيل مطابقة تماماً للمعايير 😕\n" +
        "جرب توسيع الميزانية، نحّي معيار ولّا بدّل الماركة — وأكيد غادي نلقى اللي كتستاهل !"
    );
  }

  const medals = ["🏆", "🥈", "🥉"];
  const lines = results.slice(0, 3).map((car, i) => {
    const label = car.inventoryType ? ` (${car.inventoryType === "new" ? "neuf" : "occasion"})` : "";
    return `${medals[i] || "•"} ${car.title}${label} — ${car.priceFormatted} · score ${car.score}/100`;
  });

  const extra = results.length > 3
    ? pick(
        lang,
        `\n\nEt ${results.length - 3} autres excellentes options dans les cartes ci-dessous.`,
        `\n\nو ${results.length - 3} خيارات أخرى ممتازة فالكروسات تحت.`
      )
    : "";

  return (
    pick(
      lang,
      `Voici mes meilleures recommandations pour ${summaryText(state).replace(/\n/g, " · ")} :\n\n`,
      `هاهي أحسن اقتراحاتي ليك على حساب : ${summaryText(state).replace(/\n/g, " · ")} :\n\n`
    ) +
    lines.join("\n") +
    extra +
    pick(
      lang,
      "\n\nCliquez sur une carte pour les détails, ou « Voir tous les résultats » pour comparer.",
      "\n\nكليك على كارت باش تشوف التفاصيل، ولّا « Voir tous les résultats » باش تقارن."
    )
  );
}

/** Message quand la recherche a dû relâcher des critères. */
export function relaxedText(
  state: ChatState,
  relaxed: string[],
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _expandedBudget: boolean
): string {
  const lang = state.lang;
  const criteria = summaryText(state).replace(/\n/g, " · ");
  const relaxedList = relaxed.map((r) => `• ${r}`).join("\n");
  return pick(
    lang,
    `Aucun résultat exact pour ${criteria}, mais j'ai trouvé des alternatives proches en assouplissant :\n\n` +
      relaxedList +
      "\n\nVoici les voitures qui s'en rapprochent le plus :",
    `ما لقينا حتى نتيجة دقيقة لـ ${criteria}، ولكن لقينا بدائل قريبة بعد ما خففنا :\n\n` +
      relaxedList +
      "\n\nهاهي الطوموبيلات اللي قريبة للأكثر :"
  );
}
