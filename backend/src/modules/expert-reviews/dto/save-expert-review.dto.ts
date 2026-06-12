import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { REVIEW_TEXT_MAX_LENGTH } from '../constants/expert-review.constants';

function trim(value: unknown): unknown {
  return typeof value === 'string' ? value.trim() : value;
}

export class ExpertReviewItemInputDto {
  @IsOptional()
  @Transform(({ value }) => trim(value))
  @IsString()
  name?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  score?: number;

  @IsOptional()
  @Transform(({ value }) => trim(value))
  @IsString()
  @MaxLength(REVIEW_TEXT_MAX_LENGTH)
  evaluationDescription?: string;

  @IsOptional()
  @Transform(({ value }) => trim(value))
  @IsString()
  @MaxLength(REVIEW_TEXT_MAX_LENGTH)
  improvementSuggestion?: string;

  @IsOptional()
  @IsBoolean()
  hasMajorIssue?: boolean;
}

export class SaveExpertReviewDto {
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => ExpertReviewItemInputDto)
  items?: ExpertReviewItemInputDto[];
}
