
import { IsArray, IsNotEmpty, IsString } from 'class-validator';

export class SendOtpDto {
  @IsNotEmpty()
  @IsArray()
  @IsString({ each: true })
  recipients: string[];
}

