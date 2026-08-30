import type { ScrapedReview, LLMReputationResult } from "./types";

const POSITIVE_WORDS = new Set([
  "fiable", "satisfait", "excellent", "super", "parfait", "recommande", "économique",
  "spacieux", "confortable", "puissant", "moderne", "beau", "belle", "robuste",
  "durable", "performant", "agréable", "pratique", "sécurisé", "silencieux",
  "stable", "polyvalent", "rapide", "précis", "well", "good", "great", "excellent",
  "reliable", "comfortable", "spacious", "powerful", "economical", "solid",
  "fiable", "magnifique", "impeccable", "nickel", "top", "geo", "zwina",
  "mzyan", "labas", "dbayb", "convient", "apprécié", "aimé", "plaisir",
]);

const NEGATIVE_WORDS = new Set([
  "problème", "panne", "défaillant", "cher", "bruyant", "consommation", "fiabilité",
  "déçu", "mauvais", "nul", "cassé", "rouillé", "lent", "faible", "insécurisé",
  "inconfortable", "étroit", "underpowered", "unreliable", "expensive", "noisy",
  "breakdown", "defect", "rust", "slow", "weak", "uncomfortable", "crashed",
  "faut", "cassé", "ennui", "galère", "ennuyeux", "décevant", "médiocre",
  "pauvre", "dur", "difficile", "usure", "périmé", "daté", "vétuste",
]);

const CATEGORY_KEYWORDS = {
  fiabilite: ["fiable", "fiabilité", "panne", "durée", "durable", "reliable", "reliability", "breakdown"],
  confort: ["confort", "comfortable", "spacieux", "espace", "bruit", "silence", "sièges", "cabin"],
  cout: ["prix", "coût", "consommation", "entretien", "carburant", "price", "cost", "fuel", "maintenance"],
  securite: ["sécurité", "safety", "airbag", "frein", "ncap", "étoiles", "crash", "protection"],
  performance: ["puissance", "vitesse", "accélération", "moteur", "power", "speed", "engine", "horsepower"],
};

function countSentiment(reviews: ScrapedReview[]): { positive: number; negative: number; neutral: number } {
  let positive = 0;
  let negative = 0;
  let neutral = 0;

  for (const review of reviews) {
    const text = review.text.toLowerCase();
    let posCount = 0;
    let negCount = 0;

    for (const w of POSITIVE_WORDS) {
      if (text.includes(w)) posCount++;
    }
    for (const w of NEGATIVE_WORDS) {
      if (text.includes(w)) negCount++;
    }

    if (review.rating != null) {
      if (review.rating >= 3.5) posCount += 2;
      else if (review.rating <= 2) negCount += 2;
    }

    if (posCount > negCount) positive++;
    else if (negCount > posCount) negative++;
    else neutral++;
  }

  const total = reviews.length || 1;
  return {
    positive: Math.round((positive / total) * 100),
    negative: Math.round((negative / total) * 100),
    neutral: Math.round((neutral / total) * 100),
  };
}

function computeCategoryScores(reviews: ScrapedReview[]): LLMReputationResult["categories"] {
  const scores: Record<string, { total: number; count: number }> = {};
  for (const cat of Object.keys(CATEGORY_KEYWORDS)) {
    scores[cat] = { total: 0, count: 0 };
  }

  for (const review of reviews) {
    const text = review.text.toLowerCase();
    for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
      const match = keywords.some((k) => text.includes(k));
      if (match) {
        const baseScore = review.rating != null ? review.rating * 20 : 65;
        let adjusted = baseScore;
        const textWords = text.split(" ");
        const hasPositive = textWords.some((w) => POSITIVE_WORDS.has(w));
        const hasNegative = textWords.some((w) => NEGATIVE_WORDS.has(w));
        if (hasPositive) adjusted += 10;
        if (hasNegative) adjusted -= 10;
        scores[cat].total += Math.max(0, Math.min(100, adjusted));
        scores[cat].count++;
      }
    }
  }

  const label = (s: number): string =>
    s >= 70 ? "Élevée" : s >= 45 ? "Moyenne" : "Faible";

  const resolve = (cat: string): { score: number; label: string } => {
    const avg = scores[cat].count > 0
      ? Math.round(scores[cat].total / scores[cat].count)
      : 55;
    return { score: Math.max(0, Math.min(100, avg)), label: label(avg) };
  };

  return {
    fiabilite: resolve("fiabilite"),
    confort: resolve("confort"),
    cout: resolve("cout"),
    securite: resolve("securite"),
    performance: resolve("performance"),
  };
}

function extractTopProsCons(reviews: ScrapedReview[]): { pros: string[]; cons: string[] } {
  const wordCounts = new Map<string, { pos: number; neg: number }>();

  for (const review of reviews) {
    const words = review.text.toLowerCase().split(/\s+/);
    for (const w of words) {
      const clean = w.replace(/[^a-zàâäéèêëïîôùûüÿçœæ]/gi, "");
      if (clean.length < 3) continue;
      if (!wordCounts.has(clean)) wordCounts.set(clean, { pos: 0, neg: 0 });
      const entry = wordCounts.get(clean)!;
      if (POSITIVE_WORDS.has(clean)) entry.pos++;
      if (NEGATIVE_WORDS.has(clean)) entry.neg++;
    }
  }

  const sorted = [...wordCounts.entries()]
    .filter(([, v]) => v.pos > 0 || v.neg > 0)
    .sort((a, b) => (b[1].pos + b[1].neg) - (a[1].pos + a[1].neg));

  const pros = sorted.filter(([, v]) => v.pos > v.neg).slice(0, 5).map(([w]) => w);
  const cons = sorted.filter(([, v]) => v.neg > v.pos).slice(0, 5).map(([w]) => w);

  return { pros, cons };
}

