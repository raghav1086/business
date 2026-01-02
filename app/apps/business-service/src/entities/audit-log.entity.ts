import {
  Entity,
  Column,
  Index,
} from 'typeorm';
import { BaseEntity } from '@business-app/shared/dal';

/**
 * Audit Log Entity
 * 
 * Tracks all permission and role changes for audit purposes.
 */
@Entity('audit_logs')
@Index(['business_id', 'user_id'])
@Index(['action'])
@Index(['created_at'])
export class AuditLog extends BaseEntity {
  @Column({ type: 'uuid', name: 'business_id' })
  business_id: string;

  @Column({ type: 'uuid', name: 'user_id', nullable: true })
  user_id?: string; // User who performed the action

  @Column({ type: 'uuid', name: 'target_user_id', nullable: true })
  target_user_id?: string; // User whose permissions were changed

  @Column({ type: 'varchar', length: 100 })
  action: string; // 'user:assign', 'user:remove', 'permission:update', 'role:update', etc.

  @Column({ type: 'varchar', length: 100, nullable: true })
  resource: string; // 'business_user', 'permission', etc.

  @Column({ type: 'uuid', nullable: true, name: 'resource_id' })
  resource_id?: string; // ID of the resource (business_user.id, etc.)

  @Column({ type: 'jsonb', nullable: true })
  old_value?: Record<string, any>; // Previous state

  @Column({ type: 'jsonb', nullable: true })
  new_value?: Record<string, any>; // New state

  @Column({ type: 'varchar', length: 45, nullable: true, name: 'ip_address' })
  ip_address?: string;

  @Column({ type: 'varchar', length: 500, nullable: true, name: 'user_agent' })
  user_agent?: string;

  @Column({ type: 'text', nullable: true })
  notes?: string; // Additional context
}

