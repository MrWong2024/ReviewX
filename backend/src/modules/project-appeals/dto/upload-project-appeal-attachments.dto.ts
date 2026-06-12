import { Transform } from 'class-transformer';
import { IsOptional, IsString, MaxLength } from 'class-validator';
import { PROJECT_APPEAL_REMARK_MAX_LENGTH } from '../constants/project-appeal.constants';

function trim(value: unknown): unknown {
  return typeof value === 'string' ? value.trim() : value;
}

export class UploadProjectAppealAttachmentsDto {
  @IsOptional()
  @Transform(({ value }) => trim(value))
  @IsString()
  @MaxLength(PROJECT_APPEAL_REMARK_MAX_LENGTH)
  remark?: string;
}
