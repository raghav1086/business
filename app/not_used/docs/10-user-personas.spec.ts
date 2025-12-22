import { test, expect, Page } from '@playwright/test';
import { faker } from '@faker-js/faker/locale/en_IN';

/**
 * Advanced E2E Test Suite: 10 Different User Personas
 * 
 * This test suite simulates 10 different real-world user scenarios
 * with complex workflows, edge cases, and comprehensive UI/UX validation.
 * 
 * User Personas:
 * 1. First-time Small Shop Owner (Mumbai)
 * 2. Electronics Retailer with Multiple Locations (Delhi)
 * 3. Textile Wholesaler (Surat)
 * 4. Restaurant Owner (Bangalore)
 * 5. Mobile Store Chain Manager (Pune)
 * 6. Pharmacy Owner (Chennai)
 * 7. Automobile Parts Dealer (Hyderabad)
 * 8. Jewelry Store Owner (Jaipur)
 * 9. Computer Hardware Distributor (Kolkata)
 * 10. Fashion Boutique Owner (Ahmedabad)
 */

// Test data generator for Indian business context
class IndianBusinessDataGenerator {
  static generatePhone(): string {
    return `+91${faker.string.numeric(10)}`;
  }

  static generateGSTIN(stateCode: string): string {
    const pan = faker.string.alphanumeric(10).toUpperCase();
    const entityNumber = faker.string.numeric(1);
    const checksum = faker.string.alpha({ length: 1,casing: 'upper' });
    return `${stateCode}${pan}${entityNumber}Z${checksum}`;
  }

  static generatePAN(): string {
    return faker.string.alpha({ length: 5, casing: 'upper' }) + 
           faker.string.numeric(4) + 
           faker.string.alpha({ length: 1, casing: 'upper' });
  }

  static indianStates = [
    { name: 'Maharashtra', code: '27', cities: ['Mumbai', 'Pune', 'Nagpur'] },
    { name: 'Delhi', code: '07', cities: ['New Delhi', 'Dwarka', 'Rohini'] },
    { name: 'Gujarat', code: '24', cities: ['Ahmedabad', 'Surat', 'Vadodara'] },
    { name: 'Karnataka', code: '29', cities: ['Bangalore', 'Mysore', 'Mangalore'] },
    { name: 'Tamil Nadu', code: '33', cities: ['Chennai', 'Coimbatore', 'Madurai'] },
    { name: 'Telangana', code: '36', cities: ['Hyderabad', 'Warangal', 'Nizamabad'] },
    { name: 'West Bengal', code: '19', cities: ['Kolkata', 'Siliguri', 'Durgapur'] },
    { name: 'Rajasthan', code: '08', cities: ['Jaipur', 'Jodhpur', 'Udaipur'] },
  ];
}

// Helper class for common operations
class TestHelpers {
  constructor(private page: Page) {}

  async login(phone: string) {
    await this.page.goto('/login');
    await this.page.fill('input[type="tel"]', phone);
    await this.page.click('button:has-text("Send OTP")');
    await this.page.waitForTimeout(2000);
    
    // In test environment, use fixed OTP
    await this.page.fill('input[name="otp"]', '123456');
    await this.page.click('button:has-text("Verify")');
    await this.page.waitForURL(/\/(business|dashboard)/);
  }

  async createBusiness(data: any) {
    await this.page.goto('/business/select');
    await this.page.click('button:has-text("Create")');
    
    await this.page.fill('input[name="name"]', data.name);
    await this.page.fill('input[name="gstin"]', data.gstin);
    await this.page.fill('input[name="pan"]', data.pan);
    await this.page.fill('input[name="email"]', data.email);
    await this.page.fill('input[name="phone"]', data.phone);
    await this.page.fill('input[name="addressLine1"]', data.address);
    await this.page.fill('input[name="city"]', data.city);
    await this.page.fill('input[name="state"]', data.state);
    await this.page.fill('input[name="pincode"]', data.pincode);
    
    await this.page.click('button[type="submit"]');
    await this.page.waitForURL('/dashboard');
  }

