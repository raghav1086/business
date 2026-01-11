import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseRepository } from '@business-app/shared/dal';
import { Gstr2aImport } from '../entities/gstr2a-import.entity';

@Injectable()
export class Gstr2aImportRepository extends BaseRepository<Gstr2aImport> {
  constructor(
    @InjectRepository(Gstr2aImport)
    repository: Repository<Gstr2aImport>
  ) {
    super(repository);
  }

  /**
   * Find import by business and period
   */
  async findByBusinessAndPeriod(
    businessId: string,
    period: string
  ): Promise<Gstr2aImport | null> {
    return this.repository.findOne({
      where: { business_id: businessId, period } as any,
      order: { imported_at: 'DESC' },
    });
  }

  /**
   * Find one by ID (exposes repository method)
   */
  async findOne(options: any): Promise<Gstr2aImport | null> {
    return this.repository.findOne(options);
  }
}

