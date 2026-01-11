import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PartyRepository } from '../repositories/party.repository';
import { CreatePartyDto, UpdatePartyDto } from '@business-app/shared/dto';
import { validateGSTIN, formatGSTIN } from '@business-app/shared/utils';
import { Party } from '../entities/party.entity';

/**
 * Party Service
 * 
 * Business logic layer for Party management.
 */
@Injectable()
export class PartyService {
  constructor(private readonly partyRepository: PartyRepository) {}

  /**
   * Create a new party
   */
  async create(
    businessId: string,
    createDto: CreatePartyDto
  ): Promise<Party> {
    // Validate GSTIN if provided
    if (createDto.gstin) {
      const formattedGstin = formatGSTIN(createDto.gstin);
      if (!validateGSTIN(formattedGstin)) {
        throw new ConflictException('Invalid GSTIN format');
      }
      createDto.gstin = formattedGstin;
    }

    // Set default values
    const partyData = {
      ...createDto,
      business_id: businessId,
      status: 'active',
      opening_balance: createDto.opening_balance || 0,
      opening_balance_type: createDto.opening_balance_type || 'credit',
      shipping_same_as_billing:
        createDto.shipping_same_as_billing !== undefined
          ? createDto.shipping_same_as_billing
          : true,
    };

    return this.partyRepository.create(partyData);
  }

  /**
   * Get party by ID
   */
  async findById(businessId: string, id: string): Promise<Party> {
    const party = await this.partyRepository.findByBusinessIdAndId(
      businessId,
      id
    );

    if (!party) {
      throw new NotFoundException(`Party with ID ${id} not found`);
    }

    return party;
  }

  /**
   * Get all parties for business
   */
  async findByBusinessId(
    businessId: string,
    type?: string
  ): Promise<Party[]> {
    if (type) {
      return this.partyRepository.findByBusinessIdAndType(businessId, type);
    }
    return this.partyRepository.findByBusinessId(businessId);
  }

  /**
   * Search parties
   */
  async search(businessId: string, searchTerm: string): Promise<Party[]> {
    return this.partyRepository.searchByName(businessId, searchTerm);
  }

  /**
   * Update party
   */
  async update(
    businessId: string,
    id: string,
    updateDto: UpdatePartyDto
  ): Promise<Party> {
    // Verify party exists
    await this.findById(businessId, id);

    // Validate GSTIN if provided
    if (updateDto.gstin) {
      const formattedGstin = formatGSTIN(updateDto.gstin);
      if (!validateGSTIN(formattedGstin)) {
        throw new ConflictException('Invalid GSTIN format');
      }
      updateDto.gstin = formattedGstin;
    }

    return this.partyRepository.update(id, updateDto);
  }

  /**
   * Delete party (soft delete)
   */
  async delete(businessId: string, id: string): Promise<void> {
    // Verify party exists
    await this.findById(businessId, id);

    // Soft delete
    await this.partyRepository.delete(id);
  }

  /**
   * Get all parties across all businesses (for superadmin)
   */
  async findAllForSuperadmin(type?: string): Promise<Party[]> {
    return this.partyRepository.findAllForSuperadmin(type);
  }

  /**
   * Search all parties across all businesses (for superadmin)
   */
  async searchAllForSuperadmin(searchTerm: string): Promise<Party[]> {
    return this.partyRepository.searchAllForSuperadmin(searchTerm);
  }
}