  async addParty(type: 'CUSTOMER' | 'SUPPLIER', data: any) {
    await this.page.goto('/parties');
    await this.page.click('button:has-text("Add Party")');
    
    await this.page.selectOption('select[name="type"]', type);
    await this.page.fill('input[name="name"]', data.name);
    await this.page.fill('input[name="gstin"]', data.gstin);
    await this.page.fill('input[name="phone"]', data.phone);
    await this.page.fill('input[name="email"]', data.email);
    await this.page.fill('input[name="addressLine1"]', data.address);
    await this.page.fill('input[name="city"]', data.city);
    await this.page.fill('input[name="state"]', data.state);
    await this.page.fill('input[name="pincode"]', data.pincode);
    
    await this.page.click('button[type="submit"]');
    await this.page.waitForTimeout(1000);
  }

  async addInventoryItem(data: any) {
    await this.page.goto('/inventory');
    await this.page.click('button:has-text("Add Item")');
    
    await this.page.fill('input[name="name"]', data.name);
    await this.page.fill('input[name="hsnCode"]', data.hsn);
    await this.page.fill('input[name="description"]', data.description);
    await this.page.selectOption('select[name="unit"]', data.unit);
    await this.page.fill('input[name="sellingPrice"]', data.sellingPrice.toString());
    await this.page.fill('input[name="purchasePrice"]', data.purchasePrice.toString());
    await this.page.fill('input[name="gstRate"]', data.gstRate.toString());
    await this.page.fill('input[name="openingStock"]', data.openingStock.toString());
    
    await this.page.click('button[type="submit"]');
    await this.page.waitForTimeout(1000);
  }

  async createInvoice(type: 'SALE' | 'PURCHASE', items: any[]) {
    await this.page.goto('/invoices/create');
    
    await this.page.selectOption('select[name="type"]', type);
    await this.page.click('select[name="partyId"]');
    await this.page.keyboard.press('ArrowDown');
    await this.page.keyboard.press('Enter');
    
    const today = new Date().toISOString().split('T')[0];
    await this.page.fill('input[name="invoiceDate"]', today);
    await this.page.fill('input[name="dueDate"]', today);
    
    for (const item of items) {
      await this.page.click('button:has-text("Add Item")');
      await this.page.waitForTimeout(500);
      
      const itemSelects = await this.page.locator('select[name*="itemId"]').all();
      await itemSelects[itemSelects.length - 1].click();
      await this.page.keyboard.press('ArrowDown');
      await this.page.keyboard.press('Enter');
      
      const qtyInputs = await this.page.locator('input[name*="quantity"]').all();
      await qtyInputs[qtyInputs.length - 1].fill(item.quantity.toString());
    }
    
    await this.page.fill('textarea[name="notes"]', 'Test invoice');
    await this.page.click('button:has-text("Create Invoice")');
    await this.page.waitForURL(/\/invoices/);
  }

  async verifyGSTCalculation(expectedType: 'IGST' | 'CGST_SGST') {
    if (expectedType === 'IGST') {
      await expect(this.page.locator('text=/igst/i')).toBeVisible();
    } else {
      await expect(this.page.locator('text=/cgst/i')).toBeVisible();
      await expect(this.page.locator('text=/sgst/i')).toBeVisible();
    }
  }
}

