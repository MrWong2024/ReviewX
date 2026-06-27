import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsMongoId,
  IsOptional,
  IsString,
} from 'class-validator';
import { ListFilterQueryDto } from '../../../common/dto/pagination-query.dto';
import { CLIENT_DASHBOARD_PROGRESS_STAGES } from '../constants/client-dashboard.constants';
import type { ClientDashboardProgressStage } from '../constants/client-dashboard.constants';

function trimOptional(value: unknown): unknown {
  return typeof value === 'string' ? value.trim() : value;
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

export class QueryClientDashboardOverviewDto extends ListFilterQueryDto {
  @IsOptional()
  @Transform(({ value }) => trimOptional(value))
  @IsMongoId()
  batchId?: string;

  @IsOptional()
  @Transform(({ value }) => trimOptional(value))
  @IsMongoId()
  projectTypeId?: string;

  @IsOptional()
  @Transform(({ value }) => trimOptional(value))
  @IsMongoId()
  statusId?: string;

  @IsOptional()
  @Transform(({ value }) => trimOptional(value))
  @IsMongoId()
  departmentId?: string;

  @IsOptional()
  @Transform(({ value }) => trimOptional(value))
  @IsMongoId()
  disciplineId?: string;

  @IsOptional()
  @Transform(({ value }) => trimOptional(value))
  @IsMongoId()
  reviewManagerId?: string;

  @IsOptional()
  @Transform(({ value }) => trimOptional(value))
  @IsMongoId()
  reviewSchemeId?: string;

  @IsOptional()
  @Transform(({ value }) => trimOptional(value))
  @IsString()
  finalLevel?: string;

  @IsOptional()
  @Transform(({ value }) => trimOptional(value))
  @IsIn(CLIENT_DASHBOARD_PROGRESS_STAGES)
  progressStage?: ClientDashboardProgressStage;

  @IsOptional()
  @Transform(({ value }) => toOptionalBoolean(value))
  @IsBoolean()
  hasMeetingUrl?: boolean;

  @IsOptional()
  @Transform(({ value }) => toOptionalBoolean(value))
  @IsBoolean()
  hasPendingAppeal?: boolean;
}
