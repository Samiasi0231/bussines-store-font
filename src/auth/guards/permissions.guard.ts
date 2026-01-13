import { Injectable, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtAuthGuard } from './jwt-auth.guard';
import { PERMISSIONS_KEY } from '../../@common/decorators/permissions.decorator';
import { ErrorMessage } from '../../@common/constants/message.constant';
import { AdminPermission } from '../../@common/constants/permission.constant';
import { ROLE_PERMISSIONS } from '../../@common/constants/permission.constant';
import { AdminRole } from '../../@common/constants/role.constant';

@Injectable()
export class PermissionsGuard extends JwtAuthGuard {
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

    const requiredPermissions = this.reflector.getAllAndOverride<
      AdminPermission[]
    >(PERMISSIONS_KEY, [context.getHandler(), context.getClass()]);

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true; // No permissions specified, allow access
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException(ErrorMessage.ACCESS_DENIED);
    }

    // Get user's direct permissions
    const userPermissions = user.permissions || [];

    // Get permissions from user's roles
    const userRoles = user.roles || [];
    const rolePermissions = userRoles.flatMap(
      (role: AdminRole) => ROLE_PERMISSIONS[role] || [],
    );

    // Combine direct permissions and role permissions (remove duplicates)
    const allPermissions = [
      ...new Set([...userPermissions, ...rolePermissions]),
    ];

    // Check if user has all required permissions
    const hasAllPermissions = requiredPermissions.every((permission) =>
      allPermissions.includes(permission),
    );

    if (!hasAllPermissions) {
      throw new ForbiddenException(ErrorMessage.ACCESS_DENIED);
    }

    return true;
  }
}
