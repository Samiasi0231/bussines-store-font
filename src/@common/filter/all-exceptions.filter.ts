import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { IResponse } from '../response';
import { Observable } from 'rxjs';
import { ErrorMessage } from '../constants/message.constant';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost): Observable<IResponse<any>> {
    let exceptionResponse: IResponse<unknown>;
    const response = host.switchToHttp().getResponse<any>();
    const { status } = exception;
    const error = exception?.message;

    Logger.error({
      name: exception?.name,
      errorMessage: exception?.message,
      stack: exception?.stack,
      raw: exception,
    });

    if (exception instanceof HttpException) {
      const res = exception.getResponse() as any;
      const message =
        typeof res === 'string'
          ? res
          : Array.isArray(res.message)
            ? res.message
            : [res.message];
      exceptionResponse = {
        status,
        success: false,
        error: error || ErrorMessage.AN_ERROR_OCCURRED,
        message,
      };
    } else {
      exceptionResponse = {
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        success: false,
        error: ErrorMessage.AN_ERROR_OCCURRED,
        message: ErrorMessage.AN_ERROR_OCCURRED,
      };
    }

    return response.status(exceptionResponse.status).json(exceptionResponse);
  }
}
