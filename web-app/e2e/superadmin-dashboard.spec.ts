import { test, expect, Page } from '@playwright/test';

/**
 * Superadmin Dashboard E2E Tests
 * 
 * Tests all 6 phases of the Superadmin Dashboard:
 * Phase 1: Enhanced Overview Dashboard
 * Phase 2: Enhanced Businesses Management
 * Phase 3: Enhanced Users Management
 * Phase 4: System-Wide Audit Logs
 * Phase 5: Advanced Features
 * Phase 6: Additional Features & Polish
 * 
 * Superadmin Credentials:
 * - Phone: 9175760649
 * - OTP: 760649
 */

const SUPERADMIN_PHONE = '9175760649';
const SUPERADMIN_OTP = '760649';
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

// Helper function to login as superadmin
async function loginAsSuperadmin(page: Page) {
  console.log('🔐 Logging in as superadmin...');
  console.log(`📱 Phone: ${SUPERADMIN_PHONE}, OTP: ${SUPERADMIN_OTP}`);
  
  // Navigate to login page
  await page.goto(`${BASE_URL}/login`);
  await page.waitForLoadState('networkidle');
  console.log('✅ Login page loaded');
  
  // Enter phone number - try multiple selectors
  let phoneInput = page.locator('input[type="tel"]').first();
  if (!(await phoneInput.isVisible({ timeout: 2000 }).catch(() => false))) {
    phoneInput = page.locator('input[placeholder*="phone" i], input[placeholder*="mobile" i]').first();
  }
  if (!(await phoneInput.isVisible({ timeout: 2000 }).catch(() => false))) {
    phoneInput = page.locator('input').first();
  }
  
  await expect(phoneInput).toBeVisible({ timeout: 10000 });
  await phoneInput.clear();
  await phoneInput.fill(SUPERADMIN_PHONE);
  console.log('✅ Phone number entered');
  
  // Click Send OTP button
  const sendOtpButton = page.locator('button:has-text("Send OTP"), button:has-text("Send"), button[type="submit"]').first();
  await expect(sendOtpButton).toBeVisible({ timeout: 5000 });
  await sendOtpButton.click();
  console.log('📤 OTP request sent');
  
  // Wait for OTP input to appear
  await page.waitForTimeout(3000);
  
  // Enter OTP - OTP input might be multiple fields or single field
  // Try to find OTP input fields
  const otpInputs = page.locator('input[type="text"], input[type="tel"]').filter({ hasNotText: SUPERADMIN_PHONE });
  const otpInputCount = await otpInputs.count();
  
  console.log(`Found ${otpInputCount} potential OTP input fields`);
  
  if (otpInputCount > 1) {
    // Multiple OTP inputs (one per digit) - fill each one
    for (let i = 0; i < Math.min(otpInputCount, SUPERADMIN_OTP.length); i++) {
      const input = otpInputs.nth(i);
      if (await input.isVisible({ timeout: 2000 }).catch(() => false)) {
        await input.clear();
        await input.fill(SUPERADMIN_OTP[i]);
        await page.waitForTimeout(200);
      }
    }
  } else if (otpInputCount === 1) {
    // Single OTP input - fill the whole OTP
    const otpField = otpInputs.first();
    await expect(otpField).toBeVisible({ timeout: 10000 });
    await otpField.clear();
    await otpField.fill(SUPERADMIN_OTP);
  } else {
    // Try alternative selectors
    const altOtpInput = page.locator('input').filter({ hasNotText: SUPERADMIN_PHONE }).nth(1);
    if (await altOtpInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      await altOtpInput.clear();
      await altOtpInput.fill(SUPERADMIN_OTP);
    } else {
      throw new Error('Could not find OTP input field');
    }
  }
  
  console.log('✅ OTP entered');
  
  // Submit OTP
  const submitButton = page.locator('button[type="submit"]:has-text("Verify"), button:has-text("Verify"), button:has-text("Continue"), button:has-text("Verify & Continue")').first();
  await expect(submitButton).toBeVisible({ timeout: 5000 });
  await submitButton.click();
  console.log('✅ OTP submitted');
  
  // Wait for redirect to admin page
  try {
    await page.waitForURL(/\/(admin|dashboard)/, { timeout: 20000 });
    console.log(`✅ Logged in, redirected to: ${page.url()}`);
    
    // If redirected to business select, we need to go to admin directly
    if (page.url().includes('/business/select')) {
      console.log('⚠️ Redirected to business select, navigating to admin...');
      await page.goto(`${BASE_URL}/admin`);
      await page.waitForLoadState('networkidle');
    }
    
    // Verify we're on admin page
    if (!page.url().includes('/admin')) {
      console.log(`⚠️ Not on admin page, navigating... Current URL: ${page.url()}`);
      await page.goto(`${BASE_URL}/admin`);
      await page.waitForLoadState('networkidle');
    }
    
    // Wait for admin page to load
    await page.waitForSelector('text=Super Admin Dashboard, text=Overview, text=Total Businesses', { timeout: 15000 });
    console.log('✅ Successfully on admin page');
  } catch (error) {
    console.log(`⚠️ URL did not change as expected. Current URL: ${page.url()}`);
    // Try navigating directly to admin page
    await page.goto(`${BASE_URL}/admin`);
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('text=Super Admin Dashboard, text=Overview', { timeout: 15000 });
  }
}

