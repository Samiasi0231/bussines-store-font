import { Module } from '@nestjs/common';
import { EmailService } from './services/email.service';
import { EmailController } from './controllers/email.controller';
import { SmtpService } from './services/smtp.service';

@Module({
  controllers: [EmailController],
  providers: [EmailService, SmtpService],
  exports: [EmailService, SmtpService],
})
export class NotificationModule {}
