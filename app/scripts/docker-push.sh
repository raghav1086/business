#!/bin/bash

# Docker Push Script for Business App Services
# Usage: ./scripts/docker-push.sh [service-name] [tag]
# Example: ./scripts/docker-push.sh auth-service latest
# Example: ./scripts/docker-push.sh all latest

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

# Function to push a service
push_service() {
  local service=$1
  local tag=$2
  local image_name="${REGISTRY}/${IMAGE_PREFIX}/${service}:${tag}"
  
  echo -e "${GREEN}Pushing ${service}...${NC}"
  echo -e "${YELLOW}Image: ${image_name}${NC}"
  
  docker push ${image_name}
  
  if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Successfully pushed ${service}${NC}"
    echo -e "${GREEN}  Image: ${image_name}${NC}"
    return 0
  else
    echo -e "${RED}✗ Failed to push ${service}${NC}"
    return 1
  fi
}

# Check if user is logged in to Docker registry
check_docker_login() {
  if [ "$REGISTRY" != "docker.io" ]; then
    echo -e "${YELLOW}Checking Docker registry login...${NC}"
    if ! docker info | grep -q "Username"; then
      echo -e "${YELLOW}Please login to Docker registry first:${NC}"
      echo -e "  docker login ${REGISTRY}"
      exit 1
    fi
  fi
}

# Main push logic
if [ "$SERVICE_NAME" = "all" ]; then
  check_docker_login
  
  echo -e "${GREEN}Pushing all services...${NC}"
  echo -e "${YELLOW}Tag: ${TAG}${NC}"
  echo -e "${YELLOW}Registry: ${REGISTRY}${NC}"
  echo ""
  
  failed_services=()
  
  for service in "${SERVICES[@]}"; do
    if ! push_service "$service" "$TAG"; then
      failed_services+=("$service")
    fi
    echo ""
  done
  
  if [ ${#failed_services[@]} -eq 0 ]; then
    echo -e "${GREEN}✓ All services pushed successfully!${NC}"
    exit 0
  else
    echo -e "${RED}✗ Failed to push: ${failed_services[*]}${NC}"
    exit 1
  fi
else
  # Push single service
  check_docker_login
  
  if [[ " ${SERVICES[@]} " =~ " ${SERVICE_NAME} " ]]; then
    push_service "$SERVICE_NAME" "$TAG"
  else
    echo -e "${RED}✗ Unknown service: ${SERVICE_NAME}${NC}"
    echo -e "${YELLOW}Available services: ${SERVICES[*]}${NC}"
    exit 1
  fi
fi