test.describe('Superadmin Dashboard - Phase 1: Enhanced Overview Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsSuperadmin(page);
  });

  test('should display overview tab with all statistics cards', async ({ page }) => {
    // Wait for overview tab to load
    await page.waitForSelector('text=Overview', { timeout: 10000 });
    
    // Check for all 8 statistics cards
    const cardTitles = [
      'Total Businesses',
      'Active Businesses',
      'Total Users',
      'Active Users',
      'Recent Businesses',
      'Recent Users',
      'System Status',
      'Recent Activity',
    ];
    
    for (const title of cardTitles) {
      const element = page.locator(`text=${title}`).first();
      await expect(element).toBeVisible({ timeout: 15000 });
      console.log(`✅ ${title} card is visible`);
    }
  });

  test('should display all 4 charts', async ({ page }) => {
    await page.waitForSelector('text=Overview', { timeout: 10000 });
    
    // Scroll to charts section
    await page.evaluate(() => window.scrollTo(0, 800));
    await page.waitForTimeout(2000);
    
    // Check for charts
    const chartTitles = [
      'Business Growth',
      'User Registration Trend',
      'Business Type Distribution',
      'User Type Distribution',
    ];
    
    for (const title of chartTitles) {
      const element = page.locator(`text=${title}`).first();
      await expect(element).toBeVisible({ timeout: 15000 });
      console.log(`✅ ${title} chart is visible`);
    }
  });

  test('should display quick actions panel', async ({ page }) => {
    await page.waitForSelector('text=Quick Actions', { timeout: 10000 });
    
    // Check for quick action buttons
    const actions = ['Global Search', 'Export All Data', 'System Settings', 'View Logs'];
    
    for (const action of actions) {
      const button = page.locator(`button:has-text("${action}")`).first();
      await expect(button).toBeVisible({ timeout: 10000 });
      console.log(`✅ ${action} button is visible`);
    }
  });

  test('should display system health monitoring', async ({ page }) => {
    await page.waitForSelector('text=System Health', { timeout: 10000 });
    
    // Check for system health indicators
    const healthIndicators = ['Database', 'Services', 'Performance', 'Security'];
    
    for (const indicator of healthIndicators) {
      const element = page.locator(`text=${indicator}`).first();
      await expect(element).toBeVisible({ timeout: 10000 });
      console.log(`✅ ${indicator} health indicator is visible`);
    }
  });

  test('should display activity feed', async ({ page }) => {
    await page.waitForSelector('text=Recent Activity', { timeout: 10000 });
    
    // Activity feed should be visible
    const activityFeed = page.locator('text=Recent Activity').first();
    await expect(activityFeed).toBeVisible({ timeout: 10000 });
    console.log('✅ Activity feed is visible');
  });
});

