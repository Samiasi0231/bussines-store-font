import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { PaginationDTO } from '../../@common/dtos/pagination.dto';

export class AddCategoryDTO {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;
}

export class GetCategoriesQueryDTO extends PaginationDTO {}
