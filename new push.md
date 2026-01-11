## 🚨 Critical Issue: Database Password Authentication Failure

Your auth service is **crash-looping** because it **cannot connect to PostgreSQL**. The password in the auth service environment doesn't match the PostgreSQL password.

### Problem

The auth service (and likely all other services) are using the **wrong database password**. The services are being rebuilt with new containers, but they're reading an incorrect `DB_PASSWORD` from the environment file.

### 🔧 Immediate Fix

Run these commands on your EC2 instance:

```bash
# 1. Check what password the Postgres container is using
docker exec business-postgres env | grep POSTGRES_PASSWORD

# 2. Check what password the services are trying to use
cd /opt/business-app/app
cat .env.production | grep DB_PASSWORD

# 3. Stop all services
docker-compose -f docker-compose.prod.yml down

# 4. Check if there's a mismatch - if they don't match, fix the .env.production file
# Get the correct password from Postgres
POSTGRES_PASS=$(docker exec business-postgres env | grep POSTGRES_PASSWORD | cut -d'=' -f2)
echo "Postgres password: $POSTGRES_PASS"

# 5. Update the .env.production file with the correct password
# You'll need to edit it manually or use sed
nano .env.production
# OR
vi .env.production
# Update the DB_PASSWORD line to match the POSTGRES_PASSWORD

# 6. Restart all services with the correct environment
docker-compose -f docker-compose.prod.yml up -d

# 7. Check logs to verify connection
docker logs business-auth --tail=20
```

### 📋 Alternative Quick Fix

If you want to start fresh with a new password:

```bash
cd /opt/business-app/app

# Stop everything
docker-compose -f docker-compose.prod.yml down

# Generate a new password
DB_PASSWORD="Admin112233"
echo "New password: $NEW_PASSWORD"

# Update .env.production
sed -i "s/^DB_PASSWORD=.*/DB_PASSWORD=$NEW_PASSWORD/" .env.production
sed -i "s/^POSTGRES_PASSWORD=.*/POSTGRES_PASSWORD=$NEW_PASSWORD/" .env.production

# Remove old volumes (CAREFUL - this deletes your database!)
docker-compose -f docker-compose.prod.yml down -v

# Start fresh
docker-compose -f docker-compose.prod.yml up -d

# Watch logs
docker logs -f business-auth
```

### ⚠️ **WARNING**: The second option will **delete all your database data**. Only use it if you're okay losing existing data.

### 🔍 Root Cause

When you rebuilt the services, they loaded environment variables that didn't match the existing PostgreSQL container's password. The old Postgres container (running for 6 days) has one password, but the newly rebuilt services are trying to use a different one.

Let me know which approach you want to take, and I can guide you through it step by step!


=========================================================================

## 🚨 Critical Issue: Database Password Authentication Failure

Your auth service is **crash-looping** because it **cannot connect to PostgreSQL**. The password in the auth service environment doesn't match the PostgreSQL password.

### Problem

The auth service (and likely all other services) are using the **wrong database password**. The services are being rebuilt with new containers, but they're reading an incorrect `DB_PASSWORD` from the environment file.

### 🔧 Immediate Fix

Run these commands on your EC2 instance:

```bash
# 1. Check what password the Postgres container is using
docker exec business-postgres env | grep POSTGRES_PASSWORD

# 2. Check what password the services are trying to use
cd /opt/business-app/app
cat .env.production | grep DB_PASSWORD

# 3. Stop all services
docker-compose -f docker-compose.prod.yml down

# 4. Check if there's a mismatch - if they don't match, fix the .env.production file
# Get the correct password from Postgres
POSTGRES_PASS=$(docker exec business-postgres env | grep POSTGRES_PASSWORD | cut -d'=' -f2)
echo "Postgres password: $POSTGRES_PASS"

# 5. Update the .env.production file with the correct password
# You'll need to edit it manually or use sed
nano .env.production
# OR
vi .env.production
# Update the DB_PASSWORD line to match the POSTGRES_PASSWORD

# 6. Restart all services with the correct environment
docker-compose -f docker-compose.prod.yml up -d

# 7. Check logs to verify connection
docker logs business-auth --tail=20
```

