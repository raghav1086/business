import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '@business-app/shared/dal';

/**
 * GSTR-2A Reconciliation Entity
 * 
 * Stores reconciliation results for purchase invoices.
 */
@Entity('gstr2a_reconciliations')
@Index(['business_id'])
@Index(['invoice_id'])
@Index(['gstr2a_import_id'])
@Index(['business_id', 'period'])
export class Gstr2aReconciliation extends BaseEntity {
  @Column({ type: 'uuid', name: 'business_id' })
  business_id: string;

  @Column({ type: 'uuid', name: 'gstr2a_import_id' })
  gstr2a_import_id: string;

  @Column({ type: 'uuid', nullable: true, name: 'invoice_id' })
  invoice_id?: string; // Our purchase invoice ID

  @Column({ type: 'varchar', length: 7, name: 'period' })
  period: string;

  @Column({ type: 'varchar', length: 50, name: 'supplier_invoice_number' })
  supplier_invoice_number: string;

  @Column({ type: 'date', name: 'supplier_invoice_date' })
  supplier_invoice_date: Date;

  @Column({ type: 'varchar', length: 15, name: 'supplier_gstin' })
  supplier_gstin: string;

  @Column({ type: 'varchar', length: 200, nullable: true, name: 'supplier_name' })
  supplier_name?: string;

  @Column({ type: 'decimal', precision: 15, scale: 2, name: 'supplier_taxable_value' })
  supplier_taxable_value: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0, name: 'supplier_igst' })
  supplier_igst: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0, name: 'supplier_cgst' })
  supplier_cgst: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0, name: 'supplier_sgst' })
  supplier_sgst: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0, name: 'supplier_cess' })
  supplier_cess: number;

  @Column({ type: 'varchar', length: 20, name: 'match_status' })
  match_status: string; // 'matched', 'missing', 'extra', 'mismatched'

  @Column({ type: 'jsonb', nullable: true, name: 'match_details' })
  match_details?: any; // Details about the match/mismatch

  @Column({ type: 'boolean', default: false, name: 'is_manual_match' })
  is_manual_match: boolean; // If manually matched by user
}

