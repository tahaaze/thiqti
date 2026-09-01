export interface ScrapedReview {
  source: string;
  author: string;
  rating: number | null;
  text: string;
  date: string;
  url: string;
  lang: "fr" | "ar" | "en";
}

export interface LLMCategory {
  score: number;
  label: string;
}

export interface LLMReputationResult {
  score: number;
  reliability: "elevee" | "moyenne" | "faible";
  sentiment: {
    positive: number;
    negative: number;
    neutral: number;
  };
  categories: {
    fiabilite: LLMCategory;
    confort: LLMCategory;
    cout: LLMCategory;
    securite: LLMCategory;
    performance: LLMCategory;
  };
  topPros: string[];
  topCons: string[];
  summary: string;
  summaryAr?: string;
  reviewCount: number;
  sources: string[];
}

export interface CachedReputation {
  make: string;
  model: string;
  result: LLMReputationResult;
  reviews: ScrapedReview[];
  computedAt: string;
  expiresAt: string;
}
