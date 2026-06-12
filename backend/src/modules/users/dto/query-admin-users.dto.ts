import { Transform } from 'class-transformer';
import { IsIn, IsMongoId, IsOptional, ValidateIf } from 'class-validator';
import { USER_ROLES } from '../../../common/constants/user-roles';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

function trim(value: unknown): unknown {
  return typeof value === 'string' ? value.trim() : value;
}

export class QueryAdminUsersDto extends PaginationQueryDto {
  @IsOptional()
  @Transform(({ value }) => trim(value))
  @IsIn(USER_ROLES)
  role?: string;

  @IsOptional()
  @Transform(({ value }) => trim(value))
  @ValidateIf((_, value) => value !== null && value !== '')
  @IsMongoId()
  organizationId?: string;

  @IsOptional()
  @Transform(({ value }) => trim(value))
  @ValidateIf((_, value) => value !== null && value !== '')
  @IsMongoId()
  disciplineId?: string;
}
