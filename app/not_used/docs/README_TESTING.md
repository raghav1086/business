# Testing Guide - Complete Reference

## 📚 Table of Contents

1. [Quick Start](#quick-start)
2. [Test Types](#test-types)
3. [Running Tests](#running-tests)
4. [Test Structure](#test-structure)
5. [Writing Tests](#writing-tests)
6. [Troubleshooting](#troubleshooting)
7. [CI/CD](#cicd)

## 🚀 Quick Start

### Automated (Recommended)
```bash
# Setup test environment
npm run test:setup

# Run all tests
./scripts/test-run.sh all

# Cleanup
npm run test:cleanup
```

### Manual
```bash
# 1. Install dependencies
npm install

# 2. Start test database
docker-compose up postgres-test -d

# 3. Run tests
npm run test:integration
```

## 🧪 Test Types

### Unit Tests
- **Location**: `apps/*/src/**/*.spec.ts`
- **Purpose**: Test individual functions/methods
- **Database**: Not required
- **Speed**: Fast (< 1 min)
- **Command**: `npm run test:all`

### Integration Tests
- **Location**: `tests/integration/`
- **Purpose**: Test API endpoints with real database
- **Database**: Required (test DB)
- **Speed**: Medium (2-5 min)
- **Command**: `npm run test:integration`

### E2E Tests
- **Location**: `tests/e2e/`
- **Purpose**: Test complete user journeys
- **Database**: Required (test DB)
- **Speed**: Slow (5-10 min)
- **Command**: `npm run test:e2e`

## 🏃 Running Tests

### All Tests
```bash
npm run test:all && npm run test:integration && npm run test:e2e
```

### Specific Service
```bash
nx test business-service
nx test auth-service
```

### With Coverage
```bash
npm run test:integration:cov
open coverage/integration/lcov-report/index.html
```

### Watch Mode
```bash
npm run test:integration:watch
```

## 📁 Test Structure

```
tests/
├── integration/              # Service integration tests
│   ├── auth.integration.spec.ts
│   ├── business.integration.spec.ts
│   ├── party.integration.spec.ts
│   ├── inventory.integration.spec.ts
│   ├── invoice.integration.spec.ts
│   └── payment.integration.spec.ts
├── e2e/                      # End-to-end tests
│   ├── user-journey.spec.ts
│   ├── invoice-payment-flow.spec.ts
│   └── error-scenarios.spec.ts
├── fixtures/                 # Test data
│   └── test-data.factory.ts
└── helpers/                  # Test utilities
    ├── test-db.setup.ts
    └── api-client.ts
```

## ✍️ Writing Tests

### Integration Test Template

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { AppModule } from '../../apps/service-name/src/app.module';
import { createTestDataSource, closeTestDataSource, cleanDatabase } from '../helpers/test-db.setup';
import { ApiClient } from '../helpers/api-client';
import { TestDataFactory } from '../fixtures/test-data.factory';

describe('Service Integration Tests', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let apiClient: ApiClient;

  beforeAll(async () => {
    dataSource = await createTestDataSource([Entity], 'test_db');
    const module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = module.createNestApplication();
    await app.init();
    apiClient = new ApiClient(app);
  });

  afterEach(async () => {
    await cleanDatabase(dataSource);
  });

  afterAll(async () => {
    await app.close();
    await closeTestDataSource();
  });

  it('should work (OK)', async () => {
    const data = TestDataFactory.createData();
    const response = await apiClient.post('/api/v1/endpoint', data);
    expect(response.status).toBe(201);
  });

  it('should reject invalid data (NOK)', async () => {
    const response = await apiClient.post('/api/v1/endpoint', {});
    expect(response.status).toBe(400);
  });
});
```

## 🔧 Troubleshooting

### Database Issues
```bash
# Check database status
docker ps | grep postgres-test

# Restart database
docker restart business-postgres-test

# Recreate database
./scripts/test-setup.sh
```

### Port Conflicts
```bash
# Find process using port
lsof -i :5433

# Use different port
export TEST_DB_PORT=5434
```

### Module Not Found
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

### Test Timeouts
```bash
# Increase timeout in jest config
testTimeout: 60000
```

## 🔄 CI/CD

Tests run automatically in GitHub Actions:
- On every push
- On every PR
- Before merging

See `.github/workflows/ci.yml` for configuration.

## 📊 Coverage

### Targets
- Unit Tests: 100%
- Integration Tests: All endpoints
- E2E Tests: Critical flows

### View Reports
```bash
npm run test:integration:cov
open coverage/integration/lcov-report/index.html
```

## 📝 Best Practices

1. **Test Independence**: Each test should be independent
2. **Clear Names**: Describe what is being tested
3. **AAA Pattern**: Arrange-Act-Assert
4. **Test Both**: OK and NOK scenarios
5. **Use Fixtures**: Don't hardcode data
6. **Clean Up**: Always clean after tests
7. **Fast Tests**: Keep tests fast
8. **Meaningful Assertions**: Test behavior

## 🎯 Test Scenarios

### OK Scenarios
- ✅ Successful operations
- ✅ Valid data
- ✅ Proper authentication
- ✅ Expected responses

### NOK Scenarios
- ❌ Invalid input
- ❌ Unauthorized access
- ❌ Duplicate data
- ❌ Missing fields
- ❌ Business rule violations

## 📚 Resources

- [Test Execution Guide](./TEST_EXECUTION_GUIDE.md)
- [Testing Strategy](./TESTING_STRATEGY.md)
- [Quick Start](./QUICK_START_TESTING.md)
- [TDD Strategy](../docs/TDD_STRATEGY.md)

---

**Happy Testing!** 🧪

