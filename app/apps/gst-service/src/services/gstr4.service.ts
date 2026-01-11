import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { InvoiceClientService, Invoice } from './invoice-client.service';
import { PartyClientService, Party } from './party-client.service';
import { BusinessClientService, Business } from './business-client.service';
import { GstReportRepository } from '../repositories/gst-report.repository';
import { BusinessGstSettingsRepository } from '../repositories/business-gst-settings.repository';
import { PeriodParser } from '../utils/period-parser.util';
import { Gstr4ResponseDto, Gstr4B2BInvoiceDto, Gstr4B2CInvoiceDto } from '../dto/gstr4.dto';

/**
 * GSTR-4 Service
 * 
 * Generates GSTR-4 quarterly return for composition scheme businesses.
 */
@Injectable()
export class Gstr4Service {
  private readonly logger = new Logger(Gstr4Service.name);

  constructor(
    private readonly invoiceClient: InvoiceClientService,
    private readonly partyClient: PartyClientService,
    private readonly businessClient: BusinessClientService,
    private readonly gstReportRepository: GstReportRepository,
    private readonly businessGstSettingsRepository: BusinessGstSettingsRepository,
  ) {}

  /**
   * Generate GSTR-4 report
   */
  async generateGstr4(
    businessId: string,
    period: string,
    token: string
  ): Promise<Gstr4ResponseDto> {
    this.logger.log(`Generating GSTR-4 for business ${businessId}, period ${period}`);

    // Validate period format (must be quarterly for composition)
    if (!period.startsWith('Q')) {
      throw new BadRequestException(
        `GSTR-4 is filed quarterly. Period must be in Q1-YYYY format (e.g., Q1-2024)`
      );
    }

    if (!PeriodParser.isValid(period)) {
      throw new BadRequestException(
        `Invalid period format: ${period}. Expected Q1-YYYY format (e.g., Q1-2024)`
      );
    }

    // Check cache
    const isCacheFresh = await this.gstReportRepository.isCacheFresh(
      businessId,
      'gstr4',
      period
    );

    if (isCacheFresh) {
      this.logger.log(`Returning cached GSTR-4 report for period ${period}`);
      const cachedReport = await this.gstReportRepository.findCachedReport(
        businessId,
        'gstr4',
        period
      );
      if (cachedReport) {
        return cachedReport.report_data as Gstr4ResponseDto;
      }
    }

    // Parse period to date range
    const { startDate, endDate } = PeriodParser.parse(period);

    // Get business details
    const business = await this.businessClient.getBusiness(businessId, token);
    if (!business.gstin) {
      throw new BadRequestException('Business GSTIN is required for GSTR-4 generation');
    }

    // Verify business is registered under composition scheme
    if ((business as any).gst_type !== 'composition') {
      throw new BadRequestException(
        'GSTR-4 is only for businesses registered under Composition Scheme'
      );
    }

    // Get composition rate
    const compositionRate = (business as any).composition_rate || 1; // Default 1%

    // Get GST settings
    const gstSettings = await this.businessGstSettingsRepository.findOne({
      where: { business_id: businessId } as any,
    });

    // Fetch all invoices for the period
    const allInvoices = await this.invoiceClient.getInvoicesByPeriod(
      businessId,
      startDate.toISOString().split('T')[0],
      endDate.toISOString().split('T')[0],
      token,
      false // don't need items for GSTR-4
    );

    // Filter sale invoices only
    const saleInvoices = allInvoices.filter((inv) => inv.invoice_type === 'sale');

    // Separate B2B and B2C invoices
    const b2bInvoices: Invoice[] = [];
    const b2cInvoices: Invoice[] = [];

    // Get all parties to check GSTIN
    const partyIds = [...new Set(saleInvoices.map((inv) => inv.party_id))];
    const partyMap = new Map<string, Party>();

    for (const partyId of partyIds) {
      try {
        const party = await this.partyClient.getParty(businessId, partyId, token);
        partyMap.set(partyId, party);
      } catch (error) {
        this.logger.warn(`Failed to fetch party ${partyId}: ${error.message}`);
      }
    }

    for (const invoice of saleInvoices) {
      const party = partyMap.get(invoice.party_id);
      if (party?.gstin) {
        // B2B: Customer has GSTIN
        b2bInvoices.push(invoice);
      } else {
        // B2C: Customer doesn't have GSTIN
        b2cInvoices.push(invoice);
      }
    }

    // Generate B2B section
    const b2b = this.generateB2BSection(b2bInvoices, partyMap);

    // Generate B2C section
    const b2c = this.generateB2CSection(b2cInvoices, partyMap);

    // Calculate total turnover
    const totalTurnover = saleInvoices.reduce(
      (sum, inv) => sum + (inv.total_amount || 0),
      0
    );

    // Calculate composition tax (rate% of turnover)
    const compositionTaxPayable = (totalTurnover * compositionRate) / 100;

    // Calculate interest and late fee
    const { interest, lateFee } = this.calculateInterestAndLateFee(
      period,
      businessId,
      token
    );

    // Build response
    const response: Gstr4ResponseDto = {
      gstin: business.gstin,
      return_period: period,
      composition_rate: compositionRate,
      total_turnover: this.roundToTwoDecimals(totalTurnover),
      b2b,
      b2c,
      composition_tax_payable: this.roundToTwoDecimals(compositionTaxPayable),
      interest: this.roundToTwoDecimals(interest),
      late_fee: this.roundToTwoDecimals(lateFee),
    };

    // Cache the report
    await this.cacheReport(businessId, period, response);

    return response;
  }

