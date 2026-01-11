import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseRepository } from '@business-app/shared/dal';
import { EInvoiceRequest } from '../entities/einvoice-request.entity';

/**
 * E-Invoice Request Repository
 */
@Injectable()
export class EInvoiceRequestRepository extends BaseRepository<EInvoiceRequest> {
  constructor(
    @InjectRepository(EInvoiceRequest)
    repository: Repository<EInvoiceRequest>
  ) {
    super(repository);
  }

  /**
   * Find by invoice ID
   */
  async findByInvoiceId(invoiceId: string): Promise<EInvoiceRequest | null> {
    return this.repository.findOne({
      where: {
        invoice_id: invoiceId,
      },
      order: {
        requested_at: 'DESC',
      },
    });
  }

  /**
   * Find by IRN
   */
  async findByIRN(irn: string): Promise<EInvoiceRequest | null> {
    return this.repository.findOne({
      where: {
        irn: irn,
      },
    });
  }
}

