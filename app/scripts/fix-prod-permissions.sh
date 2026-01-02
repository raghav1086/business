#!/bin/bash

# =============================================================================
# Fix Production Database Permissions Script
# =============================================================================
# Grants full permissions to ALL users in production database
# This ensures all existing users have full access (seamless experience)
# Usage: ./fix-prod-permissions.sh [DB_HOST] [DB_PORT] [DB_USER] [DB_PASSWORD]
# =============================================================================

set -e

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

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║     Fix Production Database Permissions                    ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${YELLOW}Configuration:${NC}"
echo "  • DB Host: $DB_HOST"
echo "  • DB Port: $DB_PORT"
echo "  • DB User: $DB_USER"
echo "  • Database: business_db"
echo ""

# Check if PostgreSQL container is running or use direct connection
USE_DOCKER=false
if docker ps --format '{{.Names}}' | grep -q "^business-postgres$"; then
    USE_DOCKER=true
    echo -e "${BLUE}  → Using Docker for database operations${NC}"
else
    echo -e "${BLUE}  → Using direct database connection${NC}"
    if ! command -v psql &> /dev/null; then
        echo -e "${RED}✗ Error: psql is not installed and Docker is not available${NC}"
        exit 1
    fi
fi

echo ""

# Function to run SQL on business_db
run_sql() {
    local sql=$1
    if [ "$USE_DOCKER" = true ]; then
        docker exec -i business-postgres psql -U "$DB_USER" -d business_db <<EOF
$sql
EOF
    else
        PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d business_db <<EOF
$sql
EOF
    fi
}

# Function to run migration file
run_migration_file() {
    local migration_file=$1
    SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
    if [ "$USE_DOCKER" = true ]; then
        docker exec -i business-postgres psql -U "$DB_USER" -d business_db < "$SCRIPT_DIR/migrations/$migration_file"
    else
        PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d business_db -f "$SCRIPT_DIR/migrations/$migration_file"
    fi
}

# Option: Use migration file (simpler)
if [ -f "$(dirname "${BASH_SOURCE[0]}")/migrations/008_fix_prod_permissions_all_users.sql" ]; then
    echo -e "${YELLOW}Running migration file...${NC}"
    run_migration_file "008_fix_prod_permissions_all_users.sql"
    echo ""
    echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║     Production Permissions Fixed Successfully!              ║${NC}"
    echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${YELLOW}Next steps:${NC}"
    echo "  1. Restart all services:"
    echo "     ${BLUE}docker-compose -f docker-compose.prod.yml restart${NC}"
    echo "  2. Users should log out and log back in"
    echo ""
    exit 0
fi

# Step 1: Ensure all owners have business_users records
echo -e "${YELLOW}Step 1/4: Ensuring all owners have business_users records...${NC}"
run_sql "
-- Insert business_user records for all owners who don't have them
INSERT INTO business_users (business_id, user_id, role, permissions, status, joined_at, created_at, updated_at)
SELECT 
    b.id AS business_id,
    b.owner_id AS user_id,
    'owner' AS role,
    NULL AS permissions, -- NULL = full access
    'active' AS status,
    COALESCE(b.created_at, NOW()) AS joined_at,
    COALESCE(b.created_at, NOW()) AS created_at,
    COALESCE(b.updated_at, NOW()) AS updated_at
FROM businesses b
WHERE b.owner_id IS NOT NULL
  AND b.status = 'active'
  AND NOT EXISTS (
    SELECT 1 FROM business_users bu 
    WHERE bu.business_id = b.id 
      AND bu.user_id = b.owner_id
  )
ON CONFLICT (business_id, user_id) DO NOTHING;
" > /dev/null 2>&1

echo -e "${GREEN}  ✓ Owner records ensured${NC}"
echo ""

