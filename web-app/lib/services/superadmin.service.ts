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
  owner?: {
    id: string;
    name?: string;
    phone: string;
    email?: string;
    last_login_at?: Date;
    total_businesses: number;
  };
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
  businesses?: {
    total: number;
    owned: number;
    assigned: number;
    list: Array<{
      id: string;
      name: string;
      role: string;
      isOwner: boolean;
      status: string;
    }>;
  };
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
export async function getAllUsers(limit?: number, includeBusinesses?: boolean): Promise<UserListItem[]> {
  const params: any = {};
  if (limit) params.limit = limit.toString();
  if (includeBusinesses) params.includeBusinesses = 'true';
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

/**
 * Analytics Types
 */
export interface OverviewAnalytics {
  userEngagement: {
    totalUsers: number;
    activeUsers: number;
    activePercentage: number;
    newUsersThisMonth: number;
  };
  businessActivity: {
    totalBusinesses: number;
    activeBusinesses: number;
    newBusinessesThisMonth: number;
    averageBusinessesPerUser: number;
  };
  growthRates: {
    userGrowthRate: number;
    businessGrowthRate: number;
  };
}

export interface UserAnalytics {
  retention: Array<{ month: string; newUsers: number; returningUsers: number }>;
  activeInactive: {
    active: number;
    inactive: number;
  };
  registrationFunnel: Array<{ stage: string; count: number }>;
  loginFrequency: Array<{ period: string; count: number }>;
}

export interface BusinessAnalytics {
  growthTrends: Array<{ month: string; count: number }>;
  typeAnalysis: Array<{ type: string; count: number }>;
  sizeDistribution: Array<{ size: string; count: number }>;
  activityHeatmap: Array<{ date: string; count: number }>;
}

export interface MarketAnalytics {
  marketPenetration: {
    totalPotentialUsers: number;
    currentUsers: number;
    penetrationRate: number;
  };
  acquisitionChannels: Array<{ channel: string; count: number }>;
  lifecycle: {
    newUsers: number;
    activeUsers: number;
    churnedUsers: number;
  };
  churn: {
    churnRate: number;
    retentionRate: number;
  };
}

/**
 * Get overview analytics (superadmin only)
 */
export async function getAnalyticsOverview(): Promise<OverviewAnalytics> {
  const response = await businessApi.get('/admin/analytics/overview');
  return response.data;
}

/**
 * Get user analytics (superadmin only)
 */
export async function getUserAnalytics(): Promise<UserAnalytics> {
  const response = await businessApi.get('/admin/analytics/users');
  return response.data;
}

/**
 * Get business analytics (superadmin only)
 */
export async function getBusinessAnalytics(): Promise<BusinessAnalytics> {
  const response = await businessApi.get('/admin/analytics/businesses');
  return response.data;
}

/**
 * Get market analytics (superadmin only)
 */
export async function getMarketAnalytics(): Promise<MarketAnalytics> {
  const response = await businessApi.get('/admin/analytics/market');
  return response.data;
}

/**
 * Export functions
 */
export async function exportBusinesses(format: 'csv' | 'json' = 'csv', startDate?: string, endDate?: string): Promise<Blob> {
  const params: any = { format };
  if (startDate) params.startDate = startDate;
  if (endDate) params.endDate = endDate;
  const response = await businessApi.get('/admin/export/businesses', {
    params,
    responseType: 'blob',
  });
  return response.data;
}

export async function exportUsers(format: 'csv' | 'json' = 'csv', startDate?: string, endDate?: string): Promise<Blob> {
  const params: any = { format };
  if (startDate) params.startDate = startDate;
  if (endDate) params.endDate = endDate;
  const response = await businessApi.get('/admin/export/users', {
    params,
    responseType: 'blob',
  });
  return response.data;
}

export async function exportAnalytics(format: 'csv' | 'json' = 'csv', dateRange?: string): Promise<Blob> {
  const params: any = { format };
  if (dateRange) params.dateRange = dateRange;
  const response = await businessApi.get('/admin/export/analytics', {
    params,
    responseType: 'blob',
  });
  return response.data;
}

