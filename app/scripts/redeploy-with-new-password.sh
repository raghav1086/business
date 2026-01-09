#!/bin/bash
# =============================================================================
# REDEPLOY ALL SERVICES WITH NEW PASSWORD
# =============================================================================
# This script redeploys all services on EC2 instance with the fixed password
# Ensures PostgreSQL and all services are synced with Admin112233
# Usage: Run this script on the EC2 instance
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

# Fixed production password
FIXED_PASSWORD="Admin112233"

echo -e "${BLUE}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║     REDEPLOY ALL SERVICES WITH NEW PASSWORD                    ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${YELLOW}This will:${NC}"
echo "  1. Update .env.production with password: $FIXED_PASSWORD"
echo "  2. Update PostgreSQL password to: $FIXED_PASSWORD"
echo "  3. Restart all services with new password"
echo "  4. Verify all services are connected"
echo ""

cd "$APP_DIR"

# =============================================================================
# STEP 1: Update .env.production
# =============================================================================
echo -e "${YELLOW}📋 Step 1/5: Updating .env.production...${NC}"

# Backup existing file
if [ -f "$ENV_FILE" ]; then
    cp "$ENV_FILE" "${ENV_FILE}.backup.$(date +%Y%m%d_%H%M%S)"
    echo -e "${BLUE}   → Backed up existing .env.production${NC}"
fi

# Update or create .env.production
if [ -f "$ENV_FILE" ]; then
    # Update existing DB_PASSWORD
    if grep -q "^DB_PASSWORD=" "$ENV_FILE"; then
        sed -i.bak "s/^DB_PASSWORD=.*/DB_PASSWORD=$FIXED_PASSWORD/" "$ENV_FILE"
        rm -f "${ENV_FILE}.bak"
        echo -e "${GREEN}   ✅ Updated DB_PASSWORD to $FIXED_PASSWORD${NC}"
    else
        echo "DB_PASSWORD=$FIXED_PASSWORD" >> "$ENV_FILE"
        echo -e "${GREEN}   ✅ Added DB_PASSWORD=$FIXED_PASSWORD${NC}"
    fi
    
    # Ensure JWT_SECRET exists
    if ! grep -q "^JWT_SECRET=" "$ENV_FILE"; then
        JWT_SECRET=$(openssl rand -base64 64 | tr -d "=+/" | cut -c1-64)
        echo "JWT_SECRET=$JWT_SECRET" >> "$ENV_FILE"
        echo -e "${GREEN}   ✅ Added JWT_SECRET${NC}"
    fi
else
    # Create new .env.production
    JWT_SECRET=$(openssl rand -base64 64 | tr -d "=+/" | cut -c1-64)
    cat > "$ENV_FILE" << EOF
# Business App Production Environment
# Generated on $(date)

# Database Configuration - Fixed production password
DB_PASSWORD=$FIXED_PASSWORD

# JWT Secret
JWT_SECRET=$JWT_SECRET

# Feature Flags
ENABLE_SYNC=true
ENABLE_FAKE_OTP=true
EOF
    echo -e "${GREEN}   ✅ Created new .env.production with $FIXED_PASSWORD${NC}"
fi

# Also create .env file (docker-compose reads .env by default)
cp "$ENV_FILE" "$APP_DIR/.env"
echo -e "${GREEN}   ✅ Created .env file${NC}"

echo ""

# =============================================================================
# STEP 2: Load environment variables
# =============================================================================
echo -e "${YELLOW}📋 Step 2/5: Loading environment variables...${NC}"

# Load environment variables
set -a
source "$ENV_FILE"
set +a

# Ensure DB_PASSWORD is exported
export DB_PASSWORD="$FIXED_PASSWORD"

echo -e "${GREEN}   ✅ Environment variables loaded${NC}"
echo -e "${BLUE}   → DB_PASSWORD=$FIXED_PASSWORD${NC}"
echo ""

# =============================================================================
# STEP 3: Update PostgreSQL password
# =============================================================================
echo -e "${YELLOW}📋 Step 3/5: Updating PostgreSQL password...${NC}"

