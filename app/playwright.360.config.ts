import { defineConfig } from '@playwright/test';

/**
 * Playwright Configuration for 360-Degree Testing Suite
 * 
 * Run all tests: npm run test:360
 * Run with UI: npm run test:360:ui
 * Run specific category: npm run test:360:edge
 */
export default defineConfig({
  testDir: './tests',
  timeout: 120 * 1000, // 2 minutes for stress tests
  expect: {
    timeout: 15 * 1000,
  },
  fullyParallel: false, // Run sequentially for data consistency
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1, // Single worker for concurrency tests
  reporter: [
    ['html', { outputFolder: 'test-reports/360-degree', open: 'never' }],
    ['json', { outputFile: 'test-reports/360-degree/results.json' }],
    ['list'],
  ],
  use: {
    baseURL: 'http://localhost:3002',
    trace: 'retain-on-failure',
    extraHTTPHeaders: {
      'Content-Type': 'application/json',
    },
  },
  projects: [
    {
      name: 'edge-cases',
      testMatch: /edge-cases\/.*\.spec\.ts/,
    },
    {
      name: 'concurrency',
      testMatch: /concurrency\/.*\.spec\.ts/,
    },
    {
      name: 'business-rules',
      testMatch: /business-rules\/.*\.spec\.ts/,
    },
    {
      name: 'integrity',
      testMatch: /integrity\/.*\.spec\.ts/,
    },
    {
      name: 'security',
      testMatch: /security\/.*\.spec\.ts/,
    },
    {
      name: 'performance',
      testMatch: /performance\/.*\.spec\.ts/,
      timeout: 180 * 1000, // 3 minutes for performance tests
    },
    {
      name: 'integration',
      testMatch: /integration\/.*\.spec\.ts/,
    },
    {
      name: 'resilience',
      testMatch: /resilience\/.*\.spec\.ts/,
    },
  ],
});
