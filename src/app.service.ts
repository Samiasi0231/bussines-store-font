import { Injectable } from '@nestjs/common';
import { SuccessMessage } from './common/constants/message.constant';
import { IResponse, Response } from './common/response';

@Injectable()
export class AppService {
  constructor(private readonly response: Response) {}
  getHello(): IResponse<null> {
    return this.response.sendSuccess(SuccessMessage.OPERATION_SUCCESSFUL);
  }
}