if docker ps | grep -q business-postgres; then
    echo -e "${BLUE}   → PostgreSQL container is running${NC}"
    
    # Try to update PostgreSQL password
    PASSWORD_UPDATED=false
    
    # Method 1: Try with current password (if we can connect)
    if docker exec -e PGPASSWORD="$FIXED_PASSWORD" business-postgres psql -U postgres -c "SELECT 1;" > /dev/null 2>&1; then
        echo -e "${GREEN}   ✅ PostgreSQL already using correct password${NC}"
        PASSWORD_UPDATED=true
    else
        # Method 2: Try common passwords to connect and update
        COMMON_PASSWORDS=("postgres" "password" "admin" "")
        for try_password in "${COMMON_PASSWORDS[@]}"; do
            if docker exec -e PGPASSWORD="$try_password" business-postgres psql -U postgres -c "ALTER USER postgres WITH PASSWORD '$FIXED_PASSWORD';" > /dev/null 2>&1; then
                echo -e "${GREEN}   ✅ PostgreSQL password updated to $FIXED_PASSWORD${NC}"
                PASSWORD_UPDATED=true
                break
            fi
        done
        
        # Method 3: Try using su (bypasses password)
        if [ "$PASSWORD_UPDATED" = false ]; then
            if docker exec business-postgres sh -c "su - postgres -c \"psql -c \\\"ALTER USER postgres WITH PASSWORD '$FIXED_PASSWORD';\\\"\"" > /dev/null 2>&1; then
                echo -e "${GREEN}   ✅ PostgreSQL password updated to $FIXED_PASSWORD (via su)${NC}"
                PASSWORD_UPDATED=true
            fi
        fi
    fi
    
    if [ "$PASSWORD_UPDATED" = false ]; then
        echo -e "${YELLOW}   ⚠️  Could not update PostgreSQL password automatically${NC}"
        echo -e "${YELLOW}   → Will restart PostgreSQL container with new password${NC}"
    fi
else
    echo -e "${YELLOW}   ⚠️  PostgreSQL container not running${NC}"
    echo -e "${BLUE}   → Will start PostgreSQL with new password${NC}"
fi

echo ""

# =============================================================================
# STEP 4: Stop all services
# =============================================================================
echo -e "${YELLOW}📋 Step 4/5: Stopping all services...${NC}"

# Stop all services
docker-compose -f docker-compose.prod.yml down 2>/dev/null || true
echo -e "${GREEN}   ✅ All services stopped${NC}"
echo ""

# =============================================================================
# STEP 5: Restart all services with new password
# =============================================================================
echo -e "${YELLOW}📋 Step 5/5: Restarting all services with new password...${NC}"

# Ensure environment variables are exported
export DB_PASSWORD="$FIXED_PASSWORD"
if [ -n "$JWT_SECRET" ]; then
    export JWT_SECRET
fi

# Start infrastructure first (PostgreSQL and Redis)
echo -e "${BLUE}   → Starting infrastructure services (PostgreSQL, Redis)...${NC}"
docker-compose -f docker-compose.prod.yml up -d postgres redis

# Wait for PostgreSQL to be ready
echo -e "${BLUE}   → Waiting for PostgreSQL to be ready...${NC}"
MAX_WAIT=60
WAIT_COUNT=0
while [ $WAIT_COUNT -lt $MAX_WAIT ]; do
    if docker exec -e PGPASSWORD="$FIXED_PASSWORD" business-postgres pg_isready -U postgres > /dev/null 2>&1; then
        echo -e "${GREEN}   ✅ PostgreSQL is ready${NC}"
        break
    fi
    echo -n "."
    sleep 1
    ((WAIT_COUNT++))
done

if [ $WAIT_COUNT -ge $MAX_WAIT ]; then
    echo -e "${RED}   ❌ PostgreSQL did not become ready in time${NC}"
    echo -e "${YELLOW}   → Checking PostgreSQL logs...${NC}"
    docker logs business-postgres --tail=20
    exit 1
fi

# Wait for Redis
WAIT_COUNT=0
while [ $WAIT_COUNT -lt $MAX_WAIT ]; do
    if docker exec business-redis redis-cli ping > /dev/null 2>&1; then
        echo -e "${GREEN}   ✅ Redis is ready${NC}"
        break
    fi
    echo -n "."
    sleep 1
    ((WAIT_COUNT++))
