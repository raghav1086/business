# RBAC Production Deployment Plan - Detailed

## Overview

This document provides a step-by-step production deployment plan for the RBAC system, including pre-deployment checks, deployment steps, verification procedures, and rollback procedures.

---

## 1. Pre-Deployment Checklist

### 1.1 Code Review
- [x] All RBAC code reviewed and approved
- [x] All fixes implemented (AUDIT_LOGS_VIEW permission, endpoint checks)
- [x] All tests passing
- [x] Code merged to production branch

### 1.2 Database Preparation
- [ ] **MANDATORY:** Full database backup completed
- [ ] Migration scripts reviewed and tested on staging
- [ ] Backward compatibility verified
- [ ] Rollback scripts prepared

### 1.3 Infrastructure
- [ ] Database connection strings configured
- [ ] Redis connection configured (if using caching)
- [ ] Environment variables set
- [ ] SSL certificates valid
- [ ] Load balancer configured
- [ ] Health check endpoints configured

### 1.4 Testing
- [ ] Unit tests passing
- [ ] Integration tests passing
- [ ] E2E tests passing
- [ ] Performance tests completed
- [ ] Security audit completed

### 1.5 Documentation
- [ ] Deployment plan reviewed
- [ ] Rollback plan documented
- [ ] Monitoring alerts configured
- [ ] Team notified of deployment

---

## 2. Deployment Steps

### Step 1: Database Backup (MANDATORY - DO NOT SKIP)

**Command:**
```bash
cd /path/to/project/app
./scripts/backup-db.sh <DB_HOST> <DB_PORT> <DB_USER> <DB_PASSWORD>
```

**Expected Output:**
```
Creating database backup...
  → Backing up auth_db...
    ✓ auth_db backed up to ./backups/auth_db_YYYYMMDD_HHMMSS.sqlc
  → Backing up business_db...
    ✓ business_db backed up to ./backups/business_db_YYYYMMDD_HHMMSS.sqlc
  ...
✓ Database backup complete. X/Y databases backed up.
Backup location: ./backups
```

**Verification:**
- [ ] Backup files created in `./backups/` directory
- [ ] Backup file sizes are reasonable (> 0 bytes)
- [ ] Backup timestamps are recent
- [ ] All databases backed up successfully

**If backup fails:**
- **STOP DEPLOYMENT IMMEDIATELY**
- Investigate backup failure
- Fix backup issues before proceeding
- Re-run backup until successful

---

### Step 2: Run Database Migrations

**Command:**
```bash
cd /path/to/project/app
./scripts/run-rbac-migrations.sh <DB_HOST> <DB_PORT> <DB_USER> <DB_PASSWORD>
```

**Expected Output:**
```
╔════════════════════════════════════════════════════════════╗
║     RBAC Migration Runner                                  ║
╚════════════════════════════════════════════════════════════╝

Running migrations on auth_db...
  → 002_add_superadmin_to_users.sql on auth_db...
    ✓ Completed
  → 004_create_superadmin_user.sql on auth_db...
    ✓ Completed

Running migrations on business_db...
  → 001_create_business_users.sql on business_db...
    ✓ Completed
  → 003_migrate_existing_owners.sql on business_db...
    ✓ Completed
  → 005_create_audit_logs.sql on business_db...
    ✓ Completed

Running verification...
  → 006_verify_and_fix_migrations.sql on business_db...
    ✓ Completed

✓ RBAC migrations complete!
```

**Verification:**
- [ ] All migrations completed without errors
- [ ] Tables created: `business_users`, `audit_logs`
- [ ] Column added: `users.is_superadmin`
- [ ] Superadmin user created (phone: 9175760649)
- [ ] Existing owners migrated to `business_users` table

**Verification Commands:**
```bash
# Check business_users table
docker exec -i business-postgres psql -U postgres -d business_db -c "SELECT COUNT(*) FROM business_users;"

# Check audit_logs table
docker exec -i business-postgres psql -U postgres -d business_db -c "SELECT COUNT(*) FROM audit_logs;"

# Check is_superadmin column
docker exec -i business-postgres psql -U postgres -d auth_db -c "SELECT phone, is_superadmin FROM users WHERE phone = '9175760649';"

# Check migrated owners
docker exec -i business-postgres psql -U postgres -d business_db -c "SELECT COUNT(*) FROM business_users WHERE role = 'owner';"
```

