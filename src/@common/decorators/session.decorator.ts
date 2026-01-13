import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { randomUUID } from 'crypto';

export const Session = createParamDecorator(
  (data: string, context: ExecutionContext): any => {
    const request = context.switchToHttp().getRequest();
    const session = request.session;
    
    if (data) {
      return session?.[data];
    }
    
    return session;
  },
);

export const SessionId = createParamDecorator(
  (data: unknown, context: ExecutionContext): string => {
    const request = context.switchToHttp().getRequest();
    const session = request.session;
    
    if (!session) {
      throw new Error('Session is not available');
    }
    
    if (!session.cartSessionId) {
      session.cartSessionId = randomUUID();
      session.touch();
    }
    
    return session.cartSessionId as string;
  },
);
