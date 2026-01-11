import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '../guards/auth.guard';
import { CrossServiceBusinessContextGuard } from '@business-app/shared/guards';
import { validateHsnCode } from '../utils/hsn-validator.util';
import { validateSacCode } from '../utils/sac-validator.util';
import {
  ValidateHsnRequestDto,
  ValidateSacRequestDto,
  HsnValidationResponseDto,
  SacValidationResponseDto,
  ValidationErrorDto,
  ValidationWarningDto,
} from '../dto/validation.dto';

/**
 * Validation Controller
 * 
 * Provides HSN and SAC code validation endpoints.
 */
@ApiTags('Validation')
@Controller('api/v1/gst/validate')
@UseGuards(AuthGuard, CrossServiceBusinessContextGuard)
@ApiBearerAuth()
export class ValidationController {
  @Post('hsn')
  @ApiOperation({ summary: 'Validate HSN code' })
  @ApiResponse({
    status: 200,
    description: 'HSN code validation result',
    type: HsnValidationResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async validateHsn(
    @Request() req: any,
    @Body() requestDto: ValidateHsnRequestDto,
  ): Promise<HsnValidationResponseDto> {
    if (!requestDto.hsn_code) {
      throw new BadRequestException('HSN code is required');
    }

    const result = validateHsnCode(requestDto.hsn_code);

    return {
      isValid: result.isValid,
      code: result.code || requestDto.hsn_code,
      length: result.length,
      errors: result.errors.map((msg) => ({ message: msg, field: 'hsn_code' })),
      warnings: result.warnings.map((msg) => ({ message: msg, field: 'hsn_code' })),
    };
  }

  @Post('sac')
  @ApiOperation({ summary: 'Validate SAC code' })
  @ApiResponse({
    status: 200,
    description: 'SAC code validation result',
    type: SacValidationResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async validateSac(
    @Request() req: any,
    @Body() requestDto: ValidateSacRequestDto,
  ): Promise<SacValidationResponseDto> {
    if (!requestDto.sac_code) {
      throw new BadRequestException('SAC code is required');
    }

    const result = validateSacCode(requestDto.sac_code);

    return {
      isValid: result.isValid,
      code: result.code || requestDto.sac_code,
      errors: result.errors.map((msg) => ({ message: msg, field: 'sac_code' })),
      warnings: result.warnings.map((msg) => ({ message: msg, field: 'sac_code' })),
    };
  }
}

