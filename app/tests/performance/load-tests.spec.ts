/**
 * Performance & Stress Tests
 * 
 * Tests for large datasets, query performance, and concurrent operations.
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

test.describe('Performance & Stress Tests', () => {
  let request: APIRequestContext;
  let client: TestApiClient;
  let partyId: string;
  const testPhone = '9876543299';
  
  // Performance thresholds (in milliseconds)
  const THRESHOLDS = {
    listResponse: 2000,      // List endpoints
    createResponse: 1000,    // Create operations
    getResponse: 500,        // Get single item
    searchResponse: 3000,    // Search operations
    bulkCreate: 10000,       // Bulk operations
  };
  
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
    } catch (e) {
      console.warn('Setup failed, some tests may be skipped:', e);
      client = new TestApiClient(request);
    }
  });
  
  test.afterAll(async () => {
    await request.dispose();
  });

  // ==========================================================================
  // Response Time Tests
  // ==========================================================================
  test.describe('Response Time Tests', () => {
    test('list parties should respond within threshold', async () => {
      test.skip(!client.getAuthToken(), 'No auth token');
      
      const startTime = Date.now();
      const response = await client.get(`${API.party}/parties`);
      const duration = Date.now() - startTime;
      
      console.log(`List parties duration: ${duration}ms`);
      expect(duration).toBeLessThan(THRESHOLDS.listResponse);
    });

    test('list invoices should respond within threshold', async () => {
      test.skip(!client.getAuthToken(), 'No auth token');
      
      const startTime = Date.now();
      const response = await client.listInvoices();
      const duration = Date.now() - startTime;
      
      console.log(`List invoices duration: ${duration}ms`);
      expect(duration).toBeLessThan(THRESHOLDS.listResponse);
    });

    test('list items should respond within threshold', async () => {
      test.skip(!client.getAuthToken(), 'No auth token');
      
      const startTime = Date.now();
      const response = await client.get(`${API.inventory}/items`);
      const duration = Date.now() - startTime;
      
      console.log(`List items duration: ${duration}ms`);
      expect(duration).toBeLessThan(THRESHOLDS.listResponse);
    });

    test('create party should respond within threshold', async () => {
      test.skip(!client.getAuthToken(), 'No auth token');
      
      const startTime = Date.now();
      const response = await client.createParty(createPartyData());
      const duration = Date.now() - startTime;
      
      console.log(`Create party duration: ${duration}ms`);
      expect(duration).toBeLessThan(THRESHOLDS.createResponse);
    });

    test('create invoice should respond within threshold', async () => {
      test.skip(!client.getAuthToken() || !partyId, 'Missing dependencies');
      
      const startTime = Date.now();
      const response = await client.createInvoice(createInvoiceData(partyId, {
        items: [createInvoiceItemData()],
      }));
      const duration = Date.now() - startTime;
      
      console.log(`Create invoice duration: ${duration}ms`);
      expect(duration).toBeLessThan(THRESHOLDS.createResponse);
    });

    test('get single party should respond within threshold', async () => {
      test.skip(!client.getAuthToken() || !partyId, 'Missing dependencies');
      
      const startTime = Date.now();
      const response = await client.getParty(partyId);
      const duration = Date.now() - startTime;
      
      console.log(`Get party duration: ${duration}ms`);
      expect(duration).toBeLessThan(THRESHOLDS.getResponse);
    });
  });

  // ==========================================================================
  // Large Dataset Handling
  // ==========================================================================
  test.describe('Large Dataset Handling', () => {
    test('should handle invoice with many items', async () => {
      test.skip(!client.getAuthToken() || !partyId, 'Missing dependencies');
      
      // Create invoice with 50 items
      const items = Array(50).fill(null).map((_, i) => 
        createInvoiceItemData({
          item_name: `Item ${i + 1}`,
          quantity: i + 1,
          unit_price: 100 + i,
          tax_rate: [5, 12, 18, 28][i % 4],
        })
      );
      
      const startTime = Date.now();
      const response = await client.createInvoice(createInvoiceData(partyId, { items }));
      const duration = Date.now() - startTime;
      
      console.log(`Create invoice with 50 items duration: ${duration}ms`);
      
      if (response.ok) {
        expect(response.data.items?.length || 0).toBe(50);
      }
      
      expect(duration).toBeLessThan(THRESHOLDS.bulkCreate);
    });

    test('should handle pagination for large lists', async () => {
      test.skip(!client.getAuthToken(), 'No auth token');
      
      // Request first page
      const page1 = await client.get(`${API.party}/parties`, {
        page: 1,
        limit: 10,
      });
      
      if (page1.ok && Array.isArray(page1.data)) {
        expect(page1.data.length).toBeLessThanOrEqual(10);
        
        // Request second page
        const page2 = await client.get(`${API.party}/parties`, {
          page: 2,
          limit: 10,
        });
        
        if (page2.ok && Array.isArray(page2.data) && page1.data.length > 0 && page2.data.length > 0) {
          // Ensure no overlap
          const page1Ids = new Set(page1.data.map((p: any) => p.id));
          const hasOverlap = page2.data.some((p: any) => page1Ids.has(p.id));
          expect(hasOverlap).toBeFalsy();
        }
      }
    });

    test('should handle search on large dataset', async () => {
      test.skip(!client.getAuthToken(), 'No auth token');
      
      const startTime = Date.now();
      const response = await client.get(`${API.party}/parties`, {
        search: 'test',
      });
      const duration = Date.now() - startTime;
      
      console.log(`Search parties duration: ${duration}ms`);
      expect(duration).toBeLessThan(THRESHOLDS.searchResponse);
    });

    test('should handle date range filter efficiently', async () => {
      test.skip(!client.getAuthToken(), 'No auth token');
      
      const endDate = new Date().toISOString().split('T')[0];
      const startDate = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      
      const start = Date.now();
      const response = await client.get(`${API.invoice}/invoices`, {
        startDate,
        endDate,
      });
      const duration = Date.now() - start;
      
      console.log(`Date range filter duration: ${duration}ms`);
      expect(duration).toBeLessThan(THRESHOLDS.searchResponse);
    });
  });

  // ==========================================================================
  // Concurrent Operations
  // ==========================================================================
  test.describe('Concurrent Operations', () => {
    test('should handle concurrent party creations', async () => {
      test.skip(!client.getAuthToken(), 'No auth token');
      
      const concurrency = 10;
      const parties = Array(concurrency).fill(null).map(() => createPartyData());
      
      const startTime = Date.now();
      const results = await Promise.allSettled(
        parties.map(p => client.createParty(p))
      );
      const duration = Date.now() - startTime;
      
      const successful = results.filter(r => 
        r.status === 'fulfilled' && r.value.ok
      ).length;
      
      console.log(`Concurrent party creation: ${successful}/${concurrency} in ${duration}ms`);
      
      // Most should succeed
      expect(successful).toBeGreaterThan(concurrency * 0.8);
    });

    test('should handle concurrent invoice creations', async () => {
      test.skip(!client.getAuthToken() || !partyId, 'Missing dependencies');
      
      const concurrency = 10;
      const invoices = Array(concurrency).fill(null).map(() => 
        createInvoiceData(partyId, {
          items: [createInvoiceItemData()],
        })
      );
      
      const startTime = Date.now();
      const results = await Promise.allSettled(
        invoices.map(inv => client.createInvoice(inv))
      );
      const duration = Date.now() - startTime;
      
      const successful = results.filter(r => 
        r.status === 'fulfilled' && r.value.ok
      ).length;
      
      console.log(`Concurrent invoice creation: ${successful}/${concurrency} in ${duration}ms`);
      
      // Most should succeed
      expect(successful).toBeGreaterThan(concurrency * 0.8);
    });

    test('should handle concurrent reads', async () => {
      test.skip(!client.getAuthToken(), 'No auth token');
      
      const concurrency = 50;
      
      const startTime = Date.now();
      const results = await Promise.allSettled(
        Array(concurrency).fill(null).map(() => client.get(`${API.party}/parties`))
      );
      const duration = Date.now() - startTime;
      
      const successful = results.filter(r => 
        r.status === 'fulfilled' && r.value.ok
      ).length;
      
      console.log(`Concurrent reads: ${successful}/${concurrency} in ${duration}ms`);
      
      // All should succeed
      expect(successful).toBe(concurrency);
    });

    test('should handle mixed concurrent operations', async () => {
      test.skip(!client.getAuthToken() || !partyId, 'Missing dependencies');
      
      const startTime = Date.now();
      const results = await Promise.allSettled([
        // Reads
        client.get(`${API.party}/parties`),
        client.listInvoices(),
        client.get(`${API.inventory}/items`),
        
        // Creates
        client.createParty(createPartyData()),
        client.createItem(createItemData()),
        
        // Updates (if partyId exists)
        client.patch(`${API.party}/parties/${partyId}`, { billing_city: 'Mumbai' }),
      ]);
      const duration = Date.now() - startTime;
      
      const successful = results.filter(r => 
        r.status === 'fulfilled' && r.value.ok
      ).length;
      
      console.log(`Mixed concurrent operations: ${successful}/6 in ${duration}ms`);
      
      // Most should succeed
      expect(successful).toBeGreaterThan(4);
    });
  });

  // ==========================================================================
  // Memory & Resource Tests
  // ==========================================================================
  test.describe('Memory & Resource Tests', () => {
    test('should handle repeated operations without memory leak', async () => {
      test.skip(!client.getAuthToken(), 'No auth token');
      
      const iterations = 50;
      const durations: number[] = [];
      
      for (let i = 0; i < iterations; i++) {
        const startTime = Date.now();
        await client.get(`${API.party}/parties`);
        durations.push(Date.now() - startTime);
      }
      
      // Response time should remain stable
      const firstHalf = durations.slice(0, iterations / 2);
      const secondHalf = durations.slice(iterations / 2);
      
      const avgFirst = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
      const avgSecond = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
      
      console.log(`First half avg: ${avgFirst}ms, Second half avg: ${avgSecond}ms`);
      
      // Second half shouldn't be significantly slower (indicating memory leak)
      expect(avgSecond).toBeLessThan(avgFirst * 2);
    });

    test('should handle large request body', async () => {
      test.skip(!client.getAuthToken() || !partyId, 'Missing dependencies');
      
      // Create invoice with large notes
      const largeNotes = 'X'.repeat(10000);
      const invoiceData = createInvoiceData(partyId, {
        items: [createInvoiceItemData()],
        notes: largeNotes,
      });
      
      const startTime = Date.now();
      const response = await client.createInvoice(invoiceData);
      const duration = Date.now() - startTime;
      
      console.log(`Large request body duration: ${duration}ms`);
      
      // Should complete within reasonable time
      expect(duration).toBeLessThan(THRESHOLDS.createResponse * 2);
    });
  });

  // ==========================================================================
  // Query Performance
  // ==========================================================================
  test.describe('Query Performance', () => {
    test('filter by status should be efficient', async () => {
      test.skip(!client.getAuthToken(), 'No auth token');
      
      const startTime = Date.now();
      const response = await client.get(`${API.invoice}/invoices`, {
        status: 'draft',
      });
      const duration = Date.now() - startTime;
      
      console.log(`Filter by status duration: ${duration}ms`);
      expect(duration).toBeLessThan(THRESHOLDS.listResponse);
    });

    test('filter by party should be efficient', async () => {
      test.skip(!client.getAuthToken() || !partyId, 'Missing dependencies');
      
      const startTime = Date.now();
      const response = await client.get(`${API.invoice}/invoices`, {
        party_id: partyId,
      });
      const duration = Date.now() - startTime;
      
      console.log(`Filter by party duration: ${duration}ms`);
      expect(duration).toBeLessThan(THRESHOLDS.listResponse);
    });

    test('sorting should be efficient', async () => {
      test.skip(!client.getAuthToken(), 'No auth token');
      
      const sortFields = ['created_at', 'updated_at', 'invoice_date', 'total_amount'];
      
      for (const field of sortFields) {
        const startTime = Date.now();
        const response = await client.get(`${API.invoice}/invoices`, {
          sortBy: field,
          sortOrder: 'desc',
        });
        const duration = Date.now() - startTime;
        
        console.log(`Sort by ${field} duration: ${duration}ms`);
        expect(duration).toBeLessThan(THRESHOLDS.listResponse);
      }
    });

    test('combined filters should be efficient', async () => {
      test.skip(!client.getAuthToken() || !partyId, 'Missing dependencies');
      
      const startTime = Date.now();
      const response = await client.get(`${API.invoice}/invoices`, {
        party_id: partyId,
        status: 'draft',
        startDate: '2024-01-01',
        sortBy: 'invoice_date',
        sortOrder: 'desc',
        limit: 20,
      });
      const duration = Date.now() - startTime;
      
      console.log(`Combined filters duration: ${duration}ms`);
      expect(duration).toBeLessThan(THRESHOLDS.listResponse);
    });
  });

  // ==========================================================================
  // Stress Tests
  // ==========================================================================
  test.describe('Stress Tests', () => {
    test('should handle rapid sequential requests', async () => {
      test.skip(!client.getAuthToken(), 'No auth token');
      
      const iterations = 100;
      let successful = 0;
      const startTime = Date.now();
      
      for (let i = 0; i < iterations; i++) {
        const response = await client.get(`${API.party}/parties`);
        if (response.ok) successful++;
      }
      
      const duration = Date.now() - startTime;
      const rps = (iterations / duration) * 1000;
      
      console.log(`Rapid sequential: ${successful}/${iterations} in ${duration}ms (${rps.toFixed(2)} req/s)`);
      
      // All should succeed
      expect(successful).toBe(iterations);
    });

    test('should maintain consistency under load', async () => {
      test.skip(!client.getAuthToken() || !partyId, 'Missing dependencies');
      
      // Create an invoice
      const invoiceResponse = await client.createInvoice(createInvoiceData(partyId, {
        items: [createInvoiceItemData({ unit_price: 1000, quantity: 1, tax_rate: 18 })],
      }));
      
      if (!invoiceResponse.ok) {
        test.skip(true, 'Could not create invoice');
        return;
      }
      
      const invoiceId = invoiceResponse.data.id;
      const expectedTotal = invoiceResponse.data.total_amount;
      
      // Read the same invoice multiple times concurrently
      const reads = await Promise.all(
        Array(20).fill(null).map(() => client.getInvoice(invoiceId))
      );
      
      // All reads should return same total
      const totals = reads
        .filter(r => r.ok)
        .map(r => r.data.total_amount);
      
      expect(new Set(totals).size).toBe(1);
      expect(totals[0]).toBe(expectedTotal);
    });

    test('should recover from burst traffic', async () => {
      test.skip(!client.getAuthToken(), 'No auth token');
      
      // Burst of requests
      const burstSize = 50;
      await Promise.allSettled(
        Array(burstSize).fill(null).map(() => client.get(`${API.party}/parties`))
      );
      
      // Wait a bit
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Normal request should still work
      const startTime = Date.now();
      const response = await client.get(`${API.party}/parties`);
      const duration = Date.now() - startTime;
      
      expect(response.ok).toBeTruthy();
      expect(duration).toBeLessThan(THRESHOLDS.listResponse);
    });
  });

  // ==========================================================================
  // Database Connection Tests
  // ==========================================================================
  test.describe('Database Connection Tests', () => {
    test('should handle connection pool exhaustion gracefully', async () => {
      test.skip(!client.getAuthToken(), 'No auth token');
      
      // Many concurrent connections
      const concurrency = 100;
      
      const results = await Promise.allSettled(
        Array(concurrency).fill(null).map(() => client.get(`${API.party}/parties`))
      );
      
      // Should not have server errors (502, 503, 500)
      const serverErrors = results.filter(r => 
        r.status === 'fulfilled' && [500, 502, 503].includes(r.value.status)
      ).length;
      
      console.log(`Server errors: ${serverErrors}/${concurrency}`);
      expect(serverErrors).toBeLessThan(concurrency * 0.1);
    });
  });
});
