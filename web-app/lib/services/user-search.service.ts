/**
 * User Search Service
 * 
 * Provides functionality to search for users by phone, email, or name.
 * This is a frontend service that helps with user lookup for RBAC.
 */

import { authApi } from '@/lib/api-client';

export interface UserSearchResult {
  id: string;
  phone: string;
  name?: string;
  email?: string;
  avatar_url?: string;
  phone_verified: boolean;
  email_verified: boolean;
  is_superadmin?: boolean;
  user_type?: string;
  last_login_at?: string;
  created_at?: string;
  updated_at?: string;
  status?: string;
  language_preference?: string;
}

/**
 * Search for users by phone, email, or name
 */
export async function searchUsers(query: string, limit: number = 20): Promise<UserSearchResult[]> {
  try {
    if (!query || query.length < 2) {
      return [];
    }
    const response = await authApi.get('/users/search', {
      params: { q: query, limit },
    });
    return (response.data || []).map((user: any) => ({
      id: user.id,
      phone: user.phone,
      name: user.name,
      email: user.email,
      avatar_url: user.avatar_url,
      phone_verified: user.phone_verified,
      email_verified: user.email_verified,
      is_superadmin: user.is_superadmin,
      user_type: user.user_type,
      last_login_at: user.last_login_at,
      created_at: user.created_at,
      updated_at: user.updated_at,
      status: user.status,
      language_preference: user.language_preference,
    }));
  } catch (error) {
    console.error('Error searching users:', error);
    return [];
  }
}

/**
 * Search for a user by phone number
 * @deprecated Use searchUsers instead
 */
export async function searchUserByPhone(phone: string): Promise<UserSearchResult | null> {
  try {
    const results = await searchUsers(phone, 1);
    return results.length > 0 ? results[0] : null;
  } catch (error) {
    console.error('Error searching user by phone:', error);
    return null;
  }
}

/**
 * Search for a user by email
 * @deprecated Use searchUsers instead
 */
export async function searchUserByEmail(email: string): Promise<UserSearchResult | null> {
  try {
    const results = await searchUsers(email, 1);
    return results.length > 0 ? results[0] : null;
  } catch (error) {
    console.error('Error searching user by email:', error);
    return null;
  }
}

/**
 * Get user details by ID
 */
export async function getUserById(userId: string): Promise<UserSearchResult | null> {
  try {
    const response = await authApi.get(`/users/${userId}`);
    return {
      id: response.data.id,
      phone: response.data.phone,
      name: response.data.name,
      email: response.data.email,
      avatar_url: response.data.avatar_url,
      phone_verified: response.data.phone_verified,
      email_verified: response.data.email_verified,
      is_superadmin: response.data.is_superadmin,
      user_type: response.data.user_type,
      last_login_at: response.data.last_login_at,
      created_at: response.data.created_at,
      updated_at: response.data.updated_at,
      status: response.data.status,
      language_preference: response.data.language_preference,
    };
  } catch (error: any) {
    if (error.response?.status === 404) {
      return null;
    }
    console.error('Error getting user by ID:', error);
    return null;
  }
}

/**
 * Format phone number for display
 */
export function formatPhoneNumber(phone: string): string {
  // Remove country code if present (91)
  let cleaned = phone.replace(/\D/g, '');
  if (cleaned.startsWith('91') && cleaned.length === 12) {
    cleaned = cleaned.substring(2);
  }
  
  // Format as XXX XXX XXXX
  if (cleaned.length === 10) {
    return `${cleaned.substring(0, 5)} ${cleaned.substring(5)}`;
  }
  
  return phone;
}

/**
 * Get user initials for avatar fallback
 */
export function getUserInitials(name?: string, phone?: string): string {
  if (name) {
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }
  if (phone) {
    // Use last 2 digits
    const cleaned = phone.replace(/\D/g, '');
    return cleaned.slice(-2);
  }
  return '??';
}

