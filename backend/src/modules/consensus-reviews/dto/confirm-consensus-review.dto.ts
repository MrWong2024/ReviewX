import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

function trim(value: unknown): unknown {
  return typeof value === 'string' ? value.trim() : value;
}

export class ConfirmConsensusReviewDto {
  @Transform(({ value }) => trim(value))
  @IsString()
  @MinLength(1)
  @MaxLength(10000)
  finalOpinion!: string;

  @Type(() => Number)
  @IsNumber()
  finalScore!: number;

  @Transform(({ value }) => trim(value))
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  finalLevel!: string;

  @IsOptional()
  @IsBoolean()
  useDraftAsBase?: boolean;
}
