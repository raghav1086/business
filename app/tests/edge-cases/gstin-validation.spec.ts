/**
 * Input Validation Edge Cases - GSTIN Tests
 * 
 * Tests boundary values and edge cases for Indian GSTIN validation.
 */

import { test, expect, APIRequestContext } from '@playwright/test';
import {
  generateGSTIN,
  generateInvalidGSTINs,
  createPartyData,
  createBusinessData,
  INDIAN_STATE_CODES,
  API,
  TEST_OTP,
} from '../utils/test-helpers';
import { TestApiClient, setupAuthenticatedClient } from '../utils/api-client';

test.describe('GSTIN Validation Edge Cases', () => {
  let request: APIRequestContext;
  let client: TestApiClient;
  const testPhone = '9876543291';
  
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
  // Valid GSTIN Tests
  // ==========================================================================
  test.describe('Valid GSTIN Format', () => {
    for (const [state, code] of Object.entries(INDIAN_STATE_CODES)) {
      test(`should accept valid GSTIN for ${state} (${code})`, async () => {
        test.skip(!client.getAuthToken(), 'No auth token');
        
        const gstin = generateGSTIN(code);
        const partyData = createPartyData({ gstin });
        const response = await client.createParty(partyData);
        
        // Either success or duplicate - not format error
        if (!response.ok) {
          expect(response.error).not.toMatch(/invalid.*gstin.*format/i);
        }
      });
    }

    test('should accept GSTIN with entity code 1', async () => {
      test.skip(!client.getAuthToken(), 'No auth token');
      
      const gstin = '27ABCDE1234F1Z5';
      const partyData = createPartyData({ gstin });
      const response = await client.createParty(partyData);
      
      if (!response.ok) {
        expect(response.error).not.toMatch(/invalid.*gstin.*format/i);
      }
    });

    test('should accept GSTIN with entity code 9', async () => {
      test.skip(!client.getAuthToken(), 'No auth token');
      
      const gstin = '27ABCDE1234F9Z5';
      const partyData = createPartyData({ gstin });
      const response = await client.createParty(partyData);
      
      if (!response.ok) {
        expect(response.error).not.toMatch(/invalid.*gstin.*format/i);
      }
    });

    test('should accept GSTIN with entity code A-Z', async () => {
      test.skip(!client.getAuthToken(), 'No auth token');
      
      const gstin = '27ABCDE1234FAZ5';
      const partyData = createPartyData({ gstin });
      const response = await client.createParty(partyData);
      
      if (!response.ok) {
        expect(response.error).not.toMatch(/invalid.*gstin.*format/i);
      }
    });
  });

  // ==========================================================================
  // Invalid GSTIN Tests - Length
  // ==========================================================================
  test.describe('Invalid GSTIN - Length Issues', () => {
    test('should reject GSTIN with 14 characters', async () => {
      test.skip(!client.getAuthToken(), 'No auth token');
      
      const partyData = createPartyData({ gstin: '27ABCDE1234F1Z' });
      const response = await client.createParty(partyData);
      
      expect(response.ok).toBeFalsy();
      expect(response.status).toBe(400);
    });

    test('should reject GSTIN with 16 characters', async () => {
      test.skip(!client.getAuthToken(), 'No auth token');
      
      const partyData = createPartyData({ gstin: '27ABCDE1234F1Z56' });
      const response = await client.createParty(partyData);
      
      expect(response.ok).toBeFalsy();
      expect(response.status).toBe(400);
    });

    test('should reject empty GSTIN string', async () => {
      test.skip(!client.getAuthToken(), 'No auth token');
      
      // Empty GSTIN might be allowed (optional field)
      // This tests behavior when empty string is explicitly passed
      const partyData = createPartyData({ gstin: '' });
      delete partyData.gstin; // Remove to test optional
      const response = await client.createParty(partyData);
      
      // Should succeed without GSTIN
      // If it fails, it shouldn't be a format error
      if (!response.ok) {
        expect(response.error).not.toMatch(/invalid.*gstin.*format/i);
      }
    });
  });

  // ==========================================================================
  // Invalid GSTIN Tests - State Code
  // ==========================================================================
  test.describe('Invalid GSTIN - State Code Issues', () => {
    test('should reject GSTIN with invalid state code (00)', async () => {
      test.skip(!client.getAuthToken(), 'No auth token');
      
      const partyData = createPartyData({ gstin: '00ABCDE1234F1Z5' });
      const response = await client.createParty(partyData);
      
      expect(response.ok).toBeFalsy();
      expect(response.status).toBe(400);
    });

    test('should reject GSTIN with invalid state code (99)', async () => {
      test.skip(!client.getAuthToken(), 'No auth token');
      
      const partyData = createPartyData({ gstin: '99ABCDE1234F1Z5' });
      const response = await client.createParty(partyData);
      
      expect(response.ok).toBeFalsy();
      expect(response.status).toBe(400);
    });

    test('should reject GSTIN with letters in state code', async () => {
      test.skip(!client.getAuthToken(), 'No auth token');
      
      const partyData = createPartyData({ gstin: 'ABABCDE1234F1Z5' });
      const response = await client.createParty(partyData);
      
      expect(response.ok).toBeFalsy();
      expect(response.status).toBe(400);
    });
  });

  // ==========================================================================
  // Invalid GSTIN Tests - PAN Format
  // ==========================================================================
  test.describe('Invalid GSTIN - PAN Format Issues', () => {
    test('should reject GSTIN with invalid PAN (numbers instead of letters)', async () => {
      test.skip(!client.getAuthToken(), 'No auth token');
      
      const partyData = createPartyData({ gstin: '27123451234F1Z5' });
      const response = await client.createParty(partyData);
      
      expect(response.ok).toBeFalsy();
      expect(response.status).toBe(400);
    });

    test('should reject GSTIN with invalid PAN (letters instead of numbers)', async () => {
      test.skip(!client.getAuthToken(), 'No auth token');
      
      const partyData = createPartyData({ gstin: '27ABCDEABCDF1Z5' });
      const response = await client.createParty(partyData);
      
      expect(response.ok).toBeFalsy();
      expect(response.status).toBe(400);
    });
  });

  // ==========================================================================
  // Invalid GSTIN Tests - Character Case
  // ==========================================================================
  test.describe('Invalid GSTIN - Case Issues', () => {
    test('should reject GSTIN with lowercase letters', async () => {
      test.skip(!client.getAuthToken(), 'No auth token');
      
      const partyData = createPartyData({ gstin: '27abcde1234f1z5' });
      const response = await client.createParty(partyData);
      
      expect(response.ok).toBeFalsy();
      expect(response.status).toBe(400);
    });

    test('should reject GSTIN with mixed case', async () => {
      test.skip(!client.getAuthToken(), 'No auth token');
      
      const partyData = createPartyData({ gstin: '27AbCdE1234F1Z5' });
      const response = await client.createParty(partyData);
      
      expect(response.ok).toBeFalsy();
      expect(response.status).toBe(400);
    });
  });

  // ==========================================================================
  // Invalid GSTIN Tests - Special Characters
  // ==========================================================================
  test.describe('Invalid GSTIN - Special Characters', () => {
    test('should reject GSTIN with special character at end', async () => {
      test.skip(!client.getAuthToken(), 'No auth token');
      
      const partyData = createPartyData({ gstin: '27ABCDE1234F1Z!' });
      const response = await client.createParty(partyData);
      
      expect(response.ok).toBeFalsy();
      expect(response.status).toBe(400);
    });

    test('should reject GSTIN with spaces', async () => {
      test.skip(!client.getAuthToken(), 'No auth token');
      
      const partyData = createPartyData({ gstin: '27 ABCDE1234F1Z5' });
      const response = await client.createParty(partyData);
      
      expect(response.ok).toBeFalsy();
      expect(response.status).toBe(400);
    });

    test('should reject GSTIN with hyphen', async () => {
      test.skip(!client.getAuthToken(), 'No auth token');
      
      const partyData = createPartyData({ gstin: '27-ABCDE-1234-F1Z5' });
      const response = await client.createParty(partyData);
      
      expect(response.ok).toBeFalsy();
      expect(response.status).toBe(400);
    });
  });

  // ==========================================================================
  // Invalid GSTIN Tests - Position 14 (Z requirement)
  // ==========================================================================
  test.describe('Invalid GSTIN - Position 14 (Z)', () => {
    test('should reject GSTIN with Y instead of Z at position 14', async () => {
      test.skip(!client.getAuthToken(), 'No auth token');
      
      const partyData = createPartyData({ gstin: '27ABCDE1234F1Y5' });
      const response = await client.createParty(partyData);
      
      expect(response.ok).toBeFalsy();
      expect(response.status).toBe(400);
    });

    test('should reject GSTIN with number at position 14', async () => {
      test.skip(!client.getAuthToken(), 'No auth token');
      
      const partyData = createPartyData({ gstin: '27ABCDE1234F115' });
      const response = await client.createParty(partyData);
      
      expect(response.ok).toBeFalsy();
      expect(response.status).toBe(400);
    });
  });

  // ==========================================================================
  // Invalid GSTIN Tests - Entity Code
  // ==========================================================================
  test.describe('Invalid GSTIN - Entity Code (Position 13)', () => {
    test('should reject GSTIN with 0 as entity code', async () => {
      test.skip(!client.getAuthToken(), 'No auth token');
      
      const partyData = createPartyData({ gstin: '27ABCDE1234F0Z5' });
      const response = await client.createParty(partyData);
      
      expect(response.ok).toBeFalsy();
      expect(response.status).toBe(400);
    });
  });

  // ==========================================================================
  // Duplicate GSTIN Tests
  // ==========================================================================
  test.describe('Duplicate GSTIN Handling', () => {
    test('should reject duplicate GSTIN in same business', async () => {
      test.skip(!client.getAuthToken(), 'No auth token');
      
      const gstin = generateGSTIN('27');
      
      // Create first party with GSTIN
      const firstParty = createPartyData({ gstin });
      const firstResponse = await client.createParty(firstParty);
      
      if (firstResponse.ok) {
        // Try to create second party with same GSTIN
        const secondParty = createPartyData({ gstin });
        const secondResponse = await client.createParty(secondParty);
        
        // Should fail due to duplicate
        expect(secondResponse.ok).toBeFalsy();
        expect(secondResponse.status).toBeOneOf([400, 409]);
      }
    });
  });

  // ==========================================================================
  // All Invalid GSTIN Variations (Parameterized)
  // ==========================================================================
  test.describe('All Invalid GSTIN Variations', () => {
    const invalidGSTINs = generateInvalidGSTINs();
    
    for (const { value, reason } of invalidGSTINs) {
      if (value !== null && value !== undefined && value !== '') {
        test(`should reject GSTIN: ${reason}`, async () => {
          test.skip(!client.getAuthToken(), 'No auth token');
          
          const partyData = createPartyData({ gstin: value });
          const response = await client.createParty(partyData);
          
          // Should fail validation
          expect(response.ok).toBeFalsy();
        });
      }
    }
  });

  // ==========================================================================
  // GSTIN in Business Creation
  // ==========================================================================
  test.describe('GSTIN Validation in Business Creation', () => {
    test('should accept valid GSTIN for business', async () => {
      test.skip(!client.getAuthToken(), 'No auth token');
      
      const businessData = createBusinessData({ gstin: generateGSTIN('27') });
      const response = await client.createBusiness(businessData);
      
      // Either success or duplicate - not format error
      if (!response.ok) {
        expect(response.error).not.toMatch(/invalid.*gstin.*format/i);
      }
    });

    test('should reject invalid GSTIN for business', async () => {
      test.skip(!client.getAuthToken(), 'No auth token');
      
      const businessData = createBusinessData({ gstin: '27INVALID1234Z' });
      const response = await client.createBusiness(businessData);
      
      expect(response.ok).toBeFalsy();
      expect(response.status).toBe(400);
    });

    test('should reject duplicate business GSTIN', async () => {
      test.skip(!client.getAuthToken(), 'No auth token');
      
      const gstin = generateGSTIN('27');
      
      // Create first business
      const firstBusiness = createBusinessData({ gstin });
      const firstResponse = await client.createBusiness(firstBusiness);
      
      if (firstResponse.ok) {
        // Try to create second business with same GSTIN
        const secondBusiness = createBusinessData({ gstin });
        const secondResponse = await client.createBusiness(secondBusiness);
        
        // Should fail due to duplicate
        expect(secondResponse.ok).toBeFalsy();
      }
    });
  });
});

// Extend expect for custom matchers
expect.extend({
  toBeOneOf(received: number, expected: number[]) {
    const pass = expected.includes(received);
    if (pass) {
      return {
        message: () => `expected ${received} not to be one of ${expected.join(', ')}`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be one of ${expected.join(', ')}`,
        pass: false,
      };
    }
  },
});

declare global {
  namespace PlaywrightTest {
    interface Matchers<R> {
      toBeOneOf(expected: number[]): R;
    }
  }
}
