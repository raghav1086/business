import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '@business-app/shared/dal';

/**
 * E-Way Bill Entity
 * 
 * Tracks E-Way Bill generation and status.
 */
@Entity('ewaybills')
@Index(['business_id'])
@Index(['invoice_id'])
@Index(['ewaybill_number'])
export class EWayBill extends BaseEntity {
  @Column({ type: 'uuid', name: 'business_id' })
  business_id: string;

  @Column({ type: 'uuid', name: 'invoice_id' })
  invoice_id: string;

  @Column({ type: 'varchar', length: 50, nullable: true, name: 'ewaybill_number' })
  ewaybill_number?: string;

  @Column({ type: 'varchar', length: 20, default: 'pending' })
  status: string; // 'pending', 'generated', 'cancelled', 'expired'

  @Column({ type: 'timestamptz', nullable: true, name: 'valid_until' })
  valid_until?: Date;

  @Column({ type: 'text', nullable: true, name: 'error_message' })
  error_message?: string;

  @Column({ type: 'timestamptz', name: 'requested_at' })
  requested_at: Date;

  @Column({ type: 'timestamptz', nullable: true, name: 'generated_at' })
  generated_at?: Date;
}

