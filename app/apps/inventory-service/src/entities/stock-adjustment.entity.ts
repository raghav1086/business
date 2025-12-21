import {
  Entity,
  Column,
  Index,
} from 'typeorm';
import { BaseEntity } from '@business-app/shared/dal';

/**
 * Stock Adjustment Entity
 * 
 * Represents a stock adjustment transaction.
 * Matches DATABASE_SCHEMA.md stock_adjustments table.
 */
@Entity('stock_adjustments')
@Index(['business_id'])
@Index(['item_id'])
@Index(['adjustment_date'])
export class StockAdjustment extends BaseEntity {
  @Column({ type: 'uuid', name: 'business_id' })
  business_id: string;

  @Column({ type: 'uuid', name: 'item_id' })
  item_id: string;

  @Column({ type: 'date', name: 'adjustment_date' })
  adjustment_date: Date;

  @Column({ type: 'varchar', length: 20 })
  adjustment_type: string; // increase, decrease, set

  @Column({ type: 'decimal', precision: 15, scale: 3 })
  quantity: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  rate?: number;

  @Column({ type: 'text', nullable: true })
  reason?: string;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Column({ type: 'uuid', nullable: true, name: 'created_by' })
  created_by?: string;
}

