import { Transform } from 'class-transformer';
import { IsMongoId } from 'class-validator';

function trim(value: unknown): unknown {
  return typeof value === 'string' ? value.trim() : value;
}

export class UploadProjectImportDto {
  @Transform(({ value }) => trim(value))
  @IsMongoId()
  batchId!: string;
}
