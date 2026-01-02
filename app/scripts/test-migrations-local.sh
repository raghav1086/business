#!/bin/bash

# Local Docker Migration Test Script
# This script starts Docker containers and runs migrations for local testing
# Usage: ./test-migrations-local.sh

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║     Local Docker Migration Test Script                   ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Check if docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}Error: Docker is not installed or not in PATH${NC}"
    echo "Install Docker: https://docs.docker.com/get-docker/"
    exit 1
fi

# Check if docker-compose is installed
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo -e "${RED}Error: docker-compose is not installed${NC}"
    exit 1
fi

# Use docker compose (v2) if available, otherwise docker-compose (v1)
if docker compose version &> /dev/null; then
    DOCKER_COMPOSE="docker compose"
else
    DOCKER_COMPOSE="docker-compose"
fi

# Check if docker-compose.yml exists
if [ ! -f "$PROJECT_ROOT/docker-compose.yml" ]; then
    echo -e "${YELLOW}Warning: docker-compose.yml not found. Creating a basic one...${NC}"
    cat > "$PROJECT_ROOT/docker-compose.yml" << 'EOF'
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    container_name: business_db
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: business_db
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      timeout: 5s
      retries: 5

volumes:
  postgres_data:
EOF
    echo -e "${GREEN}✓ Created docker-compose.yml${NC}"
fi

# Start Docker containers
echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}Starting Docker containers...${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}"

cd "$PROJECT_ROOT"

if $DOCKER_COMPOSE up -d; then
    echo -e "${GREEN}✓ Docker containers started${NC}"
else
    echo -e "${RED}✗ Failed to start Docker containers${NC}"
    exit 1
fi

# Wait for PostgreSQL to be ready
echo ""
echo -e "${YELLOW}Waiting for PostgreSQL to be ready...${NC}"
MAX_WAIT=60
WAIT_COUNT=0
CONTAINER_NAME="business-postgres"

while [ $WAIT_COUNT -lt $MAX_WAIT ]; do
    if docker exec $CONTAINER_NAME pg_isready -U postgres > /dev/null 2>&1; then
        echo -e "${GREEN}✓ PostgreSQL is ready${NC}"
        break
    fi
    echo -n "."
    sleep 1
    ((WAIT_COUNT++))
done

if [ $WAIT_COUNT -ge $MAX_WAIT ]; then
    echo -e "${RED}✗ PostgreSQL did not become ready in time${NC}"
    echo "Check container logs: docker logs $CONTAINER_NAME"
    exit 1
fi

# Create business_db if it doesn't exist (migrations run on business_db)
echo -e "${YELLOW}Ensuring business_db database exists...${NC}"
docker exec $CONTAINER_NAME psql -U postgres -tc "SELECT 1 FROM pg_database WHERE datname = 'business_db'" | grep -q 1 || \
docker exec $CONTAINER_NAME psql -U postgres -c "CREATE DATABASE business_db;" > /dev/null 2>&1

if docker exec $CONTAINER_NAME psql -U postgres -d business_db -c "SELECT 1;" > /dev/null 2>&1; then
    echo -e "${GREEN}✓ business_db database ready${NC}"
else
    echo -e "${RED}✗ Failed to create/access business_db${NC}"
    exit 1
fi

# Give it a moment to fully initialize
sleep 2

# Run migrations
echo ""
echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}Running migrations...${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}"
echo ""

cd "$SCRIPT_DIR"

# Run the setup script with Docker database connection
./setup-migrations.sh localhost 5432 business_db postgres postgres

MIGRATION_EXIT_CODE=$?

echo ""
echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}"

if [ $MIGRATION_EXIT_CODE -eq 0 ]; then
    echo -e "${GREEN}✓ All migrations completed successfully!${NC}"
    echo ""
    echo -e "${YELLOW}Next steps:${NC}"
    echo "  1. Test your application connection to the database"
    echo "  2. Verify existing users can log in"
    echo "  3. Test superadmin login (phone: 9175760649, OTP: 760649)"
    echo ""
    echo -e "${YELLOW}To stop Docker containers:${NC}"
    echo "  cd $PROJECT_ROOT && $DOCKER_COMPOSE down"
    echo ""
    echo -e "${YELLOW}To view database:${NC}"
    echo "  docker exec -it business-postgres psql -U postgres -d business_db"
    echo ""
    exit 0
else
    echo -e "${RED}✗ Migration failed${NC}"
    echo ""
    echo -e "${YELLOW}To check container logs:${NC}"
    echo "  docker logs business-postgres"
    echo ""
    echo -e "${YELLOW}To stop Docker containers:${NC}"
    echo "  cd $PROJECT_ROOT && $DOCKER_COMPOSE down"
    echo ""
    exit 1
fi

