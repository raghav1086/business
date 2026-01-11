import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { IGSPProvider, EInvoicePayload, IRNResponse, IRNCancelResponse, EWayBillPayload, EWayBillResponse, EWayBillCancelResponse, IRNStatusResponse, EWayBillStatusResponse } from '../../interfaces/gsp-provider.interface';

/**
 * ClearTax GSP Provider Implementation
 * 
 * Implements GSP interface for ClearTax IRP (Invoice Registration Portal).
 * This is a placeholder implementation - actual API endpoints and authentication
 * will need to be configured based on ClearTax documentation.
 */
@Injectable()
export class ClearTaxGSPProvider implements IGSPProvider {
  private readonly logger = new Logger(ClearTaxGSPProvider.name);
  private accessToken: string | null = null;
  private tokenExpiry: Date | null = null;
  private apiUrl: string = 'https://api.cleartax.in'; // Placeholder URL
  private credentials: {
    client_id: string;
    client_secret: string;
    username?: string;
    password?: string;
  } | null = null;

  constructor(
    private readonly httpService: HttpService,
  ) {}

  /**
   * Initialize provider with credentials
   */
  initialize(apiUrl: string, credentials: {
    client_id: string;
    client_secret: string;
    username?: string;
    password?: string;
  }): void {
    this.apiUrl = apiUrl;
    this.credentials = credentials;
  }

  /**
   * Authenticate with ClearTax
   */
  async authenticate(): Promise<string> {
    if (!this.credentials) {
      throw new BadRequestException('GSP provider not initialized with credentials');
    }

    // Check if token is still valid
    if (this.accessToken && this.tokenExpiry && this.tokenExpiry > new Date()) {
      return this.accessToken;
    }

    try {
      // TODO: Implement actual ClearTax authentication
      // This is a placeholder - actual implementation will depend on ClearTax API
      const response = await firstValueFrom(
        this.httpService.post(`${this.apiUrl}/auth/token`, {
          client_id: this.credentials.client_id,
          client_secret: this.credentials.client_secret,
          grant_type: 'client_credentials',
        })
      );

      this.accessToken = response.data.access_token;
      const expiresIn = response.data.expires_in || 3600; // Default 1 hour
      this.tokenExpiry = new Date(Date.now() + expiresIn * 1000);

      this.logger.log('Authenticated with ClearTax');
      return this.accessToken;
    } catch (error: any) {
      this.logger.error(`ClearTax authentication failed: ${error.message}`);
      throw new BadRequestException(`GSP authentication failed: ${error.message}`);
    }
  }

