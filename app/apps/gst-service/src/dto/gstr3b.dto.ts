import { IsString, IsNotEmpty, Matches, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * GSTR-3B Request DTO
 */
export class Gstr3bRequestDto {
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
 * GSTR-3B Output Tax by Rate DTO
 */
export class Gstr3bOutputTaxByRateDto {
  @ApiProperty({ description: 'Tax rate', example: 18 })
  rate: number;

  @ApiProperty({ description: 'Taxable value', example: 100000 })
  taxable_value: number;

  @ApiProperty({ description: 'IGST amount', example: 0 })
  igst: number;

  @ApiProperty({ description: 'CGST amount', example: 9000 })
  cgst: number;

  @ApiProperty({ description: 'SGST amount', example: 9000 })
  sgst: number;

  @ApiProperty({ description: 'CESS amount', example: 0 })
  cess: number;
}

/**
 * GSTR-3B Output Tax Summary DTO
 */
export class Gstr3bOutputTaxDto {
  @ApiProperty({ description: 'Total taxable value', example: 500000 })
  total_taxable_value: number;

  @ApiProperty({ description: 'Total IGST', example: 0 })
  total_igst: number;

  @ApiProperty({ description: 'Total CGST', example: 45000 })
  total_cgst: number;

  @ApiProperty({ description: 'Total SGST', example: 45000 })
  total_sgst: number;

  @ApiProperty({ description: 'Total CESS', example: 0 })
  total_cess: number;

  @ApiProperty({ description: 'Output tax by rate', type: [Gstr3bOutputTaxByRateDto] })
  by_rate: Gstr3bOutputTaxByRateDto[];
}

/**
 * GSTR-3B ITC (Input Tax Credit) by Rate DTO
 */
export class Gstr3bItcByRateDto {
  @ApiProperty({ description: 'Tax rate', example: 18 })
  rate: number;

  @ApiProperty({ description: 'Taxable value', example: 100000 })
  taxable_value: number;

  @ApiProperty({ description: 'IGST ITC', example: 0 })
  igst_itc: number;

  @ApiProperty({ description: 'CGST ITC', example: 9000 })
  cgst_itc: number;

  @ApiProperty({ description: 'SGST ITC', example: 9000 })
  sgst_itc: number;

  @ApiProperty({ description: 'CESS ITC', example: 0 })
  cess_itc: number;
}

/**
 * GSTR-3B ITC (Input Tax Credit) Summary DTO
 */
export class Gstr3bItcDto {
  @ApiProperty({ description: 'Total eligible ITC', example: 30000 })
  total_eligible_itc: number;

  @ApiProperty({ description: 'Total ineligible ITC', example: 0 })
  total_ineligible_itc: number;

  @ApiProperty({ description: 'IGST ITC', example: 0 })
  igst_itc: number;

  @ApiProperty({ description: 'CGST ITC', example: 15000 })
  cgst_itc: number;

  @ApiProperty({ description: 'SGST ITC', example: 15000 })
  sgst_itc: number;

  @ApiProperty({ description: 'CESS ITC', example: 0 })
  cess_itc: number;

  @ApiProperty({ description: 'ITC by rate', type: [Gstr3bItcByRateDto] })
  by_rate: Gstr3bItcByRateDto[];

  @ApiProperty({ description: 'ITC reversal', example: 0 })
  itc_reversal: number;

  @ApiProperty({ description: 'Net ITC available', example: 30000 })
  net_itc_available: number;
}

/**
 * GSTR-3B RCM (Reverse Charge Mechanism) DTO
 */
export class Gstr3bRcmDto {
  @ApiProperty({ description: 'RCM taxable value', example: 50000 })
  rcm_taxable_value: number;

  @ApiProperty({ description: 'RCM IGST', example: 0 })
  rcm_igst: number;

  @ApiProperty({ description: 'RCM CGST', example: 4500 })
  rcm_cgst: number;

  @ApiProperty({ description: 'RCM SGST', example: 4500 })
  rcm_sgst: number;

  @ApiProperty({ description: 'RCM CESS', example: 0 })
  rcm_cess: number;

  @ApiProperty({ description: 'RCM ITC IGST', example: 0 })
  rcm_itc_igst: number;

  @ApiProperty({ description: 'RCM ITC CGST', example: 4500 })
  rcm_itc_cgst: number;

  @ApiProperty({ description: 'RCM ITC SGST', example: 4500 })
  rcm_itc_sgst: number;

  @ApiProperty({ description: 'RCM ITC CESS', example: 0 })
  rcm_itc_cess: number;

  @ApiProperty({ description: 'RCM payable', example: 0 })
  rcm_payable: number;
}

/**
 * GSTR-3B Payment DTO
 */
export class Gstr3bPaymentDto {
  @ApiProperty({ description: 'Payment date', example: '2025-01-10' })
  payment_date: string;

  @ApiProperty({ description: 'Payment mode', example: 'online' })
  payment_mode: string;

  @ApiProperty({ description: 'Challan number', example: 'CH123456' })
  challan_number?: string;

  @ApiProperty({ description: 'IGST paid', example: 0 })
  igst_paid: number;

  @ApiProperty({ description: 'CGST paid', example: 15000 })
  cgst_paid: number;

  @ApiProperty({ description: 'SGST paid', example: 15000 })
  sgst_paid: number;

  @ApiProperty({ description: 'CESS paid', example: 0 })
  cess_paid: number;

  @ApiProperty({ description: 'Interest paid', example: 0 })
  interest_paid: number;

  @ApiProperty({ description: 'Late fee paid', example: 0 })
  late_fee_paid: number;

  @ApiProperty({ description: 'Penalty paid', example: 0 })
  penalty_paid: number;

  @ApiProperty({ description: 'Other paid', example: 0 })
  other_paid: number;

  @ApiProperty({ description: 'Total paid', example: 30000 })
  total_paid: number;
}

/**
 * GSTR-3B Response DTO
 */
export class Gstr3bResponseDto {
  @ApiProperty({ description: 'Business GSTIN', example: '29ABCDE1234F1Z5' })
  gstin: string;

  @ApiProperty({ description: 'Return period', example: '122024' })
  return_period: string;

  @ApiProperty({ description: 'Output tax summary', type: Gstr3bOutputTaxDto })
  output_tax: Gstr3bOutputTaxDto;

  @ApiProperty({ description: 'Input tax credit summary', type: Gstr3bItcDto })
  itc: Gstr3bItcDto;

  @ApiProperty({ description: 'Reverse charge mechanism details', type: Gstr3bRcmDto })
  rcm: Gstr3bRcmDto;

  @ApiProperty({ description: 'Net tax payable', example: 30000 })
  net_tax_payable: number;

  @ApiProperty({ description: 'Interest', example: 0 })
  interest: number;

  @ApiProperty({ description: 'Late fee', example: 0 })
  late_fee: number;

  @ApiPropertyOptional({ description: 'Payment details', type: [Gstr3bPaymentDto] })
  payments?: Gstr3bPaymentDto[];
}

