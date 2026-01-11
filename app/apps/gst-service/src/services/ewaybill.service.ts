import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { InvoiceClientService, Invoice } from './invoice-client.service';
import { PartyClientService, Party } from './party-client.service';
import { BusinessClientService, Business } from './business-client.service';
import { BusinessGstSettingsService } from './business-gst-settings.service';
import { GSPProviderFactory } from './gsp/gsp-provider.factory';
import { GSPAuthService } from './gsp/gsp-auth.service';
import { EWayBillRepository } from '../repositories/ewaybill.repository';
import { EWayBillFormatter } from '../utils/ewaybill-formatter.util';
import { EWayBillResponse } from '../interfaces/gsp-provider.interface';

/**
 * E-Way Bill Service
 * 
 * Handles E-Way Bill generation via GSP providers.
 */
@Injectable()
export class EWayBillService {
  private readonly logger = new Logger(EWayBillService.name);
  private readonly EWAYBILL_THRESHOLD = 50000; // 50K

  constructor(
    private readonly invoiceClient: InvoiceClientService,
    private readonly partyClient: PartyClientService,
    private readonly businessClient: BusinessClientService,
    private readonly businessGstSettingsService: BusinessGstSettingsService,
    private readonly gspProviderFactory: GSPProviderFactory,
    private readonly gspAuthService: GSPAuthService,
    private readonly ewayBillRepository: EWayBillRepository,
  ) {}

