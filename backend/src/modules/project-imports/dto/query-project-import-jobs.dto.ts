import { Transform } from 'class-transformer';
import { IsIn, IsMongoId, IsOptional, ValidateIf } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { PROJECT_IMPORT_JOB_STATUSES } from '../constants/project-import-status';
import type { ProjectImportJobStatus } from '../constants/project-import-status';

function trim(value: unknown): unknown {
  return typeof value === 'string' ? value.trim() : value;
}

export class QueryProjectImportJobsDto extends PaginationQueryDto {
  @IsOptional()
  @Transform(({ value }) => trim(value))
  @IsIn(PROJECT_IMPORT_JOB_STATUSES)
  status?: ProjectImportJobStatus;

  @IsOptional()
  @Transform(({ value }) => trim(value))
  @ValidateIf((_, value) => value !== null && value !== '')
  @IsMongoId()
  batchId?: string;
}
