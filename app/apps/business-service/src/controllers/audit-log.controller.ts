import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
  Request,
  ForbiddenException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AuthGuard } from '../guards/auth.guard';
import { BusinessContextGuard } from '../guards/business-context.guard';
import { PermissionGuard } from '@business-app/shared/guards';
import { RequirePermission } from '@business-app/shared/decorators';
import { Permission } from '@business-app/shared/constants';
import { AuditService } from '../services/audit.service';
import { AuditLog } from '../entities/audit-log.entity';

@ApiTags('Audit Logs')
@Controller('api/v1')
@UseGuards(AuthGuard)
@ApiBearerAuth()
export class AuditLogController {
  constructor(private readonly auditService: AuditService) {}

  /**
   * Get audit logs for a business
   */
  @Get('businesses/:businessId/audit-logs')
  @UseGuards(BusinessContextGuard, PermissionGuard)
  @RequirePermission(Permission.REPORT_VIEW)
  @ApiOperation({ summary: 'Get audit logs for a business' })
  @ApiQuery({ name: 'action', required: false, description: 'Filter by action type' })
  @ApiQuery({ name: 'userId', required: false, description: 'Filter by user ID who performed action' })
  @ApiQuery({ name: 'targetUserId', required: false, description: 'Filter by target user ID' })
  @ApiQuery({ name: 'startDate', required: false, description: 'Start date (ISO format)' })
  @ApiQuery({ name: 'endDate', required: false, description: 'End date (ISO format)' })
  @ApiQuery({ name: 'limit', required: false, description: 'Number of records to return', type: Number })
  @ApiResponse({ status: 200, description: 'List of audit logs', type: [AuditLog] })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  async getBusinessAuditLogs(
    @Param('businessId') businessId: string,
    @Request() req: any,
    @Query('action') action?: string,
    @Query('userId') userId?: string,
    @Query('targetUserId') targetUserId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('limit') limit?: string
  ) {
    // Check if user has access to this business (handled by BusinessContextGuard)
    const logs = await this.auditService.getBusinessAuditLogs(
      businessId,
      limit ? parseInt(limit, 10) : 100
    );

    // Apply filters
    let filteredLogs = logs;

    if (action) {
      filteredLogs = filteredLogs.filter(log => log.action === action);
    }

    if (userId) {
      filteredLogs = filteredLogs.filter(log => log.user_id === userId);
    }

    if (targetUserId) {
      filteredLogs = filteredLogs.filter(log => log.target_user_id === targetUserId);
    }

    if (startDate) {
      const start = new Date(startDate);
      filteredLogs = filteredLogs.filter(log => log.created_at >= start);
    }

    if (endDate) {
      const end = new Date(endDate);
      filteredLogs = filteredLogs.filter(log => log.created_at <= end);
    }

    return {
      businessId,
      total: filteredLogs.length,
      logs: filteredLogs,
    };
  }

  /**
   * Get audit logs for a specific user
   */
  @Get('users/:userId/audit-logs')
  @UseGuards(PermissionGuard)
  @RequirePermission(Permission.REPORT_VIEW)
  @ApiOperation({ summary: 'Get audit logs for a user' })
  @ApiQuery({ name: 'businessId', required: false, description: 'Filter by business ID' })
  @ApiQuery({ name: 'action', required: false, description: 'Filter by action type' })
  @ApiQuery({ name: 'startDate', required: false, description: 'Start date (ISO format)' })
  @ApiQuery({ name: 'endDate', required: false, description: 'End date (ISO format)' })
  @ApiQuery({ name: 'limit', required: false, description: 'Number of records to return', type: Number })
  @ApiResponse({ status: 200, description: 'List of audit logs', type: [AuditLog] })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  async getUserAuditLogs(
    @Param('userId') userId: string,
    @Request() req: any,
    @Query('businessId') businessId?: string,
    @Query('action') action?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('limit') limit?: string
  ) {
    // Users can only view their own audit logs unless they're superadmin
    const requestingUserId = req.user?.id;
    const isSuperadmin = req.user?.is_superadmin;

    if (!isSuperadmin && requestingUserId !== userId) {
      throw new ForbiddenException('You can only view your own audit logs');
    }

    const logs = await this.auditService.getUserAuditLogs(
      userId,
      limit ? parseInt(limit, 10) : 100
    );

    // Apply filters
    let filteredLogs = logs;

    if (businessId) {
      filteredLogs = filteredLogs.filter(log => log.business_id === businessId);
    }

    if (action) {
      filteredLogs = filteredLogs.filter(log => log.action === action);
    }

    if (startDate) {
      const start = new Date(startDate);
      filteredLogs = filteredLogs.filter(log => log.created_at >= start);
    }

    if (endDate) {
      const end = new Date(endDate);
      filteredLogs = filteredLogs.filter(log => log.created_at <= end);
    }

    return {
      userId,
      total: filteredLogs.length,
      logs: filteredLogs,
    };
  }
}

