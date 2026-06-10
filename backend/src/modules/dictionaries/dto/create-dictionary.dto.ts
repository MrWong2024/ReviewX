import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsInt, IsOptional, IsString, Min } from 'class-validator';

function trim(value: unknown): unknown {
  return typeof value === 'string' ? value.trim() : value;
}

export class CreateDictionaryDto {
  @Transform(({ value }) => trim(value))
  @IsString()
  dictType!: string;

  @Transform(({ value }) => trim(value))
  @IsString()
  code!: string;

  @Transform(({ value }) => trim(value))
  @IsString()
  name!: string;

  @IsOptional()
  @Transform(({ value }) => trim(value))
  @IsString()
  description?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
