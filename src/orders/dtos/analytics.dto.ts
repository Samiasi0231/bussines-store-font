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
import { UUID } from 'crypto';

export enum OrderAnalyticsGroupBy {
  PRODUCT = 'product',
  BUSINESS = 'business',
  STORE = 'store',
}

export class OrderAnalyticsDTO extends PaginationDTO {
  @TransformToArray()
  @IsOptional()
  @IsArray()
  @IsUUID(null, { each: true })
  product: string[];

  @TransformToArray()
  @IsOptional()
  @IsArray()
  @IsUUID(null, { each: true })
  productVariant: string[];

  @TransformToArray()
  @IsOptional()
  @IsArray()
  @IsUUID(null, { each: true })
  store: string[];

  @TransformToArray()
  @IsOptional()
  @IsArray()
  @IsUUID(null, { each: true })
  business: string[];

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

  @TransformToArray()
  @IsOptional()
  @IsArray()
  @IsUUID(null, { each: true })
  category: UUID[];

  @TransformToArray()
  @IsOptional()
  @IsArray()
  @IsUUID(null, { each: true })
  subCategory: UUID[];
}
