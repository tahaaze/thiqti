import { SearchCriteria } from "./nlp";

export interface MatchExplanation {
  label: string;
  value: string;
  impact: "positive" | "negative" | "neutral";
  reason: string;
}

export interface ScoredCar {
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
  score: number;
  source: string;
  url: string;
  matchScore: number;
  matchPercent: number;
  explanations: MatchExplanation[];
  meetsBudget: boolean;
  meetsBody: boolean;
  meetsFuel: boolean;
}

interface NormalizedVehicle {
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
  url: string;
  score: number;
}

const WEIGHTS_DEFAULT = {
  price: 0.30,
  year: 0.20,
  km: 0.20,
  fuelMatch: 0.15,
  bodyMatch: 0.15,
};

const WEIGHTS_ECONOMIQUE = {
  price: 0.50,
  year: 0.10,
  km: 0.15,
  fuelMatch: 0.10,
  bodyMatch: 0.15,
};

const WEIGHTS_FAMILIAL = {
  price: 0.20,
  year: 0.15,
  km: 0.25,
  fuelMatch: 0.15,
  bodyMatch: 0.25,
};

const WEIGHTS_CONFORT = {
  price: 0.15,
  year: 0.30,
  km: 0.20,
  fuelMatch: 0.15,
  bodyMatch: 0.20,
};

const WEIGHTS_SPORTIF = {
  price: 0.15,
  year: 0.25,
  km: 0.15,
  fuelMatch: 0.25,
  bodyMatch: 0.20,
};

function getWeights(criteria: SearchCriteria) {
  if (criteria.intent.includes("economique")) return WEIGHTS_ECONOMIQUE;
  if (criteria.intent.includes("familial")) return WEIGHTS_FAMILIAL;
  if (criteria.intent.includes("confort")) return WEIGHTS_CONFORT;
  if (criteria.intent.includes("sportif")) return WEIGHTS_SPORTIF;
  return WEIGHTS_DEFAULT;
}

function normalize(value: number, min: number, max: number): number {
  if (max === min) return 0.5;
  return (value - min) / (max - min);
}

function topsisScore(
  vector: number[],
  allVectors: number[][],
  weights: number[],
  isBeneficial: boolean[]
): number {
  const dims = vector.length;
  const mins: number[] = [];
  const maxs: number[] = [];

  for (let d = 0; d < dims; d++) {
    const col = allVectors.map((v) => v[d]);
    mins.push(Math.min(...col));
    maxs.push(Math.max(...col));
  }

  const normalized = vector.map((v, i) => {
    const norm = normalize(v, mins[i], maxs[i]);
    return norm * weights[i];
  });

  let posDist = 0;
  let negDist = 0;

  normalized.forEach((n, i) => {
    const idealBest = isBeneficial[i] ? 1 : 0;
    const idealWorst = isBeneficial[i] ? 0 : 1;
    posDist += Math.pow(n - idealBest * weights[i], 2);
    negDist += Math.pow(n - idealWorst * weights[i], 2);
  });

  const total = Math.sqrt(posDist) + Math.sqrt(negDist);
  if (total === 0) return 0.5;
  const result = Math.sqrt(negDist) / total;
  return isNaN(result) ? 0.5 : result;
}

