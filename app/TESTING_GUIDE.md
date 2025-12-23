# Testing Guide - Business Management System

## Overview

This project has a comprehensive testing strategy with **ALL tests managed through the Makefile**. You can run any test suite with simple `make` commands.

## Test Pyramid

```
                    🎯 360-Degree Tests (Comprehensive)
                   /                                    \
                  /    Security | Performance | Edge    \
                 /     Concurrency | Integrity | Etc.    \
                /________________________________________\
               
                        🎭 E2E Tests (User Flows)
                       /                          \
                      /    10 User Personas         \
                     /________________________________\
                    
                          🔌 Integration Tests
                         /                      \
                        /    API + DB Tests      \
                       /__________________________\
                      
                              🧪 Unit Tests
                             /              \
                            /  Service Logic  \
                           /____________________\
```

## Quick Reference

| Command | Description | Duration |
|---------|-------------|----------|
| `make test` | Run all tests | ~15 min |
| `make test-unit` | Unit tests only | ~2 min |
| `make test-integration` | Integration tests | ~3 min |
| `make test-e2e` | E2E tests (10 personas) | ~5 min |
| `make test-360` | 360-degree comprehensive | ~10 min |
| `make test-360-edge` | Edge cases only | ~2 min |
| `make test-360-security` | Security tests | ~3 min |
| `make test-360-perf` | Performance tests | ~4 min |
| `make test-360-concurrency` | Concurrency tests | ~2 min |
| `make t360` | Alias for test-360 | ~10 min |

## Test Categories

### 1. Unit Tests (`make test-unit`)
**Purpose**: Test individual service logic in isolation

**What's tested:**
- Service methods
- Utility functions
- Validation logic
- Business calculations

**Command:**
```bash
make test-unit
# or alias
make tu
```

**Framework:** Jest + NestJS Testing

---

### 2. Integration Tests (`make test-integration`)
**Purpose**: Test API endpoints with real database

**What's tested:**
- REST API endpoints
- Database operations
- Service interactions
- Data persistence

**Command:**
```bash
make test-integration
# or alias
make ti
```

**Framework:** Jest + Supertest

---

### 3. E2E Tests (`make test-e2e`)
**Purpose**: Test complete user workflows with 10 personas

**10 User Personas:**
1. **Pharmacy Owner** - Medical supplies & GST invoicing
2. **Retail Kirana Store** - Basic inventory & billing
3. **Restaurant Manager** - Daily sales & expenses
4. **Clothing Boutique** - Seasonal inventory & discounts
5. **Electronics Dealer** - High-value items & warranties
6. **Grocery Wholesaler** - Bulk sales & credit management
7. **Freelance Consultant** - Service invoicing & expenses
8. **Small Manufacturing Unit** - Raw materials & production
9. **Mobile Accessories Shop** - Fast inventory turnover
10. **Automobile Parts Dealer** - Complex inventory & GST

**Command:**
```bash
make test-e2e
# or alias
make te
```

**Framework:** Playwright

---

### 4. 360-Degree Tests (`make test-360`)
**Purpose**: Comprehensive testing covering edge cases, security, performance, and resilience

#### 4a. Edge Cases (`make test-360-edge`)
**Tests:**
- Phone validation (10-digit, boundary cases)
- GSTIN validation (state codes, format)
- Amount/quantity boundaries
- Date validation (timezone, formats)
- GST calculation (0%, 5%, 12%, 18%, 28%)

**Test Count:** ~85 tests

---

#### 4b. Security Tests (`make test-360-security`)
**Tests:**
- SQL injection prevention
- XSS sanitization
- Authentication validation
- Authorization (IDOR prevention)
- Input validation security
- Rate limiting
- Path traversal prevention

**Test Count:** ~35 tests

---

#### 4c. Performance Tests (`make test-360-perf`)
**Tests:**
- Response time thresholds
- Large dataset handling
- Concurrent operations
- Query performance
- Stress tests
- Memory leak detection

**Performance Thresholds:**
- List endpoints: < 2000ms
- Create operations: < 1000ms
- Get single item: < 500ms
- Search operations: < 3000ms

**Test Count:** ~25 tests

---

#### 4d. Concurrency Tests (`make test-360-concurrency`)
**Tests:**
- Invoice number uniqueness
- Stock deduction race conditions
- Payment recording concurrency
- Duplicate prevention

**Test Count:** ~12 tests

---

#### 4e. All 360 Categories
**Command:**
```bash
make test-360
# or alias
make t360
```

**Includes:**
- Edge cases
- Concurrency
- Business rules
- Data integrity
- Security
- Performance
- Integration failures
- Error recovery