  /**
   * Generate B2B section
   */
  private generateB2BSection(
    invoices: Invoice[],
    partyMap: Map<string, Party>
  ): Gstr4B2BInvoiceDto[] {
    const b2b: Gstr4B2BInvoiceDto[] = [];

    for (const invoice of invoices) {
      const party = partyMap.get(invoice.party_id);

      let invoiceDate: string;
      const invoiceDateValue = invoice.invoice_date as any;
      if (invoiceDateValue instanceof Date) {
        invoiceDate = invoiceDateValue.toISOString().split('T')[0];
      } else if (typeof invoiceDateValue === 'string') {
        invoiceDate = invoiceDateValue.split('T')[0];
      } else {
        invoiceDate = new Date().toISOString().split('T')[0];
      }

      b2b.push({
        invoice_number: invoice.invoice_number,
        invoice_date: invoiceDate,
        customer_gstin: party?.gstin || '',
        customer_name: party?.name,
        invoice_value: this.roundToTwoDecimals(invoice.total_amount || 0),
        place_of_supply: invoice.place_of_supply || 'N/A',
      });
    }

    return b2b;
  }

  /**
   * Generate B2C section
   */
  private generateB2CSection(
    invoices: Invoice[],
    partyMap: Map<string, Party>
  ): Gstr4B2CInvoiceDto[] {
    const b2c: Gstr4B2CInvoiceDto[] = [];

    for (const invoice of invoices) {
      const party = partyMap.get(invoice.party_id);

      let invoiceDate: string;
      const invoiceDateValue = invoice.invoice_date as any;
      if (invoiceDateValue instanceof Date) {
        invoiceDate = invoiceDateValue.toISOString().split('T')[0];
      } else if (typeof invoiceDateValue === 'string') {
        invoiceDate = invoiceDateValue.split('T')[0];
      } else {
        invoiceDate = new Date().toISOString().split('T')[0];
      }

      b2c.push({
        invoice_number: invoice.invoice_number,
        invoice_date: invoiceDate,
        customer_name: party?.name,
        invoice_value: this.roundToTwoDecimals(invoice.total_amount || 0),
        place_of_supply: invoice.place_of_supply || 'N/A',
      });
    }

    return b2c;
  }

  /**
   * Calculate interest and late fee
   */
  private calculateInterestAndLateFee(
    period: string,
    businessId: string,
    token: string
  ): { interest: number; lateFee: number } {
    // Parse period to get due date
    const { endDate } = PeriodParser.parse(period);
    
    // GSTR-4 due date is 18th of month following quarter end
    const dueDate = new Date(endDate);
    dueDate.setMonth(dueDate.getMonth() + 1);
    dueDate.setDate(18);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    dueDate.setHours(0, 0, 0, 0);

    // If not late, return 0
    if (today <= dueDate) {
      return { interest: 0, lateFee: 0 };
    }

    // Calculate days late
    const daysLate = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));

    // Interest: 18% per annum on tax payable
    const interest = 0; // Will be calculated with actual tax amount

    // Late fee: Rs. 200 per day (max Rs. 5000 for composition)
    const lateFeePerDay = 200;
    const maxLateFee = 5000;
    const lateFee = Math.min(daysLate * lateFeePerDay, maxLateFee);

    return {
      interest: this.roundToTwoDecimals(interest),
      lateFee: this.roundToTwoDecimals(lateFee),
    };
  }

  /**
   * Cache the generated report
   */
  private async cacheReport(
    businessId: string,
    period: string,
    reportData: Gstr4ResponseDto
  ): Promise<void> {
    try {
      const existingReport = await this.gstReportRepository.findCachedReport(
        businessId,
        'gstr4',
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
          report_type: 'gstr4',
          period,
          report_data: reportData,
          generated_at: new Date(),
        });
      }
    } catch (error) {
      this.logger.warn(`Failed to cache GSTR-4 report: ${error.message}`);
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

