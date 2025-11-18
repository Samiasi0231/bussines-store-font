import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import randomstring from 'randomstring';
import fs from 'fs';
import { SendEmailDTO } from '../dto/email.dto';
import { ResponseService } from '../../@common/response';
import { ErrorMessage, SuccessMessage } from '../../@common/constants/message.constant';
import { IEmailService } from '../interfaces/email.interface';
import { CreateEmailOptions, Resend } from 'resend';

@Injectable()
export class ResendService implements IEmailService {
  private transporter: Resend;
  private readonly logger = new Logger(ResendService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly responseService: ResponseService,
  ) {
    // Initialize transporter using the public method
    this.transporter = this.createTransporter();
  }

  // Must be public to satisfy IEmailService
  public createTransporter(): Resend {
    const apiKey = this.configService.get<string>('resend.apiKey'); // matches your appConfig
    if (!apiKey) {
      this.logger.error('RESEND_API_KEY is missing in environment variables');
      throw new Error('RESEND_API_KEY is missing in environment variables');
    }
    this.logger.log('Resend API Key loaded successfully');
    return new Resend(apiKey);
  }

  public async sendEmail(payload: SendEmailDTO) {
    try {
      const { attachment, recipients, message } = payload;

      const senderEmailAddress = this.configService.get<string>('appEmail.address');
      const senderName = this.configService.get<string>('appEmail.name');

      let attachments: any[] | undefined;

      if (attachment) {
        const lastIndex = attachment.lastIndexOf('.');
        if (lastIndex > 0) {
          const newFilename = randomstring.generate({
            charset: 'alphanumeric',
            length: 32,
          });
          const extension = attachment.substring(lastIndex + 1); // remove dot
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

      this.logger.log('Resend Mail sent successfully', res);

      if (res.error) {
        return this.responseService.sendError(ErrorMessage.SEND_EMAIL);
      }

      return this.responseService.sendSuccess(SuccessMessage.EMAIL_SENT);
    } catch (error: any) {
      this.logger.error('Unable to send email via Resend', error);
      return this.responseService.sendError(ErrorMessage.SEND_EMAIL);
    }
  }
}
