import {
  IsString,
  IsNumber,
  IsOptional,
  IsBoolean,
  Min,
  Max,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class CreateVehicleDto {
  @ApiProperty({ example: "Dacia" })
  @IsString()
  make!: string;

  @ApiProperty({ example: "Duster" })
  @IsString()
  model!: string;

  @ApiProperty({ example: 2022 })
  @IsNumber()
  @Min(1950)
  @Max(2030)
  year!: number;

  @ApiProperty({ example: 185000 })
  @IsNumber()
  @Min(0)
  price!: number;

  @ApiProperty({ example: 35000 })
  @IsNumber()
  @Min(0)
  km!: number;

  @ApiProperty({ example: "Diesel" })
  @IsString()
  fuel!: string;

  @ApiPropertyOptional({ example: "Manuelle" })
  @IsOptional()
  @IsString()
  transmission?: string;

  @ApiPropertyOptional({ example: 110 })
  @IsOptional()
  @IsNumber()
  hp?: number;

  @ApiPropertyOptional({ example: "Gris Artique" })
  @IsOptional()
  @IsString()
  color?: string;

  @ApiPropertyOptional({ example: "Casablanca" })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  image_url?: string;

  @ApiPropertyOptional({ example: 1.5 })
  @IsOptional()
  @IsNumber()
  engine?: number;

  @ApiPropertyOptional({ example: 5 })
  @IsOptional()
  @IsNumber()
  doors?: number;

  @ApiPropertyOptional({ example: 5 })
  @IsOptional()
  @IsNumber()
  seats?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  dealer_id?: string;
}
