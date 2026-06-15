import { Transform } from 'class-transformer';
import { IsOptional, IsString } from 'class-validator';
import {
  QueryPortalCommonDto,
  splitCommaSeparatedStrings,
  trimOptional,
} from './query-portal-common.dto';

export class QueryPortalTreeDictionariesDto extends QueryPortalCommonDto {
  @IsOptional()
  @Transform(({ value }) => trimOptional(value))
  @IsString()
  treeType?: string;

  @IsOptional()
  @Transform(({ value }) => splitCommaSeparatedStrings(value))
  @IsString({ each: true })
  treeTypes?: string[];
}
