import { AdminRole } from './role.constant';

export enum AdminPermission {
  // Dashboard & Overview
  VIEW_DASHBOARD = 'view_dashboard',

  // Request Management
  VIEW_REQUESTS = 'view_requests',
  CREATE_REQUEST = 'create_request',
  UPDATE_REQUEST = 'update_request',
  DELETE_REQUEST = 'delete_request',
  ASSIGN_REQUEST = 'assign_request',
  ESCALATE_REQUEST = 'escalate_request',
  UPDATE_REQUEST_STATUS = 'update_request_status',

  // Workflow Management
  VIEW_WORKFLOWS = 'view_workflows',
  CREATE_WORKFLOW = 'create_workflow',
  UPDATE_WORKFLOW = 'update_workflow',
  DELETE_WORKFLOW = 'delete_workflow',

  // Partner Management
  VIEW_PARTNERS = 'view_partners',
  CREATE_PARTNER = 'create_partner',
  UPDATE_PARTNER = 'update_partner',
  DELETE_PARTNER = 'delete_partner',
  SUSPEND_PARTNER = 'suspend_partner',
  ACTIVATE_PARTNER = 'activate_partner',
  VIEW_PARTNER_PERFORMANCE = 'view_partner_performance',
  MANAGE_SERVICE_MAPPING = 'manage_service_mapping',

  // Finance
  VIEW_FINANCE = 'view_finance',
  PROCESS_PAYOUT = 'process_payout',
  VIEW_PAYOUTS = 'view_payouts',
  GENERATE_REPORTS = 'generate_reports',

  // User Management
  VIEW_USERS = 'view_users',
  CREATE_USER = 'create_user',
  UPDATE_USER = 'update_user',
  DELETE_USER = 'delete_user',

  // System Settings
  MANAGE_SYSTEM_SETTINGS = 'manage_system_settings',
  VIEW_SYSTEM_LOGS = 'view_system_logs',

  // Role & Permission Management
  MANAGE_ROLES = 'manage_roles',
  MANAGE_PERMISSIONS = 'manage_permissions',
}

export type AdminPermissionType = (typeof AdminPermission)[keyof typeof AdminPermission];

// Role to Permission mapping
export const ROLE_PERMISSIONS: Record<AdminRole, AdminPermission[]> = {
  [AdminRole.SUPER_ADMIN]: Object.values(AdminPermission), // Super Admin has all permissions
  [AdminRole.ADMIN]: [
    AdminPermission.VIEW_DASHBOARD,
    AdminPermission.VIEW_REQUESTS,
    AdminPermission.CREATE_REQUEST,
    AdminPermission.UPDATE_REQUEST,
    AdminPermission.ASSIGN_REQUEST,
    AdminPermission.UPDATE_REQUEST_STATUS,
    AdminPermission.VIEW_WORKFLOWS,
    AdminPermission.CREATE_WORKFLOW,
    AdminPermission.UPDATE_WORKFLOW,
    AdminPermission.VIEW_PARTNERS,
    AdminPermission.CREATE_PARTNER,
    AdminPermission.UPDATE_PARTNER,
    AdminPermission.VIEW_PARTNER_PERFORMANCE,
    AdminPermission.VIEW_FINANCE,
    AdminPermission.VIEW_PAYOUTS,
    AdminPermission.GENERATE_REPORTS,
    AdminPermission.VIEW_USERS,
    AdminPermission.MANAGE_SERVICE_MAPPING,
  ],
  [AdminRole.OPERATIONS_MANAGER]: [
    AdminPermission.VIEW_DASHBOARD,
    AdminPermission.VIEW_REQUESTS,
    AdminPermission.CREATE_REQUEST,
    AdminPermission.UPDATE_REQUEST,
    AdminPermission.ASSIGN_REQUEST,
    AdminPermission.ESCALATE_REQUEST,
    AdminPermission.UPDATE_REQUEST_STATUS,
    AdminPermission.VIEW_WORKFLOWS,
    AdminPermission.CREATE_WORKFLOW,
    AdminPermission.UPDATE_WORKFLOW,
    AdminPermission.VIEW_PARTNERS,
    AdminPermission.VIEW_PARTNER_PERFORMANCE,
  ],
  [AdminRole.PARTNER_MANAGER]: [
    AdminPermission.VIEW_DASHBOARD,
    AdminPermission.VIEW_PARTNERS,
    AdminPermission.CREATE_PARTNER,
    AdminPermission.UPDATE_PARTNER,
    AdminPermission.ACTIVATE_PARTNER,
    AdminPermission.SUSPEND_PARTNER,
    AdminPermission.VIEW_PARTNER_PERFORMANCE,
    AdminPermission.MANAGE_SERVICE_MAPPING,
    AdminPermission.VIEW_REQUESTS,
  ],
  [AdminRole.FINANCE_ADMIN]: [
    AdminPermission.VIEW_DASHBOARD,
    AdminPermission.VIEW_FINANCE,
    AdminPermission.VIEW_PAYOUTS,
    AdminPermission.PROCESS_PAYOUT,
    AdminPermission.GENERATE_REPORTS,
    AdminPermission.VIEW_PARTNERS,
  ],
  [AdminRole.SUPPORT]: [
    AdminPermission.VIEW_DASHBOARD,
    AdminPermission.VIEW_REQUESTS,
    AdminPermission.CREATE_REQUEST,
    AdminPermission.UPDATE_REQUEST,
    AdminPermission.VIEW_PARTNERS,
    AdminPermission.VIEW_USERS,
  ],
};
