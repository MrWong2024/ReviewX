import { Transform } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

function trim(value: unknown): unknown {
  return typeof value === 'string' ? value.trim() : value;
}

export class UpsertProjectImportFieldMappingDto {
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  aliases!: string[];

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @Transform(({ value }) => trim(value))
  @IsString()
  @MaxLength(500)
  description?: string;
}
