import { Transform, Type } from 'class-transformer';
import {
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

function trim(value: unknown): unknown {
  return typeof value === 'string' ? value.trim() : value;
}

export class ReviewSchemeItemDto {
  @Transform(({ value }) => trim(value))
  @IsString()
  name!: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0.01)
  maxScore!: number;

  @IsOptional()
  @Transform(({ value }) => trim(value))
  @IsString()
  scoringGuide?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(1)
  suggestionRequiredThresholdRatio?: number;
}
