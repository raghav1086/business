#!/bin/bash

# =============================================================================
# QUICK SEAMLESS DEPLOYMENT (Simplified version)
# =============================================================================
# One-command deployment that auto-detects and deploys changed services
# Usage: ./deploy-seamless-quick.sh
# =============================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$PROJECT_ROOT"

# Run the main seamless deployment script
exec "$SCRIPT_DIR/deploy-seamless.sh"