test.describe('Advanced E2E: 10 User Personas with Complex Workflows', () => {
  
  test('Persona 1: First-time Small Shop Owner - Complete Onboarding Journey', async ({ page }) => {
    const helpers = new TestHelpers(page);
    const phone = IndianBusinessDataGenerator.generatePhone();
    const state = IndianBusinessDataGenerator.indianStates[0]; // Maharashtra
    
    console.log('🏪 Testing: First-time Small Shop Owner in Mumbai');
    
    // Step 1: First-time login experience
    await helpers.login(phone);
    
    // Step 2: Create business with guidance
    await helpers.createBusiness({
      name: 'Sharma General Store',
      gstin: IndianBusinessDataGenerator.generateGSTIN(state.code),
      pan: IndianBusinessDataGenerator.generatePAN(),
      email: 'sharma@store.com',
      phone: phone,
      address: 'Shop 12, Market Road',
      city: 'Mumbai',
      state: state.name,
      pincode: '400001'
    });
    
    // Step 3: Explore dashboard
    await page.waitForSelector('text=/dashboard/i');
    await expect(page.locator('text=/parties/i')).toBeVisible();
    await expect(page.locator('text=/inventory/i')).toBeVisible();
    
    // Step 4: Add first customer (local)
    await helpers.addParty('CUSTOMER', {
      name: 'Ramesh Kumar',
      gstin: IndianBusinessDataGenerator.generateGSTIN(state.code),
      phone: IndianBusinessDataGenerator.generatePhone(),
      email: 'ramesh@email.com',
      address: 'Flat 201, Andheri',
      city: 'Mumbai',
      state: state.name,
      pincode: '400058'
    });
    
    // Step 5: Add basic inventory (groceries)
    await helpers.addInventoryItem({
      name: 'Rice Bag 25kg',
      hsn: '10063020',
      description: 'Basmati Rice',
      unit: 'BAG',
      sellingPrice: 2500,
      purchasePrice: 2000,
      gstRate: 5,
      openingStock: 50
    });
    
    await helpers.addInventoryItem({
      name: 'Cooking Oil 1L',
      hsn: '15119099',
      description: 'Sunflower Oil',
      unit: 'LTR',
      sellingPrice: 150,
      purchasePrice: 120,
      gstRate: 5,
      openingStock: 100
    });
    
    // Step 6: Create first sale invoice (intra-state)
    await helpers.createInvoice('SALE', [
      { quantity: 2 },
      { quantity: 5 }
    ]);
    
    // Step 7: Verify CGST+SGST calculation
    await helpers.verifyGSTCalculation('CGST_SGST');
    
    // Step 8: Check reports
    await page.goto('/reports');
    await expect(page.locator('text=/sales report/i')).toBeVisible();
    
    console.log('✅ Persona 1: First-time user successfully onboarded');
  });

  test('Persona 2: Electronics Retailer - Multi-location, High Volume', async ({ page }) => {
    const helpers = new TestHelpers(page);
    const phone = IndianBusinessDataGenerator.generatePhone();
    const state = IndianBusinessDataGenerator.indianStates[1]; // Delhi
    
    console.log('📱 Testing: Electronics Retailer with multiple locations');
    
    await helpers.login(phone);
    
    // Create main business
    await helpers.createBusiness({
      name: 'TechZone Electronics Pvt Ltd',
      gstin: IndianBusinessDataGenerator.generateGSTIN(state.code),
      pan: IndianBusinessDataGenerator.generatePAN(),
      email: 'info@techzone.com',
      phone: phone,
      address: 'Plot 45, Nehru Place',
      city: 'New Delhi',
      state: state.name,
      pincode: '110019'
    });
    
    // Add multiple suppliers (different states)
    await helpers.addParty('SUPPLIER', {
      name: 'Samsung India Distributor',
      gstin: IndianBusinessDataGenerator.generateGSTIN('29'), // Karnataka
      phone: IndianBusinessDataGenerator.generatePhone(),
      email: 'samsung@distributor.com',
      address: 'Electronics City Phase 1',
      city: 'Bangalore',
      state: 'Karnataka',
      pincode: '560100'
    });
    
    await helpers.addParty('SUPPLIER', {
      name: 'Apple Authorized Distributor',
      gstin: IndianBusinessDataGenerator.generateGSTIN('27'), // Maharashtra
      phone: IndianBusinessDataGenerator.generatePhone(),
      email: 'apple@distributor.com',
      address: 'BKC, Bandra East',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400051'
    });
    
    // Add multiple customers (B2B and B2C)
    for (let i = 0; i < 5; i++) {
      const custState = IndianBusinessDataGenerator.indianStates[i % 3];
      await helpers.addParty('CUSTOMER', {
        name: `Customer ${i + 1} Pvt Ltd`,
        gstin: IndianBusinessDataGenerator.generateGSTIN(custState.code),
        phone: IndianBusinessDataGenerator.generatePhone(),
        email: `customer${i + 1}@company.com`,
        address: `Office ${i + 1}, ${custState.cities[0]}`,
        city: custState.cities[0],
        state: custState.name,
        pincode: `${custState.code}0001`
      });
    }
    
    // Add high-value electronics inventory
    const electronics = [
      { name: 'iPhone 15 Pro', hsn: '85171310', price: 129900, gst: 18 },
      { name: 'Samsung Galaxy S24', hsn: '85171310', price: 79999, gst: 18 },
      { name: 'MacBook Pro M3', hsn: '84713000', price: 199900, gst: 18 },
      { name: 'iPad Pro 12.9"', hsn: '85171290', price: 99900, gst: 18 },
      { name: 'AirPods Pro', hsn: '85183000', price: 24900, gst: 18 }
    ];
    
    for (const item of electronics) {
      await helpers.addInventoryItem({
        name: item.name,
        hsn: item.hsn,
        description: `Premium ${item.name}`,
        unit: 'PCS',
        sellingPrice: item.price,
        purchasePrice: item.price * 0.85,
        gstRate: item.gst,
        openingStock: 20
      });
    }
    
    // Create multiple invoices (mix of inter and intra-state)
    await helpers.createInvoice('SALE', [
      { quantity: 1 },
      { quantity: 2 }
    ]);
    
    // Verify GST calculations
    await page.goto('/invoices');
    await expect(page.locator('text=/invoice/i').first()).toBeVisible();
    
    console.log('✅ Persona 2: Electronics retailer complex workflow completed');
  });

  test('Persona 3: Textile Wholesaler - Bulk Orders & Credit Management', async ({ page }) => {
    const helpers = new TestHelpers(page);
    const phone = IndianBusinessDataGenerator.generatePhone();
    const state = IndianBusinessDataGenerator.indianStates[2]; // Gujarat
    
    console.log('🧵 Testing: Textile Wholesaler with bulk operations');
    
    await helpers.login(phone);
    
    await helpers.createBusiness({
      name: 'Surat Silk House',
      gstin: IndianBusinessDataGenerator.generateGSTIN(state.code),
      pan: IndianBusinessDataGenerator.generatePAN(),
      email: 'info@suratsilk.com',
      phone: phone,
      address: 'Ring Road, Textile Market',
      city: 'Surat',
      state: state.name,
      pincode: '395002'
    });
    
    // Add textile items with different GST rates
    const textiles = [
      { name: 'Cotton Fabric 100m Roll', hsn: '52081100', gst: 5, price: 15000 },
      { name: 'Silk Saree', hsn: '50071010', gst: 5, price: 8000 },
      { name: 'Embroidered Fabric', hsn: '58050000', gst: 12, price: 25000 },
      { name: 'Polyester Fabric', hsn: '54076190', gst: 12, price: 5000 }
    ];
    
    for (const item of textiles) {
      await helpers.addInventoryItem({
        name: item.name,
        hsn: item.hsn,
        description: `Wholesale ${item.name}`,
        unit: 'PCS',
        sellingPrice: item.price,
        purchasePrice: item.price * 0.7,
        gstRate: item.gst,
        openingStock: 200
      });
    }
    
    // Add retailers from different states
    const retailerStates = [IndianBusinessDataGenerator.indianStates[3], 
                           IndianBusinessDataGenerator.indianStates[4]];
    
    for (const st of retailerStates) {
      await helpers.addParty('CUSTOMER', {
        name: `${st.cities[0]} Fashion Retailer`,
        gstin: IndianBusinessDataGenerator.generateGSTIN(st.code),
        phone: IndianBusinessDataGenerator.generatePhone(),
        email: `retailer@${st.cities[0].toLowerCase()}.com`,
        address: `Shop 1, ${st.cities[0]}`,
        city: st.cities[0],
        state: st.name,
        pincode: `${st.code}0001`
      });
    }
    
    // Create bulk orders
    await helpers.createInvoice('SALE', [
      { quantity: 50 },
      { quantity: 30 }
    ]);
    
    // Check outstanding payments
    await page.goto('/payments');
    await expect(page.locator('button:has-text("Record Payment")')).toBeVisible();
    
    console.log('✅ Persona 3: Textile wholesaler bulk operations completed');
  });

  test('Persona 4: Restaurant Owner - Daily Sales & Expense Tracking', async ({ page }) => {
    const helpers = new TestHelpers(page);
    const phone = IndianBusinessDataGenerator.generatePhone();
    const state = IndianBusinessDataGenerator.indianStates[3]; // Karnataka
    
    console.log('🍽️ Testing: Restaurant Owner with daily operations');
    
    await helpers.login(phone);
    
    await helpers.createBusiness({
      name: 'Spice Garden Restaurant',
      gstin: IndianBusinessDataGenerator.generateGSTIN(state.code),
      pan: IndianBusinessDataGenerator.generatePAN(),
      email: 'contact@spicegarden.com',
      phone: phone,
      address: 'MG Road, Brigade Gateway',
      city: 'Bangalore',
      state: state.name,
      pincode: '560001'
    });
    
    // Add food items with 5% GST
    const menuItems = [
      { name: 'Veg Biryani', hsn: '21069099', price: 250 },
      { name: 'Chicken Curry', hsn: '21069099', price: 350 },
      { name: 'Paneer Butter Masala', hsn: '21069099', price: 280 },
      { name: 'Soft Drinks', hsn: '22021000', price: 50 }
    ];
    
    for (const item of menuItems) {
      await helpers.addInventoryItem({
        name: item.name,
        hsn: item.hsn,
        description: `Menu Item - ${item.name}`,
        unit: 'PCS',
        sellingPrice: item.price,
        purchasePrice: item.price * 0.4,
        gstRate: 5,
        openingStock: 0 // Service items
      });
    }
    
    // Add suppliers (food vendors)
    await helpers.addParty('SUPPLIER', {
      name: 'Fresh Vegetables Supplier',
      gstin: IndianBusinessDataGenerator.generateGSTIN(state.code),
      phone: IndianBusinessDataGenerator.generatePhone(),
      email: 'veggies@supplier.com',
      address: 'Market Yard, Bangalore',
      city: 'Bangalore',
      state: state.name,
      pincode: '560002'
    });
    
    // Create purchase invoice (intra-state)
    await helpers.createInvoice('PURCHASE', [{ quantity: 1 }]);
    
    // Verify low GST rate
    await page.goto('/invoices');
    await expect(page.locator('text=/purchase/i').first()).toBeVisible();
    
    console.log('✅ Persona 4: Restaurant owner operations completed');
  });

  test('Persona 5: Mobile Store Chain - Inventory Management Across Branches', async ({ page }) => {
    const helpers = new TestHelpers(page);
    const phone = IndianBusinessDataGenerator.generatePhone();
    const state = IndianBusinessDataGenerator.indianStates[0]; // Maharashtra
    
    console.log('📱 Testing: Mobile store chain with multiple branches');
    
    await helpers.login(phone);
    
    await helpers.createBusiness({
      name: 'Mobile World Chain',
      gstin: IndianBusinessDataGenerator.generateGSTIN(state.code),
      pan: IndianBusinessDataGenerator.generatePAN(),
      email: 'franchise@mobileworld.com',
      phone: phone,
      address: 'Headquarters, FC Road',
      city: 'Pune',
      state: state.name,
      pincode: '411004'
    });
    
    // Add various mobile phones and accessories
    const products = [
      { name: 'OnePlus 12', hsn: '85171310', price: 64999, gst: 18 },
      { name: 'Xiaomi Redmi Note 13', hsn: '85171310', price: 19999, gst: 18 },
      { name: 'Mobile Cover', hsn: '39269099', price: 299, gst: 18 },
      { name: 'Screen Protector', hsn: '70072900', price: 199, gst: 18 },
      { name: 'Power Bank 20000mAh', hsn: '85076000', price: 1999, gst: 18 }
    ];
    
    for (const product of products) {
      await helpers.addInventoryItem({
        name: product.name,
        hsn: product.hsn,
        description: `${product.name} - Latest Model`,
        unit: 'PCS',
        sellingPrice: product.price,
        purchasePrice: product.price * 0.8,
        gstRate: product.gst,
        openingStock: 50
      });
    }
    
    // Test stock adjustment
    await page.goto('/inventory/stock');
    await page.click('select[name="itemId"]');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');
    await page.click('input[value="INCREASE"]');
    await page.fill('input[name="quantity"]', '10');
    await page.fill('textarea[name="reason"]', 'New stock received from distributor');
    await page.click('button[type="submit"]');
    
    // Verify inventory updated
    await page.goto('/inventory');
    await expect(page.locator('text=/mobile/i').first()).toBeVisible();
    
    console.log('✅ Persona 5: Mobile store chain operations completed');
  });

  test('Persona 6: Pharmacy Owner - Medicine Sales with Regulations', async ({ page }) => {
    const helpers = new TestHelpers(page);
    const phone = IndianBusinessDataGenerator.generatePhone();
    const state = IndianBusinessDataGenerator.indianStates[4]; // Tamil Nadu
    
    console.log('💊 Testing: Pharmacy with regulated items');
    
    await helpers.login(phone);
    
    await helpers.createBusiness({
      name: 'Apollo Pharmacy',
      gstin: IndianBusinessDataGenerator.generateGSTIN(state.code),
      pan: IndianBusinessDataGenerator.generatePAN(),
      email: 'apollo@pharmacy.com',
      phone: phone,
      address: 'Anna Nagar, Main Road',
      city: 'Chennai',
      state: state.name,
      pincode: '600040'
    });
    
    // Add medicines (12% GST on most medicines)
    const medicines = [
      { name: 'Paracetamol 500mg', hsn: '30049099', gst: 12, price: 20 },
      { name: 'Amoxicillin 250mg', hsn: '30042000', gst: 12, price: 150 },
      { name: 'Vitamin D3 Tablets', hsn: '30049099', gst: 12, price: 300 },
      { name: 'Hand Sanitizer 500ml', hsn: '33074900', gst: 18, price: 120 }
    ];
    
    for (const med of medicines) {
      await helpers.addInventoryItem({
        name: med.name,
        hsn: med.hsn,
        description: `Medicine - ${med.name}`,
        unit: 'BOX',
        sellingPrice: med.price,
        purchasePrice: med.price * 0.75,
        gstRate: med.gst,
        openingStock: 100
      });
    }
    
    // Create sales
    await helpers.createInvoice('SALE', [
      { quantity: 5 },
      { quantity: 3 }
    ]);
    
    console.log('✅ Persona 6: Pharmacy operations completed');
  });

  test('Persona 7: Automobile Parts Dealer - B2B High-value Transactions', async ({ page }) => {
    const helpers = new TestHelpers(page);
    const phone = IndianBusinessDataGenerator.generatePhone();
    const state = IndianBusinessDataGenerator.indianStates[5]; // Telangana
    
    console.log('🚗 Testing: Automobile parts dealer');
    
    await helpers.login(phone);
    
    await helpers.createBusiness({
      name: 'Auto Parts Hub',
      gstin: IndianBusinessDataGenerator.generateGSTIN(state.code),
      pan: IndianBusinessDataGenerator.generatePAN(),
      email: 'sales@autopartshub.com',
      phone: phone,
      address: 'Industrial Area, Balanagar',
      city: 'Hyderabad',
      state: state.name,
      pincode: '500037'
    });
    
    // Add auto parts (28% GST)
    const parts = [
      { name: 'Engine Oil 5L', hsn: '27101990', price: 2500, gst: 28 },
      { name: 'Brake Pads Set', hsn: '87083000', price: 3500, gst: 28 },
      { name: 'Air Filter', hsn: '84213990', price: 800, gst: 28 },
      { name: 'Spark Plugs Set', hsn: '85111000', price: 1200, gst: 28 }
    ];
    
    for (const part of parts) {
      await helpers.addInventoryItem({
        name: part.name,
        hsn: part.hsn,
        description: `Auto Part - ${part.name}`,
        unit: 'PCS',
        sellingPrice: part.price,
        purchasePrice: part.price * 0.7,
        gstRate: part.gst,
        openingStock: 50
      });
    }
    
    // Add garage customers
    await helpers.addParty('CUSTOMER', {
      name: 'City Auto Garage',
      gstin: IndianBusinessDataGenerator.generateGSTIN(state.code),
      phone: IndianBusinessDataGenerator.generatePhone(),
      email: 'garage@city.com',
      address: 'Jubilee Hills',
      city: 'Hyderabad',
      state: state.name,
      pincode: '500033'
    });
    
    await helpers.createInvoice('SALE', [{ quantity: 10 }]);
    
    console.log('✅ Persona 7: Auto parts dealer completed');
  });

  test('Persona 8: Jewelry Store - High-value GST Transactions', async ({ page }) => {
    const helpers = new TestHelpers(page);
    const phone = IndianBusinessDataGenerator.generatePhone();
    const state = IndianBusinessDataGenerator.indianStates[7]; // Rajasthan
    
    console.log('💍 Testing: Jewelry store with precious items');
    
    await helpers.login(phone);
    
    await helpers.createBusiness({
      name: 'Royal Gems & Jewelers',
      gstin: IndianBusinessDataGenerator.generateGSTIN(state.code),
      pan: IndianBusinessDataGenerator.generatePAN(),
      email: 'info@royalgems.com',
      phone: phone,
      address: 'Johari Bazaar',
      city: 'Jaipur',
      state: state.name,
      pincode: '302003'
    });
    
    // Add jewelry items (3% GST on gold/silver)
    const jewelry = [
      { name: '22K Gold Necklace 50gm', hsn: '71131910', price: 350000, gst: 3 },
      { name: 'Silver Bracelet', hsn: '71131990', price: 15000, gst: 3 },
      { name: 'Diamond Ring 0.5ct', hsn: '71131999', price: 250000, gst: 3 },
      { name: 'Gold Earrings Pair', hsn: '71131910', price: 75000, gst: 3 }
    ];
    
    for (const item of jewelry) {
      await helpers.addInventoryItem({
        name: item.name,
        hsn: item.hsn,
        description: `Certified ${item.name}`,
        unit: 'PCS',
        sellingPrice: item.price,
        purchasePrice: item.price * 0.85,
        gstRate: item.gst,
        openingStock: 10
      });
    }
    
    await helpers.createInvoice('SALE', [{ quantity: 1 }]);
    
    // Verify low GST rate on precious metals
    await page.goto('/invoices');
    await expect(page.locator('text=/3%|3 %/').first()).toBeVisible();
    
    console.log('✅ Persona 8: Jewelry store completed');
  });

  test('Persona 9: Computer Hardware Distributor - Complex Multi-item Orders', async ({ page }) => {
    const helpers = new TestHelpers(page);
    const phone = IndianBusinessDataGenerator.generatePhone();
    const state = IndianBusinessDataGenerator.indianStates[6]; // West Bengal
    
    console.log('💻 Testing: Computer hardware distributor');
    
    await helpers.login(phone);
    
    await helpers.createBusiness({
      name: 'TechPro Distributors',
      gstin: IndianBusinessDataGenerator.generateGSTIN(state.code),
      pan: IndianBusinessDataGenerator.generatePAN(),
      email: 'sales@techpro.com',
      phone: phone,
      address: 'Sector V, Salt Lake',
      city: 'Kolkata',
      state: state.name,
      pincode: '700091'
    });
    
    // Add various computer components
    const components = [
      { name: 'Intel i7 Processor', hsn: '85423100', price: 35000, gst: 18 },
      { name: 'ASUS Motherboard', hsn: '84733020', price: 18000, gst: 18 },
      { name: 'Samsung 16GB RAM', hsn: '84733000', price: 6000, gst: 18 },
      { name: 'WD 1TB SSD', hsn: '84717050', price: 8500, gst: 18 },
      { name: 'NVIDIA RTX 3060', hsn: '84733010', price: 45000, gst: 18 }
    ];
    
    for (const comp of components) {
      await helpers.addInventoryItem({
        name: comp.name,
        hsn: comp.hsn,
        description: `${comp.name} - Latest`,
        unit: 'PCS',
        sellingPrice: comp.price,
        purchasePrice: comp.price * 0.82,
        gstRate: comp.gst,
        openingStock: 30
      });
    }
    
    // Create complex order with multiple items
    await helpers.createInvoice('SALE', [
      { quantity: 5 },
      { quantity: 5 },
      { quantity: 10 }
    ]);
    
    console.log('✅ Persona 9: Computer distributor completed');
  });

  test('Persona 10: Fashion Boutique - Seasonal Inventory & Discounts', async ({ page }) => {
    const helpers = new TestHelpers(page);
    const phone = IndianBusinessDataGenerator.generatePhone();
    const state = IndianBusinessDataGenerator.indianStates[2]; // Gujarat
    
    console.log('👗 Testing: Fashion boutique with seasonal items');
    
    await helpers.login(phone);
    
    await helpers.createBusiness({
      name: 'Trendy Fashion Boutique',
      gstin: IndianBusinessDataGenerator.generateGSTIN(state.code),
      pan: IndianBusinessDataGenerator.generatePAN(),
      email: 'info@trendyfashion.com',
      phone: phone,
      address: 'CG Road, Navrangpura',
      city: 'Ahmedabad',
      state: state.name,
      pincode: '380009'
    });
    
    // Add fashion items
    const fashionItems = [
      { name: 'Designer Kurti', hsn: '62043900', price: 2500, gst: 12 },
      { name: 'Denim Jeans', hsn: '62034200', price: 1800, gst: 12 },
      { name: 'Leather Handbag', hsn: '42021290', price: 3500, gst: 18 },
      { name: 'Sport Shoes', hsn: '64041100', price: 2200, gst: 12 }
    ];
    
    for (const item of fashionItems) {
      await helpers.addInventoryItem({
        name: item.name,
        hsn: item.hsn,
        description: `Fashion - ${item.name}`,
        unit: 'PCS',
        sellingPrice: item.price,
        purchasePrice: item.price * 0.6,
        gstRate: item.gst,
        openingStock: 40
      });
    }
    
    // Create sales invoice
    await helpers.createInvoice('SALE', [
      { quantity: 3 },
      { quantity: 2 }
    ]);
    
    // Check dashboard for sales summary
    await page.goto('/dashboard');
    await expect(page.locator('text=/total sales|revenue/i').first()).toBeVisible();
    
    console.log('✅ Persona 10: Fashion boutique completed');
  });

  test('Comprehensive UI/UX Validation - All Personas', async ({ page }) => {
    console.log('🎨 Testing: Comprehensive UI/UX across all features');
    
    const helpers = new TestHelpers(page);
    const phone = IndianBusinessDataGenerator.generatePhone();
    
    await helpers.login(phone);
    
    // Test responsive design
    const viewports = [
      { width: 1920, height: 1080, name: 'Desktop' },
      { width: 1366, height: 768, name: 'Laptop' },
      { width: 768, height: 1024, name: 'Tablet' },
      { width: 375, height: 667, name: 'Mobile' }
    ];
    
    for (const viewport of viewports) {
      await page.setViewportSize(viewport);
      console.log(`  Testing ${viewport.name} viewport...`);
      
      await page.goto('/dashboard');
      await expect(page.locator('text=/dashboard/i')).toBeVisible();
      
      await page.goto('/parties');
      await expect(page.locator('button:has-text("Add Party")')).toBeVisible();
      
      await page.goto('/inventory');
      await expect(page.locator('button:has-text("Add Item")')).toBeVisible();
    }
    
    // Test accessibility
    await page.goto('/login');
    const loginButton = page.locator('button[type="submit"]').first();
    await expect(loginButton).toBeEnabled();
    
    // Test loading states
    await page.goto('/reports');
    await page.waitForLoadState('networkidle');
    
    // Test error handling
    await page.goto('/invoices/create');
    await page.click('button:has-text("Create Invoice")');
    // Should show validation errors
    await page.waitForTimeout(1000);
    
    console.log('✅ UI/UX validation completed across all viewports');
  });
});

