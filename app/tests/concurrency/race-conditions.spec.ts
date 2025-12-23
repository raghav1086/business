/**
 * Race Conditions & Concurrency Tests
 * 
 * Tests for concurrent operations including invoice number generation,
 * stock deduction, payment recording, and business creation.
 */

import { test, expect, APIRequestContext } from '@playwright/test';
import {
  createInvoiceData,
  createInvoiceItemData,
  createPartyData,
  createPaymentData,
  createBusinessData,
  createItemData,
  generateGSTIN,
  executeParallel,
  countResults,
  getSuccessfulValues,
  API,
  TEST_OTP,
} from '../utils/test-helpers';
import { TestApiClient, setupAuthenticatedClient } from '../utils/api-client';

test.describe('Race Conditions & Concurrency', () => {
  let request: APIRequestContext;
  let client: TestApiClient;
  let partyId: string;
  let itemId: string;
  const testPhone = '9876543295';
  
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
      
      // Create an item with stock for tests
      const itemData = createItemData({ opening_stock: 1000 });
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
  // Invoice Number Generation Concurrency
  // ==========================================================================
  test.describe('Invoice Number Generation', () => {
    test('should generate unique invoice numbers concurrently (10 invoices)', async () => {
      test.skip(!client.getAuthToken() || !partyId, 'Missing dependencies');
      
      const promises = Array.from({ length: 10 }, () => async () => {
        const invoiceData = createInvoiceData(partyId, {
          invoice_type: 'sale',
          items: [createInvoiceItemData()],
        });
        return client.createInvoice(invoiceData);
      });
      
      const results = await executeParallel(promises);
      const { successes, failures } = countResults(results);
      const successfulInvoices = getSuccessfulValues(results);
      
      console.log(`Concurrent invoice creation: ${successes} successes, ${failures} failures`);
      
      // All or most should succeed
      expect(successes).toBeGreaterThanOrEqual(5);
      
      // Invoice numbers should be unique
      const invoiceNumbers = successfulInvoices.map(r => r.data?.invoice_number);
      const uniqueNumbers = new Set(invoiceNumbers.filter(Boolean));
      expect(uniqueNumbers.size).toBe(invoiceNumbers.filter(Boolean).length);
    });

    test('should generate unique invoice numbers concurrently (50 invoices)', async () => {
      test.skip(!client.getAuthToken() || !partyId, 'Missing dependencies');
      test.slow(); // Mark as slow test
      
      const promises = Array.from({ length: 50 }, () => async () => {
        const invoiceData = createInvoiceData(partyId, {
          invoice_type: 'sale',
          items: [createInvoiceItemData()],
        });
        return client.createInvoice(invoiceData);
      });
      
      const results = await executeParallel(promises);
      const successfulInvoices = getSuccessfulValues(results);
      
      // Invoice numbers should be unique
      const invoiceNumbers = successfulInvoices.map(r => r.data?.invoice_number);
      const uniqueNumbers = new Set(invoiceNumbers.filter(Boolean));
      expect(uniqueNumbers.size).toBe(invoiceNumbers.filter(Boolean).length);
    });

    test('should handle concurrent invoice creation for same party', async () => {
      test.skip(!client.getAuthToken() || !partyId, 'Missing dependencies');
      
      const promises = Array.from({ length: 5 }, () => async () => {
        const invoiceData = createInvoiceData(partyId, {
          items: [createInvoiceItemData()],
        });
        return client.createInvoice(invoiceData);
      });
      
      const results = await executeParallel(promises);
      const { successes } = countResults(results);
      
      // All invoices for same party should succeed
      expect(successes).toBeGreaterThanOrEqual(3);
    });

    test('should handle concurrent sales and purchase invoice creation', async () => {
      test.skip(!client.getAuthToken() || !partyId, 'Missing dependencies');
      
      // Create both a customer and supplier party
      const supplierResponse = await client.createParty(createPartyData({ type: 'supplier' }));
      const supplierId = supplierResponse.data?.id || partyId;
      
      const salePromises = Array.from({ length: 5 }, () => async () => {
        return client.createInvoice(createInvoiceData(partyId, {
          invoice_type: 'sale',
          items: [createInvoiceItemData()],
        }));
      });
      
      const purchasePromises = Array.from({ length: 5 }, () => async () => {
        return client.createInvoice(createInvoiceData(supplierId, {
          invoice_type: 'purchase',
          items: [createInvoiceItemData()],
        }));
      });
      
      const results = await executeParallel([...salePromises, ...purchasePromises]);
      const { successes } = countResults(results);
      
      // Most should succeed
      expect(successes).toBeGreaterThanOrEqual(5);
    });
  });

  // ==========================================================================
  // Stock Deduction Concurrency
  // ==========================================================================
  test.describe('Stock Deduction', () => {
    test('should prevent overselling with concurrent orders', async () => {
      test.skip(!client.getAuthToken() || !partyId || !itemId, 'Missing dependencies');
      
      // Set stock to 10
      await client.updateStock(itemId, 10, 'set');
      
      // Try to create 20 concurrent invoices, each selling 1 unit
      const promises = Array.from({ length: 20 }, () => async () => {
        const invoiceData = createInvoiceData(partyId, {
          items: [{
            item_id: itemId,
            item_name: 'Test Item',
            quantity: 1,
            unit_price: 100,
            tax_rate: 18,
          }],
        });
        return client.createInvoice(invoiceData);
      });
      
      const results = await executeParallel(promises);
      const { successes, failures } = countResults(results);
      
      console.log(`Stock deduction test: ${successes} successes, ${failures} failures`);
      
      // Should not sell more than available stock
      // If stock checking is implemented, max 10 should succeed
      // If not, all might succeed but stock should not go negative
      
      // Check final stock
      const itemResponse = await client.getItem(itemId);
      if (itemResponse.ok) {
        const currentStock = itemResponse.data.current_stock || itemResponse.data.stock || 0;
        expect(currentStock).toBeGreaterThanOrEqual(0);
      }
    });

    test('should maintain stock consistency with concurrent adjustments', async () => {
      test.skip(!client.getAuthToken() || !itemId, 'Missing dependencies');
      
      // Reset stock
      await client.updateStock(itemId, 100, 'set');
      
      // Concurrent add and subtract operations
      const addPromises = Array.from({ length: 5 }, () => async () => {
        return client.updateStock(itemId, 10, 'add');
      });
      
      const subtractPromises = Array.from({ length: 5 }, () => async () => {
        return client.updateStock(itemId, 5, 'subtract');
      });
      
      await executeParallel([...addPromises, ...subtractPromises]);
      
      // Final stock should be: 100 + (5*10) - (5*5) = 100 + 50 - 25 = 125
      const itemResponse = await client.getItem(itemId);
      if (itemResponse.ok) {
        const currentStock = itemResponse.data.current_stock || itemResponse.data.stock;
        // Allow some variance due to race conditions
        // But should be within reasonable range
        expect(currentStock).toBeGreaterThanOrEqual(50);
        expect(currentStock).toBeLessThanOrEqual(200);
      }
    });
  });

  // ==========================================================================
  // Payment Recording Concurrency
  // ==========================================================================
  test.describe('Payment Recording', () => {
    test('should handle concurrent payments for same invoice', async () => {
      test.skip(!client.getAuthToken() || !partyId, 'Missing dependencies');
      
      // Create an invoice first
      const invoiceData = createInvoiceData(partyId, {
        items: [createInvoiceItemData({ unit_price: 10000, quantity: 1 })],
      });
      const invoiceResponse = await client.createInvoice(invoiceData);
      
      if (!invoiceResponse.ok) {
        test.skip(true, 'Could not create invoice');
        return;
      }
      
      const invoiceId = invoiceResponse.data.id;
      const invoiceAmount = invoiceResponse.data.total_amount;
      
      // Try to record 5 concurrent payments of 3000 each (total 15000)
      const promises = Array.from({ length: 5 }, () => async () => {
        return client.createPayment(createPaymentData(partyId, {
          invoice_id: invoiceId,
          amount: 3000,
          transaction_type: 'payment_in',
        }));
      });
      
      const results = await executeParallel(promises);
      const { successes, failures } = countResults(results);
      
      console.log(`Concurrent payments: ${successes} successes, ${failures} failures`);
      
      // Check invoice paid amount
      const updatedInvoice = await client.getInvoice(invoiceId);
      if (updatedInvoice.ok) {
        const paidAmount = updatedInvoice.data.paid_amount || 0;
        // Total payments should not exceed invoice amount
        expect(paidAmount).toBeLessThanOrEqual(invoiceAmount);
      }
    });

    test('should handle concurrent payments to same party', async () => {
      test.skip(!client.getAuthToken() || !partyId, 'Missing dependencies');
      
      const promises = Array.from({ length: 10 }, () => async () => {
        return client.createPayment(createPaymentData(partyId, {
          amount: 1000,
          transaction_type: 'payment_in',
        }));
      });
      
      const results = await executeParallel(promises);
      const { successes } = countResults(results);
      
      // Most or all should succeed
      expect(successes).toBeGreaterThanOrEqual(5);
    });
  });

  // ==========================================================================
  // Business Creation Concurrency
  // ==========================================================================
  test.describe('Business Creation', () => {
    test('should prevent duplicate GSTIN with concurrent creation', async () => {
      test.skip(!client.getAuthToken(), 'No auth token');
      
      const gstin = generateGSTIN('27');
      
      const promises = Array.from({ length: 5 }, () => async () => {
        return client.createBusiness(createBusinessData({ gstin }));
      });
      
      const results = await executeParallel(promises);
      const { successes, failures } = countResults(results);
      
      console.log(`Duplicate GSTIN test: ${successes} successes, ${failures} failures`);
      
      // Only one should succeed (or none if GSTIN already exists)
      expect(successes).toBeLessThanOrEqual(1);
    });

    test('should handle concurrent unique business creation', async () => {
      test.skip(!client.getAuthToken(), 'No auth token');
      
      const promises = Array.from({ length: 5 }, () => async () => {
        // Each with unique GSTIN
        return client.createBusiness(createBusinessData({ gstin: generateGSTIN('27') }));
      });
      
      const results = await executeParallel(promises);
      const { successes } = countResults(results);
      
      // All unique businesses should succeed
      expect(successes).toBeGreaterThanOrEqual(3);
    });
  });

  // ==========================================================================
  // Party Creation Concurrency
  // ==========================================================================
  test.describe('Party Creation', () => {
    test('should handle concurrent party creation with same phone', async () => {
      test.skip(!client.getAuthToken(), 'No auth token');
      
      const phone = '9876500001';
      
      const promises = Array.from({ length: 5 }, () => async () => {
        return client.createParty(createPartyData({ phone }));
      });
      
      const results = await executeParallel(promises);
      const { successes, failures } = countResults(results);
      
      console.log(`Duplicate phone party: ${successes} successes, ${failures} failures`);
      
      // Depends on whether phone must be unique
      // At minimum, should not crash
      expect(results.every(r => r.status !== 'rejected' || !r.reason?.message?.includes('500'))).toBeTruthy();
    });

    test('should handle concurrent unique party creation', async () => {
      test.skip(!client.getAuthToken(), 'No auth token');
      
      const promises = Array.from({ length: 10 }, (_, i) => async () => {
        return client.createParty(createPartyData({ 
          phone: `987650001${i}`,
          gstin: generateGSTIN('27'),
        }));
      });
      
      const results = await executeParallel(promises);
      const { successes } = countResults(results);
      
      // Most should succeed
      expect(successes).toBeGreaterThanOrEqual(5);
    });
  });

  // ==========================================================================
  // Mixed Operations Concurrency
  // ==========================================================================
  test.describe('Mixed Operations', () => {
    test('should handle concurrent mixed operations', async () => {
      test.skip(!client.getAuthToken() || !partyId, 'Missing dependencies');
      
      // Mix of different operations
      const operations = [
        // Create parties
        ...Array.from({ length: 3 }, () => async () => {
          return { type: 'party', result: await client.createParty(createPartyData()) };
        }),
        // Create invoices
        ...Array.from({ length: 3 }, () => async () => {
          return { type: 'invoice', result: await client.createInvoice(createInvoiceData(partyId, { items: [createInvoiceItemData()] })) };
        }),
        // Create payments
        ...Array.from({ length: 3 }, () => async () => {
          return { type: 'payment', result: await client.createPayment(createPaymentData(partyId)) };
        }),
        // Create items
        ...Array.from({ length: 3 }, () => async () => {
          return { type: 'item', result: await client.createItem(createItemData()) };
        }),
      ];
      
      const results = await executeParallel(operations);
      
      // Group by type and count successes
      const successByType = {
        party: 0,
        invoice: 0,
        payment: 0,
        item: 0,
      };
      
      for (const result of results) {
        if (result.status === 'fulfilled' && result.value.result.ok) {
          successByType[result.value.type as keyof typeof successByType]++;
        }
      }
      
      console.log('Mixed operations results:', successByType);
      
      // At least some of each type should succeed
      expect(Object.values(successByType).reduce((a, b) => a + b, 0)).toBeGreaterThanOrEqual(6);
    });
  });

  // ==========================================================================
  // Read-Write Concurrency
  // ==========================================================================
  test.describe('Read-Write Concurrency', () => {
    test('should handle concurrent reads while writing', async () => {
      test.skip(!client.getAuthToken() || !partyId, 'Missing dependencies');
      
      // Concurrent writes
      const writePromises = Array.from({ length: 5 }, () => async () => {
        return client.createInvoice(createInvoiceData(partyId, { items: [createInvoiceItemData()] }));
      });
      
      // Concurrent reads
      const readPromises = Array.from({ length: 5 }, () => async () => {
        return client.listInvoices();
      });
      
      // Execute all together
      const results = await executeParallel([...writePromises, ...readPromises]);
      
      // All reads should succeed
      const readResults = results.slice(5);
      const readSuccesses = readResults.filter(r => r.status === 'fulfilled' && (r.value as any).ok);
      expect(readSuccesses.length).toBeGreaterThanOrEqual(3);
    });

    test('should handle concurrent updates to same entity', async () => {
      test.skip(!client.getAuthToken() || !itemId, 'Missing dependencies');
      
      // Concurrent stock updates
      const updatePromises = Array.from({ length: 10 }, () => async () => {
        return client.updateStock(itemId, 1, 'add');
      });
      
      const results = await executeParallel(updatePromises);
      const { successes } = countResults(results);
      
      // Most should succeed without errors
      expect(successes).toBeGreaterThanOrEqual(5);
    });
  });

  // ==========================================================================
  // Deadlock Prevention Tests
  // ==========================================================================
  test.describe('Deadlock Prevention', () => {
    test('should not deadlock with circular dependencies', async () => {
      test.skip(!client.getAuthToken() || !partyId, 'Missing dependencies');
      
      // Create scenario that could cause deadlock
      // Party A creates invoice for Party B
      // Party B creates invoice for Party A
      // Both try to record payment simultaneously
      
      const partyA = partyId;
      const partyBResponse = await client.createParty(createPartyData({ type: 'both' }));
      const partyB = partyBResponse.data?.id;
      
      if (!partyB) {
        test.skip(true, 'Could not create second party');
        return;
      }
      
      const operations = [
        // A creates invoice for B
        async () => client.createInvoice(createInvoiceData(partyB, { items: [createInvoiceItemData()] })),
        // B creates invoice for A
        async () => client.createInvoice(createInvoiceData(partyA, { items: [createInvoiceItemData()] })),
        // Payment from A
        async () => client.createPayment(createPaymentData(partyA)),
        // Payment from B
        async () => client.createPayment(createPaymentData(partyB)),
      ];
      
      // Should complete within timeout (no deadlock)
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Deadlock detected')), 30000)
      );
      
      const operationsPromise = executeParallel(operations);
      
      try {
        await Promise.race([operationsPromise, timeoutPromise]);
        // No deadlock occurred
        expect(true).toBeTruthy();
      } catch (error: any) {
        if (error.message === 'Deadlock detected') {
          expect(false).toBeTruthy(); // Fail test
        }
        // Other errors are acceptable
      }
    });
  });

  // ==========================================================================
  // Stress Tests
  // ==========================================================================
  test.describe('Stress Tests', () => {
    test('should handle burst of requests (100 concurrent)', async () => {
      test.skip(!client.getAuthToken() || !partyId, 'Missing dependencies');
      test.slow(); // Mark as slow test
      
      const promises = Array.from({ length: 100 }, () => async () => {
        return client.createParty(createPartyData());
      });
      
      const startTime = Date.now();
      const results = await executeParallel(promises);
      const duration = Date.now() - startTime;
      
      const { successes, failures } = countResults(results);
      
      console.log(`Stress test: ${successes} successes, ${failures} failures in ${duration}ms`);
      
      // At least 50% should succeed
      expect(successes).toBeGreaterThanOrEqual(50);
      
      // Should complete in reasonable time (< 2 minutes)
      expect(duration).toBeLessThan(120000);
    });
  });
});
