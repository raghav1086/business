/**
 * Test Data Factory
 * 
 * Creates test data for integration tests.
 */

export class TestDataFactory {
  /**
   * Create test user data
   */
  static createUser(overrides?: Partial<any>) {
    return {
      phone: '9876543210',
      name: 'Test User',
      email: 'test@example.com',
      ...overrides,
    };
  }

  /**
   * Create test business data
   */
  static createBusiness(overrides?: Partial<any>) {
    return {
      name: 'Test Business',
      type: 'proprietorship',
      gstin: '27AABCU9603R1ZX',
      pan: 'AABCU9603R',
      phone: '9876543210',
      email: 'business@example.com',
      address_line1: '123 Test Street',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400001',
      ...overrides,
    };
  }

  /**
   * Create test party data
   */
  static createParty(overrides?: Partial<any>) {
    return {
      name: 'Test Party',
      type: 'customer',
      phone: '9876543211',
      email: 'party@example.com',
      gstin: '27AABCU9603R1ZY',
      pan: 'AABCU9603R',
      billing_address_line1: '456 Party Street',
      billing_city: 'Mumbai',
      billing_state: 'Maharashtra',
      billing_pincode: '400002',
      shipping_same_as_billing: true,
      ...overrides,
    };
  }

  /**
   * Create test item data
   */
  static createItem(overrides?: Partial<any>) {
    return {
      name: 'Test Item',
      selling_price: 100,
      purchase_price: 80,
      current_stock: 100,
      track_stock: true,
      tax_rate: 18,
      ...overrides,
    };
  }

  /**
   * Create test invoice data
   */
  static createInvoice(overrides?: Partial<any>) {
    return {
      party_id: 'party-id',
      invoice_type: 'sale',
      invoice_date: '2024-01-01',
      is_interstate: false,
      items: [
        {
          item_name: 'Test Item',
          quantity: 10,
          unit_price: 100,
          tax_rate: 18,
        },
      ],
      ...overrides,
    };
  }

  /**
   * Create test payment data
   */
  static createPayment(overrides?: Partial<any>) {
    return {
      party_id: 'party-id',
      transaction_type: 'payment_in',
      transaction_date: '2024-01-01',
      amount: 1000,
      payment_mode: 'cash',
      ...overrides,
    };
  }

  /**
   * Generate random phone number
   */
  static randomPhone(): string {
    return `98765${Math.floor(Math.random() * 100000)
      .toString()
      .padStart(5, '0')}`;
  }

  /**
   * Generate random GSTIN
   */
  static randomGSTIN(): string {
    const stateCode = '27';
    const pan = 'AABCU9603R';
    const entityNumber = Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, '0');
    const checkDigit = 'Z';
    const randomChar = String.fromCharCode(
      65 + Math.floor(Math.random() * 26)
    );
    return `${stateCode}${pan}${entityNumber}${checkDigit}${randomChar}`;
  }
}

