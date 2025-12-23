# 360-Degree Testing Suite

Comprehensive testing suite for the business application covering edge cases, race conditions, business rules, data integrity, security, performance, and failure scenarios.

## Test Structure

```
tests/
├── utils/
│   ├── test-helpers.ts      # Test data factories and utilities
│   ├── api-client.ts        # API client wrapper with auth
│   └── index.ts             # Export barrel
├── edge-cases/
│   ├── phone-validation.spec.ts
│   ├── gstin-validation.spec.ts
│   ├── amount-quantity-validation.spec.ts
│   ├── date-validation.spec.ts
│   └── gst-calculation.spec.ts
├── concurrency/
│   └── race-conditions.spec.ts
├── business-rules/
│   └── violations.spec.ts
├── integrity/
│   └── data-consistency.spec.ts
├── security/
│   └── vulnerabilities.spec.ts
├── performance/
│   └── load-tests.spec.ts
├── integration/
│   └── failures.spec.ts
└── resilience/
    └── error-recovery.spec.ts
```

## Test Categories

### 1. Edge Cases (`edge-cases/`)
- **Phone validation**: Valid/invalid formats, boundary values, special characters
- **GSTIN validation**: State codes, format validation, duplicates
- **Amount/quantity validation**: Boundaries, decimals, negatives, maximums
- **Date validation**: Formats, timezone handling, future/past dates
- **GST calculation**: Tax rates (0%, 5%, 12%, 18%, 28%), inter/intra state, CESS, rounding

### 2. Concurrency (`concurrency/`)
- Invoice number uniqueness under concurrent creation
- Stock deduction race conditions
- Payment recording concurrency
- Duplicate GSTIN prevention
- Concurrent stock updates

### 3. Business Rules (`business-rules/`)
- Invoice rules: Empty items, invalid party, date constraints
- Payment rules: Amount > balance, cancelled invoice payments
- Stock rules: Negative stock prevention, adjustment validation
- Party rules: Duplicate GSTIN, invalid formats
- Item rules: Negative prices, duplicate SKU

### 4. Data Integrity (`integrity/`)
- Transaction rollback on failure
- Referential integrity (party → invoice → payment)
- Invoice totals consistency
- Stock consistency across operations
- Payment balance consistency
- Cascade deletion handling

### 5. Security (`security/`)
- SQL injection prevention
- XSS sanitization
- Authentication validation
- Authorization (IDOR prevention)
- Input validation security
- Rate limiting
- Path traversal prevention
- CORS configuration

### 6. Performance (`performance/`)
- Response time thresholds
- Large dataset handling
- Concurrent operations
- Memory/resource tests
- Query performance
- Stress tests
- Database connection handling

### 7. Integration Failures (`integration/`)
- Service unavailability handling
- Partial failure scenarios
- Timeout handling
- Network error handling
- Cross-service failures
- Error response format consistency
- Idempotency
- Health checks

### 8. Error Recovery (`resilience/`)
- Error message quality
- Recovery after failures
- Retry logic patterns
- Graceful degradation
- State consistency after errors
- Circuit breaker patterns
- Session recovery
- Resource cleanup

## Running Tests

### Prerequisites
1. All services running (auth, business, party, inventory, invoice, payment)
2. Test database available
3. Node.js and npm installed

### Run All Tests
```bash
npm run test:360
```

### Run Specific Category
```bash
# Edge cases
npx playwright test tests/edge-cases/

# Security
npx playwright test tests/security/

# Performance
npx playwright test tests/performance/

# Concurrency
npx playwright test tests/concurrency/
```

### Run with UI
```bash
npx playwright test --ui
```

### Run with Report
```bash
npx playwright test --reporter=html
```

## Test Configuration

Tests use the following configuration:

| Setting | Value |
|---------|-------|
| Test OTP | `129012` |
| Auth Service | `http://localhost:3002` |
| Business Service | `http://localhost:3003` |
| Party Service | `http://localhost:3004` |
| Inventory Service | `http://localhost:3005` |
| Invoice Service | `http://localhost:3006` |
| Payment Service | `http://localhost:3007` |

## Test Data Factories

The test suite includes factories for generating test data:

```typescript
// Party data
createPartyData({ type: 'customer', ... })

// Invoice data
createInvoiceData(partyId, { items: [...], is_interstate: false })

// Invoice item data
createInvoiceItemData({ unit_price: 100, quantity: 1, tax_rate: 18 })

// Payment data
createPaymentData(partyId, { amount: 1000, transaction_type: 'payment_in' })

// Item data
createItemData({ name: 'Product', selling_price: 100 })

// Generate valid GSTIN
generateGSTIN()

// Generate valid phone
generatePhone()
```

## Test Patterns

### Authentication Setup
```typescript
const client = await setupAuthenticatedClient(request, phone, TEST_OTP);
```

### Skip Pattern for Missing Dependencies
```typescript
test('test name', async () => {
  test.skip(!client.getAuthToken() || !partyId, 'Missing dependencies');
  // Test code
});
```

### API Response Handling
```typescript
const response = await client.createInvoice(data);
if (response.ok) {
  // Success handling
  expect(response.data.id).toBeDefined();
} else {
  // Error handling
  expect(response.error).toBeDefined();
}
```

## Performance Thresholds

| Operation | Threshold |
|-----------|-----------|
| List endpoints | 2000ms |
| Create operations | 1000ms |
| Get single item | 500ms |
| Search operations | 3000ms |
| Bulk operations | 10000ms |

## Security Payloads Tested

- SQL Injection: OR-based, UNION-based, DROP statements
- XSS: Script tags, event handlers, encoded payloads
- Path Traversal: Directory navigation, encoded sequences

## Contributing

When adding new tests:
1. Place in appropriate category folder
2. Use factories from `test-helpers.ts`
3. Include `test.skip()` for missing dependencies
4. Document any new test patterns
5. Update this README

## Coverage Goals

- [ ] 100% API endpoint coverage
- [ ] All validation rules tested
- [ ] All business rules verified
- [ ] Security vulnerabilities checked
- [ ] Performance baselines established
- [ ] Integration failure scenarios covered
