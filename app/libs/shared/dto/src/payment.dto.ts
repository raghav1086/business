import {
  IsString,
  IsOptional,
  IsNumber,
  IsUUID,
  IsDateString,
  IsEnum,
  Length,
  Min,
} from 'class-validator';

/**
 * Payment DTOs
 */

export class CreatePaymentDto {
  @IsUUID()
  party_id: string;

  @IsOptional()
  @IsUUID()
  invoice_id?: string;

  @IsString()
  @IsEnum(['payment_in', 'payment_out'])
  transaction_type: string;

  @IsDateString()
  transaction_date: string;

  @IsNumber()
  @Min(0)
  amount: number;

  @IsString()
  @IsEnum(['cash', 'bank', 'upi', 'cheque', 'credit', 'card'])
  payment_mode: string;

  @IsOptional()
  @IsString()
  @Length(1, 100)
  reference_number?: string;

  @IsOptional()
  @IsString()
  @Length(1, 100)
  bank_name?: string;

  @IsOptional()
  @IsString()
  @Length(1, 20)
  cheque_number?: string;

  @IsOptional()
  @IsDateString()
  cheque_date?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class PaymentResponseDto {
  id: string;
  business_id: string;
  party_id?: string;
  invoice_id?: string;
  transaction_type: string;
  transaction_date: Date;
  amount: number;
  payment_mode: string;
  reference_number?: string;
  bank_name?: string;
  cheque_number?: string;
  cheque_date?: Date;
  notes?: string;
  status: string;
  created_at: Date;
  updated_at: Date;
}

