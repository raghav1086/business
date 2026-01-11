import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseRepository } from '@business-app/shared/dal';
import { Transaction } from '../entities/transaction.entity';

/**
 * Transaction Repository
 */
@Injectable()
export class TransactionRepository extends BaseRepository<Transaction> {
  constructor(
    @InjectRepository(Transaction)
    repository: Repository<Transaction>
  ) {
    super(repository);
  }

  /**
   * Find all transactions for business
   */
  async findByBusinessId(
    businessId: string,
    filters?: {
      partyId?: string;
      invoiceId?: string;
      transactionType?: string;
      startDate?: Date;
      endDate?: Date;
      page?: number;
      limit?: number;
    }
  ): Promise<{ transactions: Transaction[]; total: number }> {
    const queryBuilder = this.repository
      .createQueryBuilder('transaction')
      .where('transaction.business_id = :businessId', { businessId })
      .andWhere('transaction.status = :status', { status: 'active' });

    if (filters?.partyId) {
      queryBuilder.andWhere('transaction.party_id = :partyId', {
        partyId: filters.partyId,
      });
    }

    if (filters?.invoiceId) {
      queryBuilder.andWhere('transaction.invoice_id = :invoiceId', {
        invoiceId: filters.invoiceId,
      });
    }

    if (filters?.transactionType) {
      queryBuilder.andWhere('transaction.transaction_type = :transactionType', {
        transactionType: filters.transactionType,
      });
    }

    if (filters?.startDate) {
      queryBuilder.andWhere('transaction.transaction_date >= :startDate', {
        startDate: filters.startDate,
      });
    }

    if (filters?.endDate) {
      queryBuilder.andWhere('transaction.transaction_date <= :endDate', {
        endDate: filters.endDate,
      });
    }

    // Get total count
    const total = await queryBuilder.getCount();

    // Apply pagination
    if (filters?.page && filters?.limit) {
      const skip = (filters.page - 1) * filters.limit;
      queryBuilder.skip(skip).take(filters.limit);
    }

    // Order by
    queryBuilder.orderBy('transaction.transaction_date', 'DESC');
    queryBuilder.addOrderBy('transaction.created_at', 'DESC');

    const transactions = await queryBuilder.getMany();

    return { transactions, total };
  }

  /**
   * Find transactions for invoice
   */
  async findByInvoiceId(invoiceId: string): Promise<Transaction[]> {
    return this.repository.find({
      where: { invoice_id: invoiceId, status: 'active' },
      order: { transaction_date: 'DESC' },
    });
  }

  /**
   * Find all transactions across all businesses (for superadmin)
   */
  async findAllForSuperadmin(
    filters?: {
      partyId?: string;
      invoiceId?: string;
      transactionType?: string;
      startDate?: Date;
      endDate?: Date;
      page?: number;
      limit?: number;
    }
  ): Promise<{ transactions: Transaction[]; total: number }> {
    const queryBuilder = this.repository
      .createQueryBuilder('transaction')
      .where('transaction.status = :status', { status: 'active' });

    if (filters?.partyId) {
      queryBuilder.andWhere('transaction.party_id = :partyId', {
        partyId: filters.partyId,
      });
    }

    if (filters?.invoiceId) {
      queryBuilder.andWhere('transaction.invoice_id = :invoiceId', {
        invoiceId: filters.invoiceId,
      });
    }

    if (filters?.transactionType) {
      queryBuilder.andWhere('transaction.transaction_type = :transactionType', {
        transactionType: filters.transactionType,
      });
    }

    if (filters?.startDate) {
      queryBuilder.andWhere('transaction.transaction_date >= :startDate', {
        startDate: filters.startDate,
      });
    }

    if (filters?.endDate) {
      queryBuilder.andWhere('transaction.transaction_date <= :endDate', {
        endDate: filters.endDate,
      });
    }

    // Get total count
    const total = await queryBuilder.getCount();

    // Apply pagination
    if (filters?.page && filters?.limit) {
      const skip = (filters.page - 1) * filters.limit;
      queryBuilder.skip(skip).take(filters.limit);
    }

    // Order by
    queryBuilder.orderBy('transaction.transaction_date', 'DESC');
    queryBuilder.addOrderBy('transaction.created_at', 'DESC');

    const transactions = await queryBuilder.getMany();

    return { transactions, total };
  }
}

