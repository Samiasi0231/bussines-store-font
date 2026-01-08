import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { SuccessMessage } from '../constants/message.constant';

@Injectable()
export class HttpInterceptor<T> implements NestInterceptor<T, any> {
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<any> {
    return next.handle().pipe(
      map((responseData) => {
        const {
          message,
          status,
          success = true,
          responseCode,
          error,
          ...rest
        } = responseData;

        const { data, ...finalData } = rest;

        // Default status to 200 if undefined
        const statusCode = status || 200;

        // Safely extract reqId from request (as a string to avoid circular references)
        const request = context.switchToHttp().getRequest();
        const reqId = request?.reqId ? String(request.reqId) : undefined;

        // Return the transformed data object - NestJS will serialize it
        return {
          reqId,
          message: message || SuccessMessage.OPERATION_SUCCESSFUL,
          data: data || { ...finalData },
          success,
          status: statusCode,
          responseCode,
        };
      }),
    );
  }
}
