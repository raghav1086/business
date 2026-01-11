import {
  Controller,
  Get,
  Query,
  UseGuards,
  Request,
  Res,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { AuthGuard } from '../guards/auth.guard';
import { CrossServiceBusinessContextGuard } from '@business-app/shared/guards';
import { Gstr3bService } from '../services/gstr3b.service';
import { ExcelExportService } from '../services/excel-export.service';
import { Gstr3bRequestDto, Gstr3bResponseDto } from '../dto/gstr3b.dto';
import { Response } from 'express';

@ApiTags('GST Reports')
@Controller('api/v1/gst')
@UseGuards(AuthGuard, CrossServiceBusinessContextGuard)
@ApiBearerAuth()
export class Gstr3bController {
  constructor(
    private readonly gstr3bService: Gstr3bService,
    private readonly excelExportService: ExcelExportService
  ) {}

  @Get('gstr3b')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Generate GSTR-3B report' })
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
    description: 'GSTR-3B report generated successfully',
    type: Gstr3bResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid period format or missing business GSTIN' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async generateGstr3b(
    @Request() req: any,
    @Query() query: Gstr3bRequestDto,
    @Res() res?: Response
  ): Promise<Gstr3bResponseDto | void> {
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
    const report = await this.gstr3bService.generateGstr3b(
      businessId,
      query.period,
      token
    );

    // Handle Excel export format
    if (query.format === 'excel' && res) {
      const excelBuffer = await this.excelExportService.exportGstr3bToExcel(report);
      const filename = `GSTR3B_${report.return_period}_${Date.now()}.xlsx`;
      
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(excelBuffer);
      return;
    }

    return report;
  }
}

