import {
  Entity,
  Column,
  Index,
} from 'typeorm';
import { BaseEntity } from '@business-app/shared/dal';

/**
 * OTP Request Entity
 * 
 * Represents an OTP request for authentication.
 * Matches DATABASE_SCHEMA.md otp_requests table.
 */
@Entity('otp_requests')
@Index(['phone', 'purpose'])
export class OtpRequest extends BaseEntity {
  @Column({ type: 'varchar', length: 15 })
  phone: string;

  @Column({ type: 'varchar', length: 255, name: 'otp_hash' })
  otp_hash: string;

  @Column({ type: 'varchar', length: 20 })
  purpose: string; // login, registration, verify_phone, verify_email

  @Column({ type: 'int', default: 0 })
  attempts: number;

  @Column({ type: 'timestamptz', name: 'expires_at' })
  expires_at: Date;

  @Column({ type: 'timestamptz', nullable: true, name: 'verified_at' })
  verified_at?: Date;
}

