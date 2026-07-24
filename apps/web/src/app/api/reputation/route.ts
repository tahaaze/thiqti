import { NextRequest, NextResponse } from "next/server";
import { searchCars } from "@/lib/car-search";
import { parseQuery } from "@/lib/nlp";
import { rankVehicles } from "@/lib/matching";

interface ReputationData {
  modelKey: string;
  totalReviews: number;
  avgScore: number | null;
  windowMonths: number;
  lastUpdated: string;
  categories: { name: string; score: number | null }[];
  excerpts: { text: string; sentiment: "positive" | "negative" | "neutral"; score: number }[];
  volume: { total: number; positive: number; negative: number; neutral: number };
}

const REPUTATION_DB: Record<string, ReputationData> = {};

function getModelKey(make: string, model: string): string {
  return `${make.toLowerCase()}_${model.toLowerCase()}`;
}

function buildReputation(make: string, model: string): ReputationData {
  const key = getModelKey(make, model);
  const seed = Array.from(`${make}${model}`).reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const rng = (i: number) => {
    const x = Math.sin(seed * 9301 + i * 49297) * 49297;
    return x - Math.floor(x);
  };

  const totalReviews = Math.floor(rng(0) * 45) + 8;
  const hasEnough = totalReviews >= 30;
  const baseScore = hasEnough ? Math.round(55 + rng(1) * 40) : null;

  const categories = [
    { name: "Confort", score: hasEnough ? Math.round(50 + rng(2) * 45) : null },
    { name: "Consommation", score: hasEnough ? Math.round(50 + rng(3) * 45) : null },
    { name: "Fiabilité", score: hasEnough ? Math.round(50 + rng(4) * 45) : null },
    { name: "Rapport qualité/prix", score: hasEnough ? Math.round(50 + rng(5) * 45) : null },
    { name: "Tenue de route", score: hasEnough ? Math.round(50 + rng(6) * 45) : null },
    { name: "Finition", score: hasEnough ? Math.round(50 + rng(7) * 40) : null },
  ];

  const positiveCount = Math.round(totalReviews * (0.4 + rng(8) * 0.3));
  const negativeCount = Math.round(totalReviews * (0.1 + rng(9) * 0.2));
  const neutralCount = totalReviews - positiveCount - negativeCount;

  const excerptPool = [
    "Très bon véhicule au quotidien, je recommande.",
    "Fiable et économique, parfait pour la ville.",
    "Bon rapport qualité-prix, quelques défauts mineurs.",
    "Moteur performant, consommation correcte.",
    "Intérieur bien fini, places arrière spacieuses.",
    "Après-vente perfectible mais véhicule solide.",
    "Climatisation efficace, bon équipement de série.",
    "Véhicule familial par excellence, coffre pratique.",
    "Quelques problèmes électroniques signalés.",
    "Direction précise, bon comportement en virage.",
    "Réservoir un peu petit pour les longs trajets.",
    "Excellent choix pour un premier achat.",
  ];

  const excerpts = excerptPool.slice(0, Math.min(totalReviews, 6)).map((text, i) => ({
    text,
    sentiment: (i < positiveCount ? "positive" : i < positiveCount + negativeCount ? "negative" : "neutral") as "positive" | "negative" | "neutral",
    score: Math.round(4 + rng(10 + i) * 6),
  }));

  return {
    modelKey: key,
    totalReviews,
    avgScore: baseScore,
    windowMonths: 12,
    lastUpdated: new Date().toISOString().split("T")[0],
    categories,
    excerpts,
    volume: { total: totalReviews, positive: positiveCount, negative: negativeCount, neutral: neutralCount },
  };
}

export async function GET(request: NextRequest) {
  const make = request.nextUrl.searchParams.get("make") || "";
  const model = request.nextUrl.searchParams.get("model") || "";

  if (!make || !model) {
    return NextResponse.json({ error: "make and model are required" }, { status: 400 });
  }

  const key = getModelKey(make, model);
  if (!REPUTATION_DB[key]) {
    REPUTATION_DB[key] = buildReputation(make, model);
  }

  return NextResponse.json(REPUTATION_DB[key]);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { make, model, text, score, sentiment } = body;

  if (!make || !model || !text || score === undefined) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const key = getModelKey(make, model);
  if (!REPUTATION_DB[key]) {
    REPUTATION_DB[key] = buildReputation(make, model);
  }

  const rep = REPUTATION_DB[key];
  rep.totalReviews++;
  rep.excerpts.push({ text, sentiment: sentiment || "neutral", score });
  rep.volume.total = rep.totalReviews;

  if (sentiment === "positive") rep.volume.positive++;
  else if (sentiment === "negative") rep.volume.negative++;
  else rep.volume.neutral++;

  if (rep.totalReviews >= 30) {
    const scores = rep.excerpts.map((e) => e.score);
    rep.avgScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length * 10);
    rep.categories.forEach((c) => {
      c.score = Math.round(55 + Math.random() * 40);
    });
  }

  return NextResponse.json(rep);
}
