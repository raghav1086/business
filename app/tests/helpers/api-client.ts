import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';

/**
 * API Client Helper
 * 
 * Provides helper methods for making API requests in tests.
 */

export class ApiClient {
  constructor(private app: INestApplication) {}

  /**
   * Make GET request
   */
  get(url: string, token?: string) {
    const req = request(this.app.getHttpServer()).get(url);
    if (token) {
      req.set('Authorization', `Bearer ${token}`);
    }
    return req;
  }

  /**
   * Make POST request
   */
  post(url: string, body: any, token?: string) {
    const req = request(this.app.getHttpServer())
      .post(url)
      .send(body);
    if (token) {
      req.set('Authorization', `Bearer ${token}`);
    }
    return req;
  }

  /**
   * Make PATCH request
   */
  patch(url: string, body: any, token?: string) {
    const req = request(this.app.getHttpServer())
      .patch(url)
      .send(body);
    if (token) {
      req.set('Authorization', `Bearer ${token}`);
    }
    return req;
  }

  /**
   * Make DELETE request
   */
  delete(url: string, token?: string) {
    const req = request(this.app.getHttpServer()).delete(url);
    if (token) {
      req.set('Authorization', `Bearer ${token}`);
    }
    return req;
  }

  /**
   * Auth: Send OTP
   */
  async sendOtp(phone: string, purpose: string = 'login') {
    return this.post('/api/v1/auth/send-otp', { phone, purpose });
  }

  /**
   * Auth: Verify OTP
   */
  async verifyOtp(phone: string, otp: string) {
    return this.post('/api/v1/auth/verify-otp', { phone, otp });
  }

  /**
   * Auth: Get authenticated token (helper)
   */
  async getAuthToken(phone: string = '+919876543210'): Promise<string> {
    // For testing, we'll use a mock token or actual OTP flow
    // This is a placeholder - will be implemented based on actual auth flow
    const otpResponse = await this.sendOtp(phone);
    // In real tests, we'd extract OTP from response or use test OTP
    // For now, return mock token
    return 'mock-token-for-testing';
  }
}

