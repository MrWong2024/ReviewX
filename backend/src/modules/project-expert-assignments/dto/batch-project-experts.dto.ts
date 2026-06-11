import { Transform } from 'class-transformer';
import { ArrayMinSize, IsArray, IsIn, IsMongoId } from 'class-validator';
import { ensureUniqueStrings } from '../../../common/utils/mongo-query';

export const BATCH_PROJECT_EXPERT_MODES = ['replace', 'append'] as const;
export type BatchProjectExpertMode =
  (typeof BATCH_PROJECT_EXPERT_MODES)[number];

function uniqueStrings(value: unknown): unknown {
  if (!Array.isArray(value)) {
    return value;
  }

  return ensureUniqueStrings(
    value.filter((item): item is string => typeof item === 'string'),
  );
}

export class BatchProjectExpertsDto {
  @Transform(({ value }) => uniqueStrings(value))
  @IsArray()
  @ArrayMinSize(1)
  @IsMongoId({ each: true })
  projectIds!: string[];

  @Transform(({ value }) => uniqueStrings(value))
  @IsArray()
  @IsMongoId({ each: true })
  expertUserIds!: string[];

  @IsIn(BATCH_PROJECT_EXPERT_MODES)
  mode!: BatchProjectExpertMode;
}
