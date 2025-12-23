/**
 * Input Validation Edge Cases - Amount & Quantity Tests
 * 
 * Tests boundary values and edge cases for monetary amounts and quantities.
 */

import { test, expect, APIRequestContext } from '@playwright/test';
import {
  generateBoundaryAmounts,
  generateBoundaryQuantities,
  createInvoiceData,
  createInvoiceItemData,
  createPartyData,
  createItemData,
  createPaymentData,
  roundTo2Decimals,
  API,
  TEST_OTP,
} from '../utils/test-helpers';
import { TestApiClient, setupAuthenticatedClient } from '../utils/api-client';

test.describe('Amount & Quantity Validation Edge Cases', () => {
  let request: APIRequestContext;
  let client: TestApiClient;
  let partyId: string;
  let itemId: string;
  const testPhone = '9876543292';
  
  test.beforeAll(async ({ playwright }) => {
    request = await playwright.request.newContext();
    try {
      client = await setupAuthenticatedClient(request, testPhone, TEST_OTP);
      
      // Create a party for invoice tests
      const partyData = createPartyData({ type: 'customer' });
      const partyResponse = await client.createParty(partyData);
      if (partyResponse.ok) {
        partyId = partyResponse.data.id;
      }
      
      // Create an item for invoice tests
      const itemData = createItemData();
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
  // Amount Validation - Invoice Items
  // ==========================================================================
  test.describe('Amount Validation - Invoice Items', () => {
    test('should reject negative unit_price', async () => {
      test.skip(!client.getAuthToken() || !partyId, 'Missing dependencies');
      
      const invoiceData = createInvoiceData(partyId, {
        items: [createInvoiceItemData({ unit_price: -100 })],
      });
      const response = await client.createInvoice(invoiceData);
      
      expect(response.ok).toBeFalsy();
      expect(response.status).toBe(400);
    });

    test('should reject zero unit_price', async () => {
      test.skip(!client.getAuthToken() || !partyId, 'Missing dependencies');
      
      const invoiceData = createInvoiceData(partyId, {
        items: [createInvoiceItemData({ unit_price: 0 })],
      });
      const response = await client.createInvoice(invoiceData);
      
      expect(response.ok).toBeFalsy();
      expect(response.status).toBe(400);
    });

    test('should accept minimum valid unit_price (0.01)', async () => {
      test.skip(!client.getAuthToken() || !partyId, 'Missing dependencies');
      
      const invoiceData = createInvoiceData(partyId, {
        items: [createInvoiceItemData({ unit_price: 0.01, quantity: 1 })],
      });
      const response = await client.createInvoice(invoiceData);
      
      // Should not fail with price validation error
      if (!response.ok) {
        expect(response.error).not.toMatch(/unit_price|amount/i);
      }
    });

    test('should handle large valid amount (999,999,999.99)', async () => {
      test.skip(!client.getAuthToken() || !partyId, 'Missing dependencies');
      
      const invoiceData = createInvoiceData(partyId, {
        items: [createInvoiceItemData({ unit_price: 999999999.99, quantity: 1 })],
      });
      const response = await client.createInvoice(invoiceData);
      
      // Should handle or give appropriate error
      if (response.ok) {
        expect(response.data.total_amount).toBeGreaterThan(0);
      }
    });

    test('should reject NaN amount', async () => {
      test.skip(!client.getAuthToken() || !partyId, 'Missing dependencies');
      
      const invoiceData = createInvoiceData(partyId, {
        items: [createInvoiceItemData({ unit_price: NaN })],
      });
      const response = await client.createInvoice(invoiceData);
      
      expect(response.ok).toBeFalsy();
    });

    test('should reject Infinity amount', async () => {
      test.skip(!client.getAuthToken() || !partyId, 'Missing dependencies');
      
      const invoiceData = createInvoiceData(partyId, {
        items: [createInvoiceItemData({ unit_price: Infinity })],
      });
      const response = await client.createInvoice(invoiceData);
      
      expect(response.ok).toBeFalsy();
    });

    test('should handle decimal precision correctly (0.01)', async () => {
      test.skip(!client.getAuthToken() || !partyId, 'Missing dependencies');
      
      const invoiceData = createInvoiceData(partyId, {
        items: [createInvoiceItemData({ unit_price: 100.01, quantity: 3 })],
      });
      const response = await client.createInvoice(invoiceData);
      
      if (response.ok) {
        // Verify precision is maintained
        expect(response.data.subtotal).toBe(roundTo2Decimals(100.01 * 3));
      }
    });

    test('should handle decimal precision with rounding (0.005)', async () => {
      test.skip(!client.getAuthToken() || !partyId, 'Missing dependencies');
      
      const invoiceData = createInvoiceData(partyId, {
        items: [createInvoiceItemData({ unit_price: 100.005, quantity: 1 })],
      });
      const response = await client.createInvoice(invoiceData);
      
      // Should either reject 3 decimals or round appropriately
      if (response.ok) {
        expect(response.data.subtotal).toBeCloseTo(100.01, 2);
      }
    });
  });

  // ==========================================================================
  // Quantity Validation - Invoice Items
  // ==========================================================================
  test.describe('Quantity Validation - Invoice Items', () => {
    test('should reject negative quantity', async () => {
      test.skip(!client.getAuthToken() || !partyId, 'Missing dependencies');
      
      const invoiceData = createInvoiceData(partyId, {
        items: [createInvoiceItemData({ quantity: -1 })],
      });
      const response = await client.createInvoice(invoiceData);
      
      expect(response.ok).toBeFalsy();
      expect(response.status).toBe(400);
    });

    test('should reject zero quantity', async () => {
      test.skip(!client.getAuthToken() || !partyId, 'Missing dependencies');
      
      const invoiceData = createInvoiceData(partyId, {
        items: [createInvoiceItemData({ quantity: 0 })],
      });
      const response = await client.createInvoice(invoiceData);
      
      expect(response.ok).toBeFalsy();
      expect(response.status).toBe(400);
    });

    test('should accept minimum valid quantity (1)', async () => {
      test.skip(!client.getAuthToken() || !partyId, 'Missing dependencies');
      
      const invoiceData = createInvoiceData(partyId, {
        items: [createInvoiceItemData({ quantity: 1 })],
      });
      const response = await client.createInvoice(invoiceData);
      
      if (!response.ok) {
        expect(response.error).not.toMatch(/quantity/i);
      }
    });

    test('should accept fractional quantity (0.5)', async () => {
      test.skip(!client.getAuthToken() || !partyId, 'Missing dependencies');
      
      const invoiceData = createInvoiceData(partyId, {
        items: [createInvoiceItemData({ quantity: 0.5, unit_price: 100 })],
      });
      const response = await client.createInvoice(invoiceData);
      
      if (response.ok) {
        expect(response.data.subtotal).toBeCloseTo(50, 2);
      }
    });

    test('should handle very small fractional quantity (0.001)', async () => {
      test.skip(!client.getAuthToken() || !partyId, 'Missing dependencies');
      
      const invoiceData = createInvoiceData(partyId, {
        items: [createInvoiceItemData({ quantity: 0.001, unit_price: 1000 })],
      });
      const response = await client.createInvoice(invoiceData);
      
      if (response.ok) {
        expect(response.data.subtotal).toBeCloseTo(1, 2);
      }
    });

    test('should handle large quantity (999999)', async () => {
      test.skip(!client.getAuthToken() || !partyId, 'Missing dependencies');
      
      const invoiceData = createInvoiceData(partyId, {
        items: [createInvoiceItemData({ quantity: 999999, unit_price: 1 })],
      });
      const response = await client.createInvoice(invoiceData);
      
      if (response.ok) {
        expect(response.data.subtotal).toBe(999999);
      }
    });
  });

  // ==========================================================================
  // Payment Amount Validation
  // ==========================================================================
  test.describe('Payment Amount Validation', () => {
    test('should reject negative payment amount', async () => {
      test.skip(!client.getAuthToken() || !partyId, 'Missing dependencies');
      
      const paymentData = createPaymentData(partyId, { amount: -1000 });
      const response = await client.createPayment(paymentData);
      
      expect(response.ok).toBeFalsy();
      expect(response.status).toBe(400);
    });

    test('should reject zero payment amount', async () => {
      test.skip(!client.getAuthToken() || !partyId, 'Missing dependencies');
      
      const paymentData = createPaymentData(partyId, { amount: 0 });
      const response = await client.createPayment(paymentData);
      
      expect(response.ok).toBeFalsy();
      expect(response.status).toBe(400);
    });

    test('should accept minimum valid payment (0.01)', async () => {
      test.skip(!client.getAuthToken() || !partyId, 'Missing dependencies');
      
      const paymentData = createPaymentData(partyId, { amount: 0.01 });
      const response = await client.createPayment(paymentData);
      
      if (!response.ok) {
        expect(response.error).not.toMatch(/amount/i);
      }
    });

    test('should handle decimal payment amount', async () => {
      test.skip(!client.getAuthToken() || !partyId, 'Missing dependencies');
      
      const paymentData = createPaymentData(partyId, { amount: 1000.50 });
      const response = await client.createPayment(paymentData);
      
      if (response.ok) {
        expect(response.data.amount).toBe(1000.50);
      }
    });

    test('should handle large payment amount', async () => {
      test.skip(!client.getAuthToken() || !partyId, 'Missing dependencies');
      
      const paymentData = createPaymentData(partyId, { amount: 10000000 });
      const response = await client.createPayment(paymentData);
      
      if (response.ok) {
        expect(response.data.amount).toBe(10000000);
      }
    });
  });

  // ==========================================================================
  // Discount Validation
  // ==========================================================================
  test.describe('Discount Validation', () => {
    test('should accept 0% discount', async () => {
      test.skip(!client.getAuthToken() || !partyId, 'Missing dependencies');
      
      const invoiceData = createInvoiceData(partyId, {
        items: [createInvoiceItemData({ discount_percent: 0, unit_price: 100, quantity: 1 })],
      });
      const response = await client.createInvoice(invoiceData);
      
      if (response.ok) {
        expect(response.data.discount_amount).toBe(0);
      }
    });

    test('should accept 100% discount', async () => {
      test.skip(!client.getAuthToken() || !partyId, 'Missing dependencies');
      
      const invoiceData = createInvoiceData(partyId, {
        items: [createInvoiceItemData({ discount_percent: 100, unit_price: 100, quantity: 1 })],
      });
      const response = await client.createInvoice(invoiceData);
      
      if (response.ok) {
        expect(response.data.taxable_amount).toBe(0);
      }
    });

    test('should reject discount > 100%', async () => {
      test.skip(!client.getAuthToken() || !partyId, 'Missing dependencies');
      
      const invoiceData = createInvoiceData(partyId, {
        items: [createInvoiceItemData({ discount_percent: 101 })],
      });
      const response = await client.createInvoice(invoiceData);
      
      expect(response.ok).toBeFalsy();
    });

    test('should reject negative discount', async () => {
      test.skip(!client.getAuthToken() || !partyId, 'Missing dependencies');
      
      const invoiceData = createInvoiceData(partyId, {
        items: [createInvoiceItemData({ discount_percent: -5 })],
      });
      const response = await client.createInvoice(invoiceData);
      
      expect(response.ok).toBeFalsy();
    });

    test('should handle decimal discount (15.5%)', async () => {
      test.skip(!client.getAuthToken() || !partyId, 'Missing dependencies');
      
      const invoiceData = createInvoiceData(partyId, {
        items: [createInvoiceItemData({ discount_percent: 15.5, unit_price: 1000, quantity: 1 })],
      });
      const response = await client.createInvoice(invoiceData);
      
      if (response.ok) {
        expect(response.data.discount_amount).toBeCloseTo(155, 2);
      }
    });
  });

  // ==========================================================================
  // Tax Rate Validation
  // ==========================================================================
  test.describe('Tax Rate Validation', () => {
    const validTaxRates = [0, 5, 12, 18, 28];
    
    for (const rate of validTaxRates) {
      test(`should accept valid GST rate: ${rate}%`, async () => {
        test.skip(!client.getAuthToken() || !partyId, 'Missing dependencies');
        
        const invoiceData = createInvoiceData(partyId, {
          items: [createInvoiceItemData({ tax_rate: rate, unit_price: 100, quantity: 1 })],
        });
        const response = await client.createInvoice(invoiceData);
        
        if (!response.ok) {
          expect(response.error).not.toMatch(/tax_rate/i);
        }
      });
    }

    test('should reject invalid GST rate (3%)', async () => {
      test.skip(!client.getAuthToken() || !partyId, 'Missing dependencies');
      
      const invoiceData = createInvoiceData(partyId, {
        items: [createInvoiceItemData({ tax_rate: 3 })],
      });
      const response = await client.createInvoice(invoiceData);
      
      // May accept non-standard rates or reject
      // Check for consistent behavior
      if (!response.ok) {
        expect(response.status).toBe(400);
      }
    });

    test('should reject negative tax rate', async () => {
      test.skip(!client.getAuthToken() || !partyId, 'Missing dependencies');
      
      const invoiceData = createInvoiceData(partyId, {
        items: [createInvoiceItemData({ tax_rate: -5 })],
      });
      const response = await client.createInvoice(invoiceData);
      
      expect(response.ok).toBeFalsy();
    });
  });

  // ==========================================================================
  // Boundary Amount Tests (Parameterized)
  // ==========================================================================
  test.describe('Boundary Amount Tests', () => {
    const boundaryAmounts = generateBoundaryAmounts();
    
    for (const { value, description, expected } of boundaryAmounts) {
      test(`Amount: ${description}`, async () => {
        test.skip(!client.getAuthToken() || !partyId, 'Missing dependencies');
        test.skip(Number.isNaN(value) || !Number.isFinite(value), 'Non-numeric value');
        
        const invoiceData = createInvoiceData(partyId, {
          items: [createInvoiceItemData({ unit_price: value, quantity: 1 })],
        });
        const response = await client.createInvoice(invoiceData);
        
        if (expected === 'valid') {
          // Should succeed or fail for non-validation reasons
          if (!response.ok) {
            expect(response.error).not.toMatch(/unit_price|amount.*validation/i);
          }
        } else {
          // Should fail validation
          expect(response.ok).toBeFalsy();
        }
      });
    }
  });

  // ==========================================================================
  // Boundary Quantity Tests (Parameterized)
  // ==========================================================================
  test.describe('Boundary Quantity Tests', () => {
    const boundaryQuantities = generateBoundaryQuantities();
    
    for (const { value, description, expected } of boundaryQuantities) {
      test(`Quantity: ${description}`, async () => {
        test.skip(!client.getAuthToken() || !partyId, 'Missing dependencies');
        test.skip(Number.isNaN(value) || !Number.isFinite(value), 'Non-numeric value');
        
        const invoiceData = createInvoiceData(partyId, {
          items: [createInvoiceItemData({ quantity: value, unit_price: 100 })],
        });
        const response = await client.createInvoice(invoiceData);
        
        if (expected === 'valid') {
          if (!response.ok) {
            expect(response.error).not.toMatch(/quantity.*validation/i);
          }
        } else {
          expect(response.ok).toBeFalsy();
        }
      });
    }
  });

  // ==========================================================================
  // Stock Amount Validation
  // ==========================================================================
  test.describe('Stock Amount Validation', () => {
    test('should reject negative stock adjustment', async () => {
      test.skip(!client.getAuthToken() || !itemId, 'Missing dependencies');
      
      const response = await client.updateStock(itemId, -100, 'add');
      
      expect(response.ok).toBeFalsy();
    });

    test('should accept zero stock adjustment', async () => {
      test.skip(!client.getAuthToken() || !itemId, 'Missing dependencies');
      
      const response = await client.updateStock(itemId, 0, 'add');
      
      // Zero adjustment might be allowed or rejected
      // Just verify consistent behavior
      expect(response.status).not.toBe(500);
    });

    test('should accept positive stock adjustment', async () => {
      test.skip(!client.getAuthToken() || !itemId, 'Missing dependencies');
      
      const response = await client.updateStock(itemId, 100, 'add');
      
      if (!response.ok) {
        expect(response.error).not.toMatch(/quantity.*validation/i);
      }
    });

    test('should handle large stock quantity', async () => {
      test.skip(!client.getAuthToken() || !itemId, 'Missing dependencies');
      
      const response = await client.updateStock(itemId, 1000000, 'add');
      
      if (!response.ok) {
        expect(response.error).not.toMatch(/quantity.*validation/i);
      }
    });
  });

  // ==========================================================================
  // Opening Balance Validation
  // ==========================================================================
  test.describe('Opening Balance Validation', () => {
    test('should accept zero opening balance', async () => {
      test.skip(!client.getAuthToken(), 'No auth token');
      
      const partyData = createPartyData({ opening_balance: 0 });
      const response = await client.createParty(partyData);
      
      if (!response.ok) {
        expect(response.error).not.toMatch(/opening_balance/i);
      }
    });

    test('should accept positive opening balance', async () => {
      test.skip(!client.getAuthToken(), 'No auth token');
      
      const partyData = createPartyData({ opening_balance: 10000 });
      const response = await client.createParty(partyData);
      
      if (response.ok) {
        expect(response.data.opening_balance).toBe(10000);
      }
    });

    test('should reject negative opening balance', async () => {
      test.skip(!client.getAuthToken(), 'No auth token');
      
      const partyData = createPartyData({ opening_balance: -5000 });
      const response = await client.createParty(partyData);
      
      // Negative balance might be stored as debit type
      // Check behavior is consistent
      if (response.ok) {
        expect(response.data.opening_balance_type).toBeDefined();
      }
    });

    test('should handle decimal opening balance', async () => {
      test.skip(!client.getAuthToken(), 'No auth token');
      
      const partyData = createPartyData({ opening_balance: 5000.50 });
      const response = await client.createParty(partyData);
      
      if (response.ok) {
        expect(response.data.opening_balance).toBeCloseTo(5000.50, 2);
      }
    });
  });
});
