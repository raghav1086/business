import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { InvoiceClientService, Invoice } from './invoice-client.service';
import { PartyClientService, Party } from './party-client.service';
import { BusinessClientService, Business } from './business-client.service';
import { Gstr2aImportRepository } from '../repositories/gstr2a-import.repository';
import { Gstr2aReconciliationRepository } from '../repositories/gstr2a-reconciliation.repository';
import { Gstr2aImportRequestDto, Gstr2aReconciliationResponseDto, Gstr2aReconciliationInvoiceDto, ManualMatchRequestDto } from '../dto/gstr2a-reconciliation.dto';
import { Gstr2aImport } from '../entities/gstr2a-import.entity';
import { Gstr2aReconciliation } from '../entities/gstr2a-reconciliation.entity';

/**
 * GSTR-2A Reconciliation Service
 * 
 * Handles GSTR-2A/2B import and reconciliation with purchase invoices.
 */
@Injectable()
export class Gstr2aReconciliationService {
  private readonly logger = new Logger(Gstr2aReconciliationService.name);

  constructor(
    private readonly invoiceClient: InvoiceClientService,
    private readonly partyClient: PartyClientService,
    private readonly businessClient: BusinessClientService,
    private readonly gstr2aImportRepository: Gstr2aImportRepository,
    private readonly gstr2aReconciliationRepository: Gstr2aReconciliationRepository,
  ) {}

  /**
   * Import GSTR-2A/2B data
   */
  async importGstr2a(
    businessId: string,
    importDto: Gstr2aImportRequestDto,
    userId: string,
    token: string
  ): Promise<Gstr2aImport> {
    this.logger.log(`Importing GSTR-2A for business ${businessId}, period ${importDto.period}`);

    // Validate JSON structure
    this.validateGstr2aData(importDto.data);

    // Parse invoices from GSTR-2A/2B
    const invoices = this.parseGstr2aInvoices(importDto.data);

    // Check if import already exists
    const existingImport = await this.gstr2aImportRepository.findByBusinessAndPeriod(
      businessId,
      importDto.period
    );

    const importData: Partial<Gstr2aImport> = {
      business_id: businessId,
      period: importDto.period,
      import_type: importDto.import_type,
      import_data: importDto.data,
      total_invoices: invoices.length,
      imported_at: new Date(),
      imported_by: userId,
    };

    let gstr2aImport: Gstr2aImport;
    if (existingImport) {
      // Update existing import
      await this.gstr2aImportRepository.update(existingImport.id, importData);
      gstr2aImport = await this.gstr2aImportRepository.findOne({ where: { id: existingImport.id } });
    } else {
      // Create new import
      gstr2aImport = await this.gstr2aImportRepository.create(importData);
    }

    // Perform reconciliation
    await this.performReconciliation(businessId, gstr2aImport.id, invoices, token);

    return gstr2aImport;
  }

