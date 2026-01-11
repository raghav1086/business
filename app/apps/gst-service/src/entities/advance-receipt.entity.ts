import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '@business-app/shared/dal';

/**
 * Advance Receipt Entity
 * 
 * Tracks advance receipts and tax paid on advance.
 */
@Entity('advance_receipts')
@Index(['business_id'])
@Index(['invoice_id'])
@Index(['receipt_date'])
export class AdvanceReceipt extends BaseEntity {
  @Column({ type: 'uuid', name: 'business_id' })
  business_id: string;

  @Column({ type: 'uuid', nullable: true, name: 'invoice_id' })
  invoice_id?: string; // Final invoice ID (if linked)

  @Column({ type: 'uuid', nullable: true, name: 'party_id' })
  party_id?: string;

  @Column({ type: 'varchar', length: 50, name: 'receipt_number' })
  receipt_number: string;

  @Column({ type: 'date', name: 'receipt_date' })
  receipt_date: Date;

  @Column({ type: 'decimal', precision: 15, scale: 2, name: 'advance_amount' })
  advance_amount: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, name: 'taxable_value' })
  taxable_value: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  igst: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  cgst: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  sgst: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  cess: number;

  @Column({ type: 'boolean', default: false, name: 'is_adjusted' })
  is_adjusted: boolean; // Whether advance is adjusted against final invoice
}

