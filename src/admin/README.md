# Admin Portal - Roles and Permissions

This module provides role-based access control (RBAC) for the BizVantage admin portal.

## Overview

The admin system includes:
- **Roles**: Pre-defined admin roles (Super Admin, Admin, Operations Manager, etc.)
- **Permissions**: Granular permissions for specific actions
- **Guards**: NestJS guards to protect endpoints
- **Decorators**: Easy-to-use decorators for controllers

## Roles

Available roles are defined in `@common/constants/role.constant.ts`:
- `SUPER_ADMIN`: Full access to all features
- `ADMIN`: General administrative access
- `OPERATIONS_MANAGER`: Operations and workflow management
- `PARTNER_MANAGER`: Partner management
- `FINANCE_ADMIN`: Financial operations
- `SUPPORT`: Support-level access

## Permissions

Permissions are defined in `@common/constants/permission.constant.ts`. Each role has a default set of permissions, but users can also have custom permissions assigned directly.

## Usage

### 1. Using `@AdminOnly` Decorator

The simplest way to protect an endpoint - requires any admin role:

```typescript
import { Controller, Get, UseGuards } from '@nestjs/common';
import { AdminGuard } from '../auth/guards/admin.guard';
import { AdminOnly } from '../@common/decorators/admin-only.decorator';

@Controller('admin')
@UseGuards(AdminGuard)
export class AdminController {
  @Get('dashboard')
  @AdminOnly()
  async getDashboard() {
    // Only users with admin roles can access this
  }
}
```

### 2. Using `@Roles` Decorator

Require specific roles:

```typescript
import { Roles } from '../@common/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { AdminRole } from '../@common/constants/role.constant';

@Controller('admin')
@UseGuards(RolesGuard)
export class AdminController {
  @Get('partners')
  @Roles(AdminRole.PARTNER_MANAGER, AdminRole.ADMIN)
  async getPartners() {
    // Only Partner Manager or Admin can access
  }
}
```

### 3. Using `@Permissions` Decorator

Require specific permissions (checks both role permissions and direct user permissions):

```typescript
import { Permissions } from '../@common/decorators/permissions.decorator';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { AdminPermission } from '../@common/constants/permission.constant';

@Controller('admin')
@UseGuards(PermissionsGuard)
export class AdminController {
  @Post('payouts')
  @Permissions(AdminPermission.PROCESS_PAYOUT)
  async processPayout() {
    // Only users with PROCESS_PAYOUT permission can access
  }
}
```

### 4. Combining Guards

You can combine multiple guards:

```typescript
@Controller('admin')
@UseGuards(AdminGuard, RolesGuard, PermissionsGuard)
export class AdminController {
  @Post('users')
  @AdminOnly()
  @Roles(AdminRole.SUPER_ADMIN, AdminRole.ADMIN)
  @Permissions(AdminPermission.CREATE_USER)
  async createUser() {
    // Must be admin, have Super Admin or Admin role, AND have CREATE_USER permission
  }
}
```

## Database Migration

Run the migration to add roles and permissions columns to the users table:

```bash
npm run migration:run
```

The migration file: `migrations/1768315739424-AddRolesAndPermissionsToUsers.ts`

## Setting User Roles

Roles and permissions are stored as PostgreSQL enum arrays in the `users` table:
- `roles`: Array of `AdminRole` enum values
- `permissions`: Array of `AdminPermission` enum values

Example SQL:
```sql
-- Assign Super Admin role
UPDATE users SET roles = ARRAY['super_admin']::admin_role_enum[] WHERE email = 'admin@bizvantage.com';

-- Assign multiple roles
UPDATE users SET roles = ARRAY['admin', 'operations_manager']::admin_role_enum[] WHERE email = 'user@example.com';

-- Assign custom permission
UPDATE users SET permissions = ARRAY['view_dashboard']::admin_permission_enum[] WHERE email = 'user@example.com';
```

## Accessing User Roles in Controllers

User roles and permissions are available in the `@User()` decorator:

```typescript
import { User } from '../@common/decorators/user.decorator';
import { UserProfile } from '../user/interfaces/user.interface';

@Get('profile')
async getProfile(@User() user: UserProfile) {
  console.log(user.roles); // ['super_admin']
  console.log(user.permissions); // ['view_dashboard', ...]
}
```