# Step 2: Set ALL business_users permissions to NULL (full access)
echo -e "${YELLOW}Step 2/4: Setting all permissions to NULL (full access)...${NC}"
run_sql "
-- Set all permissions to NULL for all active users
UPDATE business_users
SET permissions = NULL
WHERE permissions IS NOT NULL
  AND permissions != 'null'::jsonb
  AND status = 'active';

-- Also set empty JSONB objects to NULL
UPDATE business_users
SET permissions = NULL
WHERE permissions = '{}'::jsonb
  AND status = 'active';
" > /dev/null 2>&1

echo -e "${GREEN}  ✓ All permissions set to NULL (full access)${NC}"
echo ""

# Step 3: Ensure all owners have NULL permissions
echo -e "${YELLOW}Step 3/4: Ensuring all owners have NULL permissions...${NC}"
run_sql "
-- Update existing owner records to have NULL permissions
UPDATE business_users bu
SET permissions = NULL
FROM businesses b
WHERE bu.business_id = b.id
  AND bu.user_id = b.owner_id
  AND bu.role = 'owner'
  AND bu.status = 'active'
  AND b.status = 'active'
  AND (bu.permissions IS NOT NULL AND bu.permissions != 'null'::jsonb);
" > /dev/null 2>&1

echo -e "${GREEN}  ✓ All owners have NULL permissions${NC}"
echo ""

# Step 4: Verify and report
echo -e "${YELLOW}Step 4/4: Verifying changes...${NC}"
run_sql "
DO \$\$
DECLARE
    total_users INTEGER;
    null_permissions_count INTEGER;
    non_null_permissions_count INTEGER;
    owner_count INTEGER;
    business_count INTEGER;
BEGIN
    -- Count total business_users
    SELECT COUNT(*) INTO total_users FROM business_users WHERE status = 'active';
    
    -- Count with NULL permissions (full access)
    SELECT COUNT(*) INTO null_permissions_count 
    FROM business_users 
    WHERE permissions IS NULL AND status = 'active';
    
    -- Count with non-NULL permissions (restricted)
    SELECT COUNT(*) INTO non_null_permissions_count 
    FROM business_users 
    WHERE permissions IS NOT NULL 
      AND permissions != 'null'::jsonb
      AND status = 'active';
    
    -- Count owners
    SELECT COUNT(*) INTO owner_count 
    FROM business_users 
    WHERE role = 'owner' AND status = 'active';
    
    -- Count businesses
    SELECT COUNT(*) INTO business_count 
    FROM businesses 
    WHERE status = 'active';
    
    -- Report
    RAISE NOTICE '=== Production Permissions Fix Report ===';
    RAISE NOTICE 'Total active business_users: %', total_users;
    RAISE NOTICE 'Users with full access (NULL permissions): %', null_permissions_count;
    RAISE NOTICE 'Users with restricted permissions: %', non_null_permissions_count;
    RAISE NOTICE 'Owner records: %', owner_count;
    RAISE NOTICE 'Active businesses: %', business_count;
    
    IF non_null_permissions_count > 0 THEN
        RAISE WARNING 'Some users still have non-NULL permissions: %', non_null_permissions_count;
    ELSE
        RAISE NOTICE '✓ All users have full access (NULL permissions)';
    END IF;
    
    IF business_count > owner_count THEN
        RAISE WARNING 'Some businesses may be missing owner records. Expected: %, Found: %', 
            business_count, owner_count;
    ELSE
        RAISE NOTICE '✓ All businesses have owner records';
    END IF;
    
    RAISE NOTICE '=== Fix Complete ===';
END \$\$;
"

echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║     Production Permissions Fixed Successfully!              ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "  1. Restart all services to pick up the changes:"
echo "     ${BLUE}docker-compose -f docker-compose.prod.yml restart${NC}"
echo "  2. Users should log out and log back in"
echo "  3. All permission errors should be resolved"
echo ""
echo -e "${GREEN}✅ Production database permissions fixed!${NC}"

