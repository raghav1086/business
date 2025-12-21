import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { BaseEntity } from '@business-app/shared/dal';
import { Invoice } from './invoice.entity';

/**
 * Invoice Item Entity
 * 
 * Represents an item in an invoice.
 * Matches DATABASE_SCHEMA.md invoice_items table.
 */
@Entity('invoice_items')
@Index(['invoice_id'])
@Index(['item_id'])
export class InvoiceItem extends BaseEntity {
  @Column({ type: 'uuid', name: 'invoice_id' })
  invoice_id: string;

  @ManyToOne(() => Invoice, (invoice) => invoice.items)
  @JoinColumn({ name: 'invoice_id' })
  invoice: Invoice;

  @Column({ type: 'uuid', nullable: true, name: 'item_id' })
  item_id?: string;

  // Item Details (snapshot)
  @Column({ type: 'varchar', length: 200, name: 'item_name' })
  item_name: string;

  @Column({ type: 'text', nullable: true, name: 'item_description' })
  item_description?: string;

  @Column({ type: 'varchar', length: 8, nullable: true, name: 'hsn_code' })
  hsn_code?: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  unit?: string;

  // Quantity & Pricing
  @Column({ type: 'decimal', precision: 15, scale: 3 })
  quantity: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, name: 'unit_price' })
  unit_price: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0, name: 'discount_percent' })
  discount_percent: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0, name: 'discount_amount' })
  discount_amount: number;

  // Tax
  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0, name: 'tax_rate' })
  tax_rate: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0, name: 'cgst_rate' })
  cgst_rate: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0, name: 'sgst_rate' })
  sgst_rate: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0, name: 'igst_rate' })
  igst_rate: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0, name: 'cess_rate' })
  cess_rate: number;

  // Calculated
  @Column({ type: 'decimal', precision: 15, scale: 2, name: 'taxable_amount' })
  taxable_amount: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0, name: 'cgst_amount' })
  cgst_amount: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0, name: 'sgst_amount' })
  sgst_amount: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0, name: 'igst_amount' })
  igst_amount: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0, name: 'cess_amount' })
  cess_amount: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, name: 'total_amount' })
  total_amount: number;

  @Column({ type: 'int', default: 0, name: 'sort_order' })
  sort_order: number;
}

