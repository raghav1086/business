/**
 * Test Helpers
 * 
 * Utility functions for testing including factories, fixtures, and helpers.
 */

import { faker } from '@faker-js/faker/locale/en_IN';

// API Base URLs
export const API = {
  auth: 'http://localhost:3002/api/v1',
  business: 'http://localhost:3003/api/v1',
  party: 'http://localhost:3004/api/v1',
  inventory: 'http://localhost:3005/api/v1',
  invoice: 'http://localhost:3006/api/v1',
  payment: 'http://localhost:3007/api/v1',
};

// Test Constants
export const TEST_OTP = '129012';
export const INDIAN_STATE_CODES = {
  'Andhra Pradesh': '37',
  'Bihar': '10',
  'Delhi': '07',
  'Gujarat': '24',
  'Karnataka': '29',
  'Kerala': '32',
  'Maharashtra': '27',
  'Rajasthan': '08',
  'Tamil Nadu': '33',
  'Telangana': '36',
  'Uttar Pradesh': '09',
  'West Bengal': '19',
};

export const VALID_GST_RATES = [0, 5, 12, 18, 28];
export const VALID_CESS_RATES = [0, 1, 3, 5, 12, 15, 20, 25];

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Wait for services to be ready
 */
export async function waitForServices(maxRetries: number = 30, delayMs: number = 1000): Promise<boolean> {
  const services = [
    { name: 'Auth', url: `${API.auth}/../../health` },
    { name: 'Business', url: `${API.business}/../../health` },
    { name: 'Party', url: `${API.party}/../../health` },
    { name: 'Inventory', url: `${API.inventory}/../../health` },
    { name: 'Invoice', url: `${API.invoice}/../../health` },
    { name: 'Payment', url: `${API.payment}/../../health` },
  ];

  for (let i = 0; i < maxRetries; i++) {
    let allHealthy = true;
    
    for (const service of services) {
      try {
        const response = await fetch(service.url, { signal: AbortSignal.timeout(2000) });
        if (!response.ok) {
          allHealthy = false;
          break;
        }
      } catch {
        allHealthy = false;
        break;
      }
    }
    
    if (allHealthy) {
      console.log(`✅ All services ready after ${i + 1} attempts`);
      return true;
    }
    
    await new Promise(resolve => setTimeout(resolve, delayMs));
  }
  
  console.warn('⚠️ Some services may not be ready');
  return false;
}

/**
 * Retry a function with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  initialDelayMs: number = 500
): Promise<T> {
  let lastError: any;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (i < maxRetries - 1) {
        const delay = initialDelayMs * Math.pow(2, i);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError;
}

/**
 * Random delay to avoid race conditions
 */
export async function randomDelay(minMs: number = 100, maxMs: number = 500): Promise<void> {
  const delay = Math.random() * (maxMs - minMs) + minMs;
  await new Promise(resolve => setTimeout(resolve, delay));
}

// =============================================================================
// DATA FACTORIES
// =============================================================================

/**
 * Generate valid Indian GSTIN
 */
export function generateGSTIN(stateCode: string = '27'): string {
  const pan = faker.string.alpha({ length: 5, casing: 'upper' }) +
    faker.string.numeric(4) +
    faker.string.alpha({ length: 1, casing: 'upper' });
  return `${stateCode}${pan}1Z${faker.string.alphanumeric({ length: 1, casing: 'upper' })}`;
}

/**
 * Generate valid PAN
 */
export function generatePAN(): string {
  return faker.string.alpha({ length: 5, casing: 'upper' }) +
    faker.string.numeric(4) +
    faker.string.alpha({ length: 1, casing: 'upper' });
}

/**
 * Generate valid Indian phone number
 */
export function generatePhone(): string {
  const firstDigit = faker.helpers.arrayElement(['6', '7', '8', '9']);
  return firstDigit + faker.string.numeric(9);
}

/**
 * Generate invalid GSTIN variations for testing
 */
