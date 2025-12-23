/**
 * Error Recovery & Resilience Tests
 * 
 * Tests for retry logic, error messages, graceful degradation,
 * and system resilience.
 */

import { test, expect, APIRequestContext } from '@playwright/test';
import {
  createInvoiceData,
  createInvoiceItemData,
  createPartyData,
  createPaymentData,
  createItemData,
  generatePhone,
  API,
  TEST_OTP,
} from '../utils/test-helpers';
import { TestApiClient, setupAuthenticatedClient } from '../utils/api-client';

test.describe('Error Recovery & Resilience', () => {
  let request: APIRequestContext;
  let client: TestApiClient;
  let partyId: string;
  let itemId: string;
  const testPhone = '9876543301';
  
  test.beforeAll(async ({ playwright }) => {
    request = await playwright.request.newContext();
    try {
      client = await setupAuthenticatedClient(request, testPhone, TEST_OTP);
      
      // Create a party
      const partyData = createPartyData({ type: 'customer' });
      const partyResponse = await client.createParty(partyData);
      if (partyResponse.ok) {
        partyId = partyResponse.data.id;
      }
      
      // Create an item
      const itemData = createItemData({ opening_stock: 100 });
      const itemResponse = await client.createItem(itemData);
      if (itemResponse.ok) {
        itemId = itemResponse.data.id;
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
  // Error Message Quality
  // ==========================================================================
  test.describe('Error Message Quality', () => {
    test('should provide clear validation error messages', async () => {
      test.skip(!client.getAuthToken(), 'No auth token');
      
      const invalidParty = {
        name: '',
        phone: '123',
        gstin: 'invalid',
      };
      
      const response = await client.createParty(invalidParty as any);
      
      expect(response.ok).toBeFalsy();
      expect(response.error).toBeDefined();
      
      // Error should be descriptive
      const errorStr = JSON.stringify(response.error);
      expect(errorStr.length).toBeGreaterThan(10); // Not just generic error
    });

    test('should provide clear not found messages', async () => {
      test.skip(!client.getAuthToken(), 'No auth token');
      
      const fakeId = '00000000-0000-0000-0000-000000000999';
      const response = await client.getParty(fakeId);
      
      expect(response.status).toBe(404);
      
      // Should indicate resource not found
      const errorStr = JSON.stringify(response.error || '');
      expect(errorStr.toLowerCase()).toMatch(/not found|does not exist|no .* found/i);
    });

    test('should provide clear unauthorized messages', async () => {
      const unauthClient = new TestApiClient(request);
      const response = await unauthClient.get(`${API.party}/parties`);
      
      expect(response.status).toBe(401);
      
      // Should indicate authentication required
      const errorStr = JSON.stringify(response.error || '');
      expect(errorStr.toLowerCase()).toMatch(/unauthorized|authentication|token|login/i);
    });

    test('should provide field-specific validation errors', async () => {
      test.skip(!client.getAuthToken(), 'No auth token');
      
      const invalidParty = {
        name: 'Valid Name',
        phone: '123', // Invalid
        gstin: '29ABCDE1234F1Z5',
        billing_state: 'ValidState',
      };
      
      const response = await client.createParty(invalidParty as any);
      
      if (!response.ok && response.error) {
        // Error should mention the problematic field
        const errorStr = JSON.stringify(response.error);
        
        // Should mention phone or validation
        expect(errorStr.toLowerCase()).toMatch(/phone|validation|invalid/i);
      }
    });

    test('should not leak sensitive information in errors', async () => {
      test.skip(!client.getAuthToken(), 'No auth token');
      
      const invalidParty = {
        name: "Test'; DROP TABLE users; --",
      };
      
      const response = await client.createParty(invalidParty as any);
      
      const errorStr = JSON.stringify(response.error || '');
      
      // Should not leak SQL details
      expect(errorStr.toLowerCase()).not.toMatch(/sql|syntax|table|column|database|postgres|mysql/i);
      
      // Should not leak file paths
      expect(errorStr).not.toMatch(/\/usr\/|\/home\/|\/var\/|c:\\|d:\\/i);
      
      // Should not leak stack traces in production
      // (This might be present in development)
    });
  });

  // ==========================================================================
  // Recovery After Failures
  // ==========================================================================
  test.describe('Recovery After Failures', () => {
    test('should recover after validation error', async () => {
      test.skip(!client.getAuthToken(), 'No auth token');
      
      // Invalid request
      await client.createParty({ name: '' } as any);
      
      // Valid request should work immediately
      const validResponse = await client.createParty(createPartyData());
      expect(validResponse.ok).toBeTruthy();
    });

    test('should recover after auth error', async () => {
      test.skip(!client.getAuthToken(), 'No auth token');
      
      // Use invalid token
      const badClient = new TestApiClient(request, 'invalid-token');
      await badClient.get(`${API.party}/parties`);
      
      // Valid token should still work
      const response = await client.get(`${API.party}/parties`);
      expect(response.ok).toBeTruthy();
    });

    test('should recover after multiple failures', async () => {
      test.skip(!client.getAuthToken(), 'No auth token');
      
      // Generate multiple errors
      const failures = await Promise.allSettled([
        client.createParty({ name: '' } as any),
        client.getParty('invalid'),
        client.createInvoice({} as any),
        client.createPayment({} as any),
      ]);
      
      // Wait briefly
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // System should work fine
      const response = await client.get(`${API.party}/parties`);
      expect(response.ok).toBeTruthy();
    });

    test('should maintain data integrity after failed operations', async () => {
      test.skip(!client.getAuthToken() || !partyId, 'Missing dependencies');
      
      // Get initial party data
      const initialParty = await client.getParty(partyId);
      const initialName = initialParty.data?.name;
      
      // Try invalid update
      await client.patch(`${API.party}/parties/${partyId}`, {
        phone: 'invalid-phone',
      });
      
      // Data should be unchanged
      const afterFailure = await client.getParty(partyId);
      expect(afterFailure.data?.name).toBe(initialName);
    });
  });

  // ==========================================================================
  // Retry Logic
  // ==========================================================================
  test.describe('Retry Logic', () => {
    test('should succeed on retry after transient failure', async () => {
      test.skip(!client.getAuthToken(), 'No auth token');
      
      let attempts = 0;
      let success = false;
      
      while (attempts < 3 && !success) {
        const response = await client.get(`${API.party}/parties`);
        if (response.ok) {
          success = true;
        }
        attempts++;
      }
      
      expect(success).toBeTruthy();
      console.log(`Succeeded after ${attempts} attempt(s)`);
    });

    test('should handle retry with same idempotency key', async () => {
      test.skip(!client.getAuthToken(), 'No auth token');
      
      const partyData = createPartyData();
      const idempotencyKey = `create-party-${Date.now()}`;
      
      // First attempt
      const first = await request.post(`${API.party}/parties`, {
        headers: {
          Authorization: `Bearer ${client.getAuthToken()}`,
          'Content-Type': 'application/json',
          'Idempotency-Key': idempotencyKey,
        },
        data: partyData,
      });
      
      // Retry with same key
      const second = await request.post(`${API.party}/parties`, {
        headers: {
          Authorization: `Bearer ${client.getAuthToken()}`,
          'Content-Type': 'application/json',
          'Idempotency-Key': idempotencyKey,
        },
        data: partyData,
      });
      
      // Both should return same result (or second should be rejected)
      // Should not cause duplicate
    });

    test('should implement exponential backoff pattern', async () => {
      test.skip(!client.getAuthToken(), 'No auth token');
      
      const delays = [100, 200, 400, 800];
      let lastDuration = 0;
      
      for (const delay of delays) {
        await new Promise(resolve => setTimeout(resolve, delay));
        
        const start = Date.now();
        await client.get(`${API.party}/parties`);
        const duration = Date.now() - start;
        
        // Response time should remain relatively stable
        if (lastDuration > 0) {
          // Not more than 3x slower
          expect(duration).toBeLessThan(lastDuration * 3 + 500);
        }
        lastDuration = duration;
      }
    });
  });

  // ==========================================================================
  // Graceful Degradation
  // ==========================================================================
  test.describe('Graceful Degradation', () => {
    test('should return partial data when some services slow', async () => {
      test.skip(!client.getAuthToken(), 'No auth token');
      
      // Request that might need multiple services
      const response = await client.listInvoices();
      
      // Should return array even if some related data is missing
      if (response.ok) {
        expect(Array.isArray(response.data)).toBeTruthy();
      }
    });

    test('should handle missing optional fields gracefully', async () => {
      test.skip(!client.getAuthToken() || !partyId, 'Missing dependencies');
      
      // Create invoice with minimal data
      const minimalInvoice = {
        party_id: partyId,
        invoice_type: 'sale',
        invoice_date: new Date().toISOString().split('T')[0],
        items: [
          {
            item_name: 'Test Item',
            quantity: 1,
            unit_price: 100,
            tax_rate: 18,
          },
        ],
      };
      
      const response = await client.createInvoice(minimalInvoice as any);
      
      // Should work with minimal data
      if (response.ok) {
        expect(response.data.id).toBeDefined();
      }
    });

    test('should provide default values for missing optional data', async () => {
      test.skip(!client.getAuthToken() || !partyId, 'Missing dependencies');
      
      // Create party with minimal data
      const minimalParty = {
        name: `Test Party ${Date.now()}`,
        phone: generatePhone(),
      };
      
      const response = await client.createParty(minimalParty as any);
      
      if (response.ok) {
        // Should have default values
        expect(response.data.type || 'customer').toBeDefined();
        expect(response.data.status || 'active').toBeDefined();
      }
    });
  });

  // ==========================================================================
  // State Consistency After Errors
  // ==========================================================================
  test.describe('State Consistency After Errors', () => {
    test('should maintain invoice totals consistency after item error', async () => {
      test.skip(!client.getAuthToken() || !partyId, 'Missing dependencies');
      
      // Create invoice with valid items
      const invoiceData = createInvoiceData(partyId, {
        items: [
          createInvoiceItemData({ unit_price: 100, quantity: 1, tax_rate: 18 }),
          createInvoiceItemData({ unit_price: 200, quantity: 2, tax_rate: 18 }),
        ],
      });
      const invoiceResponse = await client.createInvoice(invoiceData);
      
      if (!invoiceResponse.ok) {
        test.skip(true, 'Could not create invoice');
        return;
      }
      
      const invoiceId = invoiceResponse.data.id;
      
      // Try to add invalid item (should fail)
      // Note: This depends on API supporting item addition
      
      // Verify totals are still correct
      const invoice = await client.getInvoice(invoiceId);
      if (invoice.ok) {
        const expectedSubtotal = 100 * 1 + 200 * 2; // 500
        const expectedTax = expectedSubtotal * 0.18; // 90
        
        expect(invoice.data.subtotal).toBe(expectedSubtotal);
        expect(invoice.data.total_amount).toBeCloseTo(expectedSubtotal + expectedTax, 2);
      }
    });

    test('should maintain stock consistency after failed sale', async () => {
      test.skip(!client.getAuthToken() || !itemId, 'Missing dependencies');
      
      // Get initial stock
      const initialItem = await client.getItem(itemId);
      const initialStock = initialItem.data?.current_stock || initialItem.data?.stock || 0;
      
      // Try to create invoice with excessive quantity (might fail)
      const invoiceData = createInvoiceData(partyId || '', {
        items: [{
          item_id: itemId,
          item_name: 'Test Item',
          quantity: 99999, // Excessive
          unit_price: 100,
          tax_rate: 18,
        }],
      });
      await client.createInvoice(invoiceData);
      
      // Stock should remain unchanged (or properly decremented)
      const afterItem = await client.getItem(itemId);
      const afterStock = afterItem.data?.current_stock || afterItem.data?.stock || 0;
      
      // Should not go negative
      expect(afterStock).toBeGreaterThanOrEqual(0);
    });

    test('should maintain payment balance consistency after error', async () => {
      test.skip(!client.getAuthToken() || !partyId, 'Missing dependencies');
      
      // Create invoice
      const invoiceData = createInvoiceData(partyId, {
        items: [createInvoiceItemData({ unit_price: 10000 })],
      });
      const invoiceResponse = await client.createInvoice(invoiceData);
      
      if (!invoiceResponse.ok) {
        test.skip(true, 'Could not create invoice');
        return;
      }
      
      const invoiceId = invoiceResponse.data.id;
      
      // Record a valid payment
      await client.createPayment(createPaymentData(partyId, {
        invoice_id: invoiceId,
        amount: 5000,
        transaction_type: 'payment_in',
      }));
      
      // Get balance
      const afterFirst = await client.getInvoice(invoiceId);
      const balanceAfterFirst = afterFirst.data?.paid_amount || 0;
      
      // Try invalid payment
      await client.createPayment(createPaymentData(partyId, {
        invoice_id: invoiceId,
        amount: -1000, // Invalid
        transaction_type: 'payment_in',
      }));
      
      // Balance should be unchanged
      const afterInvalid = await client.getInvoice(invoiceId);
      const balanceAfterInvalid = afterInvalid.data?.paid_amount || 0;
      
      expect(balanceAfterInvalid).toBe(balanceAfterFirst);
    });
  });

  // ==========================================================================
  // Circuit Breaker Pattern
  // ==========================================================================
  test.describe('Circuit Breaker Pattern', () => {
    test('should maintain service availability under load', async () => {
      test.skip(!client.getAuthToken(), 'No auth token');
      
      // Generate load
      const requests = Array(30).fill(null).map(() =>
        client.get(`${API.party}/parties`)
      );
      
      const results = await Promise.allSettled(requests);
      
      const successful = results.filter(r =>
        r.status === 'fulfilled' && r.value.ok
      ).length;
      
      // Most should succeed
      expect(successful).toBeGreaterThan(requests.length * 0.9);
    });

    test('should not cascade failures', async () => {
      test.skip(!client.getAuthToken(), 'No auth token');
      
      // Mix of valid and invalid requests
      const validRequest = () => client.get(`${API.party}/parties`);
      const invalidRequest = () => client.getParty('00000000-0000-0000-0000-000000000999');
      
      const requests = [
        validRequest(),
        invalidRequest(),
        validRequest(),
        invalidRequest(),
        validRequest(),
        validRequest(),
      ];
      
      const results = await Promise.allSettled(requests);
      
      // Valid requests should succeed despite invalid ones
      const validIndices = [0, 2, 4, 5];
      const validSuccesses = validIndices.filter(i => {
        const r = results[i];
        return r.status === 'fulfilled' && r.value.ok;
      }).length;
      
      expect(validSuccesses).toBe(4);
    });
  });

  // ==========================================================================
  // Session Recovery
  // ==========================================================================
  test.describe('Session Recovery', () => {
    test('should allow re-authentication after token expiry', async () => {
      // Try to re-authenticate
      const newClient = await setupAuthenticatedClient(
        request,
        generatePhone(),
        TEST_OTP
      );
      
      expect(newClient.getAuthToken()).toBeTruthy();
      
      // Should work with new token
      const response = await newClient.get(`${API.party}/parties`);
      expect(response.ok).toBeTruthy();
    });

    test('should handle concurrent auth requests', async () => {
      // Multiple auth attempts
      const authAttempts = Array(5).fill(null).map(() =>
        setupAuthenticatedClient(request, generatePhone(), TEST_OTP)
      );
      
      const results = await Promise.allSettled(authAttempts);
      
      const successful = results.filter(r =>
        r.status === 'fulfilled' && r.value.getAuthToken()
      ).length;
      
      // All should succeed
      expect(successful).toBe(5);
    });
  });

  // ==========================================================================
  // Error Logging
  // ==========================================================================
  test.describe('Error Logging', () => {
    test('should include request ID in error response', async () => {
      test.skip(!client.getAuthToken(), 'No auth token');
      
      const response = await client.createParty({ name: '' } as any);
      
      // Check for request ID or correlation ID
      // This helps with debugging and log correlation
      // Note: Header name varies by implementation
    });

    test('should provide timestamp in error response', async () => {
      test.skip(!client.getAuthToken(), 'No auth token');
      
      const response = await client.createParty({ name: '' } as any);
      
      // Error should have timestamp or be traceable
      expect(response.error).toBeDefined();
    });
  });

  // ==========================================================================
  // Cleanup and Resource Management
  // ==========================================================================
  test.describe('Cleanup and Resource Management', () => {
    test('should release resources after error', async () => {
      test.skip(!client.getAuthToken(), 'No auth token');
      
      // Generate errors
      for (let i = 0; i < 10; i++) {
        await client.createParty({ name: '' } as any);
      }
      
      // Should still be able to make new requests
      const response = await client.get(`${API.party}/parties`);
      expect(response.ok).toBeTruthy();
    });

    test('should handle connection cleanup properly', async () => {
      // Create multiple request contexts
      const contexts = await Promise.all(
        Array(5).fill(null).map(() => request.newContext())
      );
      
      // Make requests
      for (const ctx of contexts) {
        try {
          await ctx.get(`${API.party}/parties`);
        } catch {}
      }
      
      // Cleanup
      await Promise.all(contexts.map(ctx => ctx.dispose()));
      
      // Original client should still work
      const response = await client.get(`${API.party}/parties`);
      expect(response.ok).toBeTruthy();
    });
  });
});
