import { IsString, IsNotEmpty, Matches, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * GSTR-4 Request DTO
 */
export class Gstr4RequestDto {
  @ApiProperty({
    description: 'Period in Q1-YYYY format (e.g., Q1-2024) for quarterly filing',
    example: 'Q1-2024',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^Q[1-4]-\d{4}$/, {
    message: 'Period must be in Q1-YYYY format (e.g., Q1-2024) for composition scheme',
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
 * GSTR-4 B2B Invoice DTO
 */
export class Gstr4B2BInvoiceDto {
  @ApiProperty({ description: 'Invoice number', example: 'INV-2025-00042' })
  invoice_number: string;

  @ApiProperty({ description: 'Invoice date (YYYY-MM-DD)', example: '2025-12-20' })
  invoice_date: string;

  @ApiProperty({ description: 'Customer GSTIN', example: '29XYZAB1234C1Z1' })
  customer_gstin: string;

  @ApiProperty({ description: 'Customer name', example: 'ABC Company' })
  customer_name?: string;

  @ApiProperty({ description: 'Invoice value', example: 100000 })
  invoice_value: number;

  @ApiProperty({ description: 'Place of supply', example: '29-Karnataka' })
  place_of_supply: string;
}

/**
 * GSTR-4 B2C Invoice DTO
 */
export class Gstr4B2CInvoiceDto {
  @ApiProperty({ description: 'Invoice number', example: 'INV-2025-00050' })
  invoice_number: string;

  @ApiProperty({ description: 'Invoice date (YYYY-MM-DD)', example: '2025-12-25' })
  invoice_date: string;

  @ApiProperty({ description: 'Customer name', example: 'John Doe' })
  customer_name?: string;

  @ApiProperty({ description: 'Invoice value', example: 50000 })
  invoice_value: number;

  @ApiProperty({ description: 'Place of supply', example: '29-Karnataka' })
  place_of_supply: string;
}

/**
 * GSTR-4 Response DTO
 */
export class Gstr4ResponseDto {
  @ApiProperty({ description: 'Business GSTIN', example: '29ABCDE1234F1Z5' })
  gstin: string;

  @ApiProperty({ description: 'Return period', example: 'Q1-2024' })
  return_period: string;

  @ApiProperty({ description: 'Composition rate (%)', example: 1 })
  composition_rate: number;

  @ApiProperty({ description: 'Total turnover for the quarter', example: 500000 })
  total_turnover: number;

  @ApiProperty({ description: 'B2B invoices', type: [Gstr4B2BInvoiceDto] })
  b2b: Gstr4B2BInvoiceDto[];

  @ApiProperty({ description: 'B2C invoices', type: [Gstr4B2CInvoiceDto] })
  b2c: Gstr4B2CInvoiceDto[];

  @ApiProperty({ description: 'Composition tax payable', example: 5000 })
  composition_tax_payable: number;

  @ApiProperty({ description: 'Interest', example: 0 })
  interest: number;

  @ApiProperty({ description: 'Late fee', example: 0 })
  late_fee: number;

  @ApiPropertyOptional({ description: 'Payment details', type: [Object] })
  payments?: any[];
}