### 📋 Alternative Quick Fix

If you want to start fresh with a new password:

```bash
cd /opt/business-app/app

# Stop everything
docker-compose -f docker-compose.prod.yml down

# Generate a new password
NEW_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-32)
echo "New password: $NEW_PASSWORD"

# Update .env.production
sed -i "s/^DB_PASSWORD=.*/DB_PASSWORD=$NEW_PASSWORD/" .env.production
sed -i "s/^POSTGRES_PASSWORD=.*/POSTGRES_PASSWORD=$NEW_PASSWORD/" .env.production

# Remove old volumes (CAREFUL - this deletes your database!)
docker-compose -f docker-compose.prod.yml down -v

# Start fresh
docker-compose -f docker-compose.prod.yml up -d

# Watch logs
docker logs -f business-auth
```

### ⚠️ **WARNING**: The second option will **delete all your database data**. Only use it if you're okay losing existing data.

### 🔍 Root Cause

When you rebuilt the services, they loaded environment variables that didn't match the existing PostgreSQL container's password. The old Postgres container (running for 6 days) has one password, but the newly rebuilt services are trying to use a different one.

Let me know which approach you want to take, and I can guide you through it step by step!


==================================


Backup files are in `/opt/business-app/db_backup/`. Use this restore script:

## Restore databases from the correct location

