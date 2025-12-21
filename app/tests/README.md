# Integration & E2E Tests

This directory contains comprehensive integration and end-to-end tests for all services.

## Structure

```
tests/
├── integration/          # Service-level integration tests
│   ├── auth.integration.spec.ts
│   ├── business.integration.spec.ts
│   ├── party.integration.spec.ts
│   ├── inventory.integration.spec.ts
│   ├── invoice.integration.spec.ts
│   └── payment.integration.spec.ts
├── e2e/                  # End-to-end tests across services
│   ├── user-journey.spec.ts
│   ├── invoice-payment-flow.spec.ts
│   └── error-scenarios.spec.ts
├── fixtures/             # Test data factories
│   └── test-data.factory.ts
└── helpers/              # Test utilities
    ├── test-db.setup.ts
    └── api-client.ts
```

## Prerequisites

1. **Test Database**: Ensure test database is running
   ```bash
   docker-compose up postgres-test
   ```

2. **Environment Variables**:
   ```env
   TEST_DB_HOST=localhost
   TEST_DB_PORT=5433
   TEST_DB_USERNAME=test
   TEST_DB_PASSWORD=test
   TEST_DB_NAME=business_test_db
   ```

## Running Tests

### Run All Integration Tests
```bash
npm run test:integration
```

### Run Specific Service Tests
```bash
npm run test:integration -- auth
npm run test:integration -- business
npm run test:integration -- invoice
```

### Run E2E Tests
```bash
npm run test:e2e
```

### Run with Coverage
```bash
npm run test:integration:cov
```

## Test Scenarios

### OK Scenarios (Happy Path)
- ✅ Successful operations
- ✅ Valid data
- ✅ Proper authentication
- ✅ Correct business logic

### NOK Scenarios (Error Cases)
- ❌ Invalid input validation
- ❌ Unauthorized access
- ❌ Duplicate data
- ❌ Missing required fields
- ❌ Business rule violations
- ❌ Rate limiting
- ❌ Service errors

## Test Data Management

- **Fixtures**: Use `TestDataFactory` for consistent test data
- **Cleanup**: Database is cleaned after each test
- **Isolation**: Each test runs in isolation

## Writing New Tests

1. **Use TestDataFactory** for creating test data
2. **Use ApiClient** for making API requests
3. **Clean up** after each test
4. **Test both OK and NOK scenarios**
5. **Verify response structure and status codes**

## Example Test

```typescript
describe('Service Integration Tests', () => {
  let app: INestApplication;
  let apiClient: ApiClient;

  beforeAll(async () => {
    // Setup app and database
  });

  afterEach(async () => {
    // Clean database
  });

  it('should create resource successfully (OK)', async () => {
    const data = TestDataFactory.createResource();
    const response = await apiClient.post('/api/v1/resources', data);
    
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('id');
  });

  it('should reject invalid data (NOK)', async () => {
    const response = await apiClient.post('/api/v1/resources', {});
    
    expect(response.status).toBe(400);
  });
});
```

## CI/CD Integration

Tests run automatically in CI/CD pipeline:
- On every pull request
- Before merging to main
- On scheduled basis

## Troubleshooting

### Database Connection Issues
```bash
# Check if test database is running
docker ps | grep postgres-test

# Restart test database
docker-compose restart postgres-test
```

### Test Failures
- Check database state
- Verify test data
- Check service dependencies
- Review error messages

