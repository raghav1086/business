import { Injectable, Logger } from '@nestjs/common';
import * as ExcelJS from 'exceljs';
import { Gstr1ResponseDto } from '../dto/gstr1.dto';
import { Gstr3bResponseDto } from '../dto/gstr3b.dto';
import { Gstr4ResponseDto } from '../dto/gstr4.dto';

/**
 * Excel Export Service
 * 
 * Generates Excel files for GST reports.
 */
@Injectable()
export class ExcelExportService {
  private readonly logger = new Logger(ExcelExportService.name);

  /**
   * Export GSTR-1 to Excel
   */
  async exportGstr1ToExcel(report: Gstr1ResponseDto): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    
    // Add metadata
    workbook.creator = 'Business Management System';
    workbook.created = new Date();
    workbook.modified = new Date();

    // Sheet 1: Summary
    const summarySheet = workbook.addWorksheet('Summary');
    summarySheet.columns = [
      { header: 'GSTIN', key: 'gstin', width: 20 },
      { header: 'Return Period', key: 'period', width: 15 },
      { header: 'B2B Invoices', key: 'b2b_count', width: 15 },
      { header: 'B2C Small Invoices', key: 'b2c_small_count', width: 20 },
      { header: 'B2C Large Invoices', key: 'b2c_large_count', width: 20 },
      { header: 'Export Invoices', key: 'export_count', width: 18 },
    ];

    const b2bCount = report.b2b.reduce((sum, customer) => sum + customer.invoices.length, 0);
    const b2cLargeCount = report.b2c_large?.length || 0;
    const exportCount = report.export?.length || 0;

    summarySheet.addRow({
      gstin: report.gstin,
      period: report.return_period,
      b2b_count: b2bCount,
      b2c_small_count: 'Summary',
      b2c_large_count: b2cLargeCount,
      export_count: exportCount,
    });

