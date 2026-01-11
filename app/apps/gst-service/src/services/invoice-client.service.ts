import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpClientService } from './http-client.service';

export interface Invoice {
  id: string;
  business_id: string;
  party_id: string;
  invoice_number: string;
  invoice_type: string;
  invoice_date: string;
  due_date?: string;
  place_of_supply?: string;
  is_interstate: boolean;
  is_export: boolean;
  is_rcm: boolean;
  subtotal: number;
  discount_amount: number;
  taxable_amount: number;
  cgst_amount: number;
  sgst_amount: number;
  igst_amount: number;
  cess_amount: number;
  total_amount: number;
  payment_status: string;
  status: string;
  items?: InvoiceItem[];
}

export interface InvoiceItem {
  id: string;
  invoice_id: string;
  item_id?: string;
  item_name: string;
  item_description?: string;
  hsn_code?: string;
  unit?: string;
  quantity: number;
  unit_price: number;
  discount_percent: number;
  discount_amount: number;
  tax_rate: number;
  cgst_rate: number;
  sgst_rate: number;
  igst_rate: number;
  cess_rate: number;
  taxable_amount: number;
  cgst_amount: number;
  sgst_amount: number;
  igst_amount: number;
  cess_amount: number;
  total_amount: number;
}

export interface GetInvoicesParams {
  businessId: string;
  invoiceType?: string;
  startDate?: string;
  endDate?: string;
  includeItems?: boolean;
  page?: number;
  limit?: number;
}

/**
 * Invoice Client Service
 * 
 * Communicates with invoice-service to fetch invoice data.
 */
@Injectable()
export class InvoiceClientService {
  private readonly logger = new Logger(InvoiceClientService.name);
  private readonly baseUrl: string;

  constructor(
    private readonly httpClient: HttpClientService,
    private readonly configService: ConfigService
  ) {
    this.baseUrl =
      this.configService.get<string>('INVOICE_SERVICE_URL', 'http://localhost:3006') +
      '/api/v1';
  }

  /**
   * Get invoices by period
   */
  async getInvoicesByPeriod(
    businessId: string,
    startDate: string,
    endDate: string,
    token: string,
    includeItems: boolean = true
  ): Promise<Invoice[]> {
    const url = `${this.baseUrl}/invoices`;
    const params: any = {
      business_id: businessId,
      start_date: startDate,
      end_date: endDate,
      invoice_type: 'sale', // Only sale invoices for GSTR-1
      include_items: includeItems,
      limit: 1000, // Get all invoices for the period
    };

    try {
      const response = await this.httpClient.get<{
        invoices: Invoice[];
        total: number;
        page: number;
        limit: number;
      }>(url, {
        params,
        headers: {
          Authorization: `Bearer ${token}`,
          'X-Business-Id': businessId,
        },
      });

      return response.invoices || [];
    } catch (error: any) {
      this.logger.error(
        `Failed to fetch invoices: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }

  /**
   * Get invoice by ID
   */
  async getInvoiceById(
    businessId: string,
    invoiceId: string,
    token: string
  ): Promise<Invoice> {
    const url = `${this.baseUrl}/invoices/${invoiceId}`;

    try {
      return await this.httpClient.get<Invoice>(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          'X-Business-Id': businessId,
        },
      });
    } catch (error: any) {
      this.logger.error(
        `Failed to fetch invoice ${invoiceId}: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }
}

