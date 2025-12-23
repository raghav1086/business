/**
 * API Client
 * 
 * Helper for making API requests in tests with consistent error handling.
 */

import { APIRequestContext } from '@playwright/test';
import { API } from './test-helpers';

export interface ApiResponse<T = any> {
  ok: boolean;
  status: number;
  data: T | null;
  error: string | null;
}

export class TestApiClient {
  private authToken: string = '';
  private businessId: string = '';
  
  constructor(private request: APIRequestContext) {}
  
  setAuthToken(token: string): void {
    this.authToken = token;
  }
  
  getAuthToken(): string {
    return this.authToken;
  }
  
  setBusinessId(id: string): void {
    this.businessId = id;
  }
  
  getBusinessId(): string {
    return this.businessId;
  }
  
  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (this.authToken) {
      headers['Authorization'] = `Bearer ${this.authToken}`;
    }
    return headers;
  }
  
  private async handleResponse<T>(response: any): Promise<ApiResponse<T>> {
    const status = response.status();
    const ok = response.ok();
    let data: T | null = null;
    let error: string | null = null;
    
    try {
      const body = await response.json();
      if (ok) {
        data = body.data || body;
      } else {
        error = body.message || body.error || JSON.stringify(body);
      }
    } catch {
      try {
        error = await response.text();
      } catch {
        error = 'Unknown error';
      }
    }
    
    return { ok, status, data, error };
  }
  
  // Auth Service
  async sendOtp(phone: string, purpose: string = 'login'): Promise<ApiResponse<{ otp_id: string }>> {
    const response = await this.request.post(`${API.auth}/auth/send-otp`, {
      data: { phone, purpose },
    });
    return this.handleResponse(response);
  }
  
  async verifyOtp(phone: string, otp: string, otpId: string): Promise<ApiResponse<{ access_token: string; user: any }>> {
    const response = await this.request.post(`${API.auth}/auth/verify-otp`, {
      data: { phone, otp, otp_id: otpId },
    });
    const result = await this.handleResponse<any>(response);
    if (result.ok && result.data) {
      this.authToken = result.data.tokens?.access_token || result.data.accessToken || result.data.token;
    }
    return result;
  }
  
  // Business Service
  async createBusiness(data: any): Promise<ApiResponse<any>> {
    const response = await this.request.post(`${API.business}/businesses`, {
      headers: this.getHeaders(),
      data,
    });
    const result = await this.handleResponse(response);
    if (result.ok && result.data) {
      this.businessId = result.data.id || result.data.business_id;
    }
    return result;
  }
  
  async getBusiness(id: string): Promise<ApiResponse<any>> {
    const response = await this.request.get(`${API.business}/businesses/${id}`, {
      headers: this.getHeaders(),
    });
    return this.handleResponse(response);
  }
  
  async listBusinesses(): Promise<ApiResponse<any[]>> {
    const response = await this.request.get(`${API.business}/businesses`, {
      headers: this.getHeaders(),
    });
    return this.handleResponse(response);
  }
  
  // Party Service
  async createParty(data: any): Promise<ApiResponse<any>> {
    const response = await this.request.post(`${API.party}/parties`, {
      headers: this.getHeaders(),
      data: { ...data, business_id: this.businessId },
    });
    return this.handleResponse(response);
  }
  
  async getParty(id: string): Promise<ApiResponse<any>> {
    const response = await this.request.get(`${API.party}/parties/${id}`, {
      headers: this.getHeaders(),
    });
    return this.handleResponse(response);
  }
  
  async listParties(type?: string): Promise<ApiResponse<any[]>> {
    const url = type 
      ? `${API.party}/parties?type=${type}` 
      : `${API.party}/parties`;
    const response = await this.request.get(url, {
      headers: this.getHeaders(),
    });
    return this.handleResponse(response);
  }
  
  async searchParties(query: string): Promise<ApiResponse<any[]>> {
    const response = await this.request.get(`${API.party}/parties/search?q=${encodeURIComponent(query)}`, {
      headers: this.getHeaders(),
    });
    return this.handleResponse(response);
  }
  
  // Inventory Service
  async createItem(data: any): Promise<ApiResponse<any>> {
    const response = await this.request.post(`${API.inventory}/items`, {
      headers: this.getHeaders(),
      data: { ...data, business_id: this.businessId },
    });
    return this.handleResponse(response);
  }
  
  async getItem(id: string): Promise<ApiResponse<any>> {
    const response = await this.request.get(`${API.inventory}/items/${id}`, {
      headers: this.getHeaders(),
    });
    return this.handleResponse(response);
  }
  
  async listItems(): Promise<ApiResponse<any[]>> {
    const response = await this.request.get(`${API.inventory}/items?businessId=${this.businessId}`, {
      headers: this.getHeaders(),
    });
    return this.handleResponse(response);
  }
  
  async updateStock(itemId: string, quantity: number, adjustmentType: 'add' | 'subtract' | 'set'): Promise<ApiResponse<any>> {
    const response = await this.request.patch(`${API.inventory}/items/${itemId}/stock`, {
      headers: this.getHeaders(),
      data: { quantity, adjustment_type: adjustmentType },
    });
    return this.handleResponse(response);
  }
  
  // Invoice Service
  async createInvoice(data: any): Promise<ApiResponse<any>> {
    const response = await this.request.post(`${API.invoice}/invoices`, {
      headers: this.getHeaders(),
      data: { ...data, business_id: this.businessId },
    });
    return this.handleResponse(response);
  }
  
  async getInvoice(id: string): Promise<ApiResponse<any>> {
    const response = await this.request.get(`${API.invoice}/invoices/${id}`, {
      headers: this.getHeaders(),
    });
    return this.handleResponse(response);
  }
  
  async listInvoices(type?: string): Promise<ApiResponse<any[]>> {
    const url = type 
      ? `${API.invoice}/invoices?type=${type}` 
      : `${API.invoice}/invoices`;
    const response = await this.request.get(url, {
      headers: this.getHeaders(),
    });
    return this.handleResponse(response);
  }
  
  async updateInvoiceStatus(id: string, status: string): Promise<ApiResponse<any>> {
    const response = await this.request.patch(`${API.invoice}/invoices/${id}/status`, {
      headers: this.getHeaders(),
      data: { status },
    });
    return this.handleResponse(response);
  }
  
  async cancelInvoice(id: string): Promise<ApiResponse<any>> {
    const response = await this.request.post(`${API.invoice}/invoices/${id}/cancel`, {
      headers: this.getHeaders(),
    });
    return this.handleResponse(response);
  }
  
  // Payment Service
  async createPayment(data: any): Promise<ApiResponse<any>> {
    const response = await this.request.post(`${API.payment}/payments`, {
      headers: this.getHeaders(),
      data: { ...data, business_id: this.businessId },
    });
    return this.handleResponse(response);
  }
  
  async getPayment(id: string): Promise<ApiResponse<any>> {
    const response = await this.request.get(`${API.payment}/payments/${id}`, {
      headers: this.getHeaders(),
    });
    return this.handleResponse(response);
  }
  
  async listPayments(partyId?: string): Promise<ApiResponse<any[]>> {
    const url = partyId 
      ? `${API.payment}/payments?partyId=${partyId}` 
      : `${API.payment}/payments`;
    const response = await this.request.get(url, {
      headers: this.getHeaders(),
    });
    return this.handleResponse(response);
  }
  
  // Health Checks
  async checkHealth(service: keyof typeof API): Promise<ApiResponse<{ status: string }>> {
    const baseUrl = API[service].replace('/api/v1', '');
    const response = await this.request.get(`${baseUrl}/health`);
    return this.handleResponse(response);
  }
  
  // Generic Request Methods
  async get<T>(url: string): Promise<ApiResponse<T>> {
    const response = await this.request.get(url, {
      headers: this.getHeaders(),
    });
    return this.handleResponse(response);
  }
  
  async post<T>(url: string, data: any): Promise<ApiResponse<T>> {
    const response = await this.request.post(url, {
      headers: this.getHeaders(),
      data,
    });
    return this.handleResponse(response);
  }
  
  async patch<T>(url: string, data: any): Promise<ApiResponse<T>> {
    const response = await this.request.patch(url, {
      headers: this.getHeaders(),
      data,
    });
    return this.handleResponse(response);
  }
  
  async delete<T>(url: string): Promise<ApiResponse<T>> {
    const response = await this.request.delete(url, {
      headers: this.getHeaders(),
    });
    return this.handleResponse(response);
  }
}

/**
 * Setup test with authentication
 */
export async function setupAuthenticatedClient(
  request: APIRequestContext,
  phone: string,
  otp: string = '129012'
): Promise<TestApiClient> {
  const client = new TestApiClient(request);
  
  // Send OTP
  const otpResult = await client.sendOtp(phone, 'login');
  if (!otpResult.ok || !otpResult.data) {
    throw new Error(`Failed to send OTP: ${otpResult.error}`);
  }
  
  // Verify OTP
  const verifyResult = await client.verifyOtp(phone, otp, otpResult.data.otp_id);
  if (!verifyResult.ok) {
    throw new Error(`Failed to verify OTP: ${verifyResult.error}`);
  }
  
  return client;
}
