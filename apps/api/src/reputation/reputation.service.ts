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
        : 0;

    const reviewSubscore = avgReviewScore * 10;
    const hasReviews = reviews.length > 0;
    const overall = hasReviews ? Number(reviewSubscore.toFixed(1)) : 0;

    const data = {
      overall,
      history: null as number | null,
      mechanical: null as number | null,
      reviews: hasReviews ? Number(reviewSubscore.toFixed(1)) : null,
      price_value: null as number | null,
      analysis: `Based on ${reviews.length} reviews. Review score: ${overall}/100.`,
    };

    const existing = await this.scoreRepo.findOne({ where: { vehicle_id: vehicleId } });

    if (existing) {
      existing.overall = data.overall;
      existing.history = data.history;
      existing.mechanical = data.mechanical;
      existing.reviews = data.reviews;
      existing.price_value = data.price_value;
      existing.analysis = data.analysis;
      return this.scoreRepo.save(existing);
    }

    const score = this.scoreRepo.create({
      vehicle_id: vehicleId,
      ...data,
    });
    return this.scoreRepo.save(score);
  }
}
