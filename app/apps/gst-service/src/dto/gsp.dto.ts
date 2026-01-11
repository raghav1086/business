import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsObject, IsEnum } from 'class-validator';

/**
 * GSP Provider Configuration
 */
export class GSPProviderConfigDto {
  @ApiProperty({ description: 'GSP Provider name', example: 'cleartax' })
  @IsString()
  provider: string;

  @ApiPropertyOptional({ description: 'GSP API base URL' })
  @IsOptional()
  @IsString()
  apiUrl?: string;

  @ApiProperty({ description: 'GSP credentials', type: 'object' })
  @IsObject()
  credentials: {
    client_id?: string;
    client_secret?: string;
    username?: string;
    password?: string;
    [key: string]: any;
  };
}

/**
 * Generate IRN Request DTO
 */
export class GenerateIRNRequestDto {
  @ApiProperty({ description: 'Invoice ID' })
  @IsString()
  invoiceId: string;
}

/**
 * Generate IRN Response DTO
 */
export class GenerateIRNResponseDto {
  @ApiProperty({ description: 'Invoice Registration Number' })
  irn: string;

  @ApiProperty({ description: 'Acknowledgement number' })
  ackNo: string;

  @ApiProperty({ description: 'Acknowledgement date' })
  ackDate: string;

  @ApiProperty({ description: 'QR code (base64)' })
  qrCode: string;

  @ApiPropertyOptional({ description: 'E-Way Bill number' })
  ewayBillNo?: string;
}

/**
 * Cancel IRN Request DTO
 */
export class CancelIRNRequestDto {
  @ApiProperty({ description: 'IRN to cancel' })
  @IsString()
  irn: string;

  @ApiProperty({ description: 'Cancellation reason', enum: ['1', '2', '3', '4', '5'] })
  @IsEnum(['1', '2', '3', '4', '5'])
  reason: string; // 1=Duplicate, 2=Data entry mistake, 3=Order cancelled, 4=Other, 5=Not a supply
}

/**
 * Generate E-Way Bill Request DTO
 */
export class GenerateEWayBillRequestDto {
  @ApiProperty({ description: 'Invoice ID' })
  @IsString()
  invoiceId: string;
}

/**
 * Generate E-Way Bill Response DTO
 */
export class GenerateEWayBillResponseDto {
  @ApiProperty({ description: 'E-Way Bill number' })
  ewayBillNo: string;

  @ApiProperty({ description: 'E-Way Bill date' })
  ewayBillDate: string;

  @ApiProperty({ description: 'Valid until date' })
  validUpto: string;
}

