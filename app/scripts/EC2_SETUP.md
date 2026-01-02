# EC2 Migration Setup Guide

This guide provides a single-command solution to run all database migrations on your EC2 instance.

## Quick Start

### Single Command Setup

```bash
# From your project root on EC2
cd app/scripts
./setup-migrations.sh [DB_HOST] [DB_PORT] [DB_NAME] [DB_USER] [DB_PASSWORD]
```

### Using Environment Variables

```bash
export DB_HOST=your-db-host
export DB_PORT=5432
export DB_NAME=business_db
export DB_USER=postgres
export DB_PASSWORD=your-password

cd app/scripts
./setup-migrations.sh
```

### One-Liner (if already in project root)

```bash
cd app/scripts && DB_PASSWORD=your_password ./setup-migrations.sh localhost 5432 business_db postgres
```

## Prerequisites

### 1. Install PostgreSQL Client (if not installed)

**Amazon Linux 2:**
```bash
sudo yum install postgresql -y
```

**Ubuntu/Debian:**
```bash
sudo apt-get update
sudo apt-get install postgresql-client -y
```

### 2. Ensure Database is Accessible

```bash
# Test connection
psql -h your-db-host -p 5432 -U postgres -d business_db -c "SELECT 1;"
```

## Usage Examples

### Example 1: Local Database
```bash
cd app/scripts
./setup-migrations.sh localhost 5432 business_db postgres your_password
```

### Example 2: RDS Database
```bash
cd app/scripts
./setup-migrations.sh your-rds-endpoint.region.rds.amazonaws.com 5432 business_db postgres your_password
```

### Example 3: Using Environment Variables
```bash
export DB_HOST=your-rds-endpoint.region.rds.amazonaws.com
export DB_PORT=5432
export DB_NAME=business_db
export DB_USER=postgres
export DB_PASSWORD=your_password

cd app/scripts
./setup-migrations.sh
```

## What the Script Does

1. **Validates Prerequisites**
   - Checks if `psql` is installed
   - Tests database connection
   - Verifies migration files exist

2. **Runs Migrations in Order**
   - `001_create_business_users.sql` - Creates business_users table
   - `002_add_superadmin_to_users.sql` - Adds is_superadmin column
   - `003_migrate_existing_owners.sql` - Migrates existing owners
   - `004_create_superadmin_user.sql` - Creates superadmin user
   - `005_create_audit_logs.sql` - Creates audit_logs table
   - `006_verify_and_fix_migrations.sql` - Verifies and fixes issues

3. **Verifies Setup**
   - Counts regular users
   - Counts superadmin users
   - Counts active businesses
   - Counts owner records
   - Counts users with full access

## Output

The script provides:
- ✅ Colored output for success/failure
- ✅ Progress indicators
- ✅ Error logs for failed migrations
- ✅ Verification report at the end

## Troubleshooting

### Error: psql not found
```bash
# Install PostgreSQL client
sudo yum install postgresql -y  # Amazon Linux
# OR
sudo apt-get install postgresql-client -y  # Ubuntu
```

### Error: Database connection failed
- Check database is running
- Verify connection parameters
- Check security groups (for RDS)
- Verify user has necessary permissions

### Error: Permission denied
```bash
# Make script executable
chmod +x app/scripts/setup-migrations.sh
```

### Error: Migration failed
- Check error logs in `/tmp/migration_*.log`
- Verify database user has CREATE/ALTER permissions
- Check for existing tables/columns that might conflict

## Security Best Practices

### Option 1: Use Environment Variables (Recommended)
```bash
export DB_PASSWORD=your_password
./setup-migrations.sh
unset DB_PASSWORD
```

### Option 2: Use AWS Secrets Manager
```bash
DB_PASSWORD=$(aws secretsmanager get-secret-value --secret-id db-password --query SecretString --output text)
./setup-migrations.sh
```

### Option 3: Use .env file (if using dotenv)
```bash
source .env
./setup-migrations.sh
```

## Verification

After running the script, verify:

```bash
# Connect to database
psql -h your-db-host -U postgres -d business_db

# Check tables exist
\dt business_users
\dt audit_logs

# Check is_superadmin column
\d users

# Verify data
SELECT COUNT(*) FROM users WHERE is_superadmin = FALSE;
SELECT COUNT(*) FROM business_users WHERE role = 'owner';
```

## Rollback (if needed)

If you need to rollback:

```sql
-- Connect to database
psql -h your-db-host -U postgres -d business_db

-- Remove new tables (optional)
DROP TABLE IF EXISTS audit_logs;
DROP TABLE IF EXISTS business_users;

-- Remove column (optional)
ALTER TABLE users DROP COLUMN IF EXISTS is_superadmin;
```

⚠️ **Warning**: Rollback will remove RBAC functionality. Only do this if absolutely necessary.

## Automation

### Add to Deployment Script

```bash
#!/bin/bash
# deploy.sh

# ... your deployment steps ...

# Run migrations
cd app/scripts
./setup-migrations.sh $DB_HOST $DB_PORT $DB_NAME $DB_USER $DB_PASSWORD

# ... continue deployment ...
```

### Add to CI/CD Pipeline

```yaml
# .github/workflows/deploy.yml
- name: Run Database Migrations
  run: |
    cd app/scripts
    ./setup-migrations.sh ${{ secrets.DB_HOST }} ${{ secrets.DB_PORT }} ${{ secrets.DB_NAME }} ${{ secrets.DB_USER }} ${{ secrets.DB_PASSWORD }}
```

## Support

If you encounter issues:
1. Check the error messages in the script output
2. Review migration logs in `/tmp/migration_*.log`
3. Verify database permissions
4. Check [BACKWARD_COMPATIBILITY.md](./migrations/BACKWARD_COMPATIBILITY.md) for compatibility guarantees

