import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { ErrorMessage } from '../../@common/constants/message.constant';
import { UUID } from 'crypto';
import { PaginationDTO } from '../../@common/dtos/pagination.dto';

export class CreateProductCollectionDTO {
  @IsNotEmpty()
  @IsString()
  @MaxLength(255, { message: ErrorMessage.PRODUCT_COLLECTION_NAME_LIMIT })
  @Transform(({ value }) => value.trim())
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(500, {
    message: ErrorMessage.PRODUCT_COLLECTION_DESCRIPTION_LIMIT,
  })
  description?: string;

  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.toLowerCase() === 'true';
    }
    return Boolean(value);
  })
  @IsOptional()
  @IsBoolean()
  visible?: boolean = true;

  @IsUUID()
  businessId: UUID;
}

export class AddProductToCollectionDTO {
  @IsUUID()
  productId: UUID;
}

export class UpdateCollectionVisibilityDTO {
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.toLowerCase() === 'true';
    }
    return Boolean(value);
  })
  @IsBoolean()
  visible: boolean;
}

export class GetProductCollectionsQueryDTO extends PaginationDTO {
  @IsUUID()
  business: UUID;

  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.toLowerCase() === 'true';
    }
    return Boolean(value);
  })
  @IsBoolean()
  visible: boolean;
}
