import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { InvoiceClientService, Invoice, InvoiceItem } from './invoice-client.service';
import { PartyClientService, Party } from './party-client.service';
import { BusinessClientService, Business } from './business-client.service';
import { GstReportRepository } from '../repositories/gst-report.repository';
import { BusinessGstSettingsRepository } from '../repositories/business-gst-settings.repository';
import { PeriodParser } from '../utils/period-parser.util';
import { Gstr1ResponseDto, Gstr1B2BCustomerDto, Gstr1B2BInvoiceDto, Gstr1B2BItemDto, Gstr1B2CSmallSummaryDto, Gstr1B2CLargeInvoiceDto, Gstr1ExportInvoiceDto, Gstr1NilSummaryDto, Gstr1CdnrDto, Gstr1AdvanceReceiptDto, Gstr1TaxPaidOnAdvanceDto, Gstr1HsnSummaryDto } from '../dto/gstr1.dto';

/**
 * GSTR-1 Service
 * 
 * Generates GSTR-1 report data in GSTN-compliant format.
 */
@Injectable()
export class Gstr1Service {
  private readonly logger = new Logger(Gstr1Service.name);

  constructor(
    private readonly invoiceClient: InvoiceClientService,
    private readonly partyClient: PartyClientService,
    private readonly businessClient: BusinessClientService,
    private readonly gstReportRepository: GstReportRepository,
    private readonly businessGstSettingsRepository: BusinessGstSettingsRepository,
  ) {}

  /**
   * Generate GSTR-1 report
   */
  async generateGstr1(
    businessId: string,
    period: string,
    token: string
  ): Promise<Gstr1ResponseDto> {
    this.logger.log(`Generating GSTR-1 for business ${businessId}, period ${period}`);

    // Validate period format
    if (!PeriodParser.isValid(period)) {
      throw new BadRequestException(
        `Invalid period format: ${period}. Expected MMYYYY (e.g., 122024) or Q1-YYYY (e.g., Q1-2024)`
      );
    }

    // Check cache
    const isCacheFresh = await this.gstReportRepository.isCacheFresh(
      businessId,
      'gstr1',
      period
    );

    if (isCacheFresh) {
      this.logger.log(`Returning cached GSTR-1 report for period ${period}`);
      const cachedReport = await this.gstReportRepository.findCachedReport(
        businessId,
        'gstr1',
        period
      );
      if (cachedReport) {
        return cachedReport.report_data as Gstr1ResponseDto;
      }
    }

    // Parse period to date range
    const { startDate, endDate } = PeriodParser.parse(period);

    // Get business details
    const business = await this.businessClient.getBusiness(businessId, token);
    if (!business.gstin) {
      throw new BadRequestException('Business GSTIN is required for GSTR-1 generation');
    }

    // Get business GST settings (for filing frequency)
    const gstSettings = await this.businessGstSettingsRepository.findByBusinessId(businessId);
    const filingFrequency = gstSettings?.filing_frequency || 'monthly';

    // Fetch invoices for the period
    const invoices = await this.invoiceClient.getInvoicesByPeriod(
      businessId,
      startDate.toISOString().split('T')[0],
      endDate.toISOString().split('T')[0],
      token,
      true // include items
    );

    // Filter only sale invoices
    const saleInvoices = invoices.filter((inv) => inv.invoice_type === 'sale');

    if (saleInvoices.length === 0) {
      this.logger.warn(`No sale invoices found for period ${period}`);
    }

    // Get all unique party IDs
    const partyIds = [...new Set(saleInvoices.map((inv) => inv.party_id))];

    // Fetch party details
    const parties = await this.partyClient.getPartiesByIds(businessId, partyIds, token);
    const partyMap = new Map(parties.map((p) => [p.id, p]));

    // Separate invoices by type
    const b2bInvoices: Invoice[] = [];
    const b2cInvoices: Invoice[] = [];
    const exportInvoices: Invoice[] = [];

    for (const invoice of saleInvoices) {
      // Check if export invoice
      if (invoice.is_export) {
        exportInvoices.push(invoice);
        continue;
      }

      const party = partyMap.get(invoice.party_id);
      if (party?.gstin) {
        b2bInvoices.push(invoice);
      } else {
        b2cInvoices.push(invoice);
      }
    }

    // Generate B2B section
    const b2b = this.generateB2BSection(b2bInvoices, partyMap);

    // Separate B2C into small and large
    const b2cSmallInvoices: Invoice[] = [];
    const b2cLargeInvoices: Invoice[] = [];
    const B2C_LARGE_THRESHOLD = 250000; // 2.5L

    for (const invoice of b2cInvoices) {
      if (invoice.total_amount >= B2C_LARGE_THRESHOLD) {
        b2cLargeInvoices.push(invoice);
      } else {
        b2cSmallInvoices.push(invoice);
      }
    }

    // Generate B2C sections
    const b2cSmall = this.generateB2CSmallSection(b2cSmallInvoices);
    const b2cLarge = this.generateB2CLargeSection(b2cLargeInvoices, partyMap);

    // Generate Export section
    const exportSection = this.generateExportSection(exportInvoices);

    // Generate CDNR section (Credit/Debit Notes)
    const cdnrSection = await this.generateCdnrSection(
      businessId,
      startDate,
      endDate,
      token,
      partyMap
    );

    // Generate Advance Receipts section
    const advanceReceiptsSection = await this.generateAdvanceReceiptsSection(
      businessId,
      startDate,
      endDate,
      token
    );

    // Generate Tax Paid on Advance section
    const taxPaidOnAdvanceSection = await this.generateTaxPaidOnAdvanceSection(
      businessId,
      startDate,
      endDate,
      token
    );

    // Generate Nil/Exempt/Non-GST section
    const nilSection = this.generateNilSection(saleInvoices);

    // Generate HSN summary
    const hsnSummary = this.generateHsnSummary(saleInvoices);

    // Build response
    const response: Gstr1ResponseDto = {
      gstin: business.gstin,
      return_period: period,
      b2b,
      b2c_small: b2cSmall,
      b2c_large: b2cLarge.length > 0 ? b2cLarge : undefined,
      cdnr: cdnrSection.length > 0 ? cdnrSection : undefined,
      export: exportSection.length > 0 ? exportSection : undefined,
      advance_receipts: advanceReceiptsSection.length > 0 ? advanceReceiptsSection : undefined,
      tax_paid_on_advance: taxPaidOnAdvanceSection.length > 0 ? taxPaidOnAdvanceSection : undefined,
      nil: nilSection,
      hsn_summary: hsnSummary,
    };

    // Cache the report
    await this.cacheReport(businessId, period, response);

    return response;
  }

