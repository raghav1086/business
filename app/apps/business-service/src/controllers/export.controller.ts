import {
  Controller,
  Get,
  UseGuards,
  Request,
  Query,
  ForbiddenException,
  Res,
  Header,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { Response } from 'express';
import { ExportService } from '../services/export.service';
import { AuthGuard } from '../guards/auth.guard';

@ApiTags('Export')
@Controller('api/v1/admin/export')
@UseGuards(AuthGuard)
@ApiBearerAuth()
export class ExportController {
  constructor(private readonly exportService: ExportService) {}

  /**
   * Export businesses with owners
   */
  @Get('businesses')
  @ApiOperation({ summary: 'Export businesses with owner details (superadmin only)' })
  @ApiQuery({ name: 'format', required: false, enum: ['csv', 'json'], description: 'Export format' })
  @ApiQuery({ name: 'startDate', required: false, description: 'Start date (ISO string)' })
  @ApiQuery({ name: 'endDate', required: false, description: 'End date (ISO string)' })
  @ApiResponse({
    status: 200,
    description: 'Businesses exported successfully',
  })
  @ApiResponse({ status: 403, description: 'Forbidden - Superadmin access required' })
  async exportBusinesses(
    @Request() req: any,
    @Res() res: Response,
    @Query('format') format: string = 'csv',
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string
  ) {
    if (!req.user?.is_superadmin) {
      throw new ForbiddenException('Superadmin access required');
    }

    const authToken = req.headers.authorization?.replace('Bearer ', '');
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;

    if (format === 'json') {
      const data = await this.exportService.exportToJSON('businesses', authToken, start, end);
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="businesses-${new Date().toISOString().split('T')[0]}.json"`);
      return res.json(data);
    }

    // Default to CSV
    const csv = await this.exportService.exportBusinessesWithOwners(authToken, start, end);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="businesses-${new Date().toISOString().split('T')[0]}.csv"`);
    return res.send(csv);
  }

  /**
   * Export users with businesses
   */
  @Get('users')
  @ApiOperation({ summary: 'Export users with business details (superadmin only)' })
  @ApiQuery({ name: 'format', required: false, enum: ['csv', 'json'], description: 'Export format' })
  @ApiQuery({ name: 'startDate', required: false, description: 'Start date (ISO string)' })
  @ApiQuery({ name: 'endDate', required: false, description: 'End date (ISO string)' })
  @ApiResponse({
    status: 200,
    description: 'Users exported successfully',
  })
  @ApiResponse({ status: 403, description: 'Forbidden - Superadmin access required' })
  async exportUsers(
    @Request() req: any,
    @Res() res: Response,
    @Query('format') format: string = 'csv',
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string
  ) {
    if (!req.user?.is_superadmin) {
      throw new ForbiddenException('Superadmin access required');
    }

    const authToken = req.headers.authorization?.replace('Bearer ', '');
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;

    if (format === 'json') {
      const data = await this.exportService.exportToJSON('users', authToken, start, end);
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="users-${new Date().toISOString().split('T')[0]}.json"`);
      return res.json(data);
    }

    // Default to CSV
    const csv = await this.exportService.exportUsersWithBusinesses(authToken, start, end);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="users-${new Date().toISOString().split('T')[0]}.csv"`);
    return res.send(csv);
  }

  /**
   * Export analytics report
   */
  @Get('analytics')
  @ApiOperation({ summary: 'Export analytics report (superadmin only)' })
  @ApiQuery({ name: 'format', required: false, enum: ['csv', 'json'], description: 'Export format' })
  @ApiQuery({ name: 'dateRange', required: false, description: 'Date range in days (e.g., 30d)' })
  @ApiResponse({
    status: 200,
    description: 'Analytics exported successfully',
  })
  @ApiResponse({ status: 403, description: 'Forbidden - Superadmin access required' })
  async exportAnalytics(
    @Request() req: any,
    @Res() res: Response,
    @Query('format') format: string = 'csv',
    @Query('dateRange') dateRange?: string
  ) {
    if (!req.user?.is_superadmin) {
      throw new ForbiddenException('Superadmin access required');
    }

    const authToken = req.headers.authorization?.replace('Bearer ', '');
    
    // Parse date range (e.g., "30d" = last 30 days)
    let start: Date | undefined;
    let end: Date | undefined;
    if (dateRange) {
      const days = parseInt(dateRange.replace('d', ''), 10);
      if (!isNaN(days)) {
        end = new Date();
        start = new Date(end.getTime() - days * 24 * 60 * 60 * 1000);
      }
    }

    if (format === 'json') {
      const data = await this.exportService.exportToJSON('analytics', authToken, start, end);
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="analytics-${new Date().toISOString().split('T')[0]}.json"`);
      return res.json(data);
    }

    // Default to CSV
    const csv = await this.exportService.exportAnalyticsReport(authToken, start && end ? { start, end } : undefined);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="analytics-${new Date().toISOString().split('T')[0]}.csv"`);
    return res.send(csv);
  }
}

