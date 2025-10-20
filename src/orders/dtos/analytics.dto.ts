import {
  IsOptional,
  IsArray,
  IsString,
  IsBoolean,
  IsEnum,
} from 'class-validator';
import { TransformToArray } from '../../@common/decorators/array-transformer.decorator';
import { TransformToBoolean } from '../../@common/decorators/boolean-transformer.decorator';
import { IsDateFilterList } from '../../@common/validators/date.validator';

export enum OrderAnalyticsGroupBy {
  PRODUCT = 'product',
  BUSINESS = 'business',
  STORE = 'store',
}

export class OrderAnalyticsDTO {
  @TransformToArray()
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  products: string[];

  @TransformToArray()
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  productVariants: string[];

  @TransformToArray()
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  stores: string[];

  @TransformToArray()
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  businesses: string[];

  @IsOptional()
  @IsArray()
  @TransformToArray()
  @IsString({ each: true })
  sort: string[];

  @IsOptional()
  @IsBoolean()
  @TransformToBoolean()
  paymentCompleted: boolean;

  @IsOptional()
  @IsDateFilterList()
  @IsArray()
  @TransformToArray()
  @IsString({ each: true })
  date: string[];

  @IsOptional()
  @IsEnum(OrderAnalyticsGroupBy, {
    message: `groupBy must be one of: ${Object.values(OrderAnalyticsGroupBy).join(', ')}`,
  })
  groupBy?: OrderAnalyticsGroupBy = OrderAnalyticsGroupBy.PRODUCT;
}
