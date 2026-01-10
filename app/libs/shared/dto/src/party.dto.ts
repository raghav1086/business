import {
  IsString,
  IsOptional,
  IsEmail,
  IsNumber,
  IsBoolean,
  IsArray,
  IsEnum,
  Length,
  Matches,
  Min,
} from 'class-validator';

/**
 * Party DTOs
 */

export class CreatePartyDto {
  @IsString()
  @Length(2, 200)
  name: string;

  @IsString()
  @IsEnum(['customer', 'supplier', 'both'])
  type: string;

  @IsOptional()
  @IsString()
  @Length(10, 10)
  @Matches(/^[6-9][0-9]{9}$/, {
    message: 'Invalid phone number format',
  })
  phone?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @Length(15, 15)
  @Matches(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, {
    message: 'Invalid GSTIN format',
  })
  gstin?: string;

  @IsOptional()
  @IsString()
  @Length(10, 10)
  @Matches(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, {
    message: 'Invalid PAN format',
  })
  pan?: string;

  // Billing Address
  @IsOptional()
  @IsString()
  billing_address_line1?: string;

  @IsOptional()
  @IsString()
  billing_address_line2?: string;

  @IsOptional()
  @IsString()
  billing_city?: string;

  @IsOptional()
  @IsString()
  billing_state?: string;

  @IsOptional()
  @IsString()
  @Length(6, 6)
  billing_pincode?: string;

  // Shipping Address
  @IsOptional()
  @IsBoolean()
  shipping_same_as_billing?: boolean;

  @IsOptional()
  @IsString()
  shipping_address_line1?: string;

  @IsOptional()
  @IsString()
  shipping_address_line2?: string;

  @IsOptional()
  @IsString()
  shipping_city?: string;

  @IsOptional()
  @IsString()
  shipping_state?: string;

  @IsOptional()
  @IsString()
  @Length(6, 6)
  shipping_pincode?: string;

  // Financial
  @IsOptional()
  @IsNumber()
  @Min(0)
  opening_balance?: number;

  @IsOptional()
  @IsString()
  @IsEnum(['credit', 'debit'])
  opening_balance_type?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  credit_limit?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  credit_period_days?: number;

  // Metadata
  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}

export class UpdatePartyDto {
  @IsOptional()
  @IsString()
  @Length(2, 200)
  name?: string;

  @IsOptional()
  @IsString()
  @IsEnum(['customer', 'supplier', 'both'])
  type?: string;

  @IsOptional()
  @IsString()
  @Length(10, 10)
  @Matches(/^[6-9][0-9]{9}$/, {
    message: 'Invalid phone number format',
  })
  phone?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @Length(15, 15)
  @Matches(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, {
    message: 'Invalid GSTIN format',
  })
  gstin?: string;

  @IsOptional()
  @IsString()
  @Length(10, 10)
  @Matches(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, {
    message: 'Invalid PAN format',
  })
  pan?: string;

  // Billing Address
  @IsOptional()
  @IsString()
  billing_address_line1?: string;

  @IsOptional()
  @IsString()
  billing_address_line2?: string;

  @IsOptional()
  @IsString()
  billing_city?: string;

  @IsOptional()
  @IsString()
  billing_state?: string;

  @IsOptional()
  @IsString()
  @Length(6, 6)
  billing_pincode?: string;

  // Shipping Address
  @IsOptional()
  @IsBoolean()
  shipping_same_as_billing?: boolean;

  @IsOptional()
  @IsString()
  shipping_address_line1?: string;

  @IsOptional()
  @IsString()
  shipping_address_line2?: string;

  @IsOptional()
  @IsString()
  shipping_city?: string;

  @IsOptional()
  @IsString()
  shipping_state?: string;

  @IsOptional()
  @IsString()
  @Length(6, 6)
  shipping_pincode?: string;

  // Financial
  @IsOptional()
  @IsNumber()
  @Min(0)
  opening_balance?: number;

  @IsOptional()
  @IsString()
  @IsEnum(['credit', 'debit'])
  opening_balance_type?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  credit_limit?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  credit_period_days?: number;

  // Metadata
  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}

export class PartyResponseDto {
  id: string;
  business_id: string;
  name: string;
  type: string;
  phone?: string;
  email?: string;
  gstin?: string;
  pan?: string;
  billing_address_line1?: string;
  billing_address_line2?: string;
  billing_city?: string;
  billing_state?: string;
  billing_pincode?: string;
  shipping_same_as_billing: boolean;
  shipping_address_line1?: string;
  shipping_address_line2?: string;
  shipping_city?: string;
  shipping_state?: string;
  shipping_pincode?: string;
  opening_balance: number;
  opening_balance_type: string;
  credit_limit?: number;
  credit_period_days?: number;
  notes?: string;
  tags?: string[];
  status: string;
  created_at: Date;
  updated_at: Date;
}

export class PartyLedgerEntryDto {
  date: Date;
  type: string; // invoice, payment, credit_note, etc.
  document_number?: string;
  description: string;
  debit: number;
  credit: number;
  balance: number;
}

export class PartyLedgerResponseDto {
  party_id: string;
  party_name: string;
  opening_balance: number;
  opening_balance_type: string;
  current_balance: number;
  entries: PartyLedgerEntryDto[];
}