  /**
   * Generate B2B section (grouped by customer GSTIN)
   */
  private generateB2BSection(
    invoices: Invoice[],
    partyMap: Map<string, Party>
  ): Gstr1B2BCustomerDto[] {
    // Group invoices by customer GSTIN
    const invoicesByGstin = new Map<string, Invoice[]>();

    for (const invoice of invoices) {
      const party = partyMap.get(invoice.party_id);
      if (!party?.gstin) continue;

      if (!invoicesByGstin.has(party.gstin)) {
        invoicesByGstin.set(party.gstin, []);
      }
      invoicesByGstin.get(party.gstin)!.push(invoice);
    }

    // Build B2B section
    const b2b: Gstr1B2BCustomerDto[] = [];

    for (const [gstin, customerInvoices] of invoicesByGstin.entries()) {
      const party = Array.from(partyMap.values()).find((p) => p.gstin === gstin);
      
      const customerDto: Gstr1B2BCustomerDto = {
        customer_gstin: gstin,
        customer_name: party?.name,
        invoices: customerInvoices.map((invoice) => this.mapInvoiceToB2BInvoice(invoice)),
      };

      b2b.push(customerDto);
    }

    return b2b;
  }

  /**
   * Map invoice to B2B invoice DTO
   */
  private mapInvoiceToB2BInvoice(invoice: Invoice): Gstr1B2BInvoiceDto {
    // Group items by tax rate
    const itemsByRate = new Map<number, InvoiceItem[]>();

    for (const item of invoice.items || []) {
      const rate = item.tax_rate || 0;
      if (!itemsByRate.has(rate)) {
        itemsByRate.set(rate, []);
      }
      itemsByRate.get(rate)!.push(item);
    }

    // Build items array
    const items: Gstr1B2BItemDto[] = [];

    for (const [rate, rateItems] of itemsByRate.entries()) {
      const taxableValue = rateItems.reduce((sum, item) => sum + (item.taxable_amount || 0), 0);
      const cgst = rateItems.reduce((sum, item) => sum + (item.cgst_amount || 0), 0);
      const sgst = rateItems.reduce((sum, item) => sum + (item.sgst_amount || 0), 0);
      const igst = rateItems.reduce((sum, item) => sum + (item.igst_amount || 0), 0);
      const cess = rateItems.reduce((sum, item) => sum + (item.cess_amount || 0), 0);

      items.push({
        rate,
        taxable_value: this.roundToTwoDecimals(taxableValue),
        cgst: this.roundToTwoDecimals(cgst),
        sgst: this.roundToTwoDecimals(sgst),
        igst: this.roundToTwoDecimals(igst),
        cess: this.roundToTwoDecimals(cess),
      });
    }

    // Handle invoice_date - could be Date object or string
    let invoiceDate: string;
    if (invoice.invoice_date instanceof Date) {
      invoiceDate = invoice.invoice_date.toISOString().split('T')[0];
    } else if (typeof invoice.invoice_date === 'string') {
      invoiceDate = invoice.invoice_date.split('T')[0];
    } else {
      invoiceDate = new Date().toISOString().split('T')[0];
    }

    return {
      invoice_number: invoice.invoice_number,
      invoice_date: invoiceDate,
      invoice_value: this.roundToTwoDecimals(invoice.total_amount || 0),
      place_of_supply: invoice.place_of_supply || 'Unknown',
      items,
    };
  }

