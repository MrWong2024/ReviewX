import { Transform } from 'class-transformer';
import { IsIn, IsOptional } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { PROJECT_IMPORT_ROW_STATUSES } from '../constants/project-import-status';
import type { ProjectImportRowStatus } from '../constants/project-import-status';

function trim(value: unknown): unknown {
  return typeof value === 'string' ? value.trim() : value;
}

export class QueryProjectImportRowsDto extends PaginationQueryDto {
  @IsOptional()
  @Transform(({ value }) => trim(value))
  @IsIn(PROJECT_IMPORT_ROW_STATUSES)
  status?: ProjectImportRowStatus;
}
