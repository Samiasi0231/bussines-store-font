import {
  IsArray,
  ValidateNested,
  IsOptional,
  IsUUID,
  IsInt,
  Min,
  IsEmail,
  IsString,
  IsNotEmpty,
  IsEnum,
  IsIn,
} from 'class-validator';
import { Type } from 'class-transformer';
import { AddressDTO } from '../../kyc/dtos/address.dto';
import { UUID } from 'crypto';
import { PaymentMethod } from '../../@common/constants/payment.constant';
import { OrderStatus } from '../../entities/order.entity';
import { MutuallyExclusive } from '../../@common/validators/mutually-exclusive.validator';
import { PaginationDTO } from '../../@common/dtos/pagination.dto';
import { TransformToLowerCase } from '../../@common/decorators/case-transformer.decorator';

class OrderItemDTO {
  @IsUUID()
  productId: UUID;

  @IsOptional()
  @IsUUID()
  productVariantId?: UUID;

  @IsOptional()
  @IsUUID()
  couponId?: UUID;

  @IsInt()
  @Min(1)
  quantity: number;
}

export class ShippinAddressDTO {
  @MutuallyExclusive('address', 'addressId')
  _exclusiveCheck?: any;

  @IsOptional()
  @ValidateNested()
  @Type(() => AddressDTO)
  address: AddressDTO;

  @IsOptional()
  @IsUUID()
  addressId: UUID;
}

export class CreateOrderDTO {
  @MutuallyExclusive('userId', 'email')
  _exclusiveCheck: any;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDTO)
  items: OrderItemDTO[];

  @IsOptional()
  @IsUUID()
  couponId?: UUID;

  @IsOptional()
  @IsUUID()
  userId?: UUID;

  @IsOptional()
  @IsString()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  note?: string;

  @ValidateNested()
  @Type(() => ShippinAddressDTO)
  shippingAddress: ShippinAddressDTO;

  @TransformToLowerCase()
  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;
}

export class updateOrderStatusDTO {
  @IsIn(OrderStatus)
  status: OrderStatus;
}

export class GetOrdersDTO extends PaginationDTO {
  @IsOptional()
  @IsNotEmpty()
  @IsString()
  userId?: UUID;
}
