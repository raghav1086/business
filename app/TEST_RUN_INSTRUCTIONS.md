# Test Run Instructions

## 🚀 Quick Start

Since you've successfully set up the test environment, here's how to run all tests:

## 📋 Manual Test Execution

### Option 1: Run All Tests (Recommended)
```bash
# Use the automation script
./scripts/run-all-tests.sh

# Or use npm script
npm run test:run-all
```

### Option 2: Run Tests Individually

#### 1. Unit Tests
```bash
npm run test:all
```
**Expected**: All unit tests for 6 services should pass

#### 2. Integration Tests
```bash
npm run test:integration
```
**Expected**: 65+ integration tests should pass

#### 3. E2E Tests
```bash
npm run test:e2e
```
**Expected**: E2E tests for complete user journeys should pass

---

## 🔍 What Each Test Type Checks

### Unit Tests
- ✅ Individual functions and methods
- ✅ Service business logic
- ✅ Repository operations
- ✅ Controller endpoints
- ✅ Validation logic
- ✅ Error handling

**Services Tested:**
- Auth Service
- Business Service
- Party Service
- Inventory Service
- Invoice Service
- Payment Service

### Integration Tests
- ✅ API endpoints with real database
- ✅ Complete request/response cycle
- ✅ Database operations
- ✅ Data persistence
- ✅ Business rules
- ✅ Error scenarios

**Test Scenarios:**
- OK scenarios (happy path)
- NOK scenarios (error cases)
- Validation tests
- Authorization tests
- Data consistency tests

### E2E Tests
- ✅ Complete user journeys
- ✅ Cross-service integration
- ✅ End-to-end workflows
- ✅ Error propagation
- ✅ Data consistency across services

**Flows Tested:**
- User registration → Business setup → Invoice → Payment
- Invoice creation with stock deduction
- Error handling across services

---

## 📊 Expected Results

### Unit Tests
- **Test Count**: ~100+ tests
- **Coverage**: 100%
- **Execution Time**: < 1 minute
- **Status**: All passing ✅

### Integration Tests
- **Test Count**: 65+ tests
- **Coverage**: All API endpoints
- **Execution Time**: 2-5 minutes
- **Status**: All passing ✅

### E2E Tests
- **Test Count**: Multiple flows
- **Coverage**: Critical journeys
- **Execution Time**: 5-10 minutes
- **Status**: All passing ✅

---

## 🐛 If Tests Fail

### Check These First:

1. **Database Running?**
   ```bash
   docker ps | grep postgres-test
   ```

2. **Dependencies Installed?**
   ```bash
   ls node_modules | head -5
   ```

3. **Environment Configured?**
   ```bash
   cat .env.test
   ```

4. **Services Accessible?**
   - Check if services can start
   - Verify ports are available
   - Check service dependencies

### Common Fixes:

**Database Issues:**
```bash
# Restart database
docker restart business-postgres-test

# Or recreate
./scripts/test-setup.sh
```

**Module Issues:**
```bash
# Reinstall
rm -rf node_modules
npm install
```

**Port Conflicts:**
```bash
# Check ports
lsof -i :3001-3006

# Kill conflicting processes
kill -9 <PID>
```

---

## 📝 Test Execution Log Template

After running tests, document results:

```
Date: ___________
Tester: ___________

Unit Tests:
  - Status: [ ] Pass [ ] Fail
  - Count: ___________
  - Coverage: ___________
  - Issues: ___________

Integration Tests:
  - Status: [ ] Pass [ ] Fail
  - Count: ___________
  - Failed Tests: ___________
  - Issues: ___________

E2E Tests:
  - Status: [ ] Pass [ ] Fail
  - Failed Flows: ___________
  - Issues: ___________

Overall Status: [ ] Ready [ ] Needs Fixes
```

---

## ✅ Success Criteria

All tests are successful when:

- [ ] All unit tests pass (100% coverage)
- [ ] All integration tests pass (all endpoints)
- [ ] All E2E tests pass (critical flows)
- [ ] No critical errors
- [ ] Test execution completes
- [ ] Coverage reports generated

---

## 🎯 Next Steps After Tests Pass

1. ✅ Review test results
2. ✅ Check coverage reports
3. ✅ Fix any issues found
4. ✅ Document test results
5. ✅ Proceed with UI development

---

## 📚 Additional Resources

- [TEST_EXECUTION_GUIDE.md](./TEST_EXECUTION_GUIDE.md) - Detailed guide
- [TEST_EXECUTION_CHECKLIST.md](./TEST_EXECUTION_CHECKLIST.md) - Checklist
- [QUICK_START_TESTING.md](./QUICK_START_TESTING.md) - Quick reference

---

**Ready to run tests!** Execute `./scripts/run-all-tests.sh` to run everything! 🚀

