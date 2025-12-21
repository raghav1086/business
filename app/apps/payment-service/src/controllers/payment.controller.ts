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
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { PaymentService } from '../services/payment.service';
import {
  CreatePaymentDto,
  PaymentResponseDto,
} from '@business-app/shared/dto';
import { Transaction } from '../entities/transaction.entity';

@ApiTags('Payments')
@Controller('api/v1/payments')
// @UseGuards(JwtAuthGuard) // TODO: Add when shared guard is ready
@ApiBearerAuth()
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Record a payment' })
  @ApiResponse({
    status: 201,
    description: 'Payment recorded successfully',
    type: PaymentResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  async recordPayment(
    @Request() req: any,
    @Body() createDto: CreatePaymentDto
  ): Promise<PaymentResponseDto> {
    const businessId = req.business_id || 'business-1'; // Mock for now
    const userId = req.user?.id || 'user-1'; // Mock for now
    const transaction = await this.paymentService.recordPayment(
      businessId,
      userId,
      createDto
    );
    return this.toResponseDto(transaction);
  }

  @Get()
  @ApiOperation({ summary: 'Get all payments for business' })
  @ApiResponse({
    status: 200,
    description: 'List of payments with pagination',
  })
  async findAll(
    @Request() req: any,
    @Query('partyId') partyId?: string,
    @Query('invoiceId') invoiceId?: string,
    @Query('transactionType') transactionType?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string
  ): Promise<{
    payments: PaymentResponseDto[];
    total: number;
    page: number;
    limit: number;
  }> {
    const businessId = req.business_id || 'business-1'; // Mock for now
    const result = await this.paymentService.findByBusinessId(businessId, {
      partyId,
      invoiceId,
      transactionType,
      startDate,
      endDate,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
    });

    return {
      payments: result.transactions.map((t) => this.toResponseDto(t)),
      total: result.total,
      page: result.page,
      limit: result.limit,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get payment by ID' })
  @ApiResponse({
    status: 200,
    description: 'Payment details',
    type: PaymentResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Payment not found' })
  async findOne(
    @Request() req: any,
    @Param('id') id: string
  ): Promise<PaymentResponseDto> {
    const businessId = req.business_id || 'business-1'; // Mock for now
    const transaction = await this.paymentService.findById(businessId, id);
    return this.toResponseDto(transaction);
  }

  @Get('invoices/:invoiceId')
  @ApiOperation({ summary: 'Get payments for invoice' })
  @ApiResponse({
    status: 200,
    description: 'List of payments for invoice',
    type: [PaymentResponseDto],
  })
  async findByInvoice(
    @Param('invoiceId') invoiceId: string
  ): Promise<PaymentResponseDto[]> {
    const transactions = await this.paymentService.findByInvoiceId(invoiceId);
    return transactions.map((t) => this.toResponseDto(t));
  }

  /**
   * Convert entity to response DTO
   */
  private toResponseDto(transaction: Transaction): PaymentResponseDto {
    return {
      id: transaction.id,
      business_id: transaction.business_id,
      party_id: transaction.party_id,
      invoice_id: transaction.invoice_id,
      transaction_type: transaction.transaction_type,
      transaction_date: transaction.transaction_date,
      amount: transaction.amount,
      payment_mode: transaction.payment_mode || '',
      reference_number: transaction.reference_number,
      bank_name: transaction.bank_name,
      cheque_number: transaction.cheque_number,
      cheque_date: transaction.cheque_date,
      notes: transaction.notes,
      status: transaction.status,
      created_at: transaction.created_at,
      updated_at: transaction.updated_at,
    };
  }
}

