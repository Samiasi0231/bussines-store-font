import { Body, Controller, Post } from '@nestjs/common';
import { MailerService } from './mailer.service';
import { SendEmailDto } from './dto/send-mail.dto';
import { renderFile } from 'ejs';

@Controller('mailer')
export class MailerController {
  constructor(private readonly mailerService: MailerService) {}

  @Post('/send-mail')
  async sendEmail(
    @Body() dto: SendEmailDto,
    htmlFilePath: string,
    context: any,
  ) {
    dto.html = await renderFile(htmlFilePath, context);

    return await this.mailerService.sendEmail(dto);
  }
}
