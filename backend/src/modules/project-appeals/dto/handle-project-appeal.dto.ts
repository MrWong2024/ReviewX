import { Transform } from 'class-transformer';
import {
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { PROJECT_APPEAL_HANDLING_OPINION_MAX_LENGTH } from '../constants/project-appeal.constants';

function trim(value: unknown): unknown {
  return typeof value === 'string' ? value.trim() : value;
}

export class HandleProjectAppealDto {
  @Transform(({ value }) => trim(value))
  @IsString()
  @IsIn(['accepted', 'rejected'])
  decision!: 'accepted' | 'rejected';

  @Transform(({ value }) => trim(value))
  @IsString()
  @MinLength(1)
  @MaxLength(PROJECT_APPEAL_HANDLING_OPINION_MAX_LENGTH)
  handlingOpinion!: string;

  @IsOptional()
  @Transform(({ value }) => trim(value))
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  newFinalLevel?: string;
}
