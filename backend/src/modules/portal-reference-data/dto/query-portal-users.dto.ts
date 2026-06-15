import { Transform } from 'class-transformer';
import { IsIn, IsOptional } from 'class-validator';
import {
  QueryPortalCommonDto,
  splitCommaSeparatedStrings,
  trimOptional,
} from './query-portal-common.dto';

export const PORTAL_USER_QUERY_ROLES = [
  'review_manager',
  'expert',
  'project_owner',
] as const;

export type PortalUserQueryRole = (typeof PORTAL_USER_QUERY_ROLES)[number];

export class QueryPortalUsersDto extends QueryPortalCommonDto {
  @IsOptional()
  @Transform(({ value }) => trimOptional(value))
  @IsIn(PORTAL_USER_QUERY_ROLES)
  role?: string;

  @IsOptional()
  @Transform(({ value }) => splitCommaSeparatedStrings(value))
  @IsIn(PORTAL_USER_QUERY_ROLES, { each: true })
  roles?: string[];
}
