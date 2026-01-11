import {
  Controller,
  Get,
  Put,
  Body,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthGuard } from '../guards/auth.guard';
import { CrossServiceBusinessContextGuard } from '@business-app/shared/guards';
import { BusinessGstSettingsService } from '../services/business-gst-settings.service';
import { BusinessGstSettingsRequestDto, BusinessGstSettingsResponseDto } from '../dto/business-gst-settings.dto';

@ApiTags('GST Settings')
@Controller('api/v1/gst/settings')
@UseGuards(AuthGuard, CrossServiceBusinessContextGuard)
@ApiBearerAuth()
export class BusinessGstSettingsController {
  constructor(
    private readonly businessGstSettingsService: BusinessGstSettingsService
  ) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get GST settings for business' })
  @ApiResponse({
    status: 200,
    description: 'GST settings retrieved successfully',
    type: BusinessGstSettingsResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async getSettings(@Request() req: any): Promise<BusinessGstSettingsResponseDto> {
    const businessId =
      req.businessContext?.businessId ||
      req.headers['x-business-id'] ||
      req.business_id;

    if (!businessId) {
      throw new BadRequestException('Business ID is required');
    }

    return this.businessGstSettingsService.getSettings(businessId);
  }

  @Put()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update GST settings for business' })
  @ApiResponse({
    status: 200,
    description: 'GST settings updated successfully',
    type: BusinessGstSettingsResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async updateSettings(
    @Request() req: any,
    @Body() requestDto: BusinessGstSettingsRequestDto
  ): Promise<BusinessGstSettingsResponseDto> {
    const businessId =
      req.businessContext?.businessId ||
      req.headers['x-business-id'] ||
      req.business_id;

    if (!businessId) {
      throw new BadRequestException('Business ID is required');
    }

    return this.businessGstSettingsService.upsertSettings(businessId, requestDto);
  }
}

