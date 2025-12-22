# Business Management System

> A comprehensive microservices-based business management platform for Indian SMEs

## 🚀 Quick Start

```bash
# Install dependencies
make install

# Start everything with Docker (ONE COMMAND)
make start

# Run all tests (ONE COMMAND)
make test-all

# Check service health
make health
```

## 📋 Available Commands

| Command | Description |
|---------|-------------|
| `make start` | Start all services with Docker |
| `make stop` | Stop all services |
| `make restart` | Restart all services |
| `make logs` | View all service logs |
| `make health` | Check health of all services |
| `make test` | Run ALL tests (unit + integration + e2e) |
| `make test-unit` | Run unit tests only |
| `make test-integration` | Run integration tests only |
| `make test-e2e` | Run Playwright E2E tests |
| `make test-e2e-ui` | Run E2E tests with Playwright UI |
| `make clean` | Clean up all Docker resources |
| `make deploy` | Build and deploy to production |
| `make help` | Show all available commands |

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        API Gateway                               │
└─────────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
┌───────────────┐   ┌───────────────┐   ┌───────────────┐
│ Auth Service  │   │Business Service│   │ Party Service │
│    :3002      │   │    :3003      │   │    :3004      │
└───────────────┘   └───────────────┘   └───────────────┘
        │                     │                     │
        ▼                     ▼                     ▼
┌───────────────┐   ┌───────────────┐   ┌───────────────┐
│Inventory Svc  │   │Invoice Service│   │Payment Service│
│    :3005      │   │    :3006      │   │    :3007      │
└───────────────┘   └───────────────┘   └───────────────┘
        │                     │                     │
        └─────────────────────┼─────────────────────┘
                              │
        ┌─────────────────────┴─────────────────────┐
        │                                           │
        ▼                                           ▼
┌───────────────┐                         ┌───────────────┐
│  PostgreSQL   │                         │     Redis     │
│    :5432      │                         │    :6379      │
└───────────────┘                         └───────────────┘
```

## 📁 Project Structure

```
app/
├── apps/                    # Microservices
│   ├── auth-service/        # Authentication & Authorization
│   ├── business-service/    # Business Management
│   ├── party-service/       # Customer/Vendor Management
│   ├── inventory-service/   # Inventory & Stock
│   ├── invoice-service/     # Invoice Generation
│   └── payment-service/     # Payment Processing
├── libs/
│   └── shared/              # Shared libraries
├── e2e/                     # Playwright E2E tests
├── scripts/                 # Utility scripts
├── docker-compose.yml       # Docker orchestration
├── Dockerfile               # Service container image
├── Makefile                 # Single source of truth for commands
└── playwright.config.ts     # E2E test configuration
```

## 🧪 Testing Strategy

### Test Pyramid

```
        ┌─────────────┐
        │    E2E      │  ← Playwright (10 user personas)
        │  (Slow)     │
        ├─────────────┤
        │ Integration │  ← Jest + Supertest
        │  (Medium)   │
        ├─────────────┤
        │    Unit     │  ← Jest
        │  (Fast)     │
        └─────────────┘
```

### E2E Test Personas (10 Real Users)

1. 🏪 **Small Shop Owner** - Mumbai kirana store
2. 📱 **Electronics Retailer** - Delhi mobile shop
3. 🧵 **Textile Wholesaler** - Surat cloth merchant
4. 🍽️ **Restaurant Owner** - Bangalore cafe
5. 📲 **Mobile Store Chain** - Pune multi-location
6. 💊 **Pharmacy Owner** - Chennai medical store
7. 🚗 **Auto Parts Dealer** - Hyderabad spares
8. 💎 **Jewelry Store Owner** - Jaipur ornaments
9. 💻 **Computer Distributor** - Kolkata hardware
10. 👗 **Fashion Boutique** - Ahmedabad clothing

## 🔧 Development

```bash
# Local development (without Docker containers for services)
make dev

# Stop local development
make dev-stop

# Reset databases
make db-reset
```

## 📊 Service Ports

| Service | Port | Health Endpoint |
|---------|------|-----------------|
| Auth | 3002 | http://localhost:3002/health |
| Business | 3003 | http://localhost:3003/health |
| Party | 3004 | http://localhost:3004/health |
| Inventory | 3005 | http://localhost:3005/health |
| Invoice | 3006 | http://localhost:3006/health |
| Payment | 3007 | http://localhost:3007/health |
| PostgreSQL | 5432 | - |
| Redis | 6379 | - |

## 🇮🇳 India-Specific Features

- GST Compliance (CGST, SGST, IGST)
- Indian Accounting Standards
- Multi-language support (Hindi, English)
- UPI Payment Integration
- E-Way Bill Generation
- TDS/TCS Calculations

## 📝 License

MIT
