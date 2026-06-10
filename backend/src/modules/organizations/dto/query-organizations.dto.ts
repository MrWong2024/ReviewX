import { Transform } from 'class-transformer';
import { IsMongoId, IsOptional, ValidateIf } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

function trim(value: unknown): unknown {
  return typeof value === 'string' ? value.trim() : value;
}

export class QueryOrganizationsDto extends PaginationQueryDto {
  @IsOptional()
  @Transform(({ value }) => trim(value))
  @ValidateIf((_, value) => value !== null && value !== '')
  @IsMongoId()
  regionId?: string;
}
