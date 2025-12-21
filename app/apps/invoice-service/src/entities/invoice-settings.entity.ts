import {
  Entity,
  Column,
  Index,
} from 'typeorm';
import { BaseEntity } from '@business-app/shared/dal';

/**
 * Invoice Settings Entity
 * 
 * Stores invoice numbering and default settings per business.
 * Matches DATABASE_SCHEMA.md invoice_settings table.
 */
@Entity('invoice_settings')
@Index(['business_id'], { unique: true })
export class InvoiceSettings extends BaseEntity {
  @Column({ type: 'uuid', name: 'business_id', unique: true })
  business_id: string;

  // Invoice Number Format
  @Column({ type: 'varchar', length: 10, default: 'INV', name: 'invoice_prefix' })
  invoice_prefix: string;

  @Column({ type: 'int', default: 1, name: 'invoice_next_number' })
  invoice_next_number: number;

  // Defaults
  @Column({ type: 'text', nullable: true, name: 'default_terms' })
  default_terms?: string;

  @Column({ type: 'text', nullable: true, name: 'default_notes' })
  default_notes?: string;

  @Column({ type: 'int', default: 30, name: 'default_due_days' })
  default_due_days: number;

  @Column({ type: 'boolean', default: false, name: 'tax_inclusive_default' })
  tax_inclusive_default: boolean;
}

