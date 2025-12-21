import {
  Entity,
  Column,
  Index,
} from 'typeorm';
import { BaseEntity } from '@business-app/shared/dal';

/**
 * Transaction Entity
 * 
 * Represents a payment transaction.
 * Matches DATABASE_SCHEMA.md transactions table.
 */
@Entity('transactions')
@Index(['business_id'])
@Index(['party_id'])
@Index(['invoice_id'])
@Index(['transaction_date'])
@Index(['business_id', 'transaction_type'])
export class Transaction extends BaseEntity {
  @Column({ type: 'uuid', name: 'business_id' })
  business_id: string;

  // Transaction Details
  @Column({ type: 'varchar', length: 30, name: 'transaction_type' })
  transaction_type: string; // payment_in, payment_out, expense, journal, contra

  @Column({ type: 'date', name: 'transaction_date' })
  transaction_date: Date;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  amount: number;

  // References
  @Column({ type: 'uuid', nullable: true, name: 'party_id' })
  party_id?: string;

  @Column({ type: 'uuid', nullable: true, name: 'invoice_id' })
  invoice_id?: string;

  // Payment Details
  @Column({ type: 'varchar', length: 30, nullable: true, name: 'payment_mode' })
  payment_mode?: string; // cash, bank, upi, cheque, credit, card

  @Column({ type: 'varchar', length: 100, nullable: true, name: 'reference_number' })
  reference_number?: string;

  @Column({ type: 'varchar', length: 100, nullable: true, name: 'bank_name' })
  bank_name?: string;

  @Column({ type: 'varchar', length: 20, nullable: true, name: 'cheque_number' })
  cheque_number?: string;

  @Column({ type: 'date', nullable: true, name: 'cheque_date' })
  cheque_date?: Date;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Column({ type: 'uuid', name: 'created_by' })
  created_by: string;
}

