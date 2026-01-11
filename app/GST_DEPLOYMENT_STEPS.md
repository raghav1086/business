# GST Service Deployment - Simple Steps

## 🎯 Overview

This guide provides **simple steps** to deploy **only the GST service** without rebuilding other services or disturbing existing data.

---

## ✅ Prerequisites

1. Docker and Docker Compose installed
2. Existing services running (auth, business, party, inventory, invoice, payment)
3. PostgreSQL database running
4. Environment variables set (DB_PASSWORD, JWT_SECRET)

---

## 🚀 Quick Deployment (Single Command)

```bash
cd app
./scripts/deploy-gst-service.sh
```

That's it! The script will:
- ✅ Only build GST service and web-app
- ✅ Preserve all existing data
- ✅ Create gst_db if needed (safe, non-destructive)
- ✅ Keep all other services running

---

## 📋 Manual Step-by-Step Deployment

If you prefer manual control:

### Step 1: Ensure Database Exists

```bash
cd app

# Start PostgreSQL if not running
docker-compose -f docker-compose.prod.yml up -d postgres

# Check if gst_db exists (safe - won't affect existing data)
docker exec business-postgres psql -U postgres -c "SELECT 1 FROM pg_database WHERE datname='gst_db'" | grep -q 1 || \
  docker exec business-postgres psql -U postgres -c "CREATE DATABASE gst_db;"
```

**Note:** This is safe - if database exists, nothing happens. If it doesn't exist, it's created.

### Step 2: Build Only GST Service

```bash
# Build only GST service (other services NOT rebuilt)
docker-compose -f docker-compose.prod.yml build --no-cache gst-service
```

### Step 3: Build Web App (for GST API URL)

```bash
# Rebuild web-app to include GST API URL
docker-compose -f docker-compose.prod.yml build --no-cache web-app
```

### Step 4: Start GST Service

```bash
# Start GST service (dependencies will start if needed)
docker-compose -f docker-compose.prod.yml up -d gst-service
```

### Step 5: Restart Web App

```bash
# Restart web-app to pick up GST API URL
docker-compose -f docker-compose.prod.yml restart web-app
```

### Step 6: Verify Deployment

```bash
# Check GST service health
curl http://localhost:3008/health

# Check web-app
curl http://localhost:3000

# Check logs
docker logs business-gst
```

---

## 🔍 What Gets Deployed

### ✅ Services Built & Deployed
- **gst-service** (port 3008) - NEW
- **web-app** (port 3000) - Rebuilt to include GST API URL

### ✅ Services NOT Changed
- auth-service (continues running)
- business-service (continues running)
- party-service (continues running)
- inventory-service (continues running)
- invoice-service (continues running)
- payment-service (continues running)
- postgres (continues running)
- redis (continues running)

### ✅ Database Changes
- **gst_db** - Created if doesn't exist (safe, non-destructive)
- **All existing databases** - Untouched, no changes
- **All existing data** - Preserved

---

## 🗄️ Database Migration

### Automatic Migration (TypeORM)

The GST service uses TypeORM with `ENABLE_SYNC=true` which will:
- ✅ Automatically create tables on first startup
- ✅ Add new columns if entities change
- ✅ **Preserve existing data** (no data loss)
- ✅ Handle schema updates safely

### Manual Verification

```bash
# Connect to gst_db
docker exec -it business-postgres psql -U postgres -d gst_db

# List tables
\dt

# Expected tables:
# - gst_report
# - einvoice_request
# - ewaybill
# - business_gst_settings
# - credit_note
# - debit_note
# - advance_receipt
# - gstr2a_import
# - gstr2a_reconciliation
```

---

## 🔧 Environment Variables

### Required Variables

Make sure these are set in your `.env` file or environment:

```bash
# Database
DB_PASSWORD=your_secure_password

# JWT
JWT_SECRET=your_jwt_secret

# Service URLs (for Docker internal network)
AUTH_SERVICE_URL=http://auth-service:3002
INVOICE_SERVICE_URL=http://invoice-service:3006
PARTY_SERVICE_URL=http://party-service:3004
BUSINESS_SERVICE_URL=http://business-service:3003
```

### Optional Variables (GSP Integration)

```bash
# ClearTax GSP (if using)
CLEARTAX_API_URL=https://api.cleartax.in
CLEARTAX_CLIENT_ID=your_client_id
CLEARTAX_CLIENT_SECRET=your_client_secret
```

---

## ✅ Verification Checklist

After deployment, verify:

- [ ] GST service is running: `docker ps | grep gst`
- [ ] Health check passes: `curl http://localhost:3008/health`
- [ ] Database exists: `docker exec business-postgres psql -U postgres -l | grep gst_db`
- [ ] Web-app has GST API URL: Check environment variables
- [ ] Frontend can access GST: Visit http://localhost:3000/gst/reports
- [ ] No errors in logs: `docker logs business-gst --tail 50`
- [ ] Other services still running: `docker ps`

---

## 🐛 Troubleshooting

### Issue: GST service won't start

```bash
# Check logs
docker logs business-gst

# Common issues:
# - Database connection failed → Check DB_PASSWORD
# - Service dependency not ready → Wait for dependencies
# - Port already in use → Check if port 3008 is free
```

### Issue: Database connection failed

```bash
# Verify database exists
docker exec business-postgres psql -U postgres -l | grep gst_db

# Create if missing (safe)
docker exec business-postgres psql -U postgres -c "CREATE DATABASE gst_db;"
```

### Issue: Web-app can't access GST API

```bash
# Check web-app environment
docker exec business-web-app env | grep GST

# Should show: NEXT_PUBLIC_GST_API_URL=/api/v1

# Restart web-app
docker-compose -f docker-compose.prod.yml restart web-app
```

### Issue: Other services affected

```bash
# Check all services are running
docker ps

# If a service stopped, restart it
docker-compose -f docker-compose.prod.yml restart <service-name>
```

---

## 🔄 Rollback (If Needed)

If something goes wrong:

```bash
# Stop GST service
docker-compose -f docker-compose.prod.yml stop gst-service

# Remove GST service container
docker-compose -f docker-compose.prod.yml rm -f gst-service

# Restart web-app (without GST dependency)
docker-compose -f docker-compose.prod.yml restart web-app

# Note: Database (gst_db) remains untouched - can be reused later
```

---

## 📊 Deployment Summary

### What Changed
- ✅ Added GST service (port 3008)
- ✅ Updated web-app with GST API URL
- ✅ Created gst_db database (if didn't exist)

### What Didn't Change
- ✅ All existing services continue running
- ✅ All existing databases untouched
- ✅ All existing data preserved
- ✅ No breaking changes

### Time Required
- **Automated script:** ~5-10 minutes
- **Manual steps:** ~10-15 minutes

---

## 🎯 Next Steps After Deployment

1. **Test GST API:**
   ```bash
   curl http://localhost:3008/health
   ```

2. **Test Frontend:**
   - Visit: http://localhost:3000/gst/reports
   - Try generating a GSTR-1 report

3. **Monitor Logs:**
   ```bash
   docker logs -f business-gst
   ```

4. **Update Nginx** (if using reverse proxy):
   - Add GST service routing (see main deployment guide)

---

## 📝 Notes

- **Safe Deployment:** This deployment is designed to be non-destructive
- **Zero Downtime:** Other services continue running during deployment
- **Data Preservation:** All existing data is preserved
- **Rollback Ready:** Easy to rollback if needed
- **TypeORM Sync:** Tables are created automatically on first startup

---

**Last Updated:** 2025-01-10  
**Status:** Production Ready ✅

