import {
  Entity,
  Column,
  Index,
  Check,
} from 'typeorm';
import { BaseEntity } from '@business-app/shared/dal';

/**
 * BusinessUser Entity
 * 
 * Represents the many-to-many relationship between users and businesses
 * with role-based access control and permissions.
 * 
 * Key Design:
 * - permissions = NULL means use all role permissions (full access by default)
 * - permissions = {"invoice:delete": false} means deny specific permission
 * - Only denied permissions are stored for efficiency
 */
@Entity('business_users')
@Index(['business_id', 'user_id'], { unique: true })
@Index(['business_id'])
@Index(['user_id'])
@Index(['role'])
@Index(['status'])
// GIN index for JSONB permissions - created via migration
@Check(`"status" IN ('active', 'invited', 'suspended', 'removed')`)
export class BusinessUser extends BaseEntity {
  @Column({ type: 'uuid', name: 'business_id' })
  business_id: string;

  @Column({ type: 'uuid', name: 'user_id' })
  user_id: string;

  @Column({ type: 'varchar', length: 50 })
  role: string; // 'owner', 'admin', 'employee', 'accountant', 'salesman', 'viewer'

  @Column({ type: 'jsonb', nullable: true })
  permissions?: Record<string, boolean> | null; // NULL = all role permissions, {"permission": false} = deny

  @Column({ type: 'varchar', length: 20, default: 'active', name: 'status' })
  declare status: string; // 'active', 'invited', 'suspended', 'removed'

  @Column({ type: 'timestamptz', nullable: true })
  invited_at?: Date;

  @Column({ type: 'timestamptz', nullable: true })
  joined_at?: Date;

  @Column({ type: 'uuid', nullable: true })
  invited_by?: string; // User who invited (reference to users.id)

  @Column({ type: 'timestamptz', nullable: true })
  removed_at?: Date;

  @Column({ type: 'uuid', nullable: true })
  removed_by?: string; // User who removed (reference to users.id)
}

