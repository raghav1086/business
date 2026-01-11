import {
  Controller,
  Get,
  Query,
  UseGuards,
  Request,
  Res,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Response } from 'express';
import { AuthGuard } from '../guards/auth.guard';
import { CrossServiceBusinessContextGuard } from '@business-app/shared/guards';
import { Gstr4Service } from '../services/gstr4.service';
import { ExcelExportService } from '../services/excel-export.service';
import { Gstr4RequestDto, Gstr4ResponseDto } from '../dto/gstr4.dto';

/**
 * GSTR-4 Controller
 * 
 * Handles GSTR-4 (Composition Scheme) report generation.
 */
@ApiTags('GSTR-4')
@Controller('api/v1/gst/gstr4')
@UseGuards(AuthGuard, CrossServiceBusinessContextGuard)
@ApiBearerAuth()
export class Gstr4Controller {
  constructor(
    private readonly gstr4Service: Gstr4Service,
    private readonly excelExportService: ExcelExportService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Generate GSTR-4 report' })
  @ApiResponse({
    status: 200,
    description: 'GSTR-4 report generated successfully',
    type: Gstr4ResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid period or business not under composition scheme' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async generateGstr4(
    @Request() req: any,
    @Query() query: Gstr4RequestDto,
    @Res() res: Response,
  ): Promise<void> {
    const businessId = req.business?.id || req.user?.business_id;
    if (!businessId) {
      throw new BadRequestException('Business ID is required');
    }

    const token = req.headers.authorization?.replace('Bearer ', '') || '';

    const { period, format = 'json' } = query;

    if (!period) {
      throw new BadRequestException('Period is required (Q1-YYYY format)');
    }

    const report = await this.gstr4Service.generateGstr4(
      businessId,
      period,
      token
    );

    if (format === 'excel') {
      const excelBuffer = await this.excelExportService.exportGstr4ToExcel(report);
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=gstr4-${period}.xlsx`);
      res.send(excelBuffer);
    } else {
      res.json(report);
    }
  }
}

