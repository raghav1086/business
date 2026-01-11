#!/bin/bash

# =============================================================================
# Start All Services Locally (DB and Redis from Docker)
# =============================================================================
# This script starts all microservices locally while using Docker
# only for PostgreSQL and Redis.
# =============================================================================

set -e

# Colors
BLUE='\033[0;34m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Get the directory of this script
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

cd "$APP_DIR"

echo -e "${BLUE}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║     STARTING ALL SERVICES LOCALLY (DB & Redis from Docker)    ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Step 1: Start Docker services (PostgreSQL and Redis only)
echo -e "${YELLOW}Step 1/6: Starting Docker services (PostgreSQL & Redis)...${NC}"
docker-compose up -d postgres redis
echo -e "${GREEN}✅ Docker services started${NC}"
echo ""

# Step 2: Wait for databases
echo -e "${YELLOW}Step 2/6: Waiting for databases to be ready...${NC}"
sleep 5

# Check PostgreSQL
until docker exec business-postgres pg_isready -U postgres > /dev/null 2>&1; do
  echo "  Waiting for PostgreSQL..."
  sleep 1
done
echo -e "${GREEN}✅ PostgreSQL is ready${NC}"

# Check Redis
until docker exec business-redis redis-cli ping > /dev/null 2>&1; do
  echo "  Waiting for Redis..."
  sleep 1
done
echo -e "${GREEN}✅ Redis is ready${NC}"
echo ""

# Step 3: Initialize databases
echo -e "${YELLOW}Step 3/6: Initializing databases...${NC}"
docker exec -i business-postgres psql -U postgres -c "SELECT 1 FROM pg_database WHERE datname='auth_db'" | grep -q 1 || \
  docker exec -i business-postgres psql -U postgres -f /docker-entrypoint-initdb.d/init-db.sql 2>/dev/null || true
echo -e "${GREEN}✅ Databases initialized${NC}"
echo ""

# Step 4: Run migrations
echo -e "${YELLOW}Step 4/6: Running RBAC migrations...${NC}"
bash scripts/run-rbac-migrations.sh localhost 5432 postgres postgres 2>/dev/null || \
  (echo -e "${YELLOW}⚠️  Migrations skipped (may already be applied)${NC}" && sleep 1)
echo -e "${GREEN}✅ Migrations complete${NC}"
echo ""

# Step 5: Kill any existing service processes
echo -e "${YELLOW}Step 5/6: Cleaning up existing processes...${NC}"
pkill -f "nx serve" || true
pkill -f "nest start" || true
sleep 2
echo -e "${GREEN}✅ Cleanup complete${NC}"
echo ""

# Step 6: Start all services
echo -e "${YELLOW}Step 6/6: Starting all services locally...${NC}"
echo ""

# Create logs directory
mkdir -p logs

# Function to start a service
start_service() {
  local service_name=$1
  local port=$2
  local log_file="logs/${service_name}.log"
  
  echo -e "${BLUE}Starting ${service_name} on port ${port}...${NC}"
  
  # Set environment variables for local development
  export NODE_ENV=development
  export PORT=${port}
  export DB_HOST=localhost
  export DB_PORT=5432
  export DB_USERNAME=postgres
  export DB_PASSWORD=postgres
  export REDIS_HOST=localhost
  export REDIS_PORT=6379
  export JWT_SECRET=super-secret-jwt-key-for-development
  export ENABLE_FAKE_OTP=true
  
  # Service-specific environment variables
  case $service_name in
    auth-service)
      export AUTH_DB_NAME=auth_db
      ;;
    business-service)
      export BUSINESS_DB_NAME=business_db
      export AUTH_SERVICE_URL=http://localhost:3002
      ;;
    party-service)
      export PARTY_DB_NAME=party_db
      export AUTH_SERVICE_URL=http://localhost:3002
      ;;
    inventory-service)
      export INVENTORY_DB_NAME=inventory_db
      export AUTH_SERVICE_URL=http://localhost:3002
      ;;
    invoice-service)
      export INVOICE_DB_NAME=invoice_db
      export AUTH_SERVICE_URL=http://localhost:3002
      ;;
    payment-service)
      export PAYMENT_DB_NAME=payment_db
      export AUTH_SERVICE_URL=http://localhost:3002
      ;;
    gst-service)
      export GST_DB_NAME=gst_db
      export AUTH_SERVICE_URL=http://localhost:3002
      export INVOICE_SERVICE_URL=http://localhost:3006
      export PARTY_SERVICE_URL=http://localhost:3004
      export BUSINESS_SERVICE_URL=http://localhost:3003
      ;;
  esac
  
  # Start service in background and log output
  npx nx serve ${service_name} > "${log_file}" 2>&1 &
  local pid=$!
  echo $pid > "logs/${service_name}.pid"
  echo -e "${GREEN}✅ ${service_name} started (PID: ${pid}, Log: ${log_file})${NC}"
}

# Start all services
start_service auth-service 3002
sleep 2

start_service business-service 3003
sleep 2

start_service party-service 3004
sleep 2

start_service inventory-service 3005
sleep 2

start_service invoice-service 3006
sleep 2

start_service payment-service 3007
sleep 2

start_service gst-service 3008
sleep 3

echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║     ALL SERVICES STARTED SUCCESSFULLY                         ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BLUE}Service URLs:${NC}"
echo -e "  ${GREEN}Auth Service:${NC}     http://localhost:3002"
echo -e "  ${GREEN}Business Service:${NC}  http://localhost:3003"
echo -e "  ${GREEN}Party Service:${NC}     http://localhost:3004"
echo -e "  ${GREEN}Inventory Service:${NC} http://localhost:3005"
echo -e "  ${GREEN}Invoice Service:${NC}   http://localhost:3006"
echo -e "  ${GREEN}Payment Service:${NC}    http://localhost:3007"
echo -e "  ${GREEN}GST Service:${NC}       http://localhost:3008"
echo ""
echo -e "${BLUE}Logs:${NC}"
echo -e "  All service logs are in ${YELLOW}logs/${NC} directory"
echo ""
echo -e "${BLUE}To stop all services:${NC}"
echo -e "  ${YELLOW}make dev-stop${NC} or ${YELLOW}bash scripts/stop-local-services.sh${NC}"
echo ""
echo -e "${YELLOW}Waiting 10 seconds for services to initialize...${NC}"
sleep 10

# Health check
echo ""
echo -e "${BLUE}Health Check:${NC}"
echo "──────────────────────────────────────"
for port in 3002 3003 3004 3005 3006 3007 3008; do
  service_name=""
  case $port in
    3002) service_name="Auth Service     " ;;
    3003) service_name="Business Service " ;;
    3004) service_name="Party Service    " ;;
    3005) service_name="Inventory Service" ;;
    3006) service_name="Invoice Service  " ;;
    3007) service_name="Payment Service  " ;;
    3008) service_name="GST Service      " ;;
  esac
  
  if curl -s http://localhost:${port}/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ ${service_name} (${port})${NC}"
  else
    echo -e "${RED}❌ ${service_name} (${port})${NC}"
  fi
done
echo "──────────────────────────────────────"
echo ""

echo -e "${GREEN}✅ Setup complete!${NC}"

