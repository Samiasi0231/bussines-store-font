import { Injectable } from '@nestjs/common';
import { SuccessMessage } from './@common/constants/message.constant';
import { IResponse, ResponseService } from './@common/response';

@Injectable()
export class AppService {
  constructor(private readonly response: ResponseService) {}
  getHello(): IResponse<null> {
    return this.response.sendSuccess(SuccessMessage.OPERATION_SUCCESSFUL);
  }
}
