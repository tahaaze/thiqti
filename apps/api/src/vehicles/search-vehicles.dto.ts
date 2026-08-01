import {
  IsOptional,
  IsString,
  IsNumber,
  Min,
  Max,
  IsIn,
} from "class-validator";
import { ApiPropertyOptional } from "@nestjs/swagger";

const BODY_TYPES = ["suv", "berline", "citadine", "pick-up", "monospace", "crossover"] as const;
const FUEL_TYPES = ["hybride", "electrique", "diesel", "essence", "plug-in-hybride"] as const;
const TRANSMISSIONS = ["automatique", "manuelle"] as const;

export class SearchVehiclesDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  make?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  model?: string;

  @ApiPropertyOptional({ example: "suv", enum: BODY_TYPES })
  @IsOptional()
  @IsString()
  @IsIn(BODY_TYPES)
  body_type?: string;

  @ApiPropertyOptional({ example: "diesel", enum: FUEL_TYPES })
  @IsOptional()
  @IsString()
  @IsIn(FUEL_TYPES)
  fuel_type?: string;

  @ApiPropertyOptional({ example: "automatique", enum: TRANSMISSIONS })
  @IsOptional()
  @IsString()
  @IsIn(TRANSMISSIONS)
  transmission?: string;

  @ApiPropertyOptional({ minimum: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  min_price?: number;

  @ApiPropertyOptional({ maximum: 10000000 })
  @IsOptional()
  @IsNumber()
  @Max(10000000)
  max_price?: number;

  @ApiPropertyOptional({ minimum: 2020, maximum: 2030 })
  @IsOptional()
  @IsNumber()
  @Min(2020)
  @Max(2030)
  min_year?: number;

  @ApiPropertyOptional({ minimum: 2020, maximum: 2030 })
  @IsOptional()
  @IsNumber()
  @Min(2020)
  @Max(2030)
  max_year?: number;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @IsNumber()
  limit?: number;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsNumber()
  offset?: number;
}
