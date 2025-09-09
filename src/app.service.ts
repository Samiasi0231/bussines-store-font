import { Injectable } from '@nestjs/common';
import {
  ServiceResponse,
  successResponse,
} from './common/utilities/response.utility';
import { SuccessMessage } from './common/constants/message.constant';

@Injectable()
export class AppService {
  getHello(): ServiceResponse<null> {
    return successResponse(SuccessMessage.OPERATION_SUCCESSFUL);
  }
}
