import { IsBoolean, IsOptional, IsString, MinLength } from 'class-validator';

export class ResetAdminUserPasswordDto {
  @IsOptional()
  @IsString()
  @MinLength(6)
  password?: string;

  @IsOptional()
  @IsBoolean()
  mustChangePassword?: boolean;
}
