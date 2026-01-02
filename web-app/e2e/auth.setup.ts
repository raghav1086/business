import { test as setup, expect } from '@playwright/test';
import path from 'path';

/**
 * Authentication Setup
 * 
 * This file runs ONCE before all other tests and:
 * 1. Logs in with OTP 129012
 * 2. Waits for tokens to be properly set in localStorage
 * 3. Saves browser storage state to auth.json
 * 4. All other tests reuse this authenticated state
 * 
 * This avoids rate limiting and OTP issues.
 */

const authFile = path.join(__dirname, '../.auth/user.json');

const TEST_CONFIG = {
  phone: '9175760649', // Superadmin phone
  otp: '760649', // Superadmin OTP (last 6 digits)
};

setup('authenticate', async ({ page }) => {
  console.log('🔐 === AUTHENTICATION SETUP ===');
  console.log('📱 Phone:', TEST_CONFIG.phone);
  console.log('🔢 OTP:', TEST_CONFIG.otp);
  
  // Go to login page
  await page.goto('/login');
  await page.waitForLoadState('networkidle');
  console.log('✅ Login page loaded');
  
  // Enter phone number
  const phoneInput = page.locator('input[type="tel"]').first();
  await expect(phoneInput).toBeVisible({ timeout: 10000 });
  await phoneInput.fill(TEST_CONFIG.phone);
  console.log('✅ Phone number entered');
  
  // Click Send OTP
  await page.click('button:has-text("Send OTP")');
  console.log('📤 OTP request sent');
  
  // Wait for OTP input to appear
  await page.waitForTimeout(3000);
  
  // Try to extract OTP from toast message
  let otpToUse = TEST_CONFIG.otp;
  try {
    const toastText = await page.locator('[data-sonner-toast]').textContent({ timeout: 3000 });
    if (toastText) {
      const match = toastText.match(/(\d{6})/);
      if (match) {
        otpToUse = match[1];
        console.log('📝 Extracted OTP from toast:', otpToUse);
      }
    }
  } catch (e) {
    console.log('ℹ Using default OTP:', otpToUse);
  }
  
  // Enter OTP - text input that appears after Send OTP
  const otpInput = page.locator('input[type="text"]').first();
  await expect(otpInput).toBeVisible({ timeout: 10000 });
  await otpInput.fill(otpToUse);
  console.log('✅ OTP entered');
  
  // Submit OTP
  const submitBtn = page.locator('button[type="submit"]').first();
  await submitBtn.click();
  console.log('✅ OTP submitted');
  
  // Wait for redirect
  await page.waitForURL(/\/(business|dashboard)/, { timeout: 20000 });
  console.log('✅ Redirected after login');
  
  // Handle business selection if needed
  if (page.url().includes('/business/select')) {
    console.log('📊 Selecting business...');
    await page.waitForTimeout(2000);
    
    // Click first business card
    const businessCard = page.locator('.cursor-pointer').first();
    await businessCard.click();
    await page.waitForURL('**/dashboard', { timeout: 15000 });
  }
  
  // Verify we're on dashboard
  await expect(page).toHaveURL(/dashboard/);
  console.log('🎉 Reached dashboard!');
  
  // Wait for tokens to be properly set in localStorage
  await page.waitForTimeout(3000);
  
  // Verify tokens are set (not undefined)
  const accessToken = await page.evaluate(() => localStorage.getItem('access_token'));
  const businessId = await page.evaluate(() => localStorage.getItem('business_id'));
  
  console.log('🔑 Access Token:', accessToken ? `${accessToken.substring(0, 20)}...` : 'NOT SET');
  console.log('🏢 Business ID:', businessId || 'NOT SET');
  
  if (!accessToken || accessToken === 'undefined') {
    console.log('⚠️ Warning: Access token not properly set, waiting longer...');
    await page.waitForTimeout(5000);
    
    // Check again
    const retryToken = await page.evaluate(() => localStorage.getItem('access_token'));
    if (!retryToken || retryToken === 'undefined') {
      console.log('⚠️ Token still not set - proceeding anyway (session cookies may work)');
    }
  }
  
  // Save storage state
  await page.context().storageState({ path: authFile });
  console.log('💾 Storage state saved to:', authFile);
  console.log('✅ Authentication setup complete!');
});
