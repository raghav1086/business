import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { BaseEntity } from '@business-app/shared/dal';
import { Category } from './category.entity';
import { Unit } from './unit.entity';

/**
 * Item Entity
 * 
 * Represents an inventory item/product.
 * Matches DATABASE_SCHEMA.md items table.
 */
@Entity('items')
@Index(['business_id'])
@Index(['category_id'])
@Index(['business_id', 'sku'])
@Index(['barcode'])
@Index(['hsn_code'])
@Index(['business_id', 'name'])
@Index(['business_id', 'inventory_type'])
export class Item extends BaseEntity {
  @Column({ type: 'uuid', name: 'business_id' })
  business_id: string;

  @Column({ type: 'uuid', nullable: true, name: 'category_id' })
  category_id?: string;

  @ManyToOne(() => Category)
  @JoinColumn({ name: 'category_id' })
  category?: Category;

  @Column({ type: 'uuid', nullable: true, name: 'unit_id' })
  unit_id?: string;

  @ManyToOne(() => Unit)
  @JoinColumn({ name: 'unit_id' })
  unit?: Unit;

  @Column({ type: 'varchar', length: 200 })
  name: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  sku?: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  barcode?: string;

  @Column({ type: 'varchar', length: 8, nullable: true, name: 'hsn_code' })
  hsn_code?: string;

  @Column({ type: 'varchar', length: 6, nullable: true, name: 'sac_code' })
  sac_code?: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'varchar', length: 500, nullable: true, name: 'image_url' })
  image_url?: string;

  // Item Type
  @Column({
    type: 'varchar',
    length: 30,
    default: 'trading_goods',
    name: 'inventory_type',
  })
  inventory_type: string; // raw_material, wip, finished_goods, trading_goods, consumables, services

  // Pricing
  @Column({
    type: 'decimal',
    precision: 15,
    scale: 2,
    default: 0,
    name: 'selling_price',
  })
  selling_price: number;

  @Column({
    type: 'decimal',
    precision: 15,
    scale: 2,
    default: 0,
    name: 'purchase_price',
  })
  purchase_price: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  mrp?: number;

  @Column({
    type: 'decimal',
    precision: 5,
    scale: 2,
    default: 0,
    name: 'discount_percent',
  })
  discount_percent: number;

  // Tax
  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0, name: 'tax_rate' })
  tax_rate: number; // GST rate

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0, name: 'cess_rate' })
  cess_rate: number;

  @Column({ type: 'boolean', default: false, name: 'tax_inclusive' })
  tax_inclusive: boolean;

  // Stock
  @Column({
    type: 'decimal',
    precision: 15,
    scale: 3,
    default: 0,
    name: 'current_stock',
  })
  current_stock: number;

  @Column({
    type: 'decimal',
    precision: 15,
    scale: 3,
    nullable: true,
    name: 'low_stock_threshold',
  })
  low_stock_threshold?: number;

  @Column({ type: 'boolean', default: true, name: 'track_stock' })
  track_stock: boolean;

  // Tracking Options
  @Column({ type: 'boolean', default: false, name: 'track_serial' })
  track_serial: boolean;

  @Column({ type: 'boolean', default: false, name: 'track_batch' })
  track_batch: boolean;

  // Valuation
  @Column({
    type: 'varchar',
    length: 20,
    default: 'weighted_average',
    name: 'valuation_method',
  })
  valuation_method: string; // weighted_average, fifo, lifo, standard_cost

  @Column({
    type: 'decimal',
    precision: 15,
    scale: 2,
    nullable: true,
    name: 'standard_cost',
  })
  standard_cost?: number;

  @Column({
    type: 'decimal',
    precision: 15,
    scale: 2,
    default: 0,
    name: 'weighted_avg_cost',
  })
  weighted_avg_cost: number;
}

