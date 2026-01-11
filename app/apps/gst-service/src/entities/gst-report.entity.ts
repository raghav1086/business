import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '@business-app/shared/dal';

/**
 * GST Report Entity
 * 
 * Caches generated GST reports to avoid regeneration.
 */
@Entity('gst_reports')
@Index(['business_id', 'report_type', 'period'])
@Index(['business_id'])
export class GstReport extends BaseEntity {
  @Column({ type: 'uuid', name: 'business_id' })
  business_id: string;

  @Column({ type: 'varchar', length: 20 })
  report_type: string; // 'gstr1', 'gstr3b', 'gstr4'

  @Column({ type: 'varchar', length: 10 })
  period: string; // 'MMYYYY' or 'Q1-YYYY'

  @Column({ type: 'jsonb' })
  report_data: any; // Generated report data in GSTN format

  @Column({ type: 'timestamptz', name: 'generated_at' })
  generated_at: Date;
}

