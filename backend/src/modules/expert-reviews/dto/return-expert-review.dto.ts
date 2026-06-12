import { Transform } from 'class-transformer';
import { IsString, MaxLength, MinLength } from 'class-validator';

function trim(value: unknown): unknown {
  return typeof value === 'string' ? value.trim() : value;
}

export class ReturnExpertReviewDto {
  @Transform(({ value }) => trim(value))
  @IsString()
  @MinLength(1)
  @MaxLength(1000)
  returnReason!: string;
}