**If migration fails:**
- Check migration logs for specific error
- Verify database connectivity
- Check database permissions
- If critical error, restore from backup (Step 6)

---

### Step 3: Build Docker Images

**Command:**
```bash
cd /path/to/project/app
docker-compose -f docker-compose.prod.yml build --no-cache
```

**Expected Output:**
```
Building auth-service...
Step 1/10 : FROM node:18-alpine
...
Successfully built <image-id>
Successfully tagged business-auth-service:latest
...
```

**Verification:**
- [ ] All images built successfully
- [ ] No build errors
- [ ] Image tags are correct

**If build fails:**
- Check Docker daemon is running
- Check disk space
- Review build logs for errors
- Fix build issues and retry

---

### Step 4: Start Services

**Command:**
```bash
cd /path/to/project/app
docker-compose -f docker-compose.prod.yml up -d
```

**Expected Output:**
```
Creating business-postgres ... done
Creating business-redis ... done
Creating business-auth ... done
Creating business-business ... done
...
```

**Verification:**
- [ ] All containers started
- [ ] No container errors
- [ ] Containers are running (not exited)

**Verification Commands:**
```bash
# Check container status
docker-compose -f docker-compose.prod.yml ps

# Check logs for errors
docker-compose -f docker-compose.prod.yml logs --tail=50
```

---

### Step 5: Wait for Services to be Healthy

**Command:**
```bash
# Wait for services to start
sleep 30

# Check health
make health
# OR
curl http://localhost:3002/health
curl http://localhost:3003/health
# ... etc
```

**Expected Output:**
```
✅ auth-service (Port 3002) is healthy
✅ business-service (Port 3003) is healthy
✅ party-service (Port 3004) is healthy
✅ inventory-service (Port 3005) is healthy
✅ invoice-service (Port 3006) is healthy
✅ payment-service (Port 3007) is healthy
✅ web-app (Port 3000) is healthy
```

**Verification:**
- [ ] All services return 200 OK
- [ ] No errors in service logs
- [ ] Services are responding to requests

**If services are not healthy:**
- Check service logs: `docker-compose logs <service-name>`
- Check database connectivity
- Check Redis connectivity
- Verify environment variables
- Restart unhealthy services

---

### Step 6: Verify RBAC Functionality

#### 6.1 Test Superadmin Login

**Command:**
```bash
# Send OTP
curl -X POST http://localhost/api/v1/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{"phone":"9175760649","purpose":"login"}'

# Verify OTP (use OTP from response)
curl -X POST http://localhost/api/v1/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"phone":"9175760649","otp":"760649","otp_id":"<otp_id>"}'
```

**Expected:**
- OTP sent successfully
- Login successful
- JWT token returned with `is_superadmin: true`
- User redirected to `/admin`

#### 6.2 Test User Assignment

**Command:**
```bash
# Assign user to business (as owner/admin)
curl -X POST http://localhost/api/v1/businesses/{businessId}/users \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "<userId>",
    "role": "admin"
  }'
```

**Expected:**
- User assigned successfully
- Audit log created
- User can access business

#### 6.3 Test Permission Enforcement

**Command:**
```bash
# Try to create invoice (should work for users with INVOICE_CREATE)
curl -X POST http://localhost/api/v1/invoices \
  -H "Authorization: Bearer {token}" \
  -H "x-business-id: {businessId}" \
  -H "Content-Type: application/json" \
  -d '{...}'

# Try without permission (should fail with 403)
curl -X POST http://localhost/api/v1/invoices \
  -H "Authorization: Bearer {viewer_token}" \
  -H "x-business-id: {businessId}" \
  -H "Content-Type: application/json" \
  -d '{...}'
```

**Expected:**
- Users with permission: 201 Created
- Users without permission: 403 Forbidden

---

## 3. Post-Deployment Verification

### 3.1 Functional Verification

- [ ] Superadmin can login
- [ ] Superadmin can access all businesses
- [ ] Owners can assign users
- [ ] Users can access assigned businesses
- [ ] Users cannot access unassigned businesses
- [ ] Permissions are enforced correctly
- [ ] Audit logs are being created
- [ ] All modules (Invoice, Party, Inventory, Payment) work with RBAC

### 3.2 Performance Verification

- [ ] API response times < 200ms (p95)
- [ ] Business context resolution < 50ms (p95)
- [ ] Database queries optimized
- [ ] No memory leaks
- [ ] No excessive CPU usage

### 3.3 Security Verification

