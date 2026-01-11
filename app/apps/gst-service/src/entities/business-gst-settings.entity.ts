import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '@business-app/shared/dal';

/**
 * Business GST Settings Entity
 * 
 * Stores GST configuration for each business.
 */
@Entity('business_gst_settings')
@Index(['business_id'], { unique: true })
export class BusinessGstSettings extends BaseEntity {
  @Column({ type: 'uuid', name: 'business_id', unique: true })
  business_id: string;

  @Column({ type: 'varchar', length: 20, default: 'regular', name: 'gst_type' })
  gst_type: string; // 'regular' | 'composition'

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true, name: 'annual_turnover' })
  annual_turnover?: number;

  @Column({ type: 'varchar', length: 20, default: 'monthly', name: 'filing_frequency' })
  filing_frequency: string; // 'monthly' | 'quarterly'

  @Column({ type: 'varchar', length: 50, nullable: true, name: 'gsp_provider' })
  gsp_provider?: string; // 'cleartax', 'tally', etc.

  @Column({ type: 'text', nullable: true, name: 'gsp_credentials' })
  gsp_credentials?: string; // Encrypted JSON

  @Column({ type: 'boolean', default: false, name: 'einvoice_enabled' })
  einvoice_enabled: boolean; // Based on turnover (5Cr)

  @Column({ type: 'boolean', default: true, name: 'ewaybill_enabled' })
  ewaybill_enabled: boolean;
}

