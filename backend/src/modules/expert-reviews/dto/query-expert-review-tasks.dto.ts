import { Transform } from 'class-transformer';
import { IsIn, IsMongoId, IsOptional } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { EXPERT_REVIEW_VIEW_STATUSES } from '../constants/expert-review.constants';
import type { ExpertReviewViewStatus } from '../constants/expert-review.constants';

function trim(value: unknown): unknown {
  return typeof value === 'string' ? value.trim() : value;
}

export class QueryExpertReviewTasksDto extends PaginationQueryDto {
  @IsOptional()
  @Transform(({ value }) => trim(value))
  @IsMongoId()
  batchId?: string;

  @IsOptional()
  @Transform(({ value }) => trim(value))
  @IsIn(EXPERT_REVIEW_VIEW_STATUSES)
  status?: ExpertReviewViewStatus;

  @IsOptional()
  @Transform(({ value }) => trim(value))
  @IsMongoId()
  reviewManagerId?: string;

  @IsOptional()
  @Transform(({ value }) => trim(value))
  @IsMongoId()
  reviewSchemeId?: string;
}
