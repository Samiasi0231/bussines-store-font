import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request, Response } from 'express';

@Injectable()
export class RequestLoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('RequestLogger');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    const { method, url, path, query, params, body, headers } = request;
    const startTime = Date.now();

    // Generate request ID if not present
    if (!request.reqId) {
      request.reqId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    // Log incoming request
    const requestInfo = {
      reqId: request.reqId,
      method,
      url,
      path,
      query: this.sanitizeObject(query),
      params: this.sanitizeObject(params),
      body: this.sanitizeObject(body),
      ip: request.ip || request.headers['x-forwarded-for'] || request.socket.remoteAddress,
      userAgent: headers['user-agent'],
      userId: (request as any).user?.id,
    };

    this.logger.log(`Incoming Request: ${method} ${path}`, requestInfo);

    return next.handle().pipe(
      tap({
        next: (data) => {
          const duration = Date.now() - startTime;
          const statusCode = response.statusCode;
          
          this.logger.log(
            `Request Completed: ${method} ${path} - ${statusCode} (${duration}ms)`,
            {
              reqId: request.reqId,
              method,
              path,
              statusCode,
              duration,
              success: true,
            },
          );
        },
        error: (error) => {
          const duration = Date.now() - startTime;
          
          this.logger.error(
            `Request Failed: ${method} ${path} - ${error?.status || 500} (${duration}ms)`,
            {
              reqId: request.reqId,
              method,
              path,
              statusCode: error?.status || 500,
              duration,
              error: error?.message,
              success: false,
            },
          );
        },
      }),
    );
  }

  private sanitizeObject(obj: any): any {
    if (!obj || typeof obj !== 'object') return obj;
    
    const sensitiveKeys = ['password', 'token', 'secret', 'authorization', 'apiKey', 'apikey'];
    const sanitized = { ...obj };
    
    for (const key in sanitized) {
      if (sensitiveKeys.some(sensitive => key.toLowerCase().includes(sensitive))) {
        sanitized[key] = '[REDACTED]';
      } else if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
        sanitized[key] = this.sanitizeObject(sanitized[key]);
      }
    }
    
    return sanitized;
  }
}