  /**
   * Generate E-Way Bill for an invoice
   */
  async generateEWayBill(
    businessId: string,
    invoiceId: string,
    token: string
  ): Promise<EWayBillResponse> {
    this.logger.log(`Generating E-Way Bill for invoice ${invoiceId}, business ${businessId}`);

    // Check if E-Way Bill is enabled for this business
    const isEnabled = await this.businessGstSettingsService.isEwaybillEnabled(businessId);
    if (!isEnabled) {
      throw new BadRequestException('E-Way Bill is not enabled for this business');
    }

    // Fetch invoice data
    const invoice = await this.invoiceClient.getInvoiceById(businessId, invoiceId, token);
    if (!invoice) {
      throw new NotFoundException(`Invoice ${invoiceId} not found`);
    }

    // Validate invoice for E-Way Bill
    this.validateInvoiceForEWayBill(invoice);

    // Check if E-Way Bill already exists
    const existingEWayBill = await this.ewayBillRepository.findByInvoiceId(invoiceId);
    if (existingEWayBill?.ewaybill_number && existingEWayBill.status === 'generated') {
      this.logger.warn(`E-Way Bill already exists for invoice ${invoiceId}: ${existingEWayBill.ewaybill_number}`);
      return {
        success: true,
        ewayBillNo: existingEWayBill.ewaybill_number,
        ewayBillDate: existingEWayBill.generated_at?.toISOString().split('T')[0] || '',
        validUpto: existingEWayBill.valid_until?.toISOString().split('T')[0] || '',
      };
    }

    // Fetch business and party details
    const business = await this.businessClient.getBusiness(businessId, token);
    if (!business.gstin) {
      throw new BadRequestException('Business GSTIN is required for E-Way Bill generation');
    }

    const party = await this.partyClient.getParty(businessId, invoice.party_id, token);
    if (!party) {
      throw new NotFoundException(`Party ${invoice.party_id} not found`);
    }

    // Get GSP provider
    const gstSettings = await this.businessGstSettingsService.getSettings(businessId);
    const providerName = gstSettings.gsp_provider || 'cleartax';
    const gspCredentials = await this.gspAuthService.getCredentials(businessId);

    if (!gspCredentials) {
      throw new BadRequestException(
        'GSP credentials not configured. Please configure GSP provider in GST settings.'
      );
    }

    // Get GSP provider instance
    const provider = this.gspProviderFactory.getProvider(
      providerName,
      gspCredentials.apiUrl,
      gspCredentials
    );

    // Format invoice to E-Way Bill payload
    const ewayBillPayload = EWayBillFormatter.formatInvoice(
      invoice,
      invoice.items || [],
      business,
      party
    );

    // Create E-Way Bill request record
    const ewayBill = await this.ewayBillRepository.create({
      business_id: businessId,
      invoice_id: invoiceId,
      status: 'pending',
      requested_at: new Date(),
    });

    try {
      // Generate E-Way Bill via GSP
      const ewayBillResponse = await provider.generateEWayBill(ewayBillPayload);

      if (!ewayBillResponse.success) {
        // Update request with error
        await this.ewayBillRepository.update(ewayBill.id, {
          status: 'failed',
          error_message: ewayBillResponse.error || 'E-Way Bill generation failed',
        });

        throw new BadRequestException(
          `E-Way Bill generation failed: ${ewayBillResponse.error || 'Unknown error'}`
        );
      }

      // Calculate validity (typically 1 day from generation)
      const validUntil = new Date();
      validUntil.setDate(validUntil.getDate() + 1);

      // Update request with success
      await this.ewayBillRepository.update(ewayBill.id, {
        ewaybill_number: ewayBillResponse.ewayBillNo,
        status: 'generated',
        valid_until: validUntil,
        generated_at: new Date(),
      });

      this.logger.log(
        `E-Way Bill generated successfully for invoice ${invoiceId}: ${ewayBillResponse.ewayBillNo}`
      );

      return ewayBillResponse;
    } catch (error: any) {
      // Update request with error
      await this.ewayBillRepository.update(ewayBill.id, {
        status: 'failed',
        error_message: error.message,
      });

      this.logger.error(`E-Way Bill generation failed for invoice ${invoiceId}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get E-Way Bill status
   */
  async getEWayBillStatus(
    businessId: string,
    invoiceId: string,
    token: string
  ): Promise<{ ewayBillNo?: string; status: string; validUpto?: string; error?: string }> {
    const ewayBill = await this.ewayBillRepository.findByInvoiceId(invoiceId);

    if (!ewayBill) {
      return { status: 'not_generated' };
    }

    return {
      ewayBillNo: ewayBill.ewaybill_number,
      status: ewayBill.status,
      validUpto: ewayBill.valid_until?.toISOString().split('T')[0],
      error: ewayBill.error_message,
    };
  }

  /**
   * Cancel E-Way Bill
   */
  async cancelEWayBill(
    businessId: string,
    invoiceId: string,
    cancelReason: string,
    token: string
  ): Promise<{ success: boolean; message: string }> {
    const ewayBill = await this.ewayBillRepository.findByInvoiceId(invoiceId);

    if (!ewayBill || !ewayBill.ewaybill_number) {
      throw new NotFoundException('E-Way Bill not found for this invoice');
    }

    if (ewayBill.status !== 'generated') {
      throw new BadRequestException(`Cannot cancel E-Way Bill. Current status: ${ewayBill.status}`);
    }

    // Get GSP provider
    const gstSettings = await this.businessGstSettingsService.getSettings(businessId);
    const providerName = gstSettings.gsp_provider || 'cleartax';
    const gspCredentials = await this.gspAuthService.getCredentials(businessId);

    if (!gspCredentials) {
      throw new BadRequestException('GSP credentials not configured');
    }

    const provider = this.gspProviderFactory.getProvider(
      providerName,
      gspCredentials.apiUrl,
      gspCredentials
    );

    // Cancel E-Way Bill via GSP
    const cancelResponse = await provider.cancelEWayBill(ewayBill.ewaybill_number, cancelReason);

    if (!cancelResponse.success) {
      throw new BadRequestException(
        `E-Way Bill cancellation failed: ${cancelResponse.error || 'Unknown error'}`
      );
    }

    // Update request
    await this.ewayBillRepository.update(ewayBill.id, {
      status: 'cancelled',
      error_message: `Cancelled: ${cancelReason}`,
    });

    return {
      success: true,
      message: `E-Way Bill ${ewayBill.ewaybill_number} cancelled successfully`,
    };
  }

  /**
   * Update E-Way Bill
   */
  async updateEWayBill(
    businessId: string,
    invoiceId: string,
    updateData: {
      transporterId?: string;
      transporterName?: string;
      vehicleNo?: string;
      vehicleType?: string;
      transDistance?: number;
      transMode?: string;
    },
    token: string
  ): Promise<EWayBillResponse> {
    const ewayBill = await this.ewayBillRepository.findByInvoiceId(invoiceId);

    if (!ewayBill || !ewayBill.ewaybill_number) {
      throw new NotFoundException('E-Way Bill not found for this invoice');
    }

    if (ewayBill.status !== 'generated') {
      throw new BadRequestException(`Cannot update E-Way Bill. Current status: ${ewayBill.status}`);
    }

    // Get GSP provider
    const gstSettings = await this.businessGstSettingsService.getSettings(businessId);
    const providerName = gstSettings.gsp_provider || 'cleartax';
    const gspCredentials = await this.gspAuthService.getCredentials(businessId);

    if (!gspCredentials) {
      throw new BadRequestException('GSP credentials not configured');
    }

    const provider = this.gspProviderFactory.getProvider(
      providerName,
      gspCredentials.apiUrl,
      gspCredentials
    );

    // Update E-Way Bill via GSP
    const updateResponse = await provider.updateEWayBill(ewayBill.ewaybill_number, updateData);

    if (!updateResponse.success) {
      throw new BadRequestException(
        `E-Way Bill update failed: ${updateResponse.error || 'Unknown error'}`
      );
    }

    // Update request
    await this.ewayBillRepository.update(ewayBill.id, {
      valid_until: updateResponse.validUpto ? new Date(updateResponse.validUpto) : ewayBill.valid_until,
    });

    return updateResponse;
  }

  /**
   * Validate invoice for E-Way Bill generation
   */
  private validateInvoiceForEWayBill(invoice: Invoice): void {
    // Check threshold (50K)
    if (!invoice.total_amount || invoice.total_amount < this.EWAYBILL_THRESHOLD) {
      throw new BadRequestException(
        `E-Way Bill is required only for invoices with value >= ${this.EWAYBILL_THRESHOLD}. Current value: ${invoice.total_amount || 0}`
      );
    }

    // Must have items
    if (!invoice.items || invoice.items.length === 0) {
      throw new BadRequestException('Invoice must have at least one item');
    }

    // Must have place of supply for inter-state
    if (invoice.is_interstate && !invoice.place_of_supply) {
      throw new BadRequestException('Place of supply is required for inter-state invoices');
    }
  }
}

