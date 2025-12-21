import {
  Entity,
  Column,
  Index,
} from 'typeorm';
import { BaseEntity } from '@business-app/shared/dal';

/**
 * Unit Entity
 * 
 * Represents a measurement unit (Pieces, Kg, Ltr, etc.).
 * Matches DATABASE_SCHEMA.md units table.
 */
@Entity('units')
@Index(['business_id'])
export class Unit extends BaseEntity {
  @Column({ type: 'uuid', name: 'business_id' })
  business_id: string;

  @Column({ type: 'varchar', length: 50 })
  name: string; // Pieces, Kilogram, Liter

  @Column({ type: 'varchar', length: 10, name: 'short_name' })
  short_name: string; // pcs, kg, ltr

  @Column({ type: 'boolean', default: false, name: 'is_default' })
  is_default: boolean;

  @Column({ type: 'int', default: 0, name: 'decimal_places' })
  decimal_places: number; // 0 for Pcs, 2 for Kg, 3 for Ltr
}

