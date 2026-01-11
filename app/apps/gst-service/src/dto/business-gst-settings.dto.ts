import { IsString, IsOptional, IsBoolean, IsNumber, IsEnum, IsObject, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Business GST Settings Request DTO
 */
export class BusinessGstSettingsRequestDto {
  @ApiPropertyOptional({
    description: 'GST type',
    enum: ['regular', 'composition'],
    example: 'regular',
  })
  @IsOptional()
  @IsEnum(['regular', 'composition'])
  gst_type?: string;

  @ApiPropertyOptional({
    description: 'Annual turnover in INR',
    example: 5000000,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  annual_turnover?: number;

  @ApiPropertyOptional({
    description: 'Filing frequency',
    enum: ['monthly', 'quarterly'],
    example: 'monthly',
  })
  @IsOptional()
  @IsEnum(['monthly', 'quarterly'])
  filing_frequency?: string;

  @ApiPropertyOptional({
    description: 'GSP provider name',
    example: 'cleartax',
  })
  @IsOptional()
  @IsString()
  gsp_provider?: string;

  @ApiPropertyOptional({
    description: 'GSP credentials (encrypted JSON)',
    example: '{"client_id": "...", "client_secret": "..."}',
  })
  @IsOptional()
  @IsObject()
  gsp_credentials?: any;

  @ApiPropertyOptional({
    description: 'Enable E-Invoice (auto-enabled if turnover >= 5Cr)',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  einvoice_enabled?: boolean;

  @ApiPropertyOptional({
    description: 'Enable E-Way Bill',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  ewaybill_enabled?: boolean;
}

/**
 * Business GST Settings Response DTO
 */
export class BusinessGstSettingsResponseDto {
  @ApiProperty({ description: 'Settings ID' })
  id: string;

  @ApiProperty({ description: 'Business ID' })
  business_id: string;

  @ApiProperty({ description: 'GST type', example: 'regular' })
  gst_type: string;

  @ApiPropertyOptional({ description: 'Annual turnover', example: 5000000 })
  annual_turnover?: number;

  @ApiProperty({ description: 'Filing frequency', example: 'monthly' })
  filing_frequency: string;

  @ApiPropertyOptional({ description: 'GSP provider', example: 'cleartax' })
  gsp_provider?: string;

  @ApiProperty({ description: 'E-Invoice enabled', example: false })
  einvoice_enabled: boolean;

  @ApiProperty({ description: 'E-Way Bill enabled', example: true })
  ewaybill_enabled: boolean;

  @ApiProperty({ description: 'Created at' })
  created_at: Date;

  @ApiProperty({ description: 'Updated at' })
  updated_at: Date;
}

