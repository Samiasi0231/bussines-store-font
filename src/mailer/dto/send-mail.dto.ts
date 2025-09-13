import { Address } from 'nodemailer/lib/mailer';

export type SendEmailDto = {
  recipients: Address[];
  subject: string;
  html: string;
  text?: string;
  placeholderReplacements?: Record<string, string>;
};
