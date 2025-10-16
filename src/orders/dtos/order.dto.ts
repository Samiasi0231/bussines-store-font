import {
  IsArray,
  ValidateNested,
  IsOptional,
  IsUUID,
  IsInt,
  Min,
  IsEmail,
  IsString,
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  IsNotEmpty,
  IsEnum,
  IsIn,
} from 'class-validator';
import { Type } from 'class-transformer';
import { AddressDTO } from '../../kyc/dtos/address.dto';
import { UUID } from 'crypto';
import { PaymentMethod } from '../../@common/constants/payment.constant';
import { OrderStatus } from '../../entities/order.entity';

//TODO: Turn to shared reusable function
@ValidatorConstraint({ async: false })
export class UserIdOrEmailExclusiveConstraint
  implements ValidatorConstraintInterface
{
  validate(_: any, args: ValidationArguments) {
    const obj = args.object as any;
    const hasUserId = !!obj.userId;
    const hasEmail = !!obj.email;

    return hasUserId !== hasEmail;
  }

  defaultMessage() {
    return 'Exactly one of userId or email must be provided';
  }
}

export function UserIdOrEmailExclusive(validationOptions?: ValidationOptions) {
  return function (object: any, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions,
      constraints: [],
      validator: UserIdOrEmailExclusiveConstraint,
    });
  };
}

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

export class CreateOrderDTO {
  @UserIdOrEmailExclusive()
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

  //TODO: add support for selecting from existing shipping addresses
  @ValidateNested()
  @Type(() => AddressDTO)
  shippingAddress: AddressDTO;

  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;
}

export class updateOrderStatusDTO {
  @IsIn(OrderStatus)
  status: OrderStatus;
}
