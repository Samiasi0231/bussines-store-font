import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';
import { UUID } from 'crypto';
import { PaginationDTO } from '../../@common/dtos/pagination.dto';

export class AddSubCategoryDTO {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsUUID()
  category: UUID;
}

export class GetSubCategoriesQueryDTO extends PaginationDTO {
  @IsOptional()
  @IsUUID()
  category?: UUID;
}
