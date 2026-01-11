import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseRepository } from '@business-app/shared/dal';
import { Gstr2aReconciliation } from '../entities/gstr2a-reconciliation.entity';

@Injectable()
export class Gstr2aReconciliationRepository extends BaseRepository<Gstr2aReconciliation> {
  constructor(
    @InjectRepository(Gstr2aReconciliation)
    repository: Repository<Gstr2aReconciliation>
  ) {
    super(repository);
  }

  /**
   * Find reconciliations by import ID
   */
  async findByImportId(importId: string): Promise<Gstr2aReconciliation[]> {
    return this.repository.find({
      where: { gstr2a_import_id: importId } as any,
      order: { supplier_invoice_date: 'DESC' },
    });
  }

  /**
   * Find reconciliation by invoice ID
   */
  async findByInvoiceId(invoiceId: string): Promise<Gstr2aReconciliation | null> {
    return this.repository.findOne({
      where: { invoice_id: invoiceId } as any,
    });
  }

  /**
   * Find one (exposes repository method)
   */
  async findOne(options: any): Promise<Gstr2aReconciliation | null> {
    return this.repository.findOne(options);
  }

  /**
   * Find (exposes repository method)
   */
  async find(options?: any): Promise<Gstr2aReconciliation[]> {
    return this.repository.find(options);
  }
}

