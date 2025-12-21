import {
  IsString,
  IsOptional,
  IsEmail,
  IsBoolean,
  Length,
  Matches,
  ValidateIf,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Business DTOs
 */

export class CreateBusinessDto {
  @ApiProperty({
    description: 'Business name',
    example: 'Acme Trading Company',
    minLength: 2,
    maxLength: 200,
  })
  @IsString()
  @Length(2, 200)
  name: string;

  @ApiPropertyOptional({
    description: 'Type of business',
    example: 'retailer',
    enum: ['retailer', 'wholesaler', 'manufacturer', 'service', 'other'],
  })
  @IsOptional()
  @IsString()
  type?: string; // retailer, wholesaler, manufacturer, service

  @ApiPropertyOptional({
    description: 'GST Identification Number (15 characters)',
    example: '27AABCU9603R1ZX',
    pattern: '^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$',
    minLength: 15,
    maxLength: 15,
  })
  @IsOptional()
  @IsString()
  @Length(15, 15)
  @Matches(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, {
    message: 'Invalid GSTIN format',
  })
  gstin?: string;

  @ApiPropertyOptional({
    description: 'Permanent Account Number (10 characters)',
    example: 'AABCU9603R',
    pattern: '^[A-Z]{5}[0-9]{4}[A-Z]{1}$',
    minLength: 10,
    maxLength: 10,
  })
  @IsOptional()
  @IsString()
  @Length(10, 10)
  @Matches(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, {
    message: 'Invalid PAN format',
  })
  pan?: string;

  @ApiPropertyOptional({
    description: 'Business phone number',
    example: '9876543210',
  })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({
    description: 'Business email address',
    example: 'contact@acmetrading.com',
  })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({
    description: 'Address line 1',
    example: '123 Main Street',
  })
  @IsOptional()
  @IsString()
  address_line1?: string;

  @ApiPropertyOptional({
    description: 'Address line 2',
    example: 'Near City Mall',
  })
  @IsOptional()
  @IsString()
  address_line2?: string;

  @ApiPropertyOptional({
    description: 'City',
    example: 'Mumbai',
  })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({
    description: 'State',
    example: 'Maharashtra',
  })
  @IsOptional()
  @IsString()
  state?: string;

  @ApiPropertyOptional({
    description: 'Pincode (6 digits)',
    example: '400001',
    minLength: 6,
    maxLength: 6,
  })
  @IsOptional()
  @IsString()
  @Length(6, 6)
  pincode?: string;
}

export class UpdateBusinessDto {
  @IsOptional()
  @IsString()
  @Length(2, 200)
  name?: string;

  @IsOptional()
  @IsString()
  type?: string;

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

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  address_line1?: string;

  @IsOptional()
  @IsString()
  address_line2?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  state?: string;

  @IsOptional()
  @IsString()
  @Length(6, 6)
  pincode?: string;
}

export class BusinessResponseDto {
  id: string;
  owner_id: string;
  name: string;
  type?: string;
  gstin?: string;
  pan?: string;
  phone?: string;
  email?: string;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  state?: string;
  pincode?: string;
  country: string;
  status: string;
  created_at: Date;
  updated_at: Date;
}

