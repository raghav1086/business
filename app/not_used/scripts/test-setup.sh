#!/bin/bash

# Test Setup Script
# Automates test environment setup

set -e

echo "🚀 Setting up test environment..."

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if Docker is running
echo -e "${YELLOW}Checking Docker...${NC}"
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker is not running. Please start Docker and try again.${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Docker is running${NC}"

# Check if test database container exists
echo -e "${YELLOW}Checking test database...${NC}"
if docker ps -a | grep -q "business-postgres-test"; then
    echo -e "${YELLOW}Test database container exists${NC}"
    if docker ps | grep -q "business-postgres-test"; then
        echo -e "${GREEN}✅ Test database is running${NC}"
    else
        echo -e "${YELLOW}Starting test database...${NC}"
        docker start business-postgres-test
        sleep 3
        echo -e "${GREEN}✅ Test database started${NC}"
    fi
else
    echo -e "${YELLOW}Creating test database container...${NC}"
    docker run -d \
        --name business-postgres-test \
        -e POSTGRES_USER=test \
        -e POSTGRES_PASSWORD=test \
        -e POSTGRES_DB=business_test_db \
        -p 5433:5432 \
        postgres:15-alpine
    sleep 5
    echo -e "${GREEN}✅ Test database created and started${NC}"
fi

# Wait for database to be ready
echo -e "${YELLOW}Waiting for database to be ready...${NC}"
until docker exec business-postgres-test pg_isready -U test > /dev/null 2>&1; do
    echo -e "${YELLOW}Waiting for PostgreSQL...${NC}"
    sleep 2
done
echo -e "${GREEN}✅ Database is ready${NC}"

# Check if node_modules exists
echo -e "${YELLOW}Checking dependencies...${NC}"
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}Installing dependencies...${NC}"
    npm install
    echo -e "${GREEN}✅ Dependencies installed${NC}"
else
    echo -e "${GREEN}✅ Dependencies already installed${NC}"
fi

# Create .env.test if it doesn't exist
if [ ! -f ".env.test" ]; then
    echo -e "${YELLOW}Creating .env.test file...${NC}"
    cat > .env.test << EOF
# Test Database Configuration
TEST_DB_HOST=localhost
TEST_DB_PORT=5433
TEST_DB_USERNAME=test
TEST_DB_PASSWORD=test
TEST_DB_NAME=business_test_db

# Service Configuration
NODE_ENV=test
LOG_LEVEL=error

# Auth Service
JWT_SECRET=test-secret-key-for-testing-only
JWT_EXPIRES_IN=1h
REFRESH_TOKEN_EXPIRES_IN=7d
EOF
    echo -e "${GREEN}✅ .env.test created${NC}"
else
    echo -e "${GREEN}✅ .env.test already exists${NC}"
fi

echo ""
echo -e "${GREEN}✅ Test environment setup complete!${NC}"
echo ""
echo "Next steps:"
echo "  Run unit tests:        npm run test:all"
echo "  Run integration tests: npm run test:integration"
echo "  Run E2E tests:         npm run test:e2e"
echo ""

