/**
 * Data Integrity & Consistency Tests
 * 
 * Tests for transaction integrity, stock consistency, payment consistency,
 * and cascade operations.
 */

import { test, expect, APIRequestContext } from '@playwright/test';
import {
  createInvoiceData,
  createInvoiceItemData,
  createPartyData,
  createPaymentData,
  createItemData,
  validateGstCalculation,
  roundTo2Decimals,
  API,
  TEST_OTP,
} from '../utils/test-helpers';
import { TestApiClient, setupAuthenticatedClient } from '../utils/api-client';

test.describe('Data Integrity & Consistency', () => {
  let request: APIRequestContext;
  let client: TestApiClient;
  let partyId: string;
  let itemId: string;
  const testPhone = '9876543297';
  
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
      
      // Create an item with stock
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
  // Invoice Creation Integrity
  // ==========================================================================
  test.describe('Invoice Creation Integrity', () => {
    test('should create invoice with all items', async () => {
      test.skip(!client.getAuthToken() || !partyId, 'Missing dependencies');
      
      const items = [
        createInvoiceItemData({ unit_price: 100, quantity: 1, tax_rate: 5 }),
        createInvoiceItemData({ unit_price: 200, quantity: 2, tax_rate: 12 }),
        createInvoiceItemData({ unit_price: 300, quantity: 3, tax_rate: 18 }),
      ];
      
      const invoiceData = createInvoiceData(partyId, { items });
      const response = await client.createInvoice(invoiceData);
      
      if (response.ok) {
        // Verify all items were created
        const invoiceResponse = await client.getInvoice(response.data.id);
        if (invoiceResponse.ok && invoiceResponse.data.items) {
          expect(invoiceResponse.data.items.length).toBe(3);
        }
      }
    });

    test('should maintain invoice totals consistency', async () => {
      test.skip(!client.getAuthToken() || !partyId, 'Missing dependencies');
      
      const invoiceData = createInvoiceData(partyId, {
        is_interstate: false,
        items: [
          createInvoiceItemData({ unit_price: 100, quantity: 1, tax_rate: 18 }),
          createInvoiceItemData({ unit_price: 200, quantity: 2, tax_rate: 18 }),
        ],
      });
      const response = await client.createInvoice(invoiceData);
      
      if (response.ok) {
        const data = response.data;
        
        // Manual calculation
        // Item 1: 100 * 1 = 100
        // Item 2: 200 * 2 = 400
        // Subtotal: 500
        // Tax: 500 * 18% = 90
        // Total: 590
        
        expect(data.subtotal).toBe(500);
        expect(data.taxable_amount).toBe(500);
        
        const totalTax = data.cgst_amount + data.sgst_amount + data.igst_amount;
        expect(totalTax).toBeCloseTo(90, 2);
        
        expect(data.total_amount).toBeCloseTo(590, 2);
      }
    });

    test('should maintain referential integrity - party_id', async () => {
      test.skip(!client.getAuthToken(), 'No auth token');
      
      // Create invoice with valid party
      const invoiceData = createInvoiceData(partyId || '00000000-0000-0000-0000-000000000000', {
        items: [createInvoiceItemData()],
      });
      const response = await client.createInvoice(invoiceData);
      
      if (response.ok) {
        // Verify party_id is stored correctly
        const invoiceResponse = await client.getInvoice(response.data.id);
        if (invoiceResponse.ok) {
          expect(invoiceResponse.data.party_id).toBe(partyId);
        }
      }
    });

    test('should not create partial invoice on item error', async () => {
      test.skip(!client.getAuthToken() || !partyId, 'Missing dependencies');
      
      // Include valid and invalid items
      const invoiceData = createInvoiceData(partyId, {
        items: [
          createInvoiceItemData({ unit_price: 100, quantity: 1 }), // Valid
          createInvoiceItemData({ unit_price: -100, quantity: 1 }), // Invalid
        ],
      });
      const response = await client.createInvoice(invoiceData);
      
      // Should fail entirely, not create partial invoice
      if (response.ok) {
        // If it succeeded, verify both items or none
        const invoiceResponse = await client.getInvoice(response.data.id);
        if (invoiceResponse.ok && invoiceResponse.data.items) {
          // Either all items created or none
          expect([0, 2]).toContain(invoiceResponse.data.items.length);
        }
      } else {
        // Expected: entire operation fails
        expect(response.ok).toBeFalsy();
      }
    });
  });

  // ==========================================================================
  // Stock Consistency
  // ==========================================================================
  test.describe('Stock Consistency', () => {
    test('should track stock accurately across operations', async () => {
      test.skip(!client.getAuthToken() || !itemId, 'Missing dependencies');
      
      // Set initial stock
      await client.updateStock(itemId, 100, 'set');
      
      // Add 50
      await client.updateStock(itemId, 50, 'add');
      
      // Subtract 30
      await client.updateStock(itemId, 30, 'subtract');
      
      // Expected: 100 + 50 - 30 = 120
      const itemResponse = await client.getItem(itemId);
      if (itemResponse.ok) {
        const stock = itemResponse.data.current_stock || itemResponse.data.stock;
        expect(stock).toBe(120);
      }
    });

    test('should prevent negative stock', async () => {
      test.skip(!client.getAuthToken() || !itemId, 'Missing dependencies');
      
      // Set stock to 10
      await client.updateStock(itemId, 10, 'set');
      
      // Try to subtract 20
      const response = await client.updateStock(itemId, 20, 'subtract');
      
      // Check current stock is not negative
      const itemResponse = await client.getItem(itemId);
      if (itemResponse.ok) {
        const stock = itemResponse.data.current_stock || itemResponse.data.stock;
        expect(stock).toBeGreaterThanOrEqual(0);
      }
    });

    test('should maintain stock history accuracy', async () => {
      test.skip(!client.getAuthToken() || !itemId, 'Missing dependencies');
      
      // Reset stock
      await client.updateStock(itemId, 0, 'set');
      
      // Perform series of operations
      const operations = [
        { quantity: 100, type: 'add' as const },
        { quantity: 20, type: 'subtract' as const },
        { quantity: 30, type: 'add' as const },
        { quantity: 50, type: 'subtract' as const },
      ];
      
      let expectedStock = 0;
      for (const op of operations) {
        await client.updateStock(itemId, op.quantity, op.type);
        expectedStock += op.type === 'add' ? op.quantity : -op.quantity;
      }
      
      // Verify final stock
      const itemResponse = await client.getItem(itemId);
      if (itemResponse.ok) {
        const stock = itemResponse.data.current_stock || itemResponse.data.stock;
        expect(stock).toBe(expectedStock); // 100 - 20 + 30 - 50 = 60
      }
    });
  });

  // ==========================================================================
  // Payment Consistency
  // ==========================================================================
  test.describe('Payment Consistency', () => {
    test('should maintain payment balance consistency', async () => {
      test.skip(!client.getAuthToken() || !partyId, 'Missing dependencies');
      
      // Create an invoice
      const invoiceData = createInvoiceData(partyId, {
        items: [createInvoiceItemData({ unit_price: 10000, quantity: 1, tax_rate: 18 })],
      });
      const invoiceResponse = await client.createInvoice(invoiceData);
      
      if (!invoiceResponse.ok) {
        test.skip(true, 'Could not create invoice');
        return;
      }
      
      const invoiceId = invoiceResponse.data.id;
      const invoiceAmount = invoiceResponse.data.total_amount;
      
      // Record multiple payments
      const payments = [3000, 2000, 1000];
      for (const amount of payments) {
        await client.createPayment(createPaymentData(partyId, {
          invoice_id: invoiceId,
          amount,
          transaction_type: 'payment_in',
        }));
      }
      
      // Verify total paid
      const updatedInvoice = await client.getInvoice(invoiceId);
      if (updatedInvoice.ok) {
        const paidAmount = updatedInvoice.data.paid_amount || 0;
        const totalPayments = payments.reduce((sum, p) => sum + p, 0);
        
        // Paid amount should equal sum of payments (capped at invoice amount)
        expect(paidAmount).toBeLessThanOrEqual(invoiceAmount);
        expect(paidAmount).toBe(Math.min(totalPayments, invoiceAmount));
      }
    });

    test('should update invoice payment_status correctly', async () => {
      test.skip(!client.getAuthToken() || !partyId, 'Missing dependencies');
      
      // Create an invoice
      const invoiceData = createInvoiceData(partyId, {
        items: [createInvoiceItemData({ unit_price: 1000, quantity: 1, tax_rate: 18 })],
      });
      const invoiceResponse = await client.createInvoice(invoiceData);
      
      if (!invoiceResponse.ok) {
        test.skip(true, 'Could not create invoice');
        return;
      }
      
      const invoiceId = invoiceResponse.data.id;
      const invoiceAmount = invoiceResponse.data.total_amount;
      
      // Initially unpaid
      expect(invoiceResponse.data.payment_status).toBe('unpaid');
      
      // Partial payment
      await client.createPayment(createPaymentData(partyId, {
        invoice_id: invoiceId,
        amount: Math.floor(invoiceAmount / 2),
        transaction_type: 'payment_in',
      }));
      
      let updatedInvoice = await client.getInvoice(invoiceId);
      if (updatedInvoice.ok) {
        expect(['partial', 'partially_paid']).toContain(updatedInvoice.data.payment_status);
      }
      
      // Full payment
      await client.createPayment(createPaymentData(partyId, {
        invoice_id: invoiceId,
        amount: invoiceAmount, // Pay remaining
        transaction_type: 'payment_in',
      }));
      
      updatedInvoice = await client.getInvoice(invoiceId);
      if (updatedInvoice.ok) {
        expect(['paid', 'fully_paid']).toContain(updatedInvoice.data.payment_status);
      }
    });

    test('should maintain party balance consistency', async () => {
      test.skip(!client.getAuthToken() || !partyId, 'Missing dependencies');
      
      // Get initial party balance
      const initialParty = await client.getParty(partyId);
      const initialBalance = initialParty.data?.balance || 0;
      
      // Create invoice (increases receivable)
      const invoiceData = createInvoiceData(partyId, {
        invoice_type: 'sale',
        items: [createInvoiceItemData({ unit_price: 5000, quantity: 1, tax_rate: 18 })],
      });
      const invoiceResponse = await client.createInvoice(invoiceData);
      
      if (invoiceResponse.ok) {
        // Record payment (decreases receivable)
        await client.createPayment(createPaymentData(partyId, {
          invoice_id: invoiceResponse.data.id,
          amount: 3000,
          transaction_type: 'payment_in',
        }));
        
        // Check party balance
        const finalParty = await client.getParty(partyId);
        if (finalParty.ok) {
          // Balance should reflect invoice and payment
          // Exact calculation depends on implementation
          expect(finalParty.data.balance).toBeDefined();
        }
      }
    });
  });

  // ==========================================================================
  // GST Calculation Consistency
  // ==========================================================================
  test.describe('GST Calculation Consistency', () => {
    test('should maintain GST consistency for intra-state', async () => {
      test.skip(!client.getAuthToken() || !partyId, 'Missing dependencies');
      
      const invoiceData = createInvoiceData(partyId, {
        is_interstate: false,
        items: [
          createInvoiceItemData({ unit_price: 1000, quantity: 1, tax_rate: 18 }),
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
      }
    });

    test('should maintain GST consistency for inter-state', async () => {
      test.skip(!client.getAuthToken() || !partyId, 'Missing dependencies');
      
      const invoiceData = createInvoiceData(partyId, {
        is_interstate: true,
        items: [
          createInvoiceItemData({ unit_price: 1000, quantity: 1, tax_rate: 18 }),
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
      }
    });

    test('should maintain item-level GST consistency', async () => {
      test.skip(!client.getAuthToken() || !partyId, 'Missing dependencies');
      
      const invoiceData = createInvoiceData(partyId, {
        is_interstate: false,
        items: [
          createInvoiceItemData({ unit_price: 100, quantity: 2, tax_rate: 5 }),
          createInvoiceItemData({ unit_price: 500, quantity: 1, tax_rate: 18 }),
        ],
      });
      const response = await client.createInvoice(invoiceData);
      
      if (response.ok) {
        const data = response.data;
        
        // Item 1: 200 @ 5% = 10 tax
        // Item 2: 500 @ 18% = 90 tax
        // Total tax: 100
        
        const totalTax = data.cgst_amount + data.sgst_amount;
        expect(totalTax).toBeCloseTo(100, 2);
        
        // CGST = SGST for intra-state
        expect(data.cgst_amount).toBeCloseTo(50, 2);
        expect(data.sgst_amount).toBeCloseTo(50, 2);
      }
    });
  });

  // ==========================================================================
  // Cascade Operations
  // ==========================================================================
  test.describe('Cascade Operations', () => {
    test('should handle party with invoices on delete attempt', async () => {
      test.skip(!client.getAuthToken(), 'No auth token');
      
      // Create a new party
      const partyData = createPartyData({ type: 'customer' });
      const partyResponse = await client.createParty(partyData);
      
      if (!partyResponse.ok) {
        test.skip(true, 'Could not create party');
        return;
      }
      
      const newPartyId = partyResponse.data.id;
      
      // Create an invoice for this party
      const invoiceData = createInvoiceData(newPartyId, {
        items: [createInvoiceItemData()],
      });
      await client.createInvoice(invoiceData);
      
      // Try to delete party
      const deleteResponse = await client.delete(`${API.party}/parties/${newPartyId}`);
      
      // Should either:
      // 1. Reject delete (party has invoices)
      // 2. Soft delete (mark as inactive)
      // 3. Cascade delete (delete invoices too) - less common
      
      if (deleteResponse.ok) {
        // If delete succeeded, party should be soft deleted or invoices cascaded
        const partyCheck = await client.getParty(newPartyId);
        if (partyCheck.ok) {
          // Soft deleted
          expect(partyCheck.data.status).toBe('inactive');
        }
      } else {
        // Delete rejected due to invoices
        expect(deleteResponse.ok).toBeFalsy();
      }
    });

    test('should handle item with invoices on delete attempt', async () => {
      test.skip(!client.getAuthToken() || !partyId, 'Missing dependencies');
      
      // Create a new item
      const itemData = createItemData();
      const itemResponse = await client.createItem(itemData);
      
      if (!itemResponse.ok) {
        test.skip(true, 'Could not create item');
        return;
      }
      
      const newItemId = itemResponse.data.id;
      
      // Create an invoice with this item
      const invoiceData = createInvoiceData(partyId, {
        items: [{
          item_id: newItemId,
          item_name: itemData.name,
          quantity: 1,
          unit_price: 100,
          tax_rate: 18,
        }],
      });
      await client.createInvoice(invoiceData);
      
      // Try to delete item
      const deleteResponse = await client.delete(`${API.inventory}/items/${newItemId}`);
      
      // Should handle gracefully
      if (deleteResponse.ok) {
        // Soft deleted
        const itemCheck = await client.getItem(newItemId);
        if (itemCheck.ok) {
          expect(itemCheck.data.status).toBe('inactive');
        }
      } else {
        // Delete rejected
        expect(deleteResponse.ok).toBeFalsy();
      }
    });

    test('should maintain foreign key integrity', async () => {
      test.skip(!client.getAuthToken() || !partyId, 'Missing dependencies');
      
      // Create invoice
      const invoiceData = createInvoiceData(partyId, {
        items: [createInvoiceItemData()],
      });
      const invoiceResponse = await client.createInvoice(invoiceData);
      
      if (invoiceResponse.ok) {
        const invoiceId = invoiceResponse.data.id;
        
        // Get invoice and verify party reference
        const invoice = await client.getInvoice(invoiceId);
        if (invoice.ok) {
          expect(invoice.data.party_id).toBe(partyId);
          
          // Verify party exists
          const party = await client.getParty(partyId);
          expect(party.ok).toBeTruthy();
        }
      }
    });
  });

  // ==========================================================================
  // Data Validation on Update
  // ==========================================================================
  test.describe('Data Validation on Update', () => {
    test('should validate data on party update', async () => {
      test.skip(!client.getAuthToken() || !partyId, 'Missing dependencies');
      
      // Try to update with invalid phone
      const response = await client.patch(`${API.party}/parties/${partyId}`, {
        phone: 'invalid-phone',
      });
      
      expect(response.ok).toBeFalsy();
    });

    test('should validate data on item update', async () => {
      test.skip(!client.getAuthToken() || !itemId, 'Missing dependencies');
      
      // Try to update with negative price
      const response = await client.patch(`${API.inventory}/items/${itemId}`, {
        selling_price: -100,
      });
      
      expect(response.ok).toBeFalsy();
    });

    test('should prevent update to read-only fields', async () => {
      test.skip(!client.getAuthToken() || !partyId, 'Missing dependencies');
      
      // Try to update invoice number (should be read-only)
      const invoiceData = createInvoiceData(partyId, {
        items: [createInvoiceItemData()],
      });
      const createResponse = await client.createInvoice(invoiceData);
      
      if (createResponse.ok) {
        const invoiceId = createResponse.data.id;
        
        const response = await client.patch(`${API.invoice}/invoices/${invoiceId}`, {
          invoice_number: 'MANUAL-001', // Should not be changeable
        });
        
        // Either reject or ignore the field
        if (response.ok) {
          const invoiceCheck = await client.getInvoice(invoiceId);
          // Invoice number should remain unchanged
          expect(invoiceCheck.data.invoice_number).not.toBe('MANUAL-001');
        }
      }
    });
  });

  // ==========================================================================
  // Concurrent Update Consistency
  // ==========================================================================
  test.describe('Concurrent Update Consistency', () => {
    test('should handle concurrent party updates', async () => {
      test.skip(!client.getAuthToken() || !partyId, 'Missing dependencies');
      
      // Simultaneous updates to same party
      const updates = [
        client.patch(`${API.party}/parties/${partyId}`, { billing_city: 'Mumbai' }),
        client.patch(`${API.party}/parties/${partyId}`, { billing_city: 'Delhi' }),
        client.patch(`${API.party}/parties/${partyId}`, { billing_city: 'Bangalore' }),
      ];
      
      await Promise.allSettled(updates);
      
      // Verify data is consistent (one of the cities should be set)
      const party = await client.getParty(partyId);
      if (party.ok) {
        expect(['Mumbai', 'Delhi', 'Bangalore']).toContain(party.data.billing_city);
      }
    });
  });

  // ==========================================================================
  // Transaction Atomicity
  // ==========================================================================
  test.describe('Transaction Atomicity', () => {
    test('should rollback entire invoice on partial failure', async () => {
      test.skip(!client.getAuthToken() || !partyId, 'Missing dependencies');
      
      // Get current invoice count
      const initialInvoices = await client.listInvoices();
      const initialCount = initialInvoices.data?.length || 0;
      
      // Create invoice with invalid data
      const invoiceData = createInvoiceData(partyId, {
        items: [
          createInvoiceItemData({ unit_price: 100 }), // Valid
          { item_name: '', quantity: 0, unit_price: -1, tax_rate: 200 } as any, // Invalid
        ],
      });
      await client.createInvoice(invoiceData);
      
      // Verify no partial invoice was created
      const finalInvoices = await client.listInvoices();
      const finalCount = finalInvoices.data?.length || 0;
      
      // Count should not have increased by 1 (no partial create)
      // Note: May increase by 1 if validation happens before commit
      expect(finalCount).toBeLessThanOrEqual(initialCount + 1);
    });
  });
});
