import { Injectable } from '@nestjs/common';
import { AuditLogRepository } from '../repositories/audit-log.repository';
import { Request } from 'express';

/**
 * Audit Service
 * 
 * Logs all permission and role changes for audit purposes.
 */
@Injectable()
export class AuditService {
  constructor(private readonly auditLogRepository: AuditLogRepository) {}

  /**
   * Log permission change
   */
  async logPermissionChange(
    businessId: string,
    targetUserId: string,
    oldPermissions: Record<string, boolean> | null,
    newPermissions: Record<string, boolean> | null,
    performedBy: string,
    request?: Request
  ): Promise<void> {
    await this.auditLogRepository.create({
      business_id: businessId,
      user_id: performedBy,
      target_user_id: targetUserId,
      action: 'permission:update',
      resource: 'business_user',
      old_value: oldPermissions ? { permissions: oldPermissions } : null,
      new_value: newPermissions ? { permissions: newPermissions } : null,
      ip_address: request?.ip,
      user_agent: request?.headers['user-agent'],
      notes: `Permissions updated for user ${targetUserId} in business ${businessId}`,
    });
  }

  /**
   * Log role change
   */
  async logRoleChange(
    businessId: string,
    targetUserId: string,
    oldRole: string,
    newRole: string,
    performedBy: string,
    request?: Request
  ): Promise<void> {
    await this.auditLogRepository.create({
      business_id: businessId,
      user_id: performedBy,
      target_user_id: targetUserId,
      action: 'role:update',
      resource: 'business_user',
      old_value: { role: oldRole },
      new_value: { role: newRole },
      ip_address: request?.ip,
      user_agent: request?.headers['user-agent'],
      notes: `Role changed from ${oldRole} to ${newRole} for user ${targetUserId}`,
    });
  }

  /**
   * Log user assignment
   */
  async logUserAssignment(
    businessId: string,
    targetUserId: string,
    role: string,
    performedBy: string,
    request?: Request
  ): Promise<void> {
    await this.auditLogRepository.create({
      business_id: businessId,
      user_id: performedBy,
      target_user_id: targetUserId,
      action: 'user:assign',
      resource: 'business_user',
      new_value: { role, status: 'active' },
      ip_address: request?.ip,
      user_agent: request?.headers['user-agent'],
      notes: `User ${targetUserId} assigned to business ${businessId} with role ${role}`,
    });
  }

  /**
   * Log user removal
   */
  async logUserRemoval(
    businessId: string,
    targetUserId: string,
    performedBy: string,
    request?: Request
  ): Promise<void> {
    await this.auditLogRepository.create({
      business_id: businessId,
      user_id: performedBy,
      target_user_id: targetUserId,
      action: 'user:remove',
      resource: 'business_user',
      new_value: { status: 'removed' },
      ip_address: request?.ip,
      user_agent: request?.headers['user-agent'],
      notes: `User ${targetUserId} removed from business ${businessId}`,
    });
  }

  /**
   * Get audit logs for a business
   */
  async getBusinessAuditLogs(businessId: string, limit: number = 100) {
    return this.auditLogRepository.findByBusiness(businessId, limit);
  }

  /**
   * Get audit logs for a user
   */
  async getUserAuditLogs(userId: string, limit: number = 100) {
    return this.auditLogRepository.findByUser(userId, limit);
  }

  /**
   * Get all audit logs (system-wide, superadmin only)
   */
  async getAllAuditLogs(
    filters?: {
      action?: string;
      userId?: string;
      targetUserId?: string;
      businessId?: string;
      startDate?: Date;
      endDate?: Date;
    },
    limit: number = 500
  ) {
    // Build filters object for simple where conditions
    const whereFilters: Record<string, any> = {};
    if (filters?.action) whereFilters.action = filters.action;
    if (filters?.userId) whereFilters.user_id = filters.userId;
    if (filters?.targetUserId) whereFilters.target_user_id = filters.targetUserId;
    if (filters?.businessId) whereFilters.business_id = filters.businessId;
    
    // For date filters, we need to use query builder
    if (filters?.startDate || filters?.endDate) {
      const queryBuilder = (this.auditLogRepository as any).repository.createQueryBuilder('audit_log');
      
      if (filters?.action) queryBuilder.andWhere('audit_log.action = :action', { action: filters.action });
      if (filters?.userId) queryBuilder.andWhere('audit_log.user_id = :userId', { userId: filters.userId });
      if (filters?.targetUserId) queryBuilder.andWhere('audit_log.target_user_id = :targetUserId', { targetUserId: filters.targetUserId });
      if (filters?.businessId) queryBuilder.andWhere('audit_log.business_id = :businessId', { businessId: filters.businessId });
      if (filters?.startDate) queryBuilder.andWhere('audit_log.created_at >= :startDate', { startDate: filters.startDate });
      if (filters?.endDate) queryBuilder.andWhere('audit_log.created_at <= :endDate', { endDate: filters.endDate });
      
      return queryBuilder
        .orderBy('audit_log.created_at', 'DESC')
        .take(limit)
        .getMany();
    }
    
    // Use simple findAll for non-date filters
    return this.auditLogRepository.findAll(Object.keys(whereFilters).length > 0 ? whereFilters : undefined, limit);
  }

  /**
   * Get audit log statistics (superadmin only)
   */
  async getAuditLogStatistics() {
    return this.auditLogRepository.getStatistics();
  }
}

