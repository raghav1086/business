import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthGuard } from '../guards/auth.guard';
import { InvoiceService } from '../services/invoice.service';
import {
  CreateInvoiceDto,
  InvoiceResponseDto,
} from '@business-app/shared/dto';
import { Invoice } from '../entities/invoice.entity';
import { validateOptionalUUID } from '@business-app/shared/utils';

@ApiTags('Invoices')
@Controller('api/v1/invoices')
@UseGuards(AuthGuard)
@ApiBearerAuth()
export class InvoiceController {
  constructor(private readonly invoiceService: InvoiceService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new invoice' })
  @ApiResponse({
    status: 201,
    description: 'Invoice created successfully',
    type: InvoiceResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 404, description: 'Party not found' })
  async create(
    @Request() req: any,
    @Body() createDto: CreateInvoiceDto
  ): Promise<InvoiceResponseDto> {
    const businessId = req.headers['x-business-id'] || req.business_id;
    if (!businessId) {
      throw new BadRequestException('Business ID is required');
    }
    const userId = req.user?.id;
    if (!userId) {
      throw new BadRequestException('User ID is required');
    }
    const invoice = await this.invoiceService.create(
      businessId,
      userId,
      createDto
    );
    return this.toResponseDto(invoice);
  }

  @Get('new')
  @ApiOperation({ summary: 'Get default data for new invoice form' })
  @ApiResponse({
    status: 200,
    description: 'Default invoice data',
  })
  async getNewInvoiceData(): Promise<{
    defaultInvoiceType: string;
    defaultStatus: string;
    defaultPaymentStatus: string;
  }> {
    return {
      defaultInvoiceType: 'sale',
      defaultStatus: 'draft',
      defaultPaymentStatus: 'unpaid',
    };
  }

  @Get()
  @ApiOperation({ summary: 'Get all invoices for business' })
  @ApiResponse({
    status: 200,
    description: 'List of invoices with pagination',
  })
  async findAll(
    @Request() req: any,
    @Query('partyId') partyId?: string,
    @Query('invoiceType') invoiceType?: string,
    @Query('paymentStatus') paymentStatus?: string,
    @Query('status') status?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string
  ): Promise<{
    invoices: InvoiceResponseDto[];
    total: number;
    page: number;
    limit: number;
  }> {
    // Validate UUID query parameters
    if (partyId) {
      validateOptionalUUID(partyId, 'partyId');
    }

    const businessId = req.headers['x-business-id'] || req.business_id;
    if (!businessId) {
      throw new BadRequestException('Business ID is required');
    }
    const result = await this.invoiceService.findByBusinessId(businessId, {
      partyId,
      invoiceType,
      paymentStatus,
      status,
      startDate,
      endDate,
      search,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
    });

    return {
      invoices: result.invoices.map((i) => this.toResponseDto(i)),
      total: result.total,
      page: result.page,
      limit: result.limit,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get invoice by ID' })
  @ApiResponse({
    status: 200,
    description: 'Invoice details',
    type: InvoiceResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid UUID format' })
  @ApiResponse({ status: 404, description: 'Invoice not found' })
  async findOne(
    @Request() req: any,
    @Param('id') id: string
  ): Promise<InvoiceResponseDto> {
    // Validate UUID format
    validateOptionalUUID(id, 'id');

    const businessId = req.headers['x-business-id'] || req.business_id;
    if (!businessId) {
      throw new BadRequestException('Business ID is required');
    }
    const invoice = await this.invoiceService.findById(businessId, id);
    return this.toResponseDto(invoice);
  }

  /**
   * Convert entity to response DTO
   */
  private toResponseDto(invoice: Invoice): InvoiceResponseDto {
    return {
      id: invoice.id,
      business_id: invoice.business_id,
      party_id: invoice.party_id,
      invoice_number: invoice.invoice_number,
      invoice_type: invoice.invoice_type,
      invoice_date: invoice.invoice_date,
      due_date: invoice.due_date,
      place_of_supply: invoice.place_of_supply,
      is_interstate: invoice.is_interstate,
      subtotal: invoice.subtotal,
      discount_amount: invoice.discount_amount,
      taxable_amount: invoice.taxable_amount,
      cgst_amount: invoice.cgst_amount,
      sgst_amount: invoice.sgst_amount,
      igst_amount: invoice.igst_amount,
      cess_amount: invoice.cess_amount,
      total_amount: invoice.total_amount,
      payment_status: invoice.payment_status,
      status: invoice.status,
      items: (invoice.items || []).map((item) => ({
        id: item.id,
        item_id: item.item_id,
        item_name: item.item_name,
        quantity: item.quantity,
        unit_price: item.unit_price,
        discount_percent: item.discount_percent,
        discount_amount: item.discount_amount,
        tax_rate: item.tax_rate,
        cgst_rate: item.cgst_rate,
        sgst_rate: item.sgst_rate,
        igst_rate: item.igst_rate,
        taxable_amount: item.taxable_amount,
        cgst_amount: item.cgst_amount,
        sgst_amount: item.sgst_amount,
        igst_amount: item.igst_amount,
        total_amount: item.total_amount,
      })),
      created_at: invoice.created_at,
      updated_at: invoice.updated_at,
    };
  }
}

