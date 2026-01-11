#!/bin/bash

# Setup Cron Job for Automated Database Backups
# This script sets up a cron job to backup databases every 4 hours to S3

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
CRON_SCRIPT="$SCRIPT_DIR/cron-backup-to-s3.sh"

echo -e "${BLUE}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║     SETUP AUTOMATED DATABASE BACKUP CRON JOB                  ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Check if cron script exists
if [ ! -f "$CRON_SCRIPT" ]; then
    echo -e "${RED}❌ Cron backup script not found: $CRON_SCRIPT${NC}"
    exit 1
fi

# Make cron script executable
chmod +x "$CRON_SCRIPT"
echo -e "${GREEN}✅ Made cron script executable${NC}"

# Check if crontab is available
if ! command -v crontab &> /dev/null; then
    echo -e "${YELLOW}⚠️  crontab command not found${NC}"
    echo ""
    echo "Installing cronie (cron daemon)..."
    
    # Try to install cronie
    if command -v yum &> /dev/null; then
        if sudo yum install -y cronie; then
            echo -e "${GREEN}✅ cronie installed successfully${NC}"
            # Start and enable crond service
            sudo systemctl start crond
            sudo systemctl enable crond
            echo -e "${GREEN}✅ crond service started and enabled${NC}"
        else
            echo -e "${RED}❌ Failed to install cronie${NC}"
            echo ""
            echo "Please install cronie manually:"
            echo "  sudo yum install -y cronie"
            echo "  sudo systemctl start crond"
            echo "  sudo systemctl enable crond"
            exit 1
        fi
    elif command -v apt-get &> /dev/null; then
        if sudo apt-get update && sudo apt-get install -y cron; then
            echo -e "${GREEN}✅ cron installed successfully${NC}"
            sudo systemctl start cron
            sudo systemctl enable cron
            echo -e "${GREEN}✅ cron service started and enabled${NC}"
        else
            echo -e "${RED}❌ Failed to install cron${NC}"
            echo ""
            echo "Please install cron manually:"
            echo "  sudo apt-get update"
            echo "  sudo apt-get install -y cron"
            echo "  sudo systemctl start cron"
            echo "  sudo systemctl enable cron"
            exit 1
        fi
    else
        echo -e "${RED}❌ Cannot determine package manager${NC}"
        echo ""
        echo "Please install cron manually:"
        echo "  For Amazon Linux/CentOS/RHEL: sudo yum install -y cronie"
        echo "  For Ubuntu/Debian: sudo apt-get install -y cron"
        exit 1
    fi
    
    # Verify crontab is now available
    if ! command -v crontab &> /dev/null; then
        echo -e "${RED}❌ crontab still not available after installation${NC}"
        echo "Please check the installation and try again"
        exit 1
    fi
fi

# Get absolute path to cron script
CRON_SCRIPT_ABS="$(cd "$(dirname "$CRON_SCRIPT")" && pwd)/$(basename "$CRON_SCRIPT")"

# Cron job: Run every 4 hours
# Format: minute hour day month weekday
# 0 */4 * * * = Every 4 hours at minute 0
CRON_JOB="0 */4 * * * $CRON_SCRIPT_ABS >> $PROJECT_ROOT/logs/backup-cron.log 2>&1"

# Find crontab command (handle PATH issues)
CRONTAB_CMD=$(command -v crontab || which crontab || echo "crontab")
if [ ! -x "$CRONTAB_CMD" ] && [ "$CRONTAB_CMD" = "crontab" ]; then
    # Try common locations
    for path in /usr/bin/crontab /bin/crontab /usr/sbin/crontab; do
        if [ -x "$path" ]; then
            CRONTAB_CMD="$path"
            break
        fi
    done
fi

# Check if cron job already exists
if $CRONTAB_CMD -l 2>/dev/null | grep -q "$CRON_SCRIPT_ABS"; then
    echo -e "${YELLOW}⚠️  Cron job already exists${NC}"
    echo ""
    echo "Current cron jobs:"
    $CRONTAB_CMD -l 2>/dev/null | grep -v "^#" | grep -v "^$" || echo "  (none)"
    echo ""
    read -p "Do you want to update it? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        # Remove existing cron job
        $CRONTAB_CMD -l 2>/dev/null | grep -v "$CRON_SCRIPT_ABS" | $CRONTAB_CMD -
        # Add new cron job
        ($CRONTAB_CMD -l 2>/dev/null; echo "$CRON_JOB") | $CRONTAB_CMD -
        echo -e "${GREEN}✅ Cron job updated${NC}"
    else
        echo -e "${YELLOW}⚠️  Keeping existing cron job${NC}"
        exit 0
    fi
else
    # Add new cron job
    ($CRONTAB_CMD -l 2>/dev/null; echo "$CRON_JOB") | $CRONTAB_CMD -
    echo -e "${GREEN}✅ Cron job added${NC}"
fi

echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}✅ Cron job setup complete!${NC}"
echo ""
echo "📋 Cron job details:"
echo "   Schedule: Every 4 hours (at :00 minutes)"
echo "   Script: $CRON_SCRIPT_ABS"
echo "   S3 Bucket: sam-backup-bucket"
echo "   Log file: $PROJECT_ROOT/logs/backup-cron.log"
echo ""
echo "📝 Current cron jobs:"
$CRONTAB_CMD -l 2>/dev/null | grep -v "^#" | grep -v "^$" || echo "  (none)"
echo ""
echo "🔍 To view cron logs:"
echo "   tail -f $PROJECT_ROOT/logs/backup-cron.log"
echo ""
echo "🔧 To remove cron job:"
echo "   $CRONTAB_CMD -e"
echo "   (then delete the line with cron-backup-to-s3.sh)"
echo ""

