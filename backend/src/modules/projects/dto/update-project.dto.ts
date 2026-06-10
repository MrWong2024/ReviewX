import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDate,
  IsMongoId,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateIf,
} from 'class-validator';
import { ensureUniqueStrings } from '../../../common/utils/mongo-query';

function trim(value: unknown): unknown {
  return typeof value === 'string' ? value.trim() : value;
}

function uniqueStrings(value: unknown): unknown {
  if (!Array.isArray(value)) {
    return value;
  }

  return ensureUniqueStrings(
    value.filter((item): item is string => typeof item === 'string'),
  );
}

export class UpdateProjectDto {
  @IsOptional()
  @IsMongoId()
  batchId?: string;

  @IsOptional()
  @Transform(({ value }) => trim(value))
  @IsString()
  projectNo?: string;

  @IsOptional()
  @Transform(({ value }) => trim(value))
  @IsString()
  name?: string;

  @IsOptional()
  @ValidateIf((_, value) => value !== null && value !== '')
  @IsMongoId()
  projectTypeId?: string | null;

  @IsOptional()
  @ValidateIf((_, value) => value !== null && value !== '')
  @IsMongoId()
  statusId?: string | null;

  @IsOptional()
  @ValidateIf((_, value) => value !== null && value !== '')
  @IsMongoId()
  ownerUserId?: string | null;

  @IsOptional()
  @ValidateIf((_, value) => value !== null && value !== '')
  @IsMongoId()
  leadOrganizationId?: string | null;

  @IsOptional()
  @Transform(({ value }) => uniqueStrings(value))
  @IsArray()
  @IsMongoId({ each: true })
  cooperationOrganizationIds?: string[];

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  totalFunding?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  allocatedFunding?: number;

  @IsOptional()
  @Transform(({ value }) => uniqueStrings(value))
  @IsArray()
  @IsMongoId({ each: true })
  disciplineIds?: string[];

  @IsOptional()
  @ValidateIf((_, value) => value !== null && value !== '')
  @IsMongoId()
  departmentId?: string | null;

  @IsOptional()
  @ValidateIf((_, value) => value !== null && value !== '')
  @IsMongoId()
  reviewManagerId?: string | null;

  @IsOptional()
  @ValidateIf((_, value) => value !== null && value !== '')
  @IsMongoId()
  reviewSchemeId?: string | null;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  reviewTime?: Date;

  @IsOptional()
  @Transform(({ value }) => trim(value))
  @IsString()
  reviewLocation?: string;

  @IsOptional()
  @Transform(({ value }) => trim(value))
  @IsString()
  meetingUrl?: string;

  @IsOptional()
  @Transform(({ value }) => trim(value))
  @IsString()
  followUpNeeds?: string;

  @IsOptional()
  @Transform(({ value }) => trim(value))
  @IsString()
  finalLevel?: string;

  @IsOptional()
  @Transform(({ value }) => trim(value))
  @IsString()
  originalLevel?: string;

  @IsOptional()
  @Transform(({ value }) => trim(value))
  @IsString()
  importedFromJobId?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
