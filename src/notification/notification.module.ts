import { Module } from '@nestjs/common';
import { EmailService } from './services/email.service';
import { EmailController } from './controllers/email.controller';
import { SmtpService } from './services/smtp.service';
import { ResendService } from './services/resend.service';

@Module({
  controllers: [EmailController],
  providers: [EmailService, SmtpService, ResendService],
  exports: [EmailService, SmtpService, ResendService],
})
export class NotificationModule {}
