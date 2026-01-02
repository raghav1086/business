import {
  Injectable,
  CanActivate,
  ExecutionContext,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { Request } from 'express';
import { BusinessContext } from '../types/business-context.types';
import { Role, Permission, calculateEffectivePermissions } from '../constants';

/**
 * Cross-Service Business Context Guard
 * 
 * For services that don't have direct access to BusinessContextService.
 * This guard extracts businessId from headers and grants permissions based on role.
 * 
 * IMPORTANT: This guard grants full permissions to all users by default for backward compatibility.
 * For production, this should call business-service API to resolve actual permissions.
 * 
 * Business ID is extracted from:
 * - Header: x-business-id
 * - URL params: /businesses/:businessId/...
 * - Request body: { businessId: ... }
 * - Query params: ?businessId=...
 */
@Injectable()
export class CrossServiceBusinessContextGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request & { businessContext?: BusinessContext; user?: any }>();
    const user = request.user;

    if (!user || !user.id) {
      throw new ForbiddenException('User not authenticated');
    }

    // Extract businessId from multiple sources
    const businessId =
      request.headers['x-business-id'] as string ||
      request.params.businessId ||
      request.body?.businessId ||
      request.query?.businessId;

    if (!businessId) {
      throw new BadRequestException('Business ID is required. Provide via x-business-id header, URL param, body, or query.');
    }

    // If superadmin, grant all permissions
    if (user.is_superadmin) {
      const allPermissions = Object.values(Permission);
      request.businessContext = {
        businessId,
        userId: user.id,
        role: Role.SUPERADMIN,
        isOwner: false,
        isSuperadmin: true,
        permissions: allPermissions,
      };
      return true;
    }

    // For existing users: Grant full permissions (backward compatibility)
    // This ensures all existing users work seamlessly during migration
    // TODO: In production, call business-service API to resolve actual permissions
    const ownerPermissions = calculateEffectivePermissions(Role.OWNER, null);
    
    // Debug: Log permissions to verify they're being set
    console.log(`[CrossServiceBusinessContextGuard] Setting permissions for user ${user.id}, business ${businessId}:`, {
      permissionsCount: ownerPermissions.length,
      hasInventoryRead: ownerPermissions.includes(Permission.INVENTORY_READ),
      hasInvoiceRead: ownerPermissions.includes(Permission.INVOICE_READ),
      hasPartyRead: ownerPermissions.includes(Permission.PARTY_READ),
      hasPaymentRead: ownerPermissions.includes(Permission.PAYMENT_READ),
    });
    
    request.businessContext = {
      businessId,
      userId: user.id,
      role: Role.OWNER, // Assume owner for existing users
      isOwner: true, // Assume owner for backward compatibility
      isSuperadmin: false,
      permissions: ownerPermissions, // Full permissions for seamless experience
    };

    return true;
  }
}

