#!/bin/bash

# =============================================================================
# Verify Permissions Fix Script
# =============================================================================
# Checks if the CrossServiceBusinessContextGuard fix is deployed correctly
# =============================================================================

set +e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║     Verifying Permissions Fix                              ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Check if services are running
echo -e "${YELLOW}Step 1/3: Checking service status...${NC}"
SERVICES=("inventory-service" "invoice-service" "party-service" "payment-service")

for service in "${SERVICES[@]}"; do
    if docker ps --format '{{.Names}}' | grep -q "business-${service}"; then
        echo -e "${GREEN}  ✓ $service is running${NC}"
    else
        echo -e "${RED}  ✗ $service is NOT running${NC}"
    fi
done
echo ""

# Check logs for permission-related errors
echo -e "${YELLOW}Step 2/3: Checking recent logs for permission errors...${NC}"
for service in "${SERVICES[@]}"; do
    if docker ps --format '{{.Names}}' | grep -q "business-${service}"; then
        echo -e "${BLUE}  → Checking $service logs...${NC}"
        ERROR_COUNT=$(docker logs "business-${service}" --tail 50 2>&1 | grep -c "You do not have permission" || echo "0")
        if [ "$ERROR_COUNT" -gt 0 ]; then
            echo -e "${RED}    ✗ Found $ERROR_COUNT permission errors in recent logs${NC}"
        else
            echo -e "${GREEN}    ✓ No permission errors in recent logs${NC}"
        fi
        
        # Check for debug logs from our fix
        DEBUG_COUNT=$(docker logs "business-${service}" --tail 50 2>&1 | grep -c "CrossServiceBusinessContextGuard" || echo "0")
        if [ "$DEBUG_COUNT" -gt 0 ]; then
            echo -e "${GREEN}    ✓ Found debug logs (fix is active)${NC}"
        else
            echo -e "${YELLOW}    ⚠️  No debug logs found (may need restart)${NC}"
        fi
    fi
done
echo ""

# Check if shared library was built
echo -e "${YELLOW}Step 3/3: Verifying shared library build...${NC}"
if [ -d "dist/libs/shared" ]; then
    echo -e "${GREEN}  ✓ Shared library is built${NC}"
    if [ -f "dist/libs/shared/src/guards/cross-service-business-context.guard.js" ]; then
        echo -e "${GREEN}    ✓ Guard file exists${NC}"
        # Check if it contains our fix
        if grep -q "calculateEffectivePermissions" "dist/libs/shared/src/guards/cross-service-business-context.guard.js" 2>/dev/null; then
            echo -e "${GREEN}    ✓ Guard contains permission calculation${NC}"
        else
            echo -e "${RED}    ✗ Guard may not have the fix${NC}"
        fi
    else
        echo -e "${YELLOW}    ⚠️  Guard file not found in dist${NC}"
    fi
else
    echo -e "${YELLOW}  ⚠️  Shared library dist not found (may be in service-specific dist)${NC}"
fi
echo ""

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║     Verification Complete                                   ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${YELLOW}Next steps if issues persist:${NC}"
echo "  1. Rebuild services with --no-cache:"
echo "     ${BLUE}docker-compose -f docker-compose.prod.yml build --no-cache inventory-service invoice-service party-service payment-service${NC}"
echo "  2. Restart services:"
echo "     ${BLUE}docker-compose -f docker-compose.prod.yml restart inventory-service invoice-service party-service payment-service${NC}"
echo "  3. Check logs:"
echo "     ${BLUE}docker logs business-inventory-service --tail 100${NC}"
echo ""

