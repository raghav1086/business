#!/bin/bash

# Run All Tests Script
# Executes all test types and generates a summary report

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🧪 Running All Tests${NC}"
echo "================================"
echo ""

# Test results tracking
UNIT_TESTS_PASSED=true
INTEGRATION_TESTS_PASSED=true
E2E_TESTS_PASSED=true

# 1. Unit Tests
echo -e "${YELLOW}1. Running Unit Tests...${NC}"
echo "--------------------------------"
if npm run test:all > /tmp/unit-tests.log 2>&1; then
    echo -e "${GREEN}✅ Unit Tests: PASSED${NC}"
    echo ""
    tail -20 /tmp/unit-tests.log
else
    echo -e "${RED}❌ Unit Tests: FAILED${NC}"
    UNIT_TESTS_PASSED=false
    echo ""
    tail -50 /tmp/unit-tests.log
fi
echo ""

# 2. Integration Tests
echo -e "${YELLOW}2. Running Integration Tests...${NC}"
echo "--------------------------------"
if npm run test:integration > /tmp/integration-tests.log 2>&1; then
    echo -e "${GREEN}✅ Integration Tests: PASSED${NC}"
    echo ""
    tail -20 /tmp/integration-tests.log
else
    echo -e "${RED}❌ Integration Tests: FAILED${NC}"
    INTEGRATION_TESTS_PASSED=false
    echo ""
    tail -50 /tmp/integration-tests.log
fi
echo ""

# 3. E2E Tests
echo -e "${YELLOW}3. Running E2E Tests...${NC}"
echo "--------------------------------"
if npm run test:e2e > /tmp/e2e-tests.log 2>&1; then
    echo -e "${GREEN}✅ E2E Tests: PASSED${NC}"
    echo ""
    tail -20 /tmp/e2e-tests.log
else
    echo -e "${RED}❌ E2E Tests: FAILED${NC}"
    E2E_TESTS_PASSED=false
    echo ""
    tail -50 /tmp/e2e-tests.log
fi
echo ""

# Summary
echo "================================"
echo -e "${BLUE}📊 Test Summary${NC}"
echo "================================"
echo ""

if [ "$UNIT_TESTS_PASSED" = true ]; then
    echo -e "${GREEN}✅ Unit Tests: PASSED${NC}"
else
    echo -e "${RED}❌ Unit Tests: FAILED${NC}"
fi

if [ "$INTEGRATION_TESTS_PASSED" = true ]; then
    echo -e "${GREEN}✅ Integration Tests: PASSED${NC}"
else
    echo -e "${RED}❌ Integration Tests: FAILED${NC}"
fi

if [ "$E2E_TESTS_PASSED" = true ]; then
    echo -e "${GREEN}✅ E2E Tests: PASSED${NC}"
else
    echo -e "${RED}❌ E2E Tests: FAILED${NC}"
fi

echo ""

# Overall status
if [ "$UNIT_TESTS_PASSED" = true ] && [ "$INTEGRATION_TESTS_PASSED" = true ] && [ "$E2E_TESTS_PASSED" = true ]; then
    echo -e "${GREEN}🎉 All Tests Passed!${NC}"
    exit 0
else
    echo -e "${RED}⚠️  Some Tests Failed${NC}"
    echo ""
    echo "Check logs:"
    echo "  Unit Tests: /tmp/unit-tests.log"
    echo "  Integration Tests: /tmp/integration-tests.log"
    echo "  E2E Tests: /tmp/e2e-tests.log"
    exit 1
fi

