import {
  IsString,
  IsOptional,
  IsDateString,
  IsBase64,
  IsNotEmpty,
  IsIn,
} from 'class-validator';
import { Gender } from '../../@common/constants/gender.constant';
import { IsE164PhoneNumber } from '../../@common/decorators/is-e164-phone-number.decorator';
import { i18nValidationMessage } from 'nestjs-i18n';
import { Transform } from 'class-transformer';

export class UpdateUserProfileDTO {
  @Transform(({ value }) =>
    typeof value === 'string' ? value.toLowerCase() : value,
  )
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @Transform(({ value }) =>
    typeof value === 'string' ? value.toLowerCase() : value,
  )
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @Transform(({ value }) =>
    typeof value === 'string' ? value.toLowerCase() : value,
  )
  @IsString()
  @IsOptional()
  otherName: string;

  @IsNotEmpty()
  @IsE164PhoneNumber({
    message: i18nValidationMessage(
      'validation.INVALID_E164_PHONE_NUMBER_ERROR',
    ),
  })
  phoneNumber: string;

  @IsIn(Object.values(Gender))
  gender: Gender;

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
