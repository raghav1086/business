#!/bin/bash

# Fix Jest Dependencies Script
# This script fixes the @jest/test-sequencer module resolution issue

set -e

echo "🔧 Fixing Jest Dependencies..."
echo ""

cd "$(dirname "$0")/.."

# Check if package exists
if [ -d "node_modules/@jest/test-sequencer" ]; then
  echo "✅ @jest/test-sequencer exists in node_modules"
else
  echo "⚠️  @jest/test-sequencer not found, installing..."
  npm install --save-dev '@jest/test-sequencer@^29.7.0' --legacy-peer-deps
fi

# Try to fix module resolution
echo ""
echo "🔍 Checking module resolution..."

# Check if it can be resolved
if node -e "require.resolve('@jest/test-sequencer')" 2>/dev/null; then
  echo "✅ Module can be resolved"
else
  echo "⚠️  Module resolution issue detected"
  echo ""
  echo "Trying to fix with npm dedupe..."
  npm dedupe 2>/dev/null || true
  
  echo ""
  echo "If issue persists, try:"
  echo "  rm -rf node_modules package-lock.json"
  echo "  npm install"
fi

echo ""
echo "✅ Done! Try running tests now:"
echo "  npm run test:integration"

