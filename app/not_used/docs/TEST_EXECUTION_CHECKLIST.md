# Test Execution Checklist

## 🧪 Complete Test Execution Guide

This document provides a step-by-step checklist to run and verify all test types.

---

## ✅ Pre-Execution Checklist

Before running tests, ensure:

- [ ] Test database is running
  ```bash
  docker ps | grep postgres-test
  ```

- [ ] Dependencies are installed
  ```bash
  npm install
  ```

- [ ] Environment is configured
  ```bash
  cat .env.test
  ```

---

## 🧪 Test Execution Steps

### Step 1: Unit Tests

**Command:**
```bash
npm run test:all
```

**Expected Output:**
- All service unit tests should pass
- Coverage reports generated
- No errors or failures

**What to Check:**
- [ ] All services tested (auth, business, party, inventory, invoice, payment)
- [ ] 100% test coverage
- [ ] No test failures
- [ ] All assertions passing

**If Tests Fail:**
- Check error messages
- Verify service implementations
- Check test data
- Review test expectations

---

### Step 2: Integration Tests

**Command:**
```bash
npm run test:integration
```

**Expected Output:**
- All integration tests should pass
- Database operations working
- API endpoints responding correctly

**What to Check:**
- [ ] Auth Service integration tests pass
- [ ] Business Service integration tests pass
- [ ] Party Service integration tests pass
- [ ] Inventory Service integration tests pass
- [ ] Invoice Service integration tests pass
- [ ] Payment Service integration tests pass
- [ ] Database cleanup working
- [ ] Test isolation maintained

**If Tests Fail:**
- Check database connection
- Verify test database is running
- Check API endpoints
- Review test data setup
- Check service dependencies

---

### Step 3: E2E Tests

**Command:**
```bash
npm run test:e2e
```

**Expected Output:**
- Complete user journey tests pass
- Cross-service integration working
- Error scenarios handled correctly

**What to Check:**
- [ ] User journey flow works
- [ ] Invoice-Payment flow works
- [ ] Error scenarios handled
- [ ] Data consistency maintained

**If Tests Fail:**
- Check service orchestration
- Verify service dependencies
- Check data flow
- Review error handling

---

## 📊 Test Results Verification

### Unit Tests Results

**Check:**
- [ ] Test count matches expected
- [ ] All tests passing
- [ ] Coverage at 100%
- [ ] No skipped tests
- [ ] Execution time reasonable

**Expected:**
- ~100+ test cases
- 100% coverage
- < 1 minute execution

### Integration Tests Results

**Check:**
- [ ] All 65+ test cases passing
- [ ] OK scenarios working
- [ ] NOK scenarios handled
- [ ] Database operations successful
- [ ] API responses correct

**Expected:**
- 65+ test cases
- All endpoints covered
- 2-5 minutes execution

### E2E Tests Results

**Check:**
- [ ] Complete flows working
- [ ] Cross-service integration
- [ ] Error handling
- [ ] Data consistency

**Expected:**
- Critical flows covered
- 5-10 minutes execution

---

## 🔍 Detailed Verification

### Service-by-Service Check

#### Auth Service
- [ ] OTP generation works
- [ ] OTP verification works
- [ ] Token refresh works
- [ ] Rate limiting works
- [ ] User profile management works

#### Business Service
- [ ] Business creation works
- [ ] GSTIN validation works
- [ ] Duplicate prevention works
- [ ] Multi-business support works

#### Party Service
- [ ] Party CRUD works
- [ ] Search works
- [ ] Ledger calculation works

#### Inventory Service
- [ ] Item management works
- [ ] Stock adjustment works
- [ ] Low stock alerts work

#### Invoice Service
- [ ] Invoice creation works
- [ ] GST calculation correct
- [ ] Multiple items work
- [ ] Filtering works

#### Payment Service
- [ ] Payment recording works
- [ ] Invoice linking works
- [ ] Multiple modes work

---

## 🐛 Troubleshooting

### Common Issues

#### Database Connection Errors
```bash
# Check database
docker ps | grep postgres-test

# Restart if needed
docker restart business-postgres-test

# Check connection
psql -h localhost -p 5433 -U test -d business_test_db
```

#### Module Not Found
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

#### Test Timeouts
```bash
# Increase timeout in jest config
# Edit jest.integration.config.ts
testTimeout: 60000
```

#### Port Conflicts
```bash
# Check port usage
lsof -i :5433

# Use different port
export TEST_DB_PORT=5434
```

---

## 📈 Success Criteria

### All Tests Must:
- [ ] Pass without errors
- [ ] Complete in reasonable time
- [ ] Maintain test isolation
- [ ] Clean up after execution
- [ ] Generate coverage reports

### Coverage Targets:
- [ ] Unit Tests: 100%
- [ ] Integration Tests: All endpoints
- [ ] E2E Tests: Critical flows

---

## 🎯 Quick Run All Tests

**Use the automation script:**
```bash
./scripts/run-all-tests.sh
```

**Or manually:**
```bash
npm run test:all && \
npm run test:integration && \
npm run test:e2e
```

---

## 📝 Test Execution Log

After running tests, document:

1. **Execution Date**: ___________
2. **Unit Tests**: Pass / Fail
3. **Integration Tests**: Pass / Fail
4. **E2E Tests**: Pass / Fail
5. **Issues Found**: ___________
6. **Resolution**: ___________

---

## ✅ Final Checklist

- [ ] All unit tests passing
- [ ] All integration tests passing
- [ ] All E2E tests passing
- [ ] Coverage targets met
- [ ] No critical issues
- [ ] Ready for UI development

---

**Status**: Ready to Execute Tests

**Next**: Run `./scripts/run-all-tests.sh` or follow steps above