```bash
cd /opt/business-app/app

# Set the correct backup directory
BACKUP_DIR="/opt/business-app/db_backup"

# Verify files exist
echo "Checking backup files..."
ls -lh "$BACKUP_DIR"/*.sql

# Stop services
echo ""
echo "Stopping services..."
docker-compose -f docker-compose.prod.yml stop auth-service business-service party-service inventory-service invoice-service payment-service

# Restore auth_db
echo ""
echo "📦 Restoring auth_db..."
docker cp "$BACKUP_DIR/auth_db_20260108_180446.sql" business-postgres:/tmp/auth_backup.dump
docker exec business-postgres pg_restore -U postgres -d auth_db --clean --if-exists --verbose /tmp/auth_backup.dump 2>&1 | grep -v "WARNING\|NOTICE" || true
docker exec business-postgres rm -f /tmp/auth_backup.dump
echo "✅ auth_db restored"

# Restore business_db
echo ""
echo "📦 Restoring business_db..."
docker cp "$BACKUP_DIR/business_db_20260108_180446.sql" business-postgres:/tmp/business_backup.dump
docker exec business-postgres pg_restore -U postgres -d business_db --clean --if-exists --verbose /tmp/business_backup.dump 2>&1 | grep -v "WARNING\|NOTICE" || true
docker exec business-postgres rm -f /tmp/business_backup.dump
echo "✅ business_db restored"

# Restore party_db
echo ""
echo "📦 Restoring party_db..."
docker cp "$BACKUP_DIR/party_db_20260108_180446.sql" business-postgres:/tmp/party_backup.dump
docker exec business-postgres pg_restore -U postgres -d party_db --clean --if-exists --verbose /tmp/party_backup.dump 2>&1 | grep -v "WARNING\|NOTICE" || true
docker exec business-postgres rm -f /tmp/party_backup.dump
echo "✅ party_db restored"

# Restore inventory_db
echo ""
echo "📦 Restoring inventory_db..."
docker cp "$BACKUP_DIR/inventory_db_20260108_180446.sql" business-postgres:/tmp/inventory_backup.dump
docker exec business-postgres pg_restore -U postgres -d inventory_db --clean --if-exists --verbose /tmp/inventory_backup.dump 2>&1 | grep -v "WARNING\|NOTICE" || true
docker exec business-postgres rm -f /tmp/inventory_backup.dump
echo "✅ inventory_db restored"

# Restore invoice_db
echo ""
echo "📦 Restoring invoice_db..."
docker cp "$BACKUP_DIR/invoice_db_20260108_180446.sql" business-postgres:/tmp/invoice_backup.dump
docker exec business-postgres pg_restore -U postgres -d invoice_db --clean --if-exists --verbose /tmp/invoice_backup.dump 2>&1 | grep -v "WARNING\|NOTICE" || true
docker exec business-postgres rm -f /tmp/invoice_backup.dump
echo "✅ invoice_db restored"

# Restore payment_db
echo ""
echo "📦 Restoring payment_db..."
docker cp "$BACKUP_DIR/payment_db_20260108_180446.sql" business-postgres:/tmp/payment_backup.dump
docker exec business-postgres pg_restore -U postgres -d payment_db --clean --if-exists --verbose /tmp/payment_backup.dump 2>&1 | grep -v "WARNING\|NOTICE" || true
docker exec business-postgres rm -f /tmp/payment_backup.dump
echo "✅ payment_db restored"

# Restart services
echo ""
echo "🔄 Restarting services..."
docker-compose -f docker-compose.prod.yml start auth-service business-service party-service inventory-service invoice-service payment-service

# Wait a moment for services to start
sleep 5

# Verify data
echo ""
echo "════════════════════════════════════════════════════════════════"
echo "✅ ALL DATABASES RESTORED!"
echo "════════════════════════════════════════════════════════════════"
echo ""
echo "🔍 Verifying data..."
echo ""
echo "Users: $(docker exec business-postgres psql -U postgres -d auth_db -t -c 'SELECT COUNT(*) FROM users;' | tr -d ' ')"
echo "Businesses: $(docker exec business-postgres psql -U postgres -d business_db -t -c 'SELECT COUNT(*) FROM businesses;' | tr -d ' ')"
echo "Parties: $(docker exec business-postgres psql -U postgres -d party_db -t -c 'SELECT COUNT(*) FROM parties;' | tr -d ' ')"
echo "Inventory Items: $(docker exec business-postgres psql -U postgres -d inventory_db -t -c 'SELECT COUNT(*) FROM items;' | tr -d ' ')"
echo "Invoices: $(docker exec business-postgres psql -U postgres -d invoice_db -t -c 'SELECT COUNT(*) FROM invoices;' | tr -d ' ')"
echo "Payments: $(docker exec business-postgres psql -U postgres -d payment_db -t -c 'SELECT COUNT(*) FROM payments;' | tr -d ' ')"
echo ""
echo "✅ Done! Check the counts above to verify data was restored."
```

## Verify data after restore

```bash
# Check users
docker exec business-postgres psql -U postgres -d auth_db -c "SELECT id, phone, email, name, status FROM users LIMIT 5;"

# Check businesses
docker exec business-postgres psql -U postgres -d business_db -c "SELECT id, name, type, status FROM businesses LIMIT 5;"

# Check parties
docker exec business-postgres psql -U postgres -d party_db -c "SELECT id, name, type, phone FROM parties LIMIT 5;"

# Check all table counts
docker exec business-postgres psql -U postgres -d auth_db -c "SELECT 'users' as table_name, COUNT(*) as count FROM users UNION ALL SELECT 'otp_requests', COUNT(*) FROM otp_requests;"
```

## One-liner version (if you prefer)

