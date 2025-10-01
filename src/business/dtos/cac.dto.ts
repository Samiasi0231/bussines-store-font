import { IsNotEmpty, IsString } from 'class-validator';

export class CACLookupQueryDTO {
  @IsNotEmpty()
  @IsString()
  regNumber: string;
}
