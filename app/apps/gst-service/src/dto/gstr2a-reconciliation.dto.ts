import { IsString, IsNotEmpty, IsOptional, IsEnum, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * GSTR-2A Import Request DTO
 */
export class Gstr2aImportRequestDto {
  @ApiProperty({
    description: 'Period in MMYYYY format (e.g., 122024 for December 2024)',
    example: '122024',
  })
  @IsString()
  @IsNotEmpty()
  period: string;

  @ApiProperty({
    description: 'Import type',
    enum: ['gstr2a', 'gstr2b'],
    default: 'gstr2a',
  })
  @IsEnum(['gstr2a', 'gstr2b'])
  import_type: 'gstr2a' | 'gstr2b';

  @ApiProperty({
    description: 'GSTR-2A/2B JSON data',
    type: Object,
  })
  @IsObject()
  data: any;
}

/**
 * GSTR-2A Reconciliation Invoice DTO
 */
export class Gstr2aReconciliationInvoiceDto {
  @ApiProperty({ description: 'Invoice ID (if matched)', example: 'uuid' })
  invoice_id?: string;

  @ApiProperty({ description: 'Supplier invoice number', example: 'INV-2025-00042' })
  supplier_invoice_number: string;

  @ApiProperty({ description: 'Supplier invoice date', example: '2025-12-20' })
  supplier_invoice_date: string;

  @ApiProperty({ description: 'Supplier GSTIN', example: '29XYZAB1234C1Z1' })
  supplier_gstin: string;

  @ApiProperty({ description: 'Supplier name', example: 'ABC Company' })
  supplier_name?: string;

  @ApiProperty({ description: 'Taxable value', example: 100000 })
  taxable_value: number;

  @ApiProperty({ description: 'IGST', example: 0 })
  igst: number;

  @ApiProperty({ description: 'CGST', example: 9000 })
  cgst: number;

  @ApiProperty({ description: 'SGST', example: 9000 })
  sgst: number;

  @ApiProperty({ description: 'CESS', example: 0 })
  cess: number;

  @ApiProperty({ description: 'Match status', enum: ['matched', 'missing', 'extra', 'mismatched'] })
  match_status: 'matched' | 'missing' | 'extra' | 'mismatched';

  @ApiPropertyOptional({ description: 'Match details', type: Object })
  match_details?: any;
}

/**
 * GSTR-2A Reconciliation Response DTO
 */
export class Gstr2aReconciliationResponseDto {
  @ApiProperty({ description: 'Business GSTIN', example: '29ABCDE1234F1Z5' })
  gstin: string;

  @ApiProperty({ description: 'Period', example: '122024' })
  period: string;

  @ApiProperty({ description: 'Import type', example: 'gstr2a' })
  import_type: string;

  @ApiProperty({ description: 'Total invoices in GSTR-2A', example: 100 })
  total_gstr2a_invoices: number;

  @ApiProperty({ description: 'Total purchase invoices', example: 95 })
  total_purchase_invoices: number;

  @ApiProperty({ description: 'Matched invoices', example: 90 })
  matched_count: number;

  @ApiProperty({ description: 'Missing invoices (in GSTR-2A but not in our system)', example: 5 })
  missing_count: number;

  @ApiProperty({ description: 'Extra invoices (in our system but not in GSTR-2A)', example: 5 })
  extra_count: number;

  @ApiProperty({ description: 'Mismatched invoices', example: 5 })
  mismatched_count: number;

  @ApiProperty({ description: 'Matched invoices', type: [Gstr2aReconciliationInvoiceDto] })
  matched: Gstr2aReconciliationInvoiceDto[];

  @ApiProperty({ description: 'Missing invoices', type: [Gstr2aReconciliationInvoiceDto] })
  missing: Gstr2aReconciliationInvoiceDto[];

  @ApiProperty({ description: 'Extra invoices', type: [Gstr2aReconciliationInvoiceDto] })
  extra: Gstr2aReconciliationInvoiceDto[];

  @ApiProperty({ description: 'Mismatched invoices', type: [Gstr2aReconciliationInvoiceDto] })
  mismatched: Gstr2aReconciliationInvoiceDto[];
}

/**
 * Manual Match Request DTO
 */
export class ManualMatchRequestDto {
  @ApiProperty({ description: 'GSTR-2A reconciliation ID', example: 'uuid' })
  @IsString()
  @IsNotEmpty()
  reconciliation_id: string;

  @ApiProperty({ description: 'Invoice ID to match', example: 'uuid' })
  @IsString()
  @IsNotEmpty()
  invoice_id: string;
}

