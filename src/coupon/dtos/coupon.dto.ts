import {
  IsString,
  IsOptional,
  IsEnum,
  IsPositive,
  IsUUID,
  IsDateString,
  IsInt,
  Min,
} from 'class-validator';
import { DiscountType } from '../../entities/coupon.entity';
import { Type } from 'class-transformer';
import { UUID } from 'crypto';
import { PaginationDTO } from '../../@common/dtos/pagination.dto';
import { MutuallyExclusive } from '../../@common/validators/mutually-exclusive.validator';
import { TransformToArray } from '../../@common/decorators/array-transformer.decorator';
import { TransformToLowerCase } from '../../@common/decorators/case-transformer.decorator';

export class CreateCouponDTO {
  @MutuallyExclusive('businesses', 'products')
  _exclusiveCheck: any;

  @IsString()
  code: string;

  @IsOptional()
  @IsString()
  description?: string;

  @TransformToLowerCase()
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
  @TransformToArray()
  @IsUUID('7', { each: true })
  product?: UUID[];

  @IsOptional()
  @TransformToArray()
  @IsUUID('7', { each: true })
  business?: UUID[];

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
  @TransformToLowerCase()
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
