import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseRepository } from '@business-app/shared/dal';
import { Invoice } from '../entities/invoice.entity';

/**
 * Invoice Repository
 */
@Injectable()
export class InvoiceRepository extends BaseRepository<Invoice> {
  constructor(
    @InjectRepository(Invoice)
    repository: Repository<Invoice>
  ) {
    super(repository);
  }

  /**
   * Find all invoices for business with filters
   */
  async findByBusinessId(
    businessId: string,
    filters?: {
      partyId?: string;
      invoiceType?: string;
      paymentStatus?: string;
      status?: string;
      startDate?: Date;
      endDate?: Date;
      search?: string;
      page?: number;
      limit?: number;
    }
  ): Promise<{ invoices: Invoice[]; total: number }> {
    const queryBuilder = this.repository
      .createQueryBuilder('invoice')
      .leftJoinAndSelect('invoice.items', 'items')
      .where('invoice.business_id = :businessId', { businessId });

    if (filters?.partyId) {
      queryBuilder.andWhere('invoice.party_id = :partyId', {
        partyId: filters.partyId,
      });
    }

    if (filters?.invoiceType) {
      queryBuilder.andWhere('invoice.invoice_type = :invoiceType', {
        invoiceType: filters.invoiceType,
      });
    }

    if (filters?.paymentStatus) {
      queryBuilder.andWhere('invoice.payment_status = :paymentStatus', {
        paymentStatus: filters.paymentStatus,
      });
    }

    if (filters?.status) {
      queryBuilder.andWhere('invoice.status = :status', {
        status: filters.status,
      });
    }

    if (filters?.startDate) {
      queryBuilder.andWhere('invoice.invoice_date >= :startDate', {
        startDate: filters.startDate,
      });
    }

    if (filters?.endDate) {
      queryBuilder.andWhere('invoice.invoice_date <= :endDate', {
        endDate: filters.endDate,
      });
    }

    if (filters?.search) {
      queryBuilder.andWhere(
        '(invoice.invoice_number ILIKE :search OR invoice.notes ILIKE :search)',
        { search: `%${filters.search}%` }
      );
    }

    // Get total count
    const total = await queryBuilder.getCount();

    // Apply pagination
    if (filters?.page && filters?.limit) {
      const skip = (filters.page - 1) * filters.limit;
      queryBuilder.skip(skip).take(filters.limit);
    }

    // Order by
    queryBuilder.orderBy('invoice.invoice_date', 'DESC');
    queryBuilder.addOrderBy('invoice.created_at', 'DESC');

    const invoices = await queryBuilder.getMany();

    return { invoices, total };
  }

  /**
   * Find invoice by business ID and invoice ID
   */
  async findByBusinessIdAndId(
    businessId: string,
    id: string
  ): Promise<Invoice | null> {
    return this.repository.findOne({
      where: { business_id: businessId, id },
      relations: ['items'],
    });
  }

  /**
   * Find invoice by invoice number
   */
  async findByInvoiceNumber(
    businessId: string,
    invoiceNumber: string,
    invoiceType: string
  ): Promise<Invoice | null> {
    return this.repository.findOne({
      where: {
        business_id: businessId,
        invoice_number: invoiceNumber,
        invoice_type: invoiceType,
      },
    });
  }

  /**
   * Get next invoice number
   */
  async getNextInvoiceNumber(
    businessId: string,
    invoiceType: string = 'sale'
  ): Promise<string> {
    // This will be enhanced with invoice_settings table
    // For MVP, simple sequential numbering
    const prefix = invoiceType === 'sale' ? 'INV' : 'PUR';
    const lastInvoice = await this.repository.findOne({
      where: {
        business_id: businessId,
        invoice_type: invoiceType,
      },
      order: { created_at: 'DESC' },
    });

    let nextNumber = 1;
    if (lastInvoice) {
      // Extract number from invoice_number (e.g., "INV-001" -> 1)
      const match = lastInvoice.invoice_number.match(/\d+$/);
      if (match) {
        nextNumber = parseInt(match[0], 10) + 1;
      }
    }

    return `${prefix}-${String(nextNumber).padStart(3, '0')}`;
  }
}

