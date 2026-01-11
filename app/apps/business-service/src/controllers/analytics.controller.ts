import {
  Controller,
  Get,
  UseGuards,
  Request,
  ForbiddenException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AnalyticsService } from '../services/analytics.service';
import { AuthGuard } from '../guards/auth.guard';

@ApiTags('Analytics')
@Controller('api/v1/admin/analytics')
@UseGuards(AuthGuard)
@ApiBearerAuth()
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  /**
   * Get overview analytics
   */
  @Get('overview')
  @ApiOperation({ summary: 'Get overview analytics (superadmin only)' })
  @ApiResponse({
    status: 200,
    description: 'Overview analytics',
  })
  @ApiResponse({ status: 403, description: 'Forbidden - Superadmin access required' })
  async getOverview(@Request() req: any) {
    if (!req.user?.is_superadmin) {
      throw new ForbiddenException('Superadmin access required');
    }
    const authToken = req.headers.authorization?.replace('Bearer ', '');
    return this.analyticsService.getOverviewAnalytics(authToken);
  }

  /**
   * Get user analytics
   */
  @Get('users')
  @ApiOperation({ summary: 'Get user analytics (superadmin only)' })
  @ApiResponse({
    status: 200,
    description: 'User analytics',
  })
  @ApiResponse({ status: 403, description: 'Forbidden - Superadmin access required' })
  async getUserAnalytics(@Request() req: any) {
    if (!req.user?.is_superadmin) {
      throw new ForbiddenException('Superadmin access required');
    }
    const authToken = req.headers.authorization?.replace('Bearer ', '');
    return this.analyticsService.getUserAnalytics(authToken);
  }

  /**
   * Get business analytics
   */
  @Get('businesses')
  @ApiOperation({ summary: 'Get business analytics (superadmin only)' })
  @ApiResponse({
    status: 200,
    description: 'Business analytics',
  })
  @ApiResponse({ status: 403, description: 'Forbidden - Superadmin access required' })
  async getBusinessAnalytics(@Request() req: any) {
    if (!req.user?.is_superadmin) {
      throw new ForbiddenException('Superadmin access required');
    }
    return this.analyticsService.getBusinessAnalytics();
  }

  /**
   * Get market analytics
   */
  @Get('market')
  @ApiOperation({ summary: 'Get market analytics (superadmin only)' })
  @ApiResponse({
    status: 200,
    description: 'Market analytics',
  })
  @ApiResponse({ status: 403, description: 'Forbidden - Superadmin access required' })
  async getMarketAnalytics(@Request() req: any) {
    if (!req.user?.is_superadmin) {
      throw new ForbiddenException('Superadmin access required');
    }
    const authToken = req.headers.authorization?.replace('Bearer ', '');
    return this.analyticsService.getMarketAnalytics(authToken);
  }
}