export function generateInvalidGSTINs(): Array<{ value: string; reason: string }> {
  return [
    { value: '', reason: 'Empty string' },
    { value: '27ABCDE1234F1Z', reason: '14 characters (too short)' },
    { value: '27ABCDE1234F1Z56', reason: '16 characters (too long)' },
    { value: '99ABCDE1234F1Z5', reason: 'Invalid state code (99)' },
    { value: '27abcde1234f1z5', reason: 'Lowercase letters' },
    { value: '27ABCDE1234F1Z!', reason: 'Special character at end' },
    { value: 'ABCDE12345F1Z5X', reason: 'Missing state code' },
    { value: '27ABCDE1234F0Z5', reason: 'Invalid entity code (0)' },
    { value: '27ABCDE1234F1Y5', reason: 'Missing Z in position 14' },
    { value: '27 ABCDE1234F1Z5', reason: 'Contains space' },
    { value: null as any, reason: 'Null value' },
    { value: undefined as any, reason: 'Undefined value' },
  ];
}

/**
 * Generate invalid phone numbers for testing
 */
export function generateInvalidPhones(): Array<{ value: string; reason: string }> {
  return [
    { value: '', reason: 'Empty string' },
    { value: '123456789', reason: '9 digits (too short)' },
    { value: '12345678901', reason: '11 digits (too long)' },
    { value: '0987654321', reason: 'Starts with 0' },
    { value: '1234567890', reason: 'Starts with 1' },
    { value: '2345678901', reason: 'Starts with 2' },
    { value: '3456789012', reason: 'Starts with 3' },
    { value: '4567890123', reason: 'Starts with 4' },
    { value: '5678901234', reason: 'Starts with 5' },
    { value: '987654321a', reason: 'Contains letters' },
    { value: '9876-54321', reason: 'Contains special characters' },
    { value: '987 654 321', reason: 'Contains spaces' },
    { value: '+919876543210', reason: 'Contains country code' },
    { value: null as any, reason: 'Null value' },
    { value: undefined as any, reason: 'Undefined value' },
  ];
}

/**
 * Generate boundary amounts for testing
 */
export function generateBoundaryAmounts(): Array<{ value: number; description: string; expected: 'valid' | 'invalid' }> {
  return [
    { value: 0, description: 'Zero amount', expected: 'invalid' },
    { value: 0.01, description: 'Minimum valid amount', expected: 'valid' },
    { value: -1, description: 'Negative amount', expected: 'invalid' },
    { value: -0.01, description: 'Small negative amount', expected: 'invalid' },
    { value: 0.001, description: 'Amount with 3 decimals (0.001)', expected: 'invalid' },
    { value: 999999999.99, description: 'Large valid amount', expected: 'valid' },
    { value: 10000000000, description: 'Very large amount (10B)', expected: 'invalid' },
    { value: Number.MAX_SAFE_INTEGER, description: 'MAX_SAFE_INTEGER', expected: 'invalid' },
    { value: Infinity, description: 'Infinity', expected: 'invalid' },
    { value: NaN, description: 'NaN', expected: 'invalid' },
    { value: 1.999, description: 'Amount with 3 decimals (1.999)', expected: 'invalid' },
    { value: 100.50, description: 'Normal valid amount', expected: 'valid' },
  ];
}

/**
 * Generate boundary quantities for testing
 */
export function generateBoundaryQuantities(): Array<{ value: number; description: string; expected: 'valid' | 'invalid' }> {
  return [
    { value: 0, description: 'Zero quantity', expected: 'invalid' },
    { value: 0.5, description: 'Fractional quantity', expected: 'valid' },
    { value: 0.001, description: 'Very small fractional', expected: 'valid' },
    { value: -1, description: 'Negative quantity', expected: 'invalid' },
    { value: 1, description: 'Minimum valid quantity', expected: 'valid' },
    { value: 999999, description: 'Large quantity', expected: 'valid' },
    { value: 10000000, description: 'Very large quantity', expected: 'invalid' },
    { value: Infinity, description: 'Infinity', expected: 'invalid' },
    { value: NaN, description: 'NaN', expected: 'invalid' },
  ];
}

// =============================================================================
// ENTITY FACTORIES
// =============================================================================

export interface BusinessData {
  name: string;
  type: string;
  gstin: string;
  pan: string;
  email: string;
  phone: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  state: string;
  pincode: string;
}