  /**
   * Get reconciliation report
   */
  async getReconciliation(
    businessId: string,
    period: string,
    token: string
  ): Promise<Gstr2aReconciliationResponseDto> {
    this.logger.log(`Getting reconciliation for business ${businessId}, period ${period}`);

    // Get business
    const business = await this.businessClient.getBusiness(businessId, token);
    if (!business.gstin) {
      throw new BadRequestException('Business GSTIN is required');
    }

    // Get import
    const gstr2aImport = await this.gstr2aImportRepository.findByBusinessAndPeriod(
      businessId,
      period
    );

    if (!gstr2aImport) {
      throw new NotFoundException(`No GSTR-2A import found for period ${period}`);
    }

    // Get reconciliations
    const reconciliations = await this.gstr2aReconciliationRepository.findByImportId(
      gstr2aImport.id
    );

    // Get purchase invoices for the period
    const { startDate, endDate } = this.parsePeriod(period);
    const purchaseInvoices = await this.invoiceClient.getInvoicesByPeriod(
      businessId,
      startDate.toISOString().split('T')[0],
      endDate.toISOString().split('T')[0],
      token,
      false
    );

    const purchases = purchaseInvoices.filter((inv) => inv.invoice_type === 'purchase');

    // Categorize reconciliations
    const matched: Gstr2aReconciliationInvoiceDto[] = [];
    const missing: Gstr2aReconciliationInvoiceDto[] = [];
    const extra: Gstr2aReconciliationInvoiceDto[] = [];
    const mismatched: Gstr2aReconciliationInvoiceDto[] = [];

    for (const recon of reconciliations) {
      const invoiceDto: Gstr2aReconciliationInvoiceDto = {
        invoice_id: recon.invoice_id,
        supplier_invoice_number: recon.supplier_invoice_number,
        supplier_invoice_date: recon.supplier_invoice_date.toISOString().split('T')[0],
        supplier_gstin: recon.supplier_gstin,
        supplier_name: recon.supplier_name,
        taxable_value: recon.supplier_taxable_value,
        igst: recon.supplier_igst,
        cgst: recon.supplier_cgst,
        sgst: recon.supplier_sgst,
        cess: recon.supplier_cess,
        match_status: recon.match_status as any,
        match_details: recon.match_details,
      };

      if (recon.match_status === 'matched') {
        matched.push(invoiceDto);
      } else if (recon.match_status === 'missing') {
        missing.push(invoiceDto);
      } else if (recon.match_status === 'mismatched') {
        mismatched.push(invoiceDto);
      }
    }

    // Find extra invoices (in our system but not in GSTR-2A)
    const matchedInvoiceIds = new Set(
      reconciliations
        .filter((r) => r.invoice_id)
        .map((r) => r.invoice_id!)
    );

    for (const invoice of purchases) {
      if (!matchedInvoiceIds.has(invoice.id)) {
        // Try to find party details
        let supplierGstin = '';
        let supplierName = '';
        try {
          const party = await this.partyClient.getParty(businessId, invoice.party_id, token);
          supplierGstin = party.gstin || '';
          supplierName = party.name || '';
        } catch (error) {
          this.logger.warn(`Failed to fetch party ${invoice.party_id}: ${error.message}`);
        }

        let invoiceDate: string;
        const invoiceDateValue = invoice.invoice_date as any;
        if (invoiceDateValue instanceof Date) {
          invoiceDate = invoiceDateValue.toISOString().split('T')[0];
        } else if (typeof invoiceDateValue === 'string') {
          invoiceDate = invoiceDateValue.split('T')[0];
        } else {
          invoiceDate = new Date().toISOString().split('T')[0];
        }

        extra.push({
          invoice_id: invoice.id,
          supplier_invoice_number: invoice.invoice_number,
          supplier_invoice_date: invoiceDate,
          supplier_gstin: supplierGstin,
          supplier_name: supplierName,
          taxable_value: invoice.taxable_amount || 0,
          igst: invoice.igst_amount || 0,
          cgst: invoice.cgst_amount || 0,
          sgst: invoice.sgst_amount || 0,
          cess: invoice.cess_amount || 0,
          match_status: 'extra',
        });
      }
    }

    return {
      gstin: business.gstin,
      period,
      import_type: gstr2aImport.import_type,
      total_gstr2a_invoices: gstr2aImport.total_invoices,
      total_purchase_invoices: purchases.length,
      matched_count: matched.length,
      missing_count: missing.length,
      extra_count: extra.length,
      mismatched_count: mismatched.length,
      matched,
      missing,
      extra,
      mismatched,
    };
  }

  /**
   * Manually match an invoice
   */
  async manualMatch(
    businessId: string,
    matchDto: ManualMatchRequestDto,
    token: string
  ): Promise<Gstr2aReconciliation> {
    this.logger.log(`Manual match for reconciliation ${matchDto.reconciliation_id}`);

    // Get reconciliation
    const reconciliation = await this.gstr2aReconciliationRepository.findOne({
      where: { id: matchDto.reconciliation_id },
    });

    if (!reconciliation) {
      throw new NotFoundException('Reconciliation not found');
    }

    if (reconciliation.business_id !== businessId) {
      throw new BadRequestException('Reconciliation does not belong to this business');
    }

    // Get invoice
    const invoice = await this.invoiceClient.getInvoiceById(
      businessId,
      matchDto.invoice_id,
      token
    );

    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    // Verify match
    const matchDetails = this.verifyMatch(reconciliation, invoice);

    // Update reconciliation
    await this.gstr2aReconciliationRepository.update(reconciliation.id, {
      invoice_id: matchDto.invoice_id,
      match_status: matchDetails.isMatch ? 'matched' : 'mismatched',
      match_details: matchDetails,
      is_manual_match: true,
    });

    return this.gstr2aReconciliationRepository.findOne({
      where: { id: reconciliation.id },
    }) as Promise<Gstr2aReconciliation>;
  }

  /**
   * Validate GSTR-2A/2B data structure
   */
  private validateGstr2aData(data: any): void {
    if (!data || typeof data !== 'object') {
      throw new BadRequestException('Invalid GSTR-2A/2B data format');
    }

    // Basic validation - GSTR-2A/2B should have b2b section
    if (!data.b2b && !data.cdnr) {
      throw new BadRequestException('GSTR-2A/2B data must contain b2b or cdnr section');
    }
  }

