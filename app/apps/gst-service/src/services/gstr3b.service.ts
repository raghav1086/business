import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { InvoiceClientService, Invoice } from './invoice-client.service';
import { BusinessClientService, Business } from './business-client.service';
import { GstReportRepository } from '../repositories/gst-report.repository';
import { BusinessGstSettingsRepository } from '../repositories/business-gst-settings.repository';
import { PeriodParser } from '../utils/period-parser.util';
import { Gstr3bResponseDto, Gstr3bOutputTaxDto, Gstr3bOutputTaxByRateDto, Gstr3bItcDto, Gstr3bItcByRateDto, Gstr3bRcmDto, Gstr3bPaymentDto } from '../dto/gstr3b.dto';

/**
 * GSTR-3B Service
 * 
 * Generates GSTR-3B summary report for monthly/quarterly GST filing.
 */
@Injectable()
export class Gstr3bService {
  private readonly logger = new Logger(Gstr3bService.name);

  constructor(
    private readonly invoiceClient: InvoiceClientService,
    private readonly businessClient: BusinessClientService,
    private readonly gstReportRepository: GstReportRepository,
    private readonly businessGstSettingsRepository: BusinessGstSettingsRepository,
  ) {}

  /**
   * Generate GSTR-3B report
   */
  async generateGstr3b(
    businessId: string,
    period: string,
    token: string
  ): Promise<Gstr3bResponseDto> {
    this.logger.log(`Generating GSTR-3B for business ${businessId}, period ${period}`);

    // Validate period format
    if (!PeriodParser.isValid(period)) {
      throw new BadRequestException(
        `Invalid period format: ${period}. Expected MMYYYY (e.g., 122024) or Q1-YYYY (e.g., Q1-2024)`
      );
    }

    // Check cache
    const isCacheFresh = await this.gstReportRepository.isCacheFresh(
      businessId,
      'gstr3b',
      period
    );

    if (isCacheFresh) {
      this.logger.log(`Returning cached GSTR-3B report for period ${period}`);
      const cachedReport = await this.gstReportRepository.findCachedReport(
        businessId,
        'gstr3b',
        period
      );
      if (cachedReport) {
        return cachedReport.report_data as Gstr3bResponseDto;
      }
    }

    // Parse period to date range
    const { startDate, endDate } = PeriodParser.parse(period);

    // Get business details
    const business = await this.businessClient.getBusiness(businessId, token);
    if (!business.gstin) {
      throw new BadRequestException('Business GSTIN is required for GSTR-3B generation');
    }

    // Fetch sale invoices for the period (output tax)
    const saleInvoices = await this.invoiceClient.getInvoicesByPeriod(
      businessId,
      startDate.toISOString().split('T')[0],
      endDate.toISOString().split('T')[0],
      token,
      true // include items
    );

    const sales = saleInvoices.filter((inv) => inv.invoice_type === 'sale');

    // Fetch purchase invoices for the period (input tax credit)
    const purchaseInvoices = await this.invoiceClient.getInvoicesByPeriod(
      businessId,
      startDate.toISOString().split('T')[0],
      endDate.toISOString().split('T')[0],
      token,
      true // include items
    );

    const purchases = purchaseInvoices.filter((inv) => inv.invoice_type === 'purchase');

    // Generate output tax summary
    const outputTax = this.generateOutputTax(sales);

    // Generate ITC summary
    const itc = this.generateItc(purchases);

    // Generate RCM summary
    const rcm = this.generateRcm(purchases, sales);

    // Calculate interest and late fee
    const { interest, lateFee } = this.calculateInterestAndLateFee(
      period,
      businessId,
      token
    );

    // Calculate net tax payable (including RCM)
    const netTaxPayable = this.calculateNetTaxPayable(outputTax, itc, rcm);

    // Get payment details
    const payments = await this.getPaymentDetails(
      businessId,
      startDate,
      endDate,
      token
    );

    // Build response
    const response: Gstr3bResponseDto = {
      gstin: business.gstin,
      return_period: period,
      output_tax: outputTax,
      itc: itc,
      rcm: rcm,
      net_tax_payable: this.roundToTwoDecimals(netTaxPayable),
      interest: this.roundToTwoDecimals(interest),
      late_fee: this.roundToTwoDecimals(lateFee),
      payments: payments.length > 0 ? payments : undefined,
    };

    // Cache the report
    await this.cacheReport(businessId, period, response);

    return response;
  }

