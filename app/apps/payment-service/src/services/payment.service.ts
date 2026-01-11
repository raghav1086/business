import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { TransactionRepository } from '../repositories/transaction.repository';
import { CreatePaymentDto, UpdatePaymentDto } from '@business-app/shared/dto';
import { Transaction } from '../entities/transaction.entity';

/**
 * Payment Service
 * 
 * Business logic layer for Payment management.
 */
@Injectable()
export class PaymentService {
  constructor(
    private readonly transactionRepository: TransactionRepository
  ) {}

  /**
   * Record a payment
   */
  async recordPayment(
    businessId: string,
    userId: string,
    createDto: CreatePaymentDto
  ): Promise<Transaction> {
    // Validate amount
    if (createDto.amount <= 0) {
      throw new BadRequestException('Amount must be greater than 0');
    }

    // Create transaction
    const transactionData = {
      business_id: businessId,
      party_id: createDto.party_id,
      invoice_id: createDto.invoice_id,
      transaction_type: createDto.transaction_type,
      transaction_date: new Date(createDto.transaction_date),
      amount: createDto.amount,
      payment_mode: createDto.payment_mode,
      reference_number: createDto.reference_number,
      bank_name: createDto.bank_name,
      cheque_number: createDto.cheque_number,
      cheque_date: createDto.cheque_date
        ? new Date(createDto.cheque_date)
        : undefined,
      notes: createDto.notes,
      status: 'active',
      created_by: userId,
    };

    const transaction = await this.transactionRepository.create(transactionData);

    // TODO: Update invoice payment_status if invoice_id is provided
    // This will require integration with Invoice Service

    return transaction;
  }

  /**
   * Get payment by ID
   */
  async findById(businessId: string, id: string): Promise<Transaction> {
    const transaction = await this.transactionRepository.findById(id);

    if (!transaction) {
      throw new NotFoundException(`Payment with ID ${id} not found`);
    }

    if (transaction.business_id !== businessId) {
      throw new NotFoundException(`Payment with ID ${id} not found`);
    }

    return transaction;
  }

  /**
   * Get all payments for business
   */
  async findByBusinessId(
    businessId: string,
    filters?: {
      partyId?: string;
      invoiceId?: string;
      transactionType?: string;
      startDate?: string;
      endDate?: string;
      page?: number;
      limit?: number;
    }
  ): Promise<{
    transactions: Transaction[];
    total: number;
    page: number;
    limit: number;
  }> {
    const page = filters?.page || 1;
    const limit = filters?.limit || 20;

    // Handle "new" as invoiceId (frontend sends this when creating new invoice)
    // Filter it out so we don't try to query with invalid UUID
    const processedFilters = {
      ...filters,
      invoiceId: filters?.invoiceId === 'new' ? undefined : filters?.invoiceId,
      startDate: filters?.startDate ? new Date(filters.startDate) : undefined,
      endDate: filters?.endDate ? new Date(filters.endDate) : undefined,
      page,
      limit,
    };

    const result = await this.transactionRepository.findByBusinessId(
      businessId,
      processedFilters
    );

    return {
      transactions: result.transactions,
      total: result.total,
      page,
      limit,
    };
  }

  /**
   * Get payments for invoice
   */
  async findByInvoiceId(invoiceId: string): Promise<Transaction[]> {
    return this.transactionRepository.findByInvoiceId(invoiceId);
  }

  /**
   * Update payment
   */
  async update(
    businessId: string,
    id: string,
    updateDto: UpdatePaymentDto
  ): Promise<Transaction> {
    // Verify payment exists and belongs to business
    const transaction = await this.findById(businessId, id);

    // Prepare update data
    const updateData: any = {};

    if (updateDto.party_id !== undefined) {
      updateData.party_id = updateDto.party_id;
    }
    if (updateDto.invoice_id !== undefined) {
      updateData.invoice_id = updateDto.invoice_id;
    }
    if (updateDto.transaction_type !== undefined) {
      updateData.transaction_type = updateDto.transaction_type;
    }
    if (updateDto.transaction_date !== undefined) {
      updateData.transaction_date = new Date(updateDto.transaction_date);
    }
    if (updateDto.amount !== undefined) {
      if (updateDto.amount <= 0) {
        throw new BadRequestException('Amount must be greater than 0');
      }
      updateData.amount = updateDto.amount;
    }
    if (updateDto.payment_mode !== undefined) {
      updateData.payment_mode = updateDto.payment_mode;
    }
    if (updateDto.reference_number !== undefined) {
      updateData.reference_number = updateDto.reference_number;
    }
    if (updateDto.bank_name !== undefined) {
      updateData.bank_name = updateDto.bank_name;
    }
    if (updateDto.cheque_number !== undefined) {
      updateData.cheque_number = updateDto.cheque_number;
    }
    if (updateDto.cheque_date !== undefined) {
      updateData.cheque_date = updateDto.cheque_date ? new Date(updateDto.cheque_date) : null;
    }
    if (updateDto.notes !== undefined) {
      updateData.notes = updateDto.notes;
    }
    if (updateDto.status !== undefined) {
      updateData.status = updateDto.status;
    }

    // Update transaction
    await this.transactionRepository.update(id, updateData);

    // Reload and return
    return this.findById(businessId, id);
  }

  /**
   * Delete payment (soft delete)
   */
  async delete(businessId: string, id: string): Promise<void> {
    // Verify payment exists
    await this.findById(businessId, id);

    // Soft delete
    await this.transactionRepository.delete(id);
  }

  /**
   * Get all payments across all businesses (for superadmin)
   */
  async findAllForSuperadmin(
    filters?: {
      partyId?: string;
      invoiceId?: string;
      transactionType?: string;
      startDate?: string;
      endDate?: string;
      page?: number;
      limit?: number;
    }
  ): Promise<{
    transactions: Transaction[];
    total: number;
    page: number;
    limit: number;
  }> {
    const page = filters?.page || 1;
    const limit = filters?.limit || 20;

    // Handle "new" as invoiceId (frontend sends this when creating new invoice)
    const processedFilters = {
      ...filters,
      invoiceId: filters?.invoiceId === 'new' ? undefined : filters?.invoiceId,
      startDate: filters?.startDate ? new Date(filters.startDate) : undefined,
      endDate: filters?.endDate ? new Date(filters.endDate) : undefined,
      page,
      limit,
    };

    const result = await this.transactionRepository.findAllForSuperadmin(processedFilters);

    return {
      transactions: result.transactions,
      total: result.total,
      page,
      limit,
    };
  }
}

