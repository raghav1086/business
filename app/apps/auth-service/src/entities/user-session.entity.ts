import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { BaseEntity } from '@business-app/shared/dal';
import { User } from './user.entity';

/**
 * User Session Entity
 * 
 * Represents an active user session.
 * Matches DATABASE_SCHEMA.md user_sessions table.
 */
@Entity('user_sessions')
@Index(['user_id'])
@Index(['device_id'])
export class UserSession extends BaseEntity {
  @Column({ type: 'uuid', name: 'user_id' })
  user_id: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'varchar', length: 100, name: 'device_id' })
  device_id: string;

  @Column({ type: 'varchar', length: 100, nullable: true, name: 'device_name' })
  device_name?: string;

  @Column({ type: 'varchar', length: 50, nullable: true, name: 'device_os' })
  device_os?: string;

  @Column({ type: 'varchar', length: 20, nullable: true, name: 'app_version' })
  app_version?: string;

  @Column({ type: 'varchar', length: 45, nullable: true, name: 'ip_address' })
  ip_address?: string;

  @Column({ type: 'boolean', default: true, name: 'is_active' })
  is_active: boolean;

  @Column({ type: 'timestamptz', default: () => 'NOW()', name: 'last_active_at' })
  last_active_at: Date;
}

