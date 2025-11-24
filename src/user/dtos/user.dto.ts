import {
  IsString,
  IsOptional,
  IsDateString,
  IsBase64,
  IsNotEmpty,
  IsEnum,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Gender } from '../../@common/constants/gender.constant';
import { IsE164PhoneNumber } from '../../@common/decorators/is-e164-phone-number.decorator';
import { i18nValidationMessage } from 'nestjs-i18n';
import { Transform } from 'class-transformer';

export class UpdateUserProfileDTO {
  @ApiProperty({
    description: 'First name',
    example: 'John',
    minLength: 1,
    maxLength: 100,
  })
  @Transform(({ value }) =>
    typeof value === 'string' ? value.toLowerCase() : value,
  )
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({
    description: 'Last name',
    example: 'Doe',
    minLength: 1,
    maxLength: 100,
  })
  @Transform(({ value }) =>
    typeof value === 'string' ? value.toLowerCase() : value,
  )
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @ApiPropertyOptional({
    description: 'Other name (middle name)',
    example: 'Michael',
    maxLength: 100,
  })
  @Transform(({ value }) =>
    typeof value === 'string' ? value.toLowerCase() : value,
  )
  @IsString()
  @IsOptional()
  otherName: string;

  @ApiProperty({
    description: 'Phone number in E.164 format',
    example: '+2348012345678',
  })
  @IsNotEmpty()
  @IsE164PhoneNumber({
    message: i18nValidationMessage(
      'validation.INVALID_E164_PHONE_NUMBER_ERROR',
    ),
  })
  phoneNumber: string;

  @ApiProperty({
    description: 'Gender',
    enum: Gender,
    example: Gender.MALE,
  })
  @IsEnum(Gender)
  gender: Gender;

  @ApiProperty({
    description: 'Date of birth',
    example: '1990-01-01',
    type: 'string',
    format: 'date',
  })
  @IsNotEmpty()
  @IsDateString({ strict: false })
  dateOfBirth: Date;

  @ApiPropertyOptional({
    description: 'Avatar image in base64 format',
    example: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...',
  })
  @IsBase64()
  @IsOptional()
  avatar?: string;
}

export class EditUserProfileDTO {
  @ApiPropertyOptional({
    description: 'Avatar image in base64 format',
    example: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...',
  })
  @IsBase64()
  @IsOptional()
  avatar: string;
}
