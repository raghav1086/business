import {
  Controller,
  Post,
  Get,
  Patch,
  Param,
  Body,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { AuthGuard } from '../guards/auth.guard';
import { CrossServiceBusinessContextGuard } from '@business-app/shared/guards';
import { EWayBillService } from '../services/ewaybill.service';
import { GenerateEWayBillRequestDto, GenerateEWayBillResponseDto } from '../dto/gsp.dto';

@ApiTags('E-Way Bill')
@Controller('api/v1/gst/ewaybill')
@UseGuards(AuthGuard, CrossServiceBusinessContextGuard)
@ApiBearerAuth()
export class EWayBillController {
  constructor(private readonly ewayBillService: EWayBillService) {}

  @Post('generate/:invoiceId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Generate E-Way Bill for an invoice' })
  @ApiParam({
    name: 'invoiceId',
    description: 'Invoice ID',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'E-Way Bill generated successfully',
    type: GenerateEWayBillResponseDto,
  })
  @ApiResponse({ status: 400, description: 'E-Way Bill not enabled or validation failed' })
  @ApiResponse({ status: 404, description: 'Invoice not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async generateEWayBill(
    @Request() req: any,
    @Param('invoiceId') invoiceId: string
  ): Promise<GenerateEWayBillResponseDto> {
    const businessId =
      req.businessContext?.businessId ||
      req.headers['x-business-id'] ||
      req.business_id;

    if (!businessId) {
      throw new BadRequestException('Business ID is required');
    }

    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new BadRequestException('Authorization token is required');
    }
    const token = authHeader.substring(7);

    const response = await this.ewayBillService.generateEWayBill(
      businessId,
      invoiceId,
      token
    );

    if (!response.success) {
      throw new BadRequestException(response.error || 'E-Way Bill generation failed');
    }

    return {
      ewayBillNo: response.ewayBillNo,
      ewayBillDate: response.ewayBillDate,
      validUpto: response.validUpto,
    };
  }

  @Get('status/:invoiceId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get E-Way Bill status for an invoice' })
  @ApiParam({
    name: 'invoiceId',
    description: 'Invoice ID',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'E-Way Bill status retrieved successfully',
  })
  async getEWayBillStatus(
    @Request() req: any,
    @Param('invoiceId') invoiceId: string
  ): Promise<{ ewayBillNo?: string; status: string; validUpto?: string; error?: string }> {
    const businessId =
      req.businessContext?.businessId ||
      req.headers['x-business-id'] ||
      req.business_id;

    if (!businessId) {
      throw new BadRequestException('Business ID is required');
    }

    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new BadRequestException('Authorization token is required');
    }
    const token = authHeader.substring(7);

    return this.ewayBillService.getEWayBillStatus(businessId, invoiceId, token);
  }

  @Post('cancel/:invoiceId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancel E-Way Bill for an invoice' })
  @ApiParam({
    name: 'invoiceId',
    description: 'Invoice ID',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'E-Way Bill cancelled successfully',
  })
  @ApiResponse({ status: 400, description: 'Invalid request or cancellation failed' })
  @ApiResponse({ status: 404, description: 'E-Way Bill not found' })
  async cancelEWayBill(
    @Request() req: any,
    @Param('invoiceId') invoiceId: string,
    @Body() body: { reason: string }
  ): Promise<{ success: boolean; message: string }> {
    const businessId =
      req.businessContext?.businessId ||
      req.headers['x-business-id'] ||
      req.business_id;

    if (!businessId) {
      throw new BadRequestException('Business ID is required');
    }

    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new BadRequestException('Authorization token is required');
    }
    const token = authHeader.substring(7);

    return this.ewayBillService.cancelEWayBill(
      businessId,
      invoiceId,
      body.reason || 'Cancelled by user',
      token
    );
  }

  @Patch('update/:invoiceId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update E-Way Bill transport details' })
  @ApiParam({
    name: 'invoiceId',
    description: 'Invoice ID',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'E-Way Bill updated successfully',
    type: GenerateEWayBillResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid request or update failed' })
  @ApiResponse({ status: 404, description: 'E-Way Bill not found' })
  async updateEWayBill(
    @Request() req: any,
    @Param('invoiceId') invoiceId: string,
    @Body() updateData: {
      transporterId?: string;
      transporterName?: string;
      vehicleNo?: string;
      vehicleType?: string;
      transDistance?: number;
      transMode?: string;
    }
  ): Promise<GenerateEWayBillResponseDto> {
    const businessId =
      req.businessContext?.businessId ||
      req.headers['x-business-id'] ||
      req.business_id;

    if (!businessId) {
      throw new BadRequestException('Business ID is required');
    }

    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new BadRequestException('Authorization token is required');
    }
    const token = authHeader.substring(7);

    const response = await this.ewayBillService.updateEWayBill(
      businessId,
      invoiceId,
      updateData,
      token
    );

    if (!response.success) {
      throw new BadRequestException(response.error || 'E-Way Bill update failed');
    }

    return {
      ewayBillNo: response.ewayBillNo,
      ewayBillDate: response.ewayBillDate,
      validUpto: response.validUpto,
    };
  }
}