export function createBusinessData(overrides: Partial<BusinessData> = {}): BusinessData {
  const stateCode = faker.helpers.arrayElement(Object.values(INDIAN_STATE_CODES));
  return {
    name: faker.company.name(),
    type: faker.helpers.arrayElement(['Retailer', 'Wholesaler', 'Manufacturer', 'Services']),
    gstin: generateGSTIN(stateCode),
    pan: generatePAN(),
    email: faker.internet.email(),
    phone: generatePhone(),
    address_line1: faker.location.streetAddress(),
    address_line2: faker.location.secondaryAddress(),
    city: faker.location.city(),
    state: Object.keys(INDIAN_STATE_CODES).find(
      s => INDIAN_STATE_CODES[s as keyof typeof INDIAN_STATE_CODES] === stateCode
    ) || 'Maharashtra',
    pincode: faker.string.numeric(6),
    ...overrides,
  };
}

export interface PartyData {
  name: string;
  type: 'customer' | 'supplier' | 'both';
  phone?: string;
  email?: string;
  gstin?: string;
  pan?: string;
  billing_address_line1?: string;
  billing_city?: string;
  billing_state?: string;
  billing_pincode?: string;
  opening_balance?: number;
  opening_balance_type?: 'credit' | 'debit';
}

export function createPartyData(overrides: Partial<PartyData> = {}): PartyData {
  return {
    name: faker.person.fullName(),
    type: faker.helpers.arrayElement(['customer', 'supplier', 'both']) as 'customer' | 'supplier' | 'both',
    phone: generatePhone(),
    email: faker.internet.email(),
    gstin: faker.datatype.boolean() ? generateGSTIN() : undefined,
    pan: generatePAN(),
    billing_address_line1: faker.location.streetAddress(),
    billing_city: faker.location.city(),
    billing_state: faker.helpers.arrayElement(Object.keys(INDIAN_STATE_CODES)),
    billing_pincode: faker.string.numeric(6),
    opening_balance: 0,
    opening_balance_type: 'credit',
    ...overrides,
  };
}

export interface ItemData {
  name: string;
  description?: string;
  sku: string;
  hsn_code: string;
  selling_price: number;
  purchase_price: number;
  tax_rate: number;
  inventory_type: string;
  unit?: string;
  opening_stock?: number;
  low_stock_alert?: number;
}

export function createItemData(overrides: Partial<ItemData> = {}): ItemData {
  const purchasePrice = faker.number.int({ min: 50, max: 10000 });
  const margin = faker.number.float({ min: 0.1, max: 0.5 });
  return {
    name: faker.commerce.productName(),
    description: faker.commerce.productDescription(),
    sku: faker.string.alphanumeric({ length: 8, casing: 'upper' }),
    hsn_code: faker.string.numeric(8),
    selling_price: Math.round(purchasePrice * (1 + margin)),
    purchase_price: purchasePrice,
    tax_rate: faker.helpers.arrayElement(VALID_GST_RATES),
    inventory_type: faker.helpers.arrayElement(['trading_goods', 'raw_material', 'finished_goods']),
    unit: faker.helpers.arrayElement(['pcs', 'kg', 'ltr', 'mtr', 'box']),
    opening_stock: faker.number.int({ min: 0, max: 1000 }),
    low_stock_alert: faker.number.int({ min: 5, max: 50 }),
    ...overrides,
  };
}

export interface InvoiceItemData {
  item_id?: string;
  item_name: string;
  item_description?: string;
  hsn_code?: string;
  unit?: string;
  quantity: number;
  unit_price: number;
  discount_percent?: number;
  tax_rate?: number;
  cess_rate?: number;
}

export function createInvoiceItemData(overrides: Partial<InvoiceItemData> = {}): InvoiceItemData {
  return {
    item_name: faker.commerce.productName(),
    item_description: faker.commerce.productDescription(),
    hsn_code: faker.string.numeric(8),
    unit: faker.helpers.arrayElement(['pcs', 'kg', 'ltr', 'mtr', 'box']),
    quantity: faker.number.int({ min: 1, max: 100 }),
    unit_price: faker.number.int({ min: 100, max: 50000 }),
    discount_percent: faker.number.float({ min: 0, max: 20, fractionDigits: 2 }),
    tax_rate: faker.helpers.arrayElement(VALID_GST_RATES),
    cess_rate: 0,
    ...overrides,
  };
}

