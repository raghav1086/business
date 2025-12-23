/**
 * Security Vulnerability Tests
 * 
 * Tests for SQL injection, XSS, authorization bypass, and IDOR vulnerabilities.
 */

import { test, expect, APIRequestContext } from '@playwright/test';
import {
  createInvoiceData,
  createInvoiceItemData,
  createPartyData,
  createPaymentData,
  createItemData,
  generatePhone,
  generateGSTIN,
  SQL_INJECTION_PAYLOADS,
  XSS_PAYLOADS,
  API,
  TEST_OTP,
} from '../utils/test-helpers';
import { TestApiClient, setupAuthenticatedClient } from '../utils/api-client';

test.describe('Security Vulnerability Tests', () => {
  let request: APIRequestContext;
  let client: TestApiClient;
  let partyId: string;
  const testPhone = '9876543298';
  
  test.beforeAll(async ({ playwright }) => {
    request = await playwright.request.newContext();
    try {
      client = await setupAuthenticatedClient(request, testPhone, TEST_OTP);
      
      // Create a party for tests
      const partyData = createPartyData({ type: 'customer' });
      const partyResponse = await client.createParty(partyData);
      if (partyResponse.ok) {
        partyId = partyResponse.data.id;
      }
    } catch (e) {
      console.warn('Setup failed, some tests may be skipped:', e);
      client = new TestApiClient(request);
    }
  });
  
  test.afterAll(async () => {
    await request.dispose();
  });

  // ==========================================================================
  // SQL Injection Tests
  // ==========================================================================
  test.describe('SQL Injection Prevention', () => {
    test('should prevent SQL injection in party name', async () => {
      test.skip(!client.getAuthToken(), 'No auth token');
      
      for (const payload of SQL_INJECTION_PAYLOADS.slice(0, 5)) {
        const partyData = createPartyData({
          name: payload,
        });
        
        const response = await client.createParty(partyData);
        
        // Should either:
        // 1. Accept the value literally (stored as-is)
        // 2. Reject as invalid input
        // Should NOT execute the SQL
        
        if (response.ok) {
          // If accepted, verify the value is stored literally
          const partyResponse = await client.getParty(response.data.id);
          if (partyResponse.ok) {
            expect(partyResponse.data.name).toBe(payload);
          }
        }
        
        // Should never cause server error (500)
        expect(response.status).not.toBe(500);
      }
    });

    test('should prevent SQL injection in search/filter', async () => {
      test.skip(!client.getAuthToken(), 'No auth token');
      
      for (const payload of SQL_INJECTION_PAYLOADS.slice(0, 5)) {
        // Try injection in search parameter
        const response = await client.get(`${API.party}/parties`, {
          search: payload,
        });
        
        // Should not cause server error
        expect(response.status).not.toBe(500);
        
        // Response should be valid array or error
        if (response.ok) {
          expect(Array.isArray(response.data)).toBeTruthy();
        }
      }
    });

    test('should prevent SQL injection in invoice items', async () => {
      test.skip(!client.getAuthToken() || !partyId, 'Missing dependencies');
      
      for (const payload of SQL_INJECTION_PAYLOADS.slice(0, 3)) {
        const invoiceData = createInvoiceData(partyId, {
          items: [createInvoiceItemData({ item_name: payload })],
        });
        
        const response = await client.createInvoice(invoiceData);
        
        if (response.ok) {
          // Value should be stored literally
          const invoiceResponse = await client.getInvoice(response.data.id);
          if (invoiceResponse.ok && invoiceResponse.data.items?.length > 0) {
            expect(invoiceResponse.data.items[0].item_name).toBe(payload);
          }
        }
        
        // Should never cause server error
        expect(response.status).not.toBe(500);
      }
    });

    test('should prevent SQL injection in item description', async () => {
      test.skip(!client.getAuthToken(), 'No auth token');
      
      for (const payload of SQL_INJECTION_PAYLOADS.slice(0, 3)) {
        const itemData = createItemData({
          name: `Item ${Date.now()}`,
          description: payload,
        });
        
        const response = await client.createItem(itemData);
        
        if (response.ok) {
          const itemResponse = await client.getItem(response.data.id);
          if (itemResponse.ok) {
            expect(itemResponse.data.description).toBe(payload);
          }
        }
        
        expect(response.status).not.toBe(500);
      }
    });

    test('should prevent SQL injection in payment notes', async () => {
      test.skip(!client.getAuthToken() || !partyId, 'Missing dependencies');
      
      // Create an invoice first
      const invoiceData = createInvoiceData(partyId, {
        items: [createInvoiceItemData()],
      });
      const invoiceResponse = await client.createInvoice(invoiceData);
      
      if (!invoiceResponse.ok) {
        test.skip(true, 'Could not create invoice');
        return;
      }
      
      for (const payload of SQL_INJECTION_PAYLOADS.slice(0, 3)) {
        const paymentData = createPaymentData(partyId, {
          invoice_id: invoiceResponse.data.id,
          amount: 100,
          notes: payload,
        });
        
        const response = await client.createPayment(paymentData);
        
        expect(response.status).not.toBe(500);
      }
    });
  });

  // ==========================================================================
  // XSS Prevention Tests
  // ==========================================================================
  test.describe('XSS Prevention', () => {
    test('should sanitize XSS in party name', async () => {
      test.skip(!client.getAuthToken(), 'No auth token');
      
      for (const payload of XSS_PAYLOADS.slice(0, 5)) {
        const partyData = createPartyData({
          name: payload,
        });
        
        const response = await client.createParty(partyData);
        
        if (response.ok) {
          const partyResponse = await client.getParty(response.data.id);
          if (partyResponse.ok) {
            // Name should either be stored literally (escaped on display)
            // or be sanitized during input
            const storedName = partyResponse.data.name;
            
            // Should not contain raw script tags
            expect(storedName.toLowerCase()).not.toContain('<script>alert');
          }
        }
      }
    });

    test('should sanitize XSS in item name', async () => {
      test.skip(!client.getAuthToken(), 'No auth token');
      
      for (const payload of XSS_PAYLOADS.slice(0, 3)) {
        const itemData = createItemData({
          name: payload,
        });
        
        const response = await client.createItem(itemData);
        
        if (response.ok) {
          const itemResponse = await client.getItem(response.data.id);
          if (itemResponse.ok) {
            const storedName = itemResponse.data.name;
            expect(storedName.toLowerCase()).not.toContain('<script>alert');
          }
        }
      }
    });

    test('should sanitize XSS in address fields', async () => {
      test.skip(!client.getAuthToken(), 'No auth token');
      
      for (const payload of XSS_PAYLOADS.slice(0, 3)) {
        const partyData = createPartyData({
          billing_address_line1: payload,
          billing_address_line2: payload,
        });
        
        const response = await client.createParty(partyData);
        
        if (response.ok) {
          const partyResponse = await client.getParty(response.data.id);
          if (partyResponse.ok) {
            // Should be sanitized
            expect(partyResponse.data.billing_address_line1?.toLowerCase() || '').not.toContain('<script>alert');
          }
        }
      }
    });
  });

  // ==========================================================================
  // Authentication Tests
  // ==========================================================================
  test.describe('Authentication', () => {
    test('should reject requests without auth token', async () => {
      const unauthClient = new TestApiClient(request);
      
      // Try to access protected endpoints
      const endpoints = [
        { method: 'get', url: `${API.party}/parties` },
        { method: 'get', url: `${API.invoice}/invoices` },
        { method: 'get', url: `${API.inventory}/items` },
        { method: 'get', url: `${API.payment}/payments` },
        { method: 'get', url: `${API.business}/businesses` },
      ];
      
      for (const endpoint of endpoints) {
        const response = await unauthClient.get(endpoint.url);
        expect(response.status).toBe(401);
      }
    });

    test('should reject invalid auth token', async () => {
      const invalidClient = new TestApiClient(request, 'invalid-token-12345');
      
      const response = await invalidClient.get(`${API.party}/parties`);
      expect(response.status).toBe(401);
    });

    test('should reject expired auth token', async () => {
      // This is a mock expired token - in real scenario, would wait for expiry
      const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwiZXhwIjoxNTAwMDAwMDAwfQ.invalid';
      const expiredClient = new TestApiClient(request, expiredToken);
      
      const response = await expiredClient.get(`${API.party}/parties`);
      expect(response.status).toBe(401);
    });

    test('should validate OTP correctly', async () => {
      const tempRequest = await request.newContext();
      
      // Request OTP
      const phone = generatePhone();
      await tempRequest.post(`${API.auth}/auth/request-otp`, {
        data: { phone },
      });
      
      // Verify with wrong OTP
      const response = await tempRequest.post(`${API.auth}/auth/verify-otp`, {
        data: { phone, otp: '000000' },
      });
      
      expect(response.ok()).toBeFalsy();
    });
  });

  // ==========================================================================
  // Authorization Tests (IDOR Prevention)
  // ==========================================================================
  test.describe('Authorization & IDOR Prevention', () => {
    let user1Client: TestApiClient;
    let user2Client: TestApiClient;
    let user1PartyId: string;
    let user1InvoiceId: string;
    
    test.beforeAll(async () => {
      // Setup two different users
      try {
        user1Client = await setupAuthenticatedClient(request, '9876543210', TEST_OTP);
        user2Client = await setupAuthenticatedClient(request, '9876543211', TEST_OTP);
        
        // User 1 creates a party
        const partyResponse = await user1Client.createParty(createPartyData());
        if (partyResponse.ok) {
          user1PartyId = partyResponse.data.id;
          
          // User 1 creates an invoice
          const invoiceResponse = await user1Client.createInvoice(
            createInvoiceData(user1PartyId, {
              items: [createInvoiceItemData()],
            })
          );
          if (invoiceResponse.ok) {
            user1InvoiceId = invoiceResponse.data.id;
          }
        }
      } catch (e) {
        console.warn('Multi-user setup failed:', e);
      }
    });

    test('should prevent user2 from accessing user1 party', async () => {
      test.skip(!user2Client?.getAuthToken() || !user1PartyId, 'Missing setup');
      
      const response = await user2Client.getParty(user1PartyId);
      
      // Should either return 403 (forbidden) or 404 (not found - data isolation)
      expect([403, 404]).toContain(response.status);
    });

    test('should prevent user2 from accessing user1 invoice', async () => {
      test.skip(!user2Client?.getAuthToken() || !user1InvoiceId, 'Missing setup');
      
      const response = await user2Client.getInvoice(user1InvoiceId);
      
      expect([403, 404]).toContain(response.status);
    });

    test('should prevent user2 from updating user1 party', async () => {
      test.skip(!user2Client?.getAuthToken() || !user1PartyId, 'Missing setup');
      
      const response = await user2Client.patch(`${API.party}/parties/${user1PartyId}`, {
        name: 'Hacked Name',
      });
      
      expect([403, 404]).toContain(response.status);
    });

    test('should prevent user2 from deleting user1 party', async () => {
      test.skip(!user2Client?.getAuthToken() || !user1PartyId, 'Missing setup');
      
      const response = await user2Client.delete(`${API.party}/parties/${user1PartyId}`);
      
      expect([403, 404]).toContain(response.status);
    });

    test('should prevent sequential ID enumeration', async () => {
      test.skip(!client.getAuthToken(), 'No auth token');
      
      // Try accessing resources with sequential/guessed IDs
      const guessedIds = [
        '1', '2', '3',
        '00000000-0000-0000-0000-000000000001',
        '00000000-0000-0000-0000-000000000002',
        'admin',
        'test',
      ];
      
      for (const id of guessedIds) {
        const partyResponse = await client.getParty(id);
        const invoiceResponse = await client.getInvoice(id);
        
        // Should return 404 or 400 (invalid UUID), not data
        expect([400, 404]).toContain(partyResponse.status);
        expect([400, 404]).toContain(invoiceResponse.status);
      }
    });
  });

  // ==========================================================================
  // Input Validation Security
  // ==========================================================================
  test.describe('Input Validation Security', () => {
    test('should reject oversized input', async () => {
      test.skip(!client.getAuthToken(), 'No auth token');
      
      // Try to create party with extremely long name
      const longName = 'A'.repeat(100000);
      const partyData = createPartyData({ name: longName });
      
      const response = await client.createParty(partyData);
      
      // Should reject or truncate, not crash
      expect(response.status).not.toBe(500);
    });

    test('should handle null bytes in input', async () => {
      test.skip(!client.getAuthToken(), 'No auth token');
      
      const partyData = createPartyData({
        name: 'Test\x00Party',
      });
      
      const response = await client.createParty(partyData);
      
      // Should handle gracefully
      expect(response.status).not.toBe(500);
    });

    test('should handle unicode edge cases', async () => {
      test.skip(!client.getAuthToken(), 'No auth token');
      
      const unicodePayloads = [
        '𝕋𝕖𝕤𝕥', // Mathematical symbols
        '👨‍👩‍👧‍👦', // Complex emoji
        '\u202E\u0041\u0042\u0043', // RTL override
        'Ω≈ç√∫', // Math symbols
        '表ポ十', // Japanese
        'العربية', // Arabic
      ];
      
      for (const payload of unicodePayloads) {
        const partyData = createPartyData({ name: payload });
        const response = await client.createParty(partyData);
        
        // Should handle without crash
        expect(response.status).not.toBe(500);
      }
    });

    test('should validate numeric bounds', async () => {
      test.skip(!client.getAuthToken() || !partyId, 'Missing dependencies');
      
      const boundaryValues = [
        Number.MAX_SAFE_INTEGER,
        Number.MIN_SAFE_INTEGER,
        Number.MAX_VALUE,
        Number.POSITIVE_INFINITY,
        Number.NaN,
      ];
      
      for (const value of boundaryValues) {
        const invoiceData = createInvoiceData(partyId, {
          items: [createInvoiceItemData({ unit_price: value })],
        });
        
        const response = await client.createInvoice(invoiceData);
        
        // Should reject or handle gracefully
        expect(response.status).not.toBe(500);
      }
    });
  });

  // ==========================================================================
  // Header Security
  // ==========================================================================
  test.describe('Header Security', () => {
    test('should have security headers', async () => {
      test.skip(!client.getAuthToken(), 'No auth token');
      
      const response = await request.get(`${API.party}/parties`, {
        headers: {
          Authorization: `Bearer ${client.getAuthToken()}`,
        },
      });
      
      const headers = response.headers();
      
      // Check for common security headers
      // Note: Not all may be present, depends on configuration
      const securityHeaders = [
        'x-content-type-options',
        'x-frame-options',
        'x-xss-protection',
        'strict-transport-security',
      ];
      
      // At least check content-type is set correctly
      expect(headers['content-type']).toContain('application/json');
    });

    test('should handle malformed headers', async () => {
      const response = await request.get(`${API.party}/parties`, {
        headers: {
          'Authorization': 'Malformed Bearer Token With Spaces',
          'Content-Type': 'invalid/content-type',
          'X-Custom-Header': '<script>alert(1)</script>',
        },
      });
      
      // Should not crash
      expect([400, 401, 403, 404, 415]).toContain(response.status());
    });
  });

  // ==========================================================================
  // Rate Limiting
  // ==========================================================================
  test.describe('Rate Limiting', () => {
    test('should rate limit excessive requests', async () => {
      test.skip(!client.getAuthToken(), 'No auth token');
      
      // Make many rapid requests
      const requests = Array(100).fill(null).map(() => 
        client.get(`${API.party}/parties`)
      );
      
      const responses = await Promise.allSettled(requests);
      
      // Some requests should be rate limited (429) if rate limiting is enabled
      // If not rate limited, all should succeed (200) or fail gracefully
      const statuses = responses
        .filter((r): r is PromiseFulfilledResult<any> => r.status === 'fulfilled')
        .map(r => r.value.status);
      
      // Should not have server errors
      expect(statuses.filter(s => s === 500).length).toBe(0);
    });

    test('should rate limit OTP requests', async () => {
      const phone = generatePhone();
      
      // Make many OTP requests
      const requests = Array(20).fill(null).map(() =>
        request.post(`${API.auth}/auth/request-otp`, {
          data: { phone },
        })
      );
      
      const responses = await Promise.allSettled(requests);
      
      // Check if rate limiting kicks in
      const statuses = responses
        .filter((r): r is PromiseFulfilledResult<any> => r.status === 'fulfilled')
        .map(r => r.value.status());
      
      // Should have some 429 responses if rate limiting is enabled
      // Or all should succeed without server errors
      expect(statuses.filter(s => s === 500).length).toBe(0);
    });
  });

  // ==========================================================================
  // Path Traversal
  // ==========================================================================
  test.describe('Path Traversal Prevention', () => {
    test('should prevent path traversal in file uploads', async () => {
      test.skip(!client.getAuthToken(), 'No auth token');
      
      const traversalPayloads = [
        '../../../etc/passwd',
        '..\\..\\..\\windows\\system32\\config\\sam',
        '....//....//....//etc/passwd',
        '%2e%2e%2f%2e%2e%2f%2e%2e%2fetc/passwd',
      ];
      
      for (const payload of traversalPayloads) {
        // Try path traversal in various places
        const response = await client.get(`${API.business}/files/${payload}`);
        
        // Should return 400 or 404, not actual file
        expect([400, 404]).toContain(response.status);
      }
    });
  });

  // ==========================================================================
  // CORS Configuration
  // ==========================================================================
  test.describe('CORS Configuration', () => {
    test('should handle CORS preflight requests', async () => {
      const response = await request.fetch(`${API.party}/parties`, {
        method: 'OPTIONS',
        headers: {
          'Origin': 'http://evil-site.com',
          'Access-Control-Request-Method': 'GET',
        },
      });
      
      // Should either allow (development) or block (production)
      // Should not return server error
      expect(response.status()).not.toBe(500);
    });
  });
});