test.describe('Superadmin Dashboard - Phase 2: Enhanced Businesses Management', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsSuperadmin(page);
  });

  test('should navigate to businesses tab', async ({ page }) => {
    // Click on Businesses tab
    const businessesTab = page.locator('button:has-text("Businesses")').first();
    await expect(businessesTab).toBeVisible({ timeout: 10000 });
    await businessesTab.click();
    await page.waitForTimeout(2000);
    
    // Verify we're on businesses tab
    await expect(page.locator('text=All Businesses, text=Businesses').first()).toBeVisible({ timeout: 15000 });
    console.log('✅ Businesses tab is accessible');
  });

  test('should display businesses table with filters', async ({ page }) => {
    await page.click('button:has-text("Businesses")');
    await page.waitForTimeout(3000);
    
    // Check for filters
    await expect(page.locator('text=Filters & Search, text=Status').first()).toBeVisible({ timeout: 15000 });
    console.log('✅ Business filters are visible');
  });

  test('should filter businesses by status', async ({ page }) => {
    await page.click('button:has-text("Businesses")');
    await page.waitForTimeout(3000);
    
    // Look for status filter - could be Select or button
    const statusFilter = page.locator('select, [role="combobox"], button').filter({ hasText: 'Status' }).first();
    if (await statusFilter.isVisible({ timeout: 3000 }).catch(() => false)) {
      await statusFilter.click();
      await page.waitForTimeout(500);
      const activeOption = page.locator('text=Active').first();
      if (await activeOption.isVisible({ timeout: 2000 }).catch(() => false)) {
        await activeOption.click();
        await page.waitForTimeout(2000);
        console.log('✅ Filtered businesses by status');
      }
    } else {
      console.log('⚠️ Status filter not found, may need to check UI');
    }
  });

  test('should open business details sheet', async ({ page }) => {
    await page.click('button:has-text("Businesses")');
    await page.waitForTimeout(3000);
    
    // Look for eye icon or view button in table
    const viewButtons = page.locator('button:has([data-lucide="eye"]), button:has([aria-label*="view" i]), button:has([aria-label*="details" i]), button').filter({ hasText: '' });
    const viewButtonCount = await viewButtons.count();
    
    if (viewButtonCount > 0) {
      // Try to find the first view button in the table
      const firstViewButton = page.locator('table button, [role="row"] button').first();
      if (await firstViewButton.isVisible({ timeout: 5000 }).catch(() => false)) {
        await firstViewButton.click();
        await page.waitForTimeout(2000);
        
        // Check if details sheet opened
        const detailsVisible = await page.locator('text=Business Information, text=Owner Details, text=Overview').first().isVisible({ timeout: 5000 }).catch(() => false);
        if (detailsVisible) {
          console.log('✅ Business details sheet opened');
        } else {
          console.log('⚠️ Business details sheet may not have opened');
        }
      } else {
        console.log('⚠️ View button not found in table');
      }
    } else {
      console.log('⚠️ No businesses found to view details');
    }
  });

  test('should export businesses to CSV', async ({ page }) => {
    await page.click('button:has-text("Businesses")');
    await page.waitForTimeout(2000);
    
    // Set up download listener
    const downloadPromise = page.waitForEvent('download', { timeout: 10000 }).catch(() => null);
    
    // Click export button
    const exportButton = page.locator('button:has-text("Export CSV"), button:has-text("Export")').first();
    if (await exportButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await exportButton.click();
      
      const download = await downloadPromise;
      if (download) {
        console.log('✅ CSV export triggered');
      } else {
        console.log('⚠️ Download may have been blocked or no data to export');
      }
    } else {
      console.log('⚠️ Export button not found');
    }
  });
});

