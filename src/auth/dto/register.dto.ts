import { IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';
import { IsE164PhoneNumber } from '../../@common/decorators/is-e164-phone-number.decorator';
import { i18nValidationMessage } from 'nestjs-i18n';

export class SignupDTO {
  @IsNotEmpty()
  @IsString()
  firstName: string;

  @IsOptional()
  @IsString()
  otherName?: string;

  @IsNotEmpty()
  @IsString()
  lastName: string;

  @IsNotEmpty()
  @IsE164PhoneNumber({
    message: i18nValidationMessage(
      'validation.INVALID_E164_PHONE_NUMBER_ERROR',
    ),
  })
  phoneNumber: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(6)
  password: string;

  @IsNotEmpty()
  @IsString()
  otp: string;
}