/**
 * Analyse locale des avis — fonctionne sans API externe.
 * Utilise du NLP par règles (dictionnaires de sentiment + scoring par catégorie).
 */
export function analyzeReviewsLocal(
  make: string,
  model: string,
  reviews: ScrapedReview[]
): LLMReputationResult {
  const sentiment = countSentiment(reviews);
  const categories = computeCategoryScores(reviews);
  const { pros, cons } = extractTopProsCons(reviews);

  // Score global : moyenne pondérée
  const catScores = Object.values(categories).map((c) => c.score);
  const avgCat = catScores.reduce((a, b) => a + b, 0) / catScores.length;
  const sentimentBoost = (sentiment.positive - sentiment.negative) * 0.2;
  const volumeBoost = Math.min(reviews.length * 2, 10);
  const score = Math.max(0, Math.min(100, Math.round(avgCat + sentimentBoost + volumeBoost)));

  const reliability: LLMReputationResult["reliability"] =
    score >= 70 ? "elevee" : score >= 45 ? "moyenne" : "faible";

  const summary = `${make} ${model} — Score ${score}/100. ` +
    `${reviews.length} avis analysés. ` +
    `${sentiment.positive}% positifs, ${sentiment.negative}% négatifs. ` +
    (pros.length > 0 ? `Points forts : ${pros.slice(0, 3).join(", ")}. ` : "") +
    (cons.length > 0 ? `Points faibles : ${cons.slice(0, 3).join(", ")}. ` : "");

  return {
    score,
    reliability,
    sentiment,
    categories,
    topPros: pros,
    topCons: cons,
    summary,
    reviewCount: reviews.length,
    sources: [...new Set(reviews.map((r) => r.source))],
  };
}

/**
 * Analyse LLM via Google Gemini — nécessite GEMINI_API_KEY dans .env.
 * Fallback automatique vers l'analyse locale si pas de clé.
 */
export async function analyzeReviewsLLM(
  make: string,
  model: string,
  reviews: ScrapedReview[]
): Promise<LLMReputationResult> {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY;
  if (!apiKey || reviews.length === 0) {
    return analyzeReviewsLocal(make, model, reviews);
  }

  try {
    const { GoogleGenerativeAI } = await import("@google/generative-ai");
    const genAI = new GoogleGenerativeAI(apiKey);
    const llm = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const reviewsText = reviews
      .slice(0, 20)
      .map((r, i) => `[${i + 1}] (${r.source}, ${r.rating ?? "?"}/5) ${r.text}`)
      .join("\n");

    const prompt = `Tu es un expert automobiles au Maroc. Analyse ces avis pour la ${make} ${model}.

AVIS:
${reviewsText}

Réponds UNIQUEMENT avec un JSON valide (pas de markdown, pas de commentaire):
{
  "score": <nombre 0-100>,
  "reliability": "<elevee|moyenne|faible>",
  "sentiment": { "positive": <%>, "negative": <%>, "neutral": <> },
  "categories": {
    "fiabilite": { "score": <0-100>, "label": "<Élevée|Moyenne|Faible>" },
    "confort": { "score": <0-100>, "label": "<Élevée|Moyenne|Faible>" },
    "cout": { "score": <0-100>, "label": "<Élevée|Moyenne|Faible>" },
    "securite": { "score": <0-100>, "label": "<Élevée|Moyenne|Faible>" },
    "performance": { "score": <0-100>, "label": "<Élevée|Moyenne|Faible>" }
  },
  "topPros": ["<avantage1>", "<avantage2>", "<avantage3>"],
  "topCons": ["<inconvénient1>", "<inconvénient2>", "<inconvénient3>"],
  "summary": "<résumé 2-3 phrases en français>"
}`;

    const result = await llm.generateContent(prompt);
    const response = result.response.text();
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return analyzeReviewsLocal(make, model, reviews);

    const parsed = JSON.parse(jsonMatch[0]);
    return {
      score: Math.max(0, Math.min(100, Number(parsed.score) || 55)),
      reliability: ["elevee", "moyenne", "faible"].includes(parsed.reliability)
        ? parsed.reliability : "moyenne",
      sentiment: {
        positive: Number(parsed.sentiment?.positive) || 50,
        negative: Number(parsed.sentiment?.negative) || 25,
        neutral: Number(parsed.sentiment?.neutral) || 25,
      },
      categories: parsed.categories || computeCategoryScores(reviews),
      topPros: Array.isArray(parsed.topPros) ? parsed.topPros.slice(0, 5) : [],
      topCons: Array.isArray(parsed.topCons) ? parsed.topCons.slice(0, 5) : [],
      summary: String(parsed.summary || ""),
      reviewCount: reviews.length,
      sources: [...new Set(reviews.map((r) => r.source))],
    };
  } catch {
    return analyzeReviewsLocal(make, model, reviews);
  }
}