    // Sheet 2: B2B
    if (report.b2b.length > 0) {
      const b2bSheet = workbook.addWorksheet('B2B');
      b2bSheet.columns = [
        { header: 'Customer GSTIN', key: 'customer_gstin', width: 20 },
        { header: 'Customer Name', key: 'customer_name', width: 30 },
        { header: 'Invoice Number', key: 'invoice_number', width: 20 },
        { header: 'Invoice Date', key: 'invoice_date', width: 15 },
        { header: 'Invoice Value', key: 'invoice_value', width: 15 },
        { header: 'Place of Supply', key: 'place_of_supply', width: 20 },
        { header: 'Tax Rate', key: 'rate', width: 12 },
        { header: 'Taxable Value', key: 'taxable_value', width: 15 },
        { header: 'CGST', key: 'cgst', width: 12 },
        { header: 'SGST', key: 'sgst', width: 12 },
        { header: 'IGST', key: 'igst', width: 12 },
        { header: 'CESS', key: 'cess', width: 12 },
      ];

      for (const customer of report.b2b) {
        for (const invoice of customer.invoices) {
          for (const item of invoice.items) {
            b2bSheet.addRow({
              customer_gstin: customer.customer_gstin,
              customer_name: customer.customer_name || '',
              invoice_number: invoice.invoice_number,
              invoice_date: invoice.invoice_date,
              invoice_value: invoice.invoice_value,
              place_of_supply: invoice.place_of_supply,
              rate: item.rate,
              taxable_value: item.taxable_value,
              cgst: item.cgst,
              sgst: item.sgst,
              igst: item.igst,
              cess: item.cess,
            });
          }
        }
      }

      // Format header row
      b2bSheet.getRow(1).font = { bold: true };
      b2bSheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' },
      };
    }

    // Sheet 3: B2C Small
    if (report.b2c_small.length > 0) {
      const b2cSmallSheet = workbook.addWorksheet('B2C Small');
      b2cSmallSheet.columns = [
        { header: 'Place of Supply', key: 'place_of_supply', width: 20 },
        { header: 'Tax Rate', key: 'rate', width: 12 },
        { header: 'Taxable Value', key: 'taxable_value', width: 15 },
        { header: 'CGST', key: 'cgst', width: 12 },
        { header: 'SGST', key: 'sgst', width: 12 },
        { header: 'IGST', key: 'igst', width: 12 },
        { header: 'CESS', key: 'cess', width: 12 },
      ];

      for (const summary of report.b2c_small) {
        b2cSmallSheet.addRow({
          place_of_supply: summary.place_of_supply,
          rate: summary.rate,
          taxable_value: summary.taxable_value,
          cgst: summary.cgst,
          sgst: summary.sgst,
          igst: summary.igst,
          cess: summary.cess,
        });
      }

      b2cSmallSheet.getRow(1).font = { bold: true };
      b2cSmallSheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' },
      };
    }

    // Sheet 4: B2C Large
    if (report.b2c_large && report.b2c_large.length > 0) {
      const b2cLargeSheet = workbook.addWorksheet('B2C Large');
      b2cLargeSheet.columns = [
        { header: 'Invoice Number', key: 'invoice_number', width: 20 },
        { header: 'Invoice Date', key: 'invoice_date', width: 15 },
        { header: 'Invoice Value', key: 'invoice_value', width: 15 },
        { header: 'Place of Supply', key: 'place_of_supply', width: 20 },
        { header: 'Customer Name', key: 'customer_name', width: 30 },
        { header: 'Customer Address', key: 'customer_address', width: 40 },
        { header: 'Tax Rate', key: 'rate', width: 12 },
        { header: 'Taxable Value', key: 'taxable_value', width: 15 },
        { header: 'CGST', key: 'cgst', width: 12 },
        { header: 'SGST', key: 'sgst', width: 12 },
        { header: 'IGST', key: 'igst', width: 12 },
        { header: 'CESS', key: 'cess', width: 12 },
      ];

      for (const invoice of report.b2c_large) {
        for (const item of invoice.items) {
          b2cLargeSheet.addRow({
            invoice_number: invoice.invoice_number,
            invoice_date: invoice.invoice_date,
            invoice_value: invoice.invoice_value,
            place_of_supply: invoice.place_of_supply,
            customer_name: invoice.customer_name || '',
            customer_address: invoice.customer_address || '',
            rate: item.rate,
            taxable_value: item.taxable_value,
            cgst: item.cgst,
            sgst: item.sgst,
            igst: item.igst,
            cess: item.cess,
          });
        }
      }

      b2cLargeSheet.getRow(1).font = { bold: true };
      b2cLargeSheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' },
      };
    }

    // Sheet 5: Export
    if (report.export && report.export.length > 0) {
      const exportSheet = workbook.addWorksheet('Export');
      exportSheet.columns = [
        { header: 'Invoice Number', key: 'invoice_number', width: 20 },
        { header: 'Invoice Date', key: 'invoice_date', width: 15 },
        { header: 'Invoice Value', key: 'invoice_value', width: 15 },
        { header: 'Port Code', key: 'port_code', width: 15 },
        { header: 'Shipping Bill Number', key: 'shipping_bill_number', width: 20 },
        { header: 'Shipping Bill Date', key: 'shipping_bill_date', width: 15 },
        { header: 'Taxable Value', key: 'taxable_value', width: 15 },
      ];

      for (const invoice of report.export) {
        for (const item of invoice.items) {
          exportSheet.addRow({
            invoice_number: invoice.invoice_number,
            invoice_date: invoice.invoice_date,
            invoice_value: invoice.invoice_value,
            port_code: invoice.port_code || '',
            shipping_bill_number: invoice.shipping_bill_number || '',
            shipping_bill_date: invoice.shipping_bill_date || '',
            taxable_value: item.taxable_value,
          });
        }
      }

      exportSheet.getRow(1).font = { bold: true };
      exportSheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' },
      };
    }

    // Sheet 6: CDNR (Credit/Debit Notes)
    if (report.cdnr && report.cdnr.length > 0) {
      const cdnrSheet = workbook.addWorksheet('CDNR');
      cdnrSheet.columns = [
        { header: 'Original Invoice Number', key: 'original_invoice_number', width: 25 },
        { header: 'Original Invoice Date', key: 'original_invoice_date', width: 18 },
        { header: 'Note Type', key: 'note_type', width: 12 },
        { header: 'Note Number', key: 'note_number', width: 20 },
        { header: 'Note Date', key: 'note_date', width: 15 },
        { header: 'Reason Code', key: 'reason_code', width: 12 },
        { header: 'Note Value', key: 'note_value', width: 15 },
        { header: 'Taxable Value', key: 'taxable_value', width: 15 },
        { header: 'CGST', key: 'cgst', width: 12 },
        { header: 'SGST', key: 'sgst', width: 12 },
        { header: 'IGST', key: 'igst', width: 12 },
        { header: 'CESS', key: 'cess', width: 12 },
      ];

      for (const cdnr of report.cdnr) {
        cdnrSheet.addRow({
          original_invoice_number: cdnr.original_invoice_number,
          original_invoice_date: cdnr.original_invoice_date,
          note_type: cdnr.note_type.toUpperCase(),
          note_number: cdnr.note_number,
          note_date: cdnr.note_date,
          reason_code: cdnr.reason_code,
          note_value: cdnr.note_value,
          taxable_value: cdnr.taxable_value,
          cgst: cdnr.cgst,
          sgst: cdnr.sgst,
          igst: cdnr.igst,
          cess: cdnr.cess,
        });
      }

      cdnrSheet.getRow(1).font = { bold: true };
      cdnrSheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' },
      };
    }

    // Sheet 7: Advance Receipts
    if (report.advance_receipts && report.advance_receipts.length > 0) {
      const advanceSheet = workbook.addWorksheet('Advance Receipts');
      advanceSheet.columns = [
        { header: 'Receipt Number', key: 'receipt_number', width: 20 },
        { header: 'Receipt Date', key: 'receipt_date', width: 15 },
        { header: 'Advance Amount', key: 'advance_amount', width: 15 },
        { header: 'Taxable Value', key: 'taxable_value', width: 15 },
        { header: 'CGST', key: 'cgst', width: 12 },
        { header: 'SGST', key: 'sgst', width: 12 },
        { header: 'IGST', key: 'igst', width: 12 },
        { header: 'CESS', key: 'cess', width: 12 },
      ];

      for (const receipt of report.advance_receipts) {
        advanceSheet.addRow({
          receipt_number: receipt.receipt_number,
          receipt_date: receipt.receipt_date,
          advance_amount: receipt.advance_amount,
          taxable_value: receipt.taxable_value,
          cgst: receipt.cgst,
          sgst: receipt.sgst,
          igst: receipt.igst,
          cess: receipt.cess,
        });
      }

      advanceSheet.getRow(1).font = { bold: true };
      advanceSheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' },
      };
    }

    // Sheet 8: Tax Paid on Advance
    if (report.tax_paid_on_advance && report.tax_paid_on_advance.length > 0) {
      const taxPaidSheet = workbook.addWorksheet('Tax Paid on Advance');
      taxPaidSheet.columns = [
        { header: 'Original Receipt Number', key: 'original_receipt_number', width: 25 },
        { header: 'Original Receipt Date', key: 'original_receipt_date', width: 18 },
        { header: 'Invoice Number', key: 'invoice_number', width: 20 },
        { header: 'Invoice Date', key: 'invoice_date', width: 15 },
        { header: 'Tax Adjustment', key: 'tax_adjustment', width: 15 },
      ];

      for (const taxPaid of report.tax_paid_on_advance) {
        taxPaidSheet.addRow({
          original_receipt_number: taxPaid.original_receipt_number,
          original_receipt_date: taxPaid.original_receipt_date,
          invoice_number: taxPaid.invoice_number,
          invoice_date: taxPaid.invoice_date,
          tax_adjustment: taxPaid.tax_adjustment,
        });
      }

      taxPaidSheet.getRow(1).font = { bold: true };
      taxPaidSheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' },
      };
    }

    // Sheet 9: HSN Summary
    if (report.hsn_summary.length > 0) {
      const hsnSheet = workbook.addWorksheet('HSN Summary');
      hsnSheet.columns = [
        { header: 'HSN Code', key: 'hsn_code', width: 15 },
        { header: 'Description', key: 'description', width: 30 },
        { header: 'UQC', key: 'uqc', width: 10 },
        { header: 'Quantity', key: 'quantity', width: 12 },
        { header: 'Taxable Value', key: 'taxable_value', width: 15 },
        { header: 'CGST', key: 'cgst', width: 12 },
        { header: 'SGST', key: 'sgst', width: 12 },
        { header: 'IGST', key: 'igst', width: 12 },
        { header: 'CESS', key: 'cess', width: 12 },
      ];

      for (const hsn of report.hsn_summary) {
        hsnSheet.addRow({
          hsn_code: hsn.hsn_code,
          description: hsn.description,
          uqc: hsn.uqc,
          quantity: hsn.quantity,
          taxable_value: hsn.taxable_value,
          cgst: hsn.cgst,
          sgst: hsn.sgst,
          igst: hsn.igst,
          cess: hsn.cess,
        });
      }

      hsnSheet.getRow(1).font = { bold: true };
      hsnSheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' },
      };
    }

    // Generate buffer
    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  /**
   * Export GSTR-3B to Excel
   */
  async exportGstr3bToExcel(report: Gstr3bResponseDto): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    
    // Add metadata
    workbook.creator = 'Business Management System';
    workbook.created = new Date();
    workbook.modified = new Date();

    // Sheet 1: Summary
    const summarySheet = workbook.addWorksheet('Summary');
    summarySheet.columns = [
      { header: 'GSTIN', key: 'gstin', width: 20 },
      { header: 'Return Period', key: 'period', width: 15 },
      { header: 'Total Output Tax', key: 'total_output_tax', width: 18 },
      { header: 'Total ITC', key: 'total_itc', width: 15 },
      { header: 'Net Tax Payable', key: 'net_tax_payable', width: 18 },
      { header: 'Interest', key: 'interest', width: 12 },
      { header: 'Late Fee', key: 'late_fee', width: 12 },
    ];

    const totalOutputTax = report.output_tax.total_igst + 
                          report.output_tax.total_cgst + 
                          report.output_tax.total_sgst + 
                          report.output_tax.total_cess;
    const totalItc = report.itc.net_itc_available; // Use net ITC (after reversal)

    summarySheet.addRow({
      gstin: report.gstin,
      period: report.return_period,
      total_output_tax: totalOutputTax,
      total_itc: totalItc,
      net_tax_payable: report.net_tax_payable,
      interest: report.interest,
      late_fee: report.late_fee,
    });

    summarySheet.getRow(1).font = { bold: true };
    summarySheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' },
    };

    // Sheet 2: Output Tax by Rate
    if (report.output_tax.by_rate.length > 0) {
      const outputTaxSheet = workbook.addWorksheet('Output Tax by Rate');
      outputTaxSheet.columns = [
        { header: 'Tax Rate (%)', key: 'rate', width: 12 },
        { header: 'Taxable Value', key: 'taxable_value', width: 15 },
        { header: 'IGST', key: 'igst', width: 12 },
        { header: 'CGST', key: 'cgst', width: 12 },
        { header: 'SGST', key: 'sgst', width: 12 },
        { header: 'CESS', key: 'cess', width: 12 },
      ];

      for (const tax of report.output_tax.by_rate) {
        outputTaxSheet.addRow({
          rate: tax.rate,
          taxable_value: tax.taxable_value,
          igst: tax.igst,
          cgst: tax.cgst,
          sgst: tax.sgst,
          cess: tax.cess,
        });
      }

      outputTaxSheet.getRow(1).font = { bold: true };
      outputTaxSheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' },
      };
    }

    // Sheet 3: ITC Details
    const itcSheet = workbook.addWorksheet('ITC Details');
    itcSheet.columns = [
      { header: 'Total Eligible ITC', key: 'total_eligible_itc', width: 18 },
      { header: 'Total Ineligible ITC', key: 'total_ineligible_itc', width: 20 },
      { header: 'IGST ITC', key: 'igst_itc', width: 12 },
      { header: 'CGST ITC', key: 'cgst_itc', width: 12 },
      { header: 'SGST ITC', key: 'sgst_itc', width: 12 },
      { header: 'CESS ITC', key: 'cess_itc', width: 12 },
      { header: 'ITC Reversal', key: 'itc_reversal', width: 15 },
      { header: 'Net ITC Available', key: 'net_itc_available', width: 18 },
    ];

    itcSheet.addRow({
      total_eligible_itc: report.itc.total_eligible_itc,
      total_ineligible_itc: report.itc.total_ineligible_itc,
      igst_itc: report.itc.igst_itc,
      cgst_itc: report.itc.cgst_itc,
      sgst_itc: report.itc.sgst_itc,
      cess_itc: report.itc.cess_itc,
      itc_reversal: report.itc.itc_reversal,
      net_itc_available: report.itc.net_itc_available,
    });

    itcSheet.getRow(1).font = { bold: true };
    itcSheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' },
    };

    // Sheet 4: ITC by Rate
    if (report.itc.by_rate.length > 0) {
      const itcByRateSheet = workbook.addWorksheet('ITC by Rate');
      itcByRateSheet.columns = [
        { header: 'Tax Rate (%)', key: 'rate', width: 12 },
        { header: 'Taxable Value', key: 'taxable_value', width: 15 },
        { header: 'IGST ITC', key: 'igst_itc', width: 12 },
        { header: 'CGST ITC', key: 'cgst_itc', width: 12 },
        { header: 'SGST ITC', key: 'sgst_itc', width: 12 },
        { header: 'CESS ITC', key: 'cess_itc', width: 12 },
      ];

      for (const itc of report.itc.by_rate) {
        itcByRateSheet.addRow({
          rate: itc.rate,
          taxable_value: itc.taxable_value,
          igst_itc: itc.igst_itc,
          cgst_itc: itc.cgst_itc,
          sgst_itc: itc.sgst_itc,
          cess_itc: itc.cess_itc,
        });
      }

      itcByRateSheet.getRow(1).font = { bold: true };
      itcByRateSheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' },
      };
    }

    // Sheet 5: RCM Details
    const rcmSheet = workbook.addWorksheet('RCM Details');
    rcmSheet.columns = [
      { header: 'RCM Taxable Value', key: 'rcm_taxable_value', width: 18 },
      { header: 'RCM IGST', key: 'rcm_igst', width: 12 },
      { header: 'RCM CGST', key: 'rcm_cgst', width: 12 },
      { header: 'RCM SGST', key: 'rcm_sgst', width: 12 },
      { header: 'RCM CESS', key: 'rcm_cess', width: 12 },
      { header: 'RCM ITC IGST', key: 'rcm_itc_igst', width: 15 },
      { header: 'RCM ITC CGST', key: 'rcm_itc_cgst', width: 15 },
      { header: 'RCM ITC SGST', key: 'rcm_itc_sgst', width: 15 },
      { header: 'RCM ITC CESS', key: 'rcm_itc_cess', width: 15 },
      { header: 'RCM Payable', key: 'rcm_payable', width: 15 },
    ];

    rcmSheet.addRow({
      rcm_taxable_value: report.rcm.rcm_taxable_value,
      rcm_igst: report.rcm.rcm_igst,
      rcm_cgst: report.rcm.rcm_cgst,
      rcm_sgst: report.rcm.rcm_sgst,
      rcm_cess: report.rcm.rcm_cess,
      rcm_itc_igst: report.rcm.rcm_itc_igst,
      rcm_itc_cgst: report.rcm.rcm_itc_cgst,
      rcm_itc_sgst: report.rcm.rcm_itc_sgst,
      rcm_itc_cess: report.rcm.rcm_itc_cess,
      rcm_payable: report.rcm.rcm_payable,
    });

    rcmSheet.getRow(1).font = { bold: true };
    rcmSheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' },
    };

    // Sheet 6: Payments
    if (report.payments && report.payments.length > 0) {
      const paymentSheet = workbook.addWorksheet('Payments');
      paymentSheet.columns = [
        { header: 'Payment Date', key: 'payment_date', width: 15 },
        { header: 'Payment Mode', key: 'payment_mode', width: 15 },
        { header: 'Challan Number', key: 'challan_number', width: 20 },
        { header: 'IGST Paid', key: 'igst_paid', width: 12 },
        { header: 'CGST Paid', key: 'cgst_paid', width: 12 },
        { header: 'SGST Paid', key: 'sgst_paid', width: 12 },
        { header: 'CESS Paid', key: 'cess_paid', width: 12 },
        { header: 'Interest Paid', key: 'interest_paid', width: 15 },
        { header: 'Late Fee Paid', key: 'late_fee_paid', width: 15 },
        { header: 'Total Paid', key: 'total_paid', width: 15 },
      ];

      for (const payment of report.payments) {
        paymentSheet.addRow({
          payment_date: payment.payment_date,
          payment_mode: payment.payment_mode,
          challan_number: payment.challan_number || '',
          igst_paid: payment.igst_paid,
          cgst_paid: payment.cgst_paid,
          sgst_paid: payment.sgst_paid,
          cess_paid: payment.cess_paid,
          interest_paid: payment.interest_paid,
          late_fee_paid: payment.late_fee_paid,
          total_paid: payment.total_paid,
        });
      }

      paymentSheet.getRow(1).font = { bold: true };
      paymentSheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' },
      };
    }

    // Generate buffer
    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  /**
   * Export GSTR-4 to Excel
   */
  async exportGstr4ToExcel(report: Gstr4ResponseDto): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    
    // Add metadata
    workbook.creator = 'Business Management System';
    workbook.created = new Date();
    workbook.modified = new Date();

    // Sheet 1: Summary
    const summarySheet = workbook.addWorksheet('Summary');
    summarySheet.columns = [
      { header: 'GSTIN', key: 'gstin', width: 20 },
      { header: 'Return Period', key: 'period', width: 15 },
      { header: 'Composition Rate (%)', key: 'composition_rate', width: 18 },
      { header: 'Total Turnover', key: 'total_turnover', width: 15 },
      { header: 'Composition Tax Payable', key: 'composition_tax_payable', width: 22 },
      { header: 'Interest', key: 'interest', width: 12 },
      { header: 'Late Fee', key: 'late_fee', width: 12 },
    ];

    summarySheet.addRow({
      gstin: report.gstin,
      period: report.return_period,
      composition_rate: report.composition_rate,
      total_turnover: report.total_turnover,
      composition_tax_payable: report.composition_tax_payable,
      interest: report.interest,
      late_fee: report.late_fee,
    });

    summarySheet.getRow(1).font = { bold: true };
    summarySheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' },
    };

    // Sheet 2: B2B Invoices
    if (report.b2b.length > 0) {
      const b2bSheet = workbook.addWorksheet('B2B Invoices');
      b2bSheet.columns = [
        { header: 'Invoice Number', key: 'invoice_number', width: 20 },
        { header: 'Invoice Date', key: 'invoice_date', width: 15 },
        { header: 'Customer GSTIN', key: 'customer_gstin', width: 20 },
        { header: 'Customer Name', key: 'customer_name', width: 30 },
        { header: 'Invoice Value', key: 'invoice_value', width: 15 },
        { header: 'Place of Supply', key: 'place_of_supply', width: 20 },
      ];

      for (const invoice of report.b2b) {
        b2bSheet.addRow({
          invoice_number: invoice.invoice_number,
          invoice_date: invoice.invoice_date,
          customer_gstin: invoice.customer_gstin,
          customer_name: invoice.customer_name || '',
          invoice_value: invoice.invoice_value,
          place_of_supply: invoice.place_of_supply,
        });
      }

      b2bSheet.getRow(1).font = { bold: true };
      b2bSheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' },
      };
    }

    // Sheet 3: B2C Invoices
    if (report.b2c.length > 0) {
      const b2cSheet = workbook.addWorksheet('B2C Invoices');
      b2cSheet.columns = [
        { header: 'Invoice Number', key: 'invoice_number', width: 20 },
        { header: 'Invoice Date', key: 'invoice_date', width: 15 },
        { header: 'Customer Name', key: 'customer_name', width: 30 },
        { header: 'Invoice Value', key: 'invoice_value', width: 15 },
        { header: 'Place of Supply', key: 'place_of_supply', width: 20 },
      ];

      for (const invoice of report.b2c) {
        b2cSheet.addRow({
          invoice_number: invoice.invoice_number,
          invoice_date: invoice.invoice_date,
          customer_name: invoice.customer_name || '',
          invoice_value: invoice.invoice_value,
          place_of_supply: invoice.place_of_supply,
        });
      }

      b2cSheet.getRow(1).font = { bold: true };
      b2cSheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' },
      };
    }

    // Generate buffer
    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }
}

