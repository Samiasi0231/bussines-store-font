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

// Helper function to safely extract exception data without circular references
function extractSafeExceptionData(exception: any): any {
  const seen = new WeakSet();
  
  function extract(obj: any, depth = 0): any {
    // Prevent infinite recursion
    if (depth > 10) return '[Max Depth]';
    
    if (obj === null || obj === undefined) return obj;
    
    // Handle circular references
    if (typeof obj === 'object') {
      if (seen.has(obj)) return '[Circular]';
      seen.add(obj);
    }
    
    // Skip problematic objects
    if (obj && typeof obj === 'object') {
      // Skip Socket, HTTPParser, and other problematic objects
      const constructorName = obj.constructor?.name || '';
      if (['Socket', 'HTTPParser', 'ServerResponse', 'IncomingMessage', 'ClientRequest'].includes(constructorName)) {
        return `[${constructorName}]`;
      }
      
      // Handle arrays
      if (Array.isArray(obj)) {
        return obj.map(item => extract(item, depth + 1));
      }
      
      // Handle plain objects
      const result: any = {};
      for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
          // Skip problematic keys
          if (['socket', 'parser', 'req', 'res', '_events', '_eventsCount'].includes(key)) {
            continue;
          }
          try {
            result[key] = extract(obj[key], depth + 1);
          } catch (e) {
            result[key] = '[Error extracting]';
          }
        }
      }
      return result;
    }
    
    return obj;
  }
  
  return {
    name: exception?.name,
    message: exception?.message,
    stack: exception?.stack,
    status: exception?.status,
    response: extract(exception?.response),
    query: extract(exception?.query),
    parameters: extract(exception?.parameters),
  };
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: any, host: ArgumentsHost): void {
    let exceptionResponse: IResponse<unknown>;
    const request = host.switchToHttp().getRequest<any>();
    const response = host.switchToHttp().getResponse<any>();
    const { status } = exception;
    const error = exception?.message;

    // Safely extract exception data without circular references
    const safeException = extractSafeExceptionData(exception);

    // Log with request context
    const requestInfo = {
      method: request?.method,
      url: request?.url,
      path: request?.path,
      query: request?.query,
      params: request?.params,
      reqId: request?.reqId,
      userId: request?.user?.id,
    };

    this.logger.error(
      `Exception: ${exception?.name || 'Unknown'} - ${exception?.message || 'No message'}`,
      {
        ...safeException,
        request: requestInfo,
      },
    );

    // Check if headers have already been sent to avoid ERR_HTTP_HEADERS_SENT error
    // This is a safety check in case any middleware tries to send a response
    if (response.headersSent || response.writableEnded) {
      // If headers are already sent or response has ended, we can't send a response
      // Just log the error and return early
      this.logger.warn('Response headers already sent or response ended. Skipping exception response.');
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
        this.logger.warn('Response headers sent between check and send. Skipping exception response.');
        return;
      }
      
      // Send response directly - exceptionResponse is already a plain object with no circular refs
      response.status(exceptionResponse.status).json({
        ...exceptionResponse,
        reqId: request?.reqId,
      });
    } catch (err: any) {
      // If headers were sent by middleware (e.g., morgan-body) before we could send,
      // log the error but don't throw - the response was already sent
      if (err?.code === 'ERR_HTTP_HEADERS_SENT' || err?.message?.includes('headers')) {
        this.logger.warn('Response headers already sent, likely by middleware. Exception was logged above.');
        // Don't re-throw - the response was already sent by middleware
        return;
      } else if (err?.message?.includes('circular') || err?.message?.includes('Circular')) {
        // If we get a circular reference error, try to send a minimal safe response
        this.logger.warn('Circular reference detected in response. Sending minimal error response.');
        try {
          if (!response.headersSent && !response.writableEnded) {
            response.status(exceptionResponse.status).json({
              status: exceptionResponse.status,
              success: false,
              error: ErrorMessage.AN_ERROR_OCCURRED,
              message: ErrorMessage.AN_ERROR_OCCURRED,
              reqId: request?.reqId,
            });
          }
        } catch (finalErr: any) {
          // If even that fails, just log and give up
          this.logger.error('Failed to send error response after circular reference error', finalErr?.message);
        }
        return;
      } else {
        // Re-throw if it's a different error
        throw err;
      }
    }
  }
}
