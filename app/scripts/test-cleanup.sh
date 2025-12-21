#!/bin/bash

# Test Cleanup Script
# Cleans up test environment

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${YELLOW}🧹 Cleaning up test environment...${NC}"

# Stop and remove test database container
if docker ps -a | grep -q "business-postgres-test"; then
    echo -e "${YELLOW}Stopping test database...${NC}"
    docker stop business-postgres-test 2>/dev/null || true
    echo -e "${YELLOW}Removing test database container...${NC}"
    docker rm business-postgres-test 2>/dev/null || true
    echo -e "${GREEN}✅ Test database removed${NC}"
else
    echo -e "${GREEN}✅ Test database container not found${NC}"
fi

# Clean coverage directories
if [ -d "coverage" ]; then
    echo -e "${YELLOW}Cleaning coverage reports...${NC}"
    rm -rf coverage
    echo -e "${GREEN}✅ Coverage reports cleaned${NC}"
fi

# Clean test database volumes (optional - uncomment if needed)
# echo -e "${YELLOW}Cleaning test database volumes...${NC}"
# docker volume rm business_postgres_test_data 2>/dev/null || true

echo ""
echo -e "${GREEN}✅ Cleanup complete!${NC}"

