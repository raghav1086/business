import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpClientService } from './http-client.service';

export interface Party {
  id: string;
  business_id: string;
  party_type: string; // 'customer' | 'supplier'
  name: string;
  gstin?: string;
  pan?: string;
  phone?: string;
  email?: string;
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
 * Party Client Service
 * 
 * Communicates with party-service to fetch party data.
 */
@Injectable()
export class PartyClientService {
  private readonly logger = new Logger(PartyClientService.name);
  private readonly baseUrl: string;

  constructor(
    private readonly httpClient: HttpClientService,
    private readonly configService: ConfigService
  ) {
    this.baseUrl =
      this.configService.get<string>('PARTY_SERVICE_URL', 'http://localhost:3004') +
      '/api/v1';
  }

  /**
   * Get party by ID
   */
  async getParty(
    businessId: string,
    partyId: string,
    token: string
  ): Promise<Party> {
    const url = `${this.baseUrl}/parties/${partyId}`;

    try {
      return await this.httpClient.get<Party>(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          'X-Business-Id': businessId,
        },
      });
    } catch (error: any) {
      this.logger.error(
        `Failed to fetch party ${partyId}: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }

  /**
   * Get multiple parties by IDs
   */
  async getPartiesByIds(
    businessId: string,
    partyIds: string[],
    token: string
  ): Promise<Party[]> {
    // Fetch parties in parallel
    const promises = partyIds.map((partyId) =>
      this.getParty(businessId, partyId, token).catch((error) => {
        this.logger.warn(`Failed to fetch party ${partyId}: ${error.message}`);
        return null;
      })
    );

    const parties = await Promise.all(promises);
    return parties.filter((party): party is Party => party !== null);
  }
}

