# How to Redeploy All Services with New Password on EC2

## Quick Start

Run this command on your EC2 instance:

```bash
cd /opt/business-app/app
bash scripts/redeploy-with-new-password.sh
```

## What This Script Does

1. ✅ **Updates `.env.production`** with password `Admin112233`
2. ✅ **Updates PostgreSQL password** to `Admin112233`
3. ✅ **Stops all services**
4. ✅ **Restarts all services** with the new password
5. ✅ **Verifies all services** are connected and running

## Step-by-Step Instructions

### Option 1: Using the Automated Script (Recommended)

```bash
# SSH into your EC2 instance
ssh -i ~/.ssh/business-app-key.pem ec2-user@<YOUR_EC2_IP>

# Navigate to app directory
cd /opt/business-app/app

# Run the redeployment script
bash scripts/redeploy-with-new-password.sh
```

The script will:
- Backup your existing `.env.production`
- Update password to `Admin112233`
- Update PostgreSQL password
- Restart all services
- Verify everything is working

### Option 2: Manual Steps

If you prefer to do it manually:

```bash
# 1. SSH into EC2 instance
ssh -i ~/.ssh/business-app-key.pem ec2-user@<YOUR_EC2_IP>

# 2. Navigate to app directory
cd /opt/business-app/app

# 3. Backup existing .env.production
cp .env.production .env.production.backup.$(date +%Y%m%d_%H%M%S)

# 4. Update .env.production with new password
sed -i 's/^DB_PASSWORD=.*/DB_PASSWORD=Admin112233/' .env.production
# Or if DB_PASSWORD doesn't exist:
echo "DB_PASSWORD=Admin112233" >> .env.production

# 5. Also update .env file
cp .env.production .env

# 6. Load environment variables
export DB_PASSWORD="Admin112233"
source .env.production

# 7. Update PostgreSQL password (if container is running)
docker exec business-postgres psql -U postgres -c "ALTER USER postgres WITH PASSWORD 'Admin112233';" || \
docker exec business-postgres sh -c "su - postgres -c \"psql -c \\\"ALTER USER postgres WITH PASSWORD 'Admin112233';\\\"\""

# 8. Stop all services
docker-compose -f docker-compose.prod.yml down

# 9. Restart all services
docker-compose -f docker-compose.prod.yml up -d

# 10. Wait for services to start
sleep 30

# 11. Verify services are running
docker-compose -f docker-compose.prod.yml ps

# 12. Check logs for any password errors
docker logs business-auth --tail=20
```

## Verification

After redeployment, verify everything is working:

```bash
# 1. Check .env.production password
cat .env.production | grep DB_PASSWORD
# Should show: DB_PASSWORD=Admin112233

# 2. Check PostgreSQL container password
docker exec business-postgres env | grep POSTGRES_PASSWORD
# Should show: POSTGRES_PASSWORD=Admin112233

# 3. Check service status
docker-compose -f docker-compose.prod.yml ps
# All services should be "Up" and healthy

# 4. Check service logs for password errors
docker logs business-auth --tail=30 | grep -i password
# Should NOT show "password authentication failed"

# 5. Test database connection from a service
docker exec business-auth node -e "
const { Client } = require('pg');
const client = new Client({
  host: 'postgres',
  port: 5432,
  user: 'postgres',
  password: 'Admin112233',
  database: 'auth_db'
});
client.connect()
  .then(() => console.log('✅ Database connection successful'))
  .catch(err => console.error('❌ Database connection failed:', err.message))
  .finally(() => client.end());
"
```

## Troubleshooting

### Issue: Services show "password authentication failed"

**Solution:**
```bash
# 1. Ensure .env.production has correct password
cat .env.production | grep DB_PASSWORD

# 2. Update PostgreSQL password directly
docker exec business-postgres psql -U postgres -c "ALTER USER postgres WITH PASSWORD 'Admin112233';"

# 3. Restart the failing service
docker-compose -f docker-compose.prod.yml restart <service-name>

# 4. Check logs
docker logs business-<service-name> --tail=50
```

### Issue: PostgreSQL container won't start

**Solution:**
```bash
# 1. Check PostgreSQL logs
docker logs business-postgres

# 2. Ensure volume is not corrupted
docker volume ls | grep postgres_data

# 3. Restart PostgreSQL with correct password
export DB_PASSWORD="Admin112233"
docker-compose -f docker-compose.prod.yml up -d postgres

# 4. Wait and verify
sleep 10
docker exec business-postgres pg_isready -U postgres
```

### Issue: Services keep restarting

**Solution:**
```bash
# 1. Check service logs
docker-compose -f docker-compose.prod.yml logs <service-name>

# 2. Verify environment variables are loaded
docker exec business-<service-name> env | grep DB_PASSWORD
# Should show: DB_PASSWORD=Admin112233

# 3. If different, restart with correct environment
export DB_PASSWORD="Admin112233"
docker-compose -f docker-compose.prod.yml restart <service-name>
```

## Expected Output

After successful redeployment, you should see:

```
✅ All services are using password: Admin112233
✅ All services are connected to PostgreSQL
✅ All services are running
```

Service status should show:
```
NAME                  STATUS              PORTS
business-auth         Up (healthy)        0.0.0.0:3002->3002/tcp
business-business     Up (healthy)        0.0.0.0:3003->3003/tcp
business-party        Up (healthy)        0.0.0.0:3004->3004/tcp
business-inventory    Up (healthy)        0.0.0.0:3005->3005/tcp
business-invoice      Up (healthy)        0.0.0.0:3006->3006/tcp
business-payment      Up (healthy)        0.0.0.0:3007->3007/tcp
business-postgres     Up (healthy)        5432/tcp
business-redis        Up (healthy)        6379/tcp
business-web-app      Up (healthy)        0.0.0.0:3000->3000/tcp
```

## Important Notes

⚠️ **Database Persistence**: The PostgreSQL volume (`postgres_data`) ensures your database data persists across redeployments. No data will be lost.

⚠️ **Service Downtime**: There will be a brief downtime (30-60 seconds) while services restart. Plan accordingly.

✅ **Password Consistency**: After this redeployment, all future deployments will use `Admin112233` automatically.

## Summary

✅ **One Command**: `bash scripts/redeploy-with-new-password.sh`  
✅ **Automatic**: Handles all password updates and service restarts  
✅ **Safe**: Backs up existing configuration before changes  
✅ **Verified**: Checks all services are connected and running  

After running this, all services will be synced with the new password `Admin112233`!

