import { Transform } from 'class-transformer';
import { IsMongoId, IsOptional } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

function trim(value: unknown): unknown {
  return typeof value === 'string' ? value.trim() : value;
}

export class QueryExpertProjectsDto extends PaginationQueryDto {
  @IsOptional()
  @Transform(({ value }) => trim(value))
  @IsMongoId()
  batchId?: string;

  @IsOptional()
  @Transform(({ value }) => trim(value))
  @IsMongoId()
  statusId?: string;
}
