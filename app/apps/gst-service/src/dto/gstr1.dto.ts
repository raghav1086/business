import { IsString, IsNotEmpty, Matches, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * GSTR-1 Request DTO
 */
export class Gstr1RequestDto {
  @ApiProperty({
    description: 'Period in MMYYYY format (e.g., 122024 for December 2024) or Q1-YYYY format (e.g., Q1-2024)',
    example: '122024',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^(\d{6}|Q[1-4]-\d{4})$/, {
    message: 'Period must be in MMYYYY format (e.g., 122024) or Q1-YYYY format (e.g., Q1-2024)',
  })
  period: string;

  @ApiPropertyOptional({
    description: 'Format of the response',
    enum: ['json', 'excel'],
    default: 'json',
  })
  @IsOptional()
  @IsEnum(['json', 'excel'])
  format?: 'json' | 'excel';
}

/**
 * GSTR-1 B2B Invoice Item DTO
 */
export class Gstr1B2BItemDto {
  @ApiProperty({ description: 'Tax rate', example: 18 })
  rate: number;

  @ApiProperty({ description: 'Taxable value', example: 151998.1 })
  taxable_value: number;

  @ApiProperty({ description: 'CGST amount', example: 12959.84 })
  cgst: number;

  @ApiProperty({ description: 'SGST amount', example: 12959.84 })
  sgst: number;

  @ApiProperty({ description: 'IGST amount', example: 0 })
  igst: number;

  @ApiProperty({ description: 'CESS amount', example: 0 })
  cess: number;
}

/**
 * GSTR-1 B2B Invoice DTO
 */
export class Gstr1B2BInvoiceDto {
  @ApiProperty({ description: 'Invoice number', example: 'INV-2025-00042' })
  invoice_number: string;

  @ApiProperty({ description: 'Invoice date (YYYY-MM-DD)', example: '2025-12-20' })
  invoice_date: string;

  @ApiProperty({ description: 'Invoice value', example: 170418 })
  invoice_value: number;

  @ApiProperty({ description: 'Place of supply', example: '29-Karnataka' })
  place_of_supply: string;

  @ApiProperty({ description: 'Invoice items', type: [Gstr1B2BItemDto] })
  items: Gstr1B2BItemDto[];
}

/**
 * GSTR-1 B2B Customer DTO
 */
export class Gstr1B2BCustomerDto {
  @ApiProperty({ description: 'Customer GSTIN', example: '29XYZAB1234C1Z1' })
  customer_gstin: string;

  @ApiProperty({ description: 'Customer name', example: 'ABC Company' })
  customer_name?: string;

  @ApiProperty({ description: 'Invoices', type: [Gstr1B2BInvoiceDto] })
  invoices: Gstr1B2BInvoiceDto[];
}

/**
 * GSTR-1 B2C Small Summary DTO
 */
export class Gstr1B2CSmallSummaryDto {
  @ApiProperty({ description: 'Place of supply', example: '29-Karnataka' })
  place_of_supply: string;

  @ApiProperty({ description: 'Tax rate', example: 18 })
  rate: number;

  @ApiProperty({ description: 'Taxable value', example: 50000 })
  taxable_value: number;

  @ApiProperty({ description: 'CGST amount', example: 4500 })
  cgst: number;

  @ApiProperty({ description: 'SGST amount', example: 4500 })
  sgst: number;

  @ApiProperty({ description: 'IGST amount', example: 0 })
  igst: number;

  @ApiProperty({ description: 'CESS amount', example: 0 })
  cess: number;
}

/**
 * GSTR-1 HSN Summary DTO
 */
export class Gstr1HsnSummaryDto {
  @ApiProperty({ description: 'HSN code', example: '85171290' })
  hsn_code: string;

  @ApiProperty({ description: 'Item description', example: 'Mobile Phones' })
  description: string;

  @ApiProperty({ description: 'Unit of quantity code', example: 'PCS' })
  uqc: string;

  @ApiProperty({ description: 'Quantity', example: 10 })
  quantity: number;

  @ApiProperty({ description: 'Taxable value', example: 800000 })
  taxable_value: number;

  @ApiProperty({ description: 'CGST amount', example: 72000 })
  cgst: number;

  @ApiProperty({ description: 'SGST amount', example: 72000 })
  sgst: number;

  @ApiProperty({ description: 'IGST amount', example: 0 })
  igst: number;

  @ApiProperty({ description: 'CESS amount', example: 0 })
  cess: number;
}

/**
 * GSTR-1 B2C Large Invoice DTO
 */
export class Gstr1B2CLargeInvoiceDto {
  @ApiProperty({ description: 'Invoice number', example: 'INV-2025-00050' })
  invoice_number: string;

  @ApiProperty({ description: 'Invoice date (YYYY-MM-DD)', example: '2025-12-25' })
  invoice_date: string;

  @ApiProperty({ description: 'Invoice value', example: 300000 })
  invoice_value: number;

  @ApiProperty({ description: 'Place of supply', example: '29-Karnataka' })
  place_of_supply: string;

  @ApiProperty({ description: 'Customer name', example: 'John Doe' })
  customer_name?: string;

  @ApiProperty({ description: 'Customer address', example: '123 Main St, Bangalore' })
  customer_address?: string;

  @ApiProperty({ description: 'Invoice items', type: [Gstr1B2BItemDto] })
  items: Gstr1B2BItemDto[];
}

/**
 * GSTR-1 Export Invoice DTO
 */
export class Gstr1ExportInvoiceDto {
  @ApiProperty({ description: 'Invoice number', example: 'INV-2025-00060' })
  invoice_number: string;

  @ApiProperty({ description: 'Invoice date (YYYY-MM-DD)', example: '2025-12-28' })
  invoice_date: string;

  @ApiProperty({ description: 'Invoice value', example: 500000 })
  invoice_value: number;

  @ApiProperty({ description: 'Port code', example: 'INBLR1' })
  port_code?: string;

  @ApiProperty({ description: 'Shipping bill number', example: 'SB123456' })
  shipping_bill_number?: string;

  @ApiProperty({ description: 'Shipping bill date', example: '2025-12-29' })
  shipping_bill_date?: string;

  @ApiProperty({ description: 'Invoice items', type: [Gstr1B2BItemDto] })
  items: Gstr1B2BItemDto[];
}

/**
 * GSTR-1 Nil/Exempt/Non-GST Summary DTO
 */
export class Gstr1NilSummaryDto {
  @ApiProperty({ description: 'Nil rated value', example: 0 })
  nil_rated: number;

  @ApiProperty({ description: 'Exempted value', example: 10000 })
  exempted: number;

  @ApiProperty({ description: 'Non-GST supply value', example: 0 })
  non_gst: number;
}

/**
 * GSTR-1 CDNR (Credit/Debit Note) DTO
 */
export class Gstr1CdnrDto {
  @ApiProperty({ description: 'Original invoice number', example: 'INV-2025-00042' })
  original_invoice_number: string;

  @ApiProperty({ description: 'Original invoice date', example: '2025-12-20' })
  original_invoice_date: string;

  @ApiProperty({ description: 'Note type', enum: ['credit', 'debit'] })
  note_type: 'credit' | 'debit';

  @ApiProperty({ description: 'Note number', example: 'CN-2025-00001' })
  note_number: string;

  @ApiProperty({ description: 'Note date', example: '2025-12-25' })
  note_date: string;

  @ApiProperty({ description: 'Reason code', example: '01' })
  reason_code: string;

  @ApiProperty({ description: 'Note value', example: 10000 })
  note_value: number;

  @ApiProperty({ description: 'Taxable value', example: 8474.58 })
  taxable_value: number;

  @ApiProperty({ description: 'CGST', example: 763.11 })
  cgst: number;

  @ApiProperty({ description: 'SGST', example: 763.11 })
  sgst: number;

  @ApiProperty({ description: 'IGST', example: 0 })
  igst: number;

  @ApiProperty({ description: 'CESS', example: 0 })
  cess: number;
}

/**
 * GSTR-1 AT (Advance Receipt) DTO
 */
export class Gstr1AdvanceReceiptDto {
  @ApiProperty({ description: 'Receipt number', example: 'ADV-2025-00001' })
  receipt_number: string;

  @ApiProperty({ description: 'Receipt date', example: '2025-12-15' })
  receipt_date: string;

  @ApiProperty({ description: 'Advance amount', example: 50000 })
  advance_amount: number;

  @ApiProperty({ description: 'Taxable value', example: 42372.88 })
  taxable_value: number;

  @ApiProperty({ description: 'CGST', example: 3815.56 })
  cgst: number;

  @ApiProperty({ description: 'SGST', example: 3815.56 })
  sgst: number;

  @ApiProperty({ description: 'IGST', example: 0 })
  igst: number;

  @ApiProperty({ description: 'CESS', example: 0 })
  cess: number;
}

/**
 * GSTR-1 TXPD (Tax Paid on Advance) DTO
 */
export class Gstr1TaxPaidOnAdvanceDto {
  @ApiProperty({ description: 'Original advance receipt number', example: 'ADV-2025-00001' })
  original_receipt_number: string;

  @ApiProperty({ description: 'Original receipt date', example: '2025-12-15' })
  original_receipt_date: string;

  @ApiProperty({ description: 'Final invoice number', example: 'INV-2025-00042' })
  invoice_number: string;

  @ApiProperty({ description: 'Invoice date', example: '2025-12-20' })
  invoice_date: string;

  @ApiProperty({ description: 'Tax adjustment', example: 0 })
  tax_adjustment: number;
}

/**
 * GSTR-1 Response DTO
 */
export class Gstr1ResponseDto {
  @ApiProperty({ description: 'Business GSTIN', example: '29ABCDE1234F1Z5' })
  gstin: string;

  @ApiProperty({ description: 'Return period', example: '122024' })
  return_period: string;

  @ApiProperty({ description: 'B2B invoices grouped by customer GSTIN', type: [Gstr1B2BCustomerDto] })
  b2b: Gstr1B2BCustomerDto[];

  @ApiProperty({ description: 'B2C small summary', type: [Gstr1B2CSmallSummaryDto] })
  b2c_small: Gstr1B2CSmallSummaryDto[];

  @ApiPropertyOptional({ description: 'B2C large invoices (> 2.5L)', type: [Gstr1B2CLargeInvoiceDto] })
  b2c_large?: Gstr1B2CLargeInvoiceDto[];

  @ApiPropertyOptional({ description: 'Credit/Debit Notes', type: [Gstr1CdnrDto] })
  cdnr?: Gstr1CdnrDto[];

  @ApiPropertyOptional({ description: 'Export invoices', type: [Gstr1ExportInvoiceDto] })
  export?: Gstr1ExportInvoiceDto[];

  @ApiPropertyOptional({ description: 'Advance receipts', type: [Gstr1AdvanceReceiptDto] })
  advance_receipts?: Gstr1AdvanceReceiptDto[];

  @ApiPropertyOptional({ description: 'Tax paid on advance', type: [Gstr1TaxPaidOnAdvanceDto] })
  tax_paid_on_advance?: Gstr1TaxPaidOnAdvanceDto[];

  @ApiPropertyOptional({ description: 'Nil/Exempt/Non-GST summary', type: Gstr1NilSummaryDto })
  nil?: Gstr1NilSummaryDto;

  @ApiProperty({ description: 'HSN-wise summary', type: [Gstr1HsnSummaryDto] })
  hsn_summary: Gstr1HsnSummaryDto[];
}

