import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

export class PaginationDTO {
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  @Min(1)
  @Max(200)
  limit? = 10;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  @Min(1)
  page? = 1;
}
