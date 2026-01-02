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

