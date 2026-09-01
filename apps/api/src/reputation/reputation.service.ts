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
    const avgRating =
      reviews.length > 0
        ? reviews.reduce((sum, r) => sum + (Number(r.rating) || 0), 0) / reviews.length
        : 0;

    const roundedAvg = avgRating > 0 ? Math.round(avgRating * 10) / 10 : 0;

    const topPros = this.topTags(reviews, "pros");
    const topCons = this.topTags(reviews, "cons");

    let reliability: string | null = null;
    if (reviews.length > 0) {
      if (roundedAvg >= 7) reliability = "fiable";
      else if (roundedAvg >= 4) reliability = "moyen";
      else reliability = "insuffisant";
    }

    const existing = await this.scoreRepo.findOne({ where: { vehicle_id: vehicleId } });

    if (existing) {
      existing.avg_rating = roundedAvg;
      existing.total_reviews = reviews.length;
      existing.reliability = reliability;
      existing.top_pros = topPros;
      existing.top_cons = topCons;
      return this.scoreRepo.save(existing);
    }

    const score = this.scoreRepo.create({
      vehicle_id: vehicleId,
      avg_rating: roundedAvg,
      total_reviews: reviews.length,
      reliability,
      top_pros: topPros,
      top_cons: topCons,
    });
    return this.scoreRepo.save(score);
  }

  private topTags(reviews: Review[], field: "pros" | "cons"): string[] {
    const counts = new Map<string, number>();
    for (const review of reviews) {
      const items = field === "pros" ? review.pros : review.cons;
      if (!items) continue;
      for (const item of items) {
        const key = item.trim();
        if (key) counts.set(key, (counts.get(key) || 0) + 1);
      }
    }
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([tag]) => tag);
  }
}
