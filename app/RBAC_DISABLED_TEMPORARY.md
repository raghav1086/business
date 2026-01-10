# RBAC Temporarily Disabled

## Status: ✅ RBAC Disabled for Non-Superadmin Users

**Date:** 2026-01-10  
**Reason:** Temporary disable to allow all users to perform any operation without permission restrictions. Will be re-enabled later.

## Changes Made

### Modified File
- `app/libs/shared/src/guards/permission.guard.ts`

### Behavior

**Before:**
- All users (including non-superadmin) were checked for required permissions
- Users without required permissions were denied access with `ForbiddenException`

**After:**
- **Superadmin users:** RBAC checks remain enabled (they have all permissions anyway)
- **All other users:** RBAC checks are bypassed - all operations are allowed

## Implementation Details

The `PermissionGuard` now:
1. ✅ Still checks if user is superadmin
2. ✅ For superadmin: Allows access (as before)
3. ✅ For non-superadmin: **Bypasses permission check and allows all operations**

### Code Change

```typescript
// TEMPORARY: RBAC disabled for all non-superadmin users
// Allow all operations without permission checks
// TODO: Re-enable RBAC checks when ready
return true;
```

The original permission check code is preserved as comments for easy re-enablement.

## Impact

### ✅ What Still Works
- Authentication is still required (JWT tokens)
- Business context validation still works
- Superadmin checks still work
- All endpoints are accessible to authenticated users

### ⚠️ What Changed
- Non-superadmin users can now access any endpoint
- Permission decorators (`@RequirePermission`) are ignored for non-superadmin users
- No permission-based restrictions for regular users

## Re-Enabling RBAC

When ready to re-enable RBAC:

1. Open `app/libs/shared/src/guards/permission.guard.ts`
2. Remove the temporary bypass code:
   ```typescript
   // TEMPORARY: RBAC disabled for all non-superadmin users
   // Allow all operations without permission checks
   // TODO: Re-enable RBAC checks when ready
   return true;
   ```
3. Uncomment the original permission check code (already preserved in comments)
4. Rebuild affected services:
   ```bash
   cd /opt/business-app/app
   docker-compose -f docker-compose.prod.yml build
   docker-compose -f docker-compose.prod.yml up -d
   ```

## Testing

### Verify RBAC is Disabled
```bash
# Test with regular user (should work now)
curl -X POST 'https://samriddhi.buzz/api/v1/invoices' \
  -H 'Authorization: Bearer {regular-user-token}' \
  -H 'x-business-id: {business-id}' \
  -H 'Content-Type: application/json' \
  -d '{...}'

# Should return 201 Created (previously would have been 403 Forbidden)
```

### Verify Superadmin Still Works
```bash
# Test with superadmin (should still work)
curl -X POST 'https://samriddhi.buzz/api/v1/invoices' \
  -H 'Authorization: Bearer {superadmin-token}' \
  -H 'x-business-id: {business-id}' \
  -H 'Content-Type: application/json' \
  -d '{...}'

# Should return 201 Created
```

## Services Affected

All services using `PermissionGuard` are affected:
- ✅ `auth-service`
- ✅ `business-service`
- ✅ `party-service`
- ✅ `inventory-service`
- ✅ `invoice-service`
- ✅ `payment-service`

## Deployment

After this change, rebuild all services:

```bash
cd /opt/business-app/app
docker-compose -f docker-compose.prod.yml build
docker-compose -f docker-compose.prod.yml up -d
```

Or rebuild specific services that use PermissionGuard:
```bash
docker-compose -f docker-compose.prod.yml build auth-service business-service party-service inventory-service invoice-service payment-service
docker-compose -f docker-compose.prod.yml up -d
```

## Notes

- This is a **temporary** change
- Authentication is still required
- Business context validation still works
- Only permission checks are bypassed
- Superadmin checks remain in place
- Easy to re-enable by uncommenting the original code

