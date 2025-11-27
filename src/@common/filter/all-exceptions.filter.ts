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

// Helper function to safely serialize objects and avoid circular references
function safeStringify(obj: any): string {
  const seen = new WeakSet();
  return JSON.stringify(obj, (key, value) => {
    if (typeof value === 'object' && value !== null) {
      if (seen.has(value)) {
        return '[Circular]';
      }
      seen.add(value);
    }
    return value;
  });
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost): void {
    let exceptionResponse: IResponse<unknown>;
    const response = host.switchToHttp().getResponse<any>();
    const { status } = exception;
    const error = exception?.message;

    // Safely serialize exception to avoid circular reference errors
    const safeException = {
      name: exception?.name,
      message: exception?.message,
      stack: exception?.stack,
      status: exception?.status,
      response: exception?.response,
      // Only include query/parameters if they exist and are serializable
      ...(exception?.query && { query: exception.query }),
      ...(exception?.parameters && { 
        parameters: Array.isArray(exception.parameters) 
          ? exception.parameters.map((p: any) => {
              // Safely serialize parameters, extracting id if it's an object
              if (p && typeof p === 'object' && p.id) {
                return { id: typeof p.id === 'string' ? p.id : p.id?.id || p.id };
              }
              return p;
            })
          : exception.parameters 
      }),
    };

    Logger.error({
      name: exception?.name,
      errorMessage: exception?.message,
      stack: exception?.stack,
      raw: safeException,
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
      
      // Send response directly - exceptionResponse is already a plain object with no circular refs
      response.status(exceptionResponse.status).json(exceptionResponse);
    } catch (err: any) {
      // If headers were sent by middleware (e.g., morgan-body) before we could send,
      // log the error but don't throw - the response was already sent
      if (err?.code === 'ERR_HTTP_HEADERS_SENT' || err?.message?.includes('headers')) {
        Logger.warn('Response headers already sent, likely by middleware. Exception was logged above.');
        // Don't re-throw - the response was already sent by middleware
        return;
      } else if (err?.message?.includes('circular') || err?.message?.includes('Circular')) {
        // If we get a circular reference error, try to send a minimal safe response
        Logger.warn('Circular reference detected in response. Sending minimal error response.');
        try {
          if (!response.headersSent && !response.writableEnded) {
            response.status(exceptionResponse.status).json({
              status: exceptionResponse.status,
              success: false,
              error: ErrorMessage.AN_ERROR_OCCURRED,
              message: ErrorMessage.AN_ERROR_OCCURRED,
            });
          }
        } catch (finalErr: any) {
          // If even that fails, just log and give up
          Logger.error('Failed to send error response after circular reference error', finalErr?.message);
        }
        return;
      } else {
        // Re-throw if it's a different error
        throw err;
      }
    }
  }
}
