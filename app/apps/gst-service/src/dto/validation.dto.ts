import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Validation Error DTO
 */
export class ValidationErrorDto {
  @ApiProperty({ description: 'Error message', example: 'HSN code must be 4, 6, or 8 digits' })
  message: string;

  @ApiPropertyOptional({ description: 'Field name', example: 'hsn_code' })
  field?: string;
}

/**
 * Validation Warning DTO
 */
export class ValidationWarningDto {
  @ApiProperty({ description: 'Warning message', example: 'First 4 digits may not be a valid HSN chapter' })
  message: string;

  @ApiPropertyOptional({ description: 'Field name', example: 'hsn_code' })
  field?: string;
}

/**
 * HSN Validation Response DTO
 */
export class HsnValidationResponseDto {
  @ApiProperty({ description: 'Whether the HSN code is valid', example: true })
  isValid: boolean;

  @ApiProperty({ description: 'HSN code', example: '85171290' })
  code: string;

  @ApiPropertyOptional({ description: 'Code length', example: 8 })
  length?: number;

  @ApiProperty({ description: 'Validation errors', type: [ValidationErrorDto] })
  errors: ValidationErrorDto[];

  @ApiProperty({ description: 'Validation warnings', type: [ValidationWarningDto] })
  warnings: ValidationWarningDto[];
}

/**
 * SAC Validation Response DTO
 */
export class SacValidationResponseDto {
  @ApiProperty({ description: 'Whether the SAC code is valid', example: true })
  isValid: boolean;

  @ApiProperty({ description: 'SAC code', example: '998314' })
  code: string;

  @ApiProperty({ description: 'Validation errors', type: [ValidationErrorDto] })
  errors: ValidationErrorDto[];

  @ApiProperty({ description: 'Validation warnings', type: [ValidationWarningDto] })
  warnings: ValidationWarningDto[];
}

/**
 * Validate HSN Request DTO
 */
export class ValidateHsnRequestDto {
  @ApiProperty({ description: 'HSN code to validate', example: '85171290' })
  hsn_code: string;
}

/**
 * Validate SAC Request DTO
 */
export class ValidateSacRequestDto {
  @ApiProperty({ description: 'SAC code to validate', example: '998314' })
  sac_code: string;
}

