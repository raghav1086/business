#!/bin/bash

# Automated Database Backup to S3 - Cron Job Script
# Runs every 4 hours to backup all databases to S3
# Usage: This script is designed to be run by cron

set -e

# Colors for logging
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
S3_BUCKET="sam-backup-bucket"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
LOG_FILE="${PROJECT_ROOT}/logs/backup-cron.log"
BACKUP_DIR="${BACKUP_DIR:-${PROJECT_ROOT}/backups}"

# Create log directory if it doesn't exist
mkdir -p "$(dirname "$LOG_FILE")"
mkdir -p "$BACKUP_DIR"

# Logging function
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

log_error() {
    echo -e "${RED}[$(date '+%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}" | tee -a "$LOG_FILE"
}

log_success() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')] SUCCESS: $1${NC}" | tee -a "$LOG_FILE"
}

log_info() {
    echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')] INFO: $1${NC}" | tee -a "$LOG_FILE"
}

# Start backup process
log_info "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
log_info "Starting automated database backup to S3"
log_info "Bucket: $S3_BUCKET"
log_info "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Change to project root
cd "$PROJECT_ROOT"

# Check if backup script exists
if [ ! -f "$SCRIPT_DIR/backup-and-upload-to-s3.sh" ]; then
    log_error "Backup script not found: $SCRIPT_DIR/backup-and-upload-to-s3.sh"
    exit 1
fi

# Check AWS CLI
if ! command -v aws &> /dev/null; then
    log_error "AWS CLI is not installed"
    exit 1
fi

# Check AWS credentials
if ! aws sts get-caller-identity &> /dev/null; then
    log_error "AWS credentials not configured"
    exit 1
fi

# Run backup and upload
log_info "Running backup and upload to S3..."
if "$SCRIPT_DIR/backup-and-upload-to-s3.sh" "$S3_BUCKET" > >(tee -a "$LOG_FILE") 2> >(tee -a "$LOG_FILE" >&2); then
    log_success "Backup and upload completed successfully"
    
    # Clean up old local backups (keep last 7 days)
    log_info "Cleaning up old local backups (keeping last 7 days)..."
    find "$BACKUP_DIR" -name "*.sql" -type f -mtime +7 -delete 2>/dev/null || true
    find "$BACKUP_DIR" -name "*.sql.gz" -type f -mtime +7 -delete 2>/dev/null || true
    log_success "Cleanup completed"
    
    exit 0
else
    log_error "Backup and upload failed"
    exit 1
fi

