import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { Permission } from '@business-app/shared/constants';
import { BusinessContext } from '@business-app/shared/types';

/**
 * Permission Guard
 * 
 * Checks if user has the required permission in the current business context.
 * Requires BusinessContextGuard to run first.
 * 
 * Usage:
 * @UseGuards(BusinessContextGuard, PermissionGuard)
 * @RequirePermission(Permission.INVOICE_CREATE)
 * @Post()
 * async createInvoice() { ... }
 */
@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Get required permission from decorator metadata
    const requiredPermission = this.reflector.get<Permission>(
      'permission',
      context.getHandler()
    );

    // If no permission required, allow access
    if (!requiredPermission) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request & { businessContext?: BusinessContext }>();
    const businessContext = request.businessContext;

    if (!businessContext) {
      throw new ForbiddenException('Business context not found. Ensure BusinessContextGuard is applied.');
    }

    // Superadmin has all permissions
    if (businessContext.isSuperadmin) {
      return true;
    }

    // Check if user has required permission
    const hasPermission = businessContext.permissions.includes(requiredPermission);

    // Debug: Log permission check details
    if (!hasPermission) {
      console.error(`[PermissionGuard] Permission denied:`, {
        requiredPermission,
        userId: businessContext.userId,
        businessId: businessContext.businessId,
        permissionsCount: businessContext.permissions.length,
        permissions: businessContext.permissions.slice(0, 10), // First 10 for debugging
        hasRequired: businessContext.permissions.includes(requiredPermission),
      });
      throw new ForbiddenException(
        `You do not have permission: ${requiredPermission}`
      );
    }

    return true;
  }
}