  /**
   * Generate B2C small section (summary by place of supply and tax rate)
   */
  private generateB2CSmallSection(invoices: Invoice[]): Gstr1B2CSmallSummaryDto[] {
    // Group by place of supply and tax rate
    const summaryMap = new Map<string, Map<number, {
      taxable_value: number;
      cgst: number;
      sgst: number;
      igst: number;
      cess: number;
    }>>();

    for (const invoice of invoices) {
      const placeOfSupply = invoice.place_of_supply || 'Unknown';

      if (!summaryMap.has(placeOfSupply)) {
        summaryMap.set(placeOfSupply, new Map());
      }

      const rateMap = summaryMap.get(placeOfSupply)!;

      for (const item of invoice.items || []) {
        const rate = item.tax_rate || 0;

        if (!rateMap.has(rate)) {
          rateMap.set(rate, {
            taxable_value: 0,
            cgst: 0,
            sgst: 0,
            igst: 0,
            cess: 0,
          });
        }

        const summary = rateMap.get(rate)!;
        summary.taxable_value += item.taxable_amount || 0;
        summary.cgst += item.cgst_amount || 0;
        summary.sgst += item.sgst_amount || 0;
        summary.igst += item.igst_amount || 0;
        summary.cess += item.cess_amount || 0;
      }
    }

    // Build summary array
    const summary: Gstr1B2CSmallSummaryDto[] = [];

    for (const [placeOfSupply, rateMap] of summaryMap.entries()) {
      for (const [rate, totals] of rateMap.entries()) {
        summary.push({
          place_of_supply: placeOfSupply,
          rate,
          taxable_value: this.roundToTwoDecimals(totals.taxable_value),
          cgst: this.roundToTwoDecimals(totals.cgst),
          sgst: this.roundToTwoDecimals(totals.sgst),
          igst: this.roundToTwoDecimals(totals.igst),
          cess: this.roundToTwoDecimals(totals.cess),
        });
      }
    }

    return summary;
  }

