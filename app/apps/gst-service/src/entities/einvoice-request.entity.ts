import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '@business-app/shared/dal';

/**
 * E-Invoice Request Entity
 * 
 * Tracks E-Invoice IRN generation requests and status.
 */
@Entity('einvoice_requests')
@Index(['business_id'])
@Index(['invoice_id'])
@Index(['irn'])
export class EInvoiceRequest extends BaseEntity {
  @Column({ type: 'uuid', name: 'business_id' })
  business_id: string;

  @Column({ type: 'uuid', name: 'invoice_id' })
  invoice_id: string;

  @Column({ type: 'varchar', length: 64, nullable: true })
  irn?: string; // Invoice Registration Number

  @Column({ type: 'text', nullable: true, name: 'qr_code' })
  qr_code?: string; // QR code data

  @Column({ type: 'varchar', length: 20, default: 'pending' })
  declare status: string; // 'pending', 'success', 'failed' - overrides BaseEntity status

  @Column({ type: 'text', nullable: true, name: 'error_message' })
  error_message?: string;

  @Column({ type: 'timestamptz', name: 'requested_at' })
  requested_at: Date;

  @Column({ type: 'timestamptz', nullable: true, name: 'generated_at' })
  generated_at?: Date;
}

