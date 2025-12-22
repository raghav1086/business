import { test, expect } from '@playwright/test';

/**
 * E2E Test Suite: Complete User Journey
 * 
 * This test suite validates the complete end-to-end user flow:
 * 1. Authentication (Login with OTP)
 * 2. Business Creation
 * 3. Party Management (Customer/Supplier)
 * 4. Inventory Management
 * 5. Invoice Creation with GST calculations
 * 6. Payment Recording
 * 7. Reports Verification
 */

// Test data that will be reused across tests
const testData = {
  user: {
    phone: '+919876543210',
    otp: '123456', // In real scenario, this would be fetched from email/logs
  },
  business: {
    name: 'Test Electronics Store',
    gstin: '27AABCU9603R1ZM', // Valid test GSTIN format
    pan: 'AABCU9603R',
    email: 'test@electronics.com',
    phone: '+919876543210',
    addressLine1: 'Shop No 15, Market Street',
    addressLine2: 'Andheri West',
    city: 'Mumbai',
    state: 'Maharashtra',
    pincode: '400058',
  },
  customer: {
    name: 'Rajesh Kumar',
    gstin: '29AABCU9603R1ZN', // Karnataka GSTIN
    phone: '+919876543211',
    email: 'rajesh@example.com',
    addressLine1: 'No 45, Brigade Road',
    city: 'Bangalore',
    state: 'Karnataka',
    pincode: '560001',
  },
  supplier: {
    name: 'Mumbai Suppliers Ltd',
    gstin: '27AABCU9603R1ZO', // Maharashtra GSTIN
    phone: '+919876543212',
    email: 'suppliers@mumbai.com',
    addressLine1: 'Godown 12, Bandra',
    city: 'Mumbai',
    state: 'Maharashtra',
    pincode: '400050',
  },
  item: {
    name: 'Samsung Galaxy Phone',
    hsnCode: '85171210',
    description: 'Latest model smartphone',
    unit: 'PCS',
    sellingPrice: 25000,
    purchasePrice: 20000,
    gstRate: 18,
    openingStock: 10,
  },
};

// Store IDs for use in subsequent tests
let businessId: string;
let customerId: string;
let supplierId: string;
let itemId: string;
let invoiceId: string;

