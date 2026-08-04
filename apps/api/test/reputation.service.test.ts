import { describe, it, expect, vi, beforeEach } from "vitest";
import { NotFoundException } from "@nestjs/common";

vi.mock("../src/reputation/review.entity", () => ({
  Review: class Review {},
}));
vi.mock("../src/reputation/reputation-score.entity", () => ({
  ReputationScore: class ReputationScore {},
}));

import { ReputationService } from "../src/reputation/reputation.service";

const score = {
  vehicle_id: "v1",
  overall: 88.5,
  history: 90,
  mechanical: 85,
  reviews: 80,
  price_value: 75,
  analysis: "analysis",
};

function makeRepo() {
  const findOne = vi.fn();
  const find = vi.fn();
  const create = vi.fn();
  const save = vi.fn();
  return { findOne, find, create, save };
}

describe("ReputationService", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  function build(reviewRepo: ReturnType<typeof makeRepo>, scoreRepo: ReturnType<typeof makeRepo>) {
    return new ReputationService(reviewRepo as any, scoreRepo as any);
  }

  it("retourne le score existant", async () => {
    const reviewRepo = makeRepo();
    const scoreRepo = makeRepo();
    scoreRepo.findOne.mockResolvedValue(score);
    const service = build(reviewRepo, scoreRepo);

    const result = await service.getScore("v1");

    expect(result).toBe(score);
    expect(scoreRepo.findOne).toHaveBeenCalledWith({ where: { vehicle_id: "v1" } });
  });

  it("leve NotFoundException quand le score est absent", async () => {
    const scoreRepo = makeRepo();
    scoreRepo.findOne.mockResolvedValue(null);
    const service = build(makeRepo(), scoreRepo);

    await expect(service.getScore("missing")).rejects.toBeInstanceOf(NotFoundException);
  });

  it("liste les avis tries par date decroissante", async () => {
    const reviewRepo = makeRepo();
    reviewRepo.find.mockResolvedValue([{ id: "r1" }, { id: "r2" }]);
    const service = build(reviewRepo, makeRepo());

    const result = await service.getReviews("v1");

    expect(result).toHaveLength(2);
    expect(reviewRepo.find).toHaveBeenCalledWith({
      where: { vehicle_id: "v1" },
      order: { created_at: "DESC" },
    });
  });

  it("calcule un score sans avis (aucune donnee reelle)", async () => {
    const reviewRepo = makeRepo();
    reviewRepo.find.mockResolvedValue([]);
    const scoreRepo = makeRepo();
    scoreRepo.findOne.mockResolvedValue(null);
    scoreRepo.create.mockImplementation((dto: any) => dto);
    scoreRepo.save.mockImplementation((v: any) => Promise.resolve(v));
    const service = build(reviewRepo, scoreRepo);

    const result = await service.computeScore("v1");

    expect(result.vehicle_id).toBe("v1");
    expect(result.reviews).toBe(null);
    expect(result.history).toBe(null);
    expect(result.mechanical).toBe(null);
    expect(result.price_value).toBe(null);
    expect(result.overall).toBe(0);
    expect(result.analysis).toContain("0 reviews");
    expect(scoreRepo.create).toHaveBeenCalled();
  });

  it("calcule le score a partir des avis reels uniquement", async () => {
    const reviewRepo = makeRepo();
    reviewRepo.find.mockResolvedValue([{ score: 10 }, { score: 5 }]);
    const scoreRepo = makeRepo();
    scoreRepo.findOne.mockResolvedValue(null);
    scoreRepo.create.mockImplementation((dto: any) => dto);
    scoreRepo.save.mockImplementation((v: any) => Promise.resolve(v));
    const service = build(reviewRepo, scoreRepo);

    const result = await service.computeScore("v1");

    expect(result.reviews).toBe(75);
    expect(result.history).toBe(null);
    expect(result.mechanical).toBe(null);
    expect(result.price_value).toBe(null);
    expect(result.overall).toBe(75);
    expect(result.analysis).toContain("2 reviews");
  });

  it("met a jour le score existant au lieu d'en creer un nouveau", async () => {
    const reviewRepo = makeRepo();
    reviewRepo.find.mockResolvedValue([]);
    const scoreRepo = makeRepo();
    scoreRepo.findOne.mockResolvedValue(score);
    const service = build(reviewRepo, scoreRepo);

    await service.computeScore("v1");

    expect(scoreRepo.save).toHaveBeenCalledWith(score);
    expect(scoreRepo.create).not.toHaveBeenCalled();
  });
});
