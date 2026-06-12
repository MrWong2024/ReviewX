import { Transform } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { USER_ROLES } from '../../../common/constants/user-roles';

function trim(value: unknown): unknown {
  return typeof value === 'string' ? value.trim() : value;
}

function uniqueStringArray(value: unknown): unknown {
  if (!Array.isArray(value)) {
    return value;
  }

  const result: unknown[] = [];

  const items = value as unknown[];

  for (const item of items) {
    const normalized = typeof item === 'string' ? item.trim() : item;

    if (typeof normalized === 'string' && normalized.length === 0) {
      continue;
    }

    if (!result.includes(normalized)) {
      result.push(normalized);
    }
  }

  return result;
}

export class CreateAdminUserDto {
  @Transform(({ value }) => trim(value))
  @IsString()
  @IsNotEmpty()
  name!: string;

  @Transform(({ value }) => trim(value))
  @IsString()
  @IsNotEmpty()
  phone!: string;

  @Transform(({ value }) => uniqueStringArray(value))
  @IsArray()
  @ArrayMinSize(1)
  @IsIn(USER_ROLES, { each: true })
  roles!: string[];

  @IsOptional()
  @IsString()
  @MinLength(6)
  password?: string;

  @IsOptional()
  @Transform(({ value }) => uniqueStringArray(value))
  @IsArray()
  @IsMongoId({ each: true })
  organizationIds?: string[];

  @IsOptional()
  @Transform(({ value }) => uniqueStringArray(value))
  @IsArray()
  @IsMongoId({ each: true })
  disciplineIds?: string[];

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsBoolean()
  mustChangePassword?: boolean;
}
