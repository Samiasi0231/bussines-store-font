import { Transform, Type } from 'class-transformer';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsArray,
  ValidateNested,
  ArrayMinSize,
  ArrayMaxSize,
  IsBoolean,
  registerDecorator,
  ValidationOptions,
  IsUrl,
  IsObject,
  IsUUID,
} from 'class-validator';
import { UUID } from 'crypto';
import { PaginationDTO } from '../../@common/dtos/pagination.dto';
import { IsDateFilterList } from '../../@common/validators/date.validator';
import { IsNumericRange } from '../../@common/validators/numeric-filter.validator';

function IsValidAttributesObject(keys: string[], validationOptions?: any) {
  return function (object: any, propertyName: string) {
    registerDecorator({
      name: 'isValidAttributesObject',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any) {
          if (!value) return true;
          if (typeof value !== 'object') return false;
          return Object.keys(value).every((k) => keys.includes(k));
        },
        defaultMessage() {
          return `Attributes can only contain the following keys: ${keys.join(', ')}`;
        },
      },
    });
  };
}

function HasOnlyOnePrimaryProductImage(validationOptions?: ValidationOptions) {
  return function (object: any, propertyName: string) {
    registerDecorator({
      name: 'hasOnlyOnePrimaryProductImage',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any[]) {
          const primaryCount = value.filter((img) => img.isPrimary).length;
          return primaryCount === 1;
        },
        defaultMessage() {
          return 'A product must have exactly one primary image';
        },
      },
    });
  };
}

class ImageDTO {
  @IsUrl()
  @IsNotEmpty()
  url: string;

  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.toLowerCase() === 'true';
    }
    return Boolean(value);
  })
  @IsOptional()
  @IsBoolean()
  isPrimary = false;
}

const ATTRIBUTES = ['size', 'color'];

class VariantDTO {
  @Type(() => Number)
  @IsNumber()
  costPrice: number;

  @Type(() => Number)
  @IsNumber()
  sellingPrice: number;

  @Type(() => Number)
  @IsNumber()
  quantity: number;

  @IsOptional()
  @IsObject()
  @IsValidAttributesObject(ATTRIBUTES)
  attributes: {
    size?: string;
    color?: string;
  };
}

export class AddProductDTO {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsUUID()
  subCategory: UUID;

  @IsUUID()
  store: UUID;

  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.toLowerCase() === 'true';
    }
    return Boolean(value);
  })
  @IsBoolean()
  trackInventory: boolean;

  @IsOptional()
  @IsString()
  description?: string;

  @Type(() => Number)
  @IsNumber()
  costPrice: number;

  @Type(() => Number)
  @IsNumber()
  sellingPrice: number;

  @Type(() => Number)
  @IsNumber()
  quantity: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  orderLimit?: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ImageDTO)
  @ArrayMinSize(1)
  @ArrayMaxSize(7)
  @HasOnlyOnePrimaryProductImage()
  images: ImageDTO[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => VariantDTO)
  variants?: VariantDTO[];
}

export class GetProductsQueryDTO extends PaginationDTO {
  @IsOptional()
  @IsUUID()
  category: UUID;

  @IsOptional()
  @IsUUID()
  subCategory: UUID;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name: UUID;

  @IsOptional()
  @IsUUID()
  store: UUID;

  @IsOptional()
  @IsUUID()
  business: UUID;

  @IsNumericRange()
  price: string;

  @IsNumericRange()
  quantity: string;

  @IsOptional()
  @IsArray()
  @Transform(({ value }) => {
    if (Array.isArray(value)) return value;
    if (typeof value === 'string') return value.split(',');
    return [];
  })
  @IsString({ each: true })
  sort: string[];

  @IsOptional()
  @IsDateFilterList()
  @IsArray()
  @Transform(({ value }) => {
    if (Array.isArray(value)) return value;
    if (typeof value === 'string') return value.split(',');
    return [];
  })
  @IsString({ each: true })
  createdAt: string[];
}