  /**
   * Generate output tax summary from sale invoices
   */
  private generateOutputTax(invoices: Invoice[]): Gstr3bOutputTaxDto {
    // Group by tax rate
    const taxByRate = new Map<number, {
      taxable_value: number;
      igst: number;
      cgst: number;
      sgst: number;
      cess: number;
    }>();

    let totalTaxableValue = 0;
    let totalIgst = 0;
    let totalCgst = 0;
    let totalSgst = 0;
    let totalCess = 0;

    for (const invoice of invoices) {
      // Skip export invoices (zero-rated)
      if (invoice.is_export) {
        continue;
      }

      for (const item of invoice.items || []) {
        const rate = item.tax_rate || 0;
        const taxableValue = item.taxable_amount || 0;
        const igst = item.igst_amount || 0;
        const cgst = item.cgst_amount || 0;
        const sgst = item.sgst_amount || 0;
        const cess = item.cess_amount || 0;

        if (!taxByRate.has(rate)) {
          taxByRate.set(rate, {
            taxable_value: 0,
            igst: 0,
            cgst: 0,
            sgst: 0,
            cess: 0,
          });
        }

        const summary = taxByRate.get(rate)!;
        summary.taxable_value += taxableValue;
        summary.igst += igst;
        summary.cgst += cgst;
        summary.sgst += sgst;
        summary.cess += cess;

        totalTaxableValue += taxableValue;
        totalIgst += igst;
        totalCgst += cgst;
        totalSgst += sgst;
        totalCess += cess;
      }
    }

    // Build by_rate array
    const byRate: Gstr3bOutputTaxByRateDto[] = [];
    for (const [rate, totals] of taxByRate.entries()) {
      byRate.push({
        rate,
        taxable_value: this.roundToTwoDecimals(totals.taxable_value),
        igst: this.roundToTwoDecimals(totals.igst),
        cgst: this.roundToTwoDecimals(totals.cgst),
        sgst: this.roundToTwoDecimals(totals.sgst),
        cess: this.roundToTwoDecimals(totals.cess),
      });
    }

    // Sort by rate
    byRate.sort((a, b) => a.rate - b.rate);

    return {
      total_taxable_value: this.roundToTwoDecimals(totalTaxableValue),
      total_igst: this.roundToTwoDecimals(totalIgst),
      total_cgst: this.roundToTwoDecimals(totalCgst),
      total_sgst: this.roundToTwoDecimals(totalSgst),
      total_cess: this.roundToTwoDecimals(totalCess),
      by_rate: byRate,
    };
  }

