import { Transform } from 'class-transformer';
import { IsMongoId, IsOptional, IsString, MaxLength } from 'class-validator';
import { PROJECT_MATERIAL_REMARK_MAX_LENGTH } from '../constants/project-material.constants';

function trim(value: unknown): unknown {
  return typeof value === 'string' ? value.trim() : value;
}

export class UploadProjectMaterialsDto {
  @Transform(({ value }) => trim(value))
  @IsMongoId()
  materialTypeId!: string;

  @IsOptional()
  @Transform(({ value }) => trim(value))
  @IsString()
  @MaxLength(PROJECT_MATERIAL_REMARK_MAX_LENGTH)
  remark?: string;
}
