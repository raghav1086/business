#!/bin/bash

# Database Backup Script (MANDATORY)
# Creates a backup before running migrations
# This is a required step for production deployments
# Usage: ./backup-db.sh [DB_HOST] [DB_PORT] [DB_USER] [DB_PASSWORD]

# Don't exit on error - we'll handle errors explicitly
set +e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Database connection parameters
DB_HOST="${1:-localhost}"
DB_PORT="${2:-5432}"
DB_USER="${3:-postgres}"
DB_PASSWORD="${4:-postgres}"

BACKUP_DIR="${BACKUP_DIR:-./backups}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Create backup directory
mkdir -p "$BACKUP_DIR"

echo -e "${BLUE}Creating database backup...${NC}"

# Backup each database
DATABASES=("auth_db" "business_db" "party_db" "inventory_db" "invoice_db" "payment_db")

BACKUP_SUCCESS=0
BACKUP_FAILED=0

# Check if we're using Docker (container name business-postgres exists)
USE_DOCKER=false
if docker ps --format '{{.Names}}' 2>/dev/null | grep -q "^business-postgres$"; then
    USE_DOCKER=true
    echo -e "${BLUE}  → Using Docker for database operations${NC}"
fi

for db in "${DATABASES[@]}"; do
    echo -e "${YELLOW}  → Backing up $db...${NC}"
    
    BACKUP_FILE="$BACKUP_DIR/${db}_${TIMESTAMP}.sql"
    
    # Check if database exists first
    if [ "$USE_DOCKER" = true ]; then
        # Use Docker to check if database exists
        DB_EXISTS=$(docker exec business-postgres psql -U "$DB_USER" -d "postgres" -tAc "SELECT 1 FROM pg_database WHERE datname = '$db'" 2>/dev/null | tr -d '[:space:]' || echo "0")
        
        if [ "$DB_EXISTS" = "1" ]; then
            # Use Docker to backup database (custom format for better compression)
            if docker exec business-postgres pg_dump -U "$DB_USER" -d "$db" -F c 2>/dev/null > "$BACKUP_FILE"; then
                # Check if backup file was created and has content
                if [ -f "$BACKUP_FILE" ] && [ -s "$BACKUP_FILE" ]; then
                    echo -e "${GREEN}    ✓ $db backed up to $BACKUP_FILE${NC}"
                    ((BACKUP_SUCCESS++))
                else
                    echo -e "${RED}    ✗ $db backup file is empty${NC}"
                    ((BACKUP_FAILED++))
                fi
            else
                echo -e "${RED}    ✗ $db backup failed${NC}"
                ((BACKUP_FAILED++))
            fi
        else
            echo -e "${YELLOW}    ⚠️  $db does not exist, skipping${NC}"
        fi
    else
        # Use local psql if available
        if command -v psql &> /dev/null; then
            if PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "postgres" -tc "SELECT 1 FROM pg_database WHERE datname = '$db'" 2>/dev/null | grep -q 1; then
                if PGPASSWORD="$DB_PASSWORD" pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$db" -F c -f "$BACKUP_FILE" 2>/dev/null; then
                    echo -e "${GREEN}    ✓ $db backed up to $BACKUP_FILE${NC}"
                    ((BACKUP_SUCCESS++))
                else
                    echo -e "${RED}    ✗ $db backup failed${NC}"
                    ((BACKUP_FAILED++))
                fi
            else
                echo -e "${YELLOW}    ⚠️  $db does not exist, skipping${NC}"
            fi
        else
            echo -e "${YELLOW}    ⚠️  psql not available and Docker not detected, skipping backup${NC}"
        fi
    fi
done

# Require at least one successful backup if databases exist
if [ $BACKUP_SUCCESS -eq 0 ] && [ $BACKUP_FAILED -gt 0 ]; then
    echo -e "${RED}✗ All backup attempts failed${NC}"
    echo -e "${RED}  Deployment aborted for safety${NC}"
    exit 1
fi

# If no databases exist yet, that's okay (fresh deployment)
if [ $BACKUP_SUCCESS -eq 0 ] && [ $BACKUP_FAILED -eq 0 ]; then
    echo -e "${YELLOW}  ⚠️  No databases found (fresh deployment)${NC}"
    echo -e "${GREEN}  ✓ Backup step completed (no databases to backup)${NC}"
else
    echo -e "${GREEN}✓ Backup complete: $BACKUP_SUCCESS database(s) backed up${NC}"
fi

echo -e "${BLUE}Backup location: $BACKUP_DIR${NC}"

# Exit successfully
exit 0

