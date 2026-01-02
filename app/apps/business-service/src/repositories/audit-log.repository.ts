import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseRepository } from '@business-app/shared/dal';
import { AuditLog } from '../entities/audit-log.entity';

/**
 * Audit Log Repository
 */
@Injectable()
export class AuditLogRepository extends BaseRepository<AuditLog> {
  constructor(
    @InjectRepository(AuditLog)
    repository: Repository<AuditLog>
  ) {
    super(repository);
  }

  /**
   * Find audit logs for a business
   */
  async findByBusiness(businessId: string, limit: number = 100): Promise<AuditLog[]> {
    return this.repository.find({
      where: { business_id: businessId },
      order: { created_at: 'DESC' },
      take: limit,
    });
  }

  /**
   * Find audit logs for a user
   */
  async findByUser(userId: string, limit: number = 100): Promise<AuditLog[]> {
    return this.repository.find({
      where: { target_user_id: userId },
      order: { created_at: 'DESC' },
      take: limit,
    });
  }

  /**
   * Find audit logs by action
   */
  async findByAction(action: string, limit: number = 100): Promise<AuditLog[]> {
    return this.repository.find({
      where: { action },
      order: { created_at: 'DESC' },
      take: limit,
    });
  }
}