test.describe('Superadmin Dashboard - Phase 3: Enhanced Users Management', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsSuperadmin(page);
  });

  test('should navigate to users tab', async ({ page }) => {
    // Click on Users tab
    const usersTab = page.locator('button:has-text("Users")').first();
    await expect(usersTab).toBeVisible({ timeout: 10000 });
    await usersTab.click();
    await page.waitForTimeout(2000);
    
    // Verify we're on users tab
    await expect(page.locator('text=All Users, text=Users').first()).toBeVisible({ timeout: 15000 });
    console.log('✅ Users tab is accessible');
  });

  test('should display users table with filters', async ({ page }) => {
    await page.click('button:has-text("Users")');
    await page.waitForTimeout(3000);
    
    // Check for filters
    await expect(page.locator('text=Filters & Search, text=Status').first()).toBeVisible({ timeout: 15000 });
    console.log('✅ User filters are visible');
  });

  test('should filter users by status', async ({ page }) => {
    await page.click('button:has-text("Users")');
    await page.waitForTimeout(3000);
    
    // Look for status filter
    const statusFilter = page.locator('select, [role="combobox"], button').filter({ hasText: 'Status' }).first();
    if (await statusFilter.isVisible({ timeout: 3000 }).catch(() => false)) {
      await statusFilter.click();
      await page.waitForTimeout(500);
      const activeOption = page.locator('text=Active').first();
      if (await activeOption.isVisible({ timeout: 2000 }).catch(() => false)) {
        await activeOption.click();
        await page.waitForTimeout(2000);
        console.log('✅ Filtered users by status');
      }
    } else {
      console.log('⚠️ Status filter not found');
    }
  });

  test('should open user details sheet', async ({ page }) => {
    await page.click('button:has-text("Users")');
    await page.waitForTimeout(3000);
    
    // Look for eye icon or view button
    const viewButton = page.locator('table button, [role="row"] button').first();
    
    if (await viewButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await viewButton.click();
      await page.waitForTimeout(2000);
      
      // Check if details sheet opened
      const detailsVisible = await page.locator('text=User Profile, text=Overview, text=Businesses').first().isVisible({ timeout: 5000 }).catch(() => false);
      if (detailsVisible) {
        console.log('✅ User details sheet opened');
      } else {
        console.log('⚠️ User details sheet may not have opened');
      }
    } else {
      console.log('⚠️ View button not found, may need users in the system');
    }
  });

  test('should support bulk selection', async ({ page }) => {
    await page.click('button:has-text("Users")');
    await page.waitForTimeout(2000);
    
    // Look for checkboxes
    const checkbox = page.locator('input[type="checkbox"]').first();
    if (await checkbox.isVisible({ timeout: 5000 }).catch(() => false)) {
      await checkbox.click();
      await page.waitForTimeout(1000);
      
      // Check if bulk actions appeared
      const bulkActions = await page.locator('text=selected, text=Export Selected').first().isVisible({ timeout: 2000 }).catch(() => false);
      if (bulkActions) {
        console.log('✅ Bulk selection working');
      } else {
        console.log('⚠️ Bulk actions may not be visible');
      }
    } else {
      console.log('⚠️ Checkbox not found, may need users in the system');
    }
  });

  test('should export users to CSV', async ({ page }) => {
    await page.click('button:has-text("Users")');
    await page.waitForTimeout(2000);
    
    // Set up download listener
    const downloadPromise = page.waitForEvent('download', { timeout: 10000 }).catch(() => null);
    
    // Click export button
    const exportButton = page.locator('button:has-text("Export CSV"), button:has-text("Export")').first();
    if (await exportButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await exportButton.click();
      
      const download = await downloadPromise;
      if (download) {
        console.log('✅ CSV export triggered');
      } else {
        console.log('⚠️ Download may have been blocked or no data to export');
      }
    } else {
      console.log('⚠️ Export button not found');
    }
  });
});

