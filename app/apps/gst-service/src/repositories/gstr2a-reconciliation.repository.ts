import { Injectable } from '@nestjs/common';
import { BaseRepository } from '@business-app/shared/dal';
import { Gstr2aReconciliation } from '../entities/gstr2a-reconciliation.entity';
import { DataSource } from 'typeorm';

@Injectable()
export class Gstr2aReconciliationRepository extends BaseRepository<Gstr2aReconciliation> {
  constructor(dataSource: DataSource) {
    super(Gstr2aReconciliation, dataSource);
  }

  /**
   * Find reconciliations by import ID
   */
  async findByImportId(importId: string): Promise<Gstr2aReconciliation[]> {
    return this.find({
      where: { gstr2a_import_id: importId },
      order: { supplier_invoice_date: 'DESC' },
    });
  }

  /**
   * Find reconciliation by invoice ID
   */
  async findByInvoiceId(invoiceId: string): Promise<Gstr2aReconciliation | null> {
    return this.findOne({
      where: { invoice_id: invoiceId },
    });
  }
}

