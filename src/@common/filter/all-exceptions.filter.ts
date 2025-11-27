import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { IResponse } from '../response';
import { ErrorMessage } from '../constants/message.constant';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost): void {
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

    // Check if headers have already been sent to avoid ERR_HTTP_HEADERS_SENT error
    // This is a safety check in case any middleware tries to send a response
    if (response.headersSent || response.writableEnded) {
      // If headers are already sent or response has ended, we can't send a response
      // Just log the error and return early
      Logger.warn('Response headers already sent or response ended. Skipping exception response.');
      return;
    }

    if (exception instanceof HttpException) {
      const res = exception.getResponse() as any;
      const message = typeof res === 'string' ? res : res.message;
      exceptionResponse = {
        status: status || exception.getStatus(),
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

    // Try to send response, catch any header-related errors from middleware interference
    try {
      // Double-check headers haven't been sent between the check and this point
      if (response.headersSent || response.writableEnded) {
        Logger.warn('Response headers sent between check and send. Skipping exception response.');
        return;
      }
      
      response.status(exceptionResponse.status).json(exceptionResponse);
    } catch (err: any) {
      // If headers were sent by middleware (e.g., morgan-body) before we could send,
      // log the error but don't throw - the response was already sent
      if (err?.code === 'ERR_HTTP_HEADERS_SENT' || err?.message?.includes('headers')) {
        Logger.warn('Response headers already sent, likely by middleware. Exception was logged above.');
        // Don't re-throw - the response was already sent by middleware
        return;
      } else {
        // Re-throw if it's a different error
        throw err;
      }
    }
  }
}
