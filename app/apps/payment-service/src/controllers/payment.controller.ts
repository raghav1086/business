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
import { CrossServiceBusinessContextGuard, PermissionGuard } from '@business-app/shared/guards';
import { RequirePermission } from '@business-app/shared/decorators';
import { Permission } from '@business-app/shared/constants';
import { PaymentService } from '../services/payment.service';
import {
  CreatePaymentDto,
  PaymentResponseDto,
} from '@business-app/shared/dto';
import { Transaction } from '../entities/transaction.entity';
import { validateOptionalUUID } from '@business-app/shared/utils';

@ApiTags('Payments')
@Controller('api/v1/payments')
@UseGuards(AuthGuard, CrossServiceBusinessContextGuard)
@ApiBearerAuth()
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(PermissionGuard)
  @RequirePermission(Permission.PAYMENT_CREATE)
  @ApiOperation({ summary: 'Record a payment' })
  @ApiResponse({
    status: 201,
    description: 'Payment recorded successfully',
    type: PaymentResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  async recordPayment(
    @Request() req: any,
    @Body() createDto: CreatePaymentDto
  ): Promise<PaymentResponseDto> {
    // Business ID is validated by CrossServiceBusinessContextGuard
    const businessId = req.businessContext?.businessId || req.headers['x-business-id'] || req.business_id;
    if (!businessId) {
      throw new BadRequestException('Business ID is required');
    }
    const userId = req.user?.id;
    if (!userId) {
      throw new BadRequestException('User ID is required');
    }
    const transaction = await this.paymentService.recordPayment(
      businessId,
      userId,
      createDto
    );
    return this.toResponseDto(transaction);
  }

  @Get()
  @UseGuards(PermissionGuard)
  @RequirePermission(Permission.PAYMENT_READ)
  @ApiOperation({ summary: 'Get all payments for business' })
  @ApiResponse({
    status: 200,
    description: 'List of payments with pagination',
  })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
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
    // Validate UUID query parameters (skip "new" for invoiceId as it's handled in service)
    if (partyId && partyId !== 'new') {
      validateOptionalUUID(partyId, 'partyId');
    }
    // invoiceId="new" is handled in service, so we don't validate it here

    // Business ID is validated by CrossServiceBusinessContextGuard
    const businessId = req.businessContext?.businessId || req.headers['x-business-id'] || req.business_id;
    if (!businessId) {
      throw new BadRequestException('Business ID is required');
    }
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
  @UseGuards(PermissionGuard)
  @RequirePermission(Permission.PAYMENT_READ)
  @ApiOperation({ summary: 'Get payment by ID' })
  @ApiResponse({
    status: 200,
    description: 'Payment details',
    type: PaymentResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid UUID format' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Payment not found' })
  async findOne(
    @Request() req: any,
    @Param('id') id: string
  ): Promise<PaymentResponseDto> {
    // Validate UUID format
    validateOptionalUUID(id, 'id');

    // Business ID is validated by CrossServiceBusinessContextGuard
    const businessId = req.businessContext?.businessId || req.headers['x-business-id'] || req.business_id;
    if (!businessId) {
      throw new BadRequestException('Business ID is required');
    }
    const transaction = await this.paymentService.findById(businessId, id);
    return this.toResponseDto(transaction);
  }

  @Get('invoices/:invoiceId')
  @UseGuards(PermissionGuard)
  @RequirePermission(Permission.PAYMENT_READ)
  @ApiOperation({ summary: 'Get payments for invoice' })
  @ApiResponse({
    status: 200,
    description: 'List of payments for invoice',
    type: [PaymentResponseDto],
  })
  @ApiResponse({ status: 400, description: 'Invalid UUID format' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  async findByInvoice(
    @Param('invoiceId') invoiceId: string
  ): Promise<PaymentResponseDto[]> {
    // Validate UUID format
    validateOptionalUUID(invoiceId, 'invoiceId');
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

