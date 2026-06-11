import { Transform } from 'class-transformer';
import { IsString, MaxLength } from 'class-validator';
import { PROJECT_FOLLOW_UP_NEEDS_MAX_LENGTH } from '../constants/project-material.constants';

function trim(value: unknown): unknown {
  return typeof value === 'string' ? value.trim() : value;
}

export class UpdateFollowUpNeedsDto {
  @Transform(({ value }) => trim(value))
  @IsString()
  @MaxLength(PROJECT_FOLLOW_UP_NEEDS_MAX_LENGTH)
  followUpNeeds!: string;
}
