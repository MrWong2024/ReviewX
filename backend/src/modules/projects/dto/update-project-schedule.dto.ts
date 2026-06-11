import { Transform, Type } from 'class-transformer';
import { IsDate, IsOptional, IsString, MaxLength } from 'class-validator';

function trim(value: unknown): unknown {
  return typeof value === 'string' ? value.trim() : value;
}

export class UpdateProjectScheduleDto {
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  reviewTime?: Date;

  @IsOptional()
  @Transform(({ value }) => trim(value))
  @IsString()
  @MaxLength(200)
  reviewLocation?: string;

  @IsOptional()
  @Transform(({ value }) => trim(value))
  @IsString()
  @MaxLength(500)
  meetingUrl?: string;
}
