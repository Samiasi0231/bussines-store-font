import { IsNotEmpty, IsString } from 'class-validator';

export class GetByIdParamsDTO {
  @IsString()
  @IsNotEmpty()
  id: string;
}
