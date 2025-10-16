import { IsNotEmpty, IsString } from 'class-validator';

export class GetByIdParamDTO {
  @IsString()
  @IsNotEmpty()
  id: string;
}