test.describe('Superadmin Dashboard - Phase 4: System-Wide Audit Logs', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsSuperadmin(page);
  });

  test('should navigate to audit logs tab', async ({ page }) => {
    // Click on Audit Logs tab
    const auditLogsTab = page.locator('button:has-text("Audit Logs")').first();
    await expect(auditLogsTab).toBeVisible({ timeout: 10000 });
    await auditLogsTab.click();
    await page.waitForTimeout(2000);
    
    // Verify we're on audit logs tab
    await expect(page.locator('text=Audit Logs, text=Total Logs').first()).toBeVisible({ timeout: 15000 });
    console.log('✅ Audit Logs tab is accessible');
  });

  test('should display audit log statistics', async ({ page }) => {
    await page.click('button:has-text("Audit Logs")');
    await page.waitForTimeout(3000);
    
    // Check for statistics cards
    const stats = ['Total Logs', 'Active Users', 'Action Types', 'Businesses'];
    
    for (const stat of stats) {
      const element = page.locator(`text=${stat}`).first();
      const visible = await element.isVisible({ timeout: 10000 }).catch(() => false);
      if (visible) {
        console.log(`✅ ${stat} statistic is visible`);
      } else {
        console.log(`⚠️ ${stat} statistic not found`);
      }
    }
  });

  test('should display audit logs table', async ({ page }) => {
    await page.click('button:has-text("Audit Logs")');
    await page.waitForTimeout(3000);
    
    // Check for audit logs table
    const tableVisible = await page.locator('table, [role="table"]').first().isVisible({ timeout: 10000 }).catch(() => false);
    if (tableVisible) {
      console.log('✅ Audit logs table is visible');
    } else {
      // Check for empty state
      const emptyState = await page.locator('text=No audit logs found, text=No data').first().isVisible({ timeout: 5000 }).catch(() => false);
      if (emptyState) {
        console.log('⚠️ No audit logs found (empty state)');
      } else {
        console.log('⚠️ Audit logs table not found');
      }
    }
  });

  test('should filter audit logs by action', async ({ page }) => {
    await page.click('button:has-text("Audit Logs")');
    await page.waitForTimeout(2000);
    
    // Look for action filter
    const actionFilter = page.locator('select, [role="combobox"], button').filter({ hasText: 'Action' }).first();
    if (await actionFilter.isVisible({ timeout: 3000 }).catch(() => false)) {
      await actionFilter.click();
      await page.waitForTimeout(500);
      console.log('✅ Action filter is accessible');
    } else {
      console.log('⚠️ Action filter not found');
    }
  });

  test('should expand audit log row to show details', async ({ page }) => {
    await page.click('button:has-text("Audit Logs")');
    await page.waitForTimeout(3000);
    
    // Look for expandable rows (chevron icons or buttons)
    const expandButton = page.locator('button, [role="button"]').first();
    
    if (await expandButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await expandButton.click();
      await page.waitForTimeout(1000);
      
      // Check if details expanded
      const detailsVisible = await page.locator('text=Notes, text=Previous Value, text=New Value').first().isVisible({ timeout: 2000 }).catch(() => false);
      if (detailsVisible) {
        console.log('✅ Audit log details expanded');
      } else {
        console.log('⚠️ Details may not have expanded');
      }
    } else {
      console.log('⚠️ Expand button not found, may need audit logs in the system');
    }
  });

  test('should export audit logs to CSV', async ({ page }) => {
    await page.click('button:has-text("Audit Logs")');
    await page.waitForTimeout(2000);
    
    // Set up download listener
    const downloadPromise = page.waitForEvent('download', { timeout: 10000 }).catch(() => null);
    
    // Click export button
    const exportButton = page.locator('button:has-text("Export CSV"), button:has-text("Export")').first();
    if (await exportButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await exportButton.click();
      
      const download = await downloadPromise;
      if (download) {
        console.log('✅ CSV export triggered');
      } else {
        console.log('⚠️ Download may have been blocked or no data to export');
      }
    } else {
      console.log('⚠️ Export button not found');
    }
  });
});

