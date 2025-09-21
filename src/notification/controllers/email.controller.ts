import { Body, Controller, Post } from '@nestjs/common';
import { EmailService } from '../services/email.service';
import { SendDirectEmailDTO } from '../dto/email.dto';

@Controller('email')
export class EmailController {
  constructor(private readonly emailService: EmailService) {}

  @Post('/send')
  async sendEmail(@Body() body: SendDirectEmailDTO) {
    return this.emailService.sendDirectEmail(body);
  }
}
