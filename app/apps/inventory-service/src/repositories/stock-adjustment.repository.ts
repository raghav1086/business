import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseRepository } from '@business-app/shared/dal';
import { StockAdjustment } from '../entities/stock-adjustment.entity';

/**
 * Stock Adjustment Repository
 */
@Injectable()
export class StockAdjustmentRepository extends BaseRepository<StockAdjustment> {
  constructor(
    @InjectRepository(StockAdjustment)
    repository: Repository<StockAdjustment>
  ) {
    super(repository);
  }

  /**
   * Find adjustments for item
   */
  async findByItemId(itemId: string): Promise<StockAdjustment[]> {
    return this.repository.find({
      where: { item_id: itemId },
      order: { adjustment_date: 'DESC', created_at: 'DESC' },
    });
  }

  /**
   * Find adjustments for business
   */
  async findByBusinessId(businessId: string): Promise<StockAdjustment[]> {
    return this.repository.find({
      where: { business_id: businessId },
      order: { adjustment_date: 'DESC', created_at: 'DESC' },
    });
  }
}

