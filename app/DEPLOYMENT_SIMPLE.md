# Simple Deployment Steps - GST Service

## 🚀 One-Command Deployment

```bash
cd app
make deploy-gst
```

**That's it!** The script handles everything:
- ✅ Only builds GST service and web-app
- ✅ Preserves all existing data
- ✅ Creates database safely if needed
- ✅ Keeps other services running

---

## 📋 What Happens

### ✅ Services Deployed
- **GST Service** (port 3008) - NEW
- **Web App** (port 3000) - Rebuilt with GST API URL

### ✅ Services NOT Changed
- All other services continue running unchanged
- No rebuilds, no restarts, no downtime

### ✅ Database
- **gst_db** - Created if doesn't exist (safe)
- **All existing databases** - Untouched
- **All existing data** - Preserved

---

## 🔍 Verification

After deployment, verify:

```bash
# Check GST service
curl http://localhost:3008/health

# Check all services
make health

# Check logs
docker logs business-gst
```

---

## 📝 Manual Steps (If Needed)

If you prefer manual control:

```bash
# 1. Ensure database exists
docker exec business-postgres psql -U postgres -c "CREATE DATABASE gst_db;" 2>/dev/null || true

# 2. Build only GST service
docker-compose -f docker-compose.prod.yml build --no-cache gst-service

# 3. Build web-app
docker-compose -f docker-compose.prod.yml build --no-cache web-app

# 4. Start GST service
docker-compose -f docker-compose.prod.yml up -d gst-service

# 5. Restart web-app
docker-compose -f docker-compose.prod.yml restart web-app
```

---

## 🐛 Troubleshooting

### GST service won't start
```bash
docker logs business-gst
```

### Database connection failed
```bash
# Create database if missing
docker exec business-postgres psql -U postgres -c "CREATE DATABASE gst_db;"
```

### Other services affected
```bash
# Check all services
docker ps

# Restart if needed
docker-compose -f docker-compose.prod.yml restart <service-name>
```

---

## ✅ Success Indicators

- ✅ `curl http://localhost:3008/health` returns `{"status":"ok"}`
- ✅ `docker ps | grep gst` shows GST service running
- ✅ Frontend accessible at http://localhost:3000/gst/reports
- ✅ Other services still running: `docker ps`

---

**Time Required:** ~5-10 minutes  
**Downtime:** Zero (other services unaffected)  
**Data Risk:** None (all data preserved)

