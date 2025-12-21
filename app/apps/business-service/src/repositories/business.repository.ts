import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseRepository } from '@business-app/shared/dal';
import { Business } from '../entities/business.entity';

/**
 * Business Repository
 * 
 * Data Access Layer for Business entity.
 * Extends BaseRepository for common CRUD operations.
 */
@Injectable()
export class BusinessRepository extends BaseRepository<Business> {
  constructor(
    @InjectRepository(Business)
    repository: Repository<Business>
  ) {
    super(repository);
  }

  /**
   * Find business by owner ID
   */
  async findByOwner(ownerId: string): Promise<Business[]> {
    return this.repository.find({
      where: { owner_id: ownerId, status: 'active' },
      order: { created_at: 'DESC' },
    });
  }

  /**
   * Find business by GSTIN
   */
  async findByGSTIN(gstin: string): Promise<Business | null> {
    return this.repository.findOne({
      where: { gstin, status: 'active' },
    });
  }

  /**
   * Search businesses by name
   */
  async searchByName(ownerId: string, searchTerm: string): Promise<Business[]> {
    return this.repository
      .createQueryBuilder('business')
      .where('business.owner_id = :ownerId', { ownerId })
      .andWhere('business.status = :status', { status: 'active' })
      .andWhere('business.name ILIKE :searchTerm', {
        searchTerm: `%${searchTerm}%`,
      })
      .orderBy('business.created_at', 'DESC')
      .getMany();
  }

  /**
   * Check if GSTIN already exists
   */
  async gstinExists(gstin: string, excludeId?: string): Promise<boolean> {
    const query = this.repository
      .createQueryBuilder('business')
      .where('business.gstin = :gstin', { gstin })
      .andWhere('business.status = :status', { status: 'active' });

    if (excludeId) {
      query.andWhere('business.id != :excludeId', { excludeId });
    }

    const count = await query.getCount();
    return count > 0;
  }
}