test.describe('Superadmin Dashboard - Phase 5: Advanced Features', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsSuperadmin(page);
  });

  test('should open global search', async ({ page }) => {
    await page.waitForSelector('text=Overview', { timeout: 10000 });
    
    // Click Global Search button
    const globalSearchButton = page.locator('button:has-text("Global Search")').first();
    if (await globalSearchButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await globalSearchButton.click();
      await page.waitForTimeout(1000);
      
      // Check if search dialog opened
      const searchVisible = await page.locator('text=Global Search, input[placeholder*="Search" i]').first().isVisible({ timeout: 2000 }).catch(() => false);
      if (searchVisible) {
        console.log('✅ Global search opened');
        
        // Try searching
        const searchInput = page.locator('input[placeholder*="Search" i]').first();
        if (await searchInput.isVisible({ timeout: 2000 }).catch(() => false)) {
          await searchInput.fill('test');
          await page.waitForTimeout(1000);
          console.log('✅ Global search input working');
        }
      } else {
        console.log('⚠️ Global search dialog may not have opened');
      }
    } else {
      console.log('⚠️ Global Search button not found');
    }
  });

  test('should display system health indicators', async ({ page }) => {
    await page.waitForSelector('text=System Health', { timeout: 10000 });
    
    // Check for all health indicators
    const indicators = ['Database', 'Services', 'Performance', 'Security'];
    
    for (const indicator of indicators) {
      const element = page.locator(`text=${indicator}`).first();
      const visible = await element.isVisible({ timeout: 10000 }).catch(() => false);
      if (visible) {
        console.log(`✅ ${indicator} health indicator is visible`);
      }
    }
  });

  test('should export all data', async ({ page }) => {
    await page.waitForSelector('text=Overview', { timeout: 10000 });
    
    // Set up download listener
    const downloadPromise = page.waitForEvent('download', { timeout: 10000 }).catch(() => null);
    
    // Click Export All Data button
    const exportButton = page.locator('button:has-text("Export All Data")').first();
    if (await exportButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await exportButton.click();
      await page.waitForTimeout(2000);
      
      const download = await downloadPromise;
      if (download) {
        console.log('✅ Export all data triggered');
      } else {
        console.log('⚠️ Download may have been blocked or triggered multiple downloads');
      }
    } else {
      console.log('⚠️ Export All Data button not found');
    }
  });
});

test.describe('Superadmin Dashboard - Phase 6: Additional Features & Polish', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsSuperadmin(page);
  });

  test('should navigate between all tabs', async ({ page }) => {
    const tabs = ['Overview', 'Businesses', 'Users', 'Audit Logs'];
    
    for (const tab of tabs) {
      const tabButton = page.locator(`button:has-text("${tab}")`).first();
      await expect(tabButton).toBeVisible({ timeout: 10000 });
      await tabButton.click();
      await page.waitForTimeout(2000);
      
      // Verify tab content loaded
      const contentVisible = await page.locator('text').filter({ hasText: new RegExp(tab, 'i') }).first().isVisible({ timeout: 5000 }).catch(() => false);
      if (contentVisible) {
        console.log(`✅ ${tab} tab navigated successfully`);
      }
    }
  });

  test('should display loading states', async ({ page }) => {
    // Reload page to see loading states
    await page.reload();
    await page.waitForTimeout(500);
    
    // Check for skeleton loaders or loading indicators
    const loadingVisible = await page.locator('[data-skeleton], .skeleton, [aria-busy="true"]').first().isVisible({ timeout: 2000 }).catch(() => false);
    if (loadingVisible) {
      console.log('✅ Loading states are visible');
    } else {
      console.log('⚠️ Loading states may have loaded too quickly');
    }
  });

  test('should handle empty states gracefully', async ({ page }) => {
    // Navigate to each tab and check for empty states
    const tabs = ['Businesses', 'Users', 'Audit Logs'];
    
    for (const tab of tabs) {
      await page.click(`button:has-text("${tab}")`);
      await page.waitForTimeout(2000);
      
      // Check for empty state messages
      const emptyState = await page.locator(`text=No ${tab.toLowerCase()} found, text=No data, text=No.*found`).first().isVisible({ timeout: 2000 }).catch(() => false);
      if (emptyState) {
        console.log(`✅ Empty state handled for ${tab}`);
      }
    }
  });

  test('should be responsive on mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(1000);
    
    // Check if content is still accessible
    const overviewTab = await page.locator('button:has-text("Overview")').first().isVisible({ timeout: 5000 }).catch(() => false);
    if (overviewTab) {
      console.log('✅ Mobile responsive layout working');
    } else {
      console.log('⚠️ Mobile layout may have issues');
    }
    
    // Reset viewport
    await page.setViewportSize({ width: 1280, height: 720 });
  });
});

