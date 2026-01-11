#!/bin/bash

# Docker Cleanup Script for EC2
# This script cleans up Docker to free disk space

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║     DOCKER CLEANUP - FREE DISK SPACE                         ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Step 1: Check current disk usage
echo -e "${YELLOW}Step 1: Checking disk usage...${NC}"
df -h /
echo ""



# Step 7: Remove build cache
echo -e "${YELLOW}Step 2: Removing build cache...${NC}"
docker builder prune -a -f
echo -e "${GREEN}✓ Build cache removed${NC}"
echo ""


# Step 9: Check disk usage after cleanup
echo -e "${YELLOW}Step 3: Checking disk usage after cleanup...${NC}"
df -h /
echo ""
docker system df
echo ""

echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║     CLEANUP COMPLETE!                                         ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"

