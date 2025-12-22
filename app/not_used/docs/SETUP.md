# Business App - Setup Guide

## Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0
- Docker & Docker Compose
- PostgreSQL 15+ (or use Docker)

## Quick Start

### 1. Install Dependencies

```bash
cd app
npm install
```

### 2. Start Database

```bash
docker-compose up -d
```

This will start:
- PostgreSQL (port 5432) - Main database
- PostgreSQL Test (port 5433) - Test database
- Redis (port 6379) - Caching

### 3. Setup Environment Variables

Copy the example environment file:

```bash
cp .env.example .env
```

Edit `.env` with your configuration (defaults should work for local development).

### 4. Run Database Migrations

```bash
npm run db:migrate
```

### 5. Seed Database (Optional)

```bash
npm run db:seed
```

### 6. Run Tests

```bash
npm test
```

### 7. Start Development Server

```bash
npm run dev
```

The Business Service will start on `http://localhost:3001`

### 8. View API Documentation

Open Swagger UI at: `http://localhost:3001/api/docs`

## Project Structure

```
app/
├── apps/
│   └── business-service/     # Business Management Service
│       ├── src/
│       │   ├── controllers/ # API Controllers
│       │   ├── services/     # Business Logic
│       │   ├── repositories/# Data Access Layer
│       │   ├── entities/    # Database Entities
│       │   ├── guards/      # Auth Guards
│       │   ├── app.module.ts
│       │   └── main.ts
│       └── project.json
├── libs/
│   └── shared/
│       ├── dal/             # Data Access Layer
│       ├── dto/              # DTOs
│       └── utils/            # Utilities
├── docker-compose.yml
├── package.json
└── nx.json
```

## Development Workflow

### TDD Approach

1. **Write Tests First** (Red)
   ```bash
   # Write test in *.spec.ts file
   # Test should fail initially
   ```

2. **Implement Code** (Green)
   ```bash
   # Implement the feature
   # Make tests pass
   ```

3. **Refactor** (Refactor)
   ```bash
   # Improve code quality
   # Tests should still pass
   ```

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:cov

# Run tests for specific service
nx test business-service
```

### Code Quality

```bash
# Lint code
npm run lint

# Format code
npm run format

# Fix linting issues
npm run lint -- --fix
```

## API Endpoints

### Business Service

- `POST /api/v1/businesses` - Create business
- `GET /api/v1/businesses` - List businesses
- `GET /api/v1/businesses/:id` - Get business
- `PATCH /api/v1/businesses/:id` - Update business
- `DELETE /api/v1/businesses/:id` - Delete business

## Database

### Connection

- **Host:** localhost
- **Port:** 5432
- **Database:** business_db
- **Username:** postgres
- **Password:** postgres

### Migrations

```bash
# Create migration
nx run business-service:typeorm migration:create -- -n MigrationName

# Run migrations
npm run db:migrate

# Revert migration
nx run business-service:typeorm migration:revert
```

## Troubleshooting

### Database Connection Issues

```bash
# Check if PostgreSQL is running
docker ps

# Check logs
docker-compose logs postgres

# Restart database
docker-compose restart postgres
```

### Port Already in Use

If port 3001 is already in use:

```bash
# Change PORT in .env file
PORT=3002
```

### Test Database Issues

```bash
# Reset test database
docker-compose restart postgres-test
```

## Next Steps

1. ✅ Infrastructure setup complete
2. ✅ Business Service structure ready
3. 🔄 Implement Auth Service (Sprint 3)
4. 🔄 Implement Party Service (Sprint 5)
5. 🔄 Implement Inventory Service (Sprint 6)
6. 🔄 Implement Invoice Service (Sprint 7-8)

## Resources

- [NestJS Documentation](https://docs.nestjs.com/)
- [TypeORM Documentation](https://typeorm.io/)
- [NX Documentation](https://nx.dev/)
- [TDD Strategy](../docs/TDD_STRATEGY.md)
- [MVP Plan](../docs/MVP_API_FIRST_PLAN.md)

