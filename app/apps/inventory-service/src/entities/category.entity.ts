import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { BaseEntity } from '@business-app/shared/dal';

/**
 * Category Entity
 * 
 * Represents a product category.
 * Matches DATABASE_SCHEMA.md categories table.
 */
@Entity('categories')
@Index(['business_id'])
@Index(['parent_id'])
export class Category extends BaseEntity {
  @Column({ type: 'uuid', name: 'business_id' })
  business_id: string;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'uuid', nullable: true, name: 'parent_id' })
  parent_id?: string;

  @ManyToOne(() => Category)
  @JoinColumn({ name: 'parent_id' })
  parent?: Category;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'varchar', length: 500, nullable: true, name: 'image_url' })
  image_url?: string;

  @Column({ type: 'int', default: 0, name: 'sort_order' })
  sort_order: number;
}