  /**
   * Generate B2C Large section (invoices >= 2.5L with customer details)
   */
  private generateB2CLargeSection(
    invoices: Invoice[],
    partyMap: Map<string, Party>
  ): Gstr1B2CLargeInvoiceDto[] {
    const b2cLarge: Gstr1B2CLargeInvoiceDto[] = [];

    for (const invoice of invoices) {
      const party = partyMap.get(invoice.party_id);
      
      // Group items by tax rate
      const itemsByRate = new Map<number, InvoiceItem[]>();
      for (const item of invoice.items || []) {
        const rate = item.tax_rate || 0;
        if (!itemsByRate.has(rate)) {
          itemsByRate.set(rate, []);
        }
        itemsByRate.get(rate)!.push(item);
      }

      // Build items array
      const items: Gstr1B2BItemDto[] = [];
      for (const [rate, rateItems] of itemsByRate.entries()) {
        const taxableValue = rateItems.reduce((sum, item) => sum + (item.taxable_amount || 0), 0);
        const cgst = rateItems.reduce((sum, item) => sum + (item.cgst_amount || 0), 0);
        const sgst = rateItems.reduce((sum, item) => sum + (item.sgst_amount || 0), 0);
        const igst = rateItems.reduce((sum, item) => sum + (item.igst_amount || 0), 0);
        const cess = rateItems.reduce((sum, item) => sum + (item.cess_amount || 0), 0);

        items.push({
          rate,
          taxable_value: this.roundToTwoDecimals(taxableValue),
          cgst: this.roundToTwoDecimals(cgst),
          sgst: this.roundToTwoDecimals(sgst),
          igst: this.roundToTwoDecimals(igst),
          cess: this.roundToTwoDecimals(cess),
        });
      }

      // Handle invoice_date
      let invoiceDate: string;
      if (invoice.invoice_date instanceof Date) {
        invoiceDate = invoice.invoice_date.toISOString().split('T')[0];
      } else if (typeof invoice.invoice_date === 'string') {
        invoiceDate = invoice.invoice_date.split('T')[0];
      } else {
        invoiceDate = new Date().toISOString().split('T')[0];
      }

      // Build customer address
      const address = party?.address
        ? `${party.address.street || ''}, ${party.address.city || ''}, ${party.address.state || ''} ${party.address.pincode || ''}`.trim()
        : undefined;

      b2cLarge.push({
        invoice_number: invoice.invoice_number,
        invoice_date: invoiceDate,
        invoice_value: this.roundToTwoDecimals(invoice.total_amount || 0),
        place_of_supply: invoice.place_of_supply || 'Unknown',
        customer_name: party?.name,
        customer_address: address,
        items,
      });
    }

    return b2cLarge;
  }

  /**
   * Generate Export section
   */
  private generateExportSection(invoices: Invoice[]): Gstr1ExportInvoiceDto[] {
    const exportInvoices: Gstr1ExportInvoiceDto[] = [];

    for (const invoice of invoices) {
      // Group items by tax rate
      const itemsByRate = new Map<number, InvoiceItem[]>();
      for (const item of invoice.items || []) {
        const rate = item.tax_rate || 0;
        if (!itemsByRate.has(rate)) {
          itemsByRate.set(rate, []);
        }
        itemsByRate.get(rate)!.push(item);
      }

      // Build items array (export invoices are zero-rated)
      const items: Gstr1B2BItemDto[] = [];
      for (const [rate, rateItems] of itemsByRate.entries()) {
        const taxableValue = rateItems.reduce((sum, item) => sum + (item.taxable_amount || 0), 0);
        // Export invoices should have zero tax
        items.push({
          rate: 0, // Zero-rated for exports
          taxable_value: this.roundToTwoDecimals(taxableValue),
          cgst: 0,
          sgst: 0,
          igst: 0,
          cess: 0,
        });
      }

      // Handle invoice_date
      let invoiceDate: string;
      if (invoice.invoice_date instanceof Date) {
        invoiceDate = invoice.invoice_date.toISOString().split('T')[0];
      } else if (typeof invoice.invoice_date === 'string') {
        invoiceDate = invoice.invoice_date.split('T')[0];
      } else {
        invoiceDate = new Date().toISOString().split('T')[0];
      }

      // Extract port code and shipping bill from notes (if available)
      // In a real implementation, these would be separate fields
      const notes = invoice.notes || '';
      const portCodeMatch = notes.match(/port[:\s]+([A-Z0-9]+)/i);
      const shippingBillMatch = notes.match(/shipping[:\s]+bill[:\s]+([A-Z0-9]+)/i);

      exportInvoices.push({
        invoice_number: invoice.invoice_number,
        invoice_date: invoiceDate,
        invoice_value: this.roundToTwoDecimals(invoice.total_amount || 0),
        port_code: portCodeMatch ? portCodeMatch[1] : undefined,
        shipping_bill_number: shippingBillMatch ? shippingBillMatch[1] : undefined,
        shipping_bill_date: undefined, // Would need to be extracted from notes or separate field
        items,
      });
    }

    return exportInvoices;
  }

