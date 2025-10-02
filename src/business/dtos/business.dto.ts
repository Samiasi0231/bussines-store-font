import {
  IsNotEmpty,
  IsString,
  IsOptional,
  ValidateNested,
  IsBoolean,
  IsUrl,
} from 'class-validator';
import { PaginationDTO } from '../../@common/dtos/pagination.dto';
import { AddressDTO } from '../../kyc/dtos/address.dto';
import { Transform, Type } from 'class-transformer';

export class GetBusinessesQueryDTO extends PaginationDTO {
  @IsNotEmpty()
  @IsString()
  @IsOptional()
  cacNumber?: string;

  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.toLowerCase() === 'true';
    }
    return Boolean(value);
  })
  @IsBoolean()
  @IsOptional()
  forCurrUser = true;
}

export class AddBusinessesDTO {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsString()
  @IsOptional()
  cacNumber?: string;

  @IsNotEmpty()
  @IsString()
  description: string;

  @IsNotEmpty()
  @IsUrl()
  @IsOptional()
  logo?: string;

  @IsNotEmpty()
  @ValidateNested()
  @Type(() => AddressDTO)
  address: AddressDTO;
}
