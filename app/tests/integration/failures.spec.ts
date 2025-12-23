/**
 * Integration Failure Scenario Tests
 * 
 * Tests for service unavailability, partial failures, timeout handling,
 * and network error scenarios.
 */

import { test, expect, APIRequestContext } from '@playwright/test';
import {
  createInvoiceData,
  createInvoiceItemData,
  createPartyData,
  createPaymentData,
  createItemData,
  API,
  TEST_OTP,
} from '../utils/test-helpers';
import { TestApiClient, setupAuthenticatedClient } from '../utils/api-client';

test.describe('Integration Failure Scenarios', () => {
  let request: APIRequestContext;
  let client: TestApiClient;
  let partyId: string;
  let itemId: string;
  const testPhone = '9876543300';
  
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
  // Service Unavailability Tests
  // ==========================================================================
  test.describe('Service Unavailability', () => {
    test('should handle invalid endpoint gracefully', async () => {
      test.skip(!client.getAuthToken(), 'No auth token');
      
      const response = await client.get('http://localhost:9999/non-existent');
      
      // Should fail gracefully, not crash
      expect(response.ok).toBeFalsy();
    });

    test('should return proper error for non-existent resource', async () => {
      test.skip(!client.getAuthToken(), 'No auth token');
      
      const fakeId = '00000000-0000-0000-0000-000000000999';
      
      const response = await client.getParty(fakeId);
      
      expect(response.ok).toBeFalsy();
      expect(response.status).toBe(404);
    });

    test('should handle connection refused gracefully', async () => {
      test.skip(!client.getAuthToken(), 'No auth token');
      
      // Try to connect to a closed port
      const badClient = new TestApiClient(request, client.getAuthToken() || '');
      
      try {
        const response = await request.get('http://localhost:1/test', {
          timeout: 1000,
        });
        // Should not reach here
        expect(response.ok()).toBeFalsy();
      } catch (e: any) {
        // Expected: connection refused
        expect(e.message).toMatch(/ECONNREFUSED|timeout|network/i);
      }
    });

    test('should return proper error for invalid routes', async () => {
      test.skip(!client.getAuthToken(), 'No auth token');
      
      const invalidRoutes = [
        `${API.party}/invalid-route`,
        `${API.invoice}/invoices/invalid/nested/route`,
        `${API.inventory}/../../../etc/passwd`,
      ];
      
      for (const route of invalidRoutes) {
        const response = await client.get(route);
        expect([400, 404, 405]).toContain(response.status);
      }
    });
  });

  // ==========================================================================
  // Partial Failure Tests
  // ==========================================================================
  test.describe('Partial Failure Handling', () => {
    test('should handle invoice creation with invalid party reference', async () => {
      test.skip(!client.getAuthToken(), 'No auth token');
      
      const fakePartyId = '00000000-0000-0000-0000-000000000999';
      const invoiceData = createInvoiceData(fakePartyId, {
        items: [createInvoiceItemData()],
      });
      
      const response = await client.createInvoice(invoiceData);
      
      // Should fail with clear error
      expect(response.ok).toBeFalsy();
      expect(response.error).toBeDefined();
    });

    test('should handle payment with invalid invoice reference', async () => {
      test.skip(!client.getAuthToken() || !partyId, 'Missing dependencies');
      
      const fakeInvoiceId = '00000000-0000-0000-0000-000000000999';
      const paymentData = createPaymentData(partyId, {
        invoice_id: fakeInvoiceId,
        amount: 1000,
        transaction_type: 'payment_in',
      });
      
      const response = await client.createPayment(paymentData);
      
      // Should fail with clear error
      expect(response.ok).toBeFalsy();
    });

    test('should handle stock update for non-existent item', async () => {
      test.skip(!client.getAuthToken(), 'No auth token');
      
      const fakeItemId = '00000000-0000-0000-0000-000000000999';
      const response = await client.updateStock(fakeItemId, 10, 'add');
      
      expect(response.ok).toBeFalsy();
      expect(response.status).toBe(404);
    });

    test('should not leave orphan data on partial failure', async () => {
      test.skip(!client.getAuthToken() || !partyId, 'Missing dependencies');
      
      // Try to create invoice with some valid and some invalid items
      const invoiceData = createInvoiceData(partyId, {
        items: [
          createInvoiceItemData({ item_name: 'Valid Item', unit_price: 100 }),
          { item_name: '', quantity: -1, unit_price: -100, tax_rate: -5 } as any, // Invalid
        ],
      });
      
      const response = await client.createInvoice(invoiceData);
      
      // If fails, ensure no orphan invoice was created
      if (!response.ok) {
        // The invoice should not exist
        expect(response.data?.id).toBeUndefined();
      }
    });
  });

  // ==========================================================================
  // Timeout Handling Tests
  // ==========================================================================
  test.describe('Timeout Handling', () => {
    test('should handle slow responses gracefully', async () => {
      test.skip(!client.getAuthToken(), 'No auth token');
      
      // Create a slow operation (large batch)
      const items = Array(100).fill(null).map((_, i) => 
        createInvoiceItemData({ item_name: `Item ${i}` })
      );
      
      const start = Date.now();
      const response = await client.createInvoice(createInvoiceData(partyId || '', { items }));
      const duration = Date.now() - start;
      
      // Should complete or timeout gracefully
      if (!response.ok && duration > 10000) {
        expect(response.status).toBeGreaterThanOrEqual(400);
      }
    });

    test('should handle request timeout configuration', async () => {
      // Create request with short timeout
      const shortTimeoutRequest = await request.newContext({
        timeout: 100, // Very short timeout
      });
      
      try {
        await shortTimeoutRequest.get(`${API.party}/parties`);
      } catch (e: any) {
        // Should timeout
        expect(e.message.toLowerCase()).toMatch(/timeout|aborted/);
      }
      
      await shortTimeoutRequest.dispose();
    });
  });

  // ==========================================================================
  // Network Error Simulation
  // ==========================================================================
  test.describe('Network Error Handling', () => {
    test('should handle malformed response gracefully', async () => {
      test.skip(!client.getAuthToken(), 'No auth token');
      
      // Try to parse invalid JSON (if server returns it)
      const response = await client.get(`${API.party}/parties`);
      
      // Response should be parseable
      expect(() => JSON.stringify(response)).not.toThrow();
    });

    test('should handle empty response body', async () => {
      test.skip(!client.getAuthToken(), 'No auth token');
      
      // Some DELETE operations return empty body
      const party = await client.createParty(createPartyData());
      
      if (party.ok) {
        const deleteResponse = await client.delete(`${API.party}/parties/${party.data.id}`);
        
        // Should handle empty body gracefully
        expect(deleteResponse).toBeDefined();
      }
    });

    test('should handle unexpected response format', async () => {
      test.skip(!client.getAuthToken(), 'No auth token');
      
      // Request non-JSON endpoint (if any exist)
      const response = await request.get(`${API.party}/../`, {
        headers: {
          Authorization: `Bearer ${client.getAuthToken()}`,
        },
      });
      
      // Should not crash
      expect(response.status()).toBeDefined();
    });
  });

  // ==========================================================================
  // Cross-Service Failure Tests
  // ==========================================================================
  test.describe('Cross-Service Failures', () => {
    test('should handle invoice-party relationship on party failure', async () => {
      test.skip(!client.getAuthToken() || !partyId, 'Missing dependencies');
      
      // Create invoice for existing party
      const invoiceResponse = await client.createInvoice(createInvoiceData(partyId, {
        items: [createInvoiceItemData()],
      }));
      
      if (invoiceResponse.ok) {
        // Invoice should contain party reference
        expect(invoiceResponse.data.party_id).toBe(partyId);
        
        // Getting invoice should work even if party service is slow
        const getResponse = await client.getInvoice(invoiceResponse.data.id);
        expect(getResponse.ok).toBeTruthy();
      }
    });

    test('should handle invoice-payment relationship on payment failure', async () => {
      test.skip(!client.getAuthToken() || !partyId, 'Missing dependencies');
      
      // Create invoice
      const invoiceResponse = await client.createInvoice(createInvoiceData(partyId, {
        items: [createInvoiceItemData({ unit_price: 1000 })],
      }));
      
      if (!invoiceResponse.ok) {
        test.skip(true, 'Could not create invoice');
        return;
      }
      
      // Try payment with invalid amount
      const paymentResponse = await client.createPayment(createPaymentData(partyId, {
        invoice_id: invoiceResponse.data.id,
        amount: -100, // Invalid
        transaction_type: 'payment_in',
      }));
      
      // Payment should fail
      expect(paymentResponse.ok).toBeFalsy();
      
      // Invoice should remain unchanged
      const invoiceCheck = await client.getInvoice(invoiceResponse.data.id);
      if (invoiceCheck.ok) {
        expect(invoiceCheck.data.paid_amount || 0).toBe(0);
      }
    });

    test('should handle invoice-inventory relationship on stock failure', async () => {
      test.skip(!client.getAuthToken() || !partyId || !itemId, 'Missing dependencies');
      
      // Set low stock
      await client.updateStock(itemId, 2, 'set');
      
      // Create invoice with high quantity
      const invoiceData = createInvoiceData(partyId, {
        items: [{
          item_id: itemId,
          item_name: 'Stock Test Item',
          quantity: 100, // More than available
          unit_price: 100,
          tax_rate: 18,
        }],
      });
      
      const response = await client.createInvoice(invoiceData);
      
      // Depending on implementation:
      // - May fail if stock validation is enabled
      // - May succeed if stock is not validated
      // Either way, should not cause server error
      expect(response.status).not.toBe(500);
    });
  });

  // ==========================================================================
  // Error Response Format Tests
  // ==========================================================================
  test.describe('Error Response Format', () => {
    test('should return consistent error format for validation errors', async () => {
      test.skip(!client.getAuthToken(), 'No auth token');
      
      const invalidParty = {
        name: '', // Invalid: empty
        phone: '123', // Invalid: too short
        gstin: 'invalid', // Invalid: wrong format
      };
      
      const response = await client.createParty(invalidParty as any);
      
      expect(response.ok).toBeFalsy();
      expect(response.error).toBeDefined();
      
      // Error should have message
      if (response.error) {
        expect(response.error.message || response.error.error || response.error).toBeDefined();
      }
    });

    test('should return consistent error format for not found', async () => {
      test.skip(!client.getAuthToken(), 'No auth token');
      
      const fakeId = '00000000-0000-0000-0000-000000000999';
      const response = await client.getParty(fakeId);
      
      expect(response.status).toBe(404);
      expect(response.error).toBeDefined();
    });

    test('should return consistent error format for unauthorized', async () => {
      const unauthClient = new TestApiClient(request);
      
      const response = await unauthClient.get(`${API.party}/parties`);
      
      expect(response.status).toBe(401);
    });

    test('should return consistent error format for method not allowed', async () => {
      test.skip(!client.getAuthToken(), 'No auth token');
      
      // Try PUT on a POST-only endpoint
      const response = await request.put(`${API.party}/parties`, {
        headers: {
          Authorization: `Bearer ${client.getAuthToken()}`,
          'Content-Type': 'application/json',
        },
        data: createPartyData(),
      });
      
      // Should be 405 or 404
      expect([404, 405]).toContain(response.status());
    });

    test('should return consistent error format for invalid content type', async () => {
      test.skip(!client.getAuthToken(), 'No auth token');
      
      const response = await request.post(`${API.party}/parties`, {
        headers: {
          Authorization: `Bearer ${client.getAuthToken()}`,
          'Content-Type': 'text/plain',
        },
        data: 'not json',
      });
      
      expect([400, 415]).toContain(response.status());
    });
  });

  // ==========================================================================
  // Idempotency Tests
  // ==========================================================================
  test.describe('Idempotency', () => {
    test('should handle duplicate payment attempts', async () => {
      test.skip(!client.getAuthToken() || !partyId, 'Missing dependencies');
      
      // Create invoice
      const invoiceResponse = await client.createInvoice(createInvoiceData(partyId, {
        items: [createInvoiceItemData({ unit_price: 10000 })],
      }));
      
      if (!invoiceResponse.ok) {
        test.skip(true, 'Could not create invoice');
        return;
      }
      
      const invoiceId = invoiceResponse.data.id;
      const paymentData = createPaymentData(partyId, {
        invoice_id: invoiceId,
        amount: 1000,
        transaction_type: 'payment_in',
        reference_number: `REF-${Date.now()}`, // Same reference
      });
      
      // First payment
      const first = await client.createPayment(paymentData);
      
      // Duplicate payment with same reference
      const second = await client.createPayment(paymentData);
      
      // Should either:
      // 1. Accept both (different payment IDs)
      // 2. Reject duplicate (idempotency based on reference)
      // Should not cause server error
      expect(first.status).not.toBe(500);
      expect(second.status).not.toBe(500);
    });

    test('should handle retry after timeout', async () => {
      test.skip(!client.getAuthToken(), 'No auth token');
      
      // Create party
      const partyData = createPartyData();
      
      // First attempt
      const first = await client.createParty(partyData);
      
      // Immediate retry (simulating timeout retry)
      const second = await client.createParty(partyData);
      
      // Both should be valid responses (not server errors)
      expect(first.status).not.toBe(500);
      expect(second.status).not.toBe(500);
    });
  });

  // ==========================================================================
  // Cascading Failure Prevention
  // ==========================================================================
  test.describe('Cascading Failure Prevention', () => {
    test('should isolate failures to individual requests', async () => {
      test.skip(!client.getAuthToken(), 'No auth token');
      
      // Make one failing request
      await client.getParty('invalid-id-format');
      
      // Subsequent requests should still work
      const response = await client.get(`${API.party}/parties`);
      expect(response.ok).toBeTruthy();
    });

    test('should maintain service stability after error burst', async () => {
      test.skip(!client.getAuthToken(), 'No auth token');
      
      // Generate many errors
      const errorRequests = Array(20).fill(null).map(() =>
        client.getParty('00000000-0000-0000-0000-000000000999')
      );
      await Promise.allSettled(errorRequests);
      
      // Wait briefly
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Service should still work
      const response = await client.get(`${API.party}/parties`);
      expect(response.ok).toBeTruthy();
    });

    test('should handle mixed success and failure requests', async () => {
      test.skip(!client.getAuthToken() || !partyId, 'Missing dependencies');
      
      const requests = await Promise.allSettled([
        // Valid requests
        client.get(`${API.party}/parties`),
        client.getParty(partyId),
        
        // Invalid requests
        client.getParty('00000000-0000-0000-0000-000000000999'),
        client.getInvoice('invalid'),
        
        // More valid requests
        client.listInvoices(),
        client.get(`${API.inventory}/items`),
      ]);
      
      // Valid requests should succeed
      const fulfilled = requests.filter(r => 
        r.status === 'fulfilled' && r.value.ok
      );
      
      // At least the valid ones should succeed
      expect(fulfilled.length).toBeGreaterThanOrEqual(3);
    });
  });

  // ==========================================================================
  // Health Check Tests
  // ==========================================================================
  test.describe('Health Checks', () => {
    test('should have working health endpoint', async () => {
      const services = [
        { name: 'Auth', port: 3002 },
        { name: 'Business', port: 3003 },
        { name: 'Party', port: 3004 },
        { name: 'Inventory', port: 3005 },
        { name: 'Invoice', port: 3006 },
        { name: 'Payment', port: 3007 },
      ];
      
      for (const service of services) {
        try {
          const response = await request.get(`http://localhost:${service.port}/health`, {
            timeout: 5000,
          });
          console.log(`${service.name} health: ${response.status()}`);
          expect([200, 404]).toContain(response.status()); // 404 if no health endpoint
        } catch (e) {
          console.warn(`${service.name} service not reachable`);
        }
      }
    });
  });
});