- [ ] JWT tokens validated correctly
- [ ] Business context validated correctly
- [ ] Permissions enforced correctly
- [ ] Superadmin bypass works correctly
- [ ] No unauthorized access possible

---

## 4. Rollback Plan

### 4.1 If Deployment Fails During Migration

**Steps:**
1. Stop all services:
   ```bash
   docker-compose -f docker-compose.prod.yml down
   ```

2. Restore database from backup:
   ```bash
   # Restore auth_db
   pg_restore -h <DB_HOST> -U <DB_USER> -d auth_db <backup_file>

   # Restore business_db
   pg_restore -h <DB_HOST> -U <DB_USER> -d business_db <backup_file>
   ```

3. Verify database restored:
   ```bash
   # Check tables exist
   docker exec -i business-postgres psql -U postgres -d business_db -c "\dt"
   ```

4. Revert code (if needed):
   ```bash
   git checkout <previous_commit>
   docker-compose -f docker-compose.prod.yml build
   docker-compose -f docker-compose.prod.yml up -d
   ```

### 4.2 If Deployment Fails After Migration

**Steps:**
1. Stop new services
2. Restore database (if data corrupted)
3. Revert code to previous version
4. Rebuild and restart services

### 4.3 If Services Are Unhealthy

**Steps:**
1. Check service logs
2. Identify failing service
3. Restart failing service
4. If persists, rollback to previous version

---

## 5. Monitoring & Alerts

### 5.1 Metrics to Monitor

- **RBAC-related API errors:**
  - 403 Forbidden responses
  - Permission denied errors
  - Business context resolution failures

- **Performance metrics:**
  - Business context resolution time
  - Permission check time
  - API response times

- **Usage metrics:**
  - User assignment rate
  - Permission update rate
  - Audit log creation rate
  - Superadmin access attempts

### 5.2 Alerts to Configure

- **High permission denial rate** (>10% of requests)
  - Indicates potential permission misconfiguration
  - Alert threshold: > 10% of requests return 403

- **Business context resolution failures**
  - Indicates database or service issues
  - Alert threshold: > 1% failure rate

- **Audit log creation failures**
  - Indicates audit logging issues
  - Alert threshold: Any failure

- **Unauthorized access attempts**
  - Security concern
  - Alert threshold: Any 401/403 with suspicious patterns

---

## 6. Deployment Timeline

### Estimated Time: 2-3 hours

- **Step 1 (Backup):** 10-15 minutes
- **Step 2 (Migrations):** 5-10 minutes
- **Step 3 (Build):** 20-30 minutes
- **Step 4 (Start Services):** 5 minutes
- **Step 5 (Health Check):** 10-15 minutes
- **Step 6 (Verification):** 30-45 minutes
- **Post-Deployment Verification:** 30-45 minutes
- **Buffer:** 30 minutes

**Total:** ~2-3 hours

---

## 7. Success Criteria

### Deployment is successful if:

1. ✅ All migrations completed without errors
2. ✅ All services are healthy
3. ✅ Superadmin can login and access all features
4. ✅ Users can be assigned to businesses
5. ✅ Permissions are enforced correctly
6. ✅ All modules work with RBAC
7. ✅ Audit logs are being created
8. ✅ No performance degradation
9. ✅ No security vulnerabilities

---

## 8. Post-Deployment Tasks

### Immediate (Within 24 hours)
- [ ] Monitor error rates
- [ ] Monitor performance metrics
- [ ] Review audit logs
- [ ] Collect user feedback

### Short-term (Within 1 week)
- [ ] Performance optimization (if needed)
- [ ] Fix any identified issues
- [ ] Update documentation
- [ ] Train team on RBAC features

---

## 9. Emergency Contacts

- **Database Admin:** [Contact]
- **DevOps Lead:** [Contact]
- **Backend Lead:** [Contact]
- **On-Call Engineer:** [Contact]

---

## 10. Notes

- **Backup is MANDATORY** - Never skip this step
- **Test migrations on staging first** - Always test before production
- **Monitor closely after deployment** - Watch for errors and performance issues
- **Have rollback plan ready** - Be prepared to rollback if needed
- **Document any issues** - Keep track of problems and solutions

---

## Conclusion

This deployment plan ensures a safe and smooth deployment of the RBAC system to production. Follow each step carefully, verify at each stage, and be prepared to rollback if necessary.

**Remember:** Safety first. If in doubt, rollback and investigate.