test.describe('Complete E2E User Journey', () => {
  
  test.beforeEach(async ({ page }) => {
    // Set longer timeout for initial navigation
    await page.goto('/', { waitUntil: 'networkidle', timeout: 30000 });
  });

  test('1. Authentication Flow - Login with Phone OTP', async ({ page }) => {
    console.log('Starting authentication test...');
    
    // Navigate to login page
    await page.goto('/login');
    await expect(page).toHaveTitle(/Business App|Login/i);
    
    // Enter phone number
    const phoneInput = page.locator('input[name="phone"], input[type="tel"], input[placeholder*="phone" i]').first();
    await phoneInput.waitFor({ state: 'visible', timeout: 10000 });
    await phoneInput.fill(testData.user.phone);
    
    // Click Send OTP button
    const sendOtpButton = page.locator('button:has-text("Send OTP"), button:has-text("Get OTP")').first();
    await sendOtpButton.click();
    
    // Wait for OTP input to appear
    await page.waitForTimeout(2000);
    
    // Enter OTP (in production, this would come from email/SMS)
    // For testing, we'll use a test OTP or check console logs
    const otpInput = page.locator('input[name="otp"], input[placeholder*="otp" i]').first();
    if (await otpInput.isVisible({ timeout: 5000 })) {
      await otpInput.fill(testData.user.otp);
      
      // Click Verify OTP button
      const verifyButton = page.locator('button:has-text("Verify"), button:has-text("Submit")').first();
      await verifyButton.click();
    }
    
    // Should redirect to business selection or dashboard
    await page.waitForURL(/\/(business\/select|dashboard)/, { timeout: 15000 });
    
    console.log('Authentication test completed');
  });

  test('2. Business Creation', async ({ page }) => {
    console.log('Starting business creation test...');
    
    // Go to business selection page
    await page.goto('/business/select');
    
    // Click Create New Business button
    const createButton = page.locator('button:has-text("Create"), button:has-text("New Business")').first();
    await createButton.click();
    
    // Wait for form to appear
    await page.waitForTimeout(1000);
    
    // Fill business details
    await page.locator('input[name="name"], input[placeholder*="business name" i]').first().fill(testData.business.name);
    await page.locator('input[name="gstin"], input[placeholder*="gstin" i]').first().fill(testData.business.gstin);
    await page.locator('input[name="pan"], input[placeholder*="pan" i]').first().fill(testData.business.pan);
    await page.locator('input[name="email"], input[type="email"]').first().fill(testData.business.email);
    await page.locator('input[name="phone"], input[type="tel"]').first().fill(testData.business.phone);
    
    // Fill address
    await page.locator('input[name="addressLine1"], input[placeholder*="address" i]').first().fill(testData.business.addressLine1);
    await page.locator('input[name="addressLine2"]').first().fill(testData.business.addressLine2);
    await page.locator('input[name="city"], input[placeholder*="city" i]').first().fill(testData.business.city);
    
    // Select state (dropdown or input)
    const stateInput = page.locator('select[name="state"], input[name="state"]').first();
    if (await stateInput.evaluate(el => el.tagName === 'SELECT')) {
      await stateInput.selectOption(testData.business.state);
    } else {
      await stateInput.fill(testData.business.state);
    }
    
    await page.locator('input[name="pincode"], input[placeholder*="pincode" i]').first().fill(testData.business.pincode);
    
    // Submit form
    const submitButton = page.locator('button[type="submit"], button:has-text("Create"), button:has-text("Save")').first();
    await submitButton.click();
    
    // Should redirect to dashboard
    await page.waitForURL('/dashboard', { timeout: 15000 });
    await expect(page.locator('h1, h2').first()).toContainText(/dashboard/i, { timeout: 10000 });
    
    console.log('Business creation test completed');
  });

  test('3. Party Management - Add Customer', async ({ page }) => {
    console.log('Starting customer creation test...');
    
    await page.goto('/parties');
    
    // Click Add Party button
    const addButton = page.locator('button:has-text("Add Party"), button:has-text("Add Customer"), button:has-text("New")').first();
    await addButton.click();
    await page.waitForTimeout(1000);
    
    // Select party type as Customer
    const typeSelect = page.locator('select[name="type"], input[value="CUSTOMER"]').first();
    if (await typeSelect.isVisible({ timeout: 2000 })) {
      await typeSelect.click();
    }
    
    // Fill customer details
    await page.locator('input[name="name"], input[placeholder*="name" i]').first().fill(testData.customer.name);
    await page.locator('input[name="gstin"], input[placeholder*="gstin" i]').first().fill(testData.customer.gstin);
    await page.locator('input[name="phone"], input[type="tel"]').first().fill(testData.customer.phone);
    await page.locator('input[name="email"], input[type="email"]').first().fill(testData.customer.email);
    
    // Address
    await page.locator('input[name="addressLine1"], input[placeholder*="address" i]').first().fill(testData.customer.addressLine1);
    await page.locator('input[name="city"]').first().fill(testData.customer.city);
    
    const stateInput = page.locator('select[name="state"], input[name="state"]').first();
    if (await stateInput.evaluate(el => el.tagName === 'SELECT')) {
      await stateInput.selectOption(testData.customer.state);
    } else {
      await stateInput.fill(testData.customer.state);
    }
    
    await page.locator('input[name="pincode"]').first().fill(testData.customer.pincode);
    
    // Submit
    await page.locator('button[type="submit"], button:has-text("Save"), button:has-text("Create")').first().click();
    
    // Verify customer appears in list
    await expect(page.locator('text=' + testData.customer.name).first()).toBeVisible({ timeout: 10000 });
    
    console.log('Customer creation test completed');
  });

  test('4. Party Management - Add Supplier', async ({ page }) => {
    console.log('Starting supplier creation test...');
    
    await page.goto('/parties');
    
    // Click Add Party button
    const addButton = page.locator('button:has-text("Add Party"), button:has-text("Add Supplier"), button:has-text("New")').first();
    await addButton.click();
    await page.waitForTimeout(1000);
    
    // Select party type as Supplier
    const typeSelect = page.locator('select[name="type"], input[value="SUPPLIER"]').first();
    if (await typeSelect.isVisible({ timeout: 2000 })) {
      await typeSelect.click();
    }
    
    // Fill supplier details
    await page.locator('input[name="name"]').first().fill(testData.supplier.name);
    await page.locator('input[name="gstin"]').first().fill(testData.supplier.gstin);
    await page.locator('input[name="phone"], input[type="tel"]').first().fill(testData.supplier.phone);
    await page.locator('input[name="email"], input[type="email"]').first().fill(testData.supplier.email);
    
    // Address
    await page.locator('input[name="addressLine1"]').first().fill(testData.supplier.addressLine1);
    await page.locator('input[name="city"]').first().fill(testData.supplier.city);
    
    const stateInput = page.locator('select[name="state"], input[name="state"]').first();
    if (await stateInput.evaluate(el => el.tagName === 'SELECT')) {
      await stateInput.selectOption(testData.supplier.state);
    } else {
      await stateInput.fill(testData.supplier.state);
    }
    
    await page.locator('input[name="pincode"]').first().fill(testData.supplier.pincode);
    
    // Submit
    await page.locator('button[type="submit"], button:has-text("Save")').first().click();
    
    // Verify supplier appears in list
    await expect(page.locator('text=' + testData.supplier.name).first()).toBeVisible({ timeout: 10000 });
    
    console.log('Supplier creation test completed');
  });

  test('5. Inventory Management - Add Item', async ({ page }) => {
    console.log('Starting inventory item creation test...');
    
    await page.goto('/inventory');
    
    // Click Add Item button
    const addButton = page.locator('button:has-text("Add Item"), button:has-text("New Item")').first();
    await addButton.click();
    await page.waitForTimeout(1000);
    
    // Fill item details
    await page.locator('input[name="name"], input[placeholder*="item name" i]').first().fill(testData.item.name);
    await page.locator('input[name="hsnCode"], input[placeholder*="hsn" i]').first().fill(testData.item.hsnCode);
    await page.locator('input[name="description"], textarea[name="description"]').first().fill(testData.item.description);
    
    // Unit
    const unitSelect = page.locator('select[name="unit"], input[name="unit"]').first();
    if (await unitSelect.evaluate(el => el.tagName === 'SELECT')) {
      await unitSelect.selectOption(testData.item.unit);
    } else {
      await unitSelect.fill(testData.item.unit);
    }
    
    // Prices
    await page.locator('input[name="sellingPrice"], input[placeholder*="selling" i]').first().fill(testData.item.sellingPrice.toString());
    await page.locator('input[name="purchasePrice"], input[placeholder*="purchase" i]').first().fill(testData.item.purchasePrice.toString());
    
    // GST Rate
    const gstRateInput = page.locator('input[name="gstRate"], select[name="gstRate"]').first();
    if (await gstRateInput.evaluate(el => el.tagName === 'SELECT')) {
      await gstRateInput.selectOption(testData.item.gstRate.toString());
    } else {
      await gstRateInput.fill(testData.item.gstRate.toString());
    }
    
    // Opening stock
    await page.locator('input[name="openingStock"], input[placeholder*="stock" i]').first().fill(testData.item.openingStock.toString());
    
    // Submit
    await page.locator('button[type="submit"], button:has-text("Save"), button:has-text("Create")').first().click();
    
    // Verify item appears in list
    await expect(page.locator('text=' + testData.item.name).first()).toBeVisible({ timeout: 10000 });
    
    console.log('Inventory item creation test completed');
  });

  test('6. Invoice Creation - Inter-state Sale (IGST)', async ({ page }) => {
    console.log('Starting invoice creation test (IGST)...');
    
    await page.goto('/invoices/create');
    
    // Select invoice type as Sale
    const typeSelect = page.locator('select[name="type"], select[name="invoiceType"]').first();
    await typeSelect.selectOption('SALE');
    
    // Select customer (Karnataka - different from business state Maharashtra)
    await page.locator('select[name="partyId"], select[name="party"]').first().click();
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');
    
    // Set dates
    const today = new Date().toISOString().split('T')[0];
    await page.locator('input[name="invoiceDate"], input[type="date"]').first().fill(today);
    await page.locator('input[name="dueDate"]').first().fill(today);
    
    // Add item
    const addItemButton = page.locator('button:has-text("Add Item")').first();
    await addItemButton.click();
    await page.waitForTimeout(500);
    
    // Select item
    await page.locator('select[name*="itemId"], select[name*="item"]').first().click();
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');
    
    // Enter quantity
    await page.locator('input[name*="quantity"]').first().fill('2');
    
    // Rate should auto-fill, but we can verify
    await page.waitForTimeout(1000);
    
    // Verify calculations
    const subtotal = page.locator('text=/subtotal/i').first();
    await expect(subtotal).toBeVisible();
    
    // For inter-state (Maharashtra to Karnataka), should show IGST
    const igstLabel = page.locator('text=/igst/i').first();
    await expect(igstLabel).toBeVisible({ timeout: 5000 });
    
    // Total amount should be visible
    const total = page.locator('text=/total/i').first();
    await expect(total).toBeVisible();
    
    // Add notes
    await page.locator('textarea[name="notes"]').first().fill('Test invoice - Inter-state sale');
    
    // Submit invoice
    await page.locator('button:has-text("Create Invoice"), button[type="submit"]').first().click();
    
    // Should redirect to invoices list or invoice detail
    await page.waitForURL(/\/invoices/, { timeout: 15000 });
    
    console.log('Invoice creation test (IGST) completed');
  });

  test('7. Invoice Creation - Intra-state Sale (CGST+SGST)', async ({ page }) => {
    console.log('Starting invoice creation test (CGST+SGST)...');
    
    await page.goto('/invoices/create');
    
    // Select invoice type as Sale
    const typeSelect = page.locator('select[name="type"], select[name="invoiceType"]').first();
    await typeSelect.selectOption('SALE');
    
    // Select supplier (Maharashtra - same as business state)
    await page.locator('select[name="partyId"], select[name="party"]').first().click();
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');
    
    // Set dates
    const today = new Date().toISOString().split('T')[0];
    await page.locator('input[name="invoiceDate"], input[type="date"]').first().fill(today);
    await page.locator('input[name="dueDate"]').first().fill(today);
    
    // Add item
    const addItemButton = page.locator('button:has-text("Add Item")').first();
    await addItemButton.click();
    await page.waitForTimeout(500);
    
    // Select item
    await page.locator('select[name*="itemId"], select[name*="item"]').first().click();
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');
    
    // Enter quantity
    await page.locator('input[name*="quantity"]').first().fill('1');
    
    await page.waitForTimeout(1000);
    
    // For intra-state (Maharashtra to Maharashtra), should show CGST and SGST
    const cgstLabel = page.locator('text=/cgst/i').first();
    const sgstLabel = page.locator('text=/sgst/i').first();
    
    await expect(cgstLabel).toBeVisible({ timeout: 5000 });
    await expect(sgstLabel).toBeVisible({ timeout: 5000 });
    
    // Add notes
    await page.locator('textarea[name="notes"]').first().fill('Test invoice - Intra-state sale');
    
    // Submit invoice
    await page.locator('button:has-text("Create Invoice"), button[type="submit"]').first().click();
    
    // Should redirect to invoices list
    await page.waitForURL(/\/invoices/, { timeout: 15000 });
    
    console.log('Invoice creation test (CGST+SGST) completed');
  });

  test('8. Payment Recording', async ({ page }) => {
    console.log('Starting payment recording test...');
    
    await page.goto('/payments');
    
    // Click Record Payment button
    const recordButton = page.locator('button:has-text("Record Payment"), button:has-text("Add Payment")').first();
    await recordButton.click();
    await page.waitForTimeout(1000);
    
    // Select invoice
    const invoiceSelect = page.locator('select[name="invoiceId"], select[name="invoice"]').first();
    await invoiceSelect.click();
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');
    
    // Enter amount
    await page.locator('input[name="amount"], input[placeholder*="amount" i]').first().fill('10000');
    
    // Select payment mode
    const modeSelect = page.locator('select[name="paymentMode"], select[name="mode"]').first();
    if (await modeSelect.isVisible({ timeout: 2000 })) {
      await modeSelect.selectOption('UPI');
    }
    
    // Reference number
    await page.locator('input[name="referenceNumber"], input[name="reference"]').first().fill('UPI123456789');
    
    // Payment date
    const today = new Date().toISOString().split('T')[0];
    await page.locator('input[name="paymentDate"], input[type="date"]').first().fill(today);
    
    // Submit
    await page.locator('button[type="submit"], button:has-text("Save"), button:has-text("Record")').first().click();
    
    // Verify payment appears in list
    await page.waitForTimeout(2000);
    await expect(page.locator('text=/10000|10,000/').first()).toBeVisible({ timeout: 10000 });
    
    console.log('Payment recording test completed');
  });

  test('9. Reports - Verify Dashboard Statistics', async ({ page }) => {
    console.log('Starting reports verification test...');
    
    await page.goto('/dashboard');
    
    // Verify dashboard cards are visible
    const partyCard = page.locator('text=/parties/i').first();
    const inventoryCard = page.locator('text=/inventory/i').first();
    const invoiceCard = page.locator('text=/invoice/i').first();
    
    await expect(partyCard).toBeVisible();
    await expect(inventoryCard).toBeVisible();
    await expect(invoiceCard).toBeVisible();
    
    // Navigate to reports
    await page.goto('/reports');
    
    // Verify report sections
    const salesReport = page.locator('text=/sales report/i').first();
    const gstReport = page.locator('text=/gst report/i').first();
    
    await expect(salesReport).toBeVisible({ timeout: 10000 });
    await expect(gstReport).toBeVisible();
    
    // Select date range
    const dateRangeButton = page.locator('button:has-text("Last 30 Days"), button:has-text("This Month")').first();
    if (await dateRangeButton.isVisible({ timeout: 2000 })) {
      await dateRangeButton.click();
    }
    
    console.log('Reports verification test completed');
  });

  test('10. Stock Adjustment', async ({ page }) => {
    console.log('Starting stock adjustment test...');
    
    await page.goto('/inventory/stock');
    
    // Select item
    const itemSelect = page.locator('select[name="itemId"], select[name="item"]').first();
    await itemSelect.click();
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');
    
    // Select adjustment type (Increase)
    const increaseRadio = page.locator('input[value="INCREASE"], input[type="radio"][value="increase"]').first();
    await increaseRadio.click();
    
    // Enter quantity
    await page.locator('input[name="quantity"]').first().fill('5');
    
    // Enter reason
    await page.locator('textarea[name="reason"], input[name="reason"]').first().fill('Received new stock');
    
    // Submit
    await page.locator('button[type="submit"], button:has-text("Save"), button:has-text("Adjust")').first().click();
    
    // Should redirect back to inventory page
    await page.waitForURL('/inventory', { timeout: 15000 });
    
    console.log('Stock adjustment test completed');
  });

  test('11. Logout', async ({ page }) => {
    console.log('Starting logout test...');
    
    await page.goto('/dashboard');
    
    // Find and click logout button
    const logoutButton = page.locator('button:has-text("Logout"), a:has-text("Logout"), button:has-text("Sign Out")').first();
    
    if (await logoutButton.isVisible({ timeout: 5000 })) {
      await logoutButton.click();
      
      // Should redirect to login page
      await page.waitForURL('/login', { timeout: 15000 });
      await expect(page.locator('input[type="tel"], input[placeholder*="phone" i]').first()).toBeVisible();
    }
    
    console.log('Logout test completed');
  });
});
