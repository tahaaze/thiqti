import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY ?? "");

interface ChatMsg {
  role: "user" | "bot";
  text: string;
}

interface ChatRequest {
  message: string;
  history: ChatMsg[];
}

interface GeminiResponse {
  reply: string;
  criteria: {
    carrosserie: string | null;
    motorisation: string | null;
    transmission: string | null;
    marque: string | null;
    modele: string | null;
    budgetMin: number | null;
    budgetMax: number | null;
    ville: string | null;
    anneeMin: number | null;
    anneeMax: number | null;
    kmMax: number | null;
    inventoryType: "new" | "used" | null;
  };
  search: boolean;
  quickReplies: string[];
}

const SYSTEM_PROMPT = `Tu es Thiqti, conseiller automobile conversationnel pour le Maroc. Français + darija (arabizi).

TON RÔLE : tu es un CONSEILLER, pas un simple moteur de recherche. Tu dialogues avec l'utilisateur en posant des questions UNE À LA FOIS pour cerner son besoin (usage, budget, carburant, marque, neuf/occasion, boîte, année, ville, km) AVANT de proposer des résultats.

RÈGLES :
1. À CHAQUE message utilisateur, fais TROIS choses :
   a. Accuse réception de l'info comprise (ex: « Compris : SUV, budget 250 000 DH. »).
   b. Si l'utilisateur pose une question d'avis (ex: « essence ou mazot ? », « quelle marque ? », « meilleure voiture familiale ? »), donne un AVIS COURT personnalisé selon son profil déjà connu (mazot pour beaucoup de kilomètres/autoroute, essence pour usage urbain, etc.).
   c. Pose la question suivante la plus pertinente pour compléter le profil (une seule question).
2. NE PASSE JAMAIS search=true au premier message de l'utilisateur, même s'il donne tout d'un coup : tu accuses réception, tu résumes son profil et tu proposes « Voir les résultats » comme suggestion.
3. search=true UNIQUEMENT si l'utilisateur le demande EXPRESSÉMENT : « voir les résultats », « montre-moi », « affiche », « je veux voir », « c'est bon », « ok valider », « donne-moi les résultats », « voir plus », « بغيت نشوف », « وريني النتائج », « عطيني », « خلاص ». Dans ce cas, résume aussi son profil complet dans reply.
4. Extrais TOUT critère mentionné à chaque message dans criteria (même partiel). Critères non mentionnés = null.
5. budget en DH : « moins de X »=budgetMax, « entre X et Y »=budgetMin+budgetMax, nombre seul=budgetMax.
6. carrosserie: SUV, Berline, Citadine, Compacte, Crossover, Utilitaire. motorisation: Diesel, Essence, Hybride, Electrique. transmission: Automatique, Manuelle. inventoryType: new (neuf) | used (occasion).
7. « voir plus » = search=true avec les mêmes critères.
8. Si aucun critère connu et l'utilisateur demande les résultats : refuse gentiment (search=false) et demande d'abord le budget OU l'usage.
9. quickReplies = 2-4 réponses pertinentes pour la question posée.
10. LANGUE : réponds TOUJOURS dans la langue de l'utilisateur — darija (arabizi ou arabe) si l'utilisateur écrit en darija/arabe, français s'il écrit en français, anglais s'il écrit en anglais. Même si l'historique est en français, bascule dès qu'il écrit en darija (et vice-versa). Le JSON criteria reste en français (SUV, Diesel...).
11. À CHAQUE réponse (sauf si search=true) : termine en proposant les DEUX options — « Voir les résultats » (dès qu'au moins un critère est connu) et continuer à donner une autre info. En darija : « بغيتي تشوف النتائج ولا تزيد معلومة أخرى ؟ ». quickReplies doit inclure « Voir les résultats » dès qu'un critère est connu, avec les réponses possibles à la question posée.
12. Ne répète jamais le message de bienvenue : continue le dialogue en cours.

Dictionnaire Arabizi → Français (criteria doivent TOUJOURS etre en francais) :
- Carburant: mazot/mazout/mazutt/mazwet=Diesel, kaz/kazw/kazwal/benzin/banzyne=Essence, hjin/hybride=Hybride, kahraba/kahrba=Electrique
- Carrosserie: rab3/rba3/rab3a=SUV, karosa/kaross=Berline, madina= Citadine, monospace/monospas=Monospace, crossover/Crossova=Crossover, utilitaire/8ari9a=Utilitaire/Pick-up
- Transmission: matik/otomatic/atomatic/atik=Automatique, manyal/manuelle=Manuelle
- Usage: jmi3a/jmi3ia/jmi3a/jmi3ya/fammil/fammile/fammille/familial/familiale/ea2ilia/la_fammillia/famillia/3a2ila/3a2elia/3a2ila= familiale, ryadi/ryadia/riyadi/sport= sportif, darb/darbi/darbia/urbain= urbain/quotidien, mixte/mkhalt= mixte
- Budget: rkhiss/rkhis/7qis= pas cher, ghalya/galya/ghali= cher
- Actions: bghit/bgha/bghaw= je veux, nchri/nchri= acheter, tomobil/tomobilt/tomobil= voiture, khasni/khassni= j'ai besoin, chouf/choufi= regarde/vois, nchof/nchouf= je vois
- Resultats: nata2ij/nata2ej/natai2ij= resultats, daba= maintenant
- Villes: casa/kaza/casa-blanka/kazablanka= Casablanca, rabat= Rabat, marrakch/marrakesh= Marrakech, tanger= Tanger, ficha= Fes, agadir= Agadir, m7amadawi/m7ammadi= Mohammedia, Kenitra= Kenitra, oujda= Oujda
- Couleurs: 7mar= rouge, 7kam/7okm= noir, 9end7/9adi7= blanc, 9ar9i/9arqi= bleu, 5daw/5der= vert

IMPORTANT: Tu dois comprendre TOUTES les formes d'ARABIZI (darija ecrite en alphabet latin, avec ou sans chiffres). Le message utilisateur est PRE-TRAITE : les termes Arabizi sont deja convertis en francais. Quand tu vois "familiale", c'est que l'utilisateur a ecrit ea2ilia/fammil/fammille/fammilial/etc. Quand tu vois "diesel", c'est mazot/mazout. Quand tu vois "resultats", c'est nata2ij/nata2ej. Quand tu vois "voiture", c'est tomobil. Quand tu vois "je veux", c'est bghit.
REGLE ABSOLUE : NE DIS JAMAIS "je n'ai pas compris" ou "je ne comprends pas". Si tu recois un message que tu ne reconnais pas, consideres que c'est une information supplementaire et demandes une precision polie. Par exemple : "D'accord, et pour la carrosserie tu prefers quoi ?" ou "Bien noté, et c'est pour quelle ville ?".

Réponds TOUJOURS en JSON UNIQUEMENT, sans AUCUN texte avant ou après :
{"reply":"texte de reponse en langage naturel, JAMAIS de JSON ni de backticks dans ce champ","criteria":{...},"search":false,"quickReplies":["opt1","opt2"]}
IMPORTANT : le champ "reply" doit contenir UNIQUEMENT du texte lisible par un humain. JAMAIS de JSON, de backticks, de markdown ou d'asterisques dans reply. Juste un message conversationnel simple.`;

