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
  IsBoolean,
  ValidateIf,
} from 'class-validator';
import { Type } from 'class-transformer';
import { AddressDTO } from '../../kyc/dtos/address.dto';
import { UUID } from 'crypto';
import { PaymentMethod } from '../../@common/constants/payment.constant';
import { OrderStatus } from '../../entities/order.entity';
import { MutuallyExclusive } from '../../@common/validators/mutually-exclusive.validator';
import { PaginationDTO } from '../../@common/dtos/pagination.dto';
import { TransformToLowerCase } from '../../@common/decorators/case-transformer.decorator';
import { TransformToArray } from '../../@common/decorators/array-transformer.decorator';
import { IsDateFilterList } from '../../@common/validators/date.validator';
import { IsNumericRange } from '../../@common/validators/numeric-filter.validator';
import { IsE164PhoneNumber } from '../../@common/decorators/is-e164-phone-number.decorator';
import { TransformToBoolean } from '../../@common/decorators/boolean-transformer.decorator';

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

export class ShippingAddressDTO {
  @MutuallyExclusive(['address', 'addressId'])
  _exclusiveCheck?: any;

  @IsOptional()
  @ValidateNested()
  @Type(() => AddressDTO)
  address: AddressDTO;

  @IsOptional()
  @IsUUID()
  addressId: UUID;
}

export class InStoreOrderDTO {
  @IsOptional()
  @IsEmail()
  email: string;

  @IsOptional()
  @IsE164PhoneNumber()
  phone: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => AddressDTO)
  address: AddressDTO;
}

export class PaymentDataDTO {
  @TransformToLowerCase()
  @IsEnum(PaymentMethod)
  method: PaymentMethod;

  @ValidateIf((object) => object.method === PaymentMethod.CHECKOUT)
  @IsString()
  @IsNotEmpty()
  reference: string;
}

export class CreateOrderDTO {
  @ValidateIf((object) => object.inStoreOrder === true)
  @MutuallyExclusive(['userId', 'email', 'inStoreOrder'])
  _exclusiveCheck: any;

  @MutuallyExclusive(['inStoreOrder', 'shippingAddress'])
  _exclusiveCheck2: any;

  @ValidateIf((object) => object.inStoreOrder === false)
  @MutuallyExclusive(['userId', 'email'])
  _exclusiveCheck3: any;

  @ValidateIf((object) => object.inStoreOrder === true)
  @ValidateNested()
  @Type(() => InStoreOrderDTO)
  inStoreOrderData: InStoreOrderDTO;

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
  @IsUUID()
  cartId?: UUID;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  note?: string;

  @ValidateNested()
  @Type(() => ShippingAddressDTO)
  shippingAddress?: ShippingAddressDTO;

  @ValidateNested()
  @Type(() => PaymentDataDTO)
  paymentData: PaymentDataDTO;

  @IsOptional()
  @TransformToBoolean()
  @IsBoolean()
  inStoreOrder: boolean;
}

export class updateOrderStatusDTO {
  @IsIn(OrderStatus)
  status: OrderStatus;
}

export class GetOrdersDTO extends PaginationDTO {
  @IsOptional()
  @TransformToArray()
  @IsArray()
  @IsUUID(null, { each: true })
  user: UUID[];

  @TransformToArray()
  @IsOptional()
  @IsArray()
  @IsIn(OrderStatus, { each: true })
  status: OrderStatus[];

  @TransformToArray()
  @IsOptional()
  @IsArray()
  @IsUUID(null, { each: true })
  business: UUID[];

  @IsOptional()
  @IsArray()
  @TransformToArray()
  @IsString({ each: true })
  sort: string[];

  @IsOptional()
  @IsDateFilterList()
  @IsArray()
  @TransformToArray()
  @IsString({ each: true })
  date: string[];

  @IsNumericRange()
  totalAmount: string;

  @IsNumericRange()
  discountAmount: string;

  @IsNumericRange()
  subtotal: string;

  @IsOptional()
  @TransformToBoolean()
  @IsBoolean()
  inStoreOrder: boolean;
}
