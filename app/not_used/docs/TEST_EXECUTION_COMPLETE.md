# Complete Test Execution Guide

## 🎯 Overview

This guide provides complete instructions to run and verify all test types.

---

## ✅ Pre-Flight Checklist

Before running tests, verify:

- [x] Test database is running (✅ Already done)
- [x] Dependencies installed (✅ Already done)
- [x] Environment configured (✅ Already done)
- [ ] All services can compile
- [ ] Test files are accessible

---

## 🚀 Running All Tests

### Quick Command (Recommended)
```bash
# Run all tests with one command
./scripts/run-all-tests.sh
```

This script will:
1. Run unit tests
2. Run integration tests
3. Run E2E tests
4. Generate summary report

### Manual Execution

#### Step 1: Unit Tests
```bash
npm run test:all
```

**What to Expect:**
- Tests for all 6 services
- ~100+ test cases
- 100% coverage
- Execution time: < 1 minute

**Verify:**
- [ ] All test suites pass
- [ ] No errors
- [ ] Coverage at 100%

#### Step 2: Integration Tests
```bash
npm run test:integration
```

**What to Expect:**
- 65+ integration test cases
- Real database operations
- API endpoint testing
- Execution time: 2-5 minutes

**Verify:**
- [ ] All integration tests pass
- [ ] Database operations work
- [ ] API endpoints respond
- [ ] OK and NOK scenarios pass

#### Step 3: E2E Tests
```bash
npm run test:e2e
```

**What to Expect:**
- Complete user journeys
- Cross-service integration
- Error scenarios
- Execution time: 5-10 minutes

**Verify:**
- [ ] E2E flows work
- [ ] Cross-service integration works
- [ ] Error handling works

---

## 📊 Test Results Interpretation

### Successful Test Run

**Unit Tests:**
```
PASS  apps/auth-service/src/services/auth.service.spec.ts
PASS  apps/business-service/src/services/business.service.spec.ts
...
Test Suites: 6 passed, 6 total
Tests:       100+ passed
Time:        45.234 s
```

**Integration Tests:**
```
PASS  tests/integration/auth.integration.spec.ts
PASS  tests/integration/business.integration.spec.ts
...
Test Suites: 6 passed, 6 total
Tests:       65+ passed
Time:        3m 12.456s
```

**E2E Tests:**
```
PASS  tests/e2e/user-journey.spec.ts
PASS  tests/e2e/invoice-payment-flow.spec.ts
...
Test Suites: 3 passed, 3 total
Tests:       Multiple flows passed
Time:        8m 34.567s
```

### Failed Test Run

If tests fail, you'll see:
```
FAIL  tests/integration/auth.integration.spec.ts
  Auth Service Integration Tests
    POST /api/v1/auth/send-otp
      ✕ should send OTP successfully (OK) (1234 ms)

  ● Auth Service Integration Tests › POST /api/v1/auth/send-otp › should send OTP successfully (OK)

    Expected 201, received 500

      123 |       const response = await apiClient.sendOtp(testPhone);
      124 |
    > 125 |       expect(response.status).toBe(201);
         |                                ^
```

---

## 🔧 Potential Issues & Fixes

### Issue 1: DataSource Override

**Problem:** Integration tests may fail with DataSource override errors.

**Solution:** The tests use `overrideProvider(DataSource)` which may need adjustment. If tests fail, you may need to override `TypeOrmModule` instead:

```typescript
// Alternative approach if DataSource override doesn't work
.overrideModule(TypeOrmModule)
.useModule(
  TypeOrmModule.forRoot({
    // test database config
  })
)
```

### Issue 2: Module Import Errors

**Problem:** Tests can't find AppModule or entities.

**Solution:**
- Verify all imports are correct
- Check entity paths
- Ensure TypeScript paths are configured

### Issue 3: Database Connection

**Problem:** Tests can't connect to test database.

**Solution:**
```bash
# Check database
docker ps | grep postgres-test

# Verify connection
psql -h localhost -p 5433 -U test -d business_test_db

# Restart if needed
docker restart business-postgres-test
```

### Issue 4: Service Dependencies

**Problem:** Services can't start in tests.

**Solution:**
- Mock external dependencies
- Use test doubles
- Simplify service initialization

---

## 📝 Test Execution Log Template

```
========================================
TEST EXECUTION REPORT
========================================
Date: ___________
Environment: Development
Tester: ___________

UNIT TESTS
----------------------------------------
Status: [ ] Pass [ ] Fail
Test Suites: ___________
Tests: ___________
Time: ___________
Coverage: ___________
Issues: ___________

INTEGRATION TESTS
----------------------------------------
Status: [ ] Pass [ ] Fail
Test Suites: ___________
Tests: ___________
Time: ___________
Failed Tests: ___________
Issues: ___________

E2E TESTS
----------------------------------------
Status: [ ] Pass [ ] Fail
Test Suites: ___________
Tests: ___________
Time: ___________
Failed Flows: ___________
Issues: ___________

OVERALL STATUS
----------------------------------------
[ ] All Tests Pass
[ ] Some Tests Fail
[ ] Critical Issues Found

ISSUES & RESOLUTION
----------------------------------------
Issue 1: ___________
Resolution: ___________

Issue 2: ___________
Resolution: ___________

NEXT STEPS
----------------------------------------
[ ] Fix failing tests
[ ] Update test data
[ ] Review coverage
[ ] Proceed to UI development
```

---

## ✅ Success Criteria

All tests are successful when:

### Unit Tests ✅
- [ ] All 6 services tested
- [ ] 100+ test cases pass
- [ ] 100% coverage achieved
- [ ] No errors or warnings
- [ ] Execution < 1 minute

### Integration Tests ✅
- [ ] All 6 services tested
- [ ] 65+ test cases pass
- [ ] All API endpoints covered
- [ ] OK and NOK scenarios pass
- [ ] Database operations work
- [ ] Execution 2-5 minutes

### E2E Tests ✅
- [ ] User journey flows work
- [ ] Cross-service integration works
- [ ] Error scenarios handled
- [ ] Data consistency maintained
- [ ] Execution 5-10 minutes

---

## 🎯 Quick Commands Reference

```bash
# Setup (already done)
npm run test:setup

# Run all tests
./scripts/run-all-tests.sh

# Run individually
npm run test:all              # Unit tests
npm run test:integration      # Integration tests
npm run test:e2e              # E2E tests

# With coverage
npm run test:integration:cov

# Cleanup
npm run test:cleanup
```

---

## 📚 Additional Resources

- [TEST_EXECUTION_GUIDE.md](./TEST_EXECUTION_GUIDE.md) - Detailed guide
- [TEST_EXECUTION_CHECKLIST.md](./TEST_EXECUTION_CHECKLIST.md) - Checklist
- [TEST_VERIFICATION_SUMMARY.md](./TEST_VERIFICATION_SUMMARY.md) - Verification
- [TEST_RUN_INSTRUCTIONS.md](./TEST_RUN_INSTRUCTIONS.md) - Instructions

---

## 🎉 Ready to Test!

**Status**: ✅ Test environment ready

**Action**: Run `./scripts/run-all-tests.sh` to execute all tests!

**Expected**: All tests should pass, verifying that all APIs work correctly.

---

**Next**: Once tests pass, you're ready for UI development! 🚀

