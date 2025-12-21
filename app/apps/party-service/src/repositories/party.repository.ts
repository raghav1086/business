import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseRepository } from '@business-app/shared/dal';
import { Party } from '../entities/party.entity';

/**
 * Party Repository
 * 
 * Data Access Layer for Party entity.
 */
@Injectable()
export class PartyRepository extends BaseRepository<Party> {
  constructor(
    @InjectRepository(Party)
    repository: Repository<Party>
  ) {
    super(repository);
  }

  /**
   * Find all parties for a business
   */
  async findByBusinessId(businessId: string): Promise<Party[]> {
    return this.repository.find({
      where: { business_id: businessId, status: 'active' },
      order: { name: 'ASC' },
    });
  }

  /**
   * Find parties by type (customer/supplier)
   */
  async findByBusinessIdAndType(
    businessId: string,
    type: string
  ): Promise<Party[]> {
    return this.repository.find({
      where: { business_id: businessId, type, status: 'active' },
      order: { name: 'ASC' },
    });
  }

  /**
   * Search parties by name
   */
  async searchByName(
    businessId: string,
    searchTerm: string
  ): Promise<Party[]> {
    return this.repository
      .createQueryBuilder('party')
      .where('party.business_id = :businessId', { businessId })
      .andWhere('party.status = :status', { status: 'active' })
      .andWhere(
        '(party.name ILIKE :searchTerm OR party.phone ILIKE :searchTerm OR party.email ILIKE :searchTerm)',
        { searchTerm: `%${searchTerm}%` }
      )
      .orderBy('party.name', 'ASC')
      .getMany();
  }

  /**
   * Find party by business ID and party ID
   */
  async findByBusinessIdAndId(
    businessId: string,
    id: string
  ): Promise<Party | null> {
    return this.repository.findOne({
      where: { business_id: businessId, id, status: 'active' },
    });
  }
}

