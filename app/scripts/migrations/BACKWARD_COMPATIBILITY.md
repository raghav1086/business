# Backward Compatibility Guarantees

This document explains how the RBAC and Superadmin migrations ensure **zero impact** on existing users and data.

## Core Principles

### 1. **Permissive by Default**
- All existing users get `is_superadmin = FALSE` (not superadmin)
- All existing business owners get `permissions = NULL` (full access)
- No existing user loses any access they had before

### 2. **Idempotent Migrations**
- All migrations can be run multiple times safely
- Use `IF NOT EXISTS` or `ON CONFLICT DO NOTHING`
- No duplicate data or errors on re-run

### 3. **Backward Compatible Code**
- `BusinessContextService` checks `business.owner_id` first (existing logic)
- Only then checks `business_users` table (new logic)
- Existing owners work even if migration hasn't run yet

## Migration Impact Analysis

### ✅ Existing Users
**Before Migration:**
- Users have no `is_superadmin` column
- Users can access their businesses normally

**After Migration:**
- All users get `is_superadmin = FALSE` (default)
- Users continue to work exactly as before
- **Zero impact** - no behavior change

### ✅ Existing Business Owners
**Before Migration:**
- Owners identified by `businesses.owner_id`
- Owners have full access to their businesses

**After Migration:**
- Owners get `business_users` record with `role = 'owner'`
- `permissions = NULL` means full access (same as before)
- Code still checks `business.owner_id` first (backward compatible)
- **Zero impact** - same access, same behavior

### ✅ New Features
**Superadmin:**
- Only affects users explicitly set to `is_superadmin = TRUE`
- Default is `FALSE` for all users
- **Zero impact** on existing users

**RBAC:**
- New feature for assigning employees/admins
- Existing owners continue to work as before
- **Zero impact** on existing functionality

## Code Backward Compatibility

### BusinessContextService Logic

```typescript
// 1. Check superadmin (new feature, doesn't affect existing users)
if (isSuperadmin) { return allPermissions; }

// 2. Check if owner (existing logic - still works!)
if (business.owner_id === userId) { return ownerPermissions; }

// 3. Check business_users (new feature, optional)
const businessUser = await findBusinessUser(...);
```

**Key Point:** Step 2 ensures existing owners work even if `business_users` table is empty or migration hasn't run.

### Default Values

All new columns have safe defaults:
- `is_superadmin`: `DEFAULT FALSE` (not superadmin)
- `business_users.permissions`: `DEFAULT NULL` (full access)
- `business_users.status`: `DEFAULT 'active'` (active)

## Migration Safety Features

### 1. Column Addition
```sql
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_superadmin BOOLEAN DEFAULT FALSE;
```
- `IF NOT EXISTS` prevents errors if column already exists
- `DEFAULT FALSE` ensures all existing rows get `FALSE`
- Safe to run multiple times

### 2. Data Migration
```sql
INSERT INTO business_users (...)
SELECT ... FROM businesses
WHERE NOT EXISTS (...)
ON CONFLICT DO NOTHING;
```
- Only inserts missing records
- `ON CONFLICT DO NOTHING` prevents duplicates
- Idempotent - safe to run multiple times

### 3. Verification
Migration 006 verifies:
- All users have `is_superadmin` set (no NULLs)
- All businesses have owner records
- All owners have full access (NULL permissions)

## Testing Checklist

Before deploying, verify:

- [ ] All existing users can log in
- [ ] All existing business owners can access their businesses
- [ ] No existing data is modified
- [ ] New features work (superadmin, RBAC)
- [ ] Migrations can be run multiple times without errors
- [ ] Rollback is possible (if needed)

## Rollback Strategy

If you need to rollback (not recommended):

1. **Remove new features** (optional):
   ```sql
   DROP TABLE IF EXISTS audit_logs;
   DROP TABLE IF EXISTS business_users;
   ALTER TABLE users DROP COLUMN IF EXISTS is_superadmin;
   ```

2. **Restore old behavior**:
   - Code already supports both old and new logic
   - Removing tables just disables new features
   - Existing owners continue to work via `business.owner_id`

## Common Questions

### Q: Will existing users lose access?
**A:** No. All existing users get `is_superadmin = FALSE` and owners get full access via `business_users` or fallback to `business.owner_id`.

### Q: What if migration fails partway?
**A:** Migrations are designed to be safe:
- Each migration is independent
- Can be run individually
- Failed migrations don't break existing functionality

### Q: Can I run migrations multiple times?
**A:** Yes. All migrations are idempotent and safe to run multiple times.

### Q: What about existing business owners?
**A:** They are automatically migrated to `business_users` with full access (`permissions = NULL`). Code also checks `business.owner_id` as fallback.

### Q: Will this slow down the system?
**A:** No. New indexes improve query performance. Existing queries continue to work as before.

## Summary

✅ **Zero impact on existing users**
✅ **Zero impact on existing business owners**
✅ **Backward compatible code**
✅ **Idempotent migrations**
✅ **Safe defaults**
✅ **Verification scripts**

The migrations are designed to be **completely safe** and **non-breaking** for existing users and data.

