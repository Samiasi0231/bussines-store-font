import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  SendDirectEmailDTO,
  SendEmailDTO,
  SendEmailWithTemplateDTO,
} from '../dto/email.dto';
import { Provider } from '../../@common/constants/providers.constant';
import { SmtpService } from './smtp.service';
import { IEmailService } from '../interfaces/email.interface';
import { renderFile } from 'ejs';
import {
  EmailNotificationType,
  EmailTemplate,
  Template,
} from '../../@common/constants/email.constant';
import templates from '../../@common/templates/templates.json';
import { ResponseService } from '../../@common/response';
import { ErrorMessage } from '../../@common/constants/message.constant';
import { ResendService } from './resend.service';
import { join } from 'path';
import {
  DefaultProviderConfig,
  SystemSettingsService,
} from '../../system-settings/system-settings.service';

@Injectable()
export class EmailService {
  private _emailProviderName: Provider;
  private baseTemplatePath = join(
    process.cwd(),
    'dist',
    '@common',
    'templates',
  );

  constructor(
    private configService: ConfigService,
    private readonly smtpService: SmtpService,
    private readonly resendService: ResendService,
    private readonly responseService: ResponseService,
    private readonly systemSettingsSevice: SystemSettingsService,
  ) {}

  private get emailProvider(): IEmailService {
    let provider: IEmailService;

    switch (this.emailProviderName) {
      case Provider.SMTP:
        provider = this.smtpService;
        break;
      case Provider.RESEND:
        provider = this.resendService;
        break;
      default:
        provider = this.resendService;
        break;
    }

    return provider;
  }

  private get emailProviderName(): Provider {
    this._emailProviderName = this.systemSettingsSevice.getDefaultProvider(
      DefaultProviderConfig.EMAIL,
    );
    return this._emailProviderName;
  }

  async sendDirectEmail(payload: SendDirectEmailDTO) {
    const { email, subject, html } = payload;
    const data: SendEmailDTO = {
      recipients: [email],
      message: { subject, html },
    };
    return this.emailProvider.sendEmail(data);
  }

  async sendEmailWithTemplate(payload: SendEmailWithTemplateDTO) {
    const { templateKey, context, email } = payload;

    const template = this.getTemplateByKey(templateKey);

    if (!template) {
      //TODO: log error
      return this.responseService.sendError(ErrorMessage.AN_ERROR_OCCURRED);
    }

   const content = await this.getTemplateContent(
  template.email?.path as EmailTemplate,
  {
    ...context, 
    logoUrl: this.configService.get('appEmail').logoUrl,
  },
);


    const mailOptions: SendEmailDTO = {
      recipients: [email],
      message: {
        subject: template.email?.subject,
        html: content,
      },
    };

    return this.emailProvider.sendEmail(mailOptions);
  }

  private async getTemplateContent(
    name: EmailTemplate,
    context: Record<string, unknown>,
  ) {
    const template = this.getTemplatePath(name);
    return renderFile(template, context);
  }

  private getTemplatePath(name: EmailTemplate, type?: EmailNotificationType) {
    let path: string;
    switch (type) {
      default:
        path = `${this.baseTemplatePath}/${name}.ejs`;
        break;
    }

    return path;
  }

  private getTemplateByKey(key: string): Template {
    return templates.find((template) => template.key === key);
  }
}
