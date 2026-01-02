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

  /**
   * Find all audit logs (system-wide, for superadmin)
   * Overrides BaseRepository.findAll to support filters and limit
   */
  async findAll(filters?: Record<string, any>, limit?: number): Promise<AuditLog[]> {
    const actualLimit = limit || 500;
    const options: any = {
      order: { created_at: 'DESC' },
      take: actualLimit,
    };
    
    if (filters) {
      options.where = filters;
    }
    
    return this.repository.find(options);
  }
  
  /**
   * Find all audit logs with limit (legacy method for backward compatibility)
   */
  async findAllWithLimit(limit: number = 500): Promise<AuditLog[]> {
    return this.findAll(undefined, limit);
  }

  /**
   * Get audit log statistics
   */
  async getStatistics(): Promise<{
    totalLogs: number;
    mostActiveUsers: Array<{ user_id: string; count: number }>;
    mostCommonActions: Array<{ action: string; count: number }>;
    logsByBusiness: Array<{ business_id: string; count: number }>;
  }> {
    const totalLogs = await this.repository.count();

    // Most active users (who performed actions)
    const mostActiveUsers = await this.repository
      .createQueryBuilder('audit_log')
      .select('audit_log.user_id', 'user_id')
      .addSelect('COUNT(*)', 'count')
      .where('audit_log.user_id IS NOT NULL')
      .groupBy('audit_log.user_id')
      .orderBy('count', 'DESC')
      .limit(10)
      .getRawMany();

    // Most common actions
    const mostCommonActions = await this.repository
      .createQueryBuilder('audit_log')
      .select('audit_log.action', 'action')
      .addSelect('COUNT(*)', 'count')
      .groupBy('audit_log.action')
      .orderBy('count', 'DESC')
      .limit(10)
      .getRawMany();

    // Logs by business
    const logsByBusiness = await this.repository
      .createQueryBuilder('audit_log')
      .select('audit_log.business_id', 'business_id')
      .addSelect('COUNT(*)', 'count')
      .groupBy('audit_log.business_id')
      .orderBy('count', 'DESC')
      .limit(10)
      .getRawMany();

    return {
      totalLogs,
      mostActiveUsers: mostActiveUsers.map((r) => ({
        user_id: r.user_id,
        count: parseInt(r.count, 10),
      })),
      mostCommonActions: mostCommonActions.map((r) => ({
        action: r.action,
        count: parseInt(r.count, 10),
      })),
      logsByBusiness: logsByBusiness.map((r) => ({
        business_id: r.business_id,
        count: parseInt(r.count, 10),
      })),
    };
  }
}

