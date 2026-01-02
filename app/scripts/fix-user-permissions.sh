#!/bin/bash

# =============================================================================
# Fix User Permissions Script
# =============================================================================
# Grants full permissions to a specific user or all users
# Usage: ./fix-user-permissions.sh [PHONE_NUMBER]
# If no phone number provided, fixes all users
# =============================================================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

PHONE_NUMBER="${1:-}"

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║     Fix User Permissions                                    ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Check if PostgreSQL container is running
if ! docker ps | grep -q business-postgres; then
    echo -e "${RED}✗ PostgreSQL container is not running${NC}"
    exit 1
fi

if [ -z "$PHONE_NUMBER" ]; then
    echo -e "${YELLOW}Fixing permissions for ALL users...${NC}"
    echo ""
    
    # Fix all users - set all permissions to NULL (full access)
    echo -e "${BLUE}  → Setting all business_users permissions to NULL (full access)...${NC}"
    
    docker exec -i business-postgres psql -U postgres -d business_db <<EOF
-- Set all permissions to NULL (full access) for all active users
UPDATE business_users
SET permissions = NULL
WHERE permissions IS NOT NULL
  AND permissions != 'null'::jsonb
  AND status = 'active';

-- Ensure all owners have NULL permissions
UPDATE business_users
SET permissions = NULL
WHERE role = 'owner'
  AND status = 'active'
  AND (permissions IS NOT NULL AND permissions != 'null'::jsonb);

-- Report results
DO \$\$
DECLARE
    updated_count INTEGER;
    total_users INTEGER;
    null_permissions_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO total_users FROM business_users WHERE status = 'active';
    SELECT COUNT(*) INTO null_permissions_count FROM business_users WHERE permissions IS NULL AND status = 'active';
    
    RAISE NOTICE '=== Permission Fix Report ===';
    RAISE NOTICE 'Total active users: %', total_users;
    RAISE NOTICE 'Users with full access (NULL permissions): %', null_permissions_count;
    RAISE NOTICE '=== Fix Complete ===';
END \$\$;
EOF

    echo -e "${GREEN}✓ All users now have full permissions${NC}"
else
    echo -e "${YELLOW}Fixing permissions for user with phone: ${PHONE_NUMBER}${NC}"
    echo ""
    
    # Find user by phone number
    echo -e "${BLUE}  → Looking up user by phone number...${NC}"
    
    USER_ID=$(docker exec business-postgres psql -U postgres -d auth_db -tAc "SELECT id FROM users WHERE phone = '$PHONE_NUMBER' LIMIT 1" 2>/dev/null || echo "")
    
    if [ -z "$USER_ID" ]; then
        echo -e "${RED}✗ User not found with phone number: $PHONE_NUMBER${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}  ✓ Found user: $USER_ID${NC}"
    echo ""
    
    # Get user's businesses
    echo -e "${BLUE}  → Finding user's businesses...${NC}"
    
    docker exec -i business-postgres psql -U postgres -d business_db <<EOF
-- Find businesses where user is owner
SELECT b.id, b.name, 'owner' as role
FROM businesses b
WHERE b.owner_id = '$USER_ID'
  AND b.status = 'active'
UNION
-- Find businesses where user is assigned
SELECT b.id, b.name, bu.role
FROM business_users bu
JOIN businesses b ON b.id = bu.business_id
WHERE bu.user_id = '$USER_ID'
  AND bu.status = 'active'
  AND b.status = 'active';
EOF

    echo ""
    
    # Fix permissions for this user
    echo -e "${BLUE}  → Granting full permissions to user...${NC}"
    
    docker exec -i business-postgres psql -U postgres -d business_db <<EOF
-- Ensure user has business_users records for all their businesses (as owner)
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
WHERE b.owner_id = '$USER_ID'
  AND b.status = 'active'
  AND NOT EXISTS (
    SELECT 1 FROM business_users bu 
    WHERE bu.business_id = b.id 
      AND bu.user_id = b.owner_id
  )
ON CONFLICT (business_id, user_id) DO NOTHING;

-- Set all permissions to NULL (full access) for this user
UPDATE business_users
SET permissions = NULL
WHERE user_id = '$USER_ID'
  AND status = 'active'
  AND (permissions IS NOT NULL AND permissions != 'null'::jsonb);

-- Report results
DO \$\$
DECLARE
    user_businesses INTEGER;
    null_permissions_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO user_businesses 
    FROM business_users 
    WHERE user_id = '$USER_ID' AND status = 'active';
    
    SELECT COUNT(*) INTO null_permissions_count 
    FROM business_users 
    WHERE user_id = '$USER_ID' 
      AND permissions IS NULL 
      AND status = 'active';
    
    RAISE NOTICE '=== Permission Fix Report for User ===';
    RAISE NOTICE 'User ID: %', '$USER_ID';
    RAISE NOTICE 'Phone: %', '$PHONE_NUMBER';
    RAISE NOTICE 'Businesses: %', user_businesses;
    RAISE NOTICE 'With full access (NULL permissions): %', null_permissions_count;
    RAISE NOTICE '=== Fix Complete ===';
END \$\$;
EOF

    echo -e "${GREEN}✓ User permissions fixed${NC}"
fi

echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║     Permissions Fixed Successfully!                        ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "  1. User should log out and log back in to refresh permissions"
echo "  2. Or restart the services:"
echo "     ${BLUE}docker-compose -f docker-compose.prod.yml restart${NC}"
echo ""
echo -e "${GREEN}✅ Fix complete!${NC}"

