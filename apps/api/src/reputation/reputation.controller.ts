import { Controller, Get, Param, Post } from "@nestjs/common";
import { ApiTags, ApiOperation } from "@nestjs/swagger";
import { ReputationService } from "./reputation.service";

@ApiTags("reputation")
@Controller("reputation")
export class ReputationController {
  constructor(private readonly service: ReputationService) {}

  @Get("vehicle/:vehicleId")
  @ApiOperation({ summary: "Get reputation score for a vehicle" })
  getScore(@Param("vehicleId") vehicleId: string) {
    return this.service.getScore(vehicleId);
  }

  @Get("vehicle/:vehicleId/reviews")
  @ApiOperation({ summary: "Get reviews for a vehicle" })
  getReviews(@Param("vehicleId") vehicleId: string) {
    return this.service.getReviews(vehicleId);
  }

  @Post("vehicle/:vehicleId/compute")
  @ApiOperation({ summary: "Trigger reputation score computation" })
  computeScore(@Param("vehicleId") vehicleId: string) {
    return this.service.computeScore(vehicleId);
  }
}
