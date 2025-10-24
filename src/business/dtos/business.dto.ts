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
import { Type } from 'class-transformer';
import { TransformToBoolean } from '../../@common/decorators/boolean-transformer.decorator';

export class GetBusinessesQueryDTO extends PaginationDTO {
  @IsNotEmpty()
  @IsString()
  @IsOptional()
  cacNumber?: string;

  @TransformToBoolean()
  @IsBoolean()
  @IsOptional()
  forCurrUser = true;
}

export class AddBusinessesDTO {
  //TODO: remove
  @IsOptional()
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