  /**
   * Parse invoices from GSTR-2A/2B data
   */
  private parseGstr2aInvoices(data: any): any[] {
    const invoices: any[] = [];

    // Parse B2B invoices
    if (data.b2b && Array.isArray(data.b2b)) {
      for (const supplier of data.b2b) {
        if (supplier.inv && Array.isArray(supplier.inv)) {
          for (const inv of supplier.inv) {
            invoices.push({
              supplier_gstin: supplier.ctin,
              supplier_name: supplier.name,
              invoice_number: inv.inum,
              invoice_date: inv.idt,
              taxable_value: inv.val || 0,
              igst: inv.itms?.reduce((sum: number, item: any) => sum + (item.itm_det?.iamt || 0), 0) || 0,
              cgst: inv.itms?.reduce((sum: number, item: any) => sum + (item.itm_det?.camt || 0), 0) || 0,
              sgst: inv.itms?.reduce((sum: number, item: any) => sum + (item.itm_det?.samt || 0), 0) || 0,
              cess: inv.itms?.reduce((sum: number, item: any) => sum + (item.itm_det?.csamt || 0), 0) || 0,
            });
          }
        }
      }
    }

    // Parse CDNR (Credit/Debit Notes)
    if (data.cdnr && Array.isArray(data.cdnr)) {
      for (const supplier of data.cdnr) {
        if (supplier.nt && Array.isArray(supplier.nt)) {
          for (const note of supplier.nt) {
            invoices.push({
              supplier_gstin: supplier.ctin,
              supplier_name: supplier.name,
              invoice_number: note.nt_num,
              invoice_date: note.nt_dt,
              taxable_value: note.nt_val || 0,
              igst: note.itms?.reduce((sum: number, item: any) => sum + (item.itm_det?.iamt || 0), 0) || 0,
              cgst: note.itms?.reduce((sum: number, item: any) => sum + (item.itm_det?.camt || 0), 0) || 0,
              sgst: note.itms?.reduce((sum: number, item: any) => sum + (item.itm_det?.samt || 0), 0) || 0,
              cess: note.itms?.reduce((sum: number, item: any) => sum + (item.itm_det?.csamt || 0), 0) || 0,
            });
          }
        }
      }
    }

    return invoices;
  }

  /**
   * Perform reconciliation
   */
  private async performReconciliation(
    businessId: string,
    importId: string,
    gstr2aInvoices: any[],
    token: string
  ): Promise<void> {
    // Get all purchase invoices for the period
    // We'll need to extract period from import
    const importRecord = await this.gstr2aImportRepository.findOne({
      where: { id: importId },
    });

    if (!importRecord) {
      throw new NotFoundException('Import record not found');
    }

    const { startDate, endDate } = this.parsePeriod(importRecord.period);
    const purchaseInvoices = await this.invoiceClient.getInvoicesByPeriod(
      businessId,
      startDate.toISOString().split('T')[0],
      endDate.toISOString().split('T')[0],
      token,
      false
    );

    const purchases = purchaseInvoices.filter((inv) => inv.invoice_type === 'purchase');

    // Create a map of our invoices by supplier GSTIN and invoice number
    const invoiceMap = new Map<string, Invoice>();
    for (const invoice of purchases) {
      try {
        const party = await this.partyClient.getParty(businessId, invoice.party_id, token);
        const key = `${party.gstin || ''}_${invoice.invoice_number}`;
        invoiceMap.set(key, invoice);
      } catch (error) {
        this.logger.warn(`Failed to fetch party ${invoice.party_id}: ${error.message}`);
      }
    }

    // Match GSTR-2A invoices with our purchase invoices
    let matchedCount = 0;
    let missingCount = 0;
    let mismatchedCount = 0;

    for (const gstr2aInv of gstr2aInvoices) {
      const key = `${gstr2aInv.supplier_gstin}_${gstr2aInv.invoice_number}`;
      const ourInvoice = invoiceMap.get(key);

      const invoiceDate = new Date(gstr2aInv.invoice_date);

      if (ourInvoice) {
        // Check if amounts match
        const isMatch = this.compareAmounts(gstr2aInv, ourInvoice);
        
        await this.gstr2aReconciliationRepository.create({
          business_id: businessId,
          gstr2a_import_id: importId,
          invoice_id: ourInvoice.id,
          period: importRecord.period,
          supplier_invoice_number: gstr2aInv.invoice_number,
          supplier_invoice_date: invoiceDate,
          supplier_gstin: gstr2aInv.supplier_gstin,
          supplier_name: gstr2aInv.supplier_name,
          supplier_taxable_value: gstr2aInv.taxable_value,
          supplier_igst: gstr2aInv.igst,
          supplier_cgst: gstr2aInv.cgst,
          supplier_sgst: gstr2aInv.sgst,
          supplier_cess: gstr2aInv.cess,
          match_status: isMatch ? 'matched' : 'mismatched',
          match_details: isMatch ? null : {
            reason: 'Amount mismatch',
            gstr2a_amount: gstr2aInv.taxable_value + gstr2aInv.igst + gstr2aInv.cgst + gstr2aInv.sgst + gstr2aInv.cess,
            our_amount: (ourInvoice.taxable_amount || 0) + (ourInvoice.igst_amount || 0) + (ourInvoice.cgst_amount || 0) + (ourInvoice.sgst_amount || 0) + (ourInvoice.cess_amount || 0),
          },
        });

        if (isMatch) {
          matchedCount++;
        } else {
          mismatchedCount++;
        }
      } else {
        // Missing invoice
        await this.gstr2aReconciliationRepository.create({
          business_id: businessId,
          gstr2a_import_id: importId,
          period: importRecord.period,
          supplier_invoice_number: gstr2aInv.invoice_number,
          supplier_invoice_date: invoiceDate,
          supplier_gstin: gstr2aInv.supplier_gstin,
          supplier_name: gstr2aInv.supplier_name,
          supplier_taxable_value: gstr2aInv.taxable_value,
          supplier_igst: gstr2aInv.igst,
          supplier_cgst: gstr2aInv.cgst,
          supplier_sgst: gstr2aInv.sgst,
          supplier_cess: gstr2aInv.cess,
          match_status: 'missing',
        });

        missingCount++;
      }
    }

    // Update import statistics
    await this.gstr2aImportRepository.update(importId, {
      matched_invoices: matchedCount,
      missing_invoices: missingCount,
      mismatched_invoices: mismatchedCount,
    });
  }