// ---------------------------------------------------------------------------
// Normalisation Arabizi → Francais avant envoi à Gemini
// Remplace les termes Arabizi courants par leur equivalent francais
// pour que Gemini comprenne toujours le message.
// ---------------------------------------------------------------------------
function normalizeArabiziTerms(text: string): string {
  let result = text.toLowerCase();
  const usageMap: [RegExp, string][] = [
    // Usage / intent - couvrir TOUTES les variantes Arabizi
    [/\b(?:ea2ilia|ea2elia|ea2ila|ea2liya|3a2ilia|3a2elia|3a2ila|fammilial|fammil|fammille|fammilia|famillia|la fammille|la fammillia|pour la fammille|pour la fammillia|jmi3a|jmi3ia|jmi3ya|3a2ila|famila|familial?i?e?|a2ila|a2lia)\b/gi, "familiale"],
    [/\b(?:sari3|sari3a|ryadi|ryadia|riyadi|riydia)\b/g, "sportif"],
    [/\b(?:darb|darbi|darbia|madina|mdina|mdina)\b/g, "urbain"],
    [/\b(?:mixte|mkhalt|makhlt)\b/g, "mixte"],
    // Carburant
    [/\b(?:mazot|mazout|mazwot|mazutt|mazwet|mazwot|mazout)\b/g, "diesel"],
    [/\b(?:kaz|kazw|kazwal|kazwa|banzin|benzin|bnzin|kazwal)\b/g, "essence"],
    [/\b(?:hjin|hybride|hjina|hjrd)\b/g, "hybride"],
    [/\b(?:kahraba|kahrba|kahrba)\b/g, "electrique"],
    // Carrosserie
    [/\b(?:rab3|rba3|rab3a|rba3a)\b/g, "suv"],
    [/\b(?:karosa|kaross|karrossa)\b/g, "berline"],
    // Transmission
    [/\b(?:matik|otomatic|atomatic|atik|automatique)\b/g, "automatique"],
    [/\b(?:manyal|manuelle|manuel)\b/g, "manuelle"],
    // Villes
    [/\b(?:casa|kaza|casa-blanka|kazablanka)\b/g, "casablanca"],
    [/\b(?:marrakch|marrakesh|marrakesh)\b/g, "marrakech"],
    [/\b(?:ficha|fes)\b/g, "fes"],
    [/\b(?:tanger|tanja|tanja)\b/g, "tanger"],
    [/\b(?:agadir|agadir)\b/g, "agadir"],
    [/\b(?:oujda|wejda)\b/g, "oujda"],
    [/\b(?:kenitra|ksar|ksar elkbeer)\b/g, "kenitra"],
    // Intent d'achat
    [/\b(?:bghit|bgha|bghaw|bghiti|bghina)\b/g, "je veux"],
    [/\b(?:nchri|nechri|nchri)\b/g, "acheter"],
    [/\b(?:tomobil|tomobila|tomobilt|toumobil|tomobila)\b/g, "voiture"],
    [/\b(?:khasni|khassni|khasni)\b/g, "j'ai besoin"],
    // Resultats / action
    [/\b(?:nchof|nchouf|chouf|choufni|werini|wreni|werini)\b/g, "voir"],
    [/\b(?:nata2ij|nata2ej|natai2ij|nata2ija)\b/g, "resultats"],
    [/\b(?:daba|hna|hnowa)\b/g, "maintenant"],
    [/\b(?:bhal bhal|bhal|bhalh|goul lia|goul lya|aachno|hna aachno|chouf lina)\b/g, "peu importe"],
    // Qualite
    [/\b(?:rkhiss|rkhis|7qis|rkhss)\b/g, "pas cher"],
    [/\b(?:ghalya|galya|ghali|ghalya)\b/g, "cher"],
  ];
  for (const [pattern, replacement] of usageMap) {
    result = result.replace(pattern, replacement);
  }
  return result;
}

