import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { BusinessUserRepository } from '../repositories/business-user.repository';
import { BusinessRepository } from '../repositories/business.repository';
import { Role, Permission, calculateEffectivePermissions } from '@business-app/shared/constants';
import { BusinessUser } from '../entities/business-user.entity';
import { BusinessContext } from '@business-app/shared/types';

/**
 * Business Context Service
 * 
 * Resolves user's access to a business and calculates effective permissions.
 */
@Injectable()
export class BusinessContextService {
  constructor(
    private readonly businessUserRepository: BusinessUserRepository,
    private readonly businessRepository: BusinessRepository
  ) {}

  /**
   * Resolve business context for a user
   * Returns BusinessContext with role, permissions, and access status
   */
  async resolveBusinessContext(
    userId: string,
    businessId: string,
    isSuperadmin: boolean = false
  ): Promise<BusinessContext> {
    // Superadmin has access to all businesses with all permissions
    if (isSuperadmin) {
      const allPermissions = Object.values(Permission);
      return {
        businessId,
        userId,
        role: Role.SUPERADMIN,
        isOwner: false,
        isSuperadmin: true,
        permissions: allPermissions,
      };
    }

    // Check if user is owner
    const business = await this.businessRepository.findById(businessId);
    if (!business) {
      throw new NotFoundException('Business not found');
    }

    const isOwner = business.owner_id === userId;
    if (isOwner) {
      // Owner has all permissions
      const ownerPermissions = calculateEffectivePermissions(Role.OWNER, null);
      return {
        businessId,
        userId,
        role: Role.OWNER,
        isOwner: true,
        isSuperadmin: false,
        permissions: ownerPermissions,
      };
    }

    // Check business_users table
    const businessUser = await this.businessUserRepository.findByBusinessAndUser(
      businessId,
      userId
    );

    if (!businessUser || businessUser.status !== 'active') {
      throw new ForbiddenException('User not assigned to business');
    }

    // Calculate effective permissions
    const effectivePermissions = calculateEffectivePermissions(
      businessUser.role as Role,
      businessUser.permissions
    );

    return {
      businessId,
      userId,
      role: businessUser.role as Role,
      isOwner: false,
      isSuperadmin: false,
      permissions: effectivePermissions,
      businessUser: {
        id: businessUser.id,
        role: businessUser.role,
        permissions: businessUser.permissions,
        status: businessUser.status,
      },
    };
  }

  /**
   * Check if user has access to business
   */
  async checkBusinessAccess(
    userId: string,
    businessId: string,
    isSuperadmin: boolean = false
  ): Promise<boolean> {
    if (isSuperadmin) {
      return true;
    }

    // Check if owner
    const business = await this.businessRepository.findById(businessId);
    if (business?.owner_id === userId) {
      return true;
    }

    // Check if assigned
    return this.businessUserRepository.isUserAssigned(businessId, userId);
  }
}

