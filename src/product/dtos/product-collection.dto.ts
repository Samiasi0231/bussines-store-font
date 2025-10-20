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
import { TransformToBoolean } from '../../@common/decorators/boolean-transformer.decorator';

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

  @TransformToBoolean()
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
  @TransformToBoolean()
  @IsBoolean()
  visible: boolean;
}

export class GetProductCollectionsQueryDTO extends PaginationDTO {
  @IsUUID()
  business: UUID;

  @IsOptional()
  @TransformToBoolean()
  @IsBoolean()
  visible: boolean;
}
