import { Injectable, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtAuthGuard } from './jwt-auth.guard';
import { IS_ADMIN_ONLY_KEY } from '../../@common/decorators/admin-only.decorator';
import { ErrorMessage } from '../../@common/constants/message.constant';
import { AdminRole } from '../../@common/constants/role.constant';

@Injectable()
export class AdminGuard extends JwtAuthGuard {
  constructor(reflector: Reflector) {
    super(reflector);
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // First ensure JWT authentication is valid
    const jwtResult = super.canActivate(context);
    const isJwtValid = jwtResult instanceof Promise ? await jwtResult : jwtResult;
    if (!isJwtValid) {
      return false;
    }

    const isAdminOnly = this.reflector.getAllAndOverride<boolean>(
      IS_ADMIN_ONLY_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!isAdminOnly) {
      return true; // If not marked as admin-only, allow access
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException(ErrorMessage.ACCESS_DENIED);
    }

    // Check if user has any admin role
    const userRoles = user.roles || [];
    const hasAdminRole = userRoles.some((role: AdminRole) =>
      Object.values(AdminRole).includes(role),
    );

    if (!hasAdminRole) {
      throw new ForbiddenException(ErrorMessage.ACCESS_DENIED);
    }

    return true;
  }
}
