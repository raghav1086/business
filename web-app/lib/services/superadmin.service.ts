/**
 * Superadmin Service
 * 
 * Provides API functions for superadmin system-wide management.
 */

import { businessApi, authApi } from '@/lib/api-client';

export interface SystemStats {
  totalBusinesses: number;
  activeBusinesses: number;
  inactiveBusinesses: number;
  totalUsers: number;
  activeUsers: number;
  businessesGrowth: Array<{ month: string; count: number }>;
  usersGrowth: Array<{ month: string; count: number }>;
  businessTypeDistribution: Array<{ type: string; count: number }>;
  userTypeDistribution: Array<{ type: string; count: number }>;
  recentBusinesses: number;
  recentUsers: number;
}

export interface BusinessListItem {
  id: string;
  owner_id: string;
  name: string;
  type: string;
  gstin?: string;
  status: string;
  created_at: Date;
  updated_at: Date;
}

export interface UserListItem {
  id: string;
  phone: string;
  name?: string;
  email?: string;
  is_superadmin: boolean;
  status: string;
  created_at: Date;
  last_login_at?: Date;
}

/**
 * Get system statistics
 */
export async function getSystemStats(): Promise<SystemStats> {
  const response = await businessApi.get('/businesses/admin/stats');
  return response.data;
}

/**
 * Get all businesses (superadmin only)
 */
export async function getAllBusinesses(): Promise<BusinessListItem[]> {
  const response = await businessApi.get('/businesses');
  return response.data || [];
}

/**
 * Get all users (superadmin only)
 */
export async function getAllUsers(limit?: number): Promise<UserListItem[]> {
  const params = limit ? { limit: limit.toString() } : {};
  const response = await authApi.get('/users/admin/all', { params });
  return response.data || [];
}

/**
 * Get user count (superadmin only)
 */
export async function getUserCount(): Promise<number> {
  const response = await authApi.get('/users/admin/count');
  return response.data?.count || 0;
}

/**
 * Audit Log Types
 */
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
  businessId?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
}

export interface AuditLogStatistics {
  totalLogs: number;
  mostActiveUsers: Array<{ user_id: string; count: number }>;
  mostCommonActions: Array<{ action: string; count: number }>;
  logsByBusiness: Array<{ business_id: string; count: number }>;
}

/**
 * Get all audit logs (superadmin only)
 */
export async function getAllAuditLogs(filters?: AuditLogFilters): Promise<{ total: number; logs: AuditLog[] }> {
  const params: any = {};
  if (filters?.action) params.action = filters.action;
  if (filters?.userId) params.userId = filters.userId;
  if (filters?.targetUserId) params.targetUserId = filters.targetUserId;
  if (filters?.businessId) params.businessId = filters.businessId;
  if (filters?.startDate) params.startDate = filters.startDate;
  if (filters?.endDate) params.endDate = filters.endDate;
  if (filters?.limit) params.limit = filters.limit.toString();

  const response = await businessApi.get('/admin/audit-logs', { params });
  return response.data || { total: 0, logs: [] };
}

/**
 * Get audit log statistics (superadmin only)
 */
export async function getAuditLogStatistics(): Promise<AuditLogStatistics> {
  const response = await businessApi.get('/admin/audit-logs/statistics');
  return response.data;
}

