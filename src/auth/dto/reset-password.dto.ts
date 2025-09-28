import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class ResetPasswordDto {
  @IsNotEmpty()
  @IsString()
  otp: string;

  @IsString()
  @IsNotEmpty()
  phone: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(6)
  newPassword: string;
}
