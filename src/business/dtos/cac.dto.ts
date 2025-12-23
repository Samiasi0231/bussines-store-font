import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CACLookupQueryDTO {
  @IsNotEmpty()
  @IsString()
  regNumber: string;

  @IsOptional()
  @IsString()
  companyType: string;

  @IsOptional()
  @IsString()
  country: string;
}
