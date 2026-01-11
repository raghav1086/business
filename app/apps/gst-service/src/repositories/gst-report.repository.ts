import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseRepository } from '@business-app/shared/dal';
import { GstReport } from '../entities/gst-report.entity';

/**
 * GST Report Repository
 */
@Injectable()
export class GstReportRepository extends BaseRepository<GstReport> {
  constructor(
    @InjectRepository(GstReport)
    repository: Repository<GstReport>
  ) {
    super(repository);
  }

  /**
   * Find cached report
   */
  async findCachedReport(
    businessId: string,
    reportType: string,
    period: string
  ): Promise<GstReport | null> {
    return this.repository.findOne({
      where: {
        business_id: businessId,
        report_type: reportType,
        period: period,
      },
      order: {
        generated_at: 'DESC',
      },
    });
  }

  /**
   * Check if cache is fresh (within 1 hour)
   */
  async isCacheFresh(
    businessId: string,
    reportType: string,
    period: string
  ): Promise<boolean> {
    const report = await this.findCachedReport(businessId, reportType, period);
    if (!report) {
      return false;
    }

    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    return report.generated_at > oneHourAgo;
  }
}

