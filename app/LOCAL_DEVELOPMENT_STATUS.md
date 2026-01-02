# Local Development Environment - Status

## ✅ All Services Running Successfully

**Date:** January 2, 2026  
**Status:** All services operational

---

## Infrastructure (Docker)

### ✅ PostgreSQL
- **Container:** `business-postgres`
- **Port:** `5432`
- **Status:** Running and healthy
- **Databases:**
  - `auth_db` - User authentication and management
  - `business_db` - Business and RBAC data
  - `party_db` - Party/customer data
  - `inventory_db` - Inventory data
  - `invoice_db` - Invoice data
  - `payment_db` - Payment data

### ✅ Redis
- **Container:** `business-redis`
- **Port:** `6379`
- **Status:** Running and healthy
- **Purpose:** Session management, caching, OTP storage

---

## Backend Services (Running Locally)

All services are running locally and connecting to Docker PostgreSQL and Redis.

### ✅ Auth Service
- **URL:** http://localhost:3002
- **Health:** http://localhost:3002/health
- **Status:** ✅ Running
- **Logs:** `/tmp/auth-service.log`

### ✅ Business Service
- **URL:** http://localhost:3003
- **Health:** http://localhost:3003/health
- **Status:** ✅ Running
- **Logs:** `/tmp/business-service.log`

### ✅ Party Service
- **URL:** http://localhost:3004
- **Health:** http://localhost:3004/health
- **Status:** ✅ Running
- **Logs:** `/tmp/party-service.log`

### ✅ Inventory Service
- **URL:** http://localhost:3005
- **Health:** http://localhost:3005/health
- **Status:** ✅ Running
- **Logs:** `/tmp/inventory-service.log`

### ✅ Invoice Service
- **URL:** http://localhost:3006
- **Health:** http://localhost:3006/health
- **Status:** ✅ Running
- **Logs:** `/tmp/invoice-service.log`

### ✅ Payment Service
- **URL:** http://localhost:3007
- **Health:** http://localhost:3007/health
- **Status:** ✅ Running
- **Logs:** `/tmp/payment-service.log`

---

## Frontend

### ✅ Web App (Next.js)
- **URL:** http://localhost:3000
- **Status:** ✅ Running
- **API Proxy:** Configured to route `/api/v1/*` to backend services
- **Logs:** `/tmp/web-app.log`

---

## Database Migrations

### ✅ RBAC Migrations Applied
- ✅ `is_superadmin` column added to `users` table
- ✅ `business_users` table created
- ✅ `audit_logs` table created
- ✅ Existing owners migrated to `business_users`
- ✅ Superadmin user created

### Superadmin User
- **Phone:** `9175760649`
- **OTP:** `760649` (last 6 digits)
- **Status:** ✅ Created and verified
- **Type:** `superadmin`
- **is_superadmin:** `true`

---

## Quick Start Commands

### Start All Services
```bash
cd /Users/ashishnimrot/Project/business/app

# Start infrastructure (Docker)
docker-compose up -d postgres redis

# Wait for databases
sleep 5

# Run migrations (if needed)
docker exec -i business-postgres psql -U postgres -d auth_db < scripts/migrations/002_add_superadmin_to_users.sql
docker exec -i business-postgres psql -U postgres -d auth_db < scripts/migrations/004_create_superadmin_user.sql
docker exec -i business-postgres psql -U postgres -d business_db < scripts/migrations/001_create_business_users.sql
docker exec -i business-postgres psql -U postgres -d business_db < scripts/migrations/003_migrate_existing_owners.sql
docker exec -i business-postgres psql -U postgres -d business_db < scripts/migrations/005_create_audit_logs.sql

# Start backend services (in separate terminals or background)
npx nx serve auth-service &
npx nx serve business-service &
npx nx serve party-service &
npx nx serve inventory-service &
npx nx serve invoice-service &
npx nx serve payment-service &

# Start frontend (in separate terminal)
cd ../web-app
npm run dev
```

### Stop All Services
```bash
# Stop backend services
pkill -f "nx serve"

# Stop frontend
pkill -f "next dev"

# Stop infrastructure (optional - keep running for development)
docker-compose stop postgres redis
```

---

## Testing

### Test Superadmin Login
```bash
# 1. Send OTP
curl -X POST http://localhost:3002/api/v1/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{"phone":"9175760649","purpose":"login"}'

# 2. Verify OTP (use OTP from response, should be 760649)
curl -X POST http://localhost:3002/api/v1/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"phone":"9175760649","otp":"760649","otp_id":"<otp_id>"}'
```

### Test User Assignment (Phone-Based)
```bash
# Assign user to business by phone number
curl -X POST http://localhost:3003/api/v1/businesses/{businessId}/users \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "9876543210",
    "role": "admin"
  }'
```

### Test Health Endpoints
```bash
# Check all services
for port in 3002 3003 3004 3005 3006 3007; do
  echo "Port $port:"
  curl -s http://localhost:$port/health | head -3
  echo ""
done
```

---

## Service Logs

All service logs are available in `/tmp/`:
- `/tmp/auth-service.log`
- `/tmp/business-service.log`
- `/tmp/party-service.log`
- `/tmp/inventory-service.log`
- `/tmp/invoice-service.log`
- `/tmp/payment-service.log`
- `/tmp/web-app.log`

### View Logs
```bash
# View specific service log
tail -f /tmp/auth-service.log

# View all service logs
tail -f /tmp/*-service.log
```

---

## Environment Configuration

### Backend Services
All services connect to:
- **Database:** `localhost:5432` (Docker PostgreSQL)
- **Redis:** `localhost:6379` (Docker Redis)

### Frontend
- **API Proxy:** Configured in `next.config.ts`
- **Routes:** `/api/v1/*` → Backend services

---

## Next Steps

1. **Test Superadmin Login:**
   - Go to http://localhost:3000/login
   - Enter phone: `9175760649`
   - Enter OTP: `760649`
   - Should redirect to `/admin`

2. **Test User Assignment:**
   - Login as admin/owner
   - Go to Settings → User Management
   - Search for user by phone number
   - Assign user to business

3. **Test RBAC Permissions:**
   - Assign users with different roles
   - Test permission enforcement
   - Verify audit logs

---

## Troubleshooting

### Services Not Starting
```bash
# Check if ports are in use
lsof -i :3002 -i :3003 -i :3004 -i :3005 -i :3006 -i :3007

# Check service logs
tail -50 /tmp/auth-service.log
```

### Database Connection Issues
```bash
# Check PostgreSQL is running
docker ps | grep postgres

# Test connection
docker exec -i business-postgres psql -U postgres -c "SELECT version();"
```

### Redis Connection Issues
```bash
# Check Redis is running
docker ps | grep redis

# Test connection
docker exec -i business-redis redis-cli ping
```

---

## Summary

✅ **All services are running and ready for testing!**

- Infrastructure: PostgreSQL and Redis running in Docker
- Backend: All 6 services running locally
- Frontend: Web app running on port 3000
- Migrations: RBAC migrations applied
- Superadmin: Created and ready

**You can now test the complete RBAC system end-to-end!**

