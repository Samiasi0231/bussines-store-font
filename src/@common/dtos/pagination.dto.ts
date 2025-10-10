import { Type } from 'class-transformer';
import { IsInt, IsOptional, Min } from 'class-validator';

export class PaginationDTO {
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  @Min(1)
  limit? = 10;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  @Min(1)
  page? = 1;
}
