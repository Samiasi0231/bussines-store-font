import { Type } from 'class-transformer';
import { IsNumber, IsOptional, Min } from 'class-validator';

export class PaginationDTO {
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(1)
  limit? = 10;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(1)
  page? = 1;
}
