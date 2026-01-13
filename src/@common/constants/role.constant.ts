export enum AdminRole {
  SUPER_ADMIN = 'super_admin',
  ADMIN = 'admin',
  OPERATIONS_MANAGER = 'operations_manager',
  PARTNER_MANAGER = 'partner_manager',
  FINANCE_ADMIN = 'finance_admin',
  SUPPORT = 'support',
}

export type AdminRoleType = (typeof AdminRole)[keyof typeof AdminRole];
