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