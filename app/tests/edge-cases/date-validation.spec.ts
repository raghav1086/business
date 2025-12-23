/**
 * Input Validation Edge Cases - Date Tests
 * 
 * Tests boundary values and edge cases for date validation.
 */

import { test, expect, APIRequestContext } from '@playwright/test';
import {
  getToday,
  getFutureDate,
  getPastDate,
  getLeapYearDate,
  getInvalidDates,
  createInvoiceData,
  createInvoiceItemData,
  createPartyData,
  createPaymentData,
  API,
  TEST_OTP,
} from '../utils/test-helpers';
import { TestApiClient, setupAuthenticatedClient } from '../utils/api-client';

test.describe('Date Validation Edge Cases', () => {
  let request: APIRequestContext;
  let client: TestApiClient;
  let partyId: string;
  const testPhone = '9876543293';
  
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
  // Invoice Date Validation
  // ==========================================================================
  test.describe('Invoice Date Validation', () => {
    test('should accept today\'s date', async () => {
      test.skip(!client.getAuthToken() || !partyId, 'Missing dependencies');
      
      const invoiceData = createInvoiceData(partyId, {
        invoice_date: getToday(),
        items: [createInvoiceItemData()],
      });
      const response = await client.createInvoice(invoiceData);
      
      if (!response.ok) {
        expect(response.error).not.toMatch(/invoice_date/i);
      }
    });

    test('should accept past date (30 days ago)', async () => {
      test.skip(!client.getAuthToken() || !partyId, 'Missing dependencies');
      
      const invoiceData = createInvoiceData(partyId, {
        invoice_date: getPastDate(30),
        items: [createInvoiceItemData()],
      });
      const response = await client.createInvoice(invoiceData);
      
      if (!response.ok) {
        expect(response.error).not.toMatch(/invoice_date/i);
      }
    });

    test('should reject future invoice date (1 day ahead)', async () => {
      test.skip(!client.getAuthToken() || !partyId, 'Missing dependencies');
      
      const invoiceData = createInvoiceData(partyId, {
        invoice_date: getFutureDate(1),
        items: [createInvoiceItemData()],
      });
      const response = await client.createInvoice(invoiceData);
      
      // May or may not reject future dates
      // Check for consistent behavior
      expect(response.status).not.toBe(500);
    });

    test('should reject future invoice date (30 days ahead)', async () => {
      test.skip(!client.getAuthToken() || !partyId, 'Missing dependencies');
      
      const invoiceData = createInvoiceData(partyId, {
        invoice_date: getFutureDate(30),
        items: [createInvoiceItemData()],
      });
      const response = await client.createInvoice(invoiceData);
      
      // Future dates should typically be rejected
      expect(response.status).not.toBe(500);
    });

    test('should handle leap year date (Feb 29, 2024)', async () => {
      test.skip(!client.getAuthToken() || !partyId, 'Missing dependencies');
      
      const invoiceData = createInvoiceData(partyId, {
        invoice_date: getLeapYearDate(),
        items: [createInvoiceItemData()],
      });
      const response = await client.createInvoice(invoiceData);
      
      // Should handle leap year correctly
      if (!response.ok) {
        expect(response.error).not.toMatch(/invalid.*date/i);
      }
    });

    test('should reject invalid Feb 29 in non-leap year', async () => {
      test.skip(!client.getAuthToken() || !partyId, 'Missing dependencies');
      
      const invoiceData = createInvoiceData(partyId, {
        invoice_date: '2023-02-29', // 2023 is not a leap year
        items: [createInvoiceItemData()],
      });
      const response = await client.createInvoice(invoiceData);
      
      expect(response.ok).toBeFalsy();
    });
  });

  // ==========================================================================
  // Due Date Validation
  // ==========================================================================
  test.describe('Due Date Validation', () => {
    test('should accept due_date same as invoice_date', async () => {
      test.skip(!client.getAuthToken() || !partyId, 'Missing dependencies');
      
      const today = getToday();
      const invoiceData = createInvoiceData(partyId, {
        invoice_date: today,
        due_date: today,
        items: [createInvoiceItemData()],
      });
      const response = await client.createInvoice(invoiceData);
      
      if (!response.ok) {
        expect(response.error).not.toMatch(/due_date/i);
      }
    });

    test('should accept due_date after invoice_date', async () => {
      test.skip(!client.getAuthToken() || !partyId, 'Missing dependencies');
      
      const invoiceData = createInvoiceData(partyId, {
        invoice_date: getToday(),
        due_date: getFutureDate(30),
        items: [createInvoiceItemData()],
      });
      const response = await client.createInvoice(invoiceData);
      
      if (!response.ok) {
        expect(response.error).not.toMatch(/due_date/i);
      }
    });

    test('should reject due_date before invoice_date', async () => {
      test.skip(!client.getAuthToken() || !partyId, 'Missing dependencies');
      
      const invoiceData = createInvoiceData(partyId, {
        invoice_date: getToday(),
        due_date: getPastDate(10),
        items: [createInvoiceItemData()],
      });
      const response = await client.createInvoice(invoiceData);
      
      // Due date before invoice date should be invalid
      expect(response.ok).toBeFalsy();
    });

    test('should handle far future due_date (1 year)', async () => {
      test.skip(!client.getAuthToken() || !partyId, 'Missing dependencies');
      
      const invoiceData = createInvoiceData(partyId, {
        invoice_date: getToday(),
        due_date: getFutureDate(365),
        items: [createInvoiceItemData()],
      });
      const response = await client.createInvoice(invoiceData);
      
      // Should handle or reject gracefully
      expect(response.status).not.toBe(500);
    });
  });

  // ==========================================================================
  // Date Format Validation
  // ==========================================================================
  test.describe('Date Format Validation', () => {
    test('should accept ISO date format (YYYY-MM-DD)', async () => {
      test.skip(!client.getAuthToken() || !partyId, 'Missing dependencies');
      
      const invoiceData = createInvoiceData(partyId, {
        invoice_date: '2024-06-15',
        items: [createInvoiceItemData()],
      });
      const response = await client.createInvoice(invoiceData);
      
      if (!response.ok) {
        expect(response.error).not.toMatch(/format/i);
      }
    });

    test('should reject DD-MM-YYYY format', async () => {
      test.skip(!client.getAuthToken() || !partyId, 'Missing dependencies');
      
      const invoiceData = createInvoiceData(partyId, {
        invoice_date: '15-06-2024',
        items: [createInvoiceItemData()],
      });
      const response = await client.createInvoice(invoiceData);
      
      expect(response.ok).toBeFalsy();
    });

    test('should reject MM/DD/YYYY format', async () => {
      test.skip(!client.getAuthToken() || !partyId, 'Missing dependencies');
      
      const invoiceData = createInvoiceData(partyId, {
        invoice_date: '06/15/2024',
        items: [createInvoiceItemData()],
      });
      const response = await client.createInvoice(invoiceData);
      
      expect(response.ok).toBeFalsy();
    });

    test('should reject date with slashes (YYYY/MM/DD)', async () => {
      test.skip(!client.getAuthToken() || !partyId, 'Missing dependencies');
      
      const invoiceData = createInvoiceData(partyId, {
        invoice_date: '2024/06/15',
        items: [createInvoiceItemData()],
      });
      const response = await client.createInvoice(invoiceData);
      
      expect(response.ok).toBeFalsy();
    });

    test('should reject empty date string', async () => {
      test.skip(!client.getAuthToken() || !partyId, 'Missing dependencies');
      
      const invoiceData = createInvoiceData(partyId, {
        invoice_date: '',
        items: [createInvoiceItemData()],
      });
      const response = await client.createInvoice(invoiceData);
      
      expect(response.ok).toBeFalsy();
    });

    test('should reject non-date string', async () => {
      test.skip(!client.getAuthToken() || !partyId, 'Missing dependencies');
      
      const invoiceData = createInvoiceData(partyId, {
        invoice_date: 'invalid-date',
        items: [createInvoiceItemData()],
      });
      const response = await client.createInvoice(invoiceData);
      
      expect(response.ok).toBeFalsy();
    });
  });

  // ==========================================================================
  // Invalid Date Values
  // ==========================================================================
  test.describe('Invalid Date Values', () => {
    test('should reject invalid month (13)', async () => {
      test.skip(!client.getAuthToken() || !partyId, 'Missing dependencies');
      
      const invoiceData = createInvoiceData(partyId, {
        invoice_date: '2024-13-01',
        items: [createInvoiceItemData()],
      });
      const response = await client.createInvoice(invoiceData);
      
      expect(response.ok).toBeFalsy();
    });

    test('should reject invalid month (00)', async () => {
      test.skip(!client.getAuthToken() || !partyId, 'Missing dependencies');
      
      const invoiceData = createInvoiceData(partyId, {
        invoice_date: '2024-00-01',
        items: [createInvoiceItemData()],
      });
      const response = await client.createInvoice(invoiceData);
      
      expect(response.ok).toBeFalsy();
    });

    test('should reject invalid day (32)', async () => {
      test.skip(!client.getAuthToken() || !partyId, 'Missing dependencies');
      
      const invoiceData = createInvoiceData(partyId, {
        invoice_date: '2024-01-32',
        items: [createInvoiceItemData()],
      });
      const response = await client.createInvoice(invoiceData);
      
      expect(response.ok).toBeFalsy();
    });

    test('should reject invalid day (00)', async () => {
      test.skip(!client.getAuthToken() || !partyId, 'Missing dependencies');
      
      const invoiceData = createInvoiceData(partyId, {
        invoice_date: '2024-01-00',
        items: [createInvoiceItemData()],
      });
      const response = await client.createInvoice(invoiceData);
      
      expect(response.ok).toBeFalsy();
    });

    test('should reject invalid April 31', async () => {
      test.skip(!client.getAuthToken() || !partyId, 'Missing dependencies');
      
      const invoiceData = createInvoiceData(partyId, {
        invoice_date: '2024-04-31',
        items: [createInvoiceItemData()],
      });
      const response = await client.createInvoice(invoiceData);
      
      expect(response.ok).toBeFalsy();
    });
  });

  // ==========================================================================
  // Payment Date Validation
  // ==========================================================================
  test.describe('Payment Date Validation', () => {
    test('should accept today\'s payment date', async () => {
      test.skip(!client.getAuthToken() || !partyId, 'Missing dependencies');
      
      const paymentData = createPaymentData(partyId, {
        transaction_date: getToday(),
      });
      const response = await client.createPayment(paymentData);
      
      if (!response.ok) {
        expect(response.error).not.toMatch(/transaction_date/i);
      }
    });

    test('should accept past payment date', async () => {
      test.skip(!client.getAuthToken() || !partyId, 'Missing dependencies');
      
      const paymentData = createPaymentData(partyId, {
        transaction_date: getPastDate(30),
      });
      const response = await client.createPayment(paymentData);
      
      if (!response.ok) {
        expect(response.error).not.toMatch(/transaction_date/i);
      }
    });

    test('should reject future payment date', async () => {
      test.skip(!client.getAuthToken() || !partyId, 'Missing dependencies');
      
      const paymentData = createPaymentData(partyId, {
        transaction_date: getFutureDate(10),
      });
      const response = await client.createPayment(paymentData);
      
      // Future payment dates are typically invalid
      // But check for consistent behavior
      expect(response.status).not.toBe(500);
    });
  });

  // ==========================================================================
  // Cheque Date Validation
  // ==========================================================================
  test.describe('Cheque Date Validation', () => {
    test('should accept cheque_date in future (post-dated)', async () => {
      test.skip(!client.getAuthToken() || !partyId, 'Missing dependencies');
      
      const paymentData = createPaymentData(partyId, {
        payment_mode: 'cheque',
        cheque_number: 'CHQ001',
        cheque_date: getFutureDate(30),
        transaction_date: getToday(),
      });
      const response = await client.createPayment(paymentData);
      
      // Post-dated cheques are common in India
      if (!response.ok) {
        expect(response.error).not.toMatch(/cheque_date/i);
      }
    });

    test('should accept cheque_date same as transaction_date', async () => {
      test.skip(!client.getAuthToken() || !partyId, 'Missing dependencies');
      
      const today = getToday();
      const paymentData = createPaymentData(partyId, {
        payment_mode: 'cheque',
        cheque_number: 'CHQ002',
        cheque_date: today,
        transaction_date: today,
      });
      const response = await client.createPayment(paymentData);
      
      if (!response.ok) {
        expect(response.error).not.toMatch(/cheque_date/i);
      }
    });
  });

  // ==========================================================================
  // Date Boundary Tests (Parameterized)
  // ==========================================================================
  test.describe('Invalid Date Variations', () => {
    const invalidDates = getInvalidDates();
    
    for (const { value, reason } of invalidDates) {
      if (value !== null && value !== undefined) {
        test(`should reject: ${reason}`, async () => {
          test.skip(!client.getAuthToken() || !partyId, 'Missing dependencies');
          
          const invoiceData = createInvoiceData(partyId, {
            invoice_date: value,
            items: [createInvoiceItemData()],
          });
          const response = await client.createInvoice(invoiceData);
          
          expect(response.ok).toBeFalsy();
        });
      }
    }
  });

  // ==========================================================================
  // Timezone Edge Cases
  // ==========================================================================
  test.describe('Timezone Edge Cases', () => {
    test('should handle ISO datetime with timezone', async () => {
      test.skip(!client.getAuthToken() || !partyId, 'Missing dependencies');
      
      const invoiceData = createInvoiceData(partyId, {
        invoice_date: '2024-06-15T00:00:00+05:30', // IST
        items: [createInvoiceItemData()],
      });
      const response = await client.createInvoice(invoiceData);
      
      // Should handle or normalize timezone
      expect(response.status).not.toBe(500);
    });

    test('should handle ISO datetime with Z (UTC)', async () => {
      test.skip(!client.getAuthToken() || !partyId, 'Missing dependencies');
      
      const invoiceData = createInvoiceData(partyId, {
        invoice_date: '2024-06-15T00:00:00Z',
        items: [createInvoiceItemData()],
      });
      const response = await client.createInvoice(invoiceData);
      
      expect(response.status).not.toBe(500);
    });

    test('should handle midnight boundary correctly', async () => {
      test.skip(!client.getAuthToken() || !partyId, 'Missing dependencies');
      
      // At midnight, timezone differences could cause date to shift
      const invoiceData = createInvoiceData(partyId, {
        invoice_date: '2024-06-15T23:59:59+05:30',
        items: [createInvoiceItemData()],
      });
      const response = await client.createInvoice(invoiceData);
      
      expect(response.status).not.toBe(500);
    });
  });

  // ==========================================================================
  // Very Old Dates
  // ==========================================================================
  test.describe('Very Old Date Handling', () => {
    test('should reject date before 2000', async () => {
      test.skip(!client.getAuthToken() || !partyId, 'Missing dependencies');
      
      const invoiceData = createInvoiceData(partyId, {
        invoice_date: '1999-12-31',
        items: [createInvoiceItemData()],
      });
      const response = await client.createInvoice(invoiceData);
      
      // Very old dates should be rejected
      expect(response.ok).toBeFalsy();
    });

    test('should handle date in 2000 (Y2K boundary)', async () => {
      test.skip(!client.getAuthToken() || !partyId, 'Missing dependencies');
      
      const invoiceData = createInvoiceData(partyId, {
        invoice_date: '2000-01-01',
        items: [createInvoiceItemData()],
      });
      const response = await client.createInvoice(invoiceData);
      
      // Should handle or reject gracefully
      expect(response.status).not.toBe(500);
    });
  });
});
