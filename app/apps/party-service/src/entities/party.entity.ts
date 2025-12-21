import {
  Entity,
  Column,
  OneToMany,
  Index,
} from 'typeorm';
import { BaseEntity } from '@business-app/shared/dal';

/**
 * Party Entity
 * 
 * Represents a customer or supplier.
 * Matches DATABASE_SCHEMA.md parties table.
 */
@Entity('parties')
@Index(['business_id'])
@Index(['business_id', 'name'])
@Index(['phone'])
@Index(['gstin'])
@Index(['business_id', 'type'])
export class Party extends BaseEntity {
  @Column({ type: 'uuid', name: 'business_id' })
  business_id: string;

  @Column({ type: 'varchar', length: 200 })
  name: string;

  @Column({ type: 'varchar', length: 20 })
  type: string; // customer, supplier, both

  @Column({ type: 'varchar', length: 15, nullable: true })
  phone?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  email?: string;

  @Column({ type: 'varchar', length: 15, nullable: true })
  gstin?: string;

  @Column({ type: 'varchar', length: 10, nullable: true })
  pan?: string;

  // Billing Address
  @Column({ type: 'varchar', length: 255, nullable: true, name: 'billing_address_line1' })
  billing_address_line1?: string;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'billing_address_line2' })
  billing_address_line2?: string;

  @Column({ type: 'varchar', length: 100, nullable: true, name: 'billing_city' })
  billing_city?: string;

  @Column({ type: 'varchar', length: 100, nullable: true, name: 'billing_state' })
  billing_state?: string;

  @Column({ type: 'varchar', length: 10, nullable: true, name: 'billing_pincode' })
  billing_pincode?: string;

  // Shipping Address
  @Column({ type: 'boolean', default: true, name: 'shipping_same_as_billing' })
  shipping_same_as_billing: boolean;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'shipping_address_line1' })
  shipping_address_line1?: string;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'shipping_address_line2' })
  shipping_address_line2?: string;

  @Column({ type: 'varchar', length: 100, nullable: true, name: 'shipping_city' })
  shipping_city?: string;

  @Column({ type: 'varchar', length: 100, nullable: true, name: 'shipping_state' })
  shipping_state?: string;

  @Column({ type: 'varchar', length: 10, nullable: true, name: 'shipping_pincode' })
  shipping_pincode?: string;

  // Financial
  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0, name: 'opening_balance' })
  opening_balance: number;

  @Column({ type: 'varchar', length: 10, default: 'credit', name: 'opening_balance_type' })
  opening_balance_type: string; // credit, debit

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true, name: 'credit_limit' })
  credit_limit?: number;

  @Column({ type: 'int', nullable: true, name: 'credit_period_days' })
  credit_period_days?: number;

  // Metadata
  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Column({ type: 'varchar', array: true, nullable: true })
  tags?: string[];
}

