import { Injectable, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtAuthGuard } from './jwt-auth.guard';
import { ROLES_KEY } from '../../@common/decorators/roles.decorator';
import { ErrorMessage } from '../../@common/constants/message.constant';
import { AdminRole } from '../../@common/constants/role.constant';

@Injectable()
export class RolesGuard extends JwtAuthGuard {
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

    const requiredRoles = this.reflector.getAllAndOverride<AdminRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles || requiredRoles.length === 0) {
      return true; // No roles specified, allow access
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException(ErrorMessage.ACCESS_DENIED);
    }

    const userRoles = user.roles || [];

    // Check if user has at least one of the required roles
    const hasRequiredRole = requiredRoles.some((role) =>
      userRoles.includes(role),
    );

    if (!hasRequiredRole) {
      throw new ForbiddenException(ErrorMessage.ACCESS_DENIED);
    }

    return true;
  }
}
