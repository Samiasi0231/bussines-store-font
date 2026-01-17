import { SetMetadata } from '@nestjs/common';
import { Roles } from './roles.decorator';
import { AdminRole } from '../constants/role.constant';

export const IS_ADMIN_ONLY_KEY = 'isAdminOnly';

/**
 * Decorator to mark an endpoint as admin-only
 * This automatically requires at least one admin role (excluding guest users)
 */
export const AdminOnly = () => SetMetadata(IS_ADMIN_ONLY_KEY, true);
