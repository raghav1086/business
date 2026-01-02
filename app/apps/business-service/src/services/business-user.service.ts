import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import { BusinessUserRepository } from '../repositories/business-user.repository';
import { BusinessRepository } from '../repositories/business.repository';
import { AuditService } from './audit.service';
import { BusinessUser } from '../entities/business-user.entity';
import { Role, calculateEffectivePermissions } from '@business-app/shared/constants';
import { Request } from 'express';

/**
 * BusinessUser Service
 * 
 * Manages user assignments to businesses, roles, and permissions.
 * Implements "Permissive by Default" - new assignments get full role permissions.
 */
@Injectable()
export class BusinessUserService {
  private readonly httpClient: AxiosInstance;

  constructor(
    private readonly businessUserRepository: BusinessUserRepository,
    private readonly businessRepository: BusinessRepository,
    private readonly auditService: AuditService,
    private readonly configService: ConfigService
  ) {
    this.httpClient = axios.create({
      timeout: 10000,
    });
  }

  /**
   * Get user ID by phone number (calls auth-service)
   */
  private async getUserIdByPhone(phone: string, authToken?: string): Promise<string> {
    const authServiceUrl = this.configService.get<string>('AUTH_SERVICE_URL', 'http://localhost:3002');
    
    try {
      const headers: any = {
        'Content-Type': 'application/json',
      };
      
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }

      const response = await this.httpClient.get(
        `${authServiceUrl}/api/v1/users/search?q=${encodeURIComponent(phone)}`,
        { headers }
      );

      const users = response.data || [];
      const user = users.find((u: any) => u.phone === phone);
      
      if (!user) {
        throw new NotFoundException(`User with phone number ${phone} not found`);
      }

      return user.id;
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 404) {
          throw new NotFoundException(`User with phone number ${phone} not found. Please ensure the user has registered.`);
        }
        throw new BadRequestException(`Failed to lookup user by phone: ${error.response?.data?.message || error.message}`);
      }
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(`Failed to lookup user by phone: ${error.message}`);
    }
  }

  /**
   * Assign user to business by phone number
   * Default: permissions = null (full role permissions)
   */
  async assignUserToBusinessByPhone(
    businessId: string,
    phone: string,
    role: Role,
    assignedBy: string,
    request?: Request
  ): Promise<BusinessUser> {
    // Validate phone format (10 digits)
    if (!phone || !/^\d{10}$/.test(phone)) {
      throw new BadRequestException('Invalid phone number. Must be 10 digits.');
    }

    // Get user ID by phone
    const authToken = request?.headers?.authorization?.replace('Bearer ', '') || '';
    const userId = await this.getUserIdByPhone(phone, authToken);

    // Use existing assignUserToBusiness method
    return this.assignUserToBusiness(businessId, userId, role, assignedBy, request);
  }

  /**
   * Assign user to business
   * Default: permissions = null (full role permissions)
   */
  async assignUserToBusiness(
    businessId: string,
    userId: string,
    role: Role,
    assignedBy: string,
    request?: Request
  ): Promise<BusinessUser> {
    // Verify business exists
    const business = await this.businessRepository.findById(businessId);
    if (!business) {
      throw new NotFoundException('Business not found');
    }

    // Check if assignment already exists
    const existing = await this.businessUserRepository.findByBusinessAndUser(
      businessId,
      userId
    );

    if (existing) {
      const oldRole = existing.role;
      let updated: BusinessUser;

      // Update existing assignment
      if (existing.status === 'removed') {
        // Reactivate removed user
        updated = await this.businessUserRepository.update(existing.id, {
          role,
          permissions: null, // Reset to full role permissions
          status: 'active',
          joined_at: new Date(),
          removed_at: null,
          removed_by: null,
        });
      } else {
        // Update role and reset permissions to defaults
        updated = await this.businessUserRepository.update(existing.id, {
          role,
          permissions: null, // Reset to full role permissions
        });
      }

      // Log role change if role changed
      if (oldRole !== role) {
        await this.auditService.logRoleChange(
          businessId,
          userId,
          oldRole,
          role,
          assignedBy,
          request
        );
      }

      // Log assignment
      await this.auditService.logUserAssignment(
        businessId,
        userId,
        role,
        assignedBy,
        request
      );

      return updated;
    }

    // Create new assignment with null permissions (full access)
    const businessUser = await this.businessUserRepository.create({
      business_id: businessId,
      user_id: userId,
      role,
      permissions: null, // NULL = use all role permissions (full access by default)
      status: 'active',
      invited_by: assignedBy,
      joined_at: new Date(),
    });

    // Log assignment
    await this.auditService.logUserAssignment(
      businessId,
      userId,
      role,
      assignedBy,
      request
    );

    return businessUser;
  }

  /**
   * Get all businesses for a user (owned + assigned)
   */
  async getUserBusinesses(userId: string): Promise<Array<{
    id: string;
    name: string;
    role: Role;
    isOwner: boolean;
    status: string;
  }>> {
    // Get businesses where user is owner
    const ownedBusinesses = await this.businessRepository.findByOwner(userId);
    const owned = ownedBusinesses.map(b => ({
      id: b.id,
      name: b.name,
      role: Role.OWNER,
      isOwner: true,
      status: b.status,
    }));

    // Get businesses where user is assigned
    const businessUsers = await this.businessUserRepository.findActiveByUser(userId);
    const assignedBusinessIds = businessUsers.map(bu => bu.business_id);

    const assignedBusinesses = await Promise.all(
      assignedBusinessIds.map(async (id) => {
        const business = await this.businessRepository.findById(id);
        if (!business) return null;
        const bu = businessUsers.find(b => b.business_id === id);
        return {
          id: business.id,
          name: business.name,
          role: bu!.role as Role,
          isOwner: false,
          status: business.status,
        };
      })
    );

    // Combine and deduplicate (in case user is both owner and assigned)
    const allBusinesses = [...owned, ...assignedBusinesses.filter(Boolean)];
    const uniqueMap = new Map<string, typeof owned[0]>();
    
    allBusinesses.forEach(b => {
      const existing = uniqueMap.get(b.id);
      if (!existing || b.isOwner) {
        // Prefer owner role if user is both owner and assigned
        uniqueMap.set(b.id, b);
      }
    });

    return Array.from(uniqueMap.values());
  }

  /**
   * Get user's role in a business
   */
  async getUserRoleInBusiness(
    userId: string,
    businessId: string
  ): Promise<{ role: Role; isOwner: boolean; businessUser?: BusinessUser }> {
    const business = await this.businessRepository.findById(businessId);
    if (!business) {
      throw new NotFoundException('Business not found');
    }

    const isOwner = business.owner_id === userId;
    if (isOwner) {
      return { role: Role.OWNER, isOwner: true };
    }

    const businessUser = await this.businessUserRepository.findByBusinessAndUser(
      businessId,
      userId
    );

    if (!businessUser || businessUser.status !== 'active') {
      throw new NotFoundException('User not assigned to business');
    }

    return {
      role: businessUser.role as Role,
      isOwner: false,
      businessUser,
    };
  }

  /**
   * Update user permissions
   */
  async updateUserPermissions(
    businessId: string,
    userId: string,
    permissions: Record<string, boolean> | null,
    request?: Request
  ): Promise<BusinessUser> {
    const businessUser = await this.businessUserRepository.findByBusinessAndUser(
      businessId,
      userId
    );

    if (!businessUser) {
      throw new NotFoundException('User not assigned to business');
    }

    const oldPermissions = businessUser.permissions;
    const performedBy = (request as any)?.user?.id || 'system';

    // Update permissions
    // null or {} = use all role permissions
    // { "permission": false } = deny specific permission
    const updated = await this.businessUserRepository.update(businessUser.id, {
      permissions: permissions || null,
    });

    // Log permission change
    await this.auditService.logPermissionChange(
      businessId,
      userId,
      oldPermissions,
      permissions,
      performedBy,
      request
    );

    return updated;
  }

  /**
   * Reset user permissions to role defaults (full access)
   */
  async resetToRoleDefaults(
    businessId: string,
    userId: string,
    request?: Request
  ): Promise<BusinessUser> {
    const businessUser = await this.businessUserRepository.findByBusinessAndUser(
      businessId,
      userId
    );

    if (!businessUser) {
      throw new NotFoundException('User not assigned to business');
    }

    const oldPermissions = businessUser.permissions;
    const performedBy = (request as any)?.user?.id || 'system';

    // Set permissions to null = use all role permissions
    const updated = await this.businessUserRepository.update(businessUser.id, {
      permissions: null,
    });

    // Log permission reset
    await this.auditService.logPermissionChange(
      businessId,
      userId,
      oldPermissions,
      null,
      performedBy,
      request
    );

    return updated;
  }

  /**
   * Remove user from business (soft delete)
   */
  async removeUserFromBusiness(
    businessId: string,
    userId: string,
    removedBy: string,
    request?: Request
  ): Promise<void> {
    const business = await this.businessRepository.findById(businessId);
    if (!business) {
      throw new NotFoundException('Business not found');
    }

    // Don't allow removing owner
    if (business.owner_id === userId) {
      throw new BadRequestException('Cannot remove business owner');
    }

    const businessUser = await this.businessUserRepository.findByBusinessAndUser(
      businessId,
      userId
    );

    if (!businessUser) {
      throw new NotFoundException('User not assigned to business');
    }

    await this.businessUserRepository.update(businessUser.id, {
      status: 'removed',
      removed_at: new Date(),
      removed_by: removedBy,
    });

    // Log removal
    await this.auditService.logUserRemoval(
      businessId,
      userId,
      removedBy,
      request
    );
  }

  /**
   * Get all users in a business
   */
  async getBusinessUsers(businessId: string): Promise<BusinessUser[]> {
    const business = await this.businessRepository.findById(businessId);
    if (!business) {
      throw new NotFoundException('Business not found');
    }

    return this.businessUserRepository.findActiveByBusiness(businessId);
  }

  /**
   * Calculate effective permissions for a user in a business
   */
  calculateEffectivePermissions(
    role: Role,
    customPermissions?: Record<string, boolean> | null
  ): string[] {
    return calculateEffectivePermissions(role, customPermissions);
  }

  /**
   * Check if user has access to business
   */
  async checkBusinessAccess(
    userId: string,
    businessId: string
  ): Promise<boolean> {
    // Check if owner
    const business = await this.businessRepository.findById(businessId);
    if (business?.owner_id === userId) {
      return true;
    }

    // Check if assigned
    return this.businessUserRepository.isUserAssigned(businessId, userId);
  }
}

