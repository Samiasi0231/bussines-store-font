import {
  IsString,
  IsOptional,
  IsArray,
  IsEmail,
  IsPhoneNumber,
  IsUrl,
  IsUUID,
} from 'class-validator';
import { TransformToArray } from '../../@common/decorators/array-transformer.decorator';
import { UUID } from 'crypto';
import { PaginationDTO } from '../../@common/dtos/pagination.dto';

export class CreateStorefrontDTO {
  @IsString()
  slug: string;

  @IsOptional()
  @IsUrl()
  logo?: string;

  @IsOptional()
  @IsUrl()
  banner?: string;

  @IsOptional()
  @IsString()
  aboutUs?: string;

  @IsOptional()
  @IsString()
  refundPolicy?: string;

  @IsOptional()
  @IsString()
  termsOfUse?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsPhoneNumber()
  phone?: string;

  @IsOptional()
  @IsArray()
  @IsUrl({}, { each: true })
  socialHandles?: string[];
}

export class GetStorefrontsDTO extends PaginationDTO {
  @TransformToArray()
  @IsOptional()
  @IsArray()
  @IsUUID(null, { each: true })
  store?: UUID[];

  @IsOptional()
  @TransformToArray()
  @IsArray()
  @IsUUID(null, { each: true })
  business?: UUID[];

  @IsOptional()
  @TransformToArray()
  @IsArray()
  @IsString({ each: true })
  slug?: string[];
}

export class EditStorefrontDTO {
  @IsOptional()
  @IsUrl()
  logo?: string;

  @IsOptional()
  @IsUrl()
  banner?: string;

  @IsOptional()
  @IsString()
  aboutUs?: string;

  @IsOptional()
  @IsString()
  refundPolicy?: string;

  @IsOptional()
  @IsString()
  termsOfUse?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsPhoneNumber()
  phone?: string;

  @IsOptional()
  @IsArray()
  @IsUrl({}, { each: true })
  socialHandles?: string[];
}
