export enum UserRole {
  SUPER_ADMIN = 'Super Admin',
  ADMIN = 'Admin',
  PROCUREMENT_OFFICER = 'Procurement Officer',
  DEPARTMENT_USER = 'Department User',
  APPROVER = 'Approver',
  AUDITOR = 'Auditor',
}

export interface Permission {
  action: string;
  subject: string;
}

export const RolePermissions: Record<UserRole, string[]> = {
  [UserRole.SUPER_ADMIN]: ['all'],
  [UserRole.ADMIN]: [
    'view_dashboard',
    'manage_inventory',
    'manage_receiving',
    'manage_requests',
    'manage_procurement',
    'view_reports',
    'manage_settings',
  ],
  [UserRole.PROCUREMENT_OFFICER]: [
    'view_dashboard',
    'manage_procurement',
    'view_inventory',
    'view_reports',
  ],
  [UserRole.DEPARTMENT_USER]: [
    'view_dashboard',
    'create_request',
    'view_own_requests',
  ],
  [UserRole.APPROVER]: [
    'view_dashboard',
    'approve_requests',
    'approve_tenders',
  ],
  [UserRole.AUDITOR]: [
    'view_dashboard',
    'view_reports',
    'view_inventory',
    'view_procurement',
  ],
};

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  image?: string;
}
