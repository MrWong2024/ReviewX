import { Transform } from 'class-transformer';
import { IsOptional, IsString } from 'class-validator';
import { ListFilterQueryDto } from '../../../common/dto/pagination-query.dto';

function trim(value: unknown): unknown {
  return typeof value === 'string' ? value.trim() : value;
}

export class QueryDictionariesDto extends ListFilterQueryDto {
  @IsOptional()
  @Transform(({ value }) => trim(value))
  @IsString()
  dictType?: string;
}
