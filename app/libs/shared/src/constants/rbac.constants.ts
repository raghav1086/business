/**
 * RBAC Constants
 * 
 * Defines roles, permissions, and role-to-permission mappings
 * Following "Permissive by Default" philosophy: roles have full permissions
 */

/**
 * User Roles
 */
export enum Role {
  SUPERADMIN = 'superadmin',
  OWNER = 'owner',
  ADMIN = 'admin',
  EMPLOYEE = 'employee',
  ACCOUNTANT = 'accountant',
  SALESMAN = 'salesman',
  VIEWER = 'viewer',
}

/**
 * Permissions
 * Format: resource:action
 */
export enum Permission {
  // Business Management
  BUSINESS_VIEW = 'business:view',
  BUSINESS_UPDATE = 'business:update',
  BUSINESS_DELETE = 'business:delete',
  BUSINESS_SETTINGS = 'business:settings',

  // User Management
  USER_INVITE = 'user:invite',
  USER_ASSIGN = 'user:assign',
  USER_REMOVE = 'user:remove',
  USER_UPDATE_ROLE = 'user:update_role',
  USER_VIEW = 'user:view',

  // Invoice Operations
  INVOICE_CREATE = 'invoice:create',
  INVOICE_READ = 'invoice:read',
  INVOICE_UPDATE = 'invoice:update',
  INVOICE_DELETE = 'invoice:delete',
  INVOICE_CANCEL = 'invoice:cancel',
  INVOICE_EXPORT = 'invoice:export',

  // Party Operations
  PARTY_CREATE = 'party:create',
  PARTY_READ = 'party:read',
  PARTY_UPDATE = 'party:update',
  PARTY_DELETE = 'party:delete',

  // Inventory Operations
  INVENTORY_CREATE = 'inventory:create',
  INVENTORY_READ = 'inventory:read',
  INVENTORY_UPDATE = 'inventory:update',
  INVENTORY_DELETE = 'inventory:delete',
  INVENTORY_ADJUST = 'inventory:adjust',

  // Payment Operations
  PAYMENT_CREATE = 'payment:create',
  PAYMENT_READ = 'payment:read',
  PAYMENT_UPDATE = 'payment:update',
  PAYMENT_DELETE = 'payment:delete',

  // Reports
  REPORT_VIEW = 'report:view',
  REPORT_GST = 'report:gst',
  REPORT_EXPORT = 'report:export',
  REPORT_FINANCIAL = 'report:financial',

  // Audit Logs
  AUDIT_LOGS_VIEW = 'audit:view',
}

/**
 * Role to Permissions Mapping
 * 
 * Each role has ALL permissions for their domain by default.
 * Admins can restrict specific permissions via UI.
 */
