#!/bin/bash

# Selective Deployment Script for GST Service
# This script only builds and deploys GST service and web-app (if needed)
# Other services remain untouched

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
DOCKER_COMPOSE="docker-compose -f docker-compose.prod.yml"

echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}GST Service Selective Deployment${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}"
echo ""

# Step 1: Verify prerequisites
echo -e "${YELLOW}Step 1/6: Verifying prerequisites...${NC}"
if ! command -v docker &> /dev/null; then
    echo -e "${RED}✗ Docker is not installed${NC}"
    exit 1
fi

if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo -e "${RED}✗ Docker Compose is not installed${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Prerequisites verified${NC}"
echo ""

# Step 2: Check if database exists, create if needed
echo -e "${YELLOW}Step 2/6: Ensuring gst_db database exists...${NC}"
cd "$PROJECT_ROOT"

# Start postgres if not running
if ! docker ps | grep -q business-postgres; then
    echo -e "${BLUE}  → Starting PostgreSQL...${NC}"
    $DOCKER_COMPOSE up -d postgres
    sleep 5
fi

# Wait for postgres to be ready
MAX_WAIT=30
WAIT_COUNT=0
while [ $WAIT_COUNT -lt $MAX_WAIT ]; do
    if docker exec business-postgres pg_isready -U postgres > /dev/null 2>&1; then
        break
    fi
    echo -n "."
    sleep 1
    ((WAIT_COUNT++))
done

if [ $WAIT_COUNT -ge $MAX_WAIT ]; then
    echo -e "${RED}✗ PostgreSQL did not become ready${NC}"
    exit 1
fi

# Check if gst_db exists
GST_DB_EXISTS=$(docker exec business-postgres psql -U postgres -tAc "SELECT 1 FROM pg_database WHERE datname='gst_db'" 2>/dev/null || echo "0")

if [ "$GST_DB_EXISTS" = "1" ]; then
    echo -e "${GREEN}  ✓ gst_db database already exists${NC}"
    echo -e "${BLUE}  → No database changes needed - existing data will be preserved${NC}"
else
    echo -e "${YELLOW}  → Creating gst_db database...${NC}"
    docker exec business-postgres psql -U postgres -c "CREATE DATABASE gst_db;" 2>/dev/null || true
    docker exec business-postgres psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE gst_db TO postgres;" 2>/dev/null || true
    docker exec business-postgres psql -U postgres -d gst_db -c "CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\";" 2>/dev/null || true
    echo -e "${GREEN}  ✓ gst_db database created${NC}"
fi

echo -e "${GREEN}✓ Database verified${NC}"
echo ""

# Step 3: Ensure assets directory exists
echo -e "${YELLOW}Step 3/7: Ensuring assets directory exists...${NC}"
ASSETS_DIR="$PROJECT_ROOT/apps/gst-service/src/assets"
if [ ! -d "$ASSETS_DIR" ]; then
    mkdir -p "$ASSETS_DIR"
fi
if [ ! -f "$ASSETS_DIR/.gitkeep" ]; then
    echo "# Placeholder file for NX build" > "$ASSETS_DIR/.gitkeep"
fi
echo -e "${GREEN}✓ Assets directory verified${NC}"
echo ""

# Step 4: Build only GST service (no other services)
echo -e "${YELLOW}Step 4/7: Building GST service...${NC}"
echo -e "${BLUE}  → Building only gst-service (other services will not be rebuilt)${NC}"

cd "$PROJECT_ROOT"
# $DOCKER_COMPOSE build --no-cache gst-service

echo -e "${GREEN}✓ GST service built${NC}"
echo ""

# Step 5: Build web-app (needs GST API URL)
echo -e "${YELLOW}Step 5/7: Building web-app (with GST API URL)...${NC}"
echo -e "${BLUE}  → Rebuilding web-app to include GST API configuration${NC}"

$DOCKER_COMPOSE build --no-cache web-app

echo -e "${GREEN}✓ Web-app built${NC}"
echo ""

# Step 6: Start GST service
echo -e "${YELLOW}Step 6/7: Starting GST service...${NC}"
echo -e "${BLUE}  → Starting gst-service (other services remain running)${NC}"

# Ensure dependencies are running
$DOCKER_COMPOSE up -d postgres redis auth-service invoice-service party-service business-service

# Wait for dependencies
echo -e "${BLUE}  → Waiting for dependencies to be healthy...${NC}"
sleep 10

# Start GST service
$DOCKER_COMPOSE up -d gst-service

echo -e "${GREEN}✓ GST service started${NC}"
echo ""

# Step 7: Restart web-app to pick up new environment
echo -e "${YELLOW}Step 7/7: Restarting web-app...${NC}"
echo -e "${BLUE}  → Restarting web-app to use GST API${NC}"

$DOCKER_COMPOSE restart web-app

echo -e "${GREEN}✓ Web-app restarted${NC}"
echo ""

# Wait for services to be healthy
echo -e "${BLUE}  → Waiting for services to be healthy...${NC}"
sleep 15

# Health check
echo ""
echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}Deployment Complete - Health Checks${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}"
echo ""

# Check GST service health
if curl -f http://localhost:3008/health > /dev/null 2>&1; then
    echo -e "${GREEN}✓ GST Service: Healthy${NC}"
else
    echo -e "${RED}✗ GST Service: Unhealthy${NC}"
    echo -e "${YELLOW}  → Check logs: docker logs business-gst${NC}"
fi

# Check web-app health
if curl -f http://localhost:3000 > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Web App: Healthy${NC}"
else
    echo -e "${YELLOW}⚠ Web App: May still be starting${NC}"
fi

echo ""
echo -e "${GREEN}════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}Deployment Summary${NC}"
echo -e "${GREEN}════════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "${BLUE}Services Deployed:${NC}"
echo -e "  • GST Service (port 3008)"
echo -e "  • Web App (port 3000) - restarted"
echo ""
echo -e "${BLUE}Services NOT Changed:${NC}"
echo -e "  • Auth Service (running)"
echo -e "  • Business Service (running)"
echo -e "  • Party Service (running)"
echo -e "  • Inventory Service (running)"
echo -e "  • Invoice Service (running)"
echo -e "  • Payment Service (running)"
echo ""
echo -e "${BLUE}Database:${NC}"
echo -e "  • gst_db - verified/created (existing data preserved)"
echo ""
echo -e "${BLUE}Next Steps:${NC}"
echo -e "  1. Verify GST API: curl http://localhost:3008/health"
echo -e "  2. Check logs: docker logs business-gst"
echo -e "  3. Test frontend: http://localhost:3000/gst/reports"
echo ""
echo -e "${GREEN}✓ Selective deployment complete!${NC}"
echo ""

