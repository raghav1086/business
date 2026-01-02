/**
 * RBAC Service
 * 
 * Provides API functions for managing RBAC (Role-Based Access Control)
 * including user management, permissions, and audit logs.
 */

import { businessApi } from '@/lib/api-client';

// Role enum - matching backend
export enum Role {
  SUPERADMIN = 'superadmin',
  OWNER = 'owner',
  ADMIN = 'admin',
  EMPLOYEE = 'employee',
  ACCOUNTANT = 'accountant',
  SALESMAN = 'salesman',
  VIEWER = 'viewer',
}

// Types
export interface BusinessUser {
  id: string;
  business_id: string;
  user_id: string;
  role: Role;
  permissions?: Record<string, boolean> | null;
  status: string;
  invited_at?: Date;
  joined_at?: Date;
  invited_by?: string;
  removed_at?: Date;
  removed_by?: string;
  created_at: Date;
  updated_at: Date;
  // User details (fetched separately)
  user?: {
    id: string;
    phone: string;
    name?: string;
    email?: string;
    avatar_url?: string;
  };
}

export interface UserPermissions {
  userId: string;
  businessId: string;
  role: Role;
  permissionMode: 'role_defaults' | 'custom';
  rolePermissions: string[];
  customRestrictions?: Record<string, boolean>;
  effectivePermissions: string[];
  permissionSummary: {
    total: number;
    allowed: number;
    restricted: number;
    fromRole: number;
    custom: number;
  };
  categories?: Record<string, {
    total: number;
    allowed: number;
    restricted: number;
    restrictedPermissions?: string[];
  }>;
}

export interface PermissionCategory {
  name: string;
  permissions: Array<{
    key: string;
    label: string;
    description: string;
    defaultRoles: string[];
  }>;
}

export interface AuditLog {
  id: string;
  business_id: string;
  user_id?: string;
  target_user_id?: string;
  action: string;
  resource?: string;
  resource_id?: string;
  old_value?: Record<string, any>;
  new_value?: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  notes?: string;
  created_at: Date;
  updated_at: Date;
}

export interface AuditLogFilters {
  action?: string;
  userId?: string;
  targetUserId?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
}

/**
 * Get all users in a business
 */
export async function getBusinessUsers(businessId: string): Promise<BusinessUser[]> {
  const response = await businessApi.get(`/businesses/${businessId}/users`);
  return response.data || [];
}

/**
 * Assign a user to a business with a role (by phone number)
 */
export async function assignUserToBusiness(
  businessId: string,
  phone: string,
  role: Role
): Promise<BusinessUser> {
  const response = await businessApi.post(`/businesses/${businessId}/users`, {
    phone,
    role,
  });
  return response.data;
}

/**
 * Update user role in a business
 */
export async function updateUserRole(
  businessId: string,
  userId: string,
  role: Role
): Promise<BusinessUser> {
  const response = await businessApi.patch(`/businesses/${businessId}/users/${userId}/role`, {
    role,
  });
  return response.data;
}

/**
 * Remove a user from a business
 */
export async function removeUserFromBusiness(
  businessId: string,
  userId: string
): Promise<void> {
  await businessApi.delete(`/businesses/${businessId}/users/${userId}`);
}

/**
 * Get user permissions in a business
 */
export async function getUserPermissions(
  businessId: string,
  userId: string
): Promise<UserPermissions> {
  const response = await businessApi.get(
    `/businesses/${businessId}/users/${userId}/permissions`
  );
  return response.data;
}

/**
 * Update user permissions
 */
export async function updateUserPermissions(
  businessId: string,
  userId: string,
  permissions: Record<string, boolean> | null
): Promise<BusinessUser> {
  const response = await businessApi.patch(
    `/businesses/${businessId}/users/${userId}/permissions`,
    { permissions }
  );
  return response.data;
}

/**
 * Reset user permissions to role defaults
 */
export async function resetUserPermissions(
  businessId: string,
  userId: string
): Promise<BusinessUser> {
  const response = await businessApi.delete(
    `/businesses/${businessId}/users/${userId}/permissions`
  );
  return response.data;
}

/**
 * Get all available permissions with categories
 */
export async function getAllPermissions(): Promise<{ categories: PermissionCategory[] }> {
  const response = await businessApi.get('/permissions');
  return response.data;
}

/**
 * Get audit logs for a business
 */
export async function getBusinessAuditLogs(
  businessId: string,
  filters?: AuditLogFilters
): Promise<{ businessId: string; total: number; logs: AuditLog[] }> {
  const params = new URLSearchParams();
  if (filters?.action) params.append('action', filters.action);
  if (filters?.userId) params.append('userId', filters.userId);
  if (filters?.targetUserId) params.append('targetUserId', filters.targetUserId);
  if (filters?.startDate) params.append('startDate', filters.startDate);
  if (filters?.endDate) params.append('endDate', filters.endDate);
  if (filters?.limit) params.append('limit', filters.limit.toString());

  const queryString = params.toString();
  const url = `/businesses/${businessId}/audit-logs${queryString ? `?${queryString}` : ''}`;
  const response = await businessApi.get(url);
  return response.data;
}

/**
 * Get user details in a business
 */
export async function getUserDetails(
  businessId: string,
  userId: string
): Promise<BusinessUser> {
  const response = await businessApi.get(`/businesses/${businessId}/users/${userId}`);
  return response.data;
}

