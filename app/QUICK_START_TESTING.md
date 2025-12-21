# Quick Start: Testing

## 🚀 Fastest Way to Run Tests

### Option 1: Automated Setup (Recommended)

```bash
# Make scripts executable (first time only)
chmod +x scripts/*.sh

# Run setup
./scripts/test-setup.sh

# Run all tests
./scripts/test-run.sh all

# Or run specific test type
./scripts/test-run.sh unit
./scripts/test-run.sh integration
./scripts/test-run.sh e2e

# With coverage
./scripts/test-run.sh integration true
```

### Option 2: Manual Setup

```bash
# 1. Install dependencies
npm install

# 2. Start test database
docker-compose up postgres-test -d

# 3. Run tests
npm run test:all              # Unit tests
npm run test:integration      # Integration tests
npm run test:e2e             # E2E tests
```

## 📋 Quick Commands

```bash
# Setup test environment
./scripts/test-setup.sh

# Run all tests
./scripts/test-run.sh all

# Run with coverage
./scripts/test-run.sh integration true

# Clean up
./scripts/test-cleanup.sh
```

## 🎯 Test Types

### Unit Tests (Fast - No Database)
```bash
npm run test:all
```
- Tests individual functions/methods
- No database required
- Runs in < 1 minute

### Integration Tests (Medium - With Database)
```bash
npm run test:integration
```
- Tests API endpoints with real database
- Requires test database running
- Runs in 2-5 minutes

### E2E Tests (Slow - Full Flow)
```bash
npm run test:e2e
```
- Tests complete user journeys
- Requires test database running
- Runs in 5-10 minutes

## 🔧 Troubleshooting

### Database Not Running
```bash
# Check status
docker ps | grep postgres-test

# Start if stopped
docker start business-postgres-test

# Or recreate
./scripts/test-setup.sh
```

### Port Already in Use
```bash
# Find process using port 5433
lsof -i :5433

# Kill process or use different port
export TEST_DB_PORT=5434
```

### Dependencies Missing
```bash
# Reinstall
rm -rf node_modules package-lock.json
npm install
```

## 📊 Test Results

### View Coverage
```bash
# Generate coverage
npm run test:integration:cov

# Open HTML report
open coverage/integration/lcov-report/index.html
```

### Test Output
- ✅ Green: Tests passing
- ❌ Red: Tests failing
- ⚠️ Yellow: Warnings

## 🎯 Next Steps

1. ✅ Run setup: `./scripts/test-setup.sh`
2. ✅ Run tests: `./scripts/test-run.sh all`
3. ✅ Fix any failures
4. ✅ Check coverage
5. ✅ Commit working tests

---

**Ready to test!** 🚀

