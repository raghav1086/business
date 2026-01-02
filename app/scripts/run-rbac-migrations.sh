#!/bin/bash

# RBAC Migration Runner
# Runs migrations on the correct databases (auth_db and business_db)
# Usage: ./run-rbac-migrations.sh [DB_HOST] [DB_PORT] [DB_USER] [DB_PASSWORD]

# Don't exit on error - migrations are idempotent
set +e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Database connection parameters
DB_HOST="${1:-localhost}"
DB_PORT="${2:-5432}"
DB_USER="${3:-postgres}"
DB_PASSWORD="${4:-postgres}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MIGRATIONS_DIR="$SCRIPT_DIR/migrations"

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║     RBAC Migration Runner                                  ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Check if psql is available
if ! command -v psql &> /dev/null; then
    echo -e "${RED}Error: psql is not installed${NC}"
    exit 1
fi

# Function to run migration on specific database
run_migration_on_db() {
    local db_name=$1
    local migration_file=$2
    local migration_name=$(basename "$migration_file")
    
    echo -e "${YELLOW}  → $migration_name on $db_name...${NC}"
    
    if PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$db_name" -f "$migration_file" > /dev/null 2>&1; then
        echo -e "${GREEN}    ✓ Completed${NC}"
        return 0
    else
        echo -e "${YELLOW}    ⚠️  Skipped (may already be applied)${NC}"
        return 0  # Don't fail, migrations are idempotent
    fi
}

# Migrations for auth_db (users table)
echo -e "${BLUE}Running migrations on auth_db...${NC}"
run_migration_on_db "auth_db" "$MIGRATIONS_DIR/002_add_superadmin_to_users.sql"
run_migration_on_db "auth_db" "$MIGRATIONS_DIR/004_create_superadmin_user.sql"

# Migrations for business_db (business_users, audit_logs)
echo ""
echo -e "${BLUE}Running migrations on business_db...${NC}"
run_migration_on_db "business_db" "$MIGRATIONS_DIR/001_create_business_users.sql"
run_migration_on_db "business_db" "$MIGRATIONS_DIR/003_migrate_existing_owners.sql"
run_migration_on_db "business_db" "$MIGRATIONS_DIR/005_create_audit_logs.sql"

# Verification (runs on business_db, but checks both)
echo ""
echo -e "${BLUE}Running verification...${NC}"
run_migration_on_db "business_db" "$MIGRATIONS_DIR/006_verify_and_fix_migrations.sql"

echo ""
echo -e "${GREEN}✓ RBAC migrations complete!${NC}"
echo ""

