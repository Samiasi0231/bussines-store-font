import {
  IsString,
  IsOptional,
  IsEmail,
  IsDateString,
  IsBase64,
  IsNotEmpty,
} from 'class-validator';

export class UpdateUserProfileDTO {
  @IsString()
  @IsOptional()
  otherName: string;

  @IsEmail()
  @IsOptional()
  email: string;

  @IsNotEmpty()
  @IsDateString({ strict: false })
  dateOfBirth: Date;

  @IsBase64()
  @IsOptional()
  avatar?: string;
}

export class EditUserProfileDTO {
  @IsBase64()
  @IsOptional()
  avatar: string;
}
