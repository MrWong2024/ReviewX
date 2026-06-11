import { Transform } from 'class-transformer';
import { ArrayMinSize, IsArray, IsMongoId } from 'class-validator';
import { ensureUniqueStrings } from '../../../common/utils/mongo-query';

function uniqueStrings(value: unknown): unknown {
  if (!Array.isArray(value)) {
    return value;
  }

  return ensureUniqueStrings(
    value.filter((item): item is string => typeof item === 'string'),
  );
}

export class AppendProjectExpertsDto {
  @Transform(({ value }) => uniqueStrings(value))
  @IsArray()
  @ArrayMinSize(1)
  @IsMongoId({ each: true })
  expertUserIds!: string[];
}
