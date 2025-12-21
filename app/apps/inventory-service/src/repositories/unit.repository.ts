import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseRepository } from '@business-app/shared/dal';
import { Unit } from '../entities/unit.entity';

/**
 * Unit Repository
 */
@Injectable()
export class UnitRepository extends BaseRepository<Unit> {
  constructor(
    @InjectRepository(Unit)
    repository: Repository<Unit>
  ) {
    super(repository);
  }

  /**
   * Find all units for business
   */
  async findByBusinessId(businessId: string): Promise<Unit[]> {
    return this.repository.find({
      where: { business_id: businessId },
      order: { is_default: 'DESC', name: 'ASC' },
    });
  }

  /**
   * Find default unit for business
   */
  async findDefaultUnit(businessId: string): Promise<Unit | null> {
    return this.repository.findOne({
      where: { business_id: businessId, is_default: true },
    });
  }
}

