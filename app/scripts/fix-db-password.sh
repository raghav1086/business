#!/bin/bash
# =============================================================================
# FIX DATABASE PASSWORD MISMATCH
# =============================================================================
# This script fixes password mismatch between PostgreSQL and services
# by syncing the password from PostgreSQL to .env.production
# Usage: ./fix-db-password.sh
# =============================================================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
ENV_FILE="$APP_DIR/.env.production"

echo -e "${BLUE}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║     FIX DATABASE PASSWORD MISMATCH                            ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════════╝${NC}"
echo ""

cd "$APP_DIR"

# Check if PostgreSQL is running
if ! docker ps | grep -q business-postgres; then
    echo -e "${RED}❌ PostgreSQL container not running${NC}"
    exit 1
fi

# Get the password from PostgreSQL container
echo -e "${YELLOW}📋 Step 1/4: Getting password from PostgreSQL container...${NC}"
POSTGRES_PASSWORD=$(docker exec business-postgres env | grep POSTGRES_PASSWORD | cut -d'=' -f2)

if [ -z "$POSTGRES_PASSWORD" ]; then
    echo -e "${RED}❌ Could not get password from PostgreSQL container${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Found PostgreSQL password (length: ${#POSTGRES_PASSWORD})${NC}"
echo ""

# Update .env.production
echo -e "${YELLOW}📋 Step 2/4: Updating .env.production...${NC}"

if [ -f "$ENV_FILE" ]; then
    # Backup existing file
    cp "$ENV_FILE" "${ENV_FILE}.backup.$(date +%Y%m%d_%H%M%S)"
    
    # Update or add DB_PASSWORD
    if grep -q "^DB_PASSWORD=" "$ENV_FILE"; then
        sed -i.bak "s/^DB_PASSWORD=.*/DB_PASSWORD=$POSTGRES_PASSWORD/" "$ENV_FILE"
        echo -e "${GREEN}✅ Updated existing DB_PASSWORD in .env.production${NC}"
    else
        echo "DB_PASSWORD=$POSTGRES_PASSWORD" >> "$ENV_FILE"
        echo -e "${GREEN}✅ Added DB_PASSWORD to .env.production${NC}"
    fi
    
    # Remove .bak file if created
    rm -f "${ENV_FILE}.bak"
else
    # Create new .env.production
    cat > "$ENV_FILE" << EOF
# Business App Production Environment
# Generated on $(date)

# Database Configuration
DB_PASSWORD=$POSTGRES_PASSWORD

# JWT Secret (preserve if exists, otherwise generate)
JWT_SECRET=\${JWT_SECRET:-$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-32)}
EOF
    echo -e "${GREEN}✅ Created new .env.production with DB_PASSWORD${NC}"
fi

echo ""

# Export password for docker-compose
export DB_PASSWORD="$POSTGRES_PASSWORD"

# Check JWT_SECRET
if grep -q "^JWT_SECRET=" "$ENV_FILE"; then
    export JWT_SECRET=$(grep "^JWT_SECRET=" "$ENV_FILE" | cut -d'=' -f2- | tr -d '"' | tr -d "'")
else
    JWT_SECRET=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-32)
    echo "JWT_SECRET=$JWT_SECRET" >> "$ENV_FILE"
    export JWT_SECRET
fi

# Restart services with correct password
echo -e "${YELLOW}📋 Step 3/4: Restarting services with correct password...${NC}"

# Stop all services
docker-compose -f docker-compose.prod.yml stop auth-service business-service party-service inventory-service invoice-service payment-service

# Restart services (they'll pick up the new password from .env.production)
docker-compose -f docker-compose.prod.yml up -d auth-service business-service party-service inventory-service invoice-service payment-service

echo -e "${GREEN}✅ Services restarted${NC}"
echo ""

# Wait and verify
echo -e "${YELLOW}📋 Step 4/4: Verifying database connections...${NC}"
echo "   Waiting for services to start..."
sleep 30

echo ""
echo -e "${BLUE}Service Status:${NC}"
docker-compose -f docker-compose.prod.yml ps

echo ""
echo -e "${YELLOW}🔍 Checking service health...${NC}"
for service in auth business party inventory invoice payment; do
    if docker logs business-$service 2>&1 | tail -30 | grep -q "Nest application successfully started"; then
        echo -e "   ${GREEN}✓${NC} ${service}-service connected to database"
    elif docker logs business-$service 2>&1 | tail -30 | grep -q "password authentication failed"; then
        echo -e "   ${RED}✗${NC} ${service}-service still has password issues"
    else
        echo -e "   ${YELLOW}⏳${NC} ${service}-service still starting..."
    fi
done

echo ""
echo -e "${GREEN}════════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}✅ PASSWORD FIX COMPLETE!${NC}"
echo -e "${GREEN}════════════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "${YELLOW}📋 Important:${NC}"
echo "   • DB_PASSWORD synced to: $ENV_FILE"
echo "   • Services restarted with correct password"
echo "   • Wait 1-2 minutes for all services to be fully healthy"
echo ""
echo -e "${YELLOW}🔍 To check logs:${NC}"
echo "   docker logs business-auth --tail=50"
echo ""