```bash
cd /opt/business-app/app && \
BACKUP_DIR="/opt/business-app/db_backup" && \
docker-compose -f docker-compose.prod.yml stop auth-service business-service party-service inventory-service invoice-service payment-service && \
for db in auth business party inventory invoice payment; do \
  echo "Restoring ${db}_db..."; \
  docker cp "$BACKUP_DIR/${db}_db_20260108_180446.sql" business-postgres:/tmp/backup.dump && \
  docker exec business-postgres pg_restore -U postgres -d "${db}_db" --clean --if-exists /tmp/backup.dump 2>&1 | grep -v "WARNING\|NOTICE" || true && \
  docker exec business-postgres rm -f /tmp/backup.dump && \
  echo "✅ ${db}_db done"; \
done && \
docker-compose -f docker-compose.prod.yml start auth-service business-service party-service inventory-service invoice-service payment-service && \
echo "✅ All restored! Users: $(docker exec business-postgres psql -U postgres -d auth_db -t -c 'SELECT COUNT(*) FROM users;' | tr -d ' ')"
```

Run the first script to restore all databases. The backup files are in the correct location, so this should work.


====================================================

Checking existing scripts for building and deploying only the web-app service:


[4 tools called]


Here’s how to build and deploy only the web-app service with `--no-cache` in production:

## On EC2 Instance

### Option 1: Quick Command (Recommended)

```bash
cd /opt/business-app/app

# Load environment variables
export DB_PASSWORD="Admin112233"
if [ -f .env.production ]; then
    while IFS= read -r line || [ -n "$line" ]; do
        [[ -z "$line" || "$line" =~ ^[[:space:]]*# ]] && continue
        if [[ "$line" =~ ^[A-Z_][A-Z0-9_]*= ]]; then
            key="${line%%=*}"
            value="${line#*=}"
            key=$(echo "$key" | xargs)
            value=$(echo "$value" | xargs)
            value=$(echo "$value" | sed "s/^['\"]//; s/['\"]\$//")
            if [ "$key" != "DB_PASSWORD" ]; then
                export "$key=$value"
            fi
        fi
    done < .env.production
fi

# Build web-app with no cache
docker-compose -f docker-compose.prod.yml build --no-cache web-app

# Restart web-app service
docker-compose -f docker-compose.prod.yml up -d web-app

# Check status
docker-compose -f docker-compose.prod.yml ps web-app
```

### Option 2: One-liner

```bash
cd /opt/business-app/app && export DB_PASSWORD="Admin112233" && docker-compose -f docker-compose.prod.yml build --no-cache web-app && docker-compose -f docker-compose.prod.yml up -d web-app
```

### Option 3: Using the Deploy Script

If you want to use the existing deployment script:

```bash
cd /opt/business-app/app
bash scripts/deploy-service-to-ec2.sh ap-south-1 business-app-key web-app
```

But this doesn't use `--no-cache`. For `--no-cache`, use Option 1.

## Verification

After deployment, verify the web-app is running:

```bash
# Check container status
docker-compose -f docker-compose.prod.yml ps web-app

# Check logs
docker logs business-web-app --tail=50

# Check if web-app is responding
curl -I http://localhost:3000

# Or check from outside (if nginx is configured)
curl -I http://$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4)
```

## Important Notes

1. `--no-cache` forces a full rebuild (no layer reuse). This takes longer but ensures a clean build.
2. Environment variables: Ensure `DB_PASSWORD` is exported so other services can connect if needed.
3. Dependencies: The web-app depends on backend services being healthy. If they're not running, the web-app may fail health checks.
4. Downtime: There will be a brief downtime (10-30 seconds) while the container restarts.

## Troubleshooting

If the build fails:

```bash
# Check build logs
docker-compose -f docker-compose.prod.yml build --no-cache web-app --progress=plain

# Check if dependencies are running
docker-compose -f docker-compose.prod.yml ps

# Restart web-app if needed
docker-compose -f docker-compose.prod.yml restart web-app
```

The web-app will be rebuilt from scratch and restarted with the new image.


==============================================


Checking disk space and identifying what's consuming it:


[1 tool called]


Providing commands to run on your EC2 instance to diagnose and fix the disk space issue:


[2 tools called]


Making the scripts executable and providing instructions:


[1 tool called]


Created two scripts to help with the disk space issue. Run these on your EC2 instance:

## Quick Fix Steps

