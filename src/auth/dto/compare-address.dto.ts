import { IsNotEmpty, IsString, IsOptional } from 'class-validator';

export class CompareAddressDTO {
  @IsString()
  @IsNotEmpty()
  cacNumber: string;

  @IsString()
  @IsOptional()
  companyType?: string;
}

export type AddressComparisonResult = {
  cacAddress: {
    state: string;
    city: string;
    lga: string;
    address: string;
  };
  userAddress: {
    state: string;
    city: string;
    lga: string;
    street: string;
    buildingNumber: string;
    country: string;
  } | null;
  matches: {
    state: boolean;
    city: boolean;
    lga: boolean;
    overall: boolean;
  };
};

