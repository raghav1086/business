import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '@business-app/shared/dal';

/**
 * GSTR-2A Import Entity
 * 
 * Stores imported GSTR-2A/2B data for reconciliation.
 */
@Entity('gstr2a_imports')
@Index(['business_id'])
@Index(['period'])
@Index(['business_id', 'period'])
export class Gstr2aImport extends BaseEntity {
  @Column({ type: 'uuid', name: 'business_id' })
  business_id: string;

  @Column({ type: 'varchar', length: 7, name: 'period' })
  period: string; // MMYYYY or Q1-YYYY

  @Column({ type: 'varchar', length: 20, default: 'gstr2a', name: 'import_type' })
  import_type: string; // 'gstr2a' or 'gstr2b'

  @Column({ type: 'jsonb', name: 'import_data' })
  import_data: any; // Full GSTR-2A/2B JSON

  @Column({ type: 'int', default: 0, name: 'total_invoices' })
  total_invoices: number;

  @Column({ type: 'int', default: 0, name: 'matched_invoices' })
  matched_invoices: number;

  @Column({ type: 'int', default: 0, name: 'missing_invoices' })
  missing_invoices: number;

  @Column({ type: 'int', default: 0, name: 'mismatched_invoices' })
  mismatched_invoices: number;

  @Column({ type: 'timestamptz', name: 'imported_at' })
  imported_at: Date;

  @Column({ type: 'uuid', nullable: true, name: 'imported_by' })
  imported_by?: string;
}