**1. First, diagnose the issue:**
```bash
cd /opt/business-app/app
bash scripts/fix-disk-space.sh
```

**2. Then, clean up disk space:**
```bash
bash scripts/cleanup-disk-space.sh
```

**3. After cleanup, retry git pull:**
```bash
cd /opt/business-app/app
git pull origin main
```

## Manual Quick Fix (if scripts aren't available)

If you need to fix it immediately, run these commands on your EC2 instance:

```bash
# 1. Remove the stuck git lock file
rm -f /opt/business-app/.git/index.lock

# 2. Check disk space
df -h

# 3. Clean git objects
cd /opt/business-app
git gc --prune=now

# 4. Remove old build artifacts (can be rebuilt)
rm -rf /opt/business-app/app/dist
rm -rf /opt/business-app/web-app/.next
rm -rf /opt/business-app/web-app/.turbo

# 5. Clean npm cache
npm cache clean --force

# 6. Remove old logs (optional - keeps last 7 days)
find /opt/business-app/app/logs -type f -mtime +7 -delete

# 7. Now try git pull again
cd /opt/business-app/app
git pull origin main
```

## What to Check

After running the cleanup, check what's taking up space:
```bash
# See overall usage
df -h

# Find largest directories
du -h /opt/business-app | sort -rh | head -20

# Find large files
find /opt/business-app -type f -size +100M
```

The most common culprits are:
- `node_modules` directories
- Build artifacts (`dist`, `.next`)
- Git objects (`.git` directory)
- Log files
- Docker images/containers

After cleanup, you should be able to pull the latest changes. If you still have issues, share the output of `df -h` and we can identify what else to clean up.




cd /opt/business-app/app
docker-compose -f docker-compose.prod.yml build web-app
docker-compose -f docker-compose.prod.yml up -d web-app




======================Clean UP===============

#!/bin/bash

# Docker Cleanup Script for EC2
# This script cleans up Docker to free disk space

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║     DOCKER CLEANUP - FREE DISK SPACE                         ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Step 1: Check current disk usage
echo -e "${YELLOW}Step 1: Checking disk usage...${NC}"
df -h /
echo ""



# Step 7: Remove build cache
echo -e "${YELLOW}Step 2: Removing build cache...${NC}"
docker builder prune -a -f
echo -e "${GREEN}✓ Build cache removed${NC}"
echo ""


# Step 9: Check disk usage after cleanup
echo -e "${YELLOW}Step 3: Checking disk usage after cleanup...${NC}"
df -h /
echo ""
docker system df
echo ""

echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║     CLEANUP COMPLETE!                                         ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"

Checking the deployment script for all available service names:


[1 tool called]


Available service names for `deploy-smart-service`:

## All Available Services

1. **auth-service** (Port: 3002)
   - No dependencies

2. **business-service** (Port: 3003)
   - Depends on: auth-service

3. **party-service** (Port: 3004)
   - Depends on: auth-service

4. **inventory-service** (Port: 3005)
   - Depends on: auth-service

5. **invoice-service** (Port: 3006)
   - Depends on: auth-service

6. **payment-service** (Port: 3007)
   - Depends on: auth-service

7. **gst-service** (Port: 3008)
   - Depends on: auth-service, business-service, invoice-service, party-service

8. **web-app** (Port: 3000)
   - Depends on: auth-service, business-service

## Usage Examples

```bash
# Deploy auth-service only
make deploy-smart-service SERVICE=auth-service

# Deploy business-service only
make deploy-smart-service SERVICE=business-service

# Deploy web-app only
make deploy-smart-service SERVICE=web-app

# Deploy gst-service (will auto-start dependencies if needed)
make deploy-smart-service SERVICE=gst-service
```

## Notes

- Dependencies are started automatically if not running
- Only the specified service is rebuilt and redeployed
- Other services continue running unchanged
- Health checks run after deployment

All 8 services (7 backend services + web-app) are available for selective deployment.