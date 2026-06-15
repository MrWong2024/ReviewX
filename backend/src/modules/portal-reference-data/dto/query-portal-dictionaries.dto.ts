import { Transform } from 'class-transformer';
import { IsOptional, IsString } from 'class-validator';
import {
  QueryPortalCommonDto,
  splitCommaSeparatedStrings,
  trimOptional,
} from './query-portal-common.dto';

export class QueryPortalDictionariesDto extends QueryPortalCommonDto {
  @IsOptional()
  @Transform(({ value }) => trimOptional(value))
  @IsString()
  dictType?: string;

  @IsOptional()
  @Transform(({ value }) => splitCommaSeparatedStrings(value))
  @IsString({ each: true })
  dictTypes?: string[];
}