  /**
   * Generate Nil/Exempt/Non-GST section
   */
  private generateNilSection(invoices: Invoice[]): Gstr1NilSummaryDto {
    let nilRated = 0;
    let exempted = 0;
    let nonGst = 0;

    for (const invoice of invoices) {
      for (const item of invoice.items || []) {
        const taxRate = item.tax_rate || 0;
        const taxableValue = item.taxable_amount || 0;

        // Nil-rated: tax rate is 0 but item is taxable
        if (taxRate === 0 && taxableValue > 0 && (item.cgst_amount === 0 && item.sgst_amount === 0 && item.igst_amount === 0)) {
          // Check if it's nil-rated (has HSN but 0% tax) vs exempted
          if (item.hsn_code && item.hsn_code !== 'N/A') {
            nilRated += taxableValue;
          } else {
            exempted += taxableValue;
          }
        } else if (taxRate === 0 && taxableValue > 0) {
          // Exempted items
          exempted += taxableValue;
        }
        // Non-GST supplies would need a separate flag in the invoice/item
        // For now, we'll assume items with no HSN and no tax are non-GST
        if (!item.hsn_code || item.hsn_code === 'N/A') {
          if (taxRate === 0 && taxableValue > 0) {
            nonGst += taxableValue;
          }
        }
      }
    }

    return {
      nil_rated: this.roundToTwoDecimals(nilRated),
      exempted: this.roundToTwoDecimals(exempted),
      non_gst: this.roundToTwoDecimals(nonGst),
    };
  }

