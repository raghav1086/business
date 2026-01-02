# Database Migrations Guide

This document describes the database migrations for the RBAC and Superadmin features, ensuring smooth migration for existing users.

## Migration Order

Run migrations in this order:

1. **001_create_business_users.sql** - Creates the `business_users` table
2. **002_add_superadmin_to_users.sql** - Adds `is_superadmin` column to `users` table
3. **003_migrate_existing_owners.sql** - Migrates existing business owners to `business_users`
4. **004_create_superadmin_user.sql** - Creates/updates superadmin user
5. **005_create_audit_logs.sql** - Creates `audit_logs` table
6. **006_verify_and_fix_migrations.sql** - Verification and safety checks (run last)

## Backward Compatibility

### Existing Users
- ✅ All existing users automatically get `is_superadmin = FALSE` (default)
- ✅ No existing user data is modified
- ✅ All existing users continue to work as before

### Existing Business Owners
- ✅ All existing business owners are automatically migrated to `business_users` table
- ✅ They get `role = 'owner'` with `permissions = NULL` (full access)
- ✅ Migration is idempotent - safe to run multiple times
- ✅ Uses `ON CONFLICT DO NOTHING` to prevent duplicates

### New Features
- ✅ New businesses automatically create `business_users` records for owners
- ✅ New user assignments default to full permissions (permissive by default)
- ✅ Superadmin functionality is opt-in only

## Migration Safety Features

### 1. Default Values
- `is_superadmin` defaults to `FALSE` for all users
- `business_users.permissions` defaults to `NULL` (full access)
- `business_users.status` defaults to `'active'`

### 2. Idempotent Migrations
- All migrations use `IF NOT EXISTS` or `ON CONFLICT DO NOTHING`
- Safe to run multiple times without side effects
- Verification scripts check for completeness

### 3. Data Integrity
- Migration 006 verifies all businesses have owner records
- Ensures no NULL values in critical columns
- Reports any inconsistencies

## Running Migrations

### Manual Execution
```bash
# Connect to your database
psql -U postgres -d business_db

# Run migrations in order
\i scripts/migrations/001_create_business_users.sql
\i scripts/migrations/002_add_superadmin_to_users.sql
\i scripts/migrations/003_migrate_existing_owners.sql
\i scripts/migrations/004_create_superadmin_user.sql
\i scripts/migrations/005_create_audit_logs.sql
\i scripts/migrations/006_verify_and_fix_migrations.sql
```

### Using Migration Tool
If you have a migration tool (like TypeORM migrations or Flyway), add these SQL files to your migration directory.

## Verification

After running migrations, verify:

1. **Users Table**
   ```sql
   SELECT COUNT(*) FROM users WHERE is_superadmin IS NULL; -- Should be 0
   SELECT COUNT(*) FROM users WHERE is_superadmin = TRUE; -- Should be 1 (superadmin)
   ```

2. **Business Users Table**
   ```sql
   SELECT COUNT(*) FROM businesses WHERE status = 'active';
   SELECT COUNT(*) FROM business_users WHERE role = 'owner' AND status = 'active';
   -- These counts should match
   ```

3. **Permissions**
   ```sql
   SELECT COUNT(*) FROM business_users WHERE permissions IS NULL;
   -- Most owners should have NULL (full access)
   ```

## Rollback (if needed)

If you need to rollback:

1. **Remove audit logs** (optional - data loss)
   ```sql
   DROP TABLE IF EXISTS audit_logs;
   ```

2. **Remove business_users** (optional - will break RBAC)
   ```sql
   DROP TABLE IF EXISTS business_users;
   ```

3. **Remove is_superadmin column** (optional)
   ```sql
   ALTER TABLE users DROP COLUMN IF EXISTS is_superadmin;
   ```

⚠️ **Warning**: Rollback will remove RBAC functionality. Only do this if absolutely necessary.

## Troubleshooting

### Issue: Some businesses missing owner records
**Solution**: Run migration 003 again (it's idempotent)
```sql
\i scripts/migrations/003_migrate_existing_owners.sql
```

### Issue: Users have NULL is_superadmin
**Solution**: Run migration 006 (it fixes this)
```sql
\i scripts/migrations/006_verify_and_fix_migrations.sql
```

### Issue: Migration conflicts
**Solution**: All migrations use `IF NOT EXISTS` or `ON CONFLICT DO NOTHING`, so conflicts are handled automatically. If you see errors, check:
- Database permissions
- Table existence
- Constraint violations

## Post-Migration Checklist

- [ ] All existing users have `is_superadmin = FALSE`
- [ ] All business owners have `business_users` records
- [ ] Superadmin user exists (phone: 9175760649)
- [ ] Audit logs table exists
- [ ] No NULL values in critical columns
- [ ] All indexes created successfully
- [ ] Application starts without errors
- [ ] Existing users can log in and access their businesses

## Support

If you encounter issues:
1. Check the verification report from migration 006
2. Review application logs
3. Verify database constraints
4. Ensure all migrations ran successfully