  /**
   * Generate IRN
   */
  async generateIRN(invoiceData: EInvoicePayload): Promise<IRNResponse> {
    try {
      const token = await this.authenticate();

      // TODO: Implement actual ClearTax IRN generation
      // This is a placeholder
      const response = await firstValueFrom(
        this.httpService.post(
          `${this.apiUrl}/einvoice/irn/generate`,
          invoiceData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          }
        )
      );

      return {
        success: true,
        irn: response.data.Irn,
        ackNo: response.data.AckNo,
        ackDate: response.data.AckDt,
        qrCode: response.data.QRCode,
        ewayBillNo: response.data.EwbNo,
        signedInvoice: response.data.SignedInvoice,
        signedQRCode: response.data.SignedQRCode,
      };
    } catch (error: any) {
      this.logger.error(`IRN generation failed: ${error.message}`);
      return {
        success: false,
        irn: '',
        ackNo: '',
        ackDate: '',
        qrCode: '',
        error: error.response?.data?.message || error.message,
        errorCode: error.response?.data?.errorCode || 'IRN_GENERATION_FAILED',
      };
    }
  }

  /**
   * Cancel IRN
   */
  async cancelIRN(irn: string, cancelReason: string): Promise<IRNCancelResponse> {
    try {
      const token = await this.authenticate();

      // TODO: Implement actual ClearTax IRN cancellation
      const response = await firstValueFrom(
        this.httpService.post(
          `${this.apiUrl}/einvoice/irn/cancel`,
          {
            Irn: irn,
            CancelRsn: cancelReason,
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        )
      );

      return {
        success: true,
        irn: response.data.Irn,
        cancelDate: response.data.CancelDate,
      };
    } catch (error: any) {
      this.logger.error(`IRN cancellation failed: ${error.message}`);
      return {
        success: false,
        irn: irn,
        cancelDate: '',
        error: error.response?.data?.message || error.message,
        errorCode: error.response?.data?.errorCode || 'IRN_CANCEL_FAILED',
      };
    }
  }

  /**
   * Generate E-Way Bill
   */
  async generateEWayBill(ewayBillData: EWayBillPayload): Promise<EWayBillResponse> {
    try {
      const token = await this.authenticate();

      // TODO: Implement actual ClearTax E-Way Bill generation
      const response = await firstValueFrom(
        this.httpService.post(
          `${this.apiUrl}/ewaybill/generate`,
          ewayBillData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        )
      );

      return {
        success: true,
        ewayBillNo: response.data.ewayBillNo,
        ewayBillDate: response.data.ewayBillDate,
        validUpto: response.data.validUpto,
      };
    } catch (error: any) {
      this.logger.error(`E-Way Bill generation failed: ${error.message}`);
      return {
        success: false,
        ewayBillNo: '',
        ewayBillDate: '',
        validUpto: '',
        error: error.response?.data?.message || error.message,
        errorCode: error.response?.data?.errorCode || 'EWAYBILL_GENERATION_FAILED',
      };
    }
  }

  /**
   * Cancel E-Way Bill
   */
  async cancelEWayBill(ewayBillNumber: string, cancelReason: string): Promise<EWayBillCancelResponse> {
    try {
      const token = await this.authenticate();

      // TODO: Implement actual ClearTax E-Way Bill cancellation
      const response = await firstValueFrom(
        this.httpService.post(
          `${this.apiUrl}/ewaybill/cancel`,
          {
            ewayBillNo: ewayBillNumber,
            cancelRsn: cancelReason,
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        )
      );

      return {
        success: true,
        ewayBillNo: response.data.ewayBillNo,
        cancelDate: response.data.cancelDate,
      };
    } catch (error: any) {
      this.logger.error(`E-Way Bill cancellation failed: ${error.message}`);
      return {
        success: false,
        ewayBillNo: ewayBillNumber,
        cancelDate: '',
        error: error.response?.data?.message || error.message,
        errorCode: error.response?.data?.errorCode || 'EWAYBILL_CANCEL_FAILED',
      };
    }
  }

  /**
   * Update E-Way Bill
   */
  async updateEWayBill(ewayBillNumber: string, updateData: Partial<EWayBillPayload>): Promise<EWayBillResponse> {
    try {
      const token = await this.authenticate();

      // TODO: Implement actual ClearTax E-Way Bill update
      const response = await firstValueFrom(
        this.httpService.post(
          `${this.apiUrl}/ewaybill/update`,
          {
            ewayBillNo: ewayBillNumber,
            ...updateData,
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        )
      );

      return {
        success: true,
        ewayBillNo: response.data.ewayBillNo,
        ewayBillDate: response.data.ewayBillDate,
        validUpto: response.data.validUpto,
      };
    } catch (error: any) {
      this.logger.error(`E-Way Bill update failed: ${error.message}`);
      return {
        success: false,
        ewayBillNo: ewayBillNumber,
        ewayBillDate: '',
        validUpto: '',
        error: error.response?.data?.message || error.message,
        errorCode: error.response?.data?.errorCode || 'EWAYBILL_UPDATE_FAILED',
      };
    }
  }

  /**
   * Get IRN status
   */
  async getIRNStatus(irn: string): Promise<IRNStatusResponse> {
    try {
      const token = await this.authenticate();

      // TODO: Implement actual ClearTax IRN status check
      const response = await firstValueFrom(
        this.httpService.get(`${this.apiUrl}/einvoice/irn/status/${irn}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
      );

      return {
        success: true,
        irn: irn,
        status: response.data.status,
        ackNo: response.data.ackNo,
        ackDate: response.data.ackDate,
      };
    } catch (error: any) {
      this.logger.error(`IRN status check failed: ${error.message}`);
      return {
        success: false,
        irn: irn,
        status: 'UNKNOWN',
        error: error.response?.data?.message || error.message,
      };
    }
  }

  /**
   * Get E-Way Bill status
   */
  async getEWayBillStatus(ewayBillNumber: string): Promise<EWayBillStatusResponse> {
    try {
      const token = await this.authenticate();

      // TODO: Implement actual ClearTax E-Way Bill status check
      const response = await firstValueFrom(
        this.httpService.get(`${this.apiUrl}/ewaybill/status/${ewayBillNumber}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
      );

      return {
        success: true,
        ewayBillNo: ewayBillNumber,
        status: response.data.status,
        validUpto: response.data.validUpto,
      };
    } catch (error: any) {
      this.logger.error(`E-Way Bill status check failed: ${error.message}`);
      return {
        success: false,
        ewayBillNo: ewayBillNumber,
        status: 'UNKNOWN',
        error: error.response?.data?.message || error.message,
      };
    }
  }
}