export async function POST(req: NextRequest) {
  try {
    const body: ChatRequest = await req.json();
    const { message } = body;
    const history: ChatMsg[] = Array.isArray(body.history) ? body.history : [];

    if (!message?.trim()) {
      return NextResponse.json({ error: "Message vide" }, { status: 400 });
    }

    // Normaliser l'Arabizi avant d'envoyer à Gemini pour qu'il comprenne toujours
    const normalizedMessage = normalizeArabiziTerms(message);

    const model = genAI.getGenerativeModel({ model: "gemini-3.6-flash" });

    const chatHistory = history.map((m) => ({
      role: m.role === "bot" ? "model" : "user",
      parts: [{ text: m.role === "user" ? normalizeArabiziTerms(m.text) : m.text }],
    }));

    const chat = model.startChat({
      history: [
        { role: "user", parts: [{ text: "Bonjour" }] },
        { role: "model", parts: [{ text: JSON.stringify({ reply: "Salut 👋 Je suis Thiqti, votre conseiller auto pour le Maroc. Je vais vous poser quelques questions (usage, budget, carburant, marque...) pour trouver la voiture idéale. Alors, quelle est votre idée de voiture ?", criteria: { carrosserie: null, motorisation: null, transmission: null, marque: null, modele: null, budgetMin: null, budgetMax: null, ville: null, anneeMin: null, anneeMax: null, kmMax: null, inventoryType: null }, search: false, quickReplies: ["SUV", "Moins de 150 000 DH", "Toyota", "Diesel"] }) }],
      },
      ...chatHistory,
    ],
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 1024,
      },
      systemInstruction: {
        role: "system",
        parts: [{ text: SYSTEM_PROMPT }],
      },
    });

    const result = await chat.sendMessage(normalizedMessage);
    const response = result.response;
    let text = response.text().trim();

    // Nettoyer les blocs markdown que Gemini peut ajouter (```json ... ```)
    text = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
    // Aussi retirer les prefixes type "**:" ou "**réponse :**"
    text = text.replace(/^\*{1,2}[^:{]*:\s*\*{0,2}\s*/i, "").trim();

    let parsed: GeminiResponse;
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("No JSON found");
      parsed = JSON.parse(jsonMatch[0]);
      // Si le JSON a ete tronque par la limite de tokens, reply peut contenir
      // un fragment JSON : on le detecte et on extrait le texte lisible.
      if (typeof parsed.reply === "string" && /^\{"reply"/.test(parsed.reply.trimStart())) {
        throw new Error("Nested truncated JSON in reply");
      }
    } catch {
      // Extraire le champ "reply" meme si le JSON est incomplet (troncature)
      const m = text.match(/"reply"\s*:\s*"((?:[^"\\]|\\.)*)/);
      let cleaned = m
        ? m[1].replace(/\\"/g, '"').replace(/\\n/g, "\n")
        : text;
      cleaned = cleaned.replace(/^\{?"reply"\s*:\s*"/, "").trim();
      parsed = {
        reply: cleaned || "Je n'ai pas bien compris. Pouvez-vous reformuler ?",
        criteria: {
          carrosserie: null, motorisation: null, transmission: null,
          marque: null, modele: null, budgetMin: null, budgetMax: null,
          ville: null, anneeMin: null, anneeMax: null, kmMax: null, inventoryType: null,
        },
        search: false,
        quickReplies: ["SUV", "Moins de 150 000 DH", "Toyota", "Diesel"],
      };
    }

    // Gemini 3.6 peut parfois renvoyer un JSON-stringify dans reply
    // ex: {"reply":"{\"reply\":\"...\",\"criteria\":{...}}",...}
    // On decapsule si c'est le cas.
    if (typeof parsed.reply === "string" && parsed.reply.trimStart().startsWith("{")) {
      try {
        const inner = JSON.parse(parsed.reply);
        if (inner && typeof inner.reply === "string") {
          parsed = inner;
        }
      } catch {
        // Fallback regex: extraire le texte du champ "reply" imbrique
        const innerMatch = parsed.reply.match(/"reply"\s*:\s*"((?:[^"\\]|\\.)*)"/);
        if (innerMatch) {
          parsed.reply = innerMatch[1].replace(/\\"/g, '"').replace(/\\n/g, "\n");
        }
      }
    }

    // Garde-fous du dialogue conversationnel :
    // 1) Jamais de recherche au premier message de l'utilisateur : on
    //    dialogue d'abord pour cerner le besoin.
    // 2) Si search=true mais qu'aucun critère n'a été compris et que le
    //    message ne demande pas de résultats, on annule la recherche.
    // 3) Si l'utilisateur demande explicitement les résultats et qu'on a
    //    déjà des critères, on force search=true même si Gemini a répondu
    //    "je n'ai pas compris".
    const isFirstUserTurn = history.filter((m) => m.role === "user").length === 0;
    const asksResults = /voir|montre|affiche|resultat|résultat|cherche|donne|propose|nchof|nchouf|nata2ij|nata2ej|chouf|choufni|werini|wreni|نشوف|بغيت نشوف|وريني|اريني|عطيني|خلاص|daba|hna|c'?est bon|ca me va|valider|voir les/i.test(message);
    const hasAnyCriteria = (c: GeminiResponse["criteria"]): boolean =>
      Object.values(c).some((v) => v !== null && v !== undefined);

    if (isFirstUserTurn) {
      parsed.search = false;
    } else if (asksResults) {
      parsed.search = true;
      parsed.reply = "Recherche en cours... 🔍 Je te montre les résultats !";
      parsed.quickReplies = [];
    } else if (parsed.search && !hasAnyCriteria(parsed.criteria)) {
      parsed.search = false;
    }

    return NextResponse.json(parsed);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Erreur inconnue";
    console.error("[Chat API]", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
