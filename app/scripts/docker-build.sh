#!/bin/bash

# Docker Build Script for Business App Services
# Usage: ./scripts/docker-build.sh [service-name] [tag]
# Example: ./scripts/docker-build.sh auth-service latest
# Example: ./scripts/docker-build.sh all latest

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
REGISTRY="${DOCKER_REGISTRY:-docker.io}"
IMAGE_PREFIX="${IMAGE_PREFIX:-business-app}"
TAG="${2:-latest}"
SERVICE_NAME="${1:-all}"

# List of all services
SERVICES=(
  "auth-service"
  "business-service"
  "party-service"
  "inventory-service"
  "invoice-service"
  "payment-service"
)

# Function to build a service
build_service() {
  local service=$1
  local tag=$2
  local image_name="${REGISTRY}/${IMAGE_PREFIX}/${service}:${tag}"
  
  echo -e "${GREEN}Building ${service}...${NC}"
  echo -e "${YELLOW}Image: ${image_name}${NC}"
  
  docker build \
    --build-arg SERVICE_NAME=${service} \
    -t ${image_name} \
    -f Dockerfile \
    .
  
  if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Successfully built ${service}${NC}"
    echo -e "${GREEN}  Image: ${image_name}${NC}"
    return 0
  else
    echo -e "${RED}✗ Failed to build ${service}${NC}"
    return 1
  fi
}

# Main build logic
if [ "$SERVICE_NAME" = "all" ]; then
  echo -e "${GREEN}Building all services...${NC}"
  echo -e "${YELLOW}Tag: ${TAG}${NC}"
  echo -e "${YELLOW}Registry: ${REGISTRY}${NC}"
  echo ""
  
  failed_services=()
  
  for service in "${SERVICES[@]}"; do
    if ! build_service "$service" "$TAG"; then
      failed_services+=("$service")
    fi
    echo ""
  done
  
  if [ ${#failed_services[@]} -eq 0 ]; then
    echo -e "${GREEN}✓ All services built successfully!${NC}"
    echo ""
    echo -e "${YELLOW}To push images, run:${NC}"
    echo -e "  ./scripts/docker-push.sh all ${TAG}"
    exit 0
  else
    echo -e "${RED}✗ Failed to build: ${failed_services[*]}${NC}"
    exit 1
  fi
else
  # Build single service
  if [[ " ${SERVICES[@]} " =~ " ${SERVICE_NAME} " ]]; then
    build_service "$SERVICE_NAME" "$TAG"
    if [ $? -eq 0 ]; then
      echo ""
      echo -e "${YELLOW}To push image, run:${NC}"
      echo -e "  ./scripts/docker-push.sh ${SERVICE_NAME} ${TAG}"
    fi
  else
    echo -e "${RED}✗ Unknown service: ${SERVICE_NAME}${NC}"
    echo -e "${YELLOW}Available services: ${SERVICES[*]}${NC}"
    exit 1
  fi
fi

