import { Resend } from 'resend';
import { IResponse } from '../../@common/response';
import { SendEmailDTO } from '../dto/email.dto';
import { SentMessageInfo, Options } from 'nodemailer/lib/smtp-transport';
import nodemailer from 'nodemailer';

export abstract class IEmailService {
  abstract sendEmail(payload: SendEmailDTO): Promise<IResponse<unknown>>;
  abstract createTransporter():
    | nodemailer.Transporter<SentMessageInfo, Options>
    | Resend;
}
