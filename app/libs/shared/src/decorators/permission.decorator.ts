import { SetMetadata } from '@nestjs/common';
import { Permission } from '@business-app/shared/constants';

/**
 * Permission Decorator
 * 
 * Marks a route handler as requiring a specific permission.
 * Must be used with PermissionGuard.
 * 
 * Usage:
 * @RequirePermission(Permission.INVOICE_CREATE)
 * @Post()
 * async createInvoice() { ... }
 */
export const RequirePermission = (permission: Permission) =>
  SetMetadata('permission', permission);