  /**
   * Generate ITC summary from purchase invoices
   */
  private generateItc(purchases: Invoice[]): Gstr3bItcDto {
    // Group by tax rate
    const itcByRate = new Map<number, {
      taxable_value: number;
      igst_itc: number;
      cgst_itc: number;
      sgst_itc: number;
      cess_itc: number;
    }>();

    let totalEligibleItc = 0;
    let totalIneligibleItc = 0;
    let igstItc = 0;
    let cgstItc = 0;
    let sgstItc = 0;
    let cessItc = 0;
    let itcReversal = 0;

    for (const invoice of purchases) {
      // Skip RCM invoices (tax paid on reverse charge - handled separately)
      if (invoice.is_rcm) {
        continue;
      }

      for (const item of invoice.items || []) {
        const rate = item.tax_rate || 0;
        const taxableValue = item.taxable_amount || 0;
        const igst = item.igst_amount || 0;
        const cgst = item.cgst_amount || 0;
        const sgst = item.sgst_amount || 0;
        const cess = item.cess_amount || 0;

        const itemItc = igst + cgst + sgst + cess;

        // Group by rate
        if (!itcByRate.has(rate)) {
          itcByRate.set(rate, {
            taxable_value: 0,
            igst_itc: 0,
            cgst_itc: 0,
            sgst_itc: 0,
            cess_itc: 0,
          });
        }

        const summary = itcByRate.get(rate)!;
        summary.taxable_value += taxableValue;
        summary.igst_itc += igst;
        summary.cgst_itc += cgst;
        summary.sgst_itc += sgst;
        summary.cess_itc += cess;

        // For now, assume all ITC is eligible
        // In a real implementation, we'd check for:
        // - Blocked credits (Section 17(5))
        // - Personal use items
        // - Exempt supplies
        // - Non-business use
        totalEligibleItc += itemItc;
        igstItc += igst;
        cgstItc += cgst;
        sgstItc += sgst;
        cessItc += cess;

        // ITC reversal would be calculated based on:
        // - Credit notes received
        // - Payment not made within 180 days
        // - Goods/services used for exempt supplies
        // For now, set to 0
      }
    }

    // Build by_rate array
    const byRate: Gstr3bItcByRateDto[] = [];
    for (const [rate, totals] of itcByRate.entries()) {
      byRate.push({
        rate,
        taxable_value: this.roundToTwoDecimals(totals.taxable_value),
        igst_itc: this.roundToTwoDecimals(totals.igst_itc),
        cgst_itc: this.roundToTwoDecimals(totals.cgst_itc),
        sgst_itc: this.roundToTwoDecimals(totals.sgst_itc),
        cess_itc: this.roundToTwoDecimals(totals.cess_itc),
      });
    }

    // Sort by rate
    byRate.sort((a, b) => a.rate - b.rate);

    const netItcAvailable = totalEligibleItc - itcReversal;

    return {
      total_eligible_itc: this.roundToTwoDecimals(totalEligibleItc),
      total_ineligible_itc: this.roundToTwoDecimals(totalIneligibleItc),
      igst_itc: this.roundToTwoDecimals(igstItc),
      cgst_itc: this.roundToTwoDecimals(cgstItc),
      sgst_itc: this.roundToTwoDecimals(sgstItc),
      cess_itc: this.roundToTwoDecimals(cessItc),
      by_rate: byRate,
      itc_reversal: this.roundToTwoDecimals(itcReversal),
      net_itc_available: this.roundToTwoDecimals(netItcAvailable),
    };
  }

