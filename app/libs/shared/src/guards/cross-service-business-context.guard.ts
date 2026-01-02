import {
  Injectable,
  CanActivate,
  ExecutionContext,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { Request } from 'express';
import { BusinessContext } from '../types/business-context.types';

/**
 * Cross-Service Business Context Guard
 * 
 * For services that don't have direct access to BusinessContextService.
 * This guard extracts businessId from headers and validates it's present.
 * 
 * Note: Actual business access validation should be done via:
 * 1. HTTP call to business-service API
 * 2. Shared database access (if services share DB)
 * 3. Service-specific validation in the service layer
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

    // For now, attach basic context - actual validation happens in service layer
    // Services should validate business access in their service methods
    request.businessContext = {
      businessId,
      userId: user.id,
      role: 'unknown' as any, // Will be resolved by service layer if needed
      isOwner: false,
      isSuperadmin: user.is_superadmin || false,
      permissions: [], // Will be resolved by service layer if needed
    };

    // If superadmin, allow access (they have access to all businesses)
    if (user.is_superadmin) {
      request.businessContext.isSuperadmin = true;
      request.businessContext.permissions = []; // All permissions for superadmin
      return true;
    }

    // For non-superadmin users, basic validation passes
    // Actual business access check should be done in service layer
    // by calling business-service API or checking shared database
    return true;
  }
}

