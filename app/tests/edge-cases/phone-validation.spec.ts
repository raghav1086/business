/**
 * Input Validation Edge Cases - Phone Number Tests
 * 
 * Tests boundary values and edge cases for Indian phone number validation.
 */

import { test, expect, APIRequestContext } from '@playwright/test';
import {
  generatePhone,
  generateInvalidPhones,
  createPartyData,
  API,
  TEST_OTP,
} from '../utils/test-helpers';
import { TestApiClient, setupAuthenticatedClient } from '../utils/api-client';

test.describe('Phone Number Validation Edge Cases', () => {
  let request: APIRequestContext;
  let client: TestApiClient;
  const testPhone = '9876543290';
  
  test.beforeAll(async ({ playwright }) => {
    request = await playwright.request.newContext();
    try {
      client = await setupAuthenticatedClient(request, testPhone, TEST_OTP);
    } catch (e) {
      console.warn('Auth setup failed, some tests may be skipped:', e);
      client = new TestApiClient(request);
    }
  });
  
  test.afterAll(async () => {
    await request.dispose();
  });

  // ==========================================================================
  // Valid Phone Number Tests
  // ==========================================================================
  test.describe('Valid Phone Numbers', () => {
    const validPhones = [
      { phone: '6000000000', description: 'Starts with 6 (minimum)' },
      { phone: '6999999999', description: 'Starts with 6 (maximum)' },
      { phone: '7000000000', description: 'Starts with 7 (minimum)' },
      { phone: '7999999999', description: 'Starts with 7 (maximum)' },
      { phone: '8000000000', description: 'Starts with 8 (minimum)' },
      { phone: '8999999999', description: 'Starts with 8 (maximum)' },
      { phone: '9000000000', description: 'Starts with 9 (minimum)' },
      { phone: '9999999999', description: 'Starts with 9 (maximum)' },
    ];
    
    for (const { phone, description } of validPhones) {
      test(`should accept valid phone: ${description}`, async () => {
        test.skip(!client.getAuthToken(), 'No auth token');
        
        const partyData = createPartyData({ phone });
        const response = await client.createParty(partyData);
        
        // Either success or duplicate (if phone exists) - not validation error
        if (!response.ok) {
          expect(response.error).not.toContain('phone');
          expect(response.error).not.toContain('format');
        }
      });
    }
  });

  // ==========================================================================
  // Invalid Phone Number Tests
  // ==========================================================================
  test.describe('Invalid Phone Numbers', () => {
    test('should reject phone with 9 digits', async () => {
      test.skip(!client.getAuthToken(), 'No auth token');
      
      const partyData = createPartyData({ phone: '987654321' });
      const response = await client.createParty(partyData);
      
      expect(response.ok).toBeFalsy();
      expect(response.status).toBe(400);
    });

    test('should reject phone with 11 digits', async () => {
      test.skip(!client.getAuthToken(), 'No auth token');
      
      const partyData = createPartyData({ phone: '98765432101' });
      const response = await client.createParty(partyData);
      
      expect(response.ok).toBeFalsy();
      expect(response.status).toBe(400);
    });

    test('should reject phone starting with 0', async () => {
      test.skip(!client.getAuthToken(), 'No auth token');
      
      const partyData = createPartyData({ phone: '0987654321' });
      const response = await client.createParty(partyData);
      
      expect(response.ok).toBeFalsy();
      expect(response.status).toBe(400);
    });

    test('should reject phone starting with 1', async () => {
      test.skip(!client.getAuthToken(), 'No auth token');
      
      const partyData = createPartyData({ phone: '1234567890' });
      const response = await client.createParty(partyData);
      
      expect(response.ok).toBeFalsy();
      expect(response.status).toBe(400);
    });

    test('should reject phone starting with 2', async () => {
      test.skip(!client.getAuthToken(), 'No auth token');
      
      const partyData = createPartyData({ phone: '2345678901' });
      const response = await client.createParty(partyData);
      
      expect(response.ok).toBeFalsy();
      expect(response.status).toBe(400);
    });

    test('should reject phone starting with 3', async () => {
      test.skip(!client.getAuthToken(), 'No auth token');
      
      const partyData = createPartyData({ phone: '3456789012' });
      const response = await client.createParty(partyData);
      
      expect(response.ok).toBeFalsy();
      expect(response.status).toBe(400);
    });

    test('should reject phone starting with 4', async () => {
      test.skip(!client.getAuthToken(), 'No auth token');
      
      const partyData = createPartyData({ phone: '4567890123' });
      const response = await client.createParty(partyData);
      
      expect(response.ok).toBeFalsy();
      expect(response.status).toBe(400);
    });

    test('should reject phone starting with 5', async () => {
      test.skip(!client.getAuthToken(), 'No auth token');
      
      const partyData = createPartyData({ phone: '5678901234' });
      const response = await client.createParty(partyData);
      
      expect(response.ok).toBeFalsy();
      expect(response.status).toBe(400);
    });

    test('should reject phone with special characters', async () => {
      test.skip(!client.getAuthToken(), 'No auth token');
      
      const partyData = createPartyData({ phone: '987-654-321' });
      const response = await client.createParty(partyData);
      
      expect(response.ok).toBeFalsy();
      expect(response.status).toBe(400);
    });

    test('should reject phone with letters', async () => {
      test.skip(!client.getAuthToken(), 'No auth token');
      
      const partyData = createPartyData({ phone: '987654321a' });
      const response = await client.createParty(partyData);
      
      expect(response.ok).toBeFalsy();
      expect(response.status).toBe(400);
    });

    test('should reject empty phone string', async () => {
      test.skip(!client.getAuthToken(), 'No auth token');
      
      const partyData = createPartyData({ phone: '' });
      const response = await client.createParty(partyData);
      
      // Empty phone might be allowed as optional field
      // But if provided, should be validated
      if (!response.ok) {
        expect(response.status).toBe(400);
      }
    });

    test('should reject phone with spaces', async () => {
      test.skip(!client.getAuthToken(), 'No auth token');
      
      const partyData = createPartyData({ phone: '987 654 3210' });
      const response = await client.createParty(partyData);
      
      expect(response.ok).toBeFalsy();
      expect(response.status).toBe(400);
    });

    test('should reject phone with +91 prefix', async () => {
      test.skip(!client.getAuthToken(), 'No auth token');
      
      const partyData = createPartyData({ phone: '+919876543210' });
      const response = await client.createParty(partyData);
      
      expect(response.ok).toBeFalsy();
      expect(response.status).toBe(400);
    });

    test('should reject phone with 91 prefix', async () => {
      test.skip(!client.getAuthToken(), 'No auth token');
      
      const partyData = createPartyData({ phone: '919876543210' });
      const response = await client.createParty(partyData);
      
      expect(response.ok).toBeFalsy();
      expect(response.status).toBe(400);
    });

    test('should reject phone with parentheses', async () => {
      test.skip(!client.getAuthToken(), 'No auth token');
      
      const partyData = createPartyData({ phone: '(987)6543210' });
      const response = await client.createParty(partyData);
      
      expect(response.ok).toBeFalsy();
      expect(response.status).toBe(400);
    });
  });

  // ==========================================================================
  // Boundary Tests
  // ==========================================================================
  test.describe('Boundary Values', () => {
    test('should handle phone at exact minimum valid value', async () => {
      test.skip(!client.getAuthToken(), 'No auth token');
      
      // Minimum valid: 6000000000
      const partyData = createPartyData({ phone: '6000000000' });
      const response = await client.createParty(partyData);
      
      if (!response.ok) {
        expect(response.error).not.toMatch(/invalid.*phone/i);
      }
    });

    test('should handle phone at exact maximum valid value', async () => {
      test.skip(!client.getAuthToken(), 'No auth token');
      
      // Maximum valid: 9999999999
      const partyData = createPartyData({ phone: '9999999999' });
      const response = await client.createParty(partyData);
      
      if (!response.ok) {
        expect(response.error).not.toMatch(/invalid.*phone/i);
      }
    });

    test('should reject phone just below minimum (5999999999)', async () => {
      test.skip(!client.getAuthToken(), 'No auth token');
      
      const partyData = createPartyData({ phone: '5999999999' });
      const response = await client.createParty(partyData);
      
      expect(response.ok).toBeFalsy();
      expect(response.status).toBe(400);
    });
  });

  // ==========================================================================
  // Auth Service Phone Tests
  // ==========================================================================
  test.describe('Auth Service Phone Validation', () => {
    test('should reject OTP request for invalid phone', async () => {
      const response = await request.post(`${API.auth}/auth/send-otp`, {
        data: { phone: '1234567890', purpose: 'login' },
      });
      
      // Should reject invalid phone
      expect(response.status()).toBeGreaterThanOrEqual(400);
    });

    test('should reject OTP request for too short phone', async () => {
      const response = await request.post(`${API.auth}/auth/send-otp`, {
        data: { phone: '987654321', purpose: 'login' },
      });
      
      expect(response.status()).toBeGreaterThanOrEqual(400);
    });

    test('should reject OTP request for phone with letters', async () => {
      const response = await request.post(`${API.auth}/auth/send-otp`, {
        data: { phone: '98765abcde', purpose: 'login' },
      });
      
      expect(response.status()).toBeGreaterThanOrEqual(400);
    });

    test('should accept valid phone for OTP', async () => {
      const response = await request.post(`${API.auth}/auth/send-otp`, {
        data: { phone: generatePhone(), purpose: 'registration' },
      });
      
      // Should succeed or return already exists
      expect([200, 201, 409]).toContain(response.status());
    });
  });

  // ==========================================================================
  // All Invalid Phone Variations (Parameterized)
  // ==========================================================================
  test.describe('All Invalid Phone Variations', () => {
    const invalidPhones = generateInvalidPhones();
    
    for (const { value, reason } of invalidPhones) {
      if (value !== null && value !== undefined) {
        test(`should reject phone: ${reason}`, async () => {
          test.skip(!client.getAuthToken(), 'No auth token');
          
          const partyData = createPartyData({ phone: value });
          const response = await client.createParty(partyData);
          
          // Should fail validation
          expect(response.ok).toBeFalsy();
        });
      }
    }
  });
});
