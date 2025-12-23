import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2E Test Configuration
 * 
 * This configuration runs end-to-end tests against the full application stack
 * launched via Docker Compose (all microservices + frontend + databases)
 */
export default defineConfig({
  // Test directory
  testDir: './e2e',
  
  // Maximum time one test can run
  timeout: 60 * 1000,
  
  // Test execution settings
  fullyParallel: false, // Run tests in sequence to avoid conflicts
  forbidOnly: !!process.env.CI, // Fail on .only() in CI
  retries: process.env.CI ? 2 : 0, // Retry failed tests in CI
  workers: process.env.CI ? 1 : 1, // Run tests sequentially
  
  // Reporter configuration
  reporter: [
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['json', { outputFile: 'playwright-report/results.json' }],
    ['junit', { outputFile: 'playwright-report/results.xml' }],
    ['list'],
  ],
  
  // Shared settings for all tests
  use: {
    // Base URL for all tests
    baseURL: 'http://localhost:3000',
    
    // Browser options
    headless: true,
    viewport: { width: 1280, height: 720 },
    ignoreHTTPSErrors: true,
    
    // Artifacts
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'retain-on-failure',
    
    // Context options
    locale: 'en-IN',
    timezoneId: 'Asia/Kolkata',
    
    // API timeout
    actionTimeout: 15000,
    navigationTimeout: 30000,
  },
  
  // Test projects (browsers to test against)
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  
  // Web server configuration (NOT USED - Docker Compose handles this)
  // We expect services to be already running via docker-compose.e2e.yml
});
