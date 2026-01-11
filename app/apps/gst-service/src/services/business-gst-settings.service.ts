import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { BusinessGstSettingsRepository } from '../repositories/business-gst-settings.repository';
import { BusinessGstSettings } from '../entities/business-gst-settings.entity';
import { BusinessGstSettingsRequestDto, BusinessGstSettingsResponseDto } from '../dto/business-gst-settings.dto';

/**
 * Business GST Settings Service
 * 
 * Manages GST configuration for each business.
 */
@Injectable()
export class BusinessGstSettingsService {
  private readonly logger = new Logger(BusinessGstSettingsService.name);
  private readonly EINVOICE_THRESHOLD = 50000000; // 5 Crore

  constructor(
    private readonly businessGstSettingsRepository: BusinessGstSettingsRepository,
  ) {}

  /**
   * Get GST settings for a business
   */
  async getSettings(businessId: string): Promise<BusinessGstSettingsResponseDto> {
    const settings = await this.businessGstSettingsRepository.findByBusinessId(businessId);

    if (!settings) {
      // Return default settings
      return this.toResponseDto({
        business_id: businessId,
        gst_type: 'regular',
        filing_frequency: 'monthly',
        einvoice_enabled: false,
        ewaybill_enabled: true,
      } as BusinessGstSettings);
    }

    return this.toResponseDto(settings);
  }

  /**
   * Create or update GST settings
   */
  async upsertSettings(
    businessId: string,
    requestDto: BusinessGstSettingsRequestDto
  ): Promise<BusinessGstSettingsResponseDto> {
    this.logger.log(`Upserting GST settings for business ${businessId}`);

    // Validate GSP credentials if provided
    if (requestDto.gsp_credentials) {
      this.validateGspCredentials(requestDto.gsp_credentials);
    }

    // Auto-enable E-Invoice based on turnover
    let einvoiceEnabled = requestDto.einvoice_enabled;
    if (requestDto.annual_turnover !== undefined) {
      einvoiceEnabled = requestDto.annual_turnover >= this.EINVOICE_THRESHOLD;
      this.logger.log(
        `Auto-enabling E-Invoice for business ${businessId} (turnover: ${requestDto.annual_turnover})`
      );
    }

    // Prepare settings data
    const settingsData: Partial<BusinessGstSettings> = {
      business_id: businessId,
      ...requestDto,
      einvoice_enabled: einvoiceEnabled,
    };

    // Encrypt GSP credentials if provided
    if (requestDto.gsp_credentials) {
      // TODO: Implement encryption
      // For now, store as JSON string
      settingsData.gsp_credentials = JSON.stringify(requestDto.gsp_credentials);
    }

    // Upsert settings
    const settings = await this.businessGstSettingsRepository.upsert(settingsData);

    this.logger.log(`GST settings updated for business ${businessId}`);

    return this.toResponseDto(settings);
  }

  /**
   * Validate GSP credentials format
   */
  private validateGspCredentials(credentials: any): void {
    if (typeof credentials !== 'object' || credentials === null) {
      throw new BadRequestException('GSP credentials must be a valid JSON object');
    }

    // Basic validation - can be extended based on provider
    if (credentials.client_id && typeof credentials.client_id !== 'string') {
      throw new BadRequestException('GSP client_id must be a string');
    }

    if (credentials.client_secret && typeof credentials.client_secret !== 'string') {
      throw new BadRequestException('GSP client_secret must be a string');
    }
  }

  /**
   * Check if E-Invoice is enabled for a business
   */
  async isEinvoiceEnabled(businessId: string): Promise<boolean> {
    const settings = await this.businessGstSettingsRepository.findByBusinessId(businessId);
    
    if (!settings) {
      return false;
    }

    // Check if explicitly enabled or auto-enabled by turnover
    if (settings.einvoice_enabled) {
      return true;
    }

    // Check turnover threshold
    if (settings.annual_turnover && settings.annual_turnover >= this.EINVOICE_THRESHOLD) {
      return true;
    }

    return false;
  }

  /**
   * Check if E-Way Bill is enabled for a business
   */
  async isEwaybillEnabled(businessId: string): Promise<boolean> {
    const settings = await this.businessGstSettingsRepository.findByBusinessId(businessId);
    return settings?.ewaybill_enabled ?? true; // Default to true
  }

  /**
   * Get filing frequency for a business
   */
  async getFilingFrequency(businessId: string): Promise<'monthly' | 'quarterly'> {
    const settings = await this.businessGstSettingsRepository.findByBusinessId(businessId);
    return (settings?.filing_frequency as 'monthly' | 'quarterly') || 'monthly';
  }

  /**
   * Convert entity to response DTO
   */
  private toResponseDto(settings: BusinessGstSettings): BusinessGstSettingsResponseDto {
    return {
      id: settings.id,
      business_id: settings.business_id,
      gst_type: settings.gst_type,
      annual_turnover: settings.annual_turnover,
      filing_frequency: settings.filing_frequency,
      gsp_provider: settings.gsp_provider,
      einvoice_enabled: settings.einvoice_enabled,
      ewaybill_enabled: settings.ewaybill_enabled,
      created_at: settings.created_at,
      updated_at: settings.updated_at,
    };
  }
}

