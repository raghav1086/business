import { Role } from '@business-app/shared/constants';

/**
 * Business Context Interface
 * 
 * Attached to request object by BusinessContextGuard.
 * Contains user's role, permissions, and access status for a business.
 */
export interface BusinessContext {
  businessId: string;
  userId: string;
  role: Role;
  isOwner: boolean;
  isSuperadmin: boolean;
  permissions: string[];
  businessUser?: {
    id: string;
    role: string;
    permissions?: Record<string, boolean> | null;
    status: string;
  };
}

