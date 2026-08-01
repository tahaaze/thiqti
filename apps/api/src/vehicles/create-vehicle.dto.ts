import {
  IsString,
  IsNumber,
  IsOptional,
  Min,
  Max,
  IsIn,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

const BODY_TYPES = ["suv", "berline", "citadine", "pick-up", "monospace", "crossover"] as const;
const FUEL_TYPES = ["hybride", "electrique", "diesel", "essence", "plug-in-hybride"] as const;
const TRANSMISSIONS = ["automatique", "manuelle"] as const;

export class CreateVehicleDto {
  @ApiProperty({ example: "Dacia" })
  @IsString()
  make!: string;

  @ApiProperty({ example: "Duster" })
  @IsString()
  model!: string;

  @ApiProperty({ example: 2026 })
  @IsNumber()
  @Min(2020)
  @Max(2030)
  year!: number;

  @ApiProperty({ example: "Essential" })
  @IsString()
  trim!: string;

  @ApiProperty({ example: "suv", enum: BODY_TYPES })
  @IsString()
  @IsIn(BODY_TYPES)
  body_type!: string;

  @ApiProperty({ example: "diesel", enum: FUEL_TYPES })
  @IsString()
  @IsIn(FUEL_TYPES)
  fuel_type!: string;

  @ApiProperty({ example: "automatique", enum: TRANSMISSIONS })
  @IsString()
  @IsIn(TRANSMISSIONS)
  transmission!: string;

  @ApiPropertyOptional({ example: 5 })
  @IsOptional()
  @IsNumber()
  @Min(2)
  @Max(9)
  seats?: number;

  @ApiProperty({ example: 219000 })
  @IsNumber()
  @Min(0)
  price_mad!: number;

  @ApiPropertyOptional({ example: 245000 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  price_old_mad?: number;

  @ApiPropertyOptional({ example: 130 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  power_ch?: number;

  @ApiPropertyOptional({ example: 5.2 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  consumption_l100?: number;

  @ApiPropertyOptional({ example: 136 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  co2_gkm?: number;

  @ApiPropertyOptional({ example: 9.5 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  accel_0_100?: number;

  @ApiPropertyOptional({ example: 450 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  trunk_liters?: number;

  @ApiPropertyOptional({ example: 4340 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  length_mm?: number;

  @ApiPropertyOptional({ example: 1820 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  width_mm?: number;

  @ApiPropertyOptional({ example: 1660 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  height_mm?: number;

  @ApiPropertyOptional({ example: 2670 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  wheelbase_mm?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  image_url?: string;
}
