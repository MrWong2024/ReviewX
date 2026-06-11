import { Transform } from 'class-transformer';
import { IsMongoId, IsOptional } from 'class-validator';

function trim(value: unknown): unknown {
  return typeof value === 'string' ? value.trim() : value;
}

export class QueryProjectMaterialsDto {
  @IsOptional()
  @Transform(({ value }) => trim(value))
  @IsMongoId()
  materialTypeId?: string;
}
