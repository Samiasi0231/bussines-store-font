import { Type } from 'class-transformer';
import {
  IsArray,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

class EmailMessageDTO {
  @IsString()
  @IsNotEmpty()
  subject: string;

  @IsOptional()
  @IsString()
  text?: string;

  @IsOptional()
  @IsString()
  html?: string;
}

export class SendEmailDTO {
  @IsArray()
  @IsEmail({}, { each: true })
  @IsNotEmpty({ each: true })
  recipients: string[];

  @ValidateNested()
  @Type(() => EmailMessageDTO)
  message: EmailMessageDTO;

  @IsOptional()
  @IsString()
  attachment?: string;
}

export class SendDirectEmailDTO {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  subject: string;

  @IsString()
  @IsNotEmpty()
  html: string;
}

export class SendEmailWithTemplateDTO {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  context: Record<string, unknown>;

  @IsString()
  @IsNotEmpty()
  templateKey: string;
}
