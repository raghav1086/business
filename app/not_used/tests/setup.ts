/**
 * Global Test Setup
 * 
 * Runs before all tests.
 */

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.TEST_DB_HOST = process.env.TEST_DB_HOST || 'localhost';
process.env.TEST_DB_PORT = process.env.TEST_DB_PORT || '5433';
process.env.TEST_DB_USERNAME = process.env.TEST_DB_USERNAME || 'test';
process.env.TEST_DB_PASSWORD = process.env.TEST_DB_PASSWORD || 'test';

// Increase timeout for integration/E2E tests
jest.setTimeout(30000);

// Global test utilities
global.console = {
  ...console,
  // Uncomment to suppress console logs during tests
  // log: jest.fn(),
  // debug: jest.fn(),
  // info: jest.fn(),
  // warn: jest.fn(),
  // error: jest.fn(),
};