**Total Test Count:** ~260 tests

---

## Running Tests

### Prerequisites
```bash
# Install dependencies
make install

# Start services
make start

# Verify services are running
make health
```

### Run Specific Test Suite
```bash
# Unit tests
make test-unit

# Integration tests  
make test-integration

# E2E tests
make test-e2e

# 360-degree tests
make test-360

# Specific 360 category
make test-360-edge
make test-360-security
make test-360-perf
make test-360-concurrency
```

### Run All Tests
```bash
make test-all
# This runs in sequence:
# 1. Unit tests
# 2. Integration tests
# 3. E2E tests
# 4. 360-degree tests
```

### Interactive Mode
```bash
# E2E with UI
make test-e2e-ui

# 360 with UI
make test-360-ui
```

## Test Reports

### View Latest Report
```bash
# E2E report
npx playwright show-report

# 360-degree report
npx playwright show-report test-reports/360-degree
```

### Report Locations
- E2E: `playwright-report/`
- 360-degree: `test-reports/360-degree/`
- Unit/Integration: `coverage/`

## CI/CD Integration

### GitHub Actions
```yaml
- name: Run Unit Tests
  run: make test-unit

- name: Run Integration Tests  
  run: make test-integration

- name: Run E2E Tests
  run: make test-e2e
  
- name: Run 360 Tests
  run: make test-360
```

### Pre-commit Hook
```bash
#!/bin/bash
# Run unit tests before commit
make test-unit
```

### Pre-push Hook
```bash
#!/bin/bash
# Run all tests before push
make test-all
```

## Troubleshooting

### Services Not Starting
```bash
# Check health
make health

# View logs
make logs

# Restart services
make restart
```

### Database Issues
```bash
# Reset databases
make db-reset

# Run migrations
make db-migrate
```

### Port Conflicts
```bash
# Stop all services
make stop

# Kill any lingering processes
pkill -f "nx serve"

# Start fresh
make start
```

### Test Failures

#### Unit Tests Failing
```bash
# Clear cache
rm -rf node_modules/.cache

# Reinstall
make install

# Run again
make test-unit
```

#### Integration Tests Failing
```bash
# Reset test database
make db-reset

# Wait for services
sleep 10

# Run again
make test-integration
```

#### E2E/360 Tests Failing
```bash
# Check services
make health

# Restart services
make restart

# Wait for stability
sleep 30

# Run again
make test-e2e
```

## Test Development

### Adding New Unit Tests
1. Create test file: `apps/[service]/src/**/*.spec.ts`
2. Run: `make test-unit`

### Adding New Integration Tests
1. Create test file: `apps/[service]/test/**/*.e2e-spec.ts`
2. Run: `make test-integration`

### Adding New E2E Tests
1. Add to: `e2e/api-e2e.spec.ts`
2. Run: `make test-e2e`

### Adding New 360 Tests
1. Choose category: `tests/[category]/`
2. Create spec file: `*.spec.ts`
3. Use utilities from: `tests/utils/`
4. Run: `make test-360`

## Best Practices

### When to Run Each Test Type

| Situation | Command | Why |
|-----------|---------|-----|
| Before commit | `make test-unit` | Fast feedback |
| Before PR | `make test-all` | Full validation |
| Feature complete | `make test-360` | Comprehensive check |
| Security review | `make test-360-security` | Vulnerability scan |
| Performance tuning | `make test-360-perf` | Benchmark verification |
| Bug fix | Related test suite | Regression check |

### Test Naming Conventions
- Unit: `*.spec.ts`
- Integration: `*.e2e-spec.ts`
- E2E: `api-e2e.spec.ts`
- 360: `tests/[category]/*.spec.ts`

### Test Organization
```
app/
├── apps/[service]/
│   ├── src/**/*.spec.ts           # Unit tests
│   └── test/**/*.e2e-spec.ts      # Integration tests
├── e2e/
│   └── api-e2e.spec.ts            # E2E tests
└── tests/
    ├── utils/                      # Shared utilities
    ├── edge-cases/                 # Edge case tests
    ├── security/                   # Security tests
    ├── performance/                # Performance tests
    └── [other-categories]/         # Other 360 tests
```

## Summary

✅ **All tests are managed through Makefiles**  
✅ **Simple commands for every test type**  
✅ **Comprehensive coverage (unit → integration → e2e → 360)**  
✅ **Easy to run, easy to maintain**

For more details on specific test categories, see:
- [360-Degree Tests README](tests/README.md)
- [E2E Tests README](e2e/README.md)
