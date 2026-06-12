import { Transform } from 'class-transformer';
import { IsString, MaxLength, MinLength } from 'class-validator';
import { PROJECT_APPEAL_REASON_MAX_LENGTH } from '../constants/project-appeal.constants';

function trim(value: unknown): unknown {
  return typeof value === 'string' ? value.trim() : value;
}

export class CreateProjectAppealDto {
  @Transform(({ value }) => trim(value))
  @IsString()
  @MinLength(1)
  @MaxLength(PROJECT_APPEAL_REASON_MAX_LENGTH)
  reason!: string;
}
