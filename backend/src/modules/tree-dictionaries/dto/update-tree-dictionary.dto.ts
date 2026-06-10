import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsMongoId,
  IsOptional,
  IsString,
  Min,
  ValidateIf,
} from 'class-validator';

function trim(value: unknown): unknown {
  return typeof value === 'string' ? value.trim() : value;
}

export class UpdateTreeDictionaryDto {
  @IsOptional()
  @Transform(({ value }) => trim(value))
  @IsString()
  treeType?: string;

  @IsOptional()
  @ValidateIf((_, value) => value !== null && value !== '')
  @IsMongoId()
  parentId?: string | null;

  @IsOptional()
  @Transform(({ value }) => trim(value))
  @IsString()
  code?: string;

  @IsOptional()
  @Transform(({ value }) => trim(value))
  @IsString()
  name?: string;

  @IsOptional()
  @Transform(({ value }) => trim(value))
  @IsString()
  fullName?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
