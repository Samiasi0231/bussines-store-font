import { IResponse } from '../../@common/response';
import { SendEmailDTO } from '../dto/email.dto';

export abstract class IEmailService {
  abstract sendEmail(payload: SendEmailDTO): Promise<IResponse<unknown>>;
}