  /**
   * Generate CDNR section (Credit/Debit Notes)
   */
  private async generateCdnrSection(
    businessId: string,
    startDate: Date,
    endDate: Date,
    token: string,
    partyMap: Map<string, Party>
  ): Promise<Gstr1CdnrDto[]> {
    // Fetch credit notes and debit notes (stored as invoices with invoice_type='credit_note' or 'debit_note')
    const allInvoices = await this.invoiceClient.getInvoicesByPeriod(
      businessId,
      startDate.toISOString().split('T')[0],
      endDate.toISOString().split('T')[0],
      token,
      true
    );

    const creditNotes = allInvoices.filter(
      (inv) => inv.invoice_type === 'credit_note' || inv.invoice_type === 'credit'
    );
    const debitNotes = allInvoices.filter(
      (inv) => inv.invoice_type === 'debit_note' || inv.invoice_type === 'debit'
    );

    const cdnr: Gstr1CdnrDto[] = [];

    // Process credit notes
    for (const note of creditNotes) {
      // Extract original invoice number from notes or use a reference field
      const originalInvoiceNumber = note.notes?.match(/original[:\s]+invoice[:\s]+([A-Z0-9-]+)/i)?.[1] || 
                                      note.notes?.match(/against[:\s]+([A-Z0-9-]+)/i)?.[1] ||
                                      'N/A';

      let noteDate: string;
      if (note.invoice_date instanceof Date) {
        noteDate = note.invoice_date.toISOString().split('T')[0];
      } else if (typeof note.invoice_date === 'string') {
        noteDate = note.invoice_date.split('T')[0];
      } else {
        noteDate = new Date().toISOString().split('T')[0];
      }

      // Calculate totals from items
      const taxableValue = note.items?.reduce((sum, item) => sum + (item.taxable_amount || 0), 0) || 0;
      const cgst = note.items?.reduce((sum, item) => sum + (item.cgst_amount || 0), 0) || 0;
      const sgst = note.items?.reduce((sum, item) => sum + (item.sgst_amount || 0), 0) || 0;
      const igst = note.items?.reduce((sum, item) => sum + (item.igst_amount || 0), 0) || 0;
      const cess = note.items?.reduce((sum, item) => sum + (item.cess_amount || 0), 0) || 0;

      cdnr.push({
        original_invoice_number: originalInvoiceNumber,
        original_invoice_date: noteDate, // Would need to fetch original invoice date
        note_type: 'credit',
        note_number: note.invoice_number,
        note_date: noteDate,
        reason_code: '01', // Default - would need to extract from notes
        note_value: this.roundToTwoDecimals(note.total_amount || 0),
        taxable_value: this.roundToTwoDecimals(taxableValue),
        cgst: this.roundToTwoDecimals(cgst),
        sgst: this.roundToTwoDecimals(sgst),
        igst: this.roundToTwoDecimals(igst),
        cess: this.roundToTwoDecimals(cess),
      });
    }

    // Process debit notes
    for (const note of debitNotes) {
      const originalInvoiceNumber = note.notes?.match(/original[:\s]+invoice[:\s]+([A-Z0-9-]+)/i)?.[1] || 
                                      note.notes?.match(/against[:\s]+([A-Z0-9-]+)/i)?.[1] ||
                                      'N/A';

      let noteDate: string;
      if (note.invoice_date instanceof Date) {
        noteDate = note.invoice_date.toISOString().split('T')[0];
      } else if (typeof note.invoice_date === 'string') {
        noteDate = note.invoice_date.split('T')[0];
      } else {
        noteDate = new Date().toISOString().split('T')[0];
      }

      const taxableValue = note.items?.reduce((sum, item) => sum + (item.taxable_amount || 0), 0) || 0;
      const cgst = note.items?.reduce((sum, item) => sum + (item.cgst_amount || 0), 0) || 0;
      const sgst = note.items?.reduce((sum, item) => sum + (item.sgst_amount || 0), 0) || 0;
      const igst = note.items?.reduce((sum, item) => sum + (item.igst_amount || 0), 0) || 0;
      const cess = note.items?.reduce((sum, item) => sum + (item.cess_amount || 0), 0) || 0;

      cdnr.push({
        original_invoice_number: originalInvoiceNumber,
        original_invoice_date: noteDate,
        note_type: 'debit',
        note_number: note.invoice_number,
        note_date: noteDate,
        reason_code: '01',
        note_value: this.roundToTwoDecimals(note.total_amount || 0),
        taxable_value: this.roundToTwoDecimals(taxableValue),
        cgst: this.roundToTwoDecimals(cgst),
        sgst: this.roundToTwoDecimals(sgst),
        igst: this.roundToTwoDecimals(igst),
        cess: this.roundToTwoDecimals(cess),
      });
    }

    return cdnr;
  }

  /**
   * Generate Advance Receipts section
   */
  private async generateAdvanceReceiptsSection(
    businessId: string,
    startDate: Date,
    endDate: Date,
    token: string
  ): Promise<Gstr1AdvanceReceiptDto[]> {
    // Fetch advance receipts (might be stored as invoices with invoice_type='advance' or in payment service)
    const allInvoices = await this.invoiceClient.getInvoicesByPeriod(
      businessId,
      startDate.toISOString().split('T')[0],
      endDate.toISOString().split('T')[0],
      token,
      true
    );

    const advanceInvoices = allInvoices.filter(
      (inv) => inv.invoice_type === 'advance' || inv.invoice_type === 'advance_receipt'
    );

    const advanceReceipts: Gstr1AdvanceReceiptDto[] = [];

    for (const receipt of advanceInvoices) {
      let receiptDate: string;
      if (receipt.invoice_date instanceof Date) {
        receiptDate = receipt.invoice_date.toISOString().split('T')[0];
      } else if (typeof receipt.invoice_date === 'string') {
        receiptDate = receipt.invoice_date.split('T')[0];
      } else {
        receiptDate = new Date().toISOString().split('T')[0];
      }

      const taxableValue = receipt.items?.reduce((sum, item) => sum + (item.taxable_amount || 0), 0) || 0;
      const cgst = receipt.items?.reduce((sum, item) => sum + (item.cgst_amount || 0), 0) || 0;
      const sgst = receipt.items?.reduce((sum, item) => sum + (item.sgst_amount || 0), 0) || 0;
      const igst = receipt.items?.reduce((sum, item) => sum + (item.igst_amount || 0), 0) || 0;
      const cess = receipt.items?.reduce((sum, item) => sum + (item.cess_amount || 0), 0) || 0;

      advanceReceipts.push({
        receipt_number: receipt.invoice_number,
        receipt_date: receiptDate,
        advance_amount: this.roundToTwoDecimals(receipt.total_amount || 0),
        taxable_value: this.roundToTwoDecimals(taxableValue),
        cgst: this.roundToTwoDecimals(cgst),
        sgst: this.roundToTwoDecimals(sgst),
        igst: this.roundToTwoDecimals(igst),
        cess: this.roundToTwoDecimals(cess),
      });
    }

    return advanceReceipts;
  }

