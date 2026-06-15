import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional, IsString } from 'class-validator';

export function trimOptional(value: unknown): unknown {
  return typeof value === 'string' ? value.trim() : value;
}

export function toOptionalBoolean(value: unknown): unknown {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  if (value === true || value === 'true') {
    return true;
  }

  if (value === false || value === 'false') {
    return false;
  }

  return value;
}

export function splitCommaSeparatedStrings(value: unknown): unknown {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  if (Array.isArray(value)) {
    return value.flatMap((item) =>
      typeof item === 'string' ? splitCommaSeparatedString(item) : [],
    );
  }

  if (typeof value === 'string') {
    return splitCommaSeparatedString(value);
  }

  return value;
}

function splitCommaSeparatedString(value: string): string[] {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

export class QueryPortalCommonDto {
  @IsOptional()
  @Transform(({ value }) => trimOptional(value))
  @IsString()
  keyword?: string;

  @IsOptional()
  @Transform(({ value }) => toOptionalBoolean(value))
  @IsBoolean()
  isActive?: boolean;
}
