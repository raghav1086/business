import {
  IsString,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsUUID,
  IsDateString,
  IsArray,
  ValidateNested,
  IsEnum,
  Length,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Invoice DTOs
 */

export class InvoiceItemDto {
  @IsOptional()
  @IsUUID()
  item_id?: string;

  @IsString()
  @Length(2, 200)
  item_name: string;

  @IsOptional()
  @IsString()
  item_description?: string;

  @IsOptional()
  @IsString()
  @Length(4, 8)
  hsn_code?: string;

  @IsOptional()
  @IsString()
  unit?: string;

  @IsNumber()
  @Min(0)
  quantity: number;

  @IsNumber()
  @Min(0)
  unit_price: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  discount_percent?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  tax_rate?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  cess_rate?: number;
}

export class CreateInvoiceDto {
  @IsUUID()
  party_id: string;

  @IsString()
  @IsEnum(['sale', 'purchase', 'quotation', 'proforma'])
  invoice_type: string;

  @IsDateString()
  invoice_date: string;

  @IsOptional()
  @IsDateString()
  due_date?: string;

  @IsOptional()
  @IsString()
  place_of_supply?: string;

  @IsOptional()
  @IsBoolean()
  is_interstate?: boolean;

  @IsOptional()
  @IsBoolean()
  is_export?: boolean;

  @IsOptional()
  @IsBoolean()
  is_rcm?: boolean;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => InvoiceItemDto)
  items: InvoiceItemDto[];

  @IsOptional()
  @IsString()
  terms?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class InvoiceResponseDto {
  id: string;
  business_id: string;
  party_id: string;
  invoice_number: string;
  invoice_type: string;
  invoice_date: Date;
  due_date?: Date;
  place_of_supply?: string;
  is_interstate: boolean;
  subtotal: number;
  discount_amount: number;
  taxable_amount: number;
  cgst_amount: number;
  sgst_amount: number;
  igst_amount: number;
  cess_amount: number;
  total_amount: number;
  payment_status: string;
  status: string;
  items: InvoiceItemResponseDto[];
  created_at: Date;
  updated_at: Date;
}

export class InvoiceItemResponseDto {
  id: string;
  item_id?: string;
  item_name: string;
  quantity: number;
  unit_price: number;
  discount_percent: number;
  discount_amount: number;
  tax_rate: number;
  cgst_rate: number;
  sgst_rate: number;
  igst_rate: number;
  taxable_amount: number;
  cgst_amount: number;
  sgst_amount: number;
  igst_amount: number;
  total_amount: number;
}

