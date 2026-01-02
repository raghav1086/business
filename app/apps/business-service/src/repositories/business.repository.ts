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

  /**
   * Find all businesses (for superadmin)
   */
  async findAll(): Promise<Business[]> {
    return this.repository.find({
      order: { created_at: 'DESC' },
    });
  }

  /**
   * Count all businesses
   */
  async countAll(): Promise<number> {
    return this.repository.count();
  }

  /**
   * Count businesses by status
   */
  async countByStatus(status: string): Promise<number> {
    return this.repository.count({ where: { status } });
  }

  /**
   * Count businesses created in date range
   */
  async countByDateRange(startDate: Date, endDate: Date): Promise<number> {
    return this.repository
      .createQueryBuilder('business')
      .where('business.created_at >= :startDate', { startDate })
      .andWhere('business.created_at <= :endDate', { endDate })
      .getCount();
  }

  /**
   * Get businesses grouped by month (for growth chart)
   */
  async getMonthlyCounts(months: number = 6): Promise<Array<{ month: string; count: number }>> {
    const results = await this.repository
      .createQueryBuilder('business')
      .select("TO_CHAR(business.created_at, 'YYYY-MM')", 'month')
      .addSelect('COUNT(*)', 'count')
      .where('business.created_at >= :startDate', {
        startDate: new Date(Date.now() - months * 30 * 24 * 60 * 60 * 1000),
      })
      .groupBy("TO_CHAR(business.created_at, 'YYYY-MM')")
      .orderBy('month', 'ASC')
      .getRawMany();

    return results.map((r) => ({
      month: r.month,
      count: parseInt(r.count, 10),
    }));
  }

  /**
   * Get businesses by type distribution
   */
  async getByTypeDistribution(): Promise<Array<{ type: string; count: number }>> {
    const results = await this.repository
      .createQueryBuilder('business')
      .select('business.type', 'type')
      .addSelect('COUNT(*)', 'count')
      .groupBy('business.type')
      .getRawMany();

    return results.map((r) => ({
      type: r.type || 'unknown',
      count: parseInt(r.count, 10),
    }));
  }
}

