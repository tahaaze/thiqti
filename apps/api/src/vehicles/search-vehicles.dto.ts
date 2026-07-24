import {
  IsOptional,
  IsString,
  IsNumber,
  Min,
  Max,
} from "class-validator";
import { ApiPropertyOptional } from "@nestjs/swagger";

export class SearchVehiclesDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  make?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  model?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  fuel?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ minimum: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  min_price?: number;

  @ApiPropertyOptional({ maximum: 1000000 })
  @IsOptional()
  @IsNumber()
  @Max(1000000)
  max_price?: number;

  @ApiPropertyOptional({ minimum: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  min_km?: number;

  @ApiPropertyOptional({ maximum: 500000 })
  @IsOptional()
  @IsNumber()
  @Max(500000)
  max_km?: number;

  @ApiPropertyOptional({ minimum: 1950 })
  @IsOptional()
  @IsNumber()
  @Min(1950)
  min_year?: number;

  @ApiPropertyOptional({ maximum: 2030 })
  @IsOptional()
  @IsNumber()
  @Max(2030)
  max_year?: number;

  @ApiPropertyOptional({ minimum: 0, maximum: 100 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  min_score?: number;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @IsNumber()
  limit?: number;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsNumber()
  offset?: number;
}
