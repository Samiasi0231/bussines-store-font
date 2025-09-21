import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Response } from 'express';
import { SuccessMessage } from '../constants/message.constant';

@Injectable()
export class HttpInterceptor<T> implements NestInterceptor<T, Response<T>> {
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<Response<T>> {
    const response = context.switchToHttp().getResponse<Response>();

    return next.handle().pipe(
      map((responseData) => {
        const {
          message,
          status,
          success = true,
          responseCode,
          ...rest
        } = responseData;

        const { data, ...finalData } = rest;

        return response.status(status).json({
          reqId: context.switchToHttp().getRequest().reqId,
          message: message || SuccessMessage.OPERATION_SUCCESSFUL,
          data: data || { ...finalData },
          success,
          status,
          responseCode,
        });
      }),
    );
  }
}
