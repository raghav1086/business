import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpClientService } from './http-client.service';

export interface Business {
  id: string;
  name: string;
  gstin?: string;
  pan?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    pincode?: string;
    country?: string;
  };
  state_code?: string;
}

/**
 * Business Client Service
 * 
 * Communicates with business-service to fetch business data.
 */
@Injectable()
export class BusinessClientService {
  private readonly logger = new Logger(BusinessClientService.name);
  private readonly baseUrl: string;

  constructor(
    private readonly httpClient: HttpClientService,
    private readonly configService: ConfigService
  ) {
    this.baseUrl =
      this.configService.get<string>('BUSINESS_SERVICE_URL', 'http://localhost:3003') +
      '/api/v1';
  }

  /**
   * Get business by ID
   */
  async getBusiness(
    businessId: string,
    token: string
  ): Promise<Business> {
    const url = `${this.baseUrl}/businesses/${businessId}`;

    try {
      return await this.httpClient.get<Business>(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          'X-Business-Id': businessId,
        },
      });
    } catch (error: any) {
      this.logger.error(
        `Failed to fetch business ${businessId}: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }
}

