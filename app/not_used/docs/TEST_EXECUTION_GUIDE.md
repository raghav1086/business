# Test Execution Guide

## Prerequisites

### 1. Install Dependencies
```bash
cd app
npm install
```

### 2. Start Test Database
```bash
# Using Docker Compose
docker-compose up postgres-test -d

# Or manually
docker run -d \
  --name business-postgres-test \
  -e POSTGRES_USER=test \
  -e POSTGRES_PASSWORD=test \
  -e POSTGRES_DB=business_test_db \
  -p 5433:5432 \
  postgres:15-alpine
```

### 3. Verify Database Connection
```bash
# Check if database is running
docker ps | grep postgres-test

# Test connection
psql -h localhost -p 5433 -U test -d business_test_db
```

## Running Tests

### Unit Tests (Fast - No Database)
```bash
# Run all unit tests
npm run test:all

# Run specific service
nx test business-service
nx test auth-service

# Run with coverage
npm run test:cov

# Run in watch mode
npm run test:watch
```

### Integration Tests (Medium - With Database)
```bash
# Run all integration tests
npm run test:integration

# Run specific test file
npm run test:integration -- auth.integration.spec.ts

# Run with coverage
npm run test:integration:cov

# Run in watch mode
npm run test:integration:watch
```

### E2E Tests (Slow - Full Flow)
```bash
# Run all E2E tests
npm run test:e2e

# Run specific E2E test
npm run test:e2e -- user-journey.spec.ts

# Run in watch mode
npm run test:e2e:watch
```

### All Tests
```bash
# Run all test types sequentially
npm run test:all && npm run test:integration && npm run test:e2e
```

## Environment Variables

Create `.env.test` file in `app/` directory:

```env
# Test Database Configuration
TEST_DB_HOST=localhost
TEST_DB_PORT=5433
TEST_DB_USERNAME=test
TEST_DB_PASSWORD=test
TEST_DB_NAME=business_test_db

# Service Configuration
NODE_ENV=test
LOG_LEVEL=error

# Auth Service (if needed)
JWT_SECRET=test-secret-key
JWT_EXPIRES_IN=1h
REFRESH_TOKEN_EXPIRES_IN=7d
```

## Test Execution Flow

### 1. Pre-Test Setup
- Test database is automatically created
- Tables are synchronized
- Test data factories are available

### 2. Test Execution
- Each test runs in isolation
- Database is cleaned after each test
- No test dependencies

### 3. Post-Test Cleanup
- Database is cleaned
- Connections are closed
- Coverage reports generated

## Troubleshooting

### Database Connection Issues

**Problem**: Cannot connect to test database
```bash
# Solution 1: Check if database is running
docker ps | grep postgres-test

# Solution 2: Restart database
docker-compose restart postgres-test

# Solution 3: Check port
netstat -an | grep 5433
```

### Port Already in Use

**Problem**: Port 5433 already in use
```bash
# Solution 1: Use different port
export TEST_DB_PORT=5434

# Solution 2: Stop conflicting service
docker stop $(docker ps -q --filter "publish=5433")
```

### Test Timeout

**Problem**: Tests timing out
```bash
# Solution: Increase timeout in jest config
# Edit jest.integration.config.ts
testTimeout: 60000  // 60 seconds
```

### Memory Issues

**Problem**: Out of memory errors
```bash
# Solution: Run tests sequentially
# Already configured with maxWorkers: 1
```

### Module Not Found

**Problem**: Cannot find module errors
```bash
# Solution: Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

## Test Coverage

### View Coverage Reports
```bash
# Generate coverage
npm run test:integration:cov

# View HTML report
open coverage/integration/lcov-report/index.html
```

### Coverage Targets
- **Unit Tests**: 100% coverage
- **Integration Tests**: All API endpoints
- **E2E Tests**: Critical user journeys

## CI/CD Integration

Tests run automatically in GitHub Actions:
- On every push to main/develop
- On every pull request
- Before merging

### Local CI Simulation
```bash
# Run all tests as CI would
npm run test:all && \
npm run test:integration && \
npm run test:e2e && \
npm run lint:all
```

## Best Practices

1. **Run Tests Before Committing**
   ```bash
   npm run test:all
   ```

2. **Run Integration Tests Before PR**
   ```bash
   npm run test:integration
   ```

3. **Run E2E Tests Before Release**
   ```bash
   npm run test:e2e
   ```

4. **Check Coverage Regularly**
   ```bash
   npm run test:integration:cov
   ```

5. **Fix Failing Tests Immediately**
   - Don't commit failing tests
   - Fix or skip with reason
   - Update tests if behavior changes

## Test Data

### Using TestDataFactory
```typescript
import { TestDataFactory } from '../fixtures/test-data.factory';

const business = TestDataFactory.createBusiness();
const party = TestDataFactory.createParty();
const item = TestDataFactory.createItem();
```

### Custom Test Data
```typescript
const customBusiness = TestDataFactory.createBusiness({
  name: 'Custom Business',
  gstin: '27AABCU9603R1ZX',
});
```

## Debugging Tests

### Run Single Test
```bash
npm run test:integration -- -t "should create business successfully"
```

### Debug Mode
```bash
# Add debugger statement in test
debugger;

# Run with Node debugger
node --inspect-brk node_modules/.bin/jest --runInBand test:integration
```

### Verbose Output
```bash
npm run test:integration -- --verbose
```

## Performance

### Test Execution Time
- **Unit Tests**: < 1 minute
- **Integration Tests**: 2-5 minutes
- **E2E Tests**: 5-10 minutes

### Optimization Tips
1. Run tests in parallel (unit tests only)
2. Use test database connection pooling
3. Clean database efficiently
4. Skip slow tests in development

## Next Steps

1. ✅ Install dependencies
2. ✅ Start test database
3. ✅ Run unit tests
4. ✅ Run integration tests
5. ✅ Run E2E tests
6. ✅ Fix any failures
7. ✅ Check coverage
8. ✅ Commit working tests

---

**Ready to test!** 🚀

