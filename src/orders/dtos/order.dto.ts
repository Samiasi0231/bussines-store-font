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
  ValidateIf,
} from 'class-validator';
import { Type } from 'class-transformer';
import { AddressDTO } from '../../kyc/dtos/address.dto';
import { UUID } from 'crypto';
import { PaymentMethod } from '../../@common/constants/payment.constant';
import { OrderStatus } from '../../entities/order.entity';
import { MutuallyExclusive } from '../../@common/validators/mutually-exclusive.validator';

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
  @ValidateIf((req) => !req.addressId || (req.address && req.addressId))
  @ValidateNested()
  @Type(() => AddressDTO)
  address: AddressDTO;

  @IsOptional()
  @ValidateIf((req) => !req.address || (req.address && req.addressId))
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

  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;
}

export class updateOrderStatusDTO {
  @IsIn(OrderStatus)
  status: OrderStatus;
}
