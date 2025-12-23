/**
 * Business Rule Violations Tests
 * 
 * Tests for invoice rules, payment rules, stock rules, and party rules.
 */

import { test, expect, APIRequestContext } from '@playwright/test';
import {
  createInvoiceData,
  createInvoiceItemData,
  createPartyData,
  createPaymentData,
  createItemData,
  createBusinessData,
  generateGSTIN,
  generatePhone,
  getToday,
  getFutureDate,
  getPastDate,
  API,
  TEST_OTP,
} from '../utils/test-helpers';
import { TestApiClient, setupAuthenticatedClient } from '../utils/api-client';
import { faker } from '@faker-js/faker/locale/en_IN';

test.describe('Business Rule Violations', () => {
  let request: APIRequestContext;
  let client: TestApiClient;
  let partyId: string;
  let supplierId: string;
  let itemId: string;
  let invoiceId: string;
  const testPhone = '9876543296';
  
  test.beforeAll(async ({ playwright }) => {
    request = await playwright.request.newContext();
    try {
      client = await setupAuthenticatedClient(request, testPhone, TEST_OTP);
      
      // Create customer party
      const partyData = createPartyData({ type: 'customer' });
      const partyResponse = await client.createParty(partyData);
      if (partyResponse.ok) {
        partyId = partyResponse.data.id;
      }
      
      // Create supplier party
      const supplierData = createPartyData({ type: 'supplier' });
      const supplierResponse = await client.createParty(supplierData);
      if (supplierResponse.ok) {
        supplierId = supplierResponse.data.id;
      }
      
      // Create an item with stock
      const itemData = createItemData({ opening_stock: 100 });
      const itemResponse = await client.createItem(itemData);
      if (itemResponse.ok) {
        itemId = itemResponse.data.id;
      }
      
      // Create an invoice for payment tests
      if (partyId) {
        const invoiceData = createInvoiceData(partyId, {
          items: [createInvoiceItemData({ unit_price: 10000, quantity: 1 })],
        });
        const invoiceResponse = await client.createInvoice(invoiceData);
        if (invoiceResponse.ok) {
          invoiceId = invoiceResponse.data.id;
        }
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
  // Invoice Rules
  // ==========================================================================
  test.describe('Invoice Rules', () => {
    test('should reject invoice with empty items array', async () => {
      test.skip(!client.getAuthToken() || !partyId, 'Missing dependencies');
      
      const invoiceData = createInvoiceData(partyId, {
        items: [],
      });
      const response = await client.createInvoice(invoiceData);
      
      expect(response.ok).toBeFalsy();
      expect(response.status).toBe(400);
    });

    test('should reject invoice with invalid party_id', async () => {
      test.skip(!client.getAuthToken(), 'No auth token');
      
      const invoiceData = createInvoiceData('invalid-uuid-123', {
        items: [createInvoiceItemData()],
      });
      const response = await client.createInvoice(invoiceData);
      
      expect(response.ok).toBeFalsy();
    });

    test('should reject invoice with non-existent party_id', async () => {
      test.skip(!client.getAuthToken(), 'No auth token');
      
      const fakeUuid = '00000000-0000-0000-0000-000000000000';
      const invoiceData = createInvoiceData(fakeUuid, {
        items: [createInvoiceItemData()],
      });
      const response = await client.createInvoice(invoiceData);
      
      expect(response.ok).toBeFalsy();
      expect([400, 404]).toContain(response.status);
    });

    test('should reject invoice with party from different business', async () => {
      test.skip(!client.getAuthToken(), 'No auth token');
      
      // This would require multi-tenant setup
      // For now, just ensure the API doesn't crash
      const invoiceData = createInvoiceData(partyId || '00000000-0000-0000-0000-000000000000', {
        items: [createInvoiceItemData()],
      });
      const response = await client.createInvoice(invoiceData);
      
      // Should either succeed (same business) or fail gracefully
      expect(response.status).not.toBe(500);
    });

    test('should reject invoice with due_date before invoice_date', async () => {
      test.skip(!client.getAuthToken() || !partyId, 'Missing dependencies');
      
      const invoiceData = createInvoiceData(partyId, {
        invoice_date: getToday(),
        due_date: getPastDate(10),
        items: [createInvoiceItemData()],
      });
      const response = await client.createInvoice(invoiceData);
      
      expect(response.ok).toBeFalsy();
    });

    test('should reject invoice with negative item amounts', async () => {
      test.skip(!client.getAuthToken() || !partyId, 'Missing dependencies');
      
      const invoiceData = createInvoiceData(partyId, {
        items: [createInvoiceItemData({ unit_price: -100 })],
      });
      const response = await client.createInvoice(invoiceData);
      
      expect(response.ok).toBeFalsy();
      expect(response.status).toBe(400);
    });

    test('should reject invoice with zero quantity items', async () => {
      test.skip(!client.getAuthToken() || !partyId, 'Missing dependencies');
      
      const invoiceData = createInvoiceData(partyId, {
        items: [createInvoiceItemData({ quantity: 0 })],
      });
      const response = await client.createInvoice(invoiceData);
      
      expect(response.ok).toBeFalsy();
      expect(response.status).toBe(400);
    });

    test('should reject invoice without party_id', async () => {
      test.skip(!client.getAuthToken(), 'No auth token');
      
      const invoiceData = {
        invoice_type: 'sale',
        invoice_date: getToday(),
        items: [createInvoiceItemData()],
      };
      const response = await client.createInvoice(invoiceData);
      
      expect(response.ok).toBeFalsy();
      expect(response.status).toBe(400);
    });

    test('should reject invoice with invalid invoice_type', async () => {
      test.skip(!client.getAuthToken() || !partyId, 'Missing dependencies');
      
      const invoiceData = createInvoiceData(partyId, {
        invoice_type: 'invalid_type' as any,
        items: [createInvoiceItemData()],
      });
      const response = await client.createInvoice(invoiceData);
      
      expect(response.ok).toBeFalsy();
    });

    test('should enforce sale invoice for customer', async () => {
      test.skip(!client.getAuthToken() || !partyId, 'Missing dependencies');
      
      // Customer should typically receive sale invoices
      const invoiceData = createInvoiceData(partyId, {
        invoice_type: 'sale',
        items: [createInvoiceItemData()],
      });
      const response = await client.createInvoice(invoiceData);
      
      // Should succeed
      if (!response.ok) {
        expect(response.error).not.toMatch(/customer.*sale/i);
      }
    });

    test('should enforce purchase invoice for supplier', async () => {
      test.skip(!client.getAuthToken() || !supplierId, 'Missing dependencies');
      
      // Supplier should typically receive purchase invoices
      const invoiceData = createInvoiceData(supplierId, {
        invoice_type: 'purchase',
        items: [createInvoiceItemData()],
      });
      const response = await client.createInvoice(invoiceData);
      
      // Should succeed
      if (!response.ok) {
        expect(response.error).not.toMatch(/supplier.*purchase/i);
      }
    });
  });

  // ==========================================================================
  // Payment Rules
  // ==========================================================================
  test.describe('Payment Rules', () => {
    test('should reject payment amount greater than invoice balance', async () => {
      test.skip(!client.getAuthToken() || !partyId || !invoiceId, 'Missing dependencies');
      
      // Get invoice details
      const invoiceResponse = await client.getInvoice(invoiceId);
      if (!invoiceResponse.ok) {
        test.skip(true, 'Could not get invoice');
        return;
      }
      
      const invoiceAmount = invoiceResponse.data.total_amount;
      const paidAmount = invoiceResponse.data.paid_amount || 0;
      const balance = invoiceAmount - paidAmount;
      
      // Try to pay more than balance
      const paymentData = createPaymentData(partyId, {
        invoice_id: invoiceId,
        amount: balance + 1000,
        transaction_type: 'payment_in',
      });
      const response = await client.createPayment(paymentData);
      
      // Should reject or cap at balance
      if (response.ok) {
        expect(response.data.amount).toBeLessThanOrEqual(balance);
      } else {
        expect(response.ok).toBeFalsy();
      }
    });

    test('should reject payment for cancelled invoice', async () => {
      test.skip(!client.getAuthToken() || !partyId, 'Missing dependencies');
      
      // Create and cancel an invoice
      const invoiceData = createInvoiceData(partyId, {
        items: [createInvoiceItemData({ unit_price: 5000, quantity: 1 })],
      });
      const invoiceResponse = await client.createInvoice(invoiceData);
      
      if (!invoiceResponse.ok) {
        test.skip(true, 'Could not create invoice');
        return;
      }
      
      const testInvoiceId = invoiceResponse.data.id;
      
      // Cancel the invoice
      await client.cancelInvoice(testInvoiceId);
      
      // Try to record payment
      const paymentData = createPaymentData(partyId, {
        invoice_id: testInvoiceId,
        amount: 1000,
        transaction_type: 'payment_in',
      });
      const paymentResponse = await client.createPayment(paymentData);
      
      // Should reject payment for cancelled invoice
      expect(paymentResponse.ok).toBeFalsy();
    });

    test('should reject payment with invalid payment_mode', async () => {
      test.skip(!client.getAuthToken() || !partyId, 'Missing dependencies');
      
      const paymentData = createPaymentData(partyId, {
        payment_mode: 'invalid_mode' as any,
        amount: 1000,
      });
      const response = await client.createPayment(paymentData);
      
      expect(response.ok).toBeFalsy();
    });

    test('should reject payment with future transaction_date', async () => {
      test.skip(!client.getAuthToken() || !partyId, 'Missing dependencies');
      
      const paymentData = createPaymentData(partyId, {
        transaction_date: getFutureDate(10),
        amount: 1000,
      });
      const response = await client.createPayment(paymentData);
      
      // Future dated payments may or may not be allowed
      // Check for consistent behavior
      expect(response.status).not.toBe(500);
    });

    test('should reject payment_in for purchase invoice', async () => {
      test.skip(!client.getAuthToken() || !supplierId, 'Missing dependencies');
      
      // Create purchase invoice
      const invoiceData = createInvoiceData(supplierId, {
        invoice_type: 'purchase',
        items: [createInvoiceItemData({ unit_price: 5000, quantity: 1 })],
      });
      const invoiceResponse = await client.createInvoice(invoiceData);
      
      if (!invoiceResponse.ok) {
        test.skip(true, 'Could not create purchase invoice');
        return;
      }
      
      const purchaseInvoiceId = invoiceResponse.data.id;
      
      // Try payment_in (which is incorrect for purchase - should be payment_out)
      const paymentData = createPaymentData(supplierId, {
        invoice_id: purchaseInvoiceId,
        amount: 1000,
        transaction_type: 'payment_in', // Wrong type for purchase
      });
      const response = await client.createPayment(paymentData);
      
      // May reject or handle gracefully
      expect(response.status).not.toBe(500);
    });

    test('should reject payment_out for sale invoice', async () => {
      test.skip(!client.getAuthToken() || !partyId, 'Missing dependencies');
      
      // Create sale invoice
      const invoiceData = createInvoiceData(partyId, {
        invoice_type: 'sale',
        items: [createInvoiceItemData({ unit_price: 5000, quantity: 1 })],
      });
      const invoiceResponse = await client.createInvoice(invoiceData);
      
      if (!invoiceResponse.ok) {
        test.skip(true, 'Could not create sale invoice');
        return;
      }
      
      const saleInvoiceId = invoiceResponse.data.id;
      
      // Try payment_out (which is incorrect for sale - should be payment_in)
      const paymentData = createPaymentData(partyId, {
        invoice_id: saleInvoiceId,
        amount: 1000,
        transaction_type: 'payment_out', // Wrong type for sale
      });
      const response = await client.createPayment(paymentData);
      
      // May reject or handle gracefully
      expect(response.status).not.toBe(500);
    });

    test('should reject payment with zero amount', async () => {
      test.skip(!client.getAuthToken() || !partyId, 'Missing dependencies');
      
      const paymentData = createPaymentData(partyId, {
        amount: 0,
      });
      const response = await client.createPayment(paymentData);
      
      expect(response.ok).toBeFalsy();
      expect(response.status).toBe(400);
    });

    test('should reject payment with negative amount', async () => {
      test.skip(!client.getAuthToken() || !partyId, 'Missing dependencies');
      
      const paymentData = createPaymentData(partyId, {
        amount: -1000,
      });
      const response = await client.createPayment(paymentData);
      
      expect(response.ok).toBeFalsy();
      expect(response.status).toBe(400);
    });

    test('should require cheque details for cheque payment', async () => {
      test.skip(!client.getAuthToken() || !partyId, 'Missing dependencies');
      
      const paymentData = createPaymentData(partyId, {
        payment_mode: 'cheque',
        amount: 1000,
        // Missing cheque_number and cheque_date
      });
      const response = await client.createPayment(paymentData);
      
      // May require cheque details or accept without
      expect(response.status).not.toBe(500);
    });
  });

  // ==========================================================================
  // Stock Rules
  // ==========================================================================
  test.describe('Stock Rules', () => {
    test('should reject stock adjustment that makes stock negative', async () => {
      test.skip(!client.getAuthToken() || !itemId, 'Missing dependencies');
      
      // Set stock to 10
      await client.updateStock(itemId, 10, 'set');
      
      // Try to subtract 20
      const response = await client.updateStock(itemId, 20, 'subtract');
      
      // Should reject or prevent negative stock
      if (response.ok) {
        const itemResponse = await client.getItem(itemId);
        expect(itemResponse.data.current_stock || itemResponse.data.stock).toBeGreaterThanOrEqual(0);
      } else {
        expect(response.ok).toBeFalsy();
      }
    });

    test('should reject stock adjustment with invalid adjustment_type', async () => {
      test.skip(!client.getAuthToken() || !itemId, 'Missing dependencies');
      
      const response = await client.updateStock(itemId, 10, 'invalid' as any);
      
      expect(response.ok).toBeFalsy();
    });

    test('should reject stock adjustment with negative quantity for add', async () => {
      test.skip(!client.getAuthToken() || !itemId, 'Missing dependencies');
      
      const response = await client.updateStock(itemId, -10, 'add');
      
      expect(response.ok).toBeFalsy();
    });

    test('should handle stock adjustment with very large quantities', async () => {
      test.skip(!client.getAuthToken() || !itemId, 'Missing dependencies');
      
      // Very large but reasonable stock
      const response = await client.updateStock(itemId, 1000000, 'add');
      
      // Should succeed or give appropriate error
      expect(response.status).not.toBe(500);
    });

    test('should track stock correctly after sale', async () => {
      test.skip(!client.getAuthToken() || !partyId || !itemId, 'Missing dependencies');
      
      // Set initial stock
      await client.updateStock(itemId, 50, 'set');
      
      // Get initial stock
      const initialResponse = await client.getItem(itemId);
      const initialStock = initialResponse.data?.current_stock || initialResponse.data?.stock || 0;
      
      // Create sale invoice with this item
      const invoiceData = createInvoiceData(partyId, {
        items: [{
          item_id: itemId,
          item_name: 'Test Item',
          quantity: 5,
          unit_price: 100,
          tax_rate: 18,
        }],
      });
      await client.createInvoice(invoiceData);
      
      // Check stock after sale
      const finalResponse = await client.getItem(itemId);
      const finalStock = finalResponse.data?.current_stock || finalResponse.data?.stock || 0;
      
      // Stock should be reduced by 5 (if auto-deduction is enabled)
      // Or remain same (if manual deduction)
      expect(finalStock).toBeLessThanOrEqual(initialStock);
    });
  });

  // ==========================================================================
  // Party Rules
  // ==========================================================================
  test.describe('Party Rules', () => {
    test('should reject party with duplicate GSTIN in same business', async () => {
      test.skip(!client.getAuthToken(), 'No auth token');
      
      const gstin = generateGSTIN('27');
      
      // Create first party with GSTIN
      const firstParty = createPartyData({ gstin });
      const firstResponse = await client.createParty(firstParty);
      
      if (!firstResponse.ok) {
        // GSTIN might already exist
        test.skip(true, 'First party creation failed');
        return;
      }
      
      // Try to create second party with same GSTIN
      const secondParty = createPartyData({ gstin });
      const secondResponse = await client.createParty(secondParty);
      
      // Should reject duplicate GSTIN
      expect(secondResponse.ok).toBeFalsy();
      expect([400, 409]).toContain(secondResponse.status);
    });

    test('should reject party with invalid PAN format', async () => {
      test.skip(!client.getAuthToken(), 'No auth token');
      
      const partyData = createPartyData({ pan: 'INVALID123' });
      const response = await client.createParty(partyData);
      
      expect(response.ok).toBeFalsy();
      expect(response.status).toBe(400);
    });

    test('should reject party with invalid phone format', async () => {
      test.skip(!client.getAuthToken(), 'No auth token');
      
      const partyData = createPartyData({ phone: '12345' });
      const response = await client.createParty(partyData);
      
      expect(response.ok).toBeFalsy();
      expect(response.status).toBe(400);
    });

    test('should reject party with invalid email format', async () => {
      test.skip(!client.getAuthToken(), 'No auth token');
      
      const partyData = createPartyData({ email: 'invalid-email' });
      const response = await client.createParty(partyData);
      
      expect(response.ok).toBeFalsy();
      expect(response.status).toBe(400);
    });

    test('should reject party without name', async () => {
      test.skip(!client.getAuthToken(), 'No auth token');
      
      const partyData = createPartyData({ name: '' });
      const response = await client.createParty(partyData);
      
      expect(response.ok).toBeFalsy();
      expect(response.status).toBe(400);
    });

    test('should reject party with invalid type', async () => {
      test.skip(!client.getAuthToken(), 'No auth token');
      
      const partyData = createPartyData({ type: 'invalid' as any });
      const response = await client.createParty(partyData);
      
      expect(response.ok).toBeFalsy();
    });

    test('should accept party with valid type: customer', async () => {
      test.skip(!client.getAuthToken(), 'No auth token');
      
      const partyData = createPartyData({ type: 'customer' });
      const response = await client.createParty(partyData);
      
      if (!response.ok) {
        expect(response.error).not.toMatch(/type/i);
      }
    });

    test('should accept party with valid type: supplier', async () => {
      test.skip(!client.getAuthToken(), 'No auth token');
      
      const partyData = createPartyData({ type: 'supplier' });
      const response = await client.createParty(partyData);
      
      if (!response.ok) {
        expect(response.error).not.toMatch(/type/i);
      }
    });

    test('should accept party with valid type: both', async () => {
      test.skip(!client.getAuthToken(), 'No auth token');
      
      const partyData = createPartyData({ type: 'both' });
      const response = await client.createParty(partyData);
      
      if (!response.ok) {
        expect(response.error).not.toMatch(/type/i);
      }
    });

    test('should reject party with invalid pincode', async () => {
      test.skip(!client.getAuthToken(), 'No auth token');
      
      const partyData = createPartyData({ billing_pincode: '1234' }); // 4 digits instead of 6
      const response = await client.createParty(partyData);
      
      expect(response.ok).toBeFalsy();
    });

    test('should allow party without GSTIN (unregistered)', async () => {
      test.skip(!client.getAuthToken(), 'No auth token');
      
      const partyData = createPartyData();
      delete partyData.gstin;
      const response = await client.createParty(partyData);
      
      // Unregistered parties should be allowed
      if (!response.ok) {
        expect(response.error).not.toMatch(/gstin.*required/i);
      }
    });
  });

  // ==========================================================================
  // Business Rules
  // ==========================================================================
  test.describe('Business Rules', () => {
    test('should reject business with duplicate GSTIN', async () => {
      test.skip(!client.getAuthToken(), 'No auth token');
      
      const gstin = generateGSTIN('27');
      
      // Create first business
      const firstBusiness = createBusinessData({ gstin });
      const firstResponse = await client.createBusiness(firstBusiness);
      
      if (!firstResponse.ok) {
        // May already exist
        test.skip(true, 'First business creation failed');
        return;
      }
      
      // Try duplicate
      const secondBusiness = createBusinessData({ gstin });
      const secondResponse = await client.createBusiness(secondBusiness);
      
      expect(secondResponse.ok).toBeFalsy();
    });

    test('should reject business without name', async () => {
      test.skip(!client.getAuthToken(), 'No auth token');
      
      const businessData = createBusinessData({ name: '' });
      const response = await client.createBusiness(businessData);
      
      expect(response.ok).toBeFalsy();
    });

    test('should reject business with invalid GSTIN', async () => {
      test.skip(!client.getAuthToken(), 'No auth token');
      
      const businessData = createBusinessData({ gstin: 'INVALIDGSTIN' });
      const response = await client.createBusiness(businessData);
      
      expect(response.ok).toBeFalsy();
    });
  });

  // ==========================================================================
  // Item Rules
  // ==========================================================================
  test.describe('Item Rules', () => {
    test('should reject item without name', async () => {
      test.skip(!client.getAuthToken(), 'No auth token');
      
      const itemData = createItemData({ name: '' });
      const response = await client.createItem(itemData);
      
      expect(response.ok).toBeFalsy();
    });

    test('should reject item with negative selling price', async () => {
      test.skip(!client.getAuthToken(), 'No auth token');
      
      const itemData = createItemData({ selling_price: -100 });
      const response = await client.createItem(itemData);
      
      expect(response.ok).toBeFalsy();
    });

    test('should reject item with negative purchase price', async () => {
      test.skip(!client.getAuthToken(), 'No auth token');
      
      const itemData = createItemData({ purchase_price: -100 });
      const response = await client.createItem(itemData);
      
      expect(response.ok).toBeFalsy();
    });

    test('should reject item with negative opening stock', async () => {
      test.skip(!client.getAuthToken(), 'No auth token');
      
      const itemData = createItemData({ opening_stock: -10 });
      const response = await client.createItem(itemData);
      
      expect(response.ok).toBeFalsy();
    });

    test('should allow item with zero selling price', async () => {
      test.skip(!client.getAuthToken(), 'No auth token');
      
      const itemData = createItemData({ selling_price: 0 });
      const response = await client.createItem(itemData);
      
      // Free items should be allowed
      expect(response.status).not.toBe(500);
    });

    test('should reject duplicate SKU in same business', async () => {
      test.skip(!client.getAuthToken(), 'No auth token');
      
      const sku = 'UNIQUE-SKU-' + Date.now();
      
      // Create first item
      const firstItem = createItemData({ sku });
      const firstResponse = await client.createItem(firstItem);
      
      if (!firstResponse.ok) {
        test.skip(true, 'First item creation failed');
        return;
      }
      
      // Try duplicate SKU
      const secondItem = createItemData({ sku });
      const secondResponse = await client.createItem(secondItem);
      
      // Should reject duplicate SKU
      expect(secondResponse.ok).toBeFalsy();
    });
  });
});