  /**
   * Generate RCM (Reverse Charge Mechanism) summary
   */
  private generateRcm(purchases: Invoice[], sales: Invoice[]): Gstr3bRcmDto {
    let rcmTaxableValue = 0;
    let rcmIgst = 0;
    let rcmCgst = 0;
    let rcmSgst = 0;
    let rcmCess = 0;

    // RCM tax from purchase invoices (where we pay tax on behalf of supplier)
    for (const invoice of purchases) {
      if (invoice.is_rcm) {
        rcmTaxableValue += invoice.taxable_amount || 0;
        rcmIgst += invoice.igst_amount || 0;
        rcmCgst += invoice.cgst_amount || 0;
        rcmSgst += invoice.sgst_amount || 0;
        rcmCess += invoice.cess_amount || 0;
      }
    }

    // RCM ITC (ITC available on RCM tax paid)
    // In RCM, we can claim ITC on the tax we paid
    const rcmItcIgst = rcmIgst;
    const rcmItcCgst = rcmCgst;
    const rcmItcSgst = rcmSgst;
    const rcmItcCess = rcmCess;

    // RCM payable = RCM tax - RCM ITC (usually 0 since ITC equals tax)
    const rcmPayable = (rcmIgst + rcmCgst + rcmSgst + rcmCess) - 
                       (rcmItcIgst + rcmItcCgst + rcmItcSgst + rcmItcCess);

    return {
      rcm_taxable_value: this.roundToTwoDecimals(rcmTaxableValue),
      rcm_igst: this.roundToTwoDecimals(rcmIgst),
      rcm_cgst: this.roundToTwoDecimals(rcmCgst),
      rcm_sgst: this.roundToTwoDecimals(rcmSgst),
      rcm_cess: this.roundToTwoDecimals(rcmCess),
      rcm_itc_igst: this.roundToTwoDecimals(rcmItcIgst),
      rcm_itc_cgst: this.roundToTwoDecimals(rcmItcCgst),
      rcm_itc_sgst: this.roundToTwoDecimals(rcmItcSgst),
      rcm_itc_cess: this.roundToTwoDecimals(rcmItcCess),
      rcm_payable: this.roundToTwoDecimals(rcmPayable),
    };
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
    
    // GSTR-3B due date is 20th of next month (for monthly) or 22nd/24th of next month (for quarterly)
    const isQuarterly = period.startsWith('Q');
    let dueDate: Date;
    
    if (isQuarterly) {
      // Quarterly: Due on 22nd or 24th of month following quarter end
      // For simplicity, use 22nd
      dueDate = new Date(endDate);
      dueDate.setMonth(dueDate.getMonth() + 1);
      dueDate.setDate(22);
    } else {
      // Monthly: Due on 20th of next month
      dueDate = new Date(endDate);
      dueDate.setMonth(dueDate.getMonth() + 1);
      dueDate.setDate(20);
    }

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
    // For now, we'll calculate this when we have the tax amount
    // Interest = (Tax Payable * 18 * Days Late) / (100 * 365)
    const interest = 0; // Will be calculated with actual tax amount

    // Late fee: Rs. 50 per day (max Rs. 5000 for regular, Rs. 200 for composition)
    const lateFeePerDay = 50;
    const maxLateFee = 5000;
    const lateFee = Math.min(daysLate * lateFeePerDay, maxLateFee);

    return {
      interest: this.roundToTwoDecimals(interest),
      lateFee: this.roundToTwoDecimals(lateFee),
    };
  }

  /**
   * Get payment details
   */
  private async getPaymentDetails(
    businessId: string,
    startDate: Date,
    endDate: Date,
    token: string
  ): Promise<Gstr3bPaymentDto[]> {
    // TODO: Integrate with payment service to get GST challan payments
    // For now, return empty array
    // In a full implementation, we'd:
    // 1. Query payment service for GST payments in the period
    // 2. Extract challan details
    // 3. Map to GSTR-3B payment format

    return [];
  }

  /**
   * Calculate net tax payable
   */
  private calculateNetTaxPayable(
    outputTax: Gstr3bOutputTaxDto,
    itc: Gstr3bItcDto,
    rcm: Gstr3bRcmDto
  ): number {
    const totalOutputTax = outputTax.total_igst + outputTax.total_cgst + outputTax.total_sgst + outputTax.total_cess;
    const totalItc = itc.net_itc_available; // Use net ITC (after reversal)
    const totalRcmPayable = rcm.rcm_payable;

    // Net tax = Output tax - ITC + RCM payable
    return totalOutputTax - totalItc + totalRcmPayable;
  }

  /**
   * Cache the generated report
   */
  private async cacheReport(
    businessId: string,
    period: string,
    reportData: Gstr3bResponseDto
  ): Promise<void> {
    try {
      const existingReport = await this.gstReportRepository.findCachedReport(
        businessId,
        'gstr3b',
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
          report_type: 'gstr3b',
          period,
          report_data: reportData,
          generated_at: new Date(),
        });
      }
    } catch (error) {
      this.logger.warn(`Failed to cache GSTR-3B report: ${error.message}`);
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

