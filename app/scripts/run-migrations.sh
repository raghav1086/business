#!/bin/bash

# Database Migration Runner
# This script runs all migrations in order and verifies the results

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Database connection parameters
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-business_db}"
DB_USER="${DB_USER:-postgres}"

# Migration directory
MIGRATIONS_DIR="$(dirname "$0")/migrations"

echo -e "${GREEN}=== Database Migration Runner ===${NC}"
echo "Database: $DB_NAME"
echo "Host: $DB_HOST:$DB_PORT"
echo "User: $DB_USER"
echo ""

# Check if psql is available
if ! command -v psql &> /dev/null; then
    echo -e "${RED}Error: psql is not installed or not in PATH${NC}"
    exit 1
fi

# Function to run a migration
run_migration() {
    local migration_file=$1
    local migration_name=$(basename "$migration_file")
    
    echo -e "${YELLOW}Running: $migration_name${NC}"
    
    if PGPASSWORD="${DB_PASSWORD}" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$migration_file" > /dev/null 2>&1; then
        echo -e "${GREEN}✓ $migration_name completed${NC}"
        return 0
    else
        echo -e "${RED}✗ $migration_name failed${NC}"
        return 1
    fi
}

# Run migrations in order
MIGRATIONS=(
    "001_create_business_users.sql"
    "002_add_superadmin_to_users.sql"
    "003_migrate_existing_owners.sql"
    "004_create_superadmin_user.sql"
    "005_create_audit_logs.sql"
    "006_verify_and_fix_migrations.sql"
)

FAILED=0

for migration in "${MIGRATIONS[@]}"; do
    migration_path="$MIGRATIONS_DIR/$migration"
    
    if [ ! -f "$migration_path" ]; then
        echo -e "${RED}Error: Migration file not found: $migration_path${NC}"
        FAILED=1
        continue
    fi
    
    if ! run_migration "$migration_path"; then
        FAILED=1
        echo -e "${RED}Migration failed. Stopping.${NC}"
        break
    fi
done

if [ $FAILED -eq 0 ]; then
    echo ""
    echo -e "${GREEN}=== All migrations completed successfully! ===${NC}"
    echo ""
    echo "Verification:"
    PGPASSWORD="${DB_PASSWORD}" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "
        SELECT 
            (SELECT COUNT(*) FROM users WHERE is_superadmin = FALSE) as regular_users,
            (SELECT COUNT(*) FROM users WHERE is_superadmin = TRUE) as superadmins,
            (SELECT COUNT(*) FROM businesses WHERE status = 'active') as active_businesses,
            (SELECT COUNT(*) FROM business_users WHERE role = 'owner' AND status = 'active') as owner_records,
            (SELECT COUNT(*) FROM business_users WHERE permissions IS NULL) as full_access_users;
    "
    exit 0
else
    echo ""
    echo -e "${RED}=== Migration failed. Please check the errors above. ===${NC}"
    exit 1
fi