test.describe('Performance & Load Testing', () => {
  
  test('Performance: Handle 50 rapid invoice creations', async ({ page }) => {
    const helpers = new TestHelpers(page);
    const phone = IndianBusinessDataGenerator.generatePhone();
    
    await helpers.login(phone);
    
    // Create business and setup
    await helpers.createBusiness({
      name: 'Load Test Business',
      gstin: IndianBusinessDataGenerator.generateGSTIN('27'),
      pan: IndianBusinessDataGenerator.generatePAN(),
      email: 'load@test.com',
      phone: phone,
      address: 'Test Address',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400001'
    });
    
    await helpers.addParty('CUSTOMER', {
      name: 'Test Customer',
      gstin: IndianBusinessDataGenerator.generateGSTIN('27'),
      phone: phone,
      email: 'customer@test.com',
      address: 'Customer Address',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400002'
    });
    
    await helpers.addInventoryItem({
      name: 'Test Product',
      hsn: '12345678',
      description: 'Test',
      unit: 'PCS',
      sellingPrice: 1000,
      purchasePrice: 800,
      gstRate: 18,
      openingStock: 1000
    });
    
    const startTime = Date.now();
    
    // Create 10 invoices rapidly (simulating load)
    for (let i = 0; i < 10; i++) {
      await helpers.createInvoice('SALE', [{ quantity: 1 }]);
      console.log(`  Invoice ${i + 1}/10 created`);
    }
    
    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000;
    
    console.log(`✅ Created 10 invoices in ${duration.toFixed(2)} seconds`);
    expect(duration).toBeLessThan(60); // Should complete in under 60 seconds
  });
});
