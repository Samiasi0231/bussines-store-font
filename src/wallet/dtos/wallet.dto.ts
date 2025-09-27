import { Transform } from 'class-transformer';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { PaginationDTO } from '../../@common/dtos/pagination.dto';

export class SetTransactionPinDTO {
  @IsString()
  @IsNotEmpty()
  pin: string;

  @IsString()
  @IsNotEmpty()
  otp: string;
}

export class GetWalletsQueryDTO extends PaginationDTO {
  @Transform(({ value }) => value?.toLowerCase())
  @IsOptional()
  @IsString()
  type?: string;
}
