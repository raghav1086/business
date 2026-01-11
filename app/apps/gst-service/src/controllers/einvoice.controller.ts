import {
  Controller,
  Post,
  Get,
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
import { EInvoiceService } from '../services/einvoice.service';
import { GenerateIRNRequestDto, GenerateIRNResponseDto, CancelIRNRequestDto } from '../dto/gsp.dto';

@ApiTags('E-Invoice')
@Controller('api/v1/gst/einvoice')
@UseGuards(AuthGuard, CrossServiceBusinessContextGuard)
@ApiBearerAuth()
export class EInvoiceController {
  constructor(private readonly einvoiceService: EInvoiceService) {}

  @Post('generate/:invoiceId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Generate E-Invoice IRN for an invoice' })
  @ApiParam({
    name: 'invoiceId',
    description: 'Invoice ID',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'IRN generated successfully',
    type: GenerateIRNResponseDto,
  })
  @ApiResponse({ status: 400, description: 'E-Invoice not enabled or validation failed' })
  @ApiResponse({ status: 404, description: 'Invoice not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async generateIRN(
    @Request() req: any,
    @Param('invoiceId') invoiceId: string
  ): Promise<GenerateIRNResponseDto> {
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

    const response = await this.einvoiceService.generateIRN(
      businessId,
      invoiceId,
      token
    );

    if (!response.success) {
      throw new BadRequestException(response.error || 'IRN generation failed');
    }

    return {
      irn: response.irn,
      ackNo: response.ackNo,
      ackDate: response.ackDate,
      qrCode: response.qrCode,
      ewayBillNo: response.ewayBillNo,
    };
  }

  @Get('status/:invoiceId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get IRN status for an invoice' })
  @ApiParam({
    name: 'invoiceId',
    description: 'Invoice ID',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'IRN status retrieved successfully',
  })
  async getIRNStatus(
    @Request() req: any,
    @Param('invoiceId') invoiceId: string
  ): Promise<{ irn?: string; status: string; qrCode?: string; error?: string }> {
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

    return this.einvoiceService.getIRNStatus(businessId, invoiceId, token);
  }

  @Post('cancel/:invoiceId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancel IRN for an invoice' })
  @ApiParam({
    name: 'invoiceId',
    description: 'Invoice ID',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'IRN cancelled successfully',
  })
  @ApiResponse({ status: 400, description: 'Invalid request or cancellation failed' })
  @ApiResponse({ status: 404, description: 'IRN not found' })
  async cancelIRN(
    @Request() req: any,
    @Param('invoiceId') invoiceId: string,
    @Body() cancelDto: CancelIRNRequestDto
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

    return this.einvoiceService.cancelIRN(
      businessId,
      invoiceId,
      cancelDto.reason,
      token
    );
  }
}

