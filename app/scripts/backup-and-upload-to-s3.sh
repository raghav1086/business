#!/bin/bash

# Combined Database Backup and S3 Upload Script
# Creates backups of all databases and uploads them to S3
# Usage: ./backup-and-upload-to-s3.sh [DB_HOST] [DB_PORT] [DB_USER] [DB_PASSWORD] [S3_BUCKET] [KEEP_LOCAL] [UPLOAD_ONLY_LATEST]
#   DB_HOST: Database host (default: localhost)
#   DB_PORT: Database port (default: 5432)
#   DB_USER: Database user (default: postgres)
#   DB_PASSWORD: Database password (default: postgres)
#   S3_BUCKET: S3 bucket name (default: from AWS_S3_BACKUP_BUCKET env var)
#   KEEP_LOCAL: Keep local files after upload (default: true, set to "false" to delete)
#   UPLOAD_ONLY_LATEST: Upload only latest backup per database (default: true)

# Don't exit on error immediately - we'll handle errors explicitly
set +e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Parse arguments
# Smart parameter detection: if only one argument is provided and it looks like a bucket name, treat it as S3_BUCKET
if [ $# -eq 1 ] && [[ "$1" =~ ^[a-z0-9][a-z0-9-]*[a-z0-9]$ ]] && [[ ! "$1" =~ \. ]] && [ ${#1} -ge 3 ] && [ ${#1} -le 63 ]; then
    # Single argument that looks like a bucket name (S3 naming rules)
    DB_HOST="localhost"
    DB_PORT="5432"
    DB_USER="postgres"
    DB_PASSWORD="postgres"
    S3_BUCKET="$1"
    KEEP_LOCAL="true"
    UPLOAD_ONLY_LATEST="true"
    echo -e "${BLUE}Detected S3 bucket name: $S3_BUCKET${NC}"
else
    # Standard parameter parsing
    DB_HOST="${1:-localhost}"
    DB_PORT="${2:-5432}"
    DB_USER="${3:-postgres}"
    DB_PASSWORD="${4:-postgres}"
    S3_BUCKET="${5:-${AWS_S3_BACKUP_BUCKET}}"
    KEEP_LOCAL="${6:-true}"
    UPLOAD_ONLY_LATEST="${7:-true}"
fi

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}Database Backup and S3 Upload${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Step 1: Create backups
echo -e "${BLUE}Step 1: Creating database backups...${NC}"
if ! "$SCRIPT_DIR/backup-db.sh" "$DB_HOST" "$DB_PORT" "$DB_USER" "$DB_PASSWORD"; then
    echo -e "${RED}✗ Backup failed. Aborting S3 upload.${NC}"
    exit 1
fi

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Step 2: Upload to S3
echo -e "${BLUE}Step 2: Uploading backups to S3...${NC}"
if [ -z "$S3_BUCKET" ]; then
    # If no bucket provided, just run upload script which will prompt
    "$SCRIPT_DIR/upload-backup-to-s3.sh" "" "" "$KEEP_LOCAL" "$UPLOAD_ONLY_LATEST"
else
    "$SCRIPT_DIR/upload-backup-to-s3.sh" "$S3_BUCKET" "" "$KEEP_LOCAL" "$UPLOAD_ONLY_LATEST"
fi

UPLOAD_EXIT_CODE=$?

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

if [ $UPLOAD_EXIT_CODE -eq 0 ]; then
    echo -e "${GREEN}✓ Backup and upload completed successfully${NC}"
    exit 0
else
    echo -e "${RED}✗ Upload failed (backups are still available locally)${NC}"
    exit $UPLOAD_EXIT_CODE
fi

