import { Transform } from 'class-transformer';
import { ArrayMinSize, IsArray, IsMongoId } from 'class-validator';
import { ensureUniqueStrings } from '../../../common/utils/mongo-query';
import { UpdateReviewAssignmentDto } from './update-review-assignment.dto';

function uniqueStrings(value: unknown): unknown {
  if (!Array.isArray(value)) {
    return value;
  }

  return ensureUniqueStrings(
    value.filter((item): item is string => typeof item === 'string'),
  );
}

export class BatchUpdateReviewAssignmentDto extends UpdateReviewAssignmentDto {
  @Transform(({ value }) => uniqueStrings(value))
  @IsArray()
  @ArrayMinSize(1)
  @IsMongoId({ each: true })
  projectIds!: string[];
}
