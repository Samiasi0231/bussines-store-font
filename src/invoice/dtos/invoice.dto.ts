import {
  IsUUID,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsNumber,
  IsDateString,
  IsArray,
  ValidateNested,
  IsString,
  IsInt,
  Min,
  IsIn,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PaymentMethod } from '../../@common/constants/payment.constant';
import { DiscountType } from '../../entities/coupon.entity';
import { UUID } from 'crypto';
import { Currency } from '../../@common/constants/currency.constant';
import { PaginationDTO } from '../../@common/dtos/pagination.dto';
import { TransformToArray } from '../../@common/decorators/array-transformer.decorator';
import { IsDateFilterList } from '../../@common/validators/date.validator';
import { TransformToLowerCase } from '../../@common/decorators/case-transformer.decorator';
import { InvoiceStatus } from '../../entities/invoice.entity';

class InvoiceItemDTO {
  @IsUUID()
  productId: UUID;

  @IsInt()
  @Min(1)
  quantity: number;
}

export class CreateInvoiceDTO {
  @IsUUID()
  @IsNotEmpty()
  businessId: UUID;

  @IsUUID()
  @IsNotEmpty()
  userId: UUID;

  @IsOptional()
  @IsEnum(Currency)
  currency?: Currency;

  @IsDateString()
  @IsOptional()
  issuedAt?: Date;

  @IsDateString()
  @IsOptional()
  dueDate?: Date;

  @TransformToLowerCase()
  @IsEnum(PaymentMethod)
  @IsOptional()
  paymentMethod?: PaymentMethod;

  @TransformToLowerCase()
  @IsEnum(DiscountType)
  @IsOptional()
  discountType?: DiscountType;

  @IsNumber()
  @IsOptional()
  @Min(0)
  discountValue?: number;

  @IsString()
  @IsOptional()
  note?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => InvoiceItemDTO)
  items?: InvoiceItemDTO[];
}

export class GetInvoicesDTO extends PaginationDTO {
  @IsOptional()
  @TransformToArray()
  @IsUUID(null, { each: true })
  business?: UUID[];

  @IsOptional()
  @TransformToArray()
  @IsUUID(null, { each: true })
  user?: UUID[];

  @IsOptional()
  @IsDateFilterList()
  @IsArray()
  @TransformToArray()
  @IsString({ each: true })
  issuedAt: string[];

  @IsOptional()
  @IsDateFilterList()
  @IsArray()
  @TransformToArray()
  @IsString({ each: true })
  dueDate: string[];

  @IsOptional()
  @IsArray()
  @TransformToArray()
  @IsString({ each: true })
  sort: string[];
}

export class updateInvoiceStatusDTO {
  @TransformToLowerCase()
  @IsIn(InvoiceStatus)
  status: InvoiceStatus;
}