function buildExplanations(
  car: NormalizedVehicle,
  criteria: SearchCriteria,
  matchScore: number
): MatchExplanation[] {
  const explanations: MatchExplanation[] = [];

  if (criteria.carrosserie) {
    const carBody = car.fuel.toLowerCase();
    const match = carBody === criteria.carrosserie.toLowerCase() ||
      (criteria.carrosserie === "SUV" && (car.fuel.includes("SUV") || car.title.toLowerCase().includes("suv")));
    explanations.push({
      label: "Carrosserie",
      value: criteria.carrosserie,
      impact: match ? "positive" : "negative",
      reason: match ? `Correspond à votre demande de ${criteria.carrosserie}` : `Ne correspond pas exactement à ${criteria.carrosserie}`,
    });
  }

  if (criteria.motorisation) {
    const match = car.fuel === criteria.motorisation;
    explanations.push({
      label: "Motorisation",
      value: car.fuel,
      impact: match ? "positive" : "negative",
      reason: match ? `Type de carburant correspond : ${criteria.motorisation}` : `Carburant différent de ${criteria.motorisation}`,
    });
  }

  if (criteria.budgetMax || criteria.budgetMin) {
    const min = criteria.budgetMin || 0;
    const max = criteria.budgetMax || Infinity;
    const inBudget = car.price >= min && car.price <= max;
    const tolerance = criteria.budgetTolerance || 0.15;
    const toleranceMax = max * (1 + tolerance);
    const inTolerance = car.price >= min && car.price <= toleranceMax;

    explanations.push({
      label: "Budget",
      value: car.price.toLocaleString("fr-FR") + " DH",
      impact: inBudget ? "positive" : inTolerance ? "neutral" : "negative",
      reason: inBudget
        ? "Dans votre budget"
        : inTolerance
        ? `Proche du budget (écart: ${Math.abs(car.price - max).toLocaleString("fr-FR")} DH)`
        : `Hors budget`,
    });
  }

  if (criteria.anneeMin) {
    const match = car.year >= criteria.anneeMin;
    explanations.push({
      label: "Année",
      value: String(car.year),
      impact: match ? "positive" : "negative",
      reason: match ? `Année ${car.year} >= ${criteria.anneeMin}` : `Année ${car.year} < ${criteria.anneeMin}`,
    });
  }

  if (criteria.kmMax) {
    const match = car.km <= criteria.kmMax;
    explanations.push({
      label: "Kilométrage",
      value: car.km.toLocaleString("fr-FR") + " km",
      impact: match ? "positive" : car.km <= criteria.kmMax * 1.2 ? "neutral" : "negative",
      reason: match
        ? `Kilométrage dans la limite (${car.km.toLocaleString("fr-FR")} km)`
        : `Kilométrage élevé (${car.km.toLocaleString("fr-FR")} km)`,
    });
  }

  if (criteria.marque) {
    const match = car.make.toLowerCase() === criteria.marque.toLowerCase();
    explanations.push({
      label: "Marque",
      value: car.make,
      impact: match ? "positive" : "negative",
      reason: match ? `Marque demandée : ${criteria.marque}` : `Marque différente de ${criteria.marque}`,
    });
  }

  if (criteria.ville) {
    const match = car.city.toLowerCase() === criteria.ville.toLowerCase();
    explanations.push({
      label: "Localisation",
      value: car.city,
      impact: match ? "positive" : "neutral",
      reason: match ? `Ville correspondante : ${criteria.ville}` : `Ville différente de ${criteria.ville}`,
    });
  }

  if (car.km < 20000) {
    explanations.push({
      label: "Usure",
      value: "Faible",
      impact: "positive",
      reason: "Véhicule très peu utilisé",
    });
  } else if (car.km > 100000) {
    explanations.push({
      label: "Usure",
      value: "Élevée",
      impact: "negative",
      reason: "Kilométrage élevé, prudence recommandée",
    });
  }

  const age = 2026 - car.year;
  if (age <= 1) {
    explanations.push({
      label: "Fraîcheur",
      value: "Récent",
      impact: "positive",
      reason: "Véhicule de l'année, garantie possible",
    });
  }

  return explanations;
}

export function rankVehicles<T extends NormalizedVehicle>(
  vehicles: T[],
  criteria: SearchCriteria
): ScoredCar[] {
  const weights = getWeights(criteria);
  const w = [weights.price, weights.year, weights.km, weights.fuelMatch, weights.bodyMatch];
  const beneficial = [true, true, true, true, true];
  const allPrices = vehicles.map((v) => v.price);
  const allKms = vehicles.map((v) => v.km);
  const allYears = vehicles.map((v) => v.year);

  const vectors = vehicles.map((car) => {
    const priceScore = 1 - normalize(car.price, Math.min(...allPrices), Math.max(...allPrices));
    const yearScore = normalize(car.year, Math.min(...allYears), Math.max(...allYears));
    const kmScore = 1 - normalize(car.km, Math.min(...allKms), Math.max(...allKms));

    let fuelMatchScore = 1;
    if (criteria.motorisation) {
      fuelMatchScore = car.fuel === criteria.motorisation ? 1 : 0;
    }

    let bodyMatchScore = 1;
    if (criteria.carrosserie) {
      bodyMatchScore = car.title.toLowerCase().includes(criteria.carrosserie.toLowerCase()) ? 1 : 0.5;
    }

    const vector = [priceScore, yearScore, kmScore, fuelMatchScore, bodyMatchScore];

    return { car, vector };
  });

  const allVectors = vectors.map((v) => v.vector);

  const scored = vectors.map(({ car, vector }) => {
    const matchScore = topsisScore(vector, allVectors, w, beneficial);

    let meetsBudget = true;
    if (criteria.budgetMax || criteria.budgetMin) {
      const min = criteria.budgetMin || 0;
      const max = criteria.budgetMax || Infinity;
      const tolerance = criteria.budgetTolerance || 0.15;
      meetsBudget = car.price >= min * (1 - tolerance) && car.price <= max * (1 + tolerance);
    }

    let meetsBody = true;
    if (criteria.carrosserie) {
      const bodyType = (car as any).bodyType as string | undefined;
      meetsBody = bodyType?.toLowerCase().includes(criteria.carrosserie.toLowerCase()) ||
        car.title.toLowerCase().includes(criteria.carrosserie.toLowerCase());
    }

    let meetsFuel = true;
    if (criteria.motorisation) {
      meetsFuel = car.fuel === criteria.motorisation;
    }

    const explanations = buildExplanations(car, criteria, matchScore);

    const baseScore = (car as any).score || 80;
    const finalScore = Math.round(baseScore * 0.4 + matchScore * 100 * 0.6);

    return {
      ...car,
      matchScore,
      matchPercent: Math.round(matchScore * 100),
      explanations,
      meetsBudget,
      meetsBody,
      meetsFuel,
      score: finalScore,
    };
  });

  scored.sort((a, b) => b.matchScore - a.matchScore);

  const mustMatch = scored.filter(
    (c) => c.meetsBody && c.meetsFuel
  );

  if (mustMatch.length > 0) return mustMatch;

  const withBudget = scored.filter(
    (c) => c.meetsBudget
  );

  return withBudget.length > 0 ? withBudget : scored.slice(0, 10);
}
