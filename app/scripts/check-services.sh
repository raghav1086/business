#!/bin/bash

# =============================================================================
# Service Status Check Script
# =============================================================================
# Checks the status of all services and provides troubleshooting info
# =============================================================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║     Service Status Check                                   ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Check Docker
echo -e "${YELLOW}1. Checking Docker...${NC}"
if command -v docker &> /dev/null; then
    echo -e "${GREEN}   ✓ Docker is installed${NC}"
    docker --version
else
    echo -e "${RED}   ✗ Docker is not installed${NC}"
    exit 1
fi
echo ""

# Check Docker Compose
echo -e "${YELLOW}2. Checking Docker Compose...${NC}"
if command -v docker-compose &> /dev/null || docker compose version &> /dev/null 2>&1; then
    echo -e "${GREEN}   ✓ Docker Compose is available${NC}"
    docker compose version 2>/dev/null || docker-compose --version
else
    echo -e "${RED}   ✗ Docker Compose is not installed${NC}"
    exit 1
fi
echo ""

# Check running containers
echo -e "${YELLOW}3. Checking running containers...${NC}"
CONTAINERS=(
    "business-postgres:PostgreSQL"
    "business-redis:Redis"
    "business-auth:Auth Service"
    "business-business:Business Service"
    "business-party:Party Service"
    "business-inventory:Inventory Service"
    "business-invoice:Invoice Service"
    "business-payment:Payment Service"
    "business-web-app:Web App"
)

RUNNING=0
STOPPED=0

for container_info in "${CONTAINERS[@]}"; do
    IFS=':' read -r container_name display_name <<< "$container_info"
    if docker ps --format '{{.Names}}' | grep -q "^${container_name}$"; then
        STATUS=$(docker inspect --format='{{.State.Status}}' "$container_name" 2>/dev/null || echo "unknown")
        HEALTH=$(docker inspect --format='{{.State.Health.Status}}' "$container_name" 2>/dev/null || echo "no-healthcheck")
        
        if [ "$STATUS" = "running" ]; then
            if [ "$HEALTH" = "healthy" ]; then
                echo -e "${GREEN}   ✓ $display_name: Running (healthy)${NC}"
            elif [ "$HEALTH" = "no-healthcheck" ]; then
                echo -e "${GREEN}   ✓ $display_name: Running${NC}"
            else
                echo -e "${YELLOW}   ⚠️  $display_name: Running (health: $HEALTH)${NC}"
            fi
            ((RUNNING++))
        else
            echo -e "${RED}   ✗ $display_name: $STATUS${NC}"
            ((STOPPED++))
        fi
    else
        echo -e "${RED}   ✗ $display_name: Not running${NC}"
        ((STOPPED++))
    fi
done
echo ""

# Check ports
echo -e "${YELLOW}4. Checking port accessibility...${NC}"
PORTS=(
    "3000:Web App"
    "3002:Auth Service"
    "3003:Business Service"
    "3004:Party Service"
    "3005:Inventory Service"
    "3006:Invoice Service"
    "3007:Payment Service"
    "5432:PostgreSQL"
    "6379:Redis"
)

for port_info in "${PORTS[@]}"; do
    IFS=':' read -r port display_name <<< "$port_info"
    if netstat -tuln 2>/dev/null | grep -q ":$port " || ss -tuln 2>/dev/null | grep -q ":$port "; then
        echo -e "${GREEN}   ✓ $display_name (port $port): Listening${NC}"
    else
        echo -e "${RED}   ✗ $display_name (port $port): Not listening${NC}"
    fi
done
echo ""

# Check service health endpoints
echo -e "${YELLOW}5. Checking service health endpoints...${NC}"
SERVICES=(
    "http://localhost:3002/health:Auth Service"
    "http://localhost:3003/health:Business Service"
    "http://localhost:3004/health:Party Service"
    "http://localhost:3005/health:Inventory Service"
    "http://localhost:3006/health:Invoice Service"
    "http://localhost:3007/health:Payment Service"
    "http://localhost:3000:Web App"
)

for service_info in "${SERVICES[@]}"; do
    IFS=':' read -r url display_name <<< "$service_info"
    if curl -s -f "$url" > /dev/null 2>&1; then
        echo -e "${GREEN}   ✓ $display_name: Healthy${NC}"
    else
        echo -e "${RED}   ✗ $display_name: Not responding${NC}"
    fi
done
echo ""

# Check PostgreSQL connection
echo -e "${YELLOW}6. Checking PostgreSQL connection...${NC}"
if docker exec business-postgres pg_isready -U postgres > /dev/null 2>&1; then
    echo -e "${GREEN}   ✓ PostgreSQL is ready${NC}"
    
    # Try to connect with password
    if docker exec -e PGPASSWORD=postgres business-postgres psql -U postgres -c "SELECT 1;" > /dev/null 2>&1; then
        echo -e "${GREEN}   ✓ PostgreSQL password authentication: OK${NC}"
    else
        echo -e "${RED}   ✗ PostgreSQL password authentication: FAILED${NC}"
        echo -e "${YELLOW}   → Run: bash scripts/fix-postgres-password.sh postgres${NC}"
    fi
else
    echo -e "${RED}   ✗ PostgreSQL is not ready${NC}"
fi
echo ""

# Check recent logs for errors
echo -e "${YELLOW}7. Checking recent errors in logs...${NC}"
ERROR_COUNT=0
for container_name in business-auth business-business business-party business-inventory business-invoice business-payment business-web-app; do
    if docker ps --format '{{.Names}}' | grep -q "^${container_name}$"; then
        ERRORS=$(docker logs "$container_name" --tail 50 2>&1 | grep -i "error\|fatal\|failed" | wc -l)
        if [ "$ERRORS" -gt 0 ]; then
            echo -e "${YELLOW}   ⚠️  $container_name: $ERRORS error(s) in last 50 lines${NC}"
            ((ERROR_COUNT++))
        fi
    fi
done

if [ $ERROR_COUNT -eq 0 ]; then
    echo -e "${GREEN}   ✓ No recent errors found${NC}"
fi
echo ""

# Summary
echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}Summary:${NC}"
echo -e "  Running containers: ${GREEN}$RUNNING${NC}"
echo -e "  Stopped containers: ${RED}$STOPPED${NC}"
echo ""

if [ $STOPPED -gt 0 ]; then
    echo -e "${YELLOW}⚠️  Some services are not running${NC}"
    echo -e "${YELLOW}→ To start all services:${NC}"
    echo -e "   ${BLUE}docker-compose -f docker-compose.prod.yml up -d${NC}"
    echo ""
fi

# Check public IP accessibility
echo -e "${YELLOW}8. Network accessibility...${NC}"
PUBLIC_IP=$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4 2>/dev/null || echo "unknown")
if [ "$PUBLIC_IP" != "unknown" ]; then
    echo -e "${BLUE}   Public IP: $PUBLIC_IP${NC}"
    echo -e "${YELLOW}   → Make sure security group allows:${NC}"
    echo -e "      - Port 3000 (HTTP) from 0.0.0.0/0"
    echo -e "      - Port 22 (SSH) from your IP"
    echo ""
    echo -e "${YELLOW}   → Test from your machine:${NC}"
    echo -e "      ${BLUE}curl http://$PUBLIC_IP:3000${NC}"
else
    echo -e "${YELLOW}   ⚠️  Could not detect public IP (may not be on EC2)${NC}"
fi
echo ""

echo -e "${GREEN}✅ Status check complete!${NC}"