export interface InvoiceData {
  party_id: string;
  invoice_type: 'sale' | 'purchase' | 'quotation' | 'proforma';
  invoice_date: string;
  due_date?: string;
  place_of_supply?: string;
  is_interstate?: boolean;
  is_export?: boolean;
  is_rcm?: boolean;
  items: InvoiceItemData[];
  terms?: string;
  notes?: string;
}

export function createInvoiceData(partyId: string, overrides: Partial<InvoiceData> = {}): InvoiceData {
  const invoiceDate = new Date();
  const dueDate = new Date(invoiceDate.getTime() + 30 * 24 * 60 * 60 * 1000);
  return {
    party_id: partyId,
    invoice_type: faker.helpers.arrayElement(['sale', 'purchase']) as 'sale' | 'purchase',
    invoice_date: invoiceDate.toISOString().split('T')[0],
    due_date: dueDate.toISOString().split('T')[0],
    is_interstate: faker.datatype.boolean(),
    is_export: false,
    is_rcm: false,
    items: [
      createInvoiceItemData(),
      createInvoiceItemData(),
    ],
    terms: 'Payment due within 30 days',
    notes: 'Thank you for your business',
    ...overrides,
  };
}

export interface PaymentData {
  party_id: string;
  invoice_id?: string;
  transaction_type: 'payment_in' | 'payment_out';
  transaction_date: string;
  amount: number;
  payment_mode: 'cash' | 'bank' | 'upi' | 'cheque' | 'credit' | 'card';
  reference_number?: string;
  bank_name?: string;
  cheque_number?: string;
  cheque_date?: string;
  notes?: string;
}

export function createPaymentData(partyId: string, overrides: Partial<PaymentData> = {}): PaymentData {
  return {
    party_id: partyId,
    transaction_type: faker.helpers.arrayElement(['payment_in', 'payment_out']) as 'payment_in' | 'payment_out',
    transaction_date: new Date().toISOString().split('T')[0],
    amount: faker.number.int({ min: 100, max: 100000 }),
    payment_mode: faker.helpers.arrayElement(['cash', 'bank', 'upi', 'cheque', 'card']) as 'cash' | 'bank' | 'upi' | 'cheque' | 'credit' | 'card',
    reference_number: faker.string.alphanumeric(12).toUpperCase(),
    notes: 'Test payment',
    ...overrides,
  };
}

// =============================================================================
// SQL INJECTION TEST PAYLOADS
// =============================================================================

export const SQL_INJECTION_PAYLOADS = [
  "'; DROP TABLE users; --",
  "' OR '1'='1",
  "' OR '1'='1' --",
  "'; DELETE FROM invoices; --",
  "1'; SELECT * FROM users WHERE '1'='1",
  "admin'--",
  "') OR ('1'='1",
  "'; INSERT INTO users VALUES('hacker', 'hacked'); --",
  "' UNION SELECT * FROM users --",
  "1; UPDATE users SET password='hacked'",
];

// =============================================================================
// XSS TEST PAYLOADS
// =============================================================================

export const XSS_PAYLOADS = [
  '<script>alert("XSS")</script>',
  '<img src="x" onerror="alert(\'XSS\')">',
  '<svg onload="alert(\'XSS\')">',
  '"><script>alert("XSS")</script>',
  '<body onload="alert(\'XSS\')">',
  '<iframe src="javascript:alert(\'XSS\')">',
  '<input onfocus="alert(\'XSS\')" autofocus>',
  '<marquee onstart="alert(\'XSS\')">',
  '<div style="background-image: url(javascript:alert(\'XSS\'))">',
  'javascript:alert("XSS")',
];

// =============================================================================
// DATE HELPERS
// =============================================================================

export function getToday(): string {
  return new Date().toISOString().split('T')[0];
}

export function getFutureDate(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().split('T')[0];
}

export function getPastDate(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().split('T')[0];
}

