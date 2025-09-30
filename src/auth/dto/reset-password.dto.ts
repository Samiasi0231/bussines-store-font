import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class ResetPasswordDto {
  @IsNotEmpty()
  @IsString()
  otp: string;

  @IsString()
  @IsNotEmpty()
  identifier: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(6)
  newPassword: string;
}
