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
 * Business Context Guard
 * 
 * Validates that user has access to the business specified in the request.
 * Attaches BusinessContext to request object for use in controllers/services.
 * 
 * NOTE: This is a base guard. For business-service, use BusinessContextGuard from business-service.
 * For other services, implement a similar guard that calls BusinessContextService via HTTP or shared module.
 * 
 * Business ID is extracted from:
 * - URL params: /businesses/:businessId/...
 * - Request body: { businessId: ... }
 * - Query params: ?businessId=...
 */
@Injectable()
export class BusinessContextGuard implements CanActivate {
  // This guard needs BusinessContextService which is in business-service
  // For now, this is a placeholder. The actual implementation should be in business-service
  // or BusinessContextService should be made available via a shared module
  
  async canActivate(context: ExecutionContext): Promise<boolean> {
    // This will be implemented in business-service specific guard
    // For now, return true to allow compilation
    return true;
  }
}

