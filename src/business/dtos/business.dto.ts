import {
  IsNotEmpty,
  IsString,
  IsOptional,
  ValidateNested,
  IsBoolean,
  IsUrl,
  IsArray,
  IsEnum,
  ValidateIf,
  IsNumber,
  IsEmail,
} from 'class-validator';
import { PaginationDTO } from '../../@common/dtos/pagination.dto';
import { AddressDTO } from '../../kyc/dtos/address.dto';
import { Type } from 'class-transformer';
import { TransformToBoolean } from '../../@common/decorators/boolean-transformer.decorator';
import { BusinessType } from '../../@common/constants/business-type.contant';

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

export class PersonDTO {
  @IsNotEmpty() @IsString() surname: string;
  @IsNotEmpty() @IsString() firstName: string;
  @IsOptional() @IsString() otherName?: string;
  @IsOptional() @IsString() dateOfBirth?: string;
  @IsOptional() @IsString() gender?: string;
  @IsOptional() @IsString() nationality?: string;
  @IsNotEmpty() @IsString() phoneNumber: string;
  @IsOptional() @IsEmail() email?: string;

  @ValidateNested()
  @Type(() => AddressDTO)
  @IsOptional()
  contactAddress?: AddressDTO;

  @IsOptional() @IsString() idType?: string;
  @IsOptional() @IsString() idNumber?: string;
  @IsOptional() @IsUrl() idDocumentUrl?: string;
}

export class ShareholderDTO extends PersonDTO {
  @IsNotEmpty()
  @IsNumber()
  sharesAllotted: number;
}

export class TrusteeDTO extends PersonDTO {}

export class TrusteeListDTO {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TrusteeDTO)
  trustees: TrusteeDTO[];
}

export class AddBusinessesDTO {
  @IsOptional()
  @IsEnum(BusinessType)
  businessType?: BusinessType;

  @IsOptional()
  @IsString()
  cacNumber?: string;

  @IsOptional()
  @IsString()
  proposedName1?: string;

  @IsOptional()
  @IsString()
  proposedName2?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsUrl()
  logo?: string;

   @IsOptional()
  @IsUrl()
  cacCertificateUrl?: string; 

  @IsOptional()
  @IsUrl()
  statusReportUrl?: string;

  @ValidateIf((o) => !!o.address)
  @ValidateNested()
  @Type(() => AddressDTO)
  @IsOptional()
  address?: AddressDTO;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  objectsOfMemorandum?: string[];

  @ValidateIf((o) => o.businessType === BusinessType.LIMITED_LIABILITY)
  @ValidateNested()
  @Type(() => PersonDTO)
  @IsOptional()
  witness?: PersonDTO;

  @ValidateIf((o) => o.businessType === BusinessType.LIMITED_LIABILITY)
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PersonDTO)
  @IsOptional()
  directors?: PersonDTO[];

  @ValidateIf((o) => o.businessType === BusinessType.LIMITED_LIABILITY)
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ShareholderDTO)
  @IsOptional()
  shareholders?: ShareholderDTO[];

  @ValidateIf((o) => o.businessType === BusinessType.NGO)
  @ValidateNested()
  @Type(() => TrusteeListDTO)
  @IsOptional()
  trustees?: TrusteeListDTO;

  @ValidateIf((o) => o.businessType === BusinessType.NGO)
  @IsOptional()
  @IsString()
  trusteesTenure?: string;

  @ValidateIf((o) => o.businessType === BusinessType.NGO)
  @IsOptional()
  @IsString()
  ngoPhone?: string;

  @ValidateIf((o) => o.businessType === BusinessType.NGO)
  @IsOptional()
  @IsEmail()
  ngoEmail?: string;

  @IsOptional()
  @IsBoolean()
  useCacAddress?: boolean;

  @IsOptional()
  @IsUrl()
  utilityBill?: string;

  @IsOptional()
  @IsString()
  utilityBillType?: string;
}
