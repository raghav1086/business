#!/bin/bash
# Script to diagnose and fix disk space issues on EC2 instance

set -e

echo "=== Disk Space Diagnosis ==="
echo ""
echo "1. Overall disk usage:"
df -h
echo ""

echo "2. Top 10 largest directories in /opt:"
du -h /opt 2>/dev/null | sort -rh | head -10 || echo "Could not check /opt"
echo ""

echo "3. Top 10 largest directories in /opt/business-app:"
du -h /opt/business-app 2>/dev/null | sort -rh | head -10 || echo "Could not check /opt/business-app"
echo ""

echo "4. Checking for large files (>100MB):"
find /opt/business-app -type f -size +100M 2>/dev/null | head -20 || echo "No large files found"
echo ""

echo "=== Cleanup Options ==="
echo ""
echo "Checking for cleanup candidates..."

# Check node_modules size
if [ -d "/opt/business-app/app/node_modules" ]; then
    NODE_MODULES_SIZE=$(du -sh /opt/business-app/app/node_modules 2>/dev/null | cut -f1)
    echo "node_modules size: $NODE_MODULES_SIZE"
fi

# Check dist/build directories
if [ -d "/opt/business-app/app/dist" ]; then
    DIST_SIZE=$(du -sh /opt/business-app/app/dist 2>/dev/null | cut -f1)
    echo "dist directory size: $DIST_SIZE"
fi

# Check logs
if [ -d "/opt/business-app/app/logs" ]; then
    LOGS_SIZE=$(du -sh /opt/business-app/app/logs 2>/dev/null | cut -f1)
    echo "logs directory size: $LOGS_SIZE"
fi

# Check .next (Next.js build)
if [ -d "/opt/business-app/web-app/.next" ]; then
    NEXT_SIZE=$(du -sh /opt/business-app/web-app/.next 2>/dev/null | cut -f1)
    echo ".next directory size: $NEXT_SIZE"
fi

# Check web-app node_modules
if [ -d "/opt/business-app/web-app/node_modules" ]; then
    WEB_NODE_SIZE=$(du -sh /opt/business-app/web-app/node_modules 2>/dev/null | cut -f1)
    echo "web-app/node_modules size: $WEB_NODE_SIZE"
fi

# Check git objects
if [ -d "/opt/business-app/.git" ]; then
    GIT_SIZE=$(du -sh /opt/business-app/.git 2>/dev/null | cut -f1)
    echo ".git directory size: $GIT_SIZE"
fi

echo ""
echo "=== Recommended Cleanup Commands ==="
echo ""
echo "1. Remove git lock file (if stuck):"
echo "   rm -f /opt/business-app/.git/index.lock"
echo ""
echo "2. Clean old git objects:"
echo "   cd /opt/business-app && git gc --prune=now"
echo ""
echo "3. Remove old build artifacts (if safe to rebuild):"
echo "   rm -rf /opt/business-app/app/dist"
echo "   rm -rf /opt/business-app/web-app/.next"
echo ""
echo "4. Clean npm cache:"
echo "   npm cache clean --force"
echo ""
echo "5. Remove old logs:"
echo "   find /opt/business-app/app/logs -type f -mtime +7 -delete"
echo ""
echo "6. Clean Docker (if using Docker):"
echo "   docker system prune -a --volumes"
echo ""

================================================================================

Checking disk space and identifying what's consuming it:


[1 tool called]


Providing commands to run on your EC2 instance to diagnose and fix the disk space issue:


[2 tools called]


Making the scripts executable and providing instructions:


[1 tool called]


Created two scripts to help with the disk space issue. Run these on your EC2 instance:

## Quick Fix Steps

**1. First, diagnose the issue:**
```bash
cd /opt/business-app/app
bash scripts/fix-disk-space.sh
```

**2. Then, clean up disk space:**
```bash
bash scripts/cleanup-disk-space.sh
```

**3. After cleanup, retry git pull:**
```bash
cd /opt/business-app/app
git pull origin main
```

## Manual Quick Fix (if scripts aren't available)

If you need to fix it immediately, run these commands on your EC2 instance:

```bash
# 1. Remove the stuck git lock file
rm -f /opt/business-app/.git/index.lock

# 2. Check disk space
df -h

# 3. Clean git objects
cd /opt/business-app
git gc --prune=now

# 4. Remove old build artifacts (can be rebuilt)
rm -rf /opt/business-app/app/dist
rm -rf /opt/business-app/web-app/.next
rm -rf /opt/business-app/web-app/.turbo

# 5. Clean npm cache
npm cache clean --force

# 6. Remove old logs (optional - keeps last 7 days)
find /opt/business-app/app/logs -type f -mtime +7 -delete

# 7. Now try git pull again
cd /opt/business-app/app
git pull origin main
```

## What to Check

After running the cleanup, check what's taking up space:
```bash
# See overall usage
df -h

# Find largest directories
du -h /opt/business-app | sort -rh | head -20

# Find large files
find /opt/business-app -type f -size +100M
```

The most common culprits are:
- `node_modules` directories
- Build artifacts (`dist`, `.next`)
- Git objects (`.git` directory)
- Log files
- Docker images/containers

After cleanup, you should be able to pull the latest changes. If you still have issues, share the output of `df -h` and we can identify what else to clean up.