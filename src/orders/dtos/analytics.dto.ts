import {
  IsOptional,
  IsArray,
  IsString,
  IsBoolean,
  IsEnum,
  IsUUID,
} from 'class-validator';
import { TransformToArray } from '../../@common/decorators/array-transformer.decorator';
import { TransformToBoolean } from '../../@common/decorators/boolean-transformer.decorator';
import { IsDateFilterList } from '../../@common/validators/date.validator';
import { PaginationDTO } from '../../@common/dtos/pagination.dto';

export enum OrderAnalyticsGroupBy {
  PRODUCT = 'product',
  BUSINESS = 'business',
  STORE = 'store',
}

export class OrderAnalyticsDTO extends PaginationDTO {
  @TransformToArray()
  @IsOptional()
  @IsArray()
  @IsUUID('7', { each: true })
  products: string[];

  @TransformToArray()
  @IsOptional()
  @IsArray()
  @IsUUID('7', { each: true })
  productVariants: string[];

  @TransformToArray()
  @IsOptional()
  @IsArray()
  @IsUUID('7', { each: true })
  stores: string[];

  @TransformToArray()
  @IsOptional()
  @IsArray()
  @IsUUID('7', { each: true })
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
