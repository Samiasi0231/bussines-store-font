import { IsNotEmpty, IsOptional, IsString, IsUrl } from 'class-validator';

export class AddressDTO {
  @IsString()
  @IsNotEmpty()
  state: string;

  @IsString()
  @IsNotEmpty()
  country: string;

  @IsString()
  @IsOptional()
  city: string;

  @IsString()
  @IsNotEmpty()
  lga: string;

  @IsString()
  @IsNotEmpty()
  street: string;

  @IsNotEmpty()
  buildingNumber: string;
}
export class AddressVerificationDTO extends AddressDTO {
  @IsUrl()
  @IsNotEmpty()
  utilityBill: string;

  @IsString()
  @IsNotEmpty()
  utilityBillType: string;
}
