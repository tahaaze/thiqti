import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Review } from "./review.entity";
import { ReputationScore } from "./reputation-score.entity";

@Injectable()
export class ReputationService {
  constructor(
    @InjectRepository(Review)
    private readonly reviewRepo: Repository<Review>,
    @InjectRepository(ReputationScore)
    private readonly scoreRepo: Repository<ReputationScore>
  ) {}

  async getScore(vehicleId: string): Promise<ReputationScore> {
    const score = await this.scoreRepo.findOne({ where: { vehicle_id: vehicleId } });
    if (!score) throw new NotFoundException(`Score for vehicle ${vehicleId} not found`);
    return score;
  }

  async getReviews(vehicleId: string): Promise<Review[]> {
    return this.reviewRepo.find({
      where: { vehicle_id: vehicleId },
      order: { created_at: "DESC" },
    });
  }

  async computeScore(vehicleId: string): Promise<ReputationScore> {
    const reviews = await this.getReviews(vehicleId);
    const avgReviewScore =
      reviews.length > 0
        ? reviews.reduce((sum, r) => sum + (Number(r.score) || 0), 0) / reviews.length
        : 50;

    const historyScore = 80 + Math.random() * 15;
    const mechanicalScore = 75 + Math.random() * 20;
    const priceValueScore = 70 + Math.random() * 25;

    const overall = (
      historyScore * 0.3 +
      mechanicalScore * 0.3 +
      avgReviewScore * 10 * 0.25 +
      priceValueScore * 0.15
    ).toFixed(1);

    const existing = await this.scoreRepo.findOne({ where: { vehicle_id: vehicleId } });

    if (existing) {
      existing.overall = Number(overall);
      existing.history = Number(historyScore.toFixed(1));
      existing.mechanical = Number(mechanicalScore.toFixed(1));
      existing.reviews = Number((avgReviewScore * 10).toFixed(1));
      existing.price_value = Number(priceValueScore.toFixed(1));
      existing.analysis = `Based on ${reviews.length} reviews. Overall: ${overall}/100.`;
      return this.scoreRepo.save(existing);
    }

    const score = this.scoreRepo.create({
      vehicle_id: vehicleId,
      overall: Number(overall),
      history: Number(historyScore.toFixed(1)),
      mechanical: Number(mechanicalScore.toFixed(1)),
      reviews: Number((avgReviewScore * 10).toFixed(1)),
      price_value: Number(priceValueScore.toFixed(1)),
      analysis: `Based on ${reviews.length} reviews. Overall: ${overall}/100.`,
    });
    return this.scoreRepo.save(score);
  }
}
