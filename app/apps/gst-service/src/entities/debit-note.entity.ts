import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '@business-app/shared/dal';

/**
 * Debit Note Entity
 * 
 * Tracks debit notes issued against invoices.
 */
@Entity('debit_notes')
@Index(['business_id'])
@Index(['invoice_id'])
@Index(['debit_note_id'])
export class DebitNote extends BaseEntity {
  @Column({ type: 'uuid', name: 'business_id' })
  business_id: string;

  @Column({ type: 'uuid', name: 'invoice_id' })
  invoice_id: string; // Original invoice ID

  @Column({ type: 'uuid', name: 'debit_note_id' })
  debit_note_id: string; // Debit note invoice ID

  @Column({ type: 'varchar', length: 50, name: 'original_invoice_number' })
  original_invoice_number: string;

  @Column({ type: 'date', name: 'original_invoice_date' })
  original_invoice_date: Date;

  @Column({ type: 'varchar', length: 50, name: 'debit_note_number' })
  debit_note_number: string;

  @Column({ type: 'date', name: 'debit_note_date' })
  debit_note_date: Date;

  @Column({ type: 'varchar', length: 20, name: 'reason_code' })
  reason_code: string; // 01-09 as per GST rules

  @Column({ type: 'text', nullable: true, name: 'reason_description' })
  reason_description?: string;

  @Column({ type: 'decimal', precision: 15, scale: 2, name: 'debit_amount' })
  debit_amount: number;

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

