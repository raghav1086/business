# Quick Start Guide

## 🚀 Get Started in 5 Minutes

### Step 1: Install Dependencies
```bash
cd app
npm install
```

### Step 2: Start Database
```bash
docker-compose up -d
```

### Step 3: Run Tests
```bash
npm test
```

### Step 4: Start Development Server
```bash
npm run dev
```

### Step 5: View API Docs
Open: http://localhost:3001/api/docs

## ✅ What's Ready

- ✅ NX Workspace configured
- ✅ Business Service with TDD structure
- ✅ Data Access Layer (DAL)
- ✅ Shared utilities (GSTIN, PAN validators)
- ✅ Docker setup (PostgreSQL + Redis)
- ✅ Test infrastructure
- ✅ Swagger documentation

## 📝 Next Steps

1. **Run Tests** - Verify everything works
2. **Start Development** - Begin implementing features
3. **Follow TDD** - Red → Green → Refactor

## 🧪 Test the API

```bash
# Create a business
curl -X POST http://localhost:3001/api/v1/businesses \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My Business",
    "type": "retailer",
    "gstin": "29AAACB1234A1Z5"
  }'

# List businesses
curl http://localhost:3001/api/v1/businesses
```

## 📚 Documentation

- [Full Setup Guide](./SETUP.md)
- [MVP Plan](../docs/MVP_API_FIRST_PLAN.md)
- [Sprint Breakdown](../docs/MVP_SPRINT_BREAKDOWN_API_FIRST.md)
- [TDD Strategy](../docs/TDD_STRATEGY.md)

---

**Happy Coding! 🎯**

