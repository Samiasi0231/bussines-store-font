import { IsNotEmpty, IsString, IsUrl } from 'class-validator';

export class AddressVerificationDTO {
  @IsString()
  @IsNotEmpty()
  state: string;

  @IsString()
  @IsNotEmpty()
  country: string;

  @IsString()
  city: string;

  @IsString()
  @IsNotEmpty()
  lga: string;

  @IsString()
  @IsNotEmpty()
  street: string;

  @IsString()
  @IsNotEmpty()
  buildingNumber: string;

  @IsUrl()
  @IsNotEmpty()
  utilityBill: string;
}
