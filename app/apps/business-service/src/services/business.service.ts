import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { BusinessRepository } from '../repositories/business.repository';
import { CreateBusinessDto, UpdateBusinessDto } from '@business-app/shared/dto';
import { validateGSTIN, formatGSTIN } from '@business-app/shared/utils';
import { Business } from '../entities/business.entity';

/**
 * Business Service
 * 
 * Business logic layer for Business management.
 * Implements business rules and validation.
 */
@Injectable()
export class BusinessService {
  constructor(private readonly businessRepository: BusinessRepository) {}

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

