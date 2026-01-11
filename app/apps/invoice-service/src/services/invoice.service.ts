import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InvoiceRepository } from '../repositories/invoice.repository';
import { InvoiceItemRepository } from '../repositories/invoice-item.repository';
import { GstCalculationService } from './gst-calculation.service';
import { CreateInvoiceDto, UpdateInvoiceDto } from '@business-app/shared/dto';
import { Invoice } from '../entities/invoice.entity';
import { InvoiceItem } from '../entities/invoice-item.entity';

/**
 * Invoice Service
 * 
 * Business logic layer for Invoice management.
 */
@Injectable()
export class InvoiceService {
  constructor(
    private readonly invoiceRepository: InvoiceRepository,
    private readonly invoiceItemRepository: InvoiceItemRepository
  ) {}

  /**
   * Create a new invoice
   */
  async create(
    businessId: string,
    userId: string,
    createDto: CreateInvoiceDto
  ): Promise<Invoice> {
    // Generate invoice number
    const invoiceNumber = await this.invoiceRepository.getNextInvoiceNumber(
      businessId,
      createDto.invoice_type
    );

    // Check if invoice number already exists
    const existing = await this.invoiceRepository.findByInvoiceNumber(
      businessId,
      invoiceNumber,
      createDto.invoice_type
    );
    if (existing) {
      throw new BadRequestException('Invoice number already exists');
    }

    // Calculate invoice totals
    const isInterstate = createDto.is_interstate || false;
    const totals = GstCalculationService.calculateInvoiceTotals(
      createDto.items.map((item) => ({
        quantity: item.quantity,
        unitPrice: item.unit_price,
        discountPercent: item.discount_percent || 0,
        taxRate: item.tax_rate || 0,
        cessRate: item.cess_rate || 0,
      })),
      isInterstate,
      false // tax_inclusive - will be configurable later
    );

    // Calculate due date if not provided
    const invoiceDate = new Date(createDto.invoice_date);
    const dueDate = createDto.due_date
      ? new Date(createDto.due_date)
      : new Date(invoiceDate.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days default

    // Create invoice
    const invoice = await this.invoiceRepository.create({
      business_id: businessId,
      party_id: createDto.party_id,
      invoice_number: invoiceNumber,
      invoice_type: createDto.invoice_type,
      invoice_date: invoiceDate,
      due_date: dueDate,
      place_of_supply: createDto.place_of_supply,
      is_interstate: isInterstate,
      is_export: createDto.is_export || false,
      is_rcm: createDto.is_rcm || false,
      subtotal: totals.subtotal,
      discount_amount: totals.discountAmount,
      taxable_amount: totals.taxableAmount,
      cgst_amount: totals.cgstAmount,
      sgst_amount: totals.sgstAmount,
      igst_amount: totals.igstAmount,
      cess_amount: totals.cessAmount,
      total_amount: totals.totalAmount,
      payment_status: 'unpaid',
      status: 'draft',
      terms: createDto.terms,
      notes: createDto.notes,
      created_by: userId,
    });

    // Create invoice items
    const invoiceItems: InvoiceItem[] = [];
    for (let i = 0; i < createDto.items.length; i++) {
      const itemDto = createDto.items[i];
      const itemGst = GstCalculationService.calculateItemGst(
        itemDto.quantity,
        itemDto.unit_price,
        itemDto.discount_percent || 0,
        itemDto.tax_rate || 0,
        isInterstate,
        false, // tax_inclusive
        itemDto.cess_rate || 0
      );

      const baseAmount = itemDto.quantity * itemDto.unit_price;
      const discountAmount =
        (baseAmount * (itemDto.discount_percent || 0)) / 100;

      const invoiceItem = await this.invoiceItemRepository.create({
        invoice_id: invoice.id,
        item_id: itemDto.item_id,
        item_name: itemDto.item_name,
        item_description: itemDto.item_description,
        hsn_code: itemDto.hsn_code,
        unit: itemDto.unit,
        quantity: itemDto.quantity,
        unit_price: itemDto.unit_price,
        discount_percent: itemDto.discount_percent || 0,
        discount_amount: discountAmount,
        tax_rate: itemDto.tax_rate || 0,
        cgst_rate: itemGst.cgstRate,
        sgst_rate: itemGst.sgstRate,
        igst_rate: itemGst.igstRate,
        cess_rate: itemDto.cess_rate || 0,
        taxable_amount: itemGst.taxableAmount,
        cgst_amount: itemGst.cgstAmount,
        sgst_amount: itemGst.sgstAmount,
        igst_amount: itemGst.igstAmount,
        cess_amount: itemGst.cessAmount,
        total_amount: itemGst.totalAmount,
        sort_order: i,
      });

      invoiceItems.push(invoiceItem);
    }

    // Reload invoice with items
    const invoiceWithItems = await this.invoiceRepository.findById(
      invoice.id
    );
    if (!invoiceWithItems) {
      throw new NotFoundException('Invoice not found after creation');
    }

    return invoiceWithItems;
  }

  /**
   * Get invoice by ID
   */
  async findById(businessId: string, id: string): Promise<Invoice> {
    const invoice = await this.invoiceRepository.findByBusinessIdAndId(
      businessId,
      id
    );

    if (!invoice) {
      throw new NotFoundException(`Invoice with ID ${id} not found`);
    }

    return invoice;
  }

  /**
   * Get all invoices for business with filters
   */
  async findByBusinessId(
    businessId: string,
    filters?: {
      partyId?: string;
      invoiceType?: string;
      paymentStatus?: string;
      status?: string;
      startDate?: string;
      endDate?: string;
      search?: string;
      page?: number;
      limit?: number;
    }
  ): Promise<{ invoices: Invoice[]; total: number; page: number; limit: number }> {
    const page = filters?.page || 1;
    const limit = filters?.limit || 20;

    const result = await this.invoiceRepository.findByBusinessId(businessId, {
      ...filters,
      startDate: filters?.startDate ? new Date(filters.startDate) : undefined,
      endDate: filters?.endDate ? new Date(filters.endDate) : undefined,
      page,
      limit,
    });

    return {
      invoices: result.invoices,
      total: result.total,
      page,
      limit,
    };
  }

  /**
   * Update invoice
   */
  async update(
    businessId: string,
    id: string,
    updateDto: UpdateInvoiceDto
  ): Promise<Invoice> {
    // Verify invoice exists and belongs to business
    const invoice = await this.findById(businessId, id);

    // Prepare update data
    const updateData: any = {};

    // If items are being updated, recalculate totals
    if (updateDto.items && updateDto.items.length > 0) {
      const isInterstate = updateDto.is_interstate ?? invoice.is_interstate;
      const totals = GstCalculationService.calculateInvoiceTotals(
        updateDto.items.map((item) => ({
          quantity: item.quantity,
          unitPrice: item.unit_price,
          discountPercent: item.discount_percent || 0,
          taxRate: item.tax_rate || 0,
          cessRate: item.cess_rate || 0,
        })),
        isInterstate,
        false // tax_inclusive
      );

      // Update invoice totals
      updateData.subtotal = totals.subtotal;
      updateData.discount_amount = totals.discountAmount;
      updateData.taxable_amount = totals.taxableAmount;
      updateData.cgst_amount = totals.cgstAmount;
      updateData.sgst_amount = totals.sgstAmount;
      updateData.igst_amount = totals.igstAmount;
      updateData.cess_amount = totals.cessAmount;
      updateData.total_amount = totals.totalAmount;
      updateData.is_interstate = isInterstate;

      // Delete existing items and create new ones
      const existingItems = await this.invoiceItemRepository.findByInvoiceId(invoice.id);
      for (const item of existingItems) {
        await this.invoiceItemRepository.delete(item.id);
      }

      // Create new invoice items
      for (let i = 0; i < updateDto.items.length; i++) {
        const itemDto = updateDto.items[i];
        const itemGst = GstCalculationService.calculateItemGst(
          itemDto.quantity,
          itemDto.unit_price,
          itemDto.discount_percent || 0,
          itemDto.tax_rate || 0,
          isInterstate,
          false,
          itemDto.cess_rate || 0
        );

        const baseAmount = itemDto.quantity * itemDto.unit_price;
        const discountAmount =
          (baseAmount * (itemDto.discount_percent || 0)) / 100;

        await this.invoiceItemRepository.create({
          invoice_id: invoice.id,
          item_id: itemDto.item_id,
          item_name: itemDto.item_name,
          item_description: itemDto.item_description,
          hsn_code: itemDto.hsn_code,
          unit: itemDto.unit,
          quantity: itemDto.quantity,
          unit_price: itemDto.unit_price,
          discount_percent: itemDto.discount_percent || 0,
          discount_amount: discountAmount,
          tax_rate: itemDto.tax_rate || 0,
          cgst_rate: itemGst.cgstRate,
          sgst_rate: itemGst.sgstRate,
          igst_rate: itemGst.igstRate,
          cess_rate: itemDto.cess_rate || 0,
          taxable_amount: itemGst.taxableAmount,
          cgst_amount: itemGst.cgstAmount,
          sgst_amount: itemGst.sgstAmount,
          igst_amount: itemGst.igstAmount,
          cess_amount: itemGst.cessAmount,
          total_amount: itemGst.totalAmount,
          sort_order: i,
        });
      }
    }

    // Add other fields to update data
    if (updateDto.party_id !== undefined) {
      updateData.party_id = updateDto.party_id;
    }
    if (updateDto.invoice_type !== undefined) {
      updateData.invoice_type = updateDto.invoice_type;
    }
    if (updateDto.invoice_date !== undefined) {
      updateData.invoice_date = new Date(updateDto.invoice_date);
    }
    if (updateDto.due_date !== undefined) {
      updateData.due_date = updateDto.due_date ? new Date(updateDto.due_date) : null;
    }
    if (updateDto.place_of_supply !== undefined) {
      updateData.place_of_supply = updateDto.place_of_supply;
    }
    if (updateDto.is_interstate !== undefined && !updateDto.items) {
      updateData.is_interstate = updateDto.is_interstate;
    }
    if (updateDto.is_export !== undefined) {
      updateData.is_export = updateDto.is_export;
    }
    if (updateDto.is_rcm !== undefined) {
      updateData.is_rcm = updateDto.is_rcm;
    }
    if (updateDto.terms !== undefined) {
      updateData.terms = updateDto.terms;
    }
    if (updateDto.notes !== undefined) {
      updateData.notes = updateDto.notes;
    }
    if (updateDto.status !== undefined) {
      updateData.status = updateDto.status;
    }

    // Update invoice
    await this.invoiceRepository.update(id, updateData);

    // Reload invoice with items
    return this.findById(businessId, id);
  }

  /**
   * Delete invoice (soft delete)
   */
  async delete(businessId: string, id: string): Promise<void> {
    // Verify invoice exists
    await this.findById(businessId, id);

    // Soft delete
    await this.invoiceRepository.delete(id);
  }

  /**
   * Get all invoices across all businesses (for superadmin)
   */
  async findAllForSuperadmin(
    filters?: {
      partyId?: string;
      invoiceType?: string;
      paymentStatus?: string;
      status?: string;
      startDate?: string;
      endDate?: string;
      search?: string;
      page?: number;
      limit?: number;
    }
  ): Promise<{ invoices: Invoice[]; total: number; page: number; limit: number }> {
    const page = filters?.page || 1;
    const limit = filters?.limit || 20;

    const result = await this.invoiceRepository.findAllForSuperadmin({
      ...filters,
      startDate: filters?.startDate ? new Date(filters.startDate) : undefined,
      endDate: filters?.endDate ? new Date(filters.endDate) : undefined,
      page,
      limit,
    });

    return {
      invoices: result.invoices,
      total: result.total,
      page,
      limit,
    };
  }
}

