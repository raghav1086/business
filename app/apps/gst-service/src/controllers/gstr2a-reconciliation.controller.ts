import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  Param,
  UseGuards,
  Request,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '../guards/auth.guard';
import { CrossServiceBusinessContextGuard } from '@business-app/shared/guards';
import { Gstr2aReconciliationService } from '../services/gstr2a-reconciliation.service';
import { Gstr2aImportRequestDto, Gstr2aReconciliationResponseDto, ManualMatchRequestDto } from '../dto/gstr2a-reconciliation.dto';

/**
 * GSTR-2A Reconciliation Controller
 * 
 * Handles GSTR-2A/2B import and reconciliation.
 */
@ApiTags('GSTR-2A Reconciliation')
@Controller('api/v1/gst/gstr2a')
@UseGuards(AuthGuard, CrossServiceBusinessContextGuard)
@ApiBearerAuth()
export class Gstr2aReconciliationController {
  constructor(
    private readonly reconciliationService: Gstr2aReconciliationService,
  ) {}

  @Post('import')
  @ApiOperation({ summary: 'Import GSTR-2A/2B data' })
  @ApiResponse({
    status: 201,
    description: 'GSTR-2A/2B data imported successfully',
  })
  @ApiResponse({ status: 400, description: 'Invalid data format' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async importGstr2a(
    @Request() req: any,
    @Body() importDto: Gstr2aImportRequestDto,
  ) {
    const businessId = req.business?.id || req.user?.business_id;
    if (!businessId) {
      throw new BadRequestException('Business ID is required');
    }

    const userId = req.user?.id || req.user?.user_id || '';
    const token = req.headers.authorization?.replace('Bearer ', '') || '';

    return this.reconciliationService.importGstr2a(
      businessId,
      importDto,
      userId,
      token
    );
  }

  @Get('reconciliation')
  @ApiOperation({ summary: 'Get reconciliation report' })
  @ApiResponse({
    status: 200,
    description: 'Reconciliation report generated successfully',
    type: Gstr2aReconciliationResponseDto,
  })
  @ApiResponse({ status: 404, description: 'No import found for period' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getReconciliation(
    @Request() req: any,
    @Query('period') period: string,
  ) {
    const businessId = req.business?.id || req.user?.business_id;
    if (!businessId) {
      throw new BadRequestException('Business ID is required');
    }

    if (!period) {
      throw new BadRequestException('Period is required');
    }

    const token = req.headers.authorization?.replace('Bearer ', '') || '';

    return this.reconciliationService.getReconciliation(
      businessId,
      period,
      token
    );
  }

  @Post('manual-match')
  @ApiOperation({ summary: 'Manually match an invoice' })
  @ApiResponse({
    status: 200,
    description: 'Invoice matched successfully',
  })
  @ApiResponse({ status: 404, description: 'Reconciliation or invoice not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async manualMatch(
    @Request() req: any,
    @Body() matchDto: ManualMatchRequestDto,
  ) {
    const businessId = req.business?.id || req.user?.business_id;
    if (!businessId) {
      throw new BadRequestException('Business ID is required');
    }

    const token = req.headers.authorization?.replace('Bearer ', '') || '';

    return this.reconciliationService.manualMatch(
      businessId,
      matchDto,
      token
    );
  }
}

