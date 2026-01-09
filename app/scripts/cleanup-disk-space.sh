#!/bin/bash
# Script to clean up disk space on EC2 instance
# Run this script to free up space

set -e

echo "=== Starting Disk Space Cleanup ==="
echo ""

# Get initial disk usage
echo "Initial disk usage:"
df -h / | tail -1
echo ""

# Remove git lock file if it exists
echo "1. Removing git lock file..."
rm -f /opt/business-app/.git/index.lock 2>/dev/null || true
echo "   ✓ Done"
echo ""

# Clean git objects
echo "2. Cleaning git objects..."
cd /opt/business-app
git gc --prune=now 2>/dev/null || echo "   ⚠ Git cleanup had issues (may be normal)"
echo "   ✓ Done"
echo ""

# Remove old build artifacts (these can be rebuilt)
echo "3. Removing old build artifacts..."
if [ -d "/opt/business-app/app/dist" ]; then
    rm -rf /opt/business-app/app/dist
    echo "   ✓ Removed app/dist"
fi

if [ -d "/opt/business-app/web-app/.next" ]; then
    rm -rf /opt/business-app/web-app/.next
    echo "   ✓ Removed web-app/.next"
fi

if [ -d "/opt/business-app/web-app/.turbo" ]; then
    rm -rf /opt/business-app/web-app/.turbo
    echo "   ✓ Removed web-app/.turbo"
fi
echo ""

# Clean npm cache
echo "4. Cleaning npm cache..."
npm cache clean --force 2>/dev/null || echo "   ⚠ npm cache clean had issues"
echo "   ✓ Done"
echo ""

# Remove old logs (keep last 7 days)
echo "5. Removing old logs (keeping last 7 days)..."
if [ -d "/opt/business-app/app/logs" ]; then
    find /opt/business-app/app/logs -type f -mtime +7 -delete 2>/dev/null || true
    echo "   ✓ Done"
fi
echo ""

# Clean Docker if available
if command -v docker &> /dev/null; then
    echo "6. Cleaning Docker..."
    docker system prune -f 2>/dev/null || echo "   ⚠ Docker cleanup had issues"
    echo "   ✓ Done"
    echo ""
fi

# Final disk usage
echo "Final disk usage:"
df -h / | tail -1
echo ""

echo "=== Cleanup Complete ==="
echo ""
echo "You can now try:"
echo "  cd /opt/business-app/app"
echo "  git pull origin main"

