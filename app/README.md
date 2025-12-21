# Business App - Development Workspace

This is the NX monorepo workspace for the Business App project.

## Structure

```
app/
├── apps/
│   ├── api-gateway/          # NestJS API Gateway
│   ├── auth-service/          # Authentication Microservice
│   ├── business-service/      # Business Management Service
│   ├── inventory-service/     # Inventory Management Service
│   ├── invoice-service/       # Billing & Invoicing Service
│   ├── accounting-service/    # Accounting Service
│   ├── gst-service/          # GST Compliance Service
│   ├── payment-service/       # Payments Service
│   ├── notification-service/ # Notifications Service
│   └── sync-service/         # Offline Sync Service
├── libs/
│   └── shared/
│       ├── dal/              # Data Access Layer
│       ├── dto/               # DTOs and Interfaces
│       ├── utils/             # Common Utilities
│       ├── constants/         # Constants and Enums
│       ├── types/             # TypeScript Types
│       └── validation/        # Validation Schemas
└── docs/                      # Documentation
```

## Getting Started

### Prerequisites
- Node.js >= 18.0.0
- npm >= 9.0.0
- Docker & Docker Compose
- PostgreSQL 15+

### Setup

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Setup Database**
   ```bash
   docker-compose up -d
   npm run db:migrate
   npm run db:seed
   ```

3. **Run Development**
   ```bash
   npm run dev
   ```

4. **Run Tests**
   ```bash
   npm test
   ```

## Development Approach

- **TDD**: Test-Driven Development (Red → Green → Refactor)
- **API-First**: Complete APIs before UI
- **Business Service First**: Start with Business service

## Services

### Business Service (First Service)
- Location: `apps/business-service/`
- Database: PostgreSQL
- Tests: `apps/business-service/src/**/*.spec.ts`

## Documentation

See `/docs` folder in project root for:
- PRD
- Database Schema
- API Specifications
- TDD Strategy
- MVP Plan