  /**
   * Compare amounts between GSTR-2A and our invoice
   */
  private compareAmounts(gstr2aInv: any, ourInvoice: Invoice): boolean {
    const tolerance = 0.01; // Allow 1 paisa difference

    const gstr2aTotal = gstr2aInv.taxable_value + gstr2aInv.igst + gstr2aInv.cgst + gstr2aInv.sgst + gstr2aInv.cess;
    const ourTotal = (ourInvoice.taxable_amount || 0) + 
                     (ourInvoice.igst_amount || 0) + 
                     (ourInvoice.cgst_amount || 0) + 
                     (ourInvoice.sgst_amount || 0) + 
                     (ourInvoice.cess_amount || 0);

    return Math.abs(gstr2aTotal - ourTotal) <= tolerance;
  }

  /**
   * Verify match between reconciliation and invoice
   */
  private verifyMatch(reconciliation: Gstr2aReconciliation, invoice: Invoice): any {
    const isMatch = this.compareAmounts(
      {
        taxable_value: reconciliation.supplier_taxable_value,
        igst: reconciliation.supplier_igst,
        cgst: reconciliation.supplier_cgst,
        sgst: reconciliation.supplier_sgst,
        cess: reconciliation.supplier_cess,
      },
      invoice
    );

    return {
      isMatch,
      reason: isMatch ? null : 'Amount mismatch',
      gstr2a_amount: reconciliation.supplier_taxable_value + 
                     reconciliation.supplier_igst + 
                     reconciliation.supplier_cgst + 
                     reconciliation.supplier_sgst + 
                     reconciliation.supplier_cess,
      our_amount: (invoice.taxable_amount || 0) + 
                  (invoice.igst_amount || 0) + 
                  (invoice.cgst_amount || 0) + 
                  (invoice.sgst_amount || 0) + 
                  (invoice.cess_amount || 0),
    };
  }

  /**
   * Parse period to date range
   */
  private parsePeriod(period: string): { startDate: Date; endDate: Date } {
    if (period.startsWith('Q')) {
      // Quarterly: Q1-2024
      const [quarter, year] = period.split('-');
      const q = parseInt(quarter.substring(1));
      const y = parseInt(year);
      
      let startMonth: number;
      if (q === 1) startMonth = 0; // January
      else if (q === 2) startMonth = 3; // April
      else if (q === 3) startMonth = 6; // July
      else startMonth = 9; // October
      
      const startDate = new Date(y, startMonth, 1);
      const endDate = new Date(y, startMonth + 3, 0); // Last day of quarter
      
      return { startDate, endDate };
    } else {
      // Monthly: MMYYYY
      const month = parseInt(period.substring(0, 2)) - 1;
      const year = parseInt(period.substring(2, 6));
      
      const startDate = new Date(year, month, 1);
      const endDate = new Date(year, month + 1, 0); // Last day of month
      
      return { startDate, endDate };
    }
  }
}

