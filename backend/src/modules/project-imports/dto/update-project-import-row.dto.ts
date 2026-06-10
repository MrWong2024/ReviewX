import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsMongoId,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
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

export class UpdateProjectImportNormalizedDto {
  @IsOptional()
  @Transform(({ value }) => trim(value))
  @IsString()
  projectNo?: string;

  @IsOptional()
  @Transform(({ value }) => trim(value))
  @IsString()
  name?: string;

  @IsOptional()
  @Transform(({ value }) => trim(value))
  @IsString()
  projectTypeName?: string;

  @IsOptional()
  @Transform(({ value }) => trim(value))
  @IsString()
  ownerName?: string;

  @IsOptional()
  @Transform(({ value }) => trim(value))
  @IsString()
  ownerPhone?: string;

  @IsOptional()
  @Transform(({ value }) => trim(value))
  @IsString()
  leadOrganizationName?: string;

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
  @IsString({ each: true })
  disciplineNames?: string[];

  @IsOptional()
  @Transform(({ value }) => trim(value))
  @IsString()
  departmentName?: string;

  @IsOptional()
  @Transform(({ value }) => uniqueStrings(value))
  @IsArray()
  @IsString({ each: true })
  cooperationOrganizationNames?: string[];

  @IsOptional()
  @Transform(({ value }) => trim(value))
  @IsString()
  statusName?: string;

  @IsOptional()
  @Transform(({ value }) => trim(value))
  @IsString()
  organizationContactName?: string;

  @IsOptional()
  @Transform(({ value }) => trim(value))
  @IsString()
  organizationContactPhone?: string;
}

export class UpdateProjectImportResolvedDto {
  @IsOptional()
  @IsMongoId()
  projectTypeId?: string;

  @IsOptional()
  @IsMongoId()
  statusId?: string;

  @IsOptional()
  @IsMongoId()
  ownerUserId?: string;

  @IsOptional()
  @IsMongoId()
  leadOrganizationId?: string;

  @IsOptional()
  @Transform(({ value }) => uniqueStrings(value))
  @IsArray()
  @IsMongoId({ each: true })
  cooperationOrganizationIds?: string[];

  @IsOptional()
  @Transform(({ value }) => uniqueStrings(value))
  @IsArray()
  @IsMongoId({ each: true })
  disciplineIds?: string[];

  @IsOptional()
  @IsMongoId()
  departmentId?: string;
}

export class CreateImportOrganizationDto {
  @Transform(({ value }) => trim(value))
  @IsString()
  name!: string;

  @IsOptional()
  @Transform(({ value }) => trim(value))
  @IsString()
  contactName?: string;

  @IsOptional()
  @Transform(({ value }) => trim(value))
  @IsString()
  contactPhone?: string;

  @IsOptional()
  @IsMongoId()
  regionId?: string;
}

export class CreateImportOwnerUserDto {
  @Transform(({ value }) => trim(value))
  @IsString()
  name!: string;

  @Transform(({ value }) => trim(value))
  @IsString()
  phone!: string;

  @IsOptional()
  @Transform(({ value }) => uniqueStrings(value))
  @IsArray()
  @IsMongoId({ each: true })
  organizationIds?: string[];

  @IsOptional()
  @Transform(({ value }) => uniqueStrings(value))
  @IsArray()
  @IsMongoId({ each: true })
  disciplineIds?: string[];
}

export class UpdateProjectImportRowDto {
  @IsOptional()
  @ValidateNested()
  @Type(() => UpdateProjectImportNormalizedDto)
  normalized?: UpdateProjectImportNormalizedDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => UpdateProjectImportResolvedDto)
  resolved?: UpdateProjectImportResolvedDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => CreateImportOrganizationDto)
  createOrganization?: CreateImportOrganizationDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => CreateImportOwnerUserDto)
  createOwnerUser?: CreateImportOwnerUserDto;
}
