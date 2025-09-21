import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { UserProfile } from '../../user/interfaces/user.interface';

export const User = createParamDecorator(
  (data: string, context: ExecutionContext): UserProfile => {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    return data ? user?.[data] : user;
  },
);
