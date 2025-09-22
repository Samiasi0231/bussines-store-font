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
import { resolve } from 'app-root-path';
import templates from '../../@common/templates/templates.json';
import { ResponseService } from '../../@common/response';
import { ErrorMessage } from '../../@common/constants/message.constant';

@Injectable()
export class EmailService {
  private emailProvider: IEmailService;
  private emailProviderName: Provider;
  private baseTemplatePath = 'src/@common/templates';

  constructor(
    private configService: ConfigService,
    private readonly smtpService: SmtpService,
    private readonly responseService: ResponseService,
  ) {
    //TODO: move to system settings
    this.emailProviderName = this.configService.get<Provider>(
      'EMAIL_PROVIDER',
      Provider.SMTP,
    );
    this.emailProvider = this.getProvider();
  }

  getProvider(): IEmailService {
    let provider;

    switch (this.emailProviderName) {
      case Provider.SMTP:
        provider = this.smtpService;
        break;
      default:
        provider = this.smtpService;
        break;
    }

    return provider;
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
      context,
    );

    const mailOptions: SendEmailDTO = {
      recipients: [email],
      message: {
        subject: await this.bindVariables(template.email?.subject, context),
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

    return resolve(path);
  }

  private getTemplateByKey(key: string): Template {
    return templates.find((template) => template.key === key);
  }

  private bindVariables(content: string, variables: Record<string, unknown>) {
    return renderFile(content, variables);
  }
}
