import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseRepository } from '@business-app/shared/dal';
import { InvoiceItem } from '../entities/invoice-item.entity';

/**
 * Invoice Item Repository
 */
@Injectable()
export class InvoiceItemRepository extends BaseRepository<InvoiceItem> {
  constructor(
    @InjectRepository(InvoiceItem)
    repository: Repository<InvoiceItem>
  ) {
    super(repository);
  }

  /**
   * Find all items for invoice
   */
  async findByInvoiceId(invoiceId: string): Promise<InvoiceItem[]> {
    return this.repository.find({
      where: { invoice_id: invoiceId },
      order: { sort_order: 'ASC' },
    });
  }
}

