#!/bin/bash

# =============================================================================
# Stop All Local Services
# =============================================================================

set -e

# Colors
BLUE='\033[0;34m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
NC='\033[0m'

echo -e "${BLUE}🛑 Stopping all local services...${NC}"

# Kill services by PID files
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$APP_DIR"

if [ -d "logs" ]; then
  for pid_file in logs/*.pid; do
    if [ -f "$pid_file" ]; then
      pid=$(cat "$pid_file")
      service_name=$(basename "$pid_file" .pid)
      if kill -0 "$pid" 2>/dev/null; then
        echo -e "${YELLOW}Stopping ${service_name} (PID: ${pid})...${NC}"
        kill "$pid" 2>/dev/null || true
      fi
      rm -f "$pid_file"
    fi
  done
fi

# Kill any remaining nx serve processes
pkill -f "nx serve" || true
pkill -f "nest start" || true

echo -e "${GREEN}✅ All services stopped${NC}"

