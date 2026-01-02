#!/bin/bash

# =============================================================================
# Fix PostgreSQL Password Script
# =============================================================================
# This script resets the PostgreSQL password to match the expected password
# for services. This is needed when PostgreSQL was initialized with a 
# different password than what the services are using.
# =============================================================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Default password (should match what services expect)
EXPECTED_PASSWORD="${1:-postgres}"

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║     Fixing PostgreSQL Password                             ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Check if PostgreSQL container is running
if ! docker ps | grep -q business-postgres; then
    echo -e "${RED}✗ PostgreSQL container is not running${NC}"
    echo -e "${YELLOW}  → Starting PostgreSQL container...${NC}"
    exit 1
fi

echo -e "${YELLOW}Resetting PostgreSQL password to: ${EXPECTED_PASSWORD}${NC}"
echo ""

# Method 1: Try to connect using docker exec (may work with trust auth for local connections)
echo -e "${BLUE}  → Attempting to reset password using docker exec...${NC}"

# Try connecting without password first (trust authentication might work for local connections)
if docker exec business-postgres psql -U postgres -c "ALTER USER postgres WITH PASSWORD '$EXPECTED_PASSWORD';" 2>/dev/null; then
    echo -e "${GREEN}    ✓ Password reset successful (using trust auth)${NC}"
    RESET_SUCCESS=true
else
    # Method 2: Try common passwords
    echo -e "${BLUE}  → Trying common passwords...${NC}"
    COMMON_PASSWORDS=("postgres" "password" "admin" "")

    RESET_SUCCESS=false
    for try_password in "${COMMON_PASSWORDS[@]}"; do
        echo -e "${BLUE}    → Trying password: ${try_password:-'(empty)'}${NC}"
        
        # Try to connect and reset password
        if docker exec -e PGPASSWORD="$try_password" business-postgres psql -U postgres -c "ALTER USER postgres WITH PASSWORD '$EXPECTED_PASSWORD';" 2>/dev/null; then
            echo -e "${GREEN}    ✓ Password reset successful${NC}"
            RESET_SUCCESS=true
            break
        fi
    done
fi

if [ "$RESET_SUCCESS" = false ]; then
    echo -e "${YELLOW}  ⚠️  Could not reset password automatically${NC}"
    echo -e "${YELLOW}  → Trying alternative method: using su to become postgres user...${NC}"
    
    # Method 3: Use su to become postgres user inside container (bypasses password)
    if docker exec business-postgres sh -c "su - postgres -c \"psql -c \\\"ALTER USER postgres WITH PASSWORD '$EXPECTED_PASSWORD';\\\"\"" 2>/dev/null; then
        echo -e "${GREEN}    ✓ Password reset successful (using su method)${NC}"
        RESET_SUCCESS=true
    fi
fi

if [ "$RESET_SUCCESS" = false ]; then
    echo -e "${RED}  ✗ All automatic methods failed${NC}"
    echo ""
    echo -e "${YELLOW}Manual fix required. Try one of these methods:${NC}"
    echo ""
    echo -e "${BLUE}Method 1: Direct SQL (if trust auth works):${NC}"
    echo "  ${YELLOW}docker exec -it business-postgres psql -U postgres${NC}"
    echo "  ${YELLOW}ALTER USER postgres WITH PASSWORD 'postgres';${NC}"
    echo ""
    echo -e "${BLUE}Method 2: Using su (bypasses password):${NC}"
    echo "  ${YELLOW}docker exec -it business-postgres sh${NC}"
    echo "  ${YELLOW}su - postgres${NC}"
    echo "  ${YELLOW}psql -c \"ALTER USER postgres WITH PASSWORD 'postgres';\"${NC}"
    echo ""
    echo -e "${BLUE}Method 3: Temporarily modify pg_hba.conf (advanced):${NC}"
    echo "  ${YELLOW}docker exec -it business-postgres sh -c \"echo 'host all all 0.0.0.0/0 trust' >> /var/lib/postgresql/data/pg_hba.conf\"${NC}"
    echo "  ${YELLOW}docker restart business-postgres${NC}"
    echo "  ${YELLOW}docker exec business-postgres psql -U postgres -c \"ALTER USER postgres WITH PASSWORD 'postgres';\"${NC}"
    echo ""
    exit 1
fi

# Verify the password works
echo -e "${BLUE}  → Verifying new password...${NC}"
if docker exec -e PGPASSWORD="$EXPECTED_PASSWORD" business-postgres psql -U postgres -c "SELECT 1;" > /dev/null 2>&1; then
    echo -e "${GREEN}    ✓ Password verification successful${NC}"
else
    echo -e "${RED}    ✗ Password verification failed${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║     PostgreSQL Password Fixed Successfully!                 ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "  1. Restart all services:"
echo "     ${BLUE}docker-compose -f docker-compose.prod.yml restart${NC}"
echo ""
echo -e "${GREEN}✅ Password fix complete!${NC}"