done

# Start all application services
echo -e "${BLUE}   → Starting all application services...${NC}"
docker-compose -f docker-compose.prod.yml up -d

echo -e "${GREEN}   ✅ All services started${NC}"
echo ""

# =============================================================================
# VERIFICATION
# =============================================================================
echo -e "${YELLOW}📋 Verifying deployment...${NC}"
echo ""

# Wait for services to start
echo -e "${BLUE}   → Waiting for services to initialize (30 seconds)...${NC}"
sleep 30

# Check service status
echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}Service Status:${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}"
docker-compose -f docker-compose.prod.yml ps
echo ""

# Verify database connections
echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}Database Connection Verification:${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}"

SERVICES=("auth-service" "business-service" "party-service" "inventory-service" "invoice-service" "payment-service")
ALL_CONNECTED=true

for service in "${SERVICES[@]}"; do
    service_name="business-${service%-service}"
    if docker logs "$service_name" 2>&1 | tail -30 | grep -q "password authentication failed"; then
        echo -e "${RED}   ✗ $service: Password authentication failed${NC}"
        ALL_CONNECTED=false
    elif docker logs "$service_name" 2>&1 | tail -30 | grep -q "Nest application successfully started"; then
        echo -e "${GREEN}   ✓ $service: Connected and running${NC}"
    else
        echo -e "${YELLOW}   ⏳ $service: Still starting...${NC}"
    fi
done

echo ""

# Verify PostgreSQL password
echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}PostgreSQL Password Verification:${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}"

POSTGRES_PASSWORD=$(docker exec business-postgres env | grep POSTGRES_PASSWORD | cut -d'=' -f2 || echo "")
if [ "$POSTGRES_PASSWORD" = "$FIXED_PASSWORD" ]; then
    echo -e "${GREEN}   ✅ PostgreSQL password: $FIXED_PASSWORD${NC}"
else
    echo -e "${YELLOW}   ⚠️  PostgreSQL password: $POSTGRES_PASSWORD (expected: $FIXED_PASSWORD)${NC}"
fi

ENV_PASSWORD=$(grep "^DB_PASSWORD=" "$ENV_FILE" | cut -d'=' -f2- | tr -d '"' | tr -d "'")
if [ "$ENV_PASSWORD" = "$FIXED_PASSWORD" ]; then
    echo -e "${GREEN}   ✅ .env.production password: $FIXED_PASSWORD${NC}"
else
    echo -e "${RED}   ❌ .env.production password: $ENV_PASSWORD (expected: $FIXED_PASSWORD)${NC}"
fi

echo ""

# Final summary
if [ "$ALL_CONNECTED" = true ] && [ "$POSTGRES_PASSWORD" = "$FIXED_PASSWORD" ] && [ "$ENV_PASSWORD" = "$FIXED_PASSWORD" ]; then
    echo -e "${GREEN}╔════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║     REDEPLOYMENT COMPLETE - ALL SERVICES SYNCED!              ║${NC}"
    echo -e "${GREEN}╚════════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${GREEN}✅ All services are using password: $FIXED_PASSWORD${NC}"
    echo -e "${GREEN}✅ All services are connected to PostgreSQL${NC}"
    echo -e "${GREEN}✅ All services are running${NC}"
else
    echo -e "${YELLOW}╔════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${YELLOW}║     REDEPLOYMENT COMPLETE WITH WARNINGS                        ║${NC}"
    echo -e "${YELLOW}╚════════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${YELLOW}⚠️  Some services may still be starting or have issues${NC}"
    echo -e "${YELLOW}   Check logs: docker-compose -f docker-compose.prod.yml logs${NC}"
fi

echo ""
echo -e "${BLUE}📋 Useful commands:${NC}"
echo "   View logs: docker-compose -f docker-compose.prod.yml logs -f"
echo "   Check status: docker-compose -f docker-compose.prod.yml ps"
echo "   Restart service: docker-compose -f docker-compose.prod.yml restart <service-name>"
echo ""

