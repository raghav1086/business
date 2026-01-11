import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { InvoiceClientService, Invoice } from './invoice-client.service';
import { PartyClientService, Party } from './party-client.service';
import { BusinessClientService, Business } from './business-client.service';
import { BusinessGstSettingsService } from './business-gst-settings.service';
import { GSPProviderFactory } from './gsp/gsp-provider.factory';
import { GSPAuthService } from './gsp/gsp-auth.service';
import { EInvoiceRequestRepository } from '../repositories/einvoice-request.repository';
import { EInvoiceFormatter } from '../utils/einvoice-formatter.util';
import { IRNResponse } from '../interfaces/gsp-provider.interface';

/**
 * E-Invoice Service
 * 
 * Handles E-Invoice IRN generation via GSP providers.
 */
@Injectable()
export class EInvoiceService {
  private readonly logger = new Logger(EInvoiceService.name);
  private readonly EINVOICE_THRESHOLD = 50000000; // 5 Crore

  constructor(
    private readonly invoiceClient: InvoiceClientService,
    private readonly partyClient: PartyClientService,
    private readonly businessClient: BusinessClientService,
    private readonly businessGstSettingsService: BusinessGstSettingsService,
    private readonly gspProviderFactory: GSPProviderFactory,
    private readonly gspAuthService: GSPAuthService,
    private readonly einvoiceRequestRepository: EInvoiceRequestRepository,
  ) {}

  /**
   * Generate IRN for an invoice
   */
  async generateIRN(
    businessId: string,
    invoiceId: string,
    token: string
  ): Promise<IRNResponse> {
    this.logger.log(`Generating IRN for invoice ${invoiceId}, business ${businessId}`);

    // Check if E-Invoice is enabled for this business
    const isEnabled = await this.businessGstSettingsService.isEinvoiceEnabled(businessId);
    if (!isEnabled) {
      throw new BadRequestException(
        'E-Invoice is not enabled for this business. Annual turnover must be >= 5 Crore.'
      );
    }

    // Check if IRN already exists
    const existingRequest = await this.einvoiceRequestRepository.findByInvoiceId(invoiceId);
    if (existingRequest?.irn && existingRequest.status === 'success') {
      this.logger.warn(`IRN already exists for invoice ${invoiceId}: ${existingRequest.irn}`);
      return {
        success: true,
        irn: existingRequest.irn,
        ackNo: '',
        ackDate: existingRequest.generated_at?.toISOString().split('T')[0] || '',
        qrCode: existingRequest.qr_code || '',
      };
    }

    // Fetch invoice data
    const invoice = await this.invoiceClient.getInvoiceById(businessId, invoiceId, token);
    if (!invoice) {
      throw new NotFoundException(`Invoice ${invoiceId} not found`);
    }

    // Validate invoice
    this.validateInvoiceForEInvoice(invoice);

    // Fetch business and party details
    const business = await this.businessClient.getBusiness(businessId, token);
    if (!business.gstin) {
      throw new BadRequestException('Business GSTIN is required for E-Invoice generation');
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

    // Format invoice to E-Invoice payload
    const einvoicePayload = EInvoiceFormatter.formatInvoice(
      invoice,
      invoice.items || [],
      business,
      party
    );

    // Create E-Invoice request record
    const einvoiceRequest = await this.einvoiceRequestRepository.create({
      business_id: businessId,
      invoice_id: invoiceId,
      status: 'pending',
      requested_at: new Date(),
    });

    try {
      // Generate IRN via GSP
      const irnResponse = await provider.generateIRN(einvoicePayload);

      if (!irnResponse.success) {
        // Update request with error
        await this.einvoiceRequestRepository.update(einvoiceRequest.id, {
          status: 'failed',
          error_message: irnResponse.error || 'IRN generation failed',
        });

        throw new BadRequestException(
          `IRN generation failed: ${irnResponse.error || 'Unknown error'}`
        );
      }

      // Update request with success
      await this.einvoiceRequestRepository.update(einvoiceRequest.id, {
        irn: irnResponse.irn,
        qr_code: irnResponse.qrCode,
        status: 'success',
        generated_at: new Date(),
      });

      this.logger.log(`IRN generated successfully for invoice ${invoiceId}: ${irnResponse.irn}`);

      return irnResponse;
    } catch (error: any) {
      // Update request with error
      await this.einvoiceRequestRepository.update(einvoiceRequest.id, {
        status: 'failed',
        error_message: error.message,
      });

      this.logger.error(`IRN generation failed for invoice ${invoiceId}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get IRN status
   */
  async getIRNStatus(
    businessId: string,
    invoiceId: string,
    token: string
  ): Promise<{ irn?: string; status: string; qrCode?: string; error?: string }> {
    const request = await this.einvoiceRequestRepository.findByInvoiceId(invoiceId);

    if (!request) {
      return { status: 'not_generated' };
    }

    return {
      irn: request.irn,
      status: request.status,
      qrCode: request.qr_code,
      error: request.error_message,
    };
  }

  /**
   * Cancel IRN
   */
  async cancelIRN(
    businessId: string,
    invoiceId: string,
    cancelReason: string,
    token: string
  ): Promise<{ success: boolean; message: string }> {
    const request = await this.einvoiceRequestRepository.findByInvoiceId(invoiceId);

    if (!request || !request.irn) {
      throw new NotFoundException('IRN not found for this invoice');
    }

    if (request.status !== 'success') {
      throw new BadRequestException(`Cannot cancel IRN. Current status: ${request.status}`);
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

    // Cancel IRN via GSP
    const cancelResponse = await provider.cancelIRN(request.irn, cancelReason);

    if (!cancelResponse.success) {
      throw new BadRequestException(
        `IRN cancellation failed: ${cancelResponse.error || 'Unknown error'}`
      );
    }

    // Update request
    await this.einvoiceRequestRepository.update(request.id, {
      status: 'cancelled',
      error_message: `Cancelled: ${cancelReason}`,
    });

    return {
      success: true,
      message: `IRN ${request.irn} cancelled successfully`,
    };
  }

  /**
   * Validate invoice for E-Invoice generation
   */
  private validateInvoiceForEInvoice(invoice: Invoice): void {
    // Must be a sale invoice
    if (invoice.invoice_type !== 'sale') {
      throw new BadRequestException('E-Invoice can only be generated for sale invoices');
    }

    // Must have items
    if (!invoice.items || invoice.items.length === 0) {
      throw new BadRequestException('Invoice must have at least one item');
    }

    // All items must have HSN codes
    const itemsWithoutHSN = invoice.items.filter(
      (item) => !item.hsn_code || item.hsn_code === 'N/A'
    );
    if (itemsWithoutHSN.length > 0) {
      throw new BadRequestException(
        'All invoice items must have valid HSN codes for E-Invoice generation'
      );
    }

    // Must have valid amounts
    if (!invoice.total_amount || invoice.total_amount <= 0) {
      throw new BadRequestException('Invoice must have a valid total amount');
    }
  }
}

