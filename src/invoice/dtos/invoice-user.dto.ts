import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';
import { IsE164PhoneNumber } from '../../@common/decorators/is-e164-phone-number.decorator';
import { PaginationDTO } from '../../@common/dtos/pagination.dto';
import { UUID } from 'crypto';

export class CreateInvoiceUserDTO {
  @IsOptional()
  @IsEmail()
  email: string;

  @IsUUID()
  businessId: UUID;

  @IsString()
  @IsNotEmpty()
  firstName: string;

  @IsString()
  @IsNotEmpty()
  lastName: string;

  @IsNotEmpty()
  @IsE164PhoneNumber({
    message: i18nValidationMessage(
      'validation.INVALID_E164_PHONE_NUMBER_ERROR',
    ),
  })
  phone: string;
}

export class GetInvoiceUsersDTO extends PaginationDTO {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @IsString()
  email: string;

  @IsOptional()
  @IsString()
  phone: string;

  @IsOptional()
  @IsUUID()
  businessId: UUID;
}
