import { HttpStatus } from '@nestjs/common';
import { ResponseMessage } from '../constants/message.constant';

export interface IResponse<T> {
  status: HttpStatus;
  success: boolean;
  message?: ResponseMessage;
  data?: T;
  error?: ResponseMessage;
}

export class Response {
  sendSuccess<T>(
    message: ResponseMessage,
    data?: T,
    status = HttpStatus.OK,
  ): IResponse<T> {
    return {
      success: true,
      message,
      data,
      status,
    };
  }

  sendError<T>(
    message: ResponseMessage,
    data?: T,
    status = HttpStatus.BAD_REQUEST,
  ): IResponse<T> {
    return {
      success: false,
      error: message,
      message,
      data,
      status,
    };
  }
}
