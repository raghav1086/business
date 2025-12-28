# Database Setup & Migrations

## Overview

For beta deployment, we use **TypeORM synchronize** to automatically create database tables. This ensures everything works immediately after deployment without manual migration steps.

## How It Works

### 1. Database Creation
- Databases are created automatically by `init-db.sql` when PostgreSQL container starts
- Creates: `auth_db`, `business_db`, `party_db`, `inventory_db`, `invoice_db`, `payment_db`

### 2. Table Creation
- Tables are created automatically by TypeORM when services start
- Enabled via `ENABLE_SYNC=true` environment variable
- Each service creates its own tables in its database

### 3. Configuration

**In `app.module.ts` for each service:**
```typescript
synchronize: configService.get('NODE_ENV') !== 'production' || 
             configService.get('ENABLE_SYNC') === 'true',
```

**In `docker-compose.prod.yml`:**
```yaml
environment:
  - ENABLE_SYNC=true  # Enables automatic table creation
```

**In deployment script:**
```bash
ENABLE_SYNC=true  # Added to .env.production
```

## Deployment Flow

1. **PostgreSQL starts** → Runs `init-db.sql` → Creates 6 databases
2. **Services start** → TypeORM connects → Creates tables automatically
3. **Verification** → Checks tables exist → Confirms deployment success

## Verification

After deployment, verify tables are created:

```bash
# SSH into instance
ssh -i ~/.ssh/business-app-key.pem ec2-user@<IP>

# Run verification script
/home/ec2-user/verify-deployment.sh

# Or manually check
docker exec business-postgres psql -U postgres -d auth_db -c "\dt"
docker exec business-postgres psql -U postgres -d business_db -c "\dt"
# ... etc for other databases
```

## Tables Created Per Service

### Auth Service (`auth_db`)
- `users`
- `otp_requests`
- `refresh_tokens`
- `user_sessions`

### Business Service (`business_db`)
- `businesses`

### Party Service (`party_db`)
- `parties`

### Inventory Service (`inventory_db`)
- `items`
- `categories`
- `units`
- `stock_adjustments`

### Invoice Service (`invoice_db`)
- `invoices`
- `invoice_items`
- `invoice_settings`

### Payment Service (`payment_db`)
- `transactions`

## Production Migration Strategy (Future)

For production, you should:

1. **Disable synchronize:**
   ```typescript
   synchronize: false
   ```

2. **Create migration files:**
   ```bash
   npm run typeorm migration:generate -- -n InitialSchema
   ```

3. **Run migrations:**
   ```bash
   npm run typeorm migration:run
   ```

4. **Use migration tools:**
   - Flyway
   - Liquibase
   - TypeORM migrations

## Current Status (Beta)

✅ **Automatic table creation enabled** via `ENABLE_SYNC=true`
✅ **No manual migrations needed**
✅ **Everything works after deployment**

## Troubleshooting

### Tables Not Created

```bash
# Check if ENABLE_SYNC is set
docker exec business-auth env | grep ENABLE_SYNC

# Check service logs
docker logs business-auth

# Restart service
docker restart business-auth
```

### Database Connection Issues

```bash
# Check PostgreSQL is running
docker ps | grep postgres

# Check database exists
docker exec business-postgres psql -U postgres -c "\l"

# Test connection
docker exec business-postgres psql -U postgres -d auth_db -c "SELECT 1;"
```

### Service Fails to Start

```bash
# Check logs
docker logs business-auth

# Check environment variables
docker exec business-auth env

# Verify database credentials
docker exec business-postgres psql -U postgres -c "SELECT current_user;"
```

## Notes

- **Beta Only:** `ENABLE_SYNC=true` is for beta/testing
- **Production:** Should use proper migrations
- **Data Safety:** Synchronize can modify schema, use with caution
- **Backups:** Automatic daily backups configured

