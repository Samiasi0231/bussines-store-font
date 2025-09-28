import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import randomstring from 'randomstring';
import fs from 'fs';
import { SendEmailDTO } from '../dto/email.dto';
import { ResponseService } from '../../@common/response';
import {
  ErrorMessage,
  SuccessMessage,
} from '../../@common/constants/message.constant';
import { IEmailService } from '../interfaces/email.interface';
import { CreateEmailOptions, Resend } from 'resend';

@Injectable()
export class ResendService implements IEmailService {
  private transporter: Resend;
  private logger: Logger;
  constructor(
    private configService: ConfigService,
    private readonly responseService: ResponseService,
  ) {
    this.transporter = this.createTransporter();
    this.logger = new Logger(ResendService.name);
  }

  createTransporter() {
    const API_KEY = this.configService.get<string>('resend.apiKey');
    const transporter = new Resend(API_KEY);
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

      const options: CreateEmailOptions = {
        from: `${senderName} <${senderEmailAddress}>`,
        to: recipients,
        subject: message.subject,
        html: message.html,
        attachments,
      };

      const res = await this.transporter.emails.send(options);

      this.logger.log('Resend Mail sent', res);

      if (res.error)
        return this.responseService.sendError(ErrorMessage.SEND_EMAIL);

      return this.responseService.sendSuccess(SuccessMessage.EMAIL_SENT);
    } catch (error: any) {
      this.logger.error(`Unable to send email via Resend`, { error });
      return this.responseService.sendError(ErrorMessage.SEND_EMAIL);
    }
  }
}
