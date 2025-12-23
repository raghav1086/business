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
  private maxRetries: number = 3;
  private retryDelay: number = 500;
  
  constructor(private request: APIRequestContext, authToken?: string) {
    if (authToken) {
      this.authToken = authToken;
    }
  }
  
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
  
  private async retryRequest<T>(
    fn: () => Promise<any>,
    retries: number = this.maxRetries
  ): Promise<ApiResponse<T>> {
    let lastError: any;
    
    for (let i = 0; i < retries; i++) {
      try {
        const response = await fn();
        return await this.handleResponse<T>(response);
      } catch (error: any) {
        lastError = error;
        
        // Don't retry on client errors (4xx except 429)
        if (error.status && error.status >= 400 && error.status < 500 && error.status !== 429) {
          return {
            ok: false,
            status: error.status || 500,
            data: null,
            error: error.message || 'Request failed'
          };
        }
        
        // Retry on network errors, 5xx, or 429
        if (i < retries - 1) {
          const delay = this.retryDelay * Math.pow(2, i);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    return {
      ok: false,
      status: 500,
      data: null,
      error: lastError?.message || 'Request failed after retries'
    };
  }
  
  // Generic HTTP methods with retry
  async get(url: string, params?: any): Promise<ApiResponse<any>> {
    return this.retryRequest(() => 
      this.request.get(url, {
        headers: this.getHeaders(),
        params,
      })
    );
  }
  
  async post(url: string, data: any): Promise<ApiResponse<any>> {
    return this.retryRequest(() =>
      this.request.post(url, {
        headers: this.getHeaders(),
        data,
      })
    );
  }
  
  async patch(url: string, data: any): Promise<ApiResponse<any>> {
    return this.retryRequest(() =>
      this.request.patch(url, {
        headers: this.getHeaders(),
        data,
      })
    );
  }
  
  async delete(url: string): Promise<ApiResponse<any>> {
    return this.retryRequest(() =>
      this.request.delete(url, {
        headers: this.getHeaders(),
      })
    );
  }
  
  // Auth Service
  async sendOtp(phone: string, purpose: string = 'login'): Promise<ApiResponse<{ otp_id: string }>> {
    return this.retryRequest(() =>
      this.request.post(`${API.auth}/auth/send-otp`, {
        data: { phone, purpose },
      })
    );
  }
  
  async verifyOtp(phone: string, otp: string, otpId: string): Promise<ApiResponse<{ access_token: string; user: any }>> {
    const result = await this.retryRequest<any>(() =>
      this.request.post(`${API.auth}/auth/verify-otp`, {
        data: { phone, otp, otp_id: otpId },
      })
    );
    
    if (result.ok && result.data) {
      this.authToken = result.data.tokens?.access_token || result.data.accessToken || result.data.token;
    }
    return result;
  }
  
  // Business Service
  async createBusiness(data: any): Promise<ApiResponse<any>> {
    const result = await this.retryRequest(() =>
      this.request.post(`${API.business}/businesses`, {
        headers: this.getHeaders(),
        data,
      })
    );
    
    if (result.ok && result.data) {
      this.businessId = result.data.id || result.data.business_id;
    }
    return result;
  }
  
  async getBusiness(id: string): Promise<ApiResponse<any>> {
    return this.retryRequest(() =>
      this.request.get(`${API.business}/businesses/${id}`, {
        headers: this.getHeaders(),
      })
    );
  }
  
  // Party Service  
  async createParty(data: any): Promise<ApiResponse<any>> {
    return this.retryRequest(() =>
      this.request.post(`${API.party}/parties`, {
        headers: this.getHeaders(),
        data,
      })
    );
  }
  
  async getParty(id: string): Promise<ApiResponse<any>> {
    return this.retryRequest(() =>
      this.request.get(`${API.party}/parties/${id}`, {
        headers: this.getHeaders(),
      })
    );
  }
  
  // Inventory Service
  async createItem(data: any): Promise<ApiResponse<any>> {
    return this.retryRequest(() =>
      this.request.post(`${API.inventory}/items`, {
        headers: this.getHeaders(),
        data,
      })
    );
  }
  
  async getItem(id: string): Promise<ApiResponse<any>> {
    return this.retryRequest(() =>
      this.request.get(`${API.inventory}/items/${id}`, {
        headers: this.getHeaders(),
      })
    );
  }
  
  async updateStock(itemId: string, quantity: number, type: 'add' | 'subtract' | 'set'): Promise<ApiResponse<any>> {
    return this.retryRequest(() =>
      this.request.patch(`${API.inventory}/items/${itemId}/stock`, {
        headers: this.getHeaders(),
        data: { quantity, type },
      })
    );
  }
  
  // Invoice Service
  async createInvoice(data: any): Promise<ApiResponse<any>> {
    return this.retryRequest(() =>
      this.request.post(`${API.invoice}/invoices`, {
        headers: this.getHeaders(),
        data,
      })
    );
  }
  
  async getInvoice(id: string): Promise<ApiResponse<any>> {
    return this.retryRequest(() =>
      this.request.get(`${API.invoice}/invoices/${id}`, {
        headers: this.getHeaders(),
      })
    );
  }
  
  async listInvoices(params?: any): Promise<ApiResponse<any[]>> {
    return this.retryRequest(() =>
      this.request.get(`${API.invoice}/invoices`, {
        headers: this.getHeaders(),
        params,
      })
    );
  }
  
  // Payment Service
  async createPayment(data: any): Promise<ApiResponse<any>> {
    return this.retryRequest(() =>
      this.request.post(`${API.payment}/payments`, {
        headers: this.getHeaders(),
        data,
      })
    );
  }
  
  async getPayment(id: string): Promise<ApiResponse<any>> {
    return this.retryRequest(() =>
      this.request.get(`${API.payment}/payments/${id}`, {
        headers: this.getHeaders(),
      })
    );
  }
  
  // Generic HTTP methods (backward compatibility)
  async get(url: string, params?: any): Promise<ApiResponse<any>> {
    return this.retryRequest(() => 
      this.request.get(url, {
        headers: this.getHeaders(),
        params,
      })
    );
  }
  
  async post(url: string, data: any): Promise<ApiResponse<any>> {
    return this.retryRequest(() =>
      this.request.post(url, {
        headers: this.getHeaders(),
        data,
      })
    );
  }
  
  async patch(url: string, data: any): Promise<ApiResponse<any>> {
    return this.retryRequest(() =>
      this.request.patch(url, {
        headers: this.getHeaders(),
        data,
      })
    );
  }
  
  async delete(url: string): Promise<ApiResponse<any>> {
    return this.retryRequest(() =>
      this.request.delete(url, {
        headers: this.getHeaders(),
      })
    );
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
  
  // Send OTP with retry
  const otpResult = await client.sendOtp(phone, 'login');
  if (!otpResult.ok || !otpResult.data) {
    throw new Error(`Failed to send OTP: ${otpResult.error}`);
  }
  
  // Verify OTP with retry
  const verifyResult = await client.verifyOtp(phone, otp, otpResult.data.otp_id);
  if (!verifyResult.ok) {
    throw new Error(`Failed to verify OTP: ${verifyResult.error}`);
  }
  
  return client;
}
