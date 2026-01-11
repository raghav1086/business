import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseRepository } from '@business-app/shared/dal';
import { BusinessGstSettings } from '../entities/business-gst-settings.entity';

/**
 * Business GST Settings Repository
 */
@Injectable()
export class BusinessGstSettingsRepository extends BaseRepository<BusinessGstSettings> {
  constructor(
    @InjectRepository(BusinessGstSettings)
    repository: Repository<BusinessGstSettings>
  ) {
    super(repository);
  }

  /**
   * Find settings by business ID
   */
  async findByBusinessId(businessId: string): Promise<BusinessGstSettings | null> {
    return this.repository.findOne({
      where: {
        business_id: businessId,
      } as any,
    });
  }

  /**
   * Find one (exposes repository method)
   */
  async findOne(options: any): Promise<BusinessGstSettings | null> {
    return this.repository.findOne(options);
  }

  /**
   * Create or update settings
   */
  async upsert(settings: Partial<BusinessGstSettings>): Promise<BusinessGstSettings> {
    const existing = await this.findByBusinessId(settings.business_id!);
    
    if (existing) {
      await this.repository.update(existing.id, settings);
      return this.findByBusinessId(settings.business_id!) as Promise<BusinessGstSettings>;
    } else {
      return this.repository.save(this.repository.create(settings));
    }
  }
}

