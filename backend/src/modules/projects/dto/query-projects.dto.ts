import { Transform } from 'class-transformer';
import { IsBoolean, IsMongoId, IsOptional } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

function trim(value: unknown): unknown {
  return typeof value === 'string' ? value.trim() : value;
}

export class QueryProjectsDto extends PaginationQueryDto {
  @IsOptional()
  @Transform(({ value }) => trim(value))
  @IsMongoId()
  batchId?: string;

  @IsOptional()
  @Transform(({ value }) => trim(value))
  @IsMongoId()
  reviewManagerId?: string;

  @IsOptional()
  @Transform(({ value }) => trim(value))
  @IsMongoId()
  reviewSchemeId?: string;

  @IsOptional()
  @Transform(({ value }) => trim(value))
  @IsMongoId()
  projectTypeId?: string;

  @IsOptional()
  @Transform(({ value }) => trim(value))
  @IsMongoId()
  statusId?: string;

  @IsOptional()
  @Transform(({ value }) => trim(value))
  @IsMongoId()
  departmentId?: string;

  @IsOptional()
  @Transform(({ value }) => trim(value))
  @IsMongoId()
  disciplineId?: string;

  @IsOptional()
  @Transform(({ value }) => toOptionalBoolean(value))
  @IsBoolean()
  hasReviewManager?: boolean;

  @IsOptional()
  @Transform(({ value }) => toOptionalBoolean(value))
  @IsBoolean()
  hasReviewScheme?: boolean;
}

function toOptionalBoolean(value: unknown): unknown {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  if (value === true || value === 'true') {
    return true;
  }

  if (value === false || value === 'false') {
    return false;
  }

  return value;
}
