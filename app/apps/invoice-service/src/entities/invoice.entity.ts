import {
  Entity,
  Column,
  OneToMany,
  Index,
} from 'typeorm';
import { BaseEntity } from '@business-app/shared/dal';
import { InvoiceItem } from './invoice-item.entity';

/**
 * Invoice Entity
 * 
 * Represents a sales/purchase invoice.
 * Matches DATABASE_SCHEMA.md invoices table.
 */
@Entity('invoices')
@Index(['business_id', 'invoice_number', 'invoice_type'], { unique: true })
@Index(['business_id'])
@Index(['party_id'])
@Index(['invoice_date'])
@Index(['business_id', 'payment_status'])
@Index(['business_id', 'invoice_type'])
export class Invoice extends BaseEntity {
  @Column({ type: 'uuid', name: 'business_id' })
  business_id: string;

  @Column({ type: 'uuid', name: 'party_id' })
  party_id: string;

  // Invoice Details
  @Column({ type: 'varchar', length: 50, name: 'invoice_number' })
  invoice_number: string;

  @Column({ type: 'varchar', length: 30, name: 'invoice_type' })
  invoice_type: string; // sale, purchase, quotation, proforma, etc.

  @Column({ type: 'date', name: 'invoice_date' })
  invoice_date: Date;

  @Column({ type: 'date', nullable: true, name: 'due_date' })
  due_date?: Date;

  // Place of Supply (for GST)
  @Column({ type: 'varchar', length: 100, nullable: true, name: 'place_of_supply' })
  place_of_supply?: string;

  @Column({ type: 'boolean', default: false, name: 'is_interstate' })
  is_interstate: boolean;

  @Column({ type: 'boolean', default: false, name: 'is_export' })
  is_export: boolean;

  // Reverse Charge
  @Column({ type: 'boolean', default: false, name: 'is_rcm' })
  is_rcm: boolean;

  // Amounts
  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  subtotal: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0, name: 'discount_amount' })
  discount_amount: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0, name: 'taxable_amount' })
  taxable_amount: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0, name: 'cgst_amount' })
  cgst_amount: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0, name: 'sgst_amount' })
  sgst_amount: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0, name: 'igst_amount' })
  igst_amount: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0, name: 'cess_amount' })
  cess_amount: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0, name: 'round_off' })
  round_off: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0, name: 'total_amount' })
  total_amount: number;

  // Payment
  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0, name: 'paid_amount' })
  paid_amount: number;

  @Column({ type: 'varchar', length: 20, default: 'unpaid', name: 'payment_status' })
  payment_status: string; // unpaid, partial, paid

  // E-Invoice
  @Column({ type: 'varchar', length: 64, nullable: true })
  irn?: string;

  @Column({ type: 'timestamptz', nullable: true, name: 'irn_date' })
  irn_date?: Date;

  // Metadata
  @Column({ type: 'text', nullable: true })
  terms?: string;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Column({ type: 'uuid', name: 'created_by' })
  created_by: string;

  // Relations
  @OneToMany(() => InvoiceItem, (item) => item.invoice, { cascade: true })
  items: InvoiceItem[];
}

