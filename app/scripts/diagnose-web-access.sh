#!/bin/bash

# =============================================================================
# Web Access Diagnostic Script
# =============================================================================
# Diagnoses why the web app is not accessible from the public IP
# =============================================================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║     Web Access Diagnostic                                    ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Get public IP
PUBLIC_IP=$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4 2>/dev/null || echo "unknown")
echo -e "${YELLOW}Public IP: ${PUBLIC_IP}${NC}"
echo ""

# 1. Check if web-app container is running
echo -e "${YELLOW}1. Checking web-app container...${NC}"
if docker ps --format '{{.Names}}' | grep -q "^business-web-app$"; then
    STATUS=$(docker inspect --format='{{.State.Status}}' business-web-app 2>/dev/null)
    if [ "$STATUS" = "running" ]; then
        echo -e "${GREEN}   ✓ Web app container is running${NC}"
    else
        echo -e "${RED}   ✗ Web app container is $STATUS${NC}"
        echo -e "${YELLOW}   → Starting web app...${NC}"
        docker-compose -f docker-compose.prod.yml up -d web-app
        sleep 10
    fi
else
    echo -e "${RED}   ✗ Web app container is not running${NC}"
    echo -e "${YELLOW}   → Starting web app...${NC}"
    docker-compose -f docker-compose.prod.yml up -d web-app
    sleep 10
fi
echo ""

# 2. Check web-app logs
echo -e "${YELLOW}2. Checking web-app logs (last 30 lines)...${NC}"
docker logs business-web-app --tail 30 2>&1 | tail -20
echo ""

# 3. Check if port 3000 is listening locally
echo -e "${YELLOW}3. Checking if port 3000 is listening...${NC}"
if netstat -tuln 2>/dev/null | grep -q ":3000 " || ss -tuln 2>/dev/null | grep -q ":3000 "; then
    echo -e "${GREEN}   ✓ Port 3000 is listening${NC}"
    netstat -tuln 2>/dev/null | grep ":3000 " || ss -tuln 2>/dev/null | grep ":3000 "
else
    echo -e "${RED}   ✗ Port 3000 is not listening${NC}"
    echo -e "${YELLOW}   → Web app may not have started correctly${NC}"
fi
echo ""

# 4. Test local access
echo -e "${YELLOW}4. Testing local access (http://localhost:3000)...${NC}"
if curl -s -f http://localhost:3000 > /dev/null 2>&1; then
    echo -e "${GREEN}   ✓ Web app is accessible locally${NC}"
    LOCAL_ACCESS=true
else
    echo -e "${RED}   ✗ Web app is NOT accessible locally${NC}"
    echo -e "${YELLOW}   → Checking what's wrong...${NC}"
    LOCAL_ACCESS=false
    
    # Check if it's starting
    if docker logs business-web-app --tail 50 2>&1 | grep -qi "ready\|started\|listening"; then
        echo -e "${YELLOW}   → Web app appears to be starting, wait a moment...${NC}"
    else
        echo -e "${RED}   → Web app may have errors${NC}"
    fi
fi
echo ""

# 5. Check security group / firewall
echo -e "${YELLOW}5. Checking network configuration...${NC}"
echo -e "${BLUE}   → Make sure your EC2 security group allows:${NC}"
echo -e "      • Inbound: Port 3000 (HTTP) from 0.0.0.0/0"
echo -e "      • Inbound: Port 22 (SSH) from your IP"
echo ""

# Check if we can determine security group
if command -v aws &> /dev/null; then
    echo -e "${BLUE}   → Checking AWS security groups...${NC}"
    INSTANCE_ID=$(curl -s http://169.254.169.254/latest/meta-data/instance-id 2>/dev/null || echo "")
    if [ -n "$INSTANCE_ID" ]; then
        aws ec2 describe-instances --instance-ids "$INSTANCE_ID" --query 'Reservations[0].Instances[0].SecurityGroups[*].{Name:GroupName,Id:GroupId}' --output table 2>/dev/null || \
            echo -e "${YELLOW}   → Could not query security groups (AWS CLI may not be configured)${NC}"
    fi
fi
echo ""

# 6. Check if services are healthy
echo -e "${YELLOW}6. Checking service dependencies...${NC}"
SERVICES=(
    "business-postgres:PostgreSQL"
    "business-redis:Redis"
    "business-auth:Auth Service"
)

ALL_HEALTHY=true
for service_info in "${SERVICES[@]}"; do
    IFS=':' read -r container_name display_name <<< "$service_info"
    if docker ps --format '{{.Names}}' | grep -q "^${container_name}$"; then
        echo -e "${GREEN}   ✓ $display_name is running${NC}"
    else
        echo -e "${RED}   ✗ $display_name is not running${NC}"
        ALL_HEALTHY=false
    fi
done

if [ "$ALL_HEALTHY" = false ]; then
    echo -e "${YELLOW}   → Some dependencies are missing, web app may not work${NC}"
fi
echo ""

# 7. Test from outside (if possible)
echo -e "${YELLOW}7. Testing external access...${NC}"
if [ "$PUBLIC_IP" != "unknown" ]; then
    echo -e "${BLUE}   → Testing: http://${PUBLIC_IP}:3000${NC}"
    if curl -s -f --max-time 5 "http://${PUBLIC_IP}:3000" > /dev/null 2>&1; then
        echo -e "${GREEN}   ✓ Web app is accessible from public IP${NC}"
    else
        echo -e "${RED}   ✗ Web app is NOT accessible from public IP${NC}"
        echo -e "${YELLOW}   → This could be:${NC}"
        echo -e "      1. Security group not allowing port 3000"
        echo -e "      2. Web app not running/listening"
        echo -e "      3. Firewall blocking the port"
    fi
else
    echo -e "${YELLOW}   → Could not determine public IP${NC}"
fi
echo ""

# 8. Recommendations
echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}Recommendations:${NC}"
echo ""

if [ "$LOCAL_ACCESS" = false ]; then
    echo -e "${YELLOW}1. Fix local access first:${NC}"
    echo -e "   ${BLUE}docker logs business-web-app --tail 100${NC}"
    echo -e "   ${BLUE}docker-compose -f docker-compose.prod.yml restart web-app${NC}"
    echo ""
fi

echo -e "${YELLOW}2. Check AWS Security Group:${NC}"
echo -e "   • Go to EC2 Console → Security Groups"
echo -e "   • Find your instance's security group"
echo -e "   • Add inbound rule: Port 3000, Source: 0.0.0.0/0"
echo ""

echo -e "${YELLOW}3. Restart web app if needed:${NC}"
echo -e "   ${BLUE}docker-compose -f docker-compose.prod.yml restart web-app${NC}"
echo ""

echo -e "${YELLOW}4. Check all services:${NC}"
echo -e "   ${BLUE}make status${NC}"
echo ""

echo -e "${GREEN}✅ Diagnostic complete!${NC}"

