import {
  Controller,
  Get,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  BadRequestException,
  Res,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { Response } from 'express';
import { AuthGuard } from '../guards/auth.guard';
import { CrossServiceBusinessContextGuard } from '@business-app/shared/guards';
import { Gstr1Service } from '../services/gstr1.service';
import { ExcelExportService } from '../services/excel-export.service';
import { Gstr1RequestDto, Gstr1ResponseDto } from '../dto/gstr1.dto';

@ApiTags('GST Reports')
@Controller('api/v1/gst')
@UseGuards(AuthGuard, CrossServiceBusinessContextGuard)
@ApiBearerAuth()
export class Gstr1Controller {
  constructor(
    private readonly gstr1Service: Gstr1Service,
    private readonly excelExportService: ExcelExportService
  ) {}

  @Get('gstr1')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Generate GSTR-1 report' })
  @ApiQuery({
    name: 'period',
    required: true,
    description: 'Period in MMYYYY format (e.g., 122024) or Q1-YYYY format (e.g., Q1-2024)',
    example: '122024',
  })
  @ApiQuery({
    name: 'format',
    required: false,
    enum: ['json', 'excel'],
    description: 'Response format',
    example: 'json',
  })
  @ApiResponse({
    status: 200,
    description: 'GSTR-1 report generated successfully',
    type: Gstr1ResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid period format or missing business GSTIN' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async generateGstr1(
    @Request() req: any,
    @Query() query: Gstr1RequestDto,
    @Res() res?: Response
  ): Promise<Gstr1ResponseDto | void> {
    // Extract business ID from context
    const businessId =
      req.businessContext?.businessId ||
      req.headers['x-business-id'] ||
      req.business_id;

    if (!businessId) {
      throw new BadRequestException('Business ID is required');
    }

    // Extract token from authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new BadRequestException('Authorization token is required');
    }
    const token = authHeader.substring(7);

    // Generate report
    const report = await this.gstr1Service.generateGstr1(
      businessId,
      query.period,
      token
    );

    // Handle Excel export format
    if (query.format === 'excel' && res) {
      const excelBuffer = await this.excelExportService.exportGstr1ToExcel(report);
      const filename = `GSTR1_${report.return_period}_${Date.now()}.xlsx`;
      
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(excelBuffer);
      return;
    }

    return report;
  }
}

