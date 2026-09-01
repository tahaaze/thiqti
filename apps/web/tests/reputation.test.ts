import { describe, it, expect } from "vitest";
import { analyzeReviewsLocal } from "@/lib/reputation/llmAnalysis";
import type { ScrapedReview } from "@/lib/reputation/types";

function makeReview(overrides: Partial<ScrapedReview> = {}): ScrapedReview {
  return {
    source: "test",
    author: "Test User",
    rating: null,
    text: "Voiture fiable et confortable, je recommande",
    date: "2026-01-01",
    url: "https://example.com",
    lang: "fr",
    ...overrides,
  };
}

describe("Reputation — analyzeReviewsLocal", () => {
  it("returns default score with no reviews", () => {
    const result = analyzeReviewsLocal("Dacia", "Duster", []);
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
    expect(result.reviewCount).toBe(0);
  });

  it("boosts score with positive reviews", () => {
    const reviews = [
      makeReview({ text: "Voiture fiable, excellente confort, je recommande fortement", rating: 5 }),
      makeReview({ text: "Très satisfaite, économique et spacieuse", rating: 4.5 }),
      makeReview({ text: "Super voiture, performante et bien entretenue", rating: 4 }),
    ];
    const result = analyzeReviewsLocal("Toyota", "RAV4", reviews);
    expect(result.score).toBeGreaterThan(55);
    expect(result.sentiment.positive).toBeGreaterThan(50);
    expect(result.topPros.length).toBeGreaterThan(0);
  });

  it("lowers score with negative reviews", () => {
    const reviews = [
      makeReview({ text: "Problème de moteur, panne récurrente, très déçu", rating: 1 }),
      makeReview({ text: "Mauvaise fiabilité, cassé après 2 ans", rating: 1.5 }),
      makeReview({ text: "Cher et bruyant, nul", rating: 2 }),
    ];
    const result = analyzeReviewsLocal("Renault", "Megane", reviews);
    expect(result.score).toBeLessThan(60);
    expect(result.sentiment.negative).toBeGreaterThan(50);
    expect(result.topCons.length).toBeGreaterThan(0);
  });

  it("computes categories", () => {
    const reviews = [
      makeReview({ text: "Fiable et durable, bonne sécurité avec airbags", rating: 4 }),
    ];
    const result = analyzeReviewsLocal("Hyundai", "Tucson", reviews);
    expect(result.categories.fiabilite).toBeDefined();
    expect(result.categories.fiabilite.score).toBeGreaterThanOrEqual(0);
    expect(result.categories.securite).toBeDefined();
  });

  it("detects reliability levels", () => {
    const goodReviews = Array.from({ length: 5 }, () =>
      makeReview({ text: "Excellente voiture, fiable, confortable, je recommande", rating: 5 })
    );
    const good = analyzeReviewsLocal("Toyota", "Corolla", goodReviews);
    expect(good.reliability).toBe("elevee");

    const badReviews = Array.from({ length: 5 }, () =>
      makeReview({ text: "Problème, panne, cassé, nul, déçu", rating: 1 })
    );
    const bad = analyzeReviewsLocal("Old", "Car", badReviews);
    expect(bad.reliability).toBe("faible");
  });

  it("generates summary text", () => {
    const reviews = [makeReview({ text: "Bonne voiture, je recommande" })];
    const result = analyzeReviewsLocal("Kia", "Sportage", reviews);
    expect(result.summary).toContain("Kia");
    expect(result.summary).toContain("Sportage");
    expect(result.summary.length).toBeGreaterThan(10);
  });

  it("tracks sources", () => {
    const reviews = [
      makeReview({ source: "google" }),
      makeReview({ source: "youtube" }),
      makeReview({ source: "google" }),
    ];
    const result = analyzeReviewsLocal("Dacia", "Logan", reviews);
    expect(result.sources).toContain("google");
    expect(result.sources).toContain("youtube");
  });
});

describe("Reputation — reputationCache", () => {
  it("exports cache functions without error", async () => {
    const mod = await import("@/lib/reputation/reputationCache");
    expect(typeof mod.getCachedReputation).toBe("function");
    expect(typeof mod.setCachedReputation).toBe("function");
    expect(typeof mod.invalidateCache).toBe("function");
  });
});

describe("Reputation — reputationService", () => {
  it("exports service functions without error", async () => {
    const mod = await import("@/lib/reputation/reputationService");
    expect(typeof mod.getReputation).toBe("function");
    expect(typeof mod.refreshReputation).toBe("function");
    expect(typeof mod.getReputationSync).toBe("function");
    expect(typeof mod.enrichWithReputation).toBe("function");
  });
});
