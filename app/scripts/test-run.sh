#!/bin/bash

# Test Runner Script
# Runs all tests with proper setup

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

# Parse arguments
TEST_TYPE=${1:-all}
COVERAGE=${2:-false}

echo -e "${BLUE}🧪 Running Tests: ${TEST_TYPE}${NC}"
echo ""

# Run setup first
if [ "$TEST_TYPE" != "unit" ]; then
    echo -e "${YELLOW}Running test setup...${NC}"
    ./scripts/test-setup.sh
    echo ""
fi

# Run tests based on type
case $TEST_TYPE in
    unit)
        echo -e "${BLUE}Running unit tests...${NC}"
        if [ "$COVERAGE" = "true" ]; then
            npm run test:cov
        else
            npm run test:all
        fi
        ;;
    integration)
        echo -e "${BLUE}Running integration tests...${NC}"
        if [ "$COVERAGE" = "true" ]; then
            npm run test:integration:cov
        else
            npm run test:integration
        fi
        ;;
    e2e)
        echo -e "${BLUE}Running E2E tests...${NC}"
        npm run test:e2e
        ;;
    all)
        echo -e "${BLUE}Running all tests...${NC}"
        echo ""
        echo -e "${YELLOW}1. Unit Tests${NC}"
        npm run test:all
        echo ""
        echo -e "${YELLOW}2. Integration Tests${NC}"
        npm run test:integration
        echo ""
        echo -e "${YELLOW}3. E2E Tests${NC}"
        npm run test:e2e
        ;;
    *)
        echo -e "${RED}Invalid test type: ${TEST_TYPE}${NC}"
        echo "Usage: ./scripts/test-run.sh [unit|integration|e2e|all] [coverage]"
        exit 1
        ;;
esac

echo ""
echo -e "${GREEN}✅ Tests completed!${NC}"

