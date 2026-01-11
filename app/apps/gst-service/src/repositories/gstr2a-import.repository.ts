import { Injectable } from '@nestjs/common';
import { BaseRepository } from '@business-app/shared/dal';
import { Gstr2aImport } from '../entities/gstr2a-import.entity';
import { DataSource } from 'typeorm';

@Injectable()
export class Gstr2aImportRepository extends BaseRepository<Gstr2aImport> {
  constructor(dataSource: DataSource) {
    super(Gstr2aImport, dataSource);
  }

  /**
   * Find import by business and period
   */
  async findByBusinessAndPeriod(
    businessId: string,
    period: string
  ): Promise<Gstr2aImport | null> {
    return this.findOne({
      where: { business_id: businessId, period },
      order: { imported_at: 'DESC' },
    });
  }
}

