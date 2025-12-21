import {
  Entity,
  Column,
  OneToMany,
  Index,
} from 'typeorm';
import { BaseEntity } from '@business-app/shared/dal';

/**
 * User Entity
 * 
 * Represents a user in the system.
 * Matches DATABASE_SCHEMA.md users table.
 */
@Entity('users')
@Index(['phone'])
@Index(['email'])
@Index(['status'])
export class User extends BaseEntity {
  @Column({ type: 'varchar', length: 15, unique: true })
  phone: string;

  @Column({ type: 'boolean', default: false, name: 'phone_verified' })
  phone_verified: boolean;

  @Column({ type: 'varchar', length: 100, nullable: true })
  name?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  email?: string;

  @Column({ type: 'boolean', default: false, name: 'email_verified' })
  email_verified: boolean;

  @Column({ type: 'varchar', length: 500, nullable: true, name: 'avatar_url' })
  avatar_url?: string;

  @Column({ type: 'varchar', length: 20, default: 'business_owner', name: 'user_type' })
  user_type: string; // business_owner, accountant, staff

  @Column({ type: 'varchar', length: 10, default: 'en', name: 'language_preference' })
  language_preference: string; // en, hi

  @Column({ type: 'timestamptz', nullable: true, name: 'last_login_at' })
  last_login_at?: Date;
}