export function getLeapYearDate(): string {
  return '2024-02-29';
}

export function getInvalidDates(): Array<{ value: string; reason: string }> {
  return [
    { value: '', reason: 'Empty string' },
    { value: '2024-13-01', reason: 'Invalid month (13)' },
    { value: '2024-00-01', reason: 'Invalid month (0)' },
    { value: '2024-01-32', reason: 'Invalid day (32)' },
    { value: '2024-01-00', reason: 'Invalid day (0)' },
    { value: '2023-02-29', reason: 'Feb 29 in non-leap year' },
    { value: '1999-01-01', reason: 'Date before 2000' },
    { value: '2100-01-01', reason: 'Date too far in future' },
    { value: '01-01-2024', reason: 'Wrong format (DD-MM-YYYY)' },
    { value: '2024/01/01', reason: 'Wrong separator' },
    { value: 'invalid-date', reason: 'Non-date string' },
    { value: null as any, reason: 'Null value' },
  ];
}

// =============================================================================
// ASSERTION HELPERS
// =============================================================================

/**
 * Check if response contains error related to field
 */
export function expectValidationError(error: any, field: string): boolean {
  const message = error?.message || error?.response?.message || '';
  return message.toLowerCase().includes(field.toLowerCase()) ||
    (error?.response?.errors || []).some((e: any) =>
      e.field?.toLowerCase() === field.toLowerCase()
    );
}

/**
 * Check GST calculation consistency
 */
export function validateGstCalculation(
  taxableAmount: number,
  cgstAmount: number,
  sgstAmount: number,
  igstAmount: number,
  totalAmount: number,
  isInterstate: boolean
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (isInterstate) {
    if (cgstAmount !== 0 || sgstAmount !== 0) {
      errors.push('CGST/SGST should be 0 for interstate');
    }
    if (igstAmount === 0 && taxableAmount > 0) {
      errors.push('IGST should not be 0 for interstate with positive taxable amount');
    }
  } else {
    if (igstAmount !== 0) {
      errors.push('IGST should be 0 for intrastate');
    }
    if (Math.abs(cgstAmount - sgstAmount) > 0.01) {
      errors.push('CGST and SGST should be equal for intrastate');
    }
  }

  const calculatedTotal = taxableAmount + cgstAmount + sgstAmount + igstAmount;
  if (Math.abs(calculatedTotal - totalAmount) > 0.02) {
    errors.push(`Total mismatch: ${calculatedTotal} vs ${totalAmount}`);
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Round to 2 decimal places
 */
export function roundTo2Decimals(value: number): number {
  return Math.round(value * 100) / 100;
}

// =============================================================================
// CONCURRENT OPERATION HELPERS
// =============================================================================

/**
 * Execute multiple async operations concurrently and return results
 */
export async function executeParallel<T>(
  operations: Array<() => Promise<T>>
): Promise<Array<PromiseSettledResult<T>>> {
  return Promise.allSettled(operations.map(op => op()));
}

/**
 * Count successes and failures from settled results
 */
export function countResults<T>(
  results: Array<PromiseSettledResult<T>>
): { successes: number; failures: number } {
  const successes = results.filter(r => r.status === 'fulfilled').length;
  const failures = results.filter(r => r.status === 'rejected').length;
  return { successes, failures };
}

/**
 * Get successful values from settled results
 */
export function getSuccessfulValues<T>(
  results: Array<PromiseSettledResult<T>>
): T[] {
  return results
    .filter((r): r is PromiseFulfilledResult<T> => r.status === 'fulfilled')
    .map(r => r.value);
}

// =============================================================================
// PERFORMANCE HELPERS
// =============================================================================

/**
 * Measure execution time of an async function
 */
export async function measureTime<T>(
  fn: () => Promise<T>
): Promise<{ result: T; duration: number }> {
  const start = Date.now();
  const result = await fn();
  const duration = Date.now() - start;
  return { result, duration };
}

/**
 * Get current memory usage in MB
 */
export function getMemoryUsageMB(): number {
  if (typeof process !== 'undefined') {
    return process.memoryUsage().heapUsed / 1024 / 1024;
  }
  return 0;
}
