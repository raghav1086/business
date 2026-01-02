import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { BusinessRepository } from '../repositories/business.repository';
import { BusinessUserRepository } from '../repositories/business-user.repository';
import { CreateBusinessDto, UpdateBusinessDto } from '@business-app/shared/dto';
import { validateGSTIN, formatGSTIN } from '@business-app/shared/utils';
import { Business } from '../entities/business.entity';
import { Role } from '@business-app/shared/constants';

/**
 * Business Service
 * 
 * Business logic layer for Business management.
 * Implements business rules and validation.
 */
@Injectable()
export class BusinessService {
  constructor(
    private readonly businessRepository: BusinessRepository,
    private readonly businessUserRepository: BusinessUserRepository
  ) {}

  /**
   * Create a new business
   */
  async create(ownerId: string, createDto: CreateBusinessDto): Promise<Business> {
    // Validate GSTIN if provided
    if (createDto.gstin) {
      const formattedGstin = formatGSTIN(createDto.gstin);
      if (!validateGSTIN(formattedGstin)) {
        throw new ConflictException('Invalid GSTIN format');
      }

      // Check if GSTIN already exists
      const gstinExists = await this.businessRepository.gstinExists(formattedGstin);
      if (gstinExists) {
        throw new ConflictException('GSTIN already exists');
      }

      createDto.gstin = formattedGstin;
    }

    // Create business
    const business = await this.businessRepository.create({
      ...createDto,
      owner_id: ownerId,
      status: 'active',
    });

    // Automatically create business_user record for owner with full permissions
    // permissions = null means use all role permissions (full access by default)
    await this.businessUserRepository.create({
      business_id: business.id,
      user_id: ownerId,
      role: Role.OWNER,
      permissions: null, // NULL = use all role permissions (full access)
      status: 'active',
      joined_at: new Date(),
    });

    return business;
  }

  /**
   * Get business by ID
   */
  async findById(id: string, ownerId: string): Promise<Business> {
    const business = await this.businessRepository.findById(id);
    
    if (!business) {
      throw new NotFoundException(`Business with ID ${id} not found`);
    }

    // Verify ownership
    if (business.owner_id !== ownerId) {
      throw new NotFoundException(`Business with ID ${id} not found`);
    }

    return business;
  }

  /**
   * Get all businesses for owner
   */
  async findByOwner(ownerId: string): Promise<Business[]> {
    return this.businessRepository.findByOwner(ownerId);
  }

  /**
   * Get all businesses (superadmin only)
   */
  async findAll(): Promise<Business[]> {
    return this.businessRepository.findAll();
  }

  /**
   * Get system statistics (superadmin only)
   */
  async getSystemStats(): Promise<{
    totalBusinesses: number;
    activeBusinesses: number;
    inactiveBusinesses: number;
    totalUsers: number; // This would need to come from auth-service
  }> {
    const totalBusinesses = await this.businessRepository.countAll();
    const activeBusinesses = await this.businessRepository.countByStatus('active');
    const inactiveBusinesses = await this.businessRepository.countByStatus('inactive');
    
    return {
      totalBusinesses,
      activeBusinesses,
      inactiveBusinesses,
      totalUsers: 0, // TODO: Get from auth-service
    };
  }

  /**
   * Update business
   */
  async update(
    id: string,
    ownerId: string,
    updateDto: UpdateBusinessDto
  ): Promise<Business> {
    // Verify business exists and ownership
    await this.findById(id, ownerId);

    // Validate GSTIN if provided
    if (updateDto.gstin) {
      const formattedGstin = formatGSTIN(updateDto.gstin);
      if (!validateGSTIN(formattedGstin)) {
        throw new ConflictException('Invalid GSTIN format');
      }

      // Check if GSTIN already exists (excluding current business)
      const gstinExists = await this.businessRepository.gstinExists(formattedGstin, id);
      if (gstinExists) {
        throw new ConflictException('GSTIN already exists');
      }

      updateDto.gstin = formattedGstin;
    }

    // Update business
    return this.businessRepository.update(id, updateDto);
  }

  /**
   * Delete business (soft delete)
   */
  async delete(id: string, ownerId: string): Promise<void> {
    // Verify business exists and ownership
    await this.findById(id, ownerId);

    // Soft delete
    await this.businessRepository.delete(id);
  }

  /**
   * Search businesses by name
   */
  async search(ownerId: string, searchTerm: string): Promise<Business[]> {
    return this.businessRepository.searchByName(ownerId, searchTerm);
  }
}

