import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '@business-app/shared/dal';

/**
 * Credit Note Entity
 * 
 * Tracks credit notes issued against invoices.
 */
@Entity('credit_notes')
@Index(['business_id'])
@Index(['invoice_id'])
@Index(['credit_note_id'])
export class CreditNote extends BaseEntity {
  @Column({ type: 'uuid', name: 'business_id' })
  business_id: string;

  @Column({ type: 'uuid', name: 'invoice_id' })
  invoice_id: string; // Original invoice ID

  @Column({ type: 'uuid', name: 'credit_note_id' })
  credit_note_id: string; // Credit note invoice ID

  @Column({ type: 'varchar', length: 50, name: 'original_invoice_number' })
  original_invoice_number: string;

  @Column({ type: 'date', name: 'original_invoice_date' })
  original_invoice_date: Date;

  @Column({ type: 'varchar', length: 50, name: 'credit_note_number' })
  credit_note_number: string;

  @Column({ type: 'date', name: 'credit_note_date' })
  credit_note_date: Date;

  @Column({ type: 'varchar', length: 20, name: 'reason_code' })
  reason_code: string; // 01-09 as per GST rules

  @Column({ type: 'text', nullable: true, name: 'reason_description' })
  reason_description?: string;

  @Column({ type: 'decimal', precision: 15, scale: 2, name: 'credit_amount' })
  credit_amount: number;

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
}

