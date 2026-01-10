#!/bin/bash

# =============================================================================
# Redeploy All Services with New Password on EC2
# =============================================================================
# This script updates the database password and redeploys all services
# ensuring everything stays in sync.
# 
# Usage:
#   ./scripts/redeploy-all-with-new-password.sh [NEW_PASSWORD]
#   If NEW_PASSWORD is not provided, it will use "Admin112233" as default
# =============================================================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$PROJECT_ROOT"

# Get new password (default: Admin112233)
NEW_PASSWORD="${1:-Admin112233}"

echo -e "${BLUE}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   REDEPLOY ALL SERVICES WITH NEW PASSWORD                    ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${YELLOW}New Password: ${NEW_PASSWORD}${NC}"
echo ""

# Step 1: Backup current environment
echo -e "${YELLOW}📋 Step 1/7: Backing up current environment...${NC}"
ENV_FILE=".env.production"
if [ -f "$ENV_FILE" ]; then
    cp "$ENV_FILE" "${ENV_FILE}.backup.$(date +%Y%m%d_%H%M%S)"
    echo -e "${GREEN}✅ Environment file backed up${NC}"
else
    echo -e "${YELLOW}⚠️  .env.production not found, will create new one${NC}"
fi
echo ""

# Step 2: Update .env.production with new password
echo -e "${YELLOW}📋 Step 2/7: Updating .env.production with new password...${NC}"

# Preserve JWT_SECRET if it exists
JWT_SECRET=""
if [ -f "$ENV_FILE" ] && grep -q "^JWT_SECRET=" "$ENV_FILE"; then
    JWT_SECRET=$(grep "^JWT_SECRET=" "$ENV_FILE" | cut -d'=' -f2- | tr -d '"' | tr -d "'")
    echo -e "${GREEN}✅ Preserved existing JWT_SECRET${NC}"
else
    JWT_SECRET=$(openssl rand -base64 64 | tr -d "=+/" | cut -c1-64)
    echo -e "${YELLOW}⚠️  Generated new JWT_SECRET${NC}"
fi

# Create/update .env.production
cat > "$ENV_FILE" <<EOF
DB_PASSWORD=${NEW_PASSWORD}
JWT_SECRET=${JWT_SECRET}
ENABLE_SYNC=true
ENABLE_FAKE_OTP=true
EOF

echo -e "${GREEN}✅ Updated .env.production with new password${NC}"
echo ""

# Step 3: Load environment variables
echo -e "${YELLOW}📋 Step 3/7: Loading environment variables...${NC}"
set -a
source "$ENV_FILE"
set +a
export DB_PASSWORD="$NEW_PASSWORD"
export JWT_SECRET
echo -e "${GREEN}✅ Environment variables loaded${NC}"
echo ""

# Step 4: Stop all services
echo -e "${YELLOW}📋 Step 4/7: Stopping all services...${NC}"
docker-compose -f docker-compose.prod.yml down
echo -e "${GREEN}✅ All services stopped${NC}"
echo ""

# Step 5: Update PostgreSQL password (if container exists)
echo -e "${YELLOW}📋 Step 5/7: Updating PostgreSQL password...${NC}"
if docker ps -a | grep -q "business-postgres"; then
    echo "   PostgreSQL container exists, updating password..."
    
    # Start postgres temporarily to update password
    docker-compose -f docker-compose.prod.yml up -d postgres
    
    # Wait for postgres to be ready
    echo "   Waiting for PostgreSQL to be ready..."
    sleep 10
    
    # Update password in PostgreSQL
    docker exec -e PGPASSWORD="${DB_PASSWORD}" business-postgres psql -U postgres -c "ALTER USER postgres WITH PASSWORD '${NEW_PASSWORD}';" 2>/dev/null || \
    docker exec business-postgres psql -U postgres -c "ALTER USER postgres WITH PASSWORD '${NEW_PASSWORD}';" 2>/dev/null || \
    echo -e "${YELLOW}⚠️  Could not update password via SQL (may need to restart container)${NC}"
    
    echo -e "${GREEN}✅ PostgreSQL password update attempted${NC}"
else
    echo -e "${YELLOW}⚠️  PostgreSQL container not found, will be created with new password${NC}"
fi
echo ""

# Step 6: Rebuild all services
echo -e "${YELLOW}📋 Step 6/7: Rebuilding all services with new password...${NC}"
echo "   This may take several minutes..."
docker-compose -f docker-compose.prod.yml build --no-cache
echo -e "${GREEN}✅ All services rebuilt${NC}"
echo ""

# Step 7: Start all services
echo -e "${YELLOW}📋 Step 7/7: Starting all services...${NC}"
docker-compose -f docker-compose.prod.yml up -d
echo -e "${GREEN}✅ All services started${NC}"
echo ""

# Wait for services to be healthy
echo -e "${YELLOW}⏳ Waiting for services to be healthy...${NC}"
sleep 30

# Verify services
echo ""
echo -e "${BLUE}════════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}Service Status:${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════════════${NC}"
docker-compose -f docker-compose.prod.yml ps

echo ""
echo -e "${YELLOW}🔍 Checking service health...${NC}"
SERVICES=("auth-service" "business-service" "party-service" "inventory-service" "invoice-service" "payment-service" "web-app")

for service in "${SERVICES[@]}"; do
    container_name="business-${service//-service/}"
    if docker ps | grep -q "$container_name"; then
        if docker logs "$container_name" 2>&1 | tail -20 | grep -q -E "(successfully started|listening|ready)" || \
           docker logs "$container_name" 2>&1 | tail -20 | grep -q "Nest application successfully started"; then
            echo -e "   ${GREEN}✓${NC} ${service} is running"
        elif docker logs "$container_name" 2>&1 | tail -20 | grep -q "password authentication failed"; then
            echo -e "   ${RED}✗${NC} ${service} has password authentication issues"
        else
            echo -e "   ${YELLOW}⏳${NC} ${service} is starting..."
        fi
    else
        echo -e "   ${RED}✗${NC} ${service} container not running"
    fi
done

echo ""
echo -e "${GREEN}════════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}✅ REDEPLOYMENT COMPLETE!${NC}"
echo -e "${GREEN}════════════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "${YELLOW}📝 Summary:${NC}"
echo -e "   • New Password: ${NEW_PASSWORD}"
echo -e "   • All services rebuilt and restarted"
echo -e "   • Environment file: ${ENV_FILE}"
echo -e "   • Backup saved: ${ENV_FILE}.backup.*"
echo ""
echo -e "${YELLOW}💡 To check logs:${NC}"
echo -e "   docker-compose -f docker-compose.prod.yml logs -f [service-name]"
echo ""
echo -e "${YELLOW}💡 To view all logs:${NC}"
echo -e "   docker-compose -f docker-compose.prod.yml logs --tail=50"
echo ""

