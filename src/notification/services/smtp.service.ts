import { Injectable, Logger } from '@nestjs/common';
import nodemailer from 'nodemailer';
import { ConfigService } from '@nestjs/config';
import Mail from 'nodemailer/lib/mailer';
import randomstring from 'randomstring';
import fs from 'fs';
import { SendEmailDTO } from '../dto/email.dto';
import { SentMessageInfo, Options } from 'nodemailer/lib/smtp-transport';
import { ResponseService } from '../../@common/response';
import {
  ErrorMessage,
  SuccessMessage,
} from '../../@common/constants/message.constant';
import { IEmailService } from '../interfaces/email.interface';

@Injectable()
export class SmtpService implements IEmailService {
  private transporter: nodemailer.Transporter<SentMessageInfo, Options>;
  private logger: Logger;
  constructor(
    private configService: ConfigService,
    private readonly responseService: ResponseService,
  ) {
    this.transporter = this.createTransporter();
    this.logger = new Logger(SmtpService.name);
  }

  createTransporter() {
    const transporter = nodemailer.createTransport({
      service: this.configService.get('smtp.service'),
      port: this.configService.get('smtp.port'),
      secure: true,
      auth: {
        user: this.configService.get('smtp.user'),
        pass: this.configService.get('smtp.password'),
      },
    });

    return transporter;
  }

  async sendEmail(payload: SendEmailDTO) {
    try {
      const { attachment, recipients, message } = payload;

      const senderEmailAddress = this.configService.get('appEmail.address');
      const senderName = this.configService.get('appEmail.name');

      let attachments: any[] | undefined;

      if (attachment) {
        const lastIndex = attachment.lastIndexOf('.');

        if (lastIndex > 0) {
          const newFilename = randomstring.generate({
            charset: 'alphanumeric',
            length: 32,
          });
          const extension = attachment.substring(lastIndex);

          attachments = [
            {
              content: fs.createReadStream(attachment),
              filename: `${newFilename}.${extension}`,
            },
          ];
        }
      }

      const options: Mail.Options = {
        from: {
          name: senderName,
          address: senderEmailAddress,
        },
        to: recipients,
        subject: message.subject,
        html: message.html,
        attachments,
      };

      const res = await this.transporter.sendMail(options);

      this.logger.log('SMTP Mail sent', res);

      return this.responseService.sendSuccess(SuccessMessage.EMAIL_SENT);
    } catch (error: any) {
      this.logger.error(`Unable to send email via SMTP`, { error });
      return this.responseService.sendError(ErrorMessage.SEND_EMAIL);
    }
  }
}
