import { Transform } from 'class-transformer';
import { IsMongoId, IsOptional, ValidateIf } from 'class-validator';

function emptyToUndefined(value: unknown): unknown {
  return value === '' ? undefined : value;
}

export class UpdateReviewAssignmentDto {
  @IsOptional()
  @Transform(({ value }) => emptyToUndefined(value))
  @ValidateIf((_, value) => value !== undefined && value !== null)
  @IsMongoId()
  reviewManagerId?: string;

  @IsOptional()
  @Transform(({ value }) => emptyToUndefined(value))
  @ValidateIf((_, value) => value !== undefined && value !== null)
  @IsMongoId()
  reviewSchemeId?: string;
}
