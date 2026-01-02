import {
  Injectable,
  CanActivate,
  ExecutionContext,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { Request } from 'express';
import { BusinessContextService } from '../services/business-context.service';
import { BusinessContext } from '@business-app/shared/types';

/**
 * Business Context Guard (Business Service)
 * 
 * Validates that user has access to the business specified in the request.
 * Attaches BusinessContext to request object for use in controllers/services.
 * 
 * Business ID is extracted from:
 * - URL params: /businesses/:businessId/...
 * - Request body: { businessId: ... }
 * - Query params: ?businessId=...
 */
@Injectable()
export class BusinessContextGuard implements CanActivate {
  constructor(
    private readonly businessContextService: BusinessContextService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request & { 
      businessContext?: BusinessContext;
      user?: { id: string; phone: string; is_superadmin?: boolean };
    }>();
    const user = request.user;

    if (!user || !user.id) {
      throw new ForbiddenException('User not authenticated');
    }

    // Extract businessId from params, body, or query
    const businessId =
      request.params.businessId ||
      request.body?.businessId ||
      request.query?.businessId;

    if (!businessId) {
      throw new BadRequestException('Business ID is required');
    }

    try {
      // Resolve business context
      const businessContext = await this.businessContextService.resolveBusinessContext(
        user.id,
        businessId,
        user.is_superadmin || false
      );

      // Attach to request for use in controllers/services
      request.businessContext = businessContext;

      return true;
    } catch (error) {
      if (error instanceof ForbiddenException || error instanceof BadRequestException) {
        throw error;
      }
      throw new ForbiddenException('You do not have access to this business');
    }
  }
}

