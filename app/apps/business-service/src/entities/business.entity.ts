import {
  Entity,
  Column,
  ManyToOne,
  OneToMany,
  Index,
} from 'typeorm';
import { BaseEntity } from '@business-app/shared/dal';

/**
 * Business Entity
 * 
 * Represents a business/organization in the system.
 * Matches DATABASE_SCHEMA.md businesses table.
 */
@Entity('businesses')
@Index(['owner_id'])
@Index(['gstin'])
@Index(['status'])
export class Business extends BaseEntity {
  @Column({ type: 'uuid', name: 'owner_id' })
  owner_id: string;

  @Column({ type: 'varchar', length: 200 })
  name: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  type?: string; // retailer, wholesaler, manufacturer, service

  @Column({ type: 'varchar', length: 15, nullable: true, unique: true })
  gstin?: string;

  @Column({ type: 'varchar', length: 10, nullable: true })
  pan?: string;

  @Column({ type: 'varchar', length: 15, nullable: true })
  phone?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  email?: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  logo_url?: string;

  // Address
  @Column({ type: 'varchar', length: 255, nullable: true })
  address_line1?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  address_line2?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  city?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  state?: string;

  @Column({ type: 'varchar', length: 10, nullable: true })
  pincode?: string;

  @Column({ type: 'varchar', length: 50, default: 'India' })
  country: string;

  // Bank Details
  @Column({ type: 'varchar', length: 100, nullable: true })
  bank_name?: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  account_number?: string;

  @Column({ type: 'varchar', length: 11, nullable: true })
  ifsc_code?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  upi_id?: string;

  // Settings
  @Column({ type: 'int', default: 4 })
  financial_year_start: number; // April

  @Column({ type: 'varchar', length: 20, default: 'regular' })
  gst_type: string; // regular, composition, unregistered

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  composition_rate?: number;

  @Column({ type: 'varchar', length: 10, nullable: true })
  iec_number?: string; // Import Export Code

  @Column({ type: 'varchar', length: 50, nullable: true })
  drug_license_number?: string;

  @Column({ type: 'boolean', default: false })
  is_ecommerce_operator: boolean;
}