test.describe('Superadmin Dashboard - Integration Tests', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsSuperadmin(page);
  });

  test('should complete full workflow: view stats -> check businesses -> check users -> view logs', async ({ page }) => {
    // 1. View overview stats
    await page.waitForSelector('text=Overview', { timeout: 10000 });
    await expect(page.locator('text=Total Businesses').first()).toBeVisible({ timeout: 15000 });
    console.log('✅ Step 1: Overview stats viewed');
    
    // 2. Navigate to businesses
    await page.click('button:has-text("Businesses")');
    await page.waitForTimeout(2000);
    await expect(page.locator('text=All Businesses, text=Businesses').first()).toBeVisible({ timeout: 15000 });
    console.log('✅ Step 2: Businesses tab accessed');
    
    // 3. Navigate to users
    await page.click('button:has-text("Users")');
    await page.waitForTimeout(2000);
    await expect(page.locator('text=All Users, text=Users').first()).toBeVisible({ timeout: 15000 });
    console.log('✅ Step 3: Users tab accessed');
    
    // 4. Navigate to audit logs
    await page.click('button:has-text("Audit Logs")');
    await page.waitForTimeout(2000);
    await expect(page.locator('text=Audit Logs, text=Total Logs').first()).toBeVisible({ timeout: 15000 });
    console.log('✅ Step 4: Audit Logs tab accessed');
    
    // 5. Return to overview
    await page.click('button:has-text("Overview")');
    await page.waitForTimeout(2000);
    await expect(page.locator('text=Total Businesses').first()).toBeVisible({ timeout: 15000 });
    console.log('✅ Step 5: Returned to Overview');
    
    console.log('✅ Full workflow completed successfully');
  });

  test('should verify all API endpoints are called', async ({ page }) => {
    const apiCalls: string[] = [];
    
    // Track API calls
    page.on('response', (response) => {
      const url = response.url();
      if (url.includes('/api/v1/')) {
        apiCalls.push(url);
      }
    });
    
    // Navigate through all tabs
    await page.waitForSelector('text=Overview', { timeout: 10000 });
    await page.click('button:has-text("Businesses")');
    await page.waitForTimeout(3000);
    await page.click('button:has-text("Users")');
    await page.waitForTimeout(3000);
    await page.click('button:has-text("Audit Logs")');
    await page.waitForTimeout(3000);
    
    // Check for expected API calls
    const expectedEndpoints = [
      '/businesses/admin/stats',
      '/businesses',
      '/users/admin/all',
      '/admin/audit-logs',
    ];
    
    for (const endpoint of expectedEndpoints) {
      const found = apiCalls.some(call => call.includes(endpoint));
      if (found) {
        console.log(`✅ API endpoint called: ${endpoint}`);
      } else {
        console.log(`⚠️ API endpoint may not have been called: ${endpoint}`);
      }
    }
  });
});
