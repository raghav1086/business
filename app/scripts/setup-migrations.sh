#!/bin/bash

# Single Command Migration Setup Script for EC2
# This script runs all migrations and verifies the setup
# Usage: ./setup-migrations.sh [DB_HOST] [DB_PORT] [DB_NAME] [DB_USER] [DB_PASSWORD]

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Database connection parameters (from arguments or environment)
DB_HOST="${1:-${DB_HOST:-localhost}}"
DB_PORT="${2:-${DB_PORT:-5432}}"
DB_NAME="${3:-${DB_NAME:-business_db}}"
DB_USER="${4:-${DB_USER:-postgres}}"
DB_PASSWORD="${5:-${DB_PASSWORD}}"

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MIGRATIONS_DIR="$SCRIPT_DIR/migrations"

# Check if migrations directory exists
if [ ! -d "$MIGRATIONS_DIR" ]; then
    echo -e "${RED}Error: Migrations directory not found: $MIGRATIONS_DIR${NC}"
    exit 1
fi

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║     Database Migration Setup Script for EC2              ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${GREEN}Configuration:${NC}"
echo "  Database: $DB_NAME"
echo "  Host: $DB_HOST:$DB_PORT"
echo "  User: $DB_USER"
echo ""

# Check if psql is available
if ! command -v psql &> /dev/null; then
    echo -e "${RED}Error: psql is not installed or not in PATH${NC}"
    echo "Install PostgreSQL client: sudo yum install postgresql -y (Amazon Linux)"
    echo "Or: sudo apt-get install postgresql-client -y (Ubuntu)"
    exit 1
fi

# Test database connection
echo -e "${YELLOW}Testing database connection...${NC}"
if PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "SELECT 1;" > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Database connection successful${NC}"
else
    echo -e "${RED}✗ Database connection failed${NC}"
    echo "Please check:"
    echo "  - Database is running"
    echo "  - Connection parameters are correct"
    echo "  - User has necessary permissions"
    exit 1
fi

# Function to run a migration
run_migration() {
    local migration_file=$1
    local migration_name=$(basename "$migration_file")
    
    echo -e "${YELLOW}→ Running: $migration_name${NC}"
    
    if PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$migration_file" > /tmp/migration_${migration_name}.log 2>&1; then
        echo -e "${GREEN}  ✓ $migration_name completed${NC}"
        return 0
    else
        echo -e "${RED}  ✗ $migration_name failed${NC}"
        echo -e "${RED}  Error log:${NC}"
        cat /tmp/migration_${migration_name}.log | head -20
        return 1
    fi
}

# Migration files in order
MIGRATIONS=(
    "001_create_business_users.sql"
    "002_add_superadmin_to_users.sql"
    "003_migrate_existing_owners.sql"
    "004_create_superadmin_user.sql"
    "005_create_audit_logs.sql"
    "006_verify_and_fix_migrations.sql"
)

echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}Starting migrations...${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}"
echo ""

FAILED=0
SUCCESS_COUNT=0

for migration in "${MIGRATIONS[@]}"; do
    migration_path="$MIGRATIONS_DIR/$migration"
    
    if [ ! -f "$migration_path" ]; then
        echo -e "${RED}✗ Error: Migration file not found: $migration_path${NC}"
        FAILED=1
        break
    fi
    
    if run_migration "$migration_path"; then
        ((SUCCESS_COUNT++))
    else
        FAILED=1
        echo ""
        echo -e "${RED}Migration failed. Stopping.${NC}"
        echo "Check the error log above for details."
        break
    fi
    echo ""
done

echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}"

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ All migrations completed successfully! ($SUCCESS_COUNT/${#MIGRATIONS[@]})${NC}"
    echo ""
    echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}"
    echo -e "${BLUE}Verification Report:${NC}"
    echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}"
    
    # Run verification query
    PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "
        SELECT 
            'Regular Users' as metric,
            COUNT(*)::text as value
        FROM users 
        WHERE is_superadmin = FALSE AND status = 'active'
        UNION ALL
        SELECT 
            'Superadmin Users',
            COUNT(*)::text
        FROM users 
        WHERE is_superadmin = TRUE AND status = 'active'
        UNION ALL
        SELECT 
            'Active Businesses',
            COUNT(*)::text
        FROM businesses 
        WHERE status = 'active'
        UNION ALL
        SELECT 
            'Owner Records',
            COUNT(*)::text
        FROM business_users 
        WHERE role = 'owner' AND status = 'active'
        UNION ALL
        SELECT 
            'Users with Full Access',
            COUNT(*)::text
        FROM business_users 
        WHERE permissions IS NULL AND status = 'active';
    " 2>/dev/null || echo -e "${YELLOW}Note: Could not run verification query${NC}"
    
    echo ""
    echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}"
    echo -e "${GREEN}✓ Migration setup complete!${NC}"
    echo ""
    echo -e "${YELLOW}Next steps:${NC}"
    echo "  1. Verify your application can connect to the database"
    echo "  2. Test login with existing users"
    echo "  3. Test superadmin login (phone: 9175760649, OTP: 760649)"
    echo "  4. Check that existing business owners can access their businesses"
    echo ""
    exit 0
else
    echo -e "${RED}✗ Migration setup failed!${NC}"
    echo ""
    echo -e "${YELLOW}Troubleshooting:${NC}"
    echo "  1. Check database connection parameters"
    echo "  2. Verify user has CREATE TABLE and ALTER TABLE permissions"
    echo "  3. Check migration logs in /tmp/migration_*.log"
    echo "  4. Review the error messages above"
    echo ""
    exit 1
fi

