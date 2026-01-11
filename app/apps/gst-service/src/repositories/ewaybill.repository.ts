import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseRepository } from '@business-app/shared/dal';
import { EWayBill } from '../entities/ewaybill.entity';

/**
 * E-Way Bill Repository
 */
@Injectable()
export class EWayBillRepository extends BaseRepository<EWayBill> {
  constructor(
    @InjectRepository(EWayBill)
    repository: Repository<EWayBill>
  ) {
    super(repository);
  }

  /**
   * Find by invoice ID
   */
  async findByInvoiceId(invoiceId: string): Promise<EWayBill | null> {
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
   * Find by E-Way Bill number
   */
  async findByEWayBillNumber(ewaybillNumber: string): Promise<EWayBill | null> {
    return this.repository.findOne({
      where: {
        ewaybill_number: ewaybillNumber,
      },
    });
  }
}

