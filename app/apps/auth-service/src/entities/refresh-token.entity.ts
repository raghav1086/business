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
 * Refresh Token Entity
 * 
 * Represents a refresh token for session management.
 * Matches DATABASE_SCHEMA.md refresh_tokens table.
 */
@Entity('refresh_tokens')
@Index(['user_id'])
@Index(['token_hash'])
export class RefreshToken extends BaseEntity {
  @Column({ type: 'uuid', name: 'user_id' })
  user_id: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'varchar', length: 255, unique: true, name: 'token_hash' })
  token_hash: string;

  @Column({ type: 'jsonb', nullable: true, name: 'device_info' })
  device_info?: Record<string, any>;

  @Column({ type: 'varchar', length: 45, nullable: true, name: 'ip_address' })
  ip_address?: string;

  @Column({ type: 'timestamptz', name: 'expires_at' })
  expires_at: Date;

  @Column({ type: 'timestamptz', nullable: true, name: 'revoked_at' })
  revoked_at?: Date;
}

