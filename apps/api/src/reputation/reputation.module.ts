import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Review } from "./review.entity";
import { ReputationScore } from "./reputation-score.entity";
import { ReputationService } from "./reputation.service";
import { ReputationController } from "./reputation.controller";

@Module({
  imports: [TypeOrmModule.forFeature([Review, ReputationScore])],
  controllers: [ReputationController],
  providers: [ReputationService],
  exports: [ReputationService],
})
export class ReputationModule {}
