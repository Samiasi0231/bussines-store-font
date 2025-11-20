import {
  IsInt,
  IsUUID,
  IsEnum,
  IsString,
  IsNotEmpty,
  IsObject,
  IsOptional,
  Min,
  IsArray,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  TransactionPurpose,
  TransactionChannel,
} from '../../@common/constants/transaction.constant';
import { UUID } from 'crypto';
import {
  TransactionStatus,
  TransactionType,
} from '../../entities/transaction.entity';
import { TransformToArray } from '../../@common/decorators/array-transformer.decorator';
import { PaginationDTO } from '../../@common/dtos/pagination.dto';

export class CreditTransactionDTO {
  @Type(() => Number)
  @IsInt()
  @Min(0)
  amount: number;

  @IsUUID()
  walletId: UUID;

  @IsEnum(TransactionPurpose)
  purpose: TransactionPurpose;

  @IsEnum(TransactionChannel)
  channel: TransactionChannel;

  @IsString()
  @IsNotEmpty()
  narration: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}

export class CreditBusinessWalletDTO
  implements Omit<CreditTransactionDTO, 'walletId'>
{
  @Type(() => Number)
  @IsInt()
  @Min(1)
  amount: number;

  @IsEnum(TransactionPurpose)
  purpose: TransactionPurpose;

  @IsEnum(TransactionChannel)
  channel: TransactionChannel;

  @IsString()
  @IsNotEmpty()
  narration: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;

  @IsUUID()
  businessId: UUID;
}

export class GetTransactionByReferenceDTO {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  reference: string;
}

export class GetTransactionsDTO extends PaginationDTO {
  @IsOptional()
  @IsArray()
  @TransformToArray()
  @IsString({ each: true })
  sort: string[];

  @IsOptional()
  @TransformToArray((value) => value.toLowerCase())
  @IsArray()
  @IsEnum(TransactionType, { each: true })
  type: TransactionType[];

  @IsOptional()
  @TransformToArray((value) => value.toLowerCase())
  @IsArray()
  @IsEnum(TransactionStatus, { each: true })
  status: TransactionStatus[];

  @IsOptional()
  @IsUUID()
  wallet: UUID;
}
