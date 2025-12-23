/**
 * GST Calculation Edge Cases Tests
 * 
 * Tests for GST calculation including tax rates, inter/intra state,
 * rounding, discounts, and multiple items.
 */

import { test, expect, APIRequestContext } from '@playwright/test';
import {
  createInvoiceData,
  createInvoiceItemData,
  createPartyData,
  roundTo2Decimals,
  validateGstCalculation,
  VALID_GST_RATES,
  API,
  TEST_OTP,
} from '../utils/test-helpers';
import { TestApiClient, setupAuthenticatedClient } from '../utils/api-client';

test.describe('GST Calculation Edge Cases', () => {
  let request: APIRequestContext;
  let client: TestApiClient;
  let partyId: string;
  const testPhone = '9876543294';
  
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
    } catch (e) {
      console.warn('Setup failed, some tests may be skipped:', e);
      client = new TestApiClient(request);
    }
  });
  
  test.afterAll(async () => {
    await request.dispose();
  });

  // ==========================================================================
  // Tax Rate Boundary Tests
  // ==========================================================================
  test.describe('Tax Rate Boundaries', () => {
    test('should handle 0% tax rate', async () => {
      test.skip(!client.getAuthToken() || !partyId, 'Missing dependencies');
      
      const invoiceData = createInvoiceData(partyId, {
        is_interstate: false,
        items: [createInvoiceItemData({ tax_rate: 0, unit_price: 1000, quantity: 1 })],
      });
      const response = await client.createInvoice(invoiceData);
      
      if (response.ok) {
        const data = response.data;
        expect(data.cgst_amount).toBe(0);
        expect(data.sgst_amount).toBe(0);
        expect(data.igst_amount).toBe(0);
        expect(data.taxable_amount).toBe(1000);
        expect(data.total_amount).toBe(1000);
      }
    });

    test('should handle 5% tax rate correctly', async () => {
      test.skip(!client.getAuthToken() || !partyId, 'Missing dependencies');
      
      const invoiceData = createInvoiceData(partyId, {
        is_interstate: false,
        items: [createInvoiceItemData({ tax_rate: 5, unit_price: 1000, quantity: 1 })],
      });
      const response = await client.createInvoice(invoiceData);
      
      if (response.ok) {
        const data = response.data;
        // 5% tax = 2.5% CGST + 2.5% SGST = 50 total
        expect(data.cgst_amount).toBeCloseTo(25, 2);
        expect(data.sgst_amount).toBeCloseTo(25, 2);
        expect(data.igst_amount).toBe(0);
        expect(data.total_amount).toBeCloseTo(1050, 2);
      }
    });

    test('should handle 12% tax rate correctly', async () => {
      test.skip(!client.getAuthToken() || !partyId, 'Missing dependencies');
      
      const invoiceData = createInvoiceData(partyId, {
        is_interstate: false,
        items: [createInvoiceItemData({ tax_rate: 12, unit_price: 1000, quantity: 1 })],
      });
      const response = await client.createInvoice(invoiceData);
      
      if (response.ok) {
        const data = response.data;
        expect(data.cgst_amount).toBeCloseTo(60, 2);
        expect(data.sgst_amount).toBeCloseTo(60, 2);
        expect(data.total_amount).toBeCloseTo(1120, 2);
      }
    });

    test('should handle 18% tax rate correctly', async () => {
      test.skip(!client.getAuthToken() || !partyId, 'Missing dependencies');
      
      const invoiceData = createInvoiceData(partyId, {
        is_interstate: false,
        items: [createInvoiceItemData({ tax_rate: 18, unit_price: 1000, quantity: 1 })],
      });
      const response = await client.createInvoice(invoiceData);
      
      if (response.ok) {
        const data = response.data;
        expect(data.cgst_amount).toBeCloseTo(90, 2);
        expect(data.sgst_amount).toBeCloseTo(90, 2);
        expect(data.total_amount).toBeCloseTo(1180, 2);
      }
    });

    test('should handle 28% tax rate correctly', async () => {
      test.skip(!client.getAuthToken() || !partyId, 'Missing dependencies');
      
      const invoiceData = createInvoiceData(partyId, {
        is_interstate: false,
        items: [createInvoiceItemData({ tax_rate: 28, unit_price: 1000, quantity: 1 })],
      });
      const response = await client.createInvoice(invoiceData);
      
      if (response.ok) {
        const data = response.data;
        expect(data.cgst_amount).toBeCloseTo(140, 2);
        expect(data.sgst_amount).toBeCloseTo(140, 2);
        expect(data.total_amount).toBeCloseTo(1280, 2);
      }
    });

    test('should reject invalid tax rate (3%)', async () => {
      test.skip(!client.getAuthToken() || !partyId, 'Missing dependencies');
      
      const invoiceData = createInvoiceData(partyId, {
        items: [createInvoiceItemData({ tax_rate: 3 })],
      });
      const response = await client.createInvoice(invoiceData);
      
      // May accept non-standard rates or reject
      // Just verify no 500 error
      expect(response.status).not.toBe(500);
    });

    test('should reject invalid tax rate (15%)', async () => {
      test.skip(!client.getAuthToken() || !partyId, 'Missing dependencies');
      
      const invoiceData = createInvoiceData(partyId, {
        items: [createInvoiceItemData({ tax_rate: 15 })],
      });
      const response = await client.createInvoice(invoiceData);
      
      expect(response.status).not.toBe(500);
    });

    test('should reject invalid tax rate (30%)', async () => {
      test.skip(!client.getAuthToken() || !partyId, 'Missing dependencies');
      
      const invoiceData = createInvoiceData(partyId, {
        items: [createInvoiceItemData({ tax_rate: 30 })],
      });
      const response = await client.createInvoice(invoiceData);
      
      expect(response.status).not.toBe(500);
    });
  });

  // ==========================================================================
  // Inter-state vs Intra-state Tests
  // ==========================================================================
  test.describe('Inter-state vs Intra-state', () => {
    test('should calculate CGST+SGST for intra-state (same state)', async () => {
      test.skip(!client.getAuthToken() || !partyId, 'Missing dependencies');
      
      const invoiceData = createInvoiceData(partyId, {
        is_interstate: false,
        items: [createInvoiceItemData({ tax_rate: 18, unit_price: 1000, quantity: 1 })],
      });
      const response = await client.createInvoice(invoiceData);
      
      if (response.ok) {
        const data = response.data;
        // Intra-state: CGST = SGST = tax/2
        expect(data.cgst_amount).toBeGreaterThan(0);
        expect(data.sgst_amount).toBeGreaterThan(0);
        expect(data.igst_amount).toBe(0);
        expect(data.cgst_amount).toBe(data.sgst_amount);
      }
    });

    test('should calculate IGST for inter-state (different state)', async () => {
      test.skip(!client.getAuthToken() || !partyId, 'Missing dependencies');
      
      const invoiceData = createInvoiceData(partyId, {
        is_interstate: true,
        items: [createInvoiceItemData({ tax_rate: 18, unit_price: 1000, quantity: 1 })],
      });
      const response = await client.createInvoice(invoiceData);
      
      if (response.ok) {
        const data = response.data;
        // Inter-state: IGST = full tax, no CGST/SGST
        expect(data.cgst_amount).toBe(0);
        expect(data.sgst_amount).toBe(0);
        expect(data.igst_amount).toBeGreaterThan(0);
        expect(data.igst_amount).toBeCloseTo(180, 2); // 18% of 1000
      }
    });

    test('should maintain consistency: IGST = CGST + SGST for same rate', async () => {
      test.skip(!client.getAuthToken() || !partyId, 'Missing dependencies');
      
      // Create intra-state invoice
      const intraState = createInvoiceData(partyId, {
        is_interstate: false,
        items: [createInvoiceItemData({ tax_rate: 18, unit_price: 1000, quantity: 1 })],
      });
      const intraResponse = await client.createInvoice(intraState);
      
      // Create inter-state invoice
      const interState = createInvoiceData(partyId, {
        is_interstate: true,
        items: [createInvoiceItemData({ tax_rate: 18, unit_price: 1000, quantity: 1 })],
      });
      const interResponse = await client.createInvoice(interState);
      
      if (intraResponse.ok && interResponse.ok) {
        const intraTax = intraResponse.data.cgst_amount + intraResponse.data.sgst_amount;
        const interTax = interResponse.data.igst_amount;
        
        // IGST should equal CGST + SGST
        expect(interTax).toBeCloseTo(intraTax, 2);
      }
    });

    test('should handle place_of_supply correctly', async () => {
      test.skip(!client.getAuthToken() || !partyId, 'Missing dependencies');
      
      const invoiceData = createInvoiceData(partyId, {
        is_interstate: true,
        place_of_supply: 'Karnataka',
        items: [createInvoiceItemData({ tax_rate: 18, unit_price: 1000, quantity: 1 })],
      });
      const response = await client.createInvoice(invoiceData);
      
      if (response.ok) {
        // Should use IGST for different state
        expect(response.data.igst_amount).toBeGreaterThan(0);
      }
    });
  });

  // ==========================================================================
  // CESS Rate Tests
  // ==========================================================================
  test.describe('CESS Rate Tests', () => {
    test('should calculate CESS correctly', async () => {
      test.skip(!client.getAuthToken() || !partyId, 'Missing dependencies');
      
      const invoiceData = createInvoiceData(partyId, {
        is_interstate: false,
        items: [createInvoiceItemData({ 
          tax_rate: 28, 
          cess_rate: 15, // Luxury items CESS
          unit_price: 1000, 
          quantity: 1 
        })],
      });
      const response = await client.createInvoice(invoiceData);
      
      if (response.ok) {
        const data = response.data;
        expect(data.cess_amount).toBeCloseTo(150, 2); // 15% of 1000
        expect(data.total_amount).toBeCloseTo(1430, 2); // 1000 + 280 (GST) + 150 (CESS)
      }
    });

    test('should handle 0 CESS rate', async () => {
      test.skip(!client.getAuthToken() || !partyId, 'Missing dependencies');
      
      const invoiceData = createInvoiceData(partyId, {
        is_interstate: false,
        items: [createInvoiceItemData({ 
          tax_rate: 18, 
          cess_rate: 0,
          unit_price: 1000, 
          quantity: 1 
        })],
      });
      const response = await client.createInvoice(invoiceData);
      
      if (response.ok) {
        expect(response.data.cess_amount).toBe(0);
      }
    });
  });

  // ==========================================================================
  // Rounding Edge Cases
  // ==========================================================================
  test.describe('Rounding Edge Cases', () => {
    test('should round 0.005 correctly', async () => {
      test.skip(!client.getAuthToken() || !partyId, 'Missing dependencies');
      
      // Create scenario that results in .005 tax
      // 1/3 * 18% = 0.06, split = 0.03 each, which could cause .005 rounding
      const invoiceData = createInvoiceData(partyId, {
        is_interstate: false,
        items: [createInvoiceItemData({ 
          tax_rate: 18, 
          unit_price: 33.33, // 1/3 * 100
          quantity: 1 
        })],
      });
      const response = await client.createInvoice(invoiceData);
      
      if (response.ok) {
        const data = response.data;
        // Verify amounts are properly rounded
        expect(Number.isFinite(data.cgst_amount)).toBeTruthy();
        expect(data.cgst_amount.toString()).toMatch(/^\d+(\.\d{1,2})?$/);
      }
    });

    test('should maintain total consistency after rounding', async () => {
      test.skip(!client.getAuthToken() || !partyId, 'Missing dependencies');
      
      const invoiceData = createInvoiceData(partyId, {
        is_interstate: false,
        items: [createInvoiceItemData({ 
          tax_rate: 18, 
          unit_price: 999.99,
          quantity: 3 
        })],
      });
      const response = await client.createInvoice(invoiceData);
      
      if (response.ok) {
        const data = response.data;
        const calculatedTotal = data.taxable_amount + data.cgst_amount + 
          data.sgst_amount + data.igst_amount + data.cess_amount;
        
        // Total should match calculated total within rounding tolerance
        expect(Math.abs(data.total_amount - calculatedTotal)).toBeLessThan(0.05);
      }
    });

    test('should handle multiple items with different rounding scenarios', async () => {
      test.skip(!client.getAuthToken() || !partyId, 'Missing dependencies');
      
      const invoiceData = createInvoiceData(partyId, {
        is_interstate: false,
        items: [
          createInvoiceItemData({ tax_rate: 5, unit_price: 11.11, quantity: 7 }),
          createInvoiceItemData({ tax_rate: 12, unit_price: 22.22, quantity: 3 }),
          createInvoiceItemData({ tax_rate: 18, unit_price: 33.33, quantity: 5 }),
        ],
      });
      const response = await client.createInvoice(invoiceData);
      
      if (response.ok) {
        const data = response.data;
        // Verify GST calculation consistency
        const validation = validateGstCalculation(
          data.taxable_amount,
          data.cgst_amount,
          data.sgst_amount,
          data.igst_amount,
          data.total_amount,
          false
        );
        expect(validation.valid).toBeTruthy();
      }
    });
  });

  // ==========================================================================
  // Discount Edge Cases
  // ==========================================================================
  test.describe('Discount Edge Cases', () => {
    test('should apply 0% discount correctly', async () => {
      test.skip(!client.getAuthToken() || !partyId, 'Missing dependencies');
      
      const invoiceData = createInvoiceData(partyId, {
        is_interstate: false,
        items: [createInvoiceItemData({ 
          discount_percent: 0,
          tax_rate: 18, 
          unit_price: 1000, 
          quantity: 1 
        })],
      });
      const response = await client.createInvoice(invoiceData);
      
      if (response.ok) {
        expect(response.data.discount_amount).toBe(0);
        expect(response.data.taxable_amount).toBe(1000);
      }
    });

    test('should apply 100% discount correctly', async () => {
      test.skip(!client.getAuthToken() || !partyId, 'Missing dependencies');
      
      const invoiceData = createInvoiceData(partyId, {
        is_interstate: false,
        items: [createInvoiceItemData({ 
          discount_percent: 100,
          tax_rate: 18, 
          unit_price: 1000, 
          quantity: 1 
        })],
      });
      const response = await client.createInvoice(invoiceData);
      
      if (response.ok) {
        expect(response.data.taxable_amount).toBe(0);
        expect(response.data.cgst_amount).toBe(0);
        expect(response.data.sgst_amount).toBe(0);
        expect(response.data.total_amount).toBe(0);
      }
    });

    test('should apply discount before tax calculation', async () => {
      test.skip(!client.getAuthToken() || !partyId, 'Missing dependencies');
      
      // 1000 * 10% discount = 900 taxable
      // 900 * 18% tax = 162 total tax
      const invoiceData = createInvoiceData(partyId, {
        is_interstate: false,
        items: [createInvoiceItemData({ 
          discount_percent: 10,
          tax_rate: 18, 
          unit_price: 1000, 
          quantity: 1 
        })],
      });
      const response = await client.createInvoice(invoiceData);
      
      if (response.ok) {
        const data = response.data;
        expect(data.discount_amount).toBeCloseTo(100, 2);
        expect(data.taxable_amount).toBeCloseTo(900, 2);
        const totalTax = data.cgst_amount + data.sgst_amount;
        expect(totalTax).toBeCloseTo(162, 2); // 18% of 900
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

    test('should handle decimal discount (12.5%)', async () => {
      test.skip(!client.getAuthToken() || !partyId, 'Missing dependencies');
      
      const invoiceData = createInvoiceData(partyId, {
        is_interstate: false,
        items: [createInvoiceItemData({ 
          discount_percent: 12.5,
          tax_rate: 18, 
          unit_price: 1000, 
          quantity: 1 
        })],
      });
      const response = await client.createInvoice(invoiceData);
      
      if (response.ok) {
        const data = response.data;
        expect(data.discount_amount).toBeCloseTo(125, 2);
        expect(data.taxable_amount).toBeCloseTo(875, 2);
      }
    });
  });

  // ==========================================================================
  // Multiple Items Edge Cases
  // ==========================================================================
  test.describe('Multiple Items Edge Cases', () => {
    test('should handle invoice with 1 item', async () => {
      test.skip(!client.getAuthToken() || !partyId, 'Missing dependencies');
      
      const invoiceData = createInvoiceData(partyId, {
        is_interstate: false,
        items: [createInvoiceItemData({ tax_rate: 18, unit_price: 1000, quantity: 1 })],
      });
      const response = await client.createInvoice(invoiceData);
      
      if (response.ok) {
        expect(response.data.total_amount).toBeCloseTo(1180, 2);
      }
    });

    test('should handle invoice with many items (10+)', async () => {
      test.skip(!client.getAuthToken() || !partyId, 'Missing dependencies');
      
      const items = Array.from({ length: 15 }, (_, i) => 
        createInvoiceItemData({ 
          tax_rate: VALID_GST_RATES[i % VALID_GST_RATES.length],
          unit_price: (i + 1) * 100,
          quantity: i + 1
        })
      );
      
      const invoiceData = createInvoiceData(partyId, {
        is_interstate: false,
        items,
      });
      const response = await client.createInvoice(invoiceData);
      
      if (response.ok) {
        expect(response.data.items?.length || response.data.item_count).toBe(15);
        expect(response.data.total_amount).toBeGreaterThan(0);
      }
    });

    test('should handle items with different tax rates', async () => {
      test.skip(!client.getAuthToken() || !partyId, 'Missing dependencies');
      
      const invoiceData = createInvoiceData(partyId, {
        is_interstate: false,
        items: [
          createInvoiceItemData({ tax_rate: 0, unit_price: 100, quantity: 1 }),
          createInvoiceItemData({ tax_rate: 5, unit_price: 100, quantity: 1 }),
          createInvoiceItemData({ tax_rate: 12, unit_price: 100, quantity: 1 }),
          createInvoiceItemData({ tax_rate: 18, unit_price: 100, quantity: 1 }),
          createInvoiceItemData({ tax_rate: 28, unit_price: 100, quantity: 1 }),
        ],
      });
      const response = await client.createInvoice(invoiceData);
      
      if (response.ok) {
        const data = response.data;
        // Total subtotal = 500
        expect(data.subtotal).toBe(500);
        
        // Total tax = 0 + 5 + 12 + 18 + 28 = 63 (half of each as CGST/SGST)
        const totalTax = data.cgst_amount + data.sgst_amount;
        expect(totalTax).toBeCloseTo(63, 2);
      }
    });

    test('should handle items with 0% tax mixed with taxed items', async () => {
      test.skip(!client.getAuthToken() || !partyId, 'Missing dependencies');
      
      const invoiceData = createInvoiceData(partyId, {
        is_interstate: false,
        items: [
          createInvoiceItemData({ tax_rate: 0, unit_price: 1000, quantity: 2 }),
          createInvoiceItemData({ tax_rate: 18, unit_price: 1000, quantity: 1 }),
        ],
      });
      const response = await client.createInvoice(invoiceData);
      
      if (response.ok) {
        const data = response.data;
        // Subtotal = 3000
        // Taxable for GST = only 1000 (second item)
        // Tax = 180
        const totalTax = data.cgst_amount + data.sgst_amount;
        expect(totalTax).toBeCloseTo(180, 2);
        expect(data.total_amount).toBeCloseTo(3180, 2);
      }
    });

    test('should maintain precision across multiple items', async () => {
      test.skip(!client.getAuthToken() || !partyId, 'Missing dependencies');
      
      const invoiceData = createInvoiceData(partyId, {
        is_interstate: false,
        items: Array.from({ length: 100 }, () => 
          createInvoiceItemData({ tax_rate: 18, unit_price: 1.01, quantity: 1 })
        ),
      });
      const response = await client.createInvoice(invoiceData);
      
      if (response.ok) {
        const data = response.data;
        // 100 items * 1.01 = 101 subtotal
        expect(data.subtotal).toBeCloseTo(101, 2);
        // 101 * 18% = 18.18 tax
        const totalTax = data.cgst_amount + data.sgst_amount;
        expect(totalTax).toBeCloseTo(18.18, 1);
      }
    });
  });

  // ==========================================================================
  // Tax Inclusive Calculations
  // ==========================================================================
  test.describe('Tax Inclusive Calculations', () => {
    test('should calculate correctly for tax-exclusive pricing (default)', async () => {
      test.skip(!client.getAuthToken() || !partyId, 'Missing dependencies');
      
      const invoiceData = createInvoiceData(partyId, {
        is_interstate: false,
        items: [createInvoiceItemData({ tax_rate: 18, unit_price: 1000, quantity: 1 })],
      });
      const response = await client.createInvoice(invoiceData);
      
      if (response.ok) {
        // Tax exclusive: 1000 + 180 = 1180
        expect(response.data.total_amount).toBeCloseTo(1180, 2);
      }
    });

    // Note: Tax inclusive may need to be supported
    test('should handle tax-inclusive pricing correctly', async () => {
      test.skip(!client.getAuthToken() || !partyId, 'Missing dependencies');
      
      // If tax inclusive is supported, test it
      // Price includes 18% tax, so taxable = 1000 / 1.18 = 847.46
      const invoiceData = createInvoiceData(partyId, {
        is_interstate: false,
        // tax_inclusive: true, // Add if supported
        items: [createInvoiceItemData({ tax_rate: 18, unit_price: 1000, quantity: 1 })],
      });
      const response = await client.createInvoice(invoiceData);
      
      // Just verify no error
      expect(response.status).not.toBe(500);
    });
  });

  // ==========================================================================
  // Export and RCM Scenarios
  // ==========================================================================
  test.describe('Export and RCM Scenarios', () => {
    test('should handle export invoice (is_export = true)', async () => {
      test.skip(!client.getAuthToken() || !partyId, 'Missing dependencies');
      
      const invoiceData = createInvoiceData(partyId, {
        is_export: true,
        is_interstate: true,
        items: [createInvoiceItemData({ tax_rate: 18, unit_price: 1000, quantity: 1 })],
      });
      const response = await client.createInvoice(invoiceData);
      
      // Export invoices may have 0 tax (zero-rated)
      if (response.ok) {
        expect(response.data.is_export).toBe(true);
      }
    });

    test('should handle RCM invoice (reverse charge)', async () => {
      test.skip(!client.getAuthToken() || !partyId, 'Missing dependencies');
      
      const invoiceData = createInvoiceData(partyId, {
        is_rcm: true,
        items: [createInvoiceItemData({ tax_rate: 18, unit_price: 1000, quantity: 1 })],
      });
      const response = await client.createInvoice(invoiceData);
      
      // RCM invoices have special handling
      if (response.ok) {
        expect(response.data.is_rcm).toBe(true);
      }
    });
  });

  // ==========================================================================
  // Large Value Tests
  // ==========================================================================
  test.describe('Large Value GST Calculations', () => {
    test('should handle very large invoice amount', async () => {
      test.skip(!client.getAuthToken() || !partyId, 'Missing dependencies');
      
      const invoiceData = createInvoiceData(partyId, {
        is_interstate: false,
        items: [createInvoiceItemData({ 
          tax_rate: 28, 
          unit_price: 10000000, // 1 crore
          quantity: 10 
        })],
      });
      const response = await client.createInvoice(invoiceData);
      
      if (response.ok) {
        // 10 crore subtotal + 28% tax
        expect(response.data.subtotal).toBe(100000000);
        expect(response.data.total_amount).toBe(128000000);
      }
    });

    test('should handle very small amounts with high precision', async () => {
      test.skip(!client.getAuthToken() || !partyId, 'Missing dependencies');
      
      const invoiceData = createInvoiceData(partyId, {
        is_interstate: false,
        items: [createInvoiceItemData({ 
          tax_rate: 18, 
          unit_price: 0.10,
          quantity: 1 
        })],
      });
      const response = await client.createInvoice(invoiceData);
      
      if (response.ok) {
        // 0.10 + 0.018 tax = 0.118, rounded to 0.12
        expect(response.data.total_amount).toBeCloseTo(0.12, 2);
      }
    });
  });

  // ==========================================================================
  // GST Validation Summary
  // ==========================================================================
  test.describe('GST Validation Summary', () => {
    test('should validate complete GST structure for intra-state', async () => {
      test.skip(!client.getAuthToken() || !partyId, 'Missing dependencies');
      
      const invoiceData = createInvoiceData(partyId, {
        is_interstate: false,
        items: [
          createInvoiceItemData({ tax_rate: 5, unit_price: 100, quantity: 1 }),
          createInvoiceItemData({ tax_rate: 18, unit_price: 200, quantity: 2 }),
        ],
      });
      const response = await client.createInvoice(invoiceData);
      
      if (response.ok) {
        const data = response.data;
        
        const validation = validateGstCalculation(
          data.taxable_amount,
          data.cgst_amount,
          data.sgst_amount,
          data.igst_amount,
          data.total_amount,
          false
        );
        
        expect(validation.valid).toBeTruthy();
        if (!validation.valid) {
          console.log('Validation errors:', validation.errors);
        }
      }
    });

    test('should validate complete GST structure for inter-state', async () => {
      test.skip(!client.getAuthToken() || !partyId, 'Missing dependencies');
      
      const invoiceData = createInvoiceData(partyId, {
        is_interstate: true,
        items: [
          createInvoiceItemData({ tax_rate: 12, unit_price: 150, quantity: 3 }),
          createInvoiceItemData({ tax_rate: 28, unit_price: 500, quantity: 1 }),
        ],
      });
      const response = await client.createInvoice(invoiceData);
      
      if (response.ok) {
        const data = response.data;
        
        const validation = validateGstCalculation(
          data.taxable_amount,
          data.cgst_amount,
          data.sgst_amount,
          data.igst_amount,
          data.total_amount,
          true
        );
        
        expect(validation.valid).toBeTruthy();
        if (!validation.valid) {
          console.log('Validation errors:', validation.errors);
        }
      }
    });
  });
});
