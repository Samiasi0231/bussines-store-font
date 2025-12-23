import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';
import { UUID } from 'crypto';

export class CACLookupQueryDTO {
  @IsNotEmpty()
  @IsString()
  regNumber: string;

  @IsOptional()
  @IsUUID()
  companyType: UUID;

  @IsOptional()
  @IsString()
  country: string;
}
