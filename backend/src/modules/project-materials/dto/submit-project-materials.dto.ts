import { IsArray, IsMongoId, IsOptional } from 'class-validator';

export class SubmitProjectMaterialsDto {
  @IsOptional()
  @IsArray()
  @IsMongoId({ each: true })
  materialIds?: string[];
}
