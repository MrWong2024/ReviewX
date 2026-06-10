import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsMongoId,
  IsOptional,
  IsString,
  ValidateIf,
} from 'class-validator';

function trim(value: unknown): unknown {
  return typeof value === 'string' ? value.trim() : value;
}

export class CreateOrganizationDto {
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
  @ValidateIf((_, value) => value !== null && value !== '')
  @IsMongoId()
  regionId?: string | null;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
