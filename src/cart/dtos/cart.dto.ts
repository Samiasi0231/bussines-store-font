import {
  IsUUID,
  IsInt,
  Min,
  IsOptional,
  ValidateNested,
  IsString,
  IsNotEmpty,
  IsEnum,
} from 'class-validator';
import { Type } from 'class-transformer';
import { UUID } from 'crypto';
import { AddressDTO } from '../../kyc/dtos/address.dto';
import { PaymentMethod } from '../../@common/constants/payment.constant';
import { MutuallyExclusive } from '../../@common/validators/mutually-exclusive.validator';

export class AddCartItemDTO {
  @IsUUID()
  productId: UUID;

  @IsOptional()
  @IsUUID()
  productVariantId?: UUID;

  @IsInt()
  @Min(1)
  quantity: number;
}

export class UpdateCartItemDTO {
  @IsUUID()
  cartItemId: UUID;

  @IsInt()
  @Min(1)
  quantity: number;
}

export class RemoveCartItemDTO {
  @IsUUID()
  cartItemId: UUID;
}

export class ShippingAddressDTO {
  @MutuallyExclusive(['address', 'addressId'])
  _exclusiveCheck?: any;

  @IsOptional()
  @ValidateNested()
  @Type(() => AddressDTO)
  address?: AddressDTO;

  @IsOptional()
  @IsUUID()
  addressId?: UUID;
}

export class PaymentDataDTO {
  @IsEnum(PaymentMethod)
  method: PaymentMethod;

  @IsString()
  @IsNotEmpty()
  reference: string;

  @IsString()
  @IsNotEmpty()
  redirectUrl: string;
}

export class CheckoutCartDTO {
  @IsOptional()
  @IsUUID()
  couponId?: UUID;

  @IsOptional()
  @IsString()
  note?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  email?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @ValidateNested()
  @Type(() => ShippingAddressDTO)
  shippingAddress?: ShippingAddressDTO;

  @ValidateNested()
  @Type(() => PaymentDataDTO)
  paymentData: PaymentDataDTO;
}