  /**
   * Generate Tax Paid on Advance section
   */
  private async generateTaxPaidOnAdvanceSection(
    businessId: string,
    startDate: Date,
    endDate: Date,
    token: string
  ): Promise<Gstr1TaxPaidOnAdvanceDto[]> {
    // This section tracks when advance receipts are adjusted against final invoices
    // For now, we'll return empty array as this requires tracking advance adjustments
    const taxPaidOnAdvance: Gstr1TaxPaidOnAdvanceDto[] = [];

    // TODO: Implement advance adjustment tracking
    // This would require:
    // 1. Tracking which advance receipts were adjusted
    // 2. Linking advance receipts to final invoices
    // 3. Calculating tax adjustments

    return taxPaidOnAdvance;
  }

  /**
   * Generate HSN summary
   */
  private generateHsnSummary(invoices: Invoice[]): Gstr1HsnSummaryDto[] {
    // Group by HSN code
    const hsnMap = new Map<string, {
      description: string;
      uqc: string;
      quantity: number;
      taxable_value: number;
      cgst: number;
      sgst: number;
      igst: number;
      cess: number;
    }>();

    for (const invoice of invoices) {
      for (const item of invoice.items || []) {
        const hsnCode = item.hsn_code || 'N/A';
        const description = item.item_name || 'Unknown';
        const uqc = item.unit || 'PCS';

        if (!hsnMap.has(hsnCode)) {
          hsnMap.set(hsnCode, {
            description,
            uqc,
            quantity: 0,
            taxable_value: 0,
            cgst: 0,
            sgst: 0,
            igst: 0,
            cess: 0,
          });
        }

        const summary = hsnMap.get(hsnCode)!;
        summary.quantity += item.quantity || 0;
        summary.taxable_value += item.taxable_amount || 0;
        summary.cgst += item.cgst_amount || 0;
        summary.sgst += item.sgst_amount || 0;
        summary.igst += item.igst_amount || 0;
        summary.cess += item.cess_amount || 0;
      }
    }

    // Build summary array
    const summary: Gstr1HsnSummaryDto[] = [];

    for (const [hsnCode, totals] of hsnMap.entries()) {
      summary.push({
        hsn_code: hsnCode,
        description: totals.description,
        uqc: totals.uqc,
        quantity: totals.quantity,
        taxable_value: this.roundToTwoDecimals(totals.taxable_value),
        cgst: this.roundToTwoDecimals(totals.cgst),
        sgst: this.roundToTwoDecimals(totals.sgst),
        igst: this.roundToTwoDecimals(totals.igst),
        cess: this.roundToTwoDecimals(totals.cess),
      });
    }

    return summary;
  }

  /**
   * Cache the generated report
   */
  private async cacheReport(
    businessId: string,
    period: string,
    reportData: Gstr1ResponseDto
  ): Promise<void> {
    try {
      const existingReport = await this.gstReportRepository.findCachedReport(
        businessId,
        'gstr1',
        period
      );

      if (existingReport) {
        await this.gstReportRepository.update(existingReport.id, {
          report_data: reportData,
          generated_at: new Date(),
        });
      } else {
        await this.gstReportRepository.create({
          business_id: businessId,
          report_type: 'gstr1',
          period,
          report_data: reportData,
          generated_at: new Date(),
        });
      }
    } catch (error) {
      this.logger.warn(`Failed to cache GSTR-1 report: ${error.message}`);
      // Don't throw - caching failure shouldn't break the response
    }
  }

  /**
   * Round to 2 decimal places
   */
  private roundToTwoDecimals(value: number): number {
    return Math.round(value * 100) / 100;
  }
}

