import { Transform } from 'class-transformer';
import { IsString, MaxLength, MinLength } from 'class-validator';

function trim(value: unknown): unknown {
  return typeof value === 'string' ? value.trim() : value;
}

export class DeleteProjectMaterialAdminDto {
  @IsString()
  @Transform(({ value }) => trim(value))
  @MinLength(1)
  @MaxLength(1000)
  reason!: string;
}
