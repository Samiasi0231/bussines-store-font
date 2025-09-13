import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { ConfigService } from '@nestjs/config';
import { SendEmailDto } from './dto/send-mail.dto';
import Mail from 'nodemailer/lib/mailer';

@Injectable()
export class MailerService {
  constructor(private configService: ConfigService) {}

  mailTransport() {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      port: 465,
      secure: true,
      auth: {
        user: this.configService.get('otp_email'),
        pass: this.configService.get('otp_password'),
      },
    });

    return transporter;
  }

  async sendEmail(dto: SendEmailDto) {
    const { recipients, subject, html } = dto;

    const transport = this.mailTransport();

    const options: Mail.Options = {
      from: {
        name: this.configService.get('App_Name'),
        address: this.configService.get('otp_email'),
      },
      to: recipients,
      subject,
      html,
    };

    try {
      const result = await transport.sendMail(options);
      return result;
    } catch (error) {
      console.log('Error', error);
    }
  }
}