export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  [Role.SUPERADMIN]: Object.values(Permission), // All permissions

  [Role.OWNER]: [
    // Business Management
    Permission.BUSINESS_VIEW,
    Permission.BUSINESS_UPDATE,
    Permission.BUSINESS_DELETE,
    Permission.BUSINESS_SETTINGS,

    // User Management
    Permission.USER_INVITE,
    Permission.USER_ASSIGN,
    Permission.USER_REMOVE,
    Permission.USER_UPDATE_ROLE,
    Permission.USER_VIEW,

    // Invoice Operations
    Permission.INVOICE_CREATE,
    Permission.INVOICE_READ,
    Permission.INVOICE_UPDATE,
    Permission.INVOICE_DELETE,
    Permission.INVOICE_CANCEL,
    Permission.INVOICE_EXPORT,

    // Party Operations
    Permission.PARTY_CREATE,
    Permission.PARTY_READ,
    Permission.PARTY_UPDATE,
    Permission.PARTY_DELETE,

    // Inventory Operations
    Permission.INVENTORY_CREATE,
    Permission.INVENTORY_READ,
    Permission.INVENTORY_UPDATE,
    Permission.INVENTORY_DELETE,
    Permission.INVENTORY_ADJUST,

    // Payment Operations
    Permission.PAYMENT_CREATE,
    Permission.PAYMENT_READ,
    Permission.PAYMENT_UPDATE,
    Permission.PAYMENT_DELETE,

    // Reports
    Permission.REPORT_VIEW,
    Permission.REPORT_GST,
    Permission.REPORT_EXPORT,
    Permission.REPORT_FINANCIAL,

    // Audit Logs
    Permission.AUDIT_LOGS_VIEW,
  ],

  [Role.ADMIN]: [
    // Business Management (read-only for settings)
    Permission.BUSINESS_VIEW,
    Permission.BUSINESS_SETTINGS,

    // User Management
    Permission.USER_INVITE,
    Permission.USER_ASSIGN,
    Permission.USER_REMOVE,
    Permission.USER_UPDATE_ROLE,
    Permission.USER_VIEW,

    // Invoice Operations
    Permission.INVOICE_CREATE,
    Permission.INVOICE_READ,
    Permission.INVOICE_UPDATE,
    Permission.INVOICE_DELETE,
    Permission.INVOICE_CANCEL,
    Permission.INVOICE_EXPORT,

    // Party Operations
    Permission.PARTY_CREATE,
    Permission.PARTY_READ,
    Permission.PARTY_UPDATE,
    Permission.PARTY_DELETE,

    // Inventory Operations
    Permission.INVENTORY_CREATE,
    Permission.INVENTORY_READ,
    Permission.INVENTORY_UPDATE,
    Permission.INVENTORY_DELETE,
    Permission.INVENTORY_ADJUST,

    // Payment Operations
    Permission.PAYMENT_CREATE,
    Permission.PAYMENT_READ,
    Permission.PAYMENT_UPDATE,

    // Reports
    Permission.REPORT_VIEW,
    Permission.REPORT_GST,
    Permission.REPORT_EXPORT,
    Permission.REPORT_FINANCIAL,

    // Audit Logs
    Permission.AUDIT_LOGS_VIEW,
  ],

  [Role.EMPLOYEE]: [
    // Invoice Operations
    Permission.INVOICE_CREATE,
    Permission.INVOICE_READ,
    Permission.INVOICE_UPDATE,
    Permission.INVOICE_EXPORT,

    // Party Operations
    Permission.PARTY_READ,

    // Inventory Operations
    Permission.INVENTORY_READ,

    // Payment Operations
    Permission.PAYMENT_READ,
  ],

  [Role.ACCOUNTANT]: [
    // Invoice Operations
    Permission.INVOICE_CREATE,
    Permission.INVOICE_READ,
    Permission.INVOICE_UPDATE,
    Permission.INVOICE_EXPORT,

    // Party Operations
    Permission.PARTY_CREATE,
    Permission.PARTY_READ,
    Permission.PARTY_UPDATE,

    // Inventory Operations
    Permission.INVENTORY_READ,

    // Payment Operations
    Permission.PAYMENT_CREATE,
    Permission.PAYMENT_READ,
    Permission.PAYMENT_UPDATE,

    // Reports
    Permission.REPORT_VIEW,
    Permission.REPORT_GST,
    Permission.REPORT_EXPORT,
    Permission.REPORT_FINANCIAL,
  ],

  [Role.SALESMAN]: [
    // Invoice Operations
    Permission.INVOICE_CREATE,
    Permission.INVOICE_READ,
    Permission.INVOICE_UPDATE,
    Permission.INVOICE_EXPORT,

    // Party Operations
    Permission.PARTY_CREATE,
    Permission.PARTY_READ,
    Permission.PARTY_UPDATE,

    // Inventory Operations
    Permission.INVENTORY_READ,

    // Payment Operations
    Permission.PAYMENT_READ,
  ],

  [Role.VIEWER]: [
    // Read-only permissions
    Permission.INVOICE_READ,
    Permission.INVOICE_EXPORT,
    Permission.PARTY_READ,
    Permission.INVENTORY_READ,
    Permission.PAYMENT_READ,
    Permission.REPORT_VIEW,
  ],
};

/**
 * Calculate effective permissions from role and custom permissions
 * 
 * @param role - User's role
 * @param customPermissions - Custom permission overrides (null = use all role permissions)
 * @returns Array of effective permissions
 */
export function calculateEffectivePermissions(
  role: Role,
  customPermissions?: Record<string, boolean> | null
): Permission[] {
  // Get base permissions from role
  let permissions = ROLE_PERMISSIONS[role] || [];

  // If customPermissions is null or empty, return all role permissions (full access)
  if (!customPermissions || Object.keys(customPermissions).length === 0) {
    return permissions;
  }

  // Apply custom overrides
  // Only denied permissions (false) are stored
  // Allowed permissions (true) are redundant but explicit
  Object.entries(customPermissions).forEach(([perm, allowed]) => {
    if (allowed === false) {
      // Remove denied permission
      permissions = permissions.filter((p) => p !== perm);
    } else if (allowed === true) {
      // Explicitly allow (add if not already present)
      if (!permissions.includes(perm as Permission)) {
        permissions.push(perm as Permission);
      }
    }
  });

  // Remove duplicates and return
  return Array.from(new Set(permissions));
}

/**
 * Check if user has specific permission
 */
export function hasPermission(
  role: Role,
  permission: Permission,
  customPermissions?: Record<string, boolean> | null
): boolean {
  const effectivePermissions = calculateEffectivePermissions(role, customPermissions);
  return effectivePermissions.includes(permission);
}

