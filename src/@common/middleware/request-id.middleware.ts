import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  private readonly logger = new Logger(RequestIdMiddleware.name);

  use(req: Request, res: Response, next: NextFunction) {
    // Generate request ID if not present
    if (!req.reqId) {
      req.reqId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    // Add request ID to response headers
    res.setHeader('X-Request-ID', req.reqId);
    
    next();
  }
}

