import {
  IsString,
  IsOptional,
  IsEnum,
  IsPositive,
  IsUUID,
  IsDateString,
  IsInt,
  Min,
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { DiscountType } from '../../entities/coupon.entity';
import { Type } from 'class-transformer';
import { UUID } from 'crypto';
import { PaginationDTO } from '../../@common/dtos/pagination.dto';

@ValidatorConstraint({ async: false })
export class ProductOrBusinessExclusiveConstraint
  implements ValidatorConstraintInterface
{
  validate(_: any, args: ValidationArguments) {
    const obj = args.object as any;
    const hasProduct = !!obj.productId;
    const hasBusiness = !!obj.businessId;

    return hasProduct !== hasBusiness;
  }

  defaultMessage() {
    return 'Exactly one of productId or businessId must be provided';
  }
}

export function ProductOrBusinessExclusive(
  validationOptions?: ValidationOptions,
) {
  return function (object: any, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions,
      constraints: [],
      validator: ProductOrBusinessExclusiveConstraint,
    });
  };
}

export class CreateCouponDTO {
  @IsString()
  code: string;

  @IsOptional()
  @IsString()
  description?: string;

  @ProductOrBusinessExclusive()
  @IsEnum(DiscountType)
  discountType: DiscountType;

  @IsInt()
  @Type(() => Number)
  @Min(0)
  discountValue: number;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  @Min(0)
  minOrderAmount?: number;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  @Min(0)
  maxDiscountAmount?: number;

  @IsOptional()
  @IsUUID()
  productId?: UUID;

  @IsOptional()
  @IsUUID()
  businessId?: UUID;

  @IsOptional()
  @IsDateString()
  validFrom?: string;

  @IsOptional()
  @IsDateString()
  validTo?: string;

  @IsOptional()
  @IsInt()
  @IsPositive()
  usageLimit?: number;

  @IsOptional()
  @IsInt()
  @IsPositive()
  usageLimitPerUser?: number;
}

export class GetCouponsQueryDTO extends PaginationDTO {
  @IsOptional()
  @IsEnum(DiscountType)
  discountType: DiscountType;

  @IsOptional()
  @IsUUID()
  productId: UUID;

  @IsOptional()
  @IsUUID()
  businessId: UUID;
}
