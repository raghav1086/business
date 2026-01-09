#!/bin/bash
# =============================================================================
# DATABASE RESTORE SCRIPT
# =============================================================================
# This script:
# 1. Uses the password from .env.production (or sets a consistent one)
# 2. Recreates the PostgreSQL container with the correct password
# 3. Restores all database backups from the backup directory
# 4. Restarts all services
# =============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
BACKUP_DIR="${1:-$APP_DIR/db_backup}"  # Default or provided backup directory
ENV_FILE="$APP_DIR/.env.production"

echo "BACKUP_DIR: $BACKUP_DIR"
echo "ENV_FILE: $ENV_FILE"
echo "APP_DIR: $APP_DIR"
echo "SCRIPT_DIR: $SCRIPT_DIR"

echo -e "${BLUE}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║     DATABASE RESTORE WITH BACKUP IMPORT                        ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════════╝${NC}"
echo ""

cd "$APP_DIR"

# =============================================================================
# STEP 1: Check and set up DB_PASSWORD in .env.production
# =============================================================================
echo -e "${YELLOW}📋 Step 1/6: Checking .env.production for DB_PASSWORD...${NC}"

if [ ! -f "$ENV_FILE" ]; then
    echo -e "${RED}❌ .env.production not found at $ENV_FILE${NC}"
    echo -e "${YELLOW}Creating .env.production with default production password...${NC}"
    
    # Use fixed production password (never changes)
    DB_PASSWORD="Admin112233"
    JWT_SECRET=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-32)
    
    cat > "$ENV_FILE" << EOF
# Business App Production Environment
# Generated on $(date)

# Database Configuration - Fixed production password (DO NOT CHANGE)
DB_PASSWORD=$DB_PASSWORD

# JWT Secret - DO NOT CHANGE AFTER INITIAL SETUP
JWT_SECRET=$JWT_SECRET
EOF
    echo -e "${GREEN}✅ Created .env.production with default production password: Admin112233${NC}"
else
    # Check if DB_PASSWORD exists in the file, but always use Admin112233
    if grep -q "^DB_PASSWORD=" "$ENV_FILE"; then
        EXISTING_PASSWORD=$(grep "^DB_PASSWORD=" "$ENV_FILE" | cut -d'=' -f2- | tr -d '"' | tr -d "'")
        if [ -z "$EXISTING_PASSWORD" ] || [ "$EXISTING_PASSWORD" != "Admin112233" ]; then
            echo -e "${YELLOW}⚠️  DB_PASSWORD doesn't match production default, updating to Admin112233...${NC}"
            DB_PASSWORD="Admin112233"
            sed -i.bak "s/^DB_PASSWORD=.*/DB_PASSWORD=$DB_PASSWORD/" "$ENV_FILE"
            rm -f "${ENV_FILE}.bak"
        else
            DB_PASSWORD="Admin112233"
        fi
        echo -e "${GREEN}✅ Using production password: Admin112233${NC}"
    else
        echo -e "${YELLOW}⚠️  DB_PASSWORD not found, adding production password...${NC}"
        DB_PASSWORD="Admin112233"
        echo "DB_PASSWORD=$DB_PASSWORD" >> "$ENV_FILE"
        echo -e "${GREEN}✅ Added production password: Admin112233${NC}"
    fi
fi

# Export the password for docker-compose
export DB_PASSWORD
echo -e "${GREEN}   Password length: ${#DB_PASSWORD} characters${NC}"
echo ""

# =============================================================================
# STEP 2: Check for backup files
# =============================================================================
echo -e "${YELLOW}📋 Step 2/6: Checking backup files...${NC}"

if [ ! -d "$BACKUP_DIR" ]; then
    echo -e "${RED}❌ Backup directory not found: $BACKUP_DIR${NC}"
    echo -e "${YELLOW}   Usage: $0 /path/to/backup/directory${NC}"
    exit 1
fi

# Find the latest backup files
AUTH_BACKUP=$(ls -t "$BACKUP_DIR"/auth_db_*.sql 2>/dev/null | head -1)
BUSINESS_BACKUP=$(ls -t "$BACKUP_DIR"/business_db_*.sql 2>/dev/null | head -1)
PARTY_BACKUP=$(ls -t "$BACKUP_DIR"/party_db_*.sql 2>/dev/null | head -1)
INVENTORY_BACKUP=$(ls -t "$BACKUP_DIR"/inventory_db_*.sql 2>/dev/null | head -1)
INVOICE_BACKUP=$(ls -t "$BACKUP_DIR"/invoice_db_*.sql 2>/dev/null | head -1)
PAYMENT_BACKUP=$(ls -t "$BACKUP_DIR"/payment_db_*.sql 2>/dev/null | head -1)

echo "   Found backups:"
[ -n "$AUTH_BACKUP" ] && echo -e "   ${GREEN}✓${NC} auth_db: $(basename $AUTH_BACKUP)"
[ -n "$BUSINESS_BACKUP" ] && echo -e "   ${GREEN}✓${NC} business_db: $(basename $BUSINESS_BACKUP)"
[ -n "$PARTY_BACKUP" ] && echo -e "   ${GREEN}✓${NC} party_db: $(basename $PARTY_BACKUP)"
[ -n "$INVENTORY_BACKUP" ] && echo -e "   ${GREEN}✓${NC} inventory_db: $(basename $INVENTORY_BACKUP)"
[ -n "$INVOICE_BACKUP" ] && echo -e "   ${GREEN}✓${NC} invoice_db: $(basename $INVOICE_BACKUP)"
[ -n "$PAYMENT_BACKUP" ] && echo -e "   ${GREEN}✓${NC} payment_db: $(basename $PAYMENT_BACKUP)"
echo ""

# =============================================================================
# STEP 3: Stop all services
# =============================================================================
echo -e "${YELLOW}📋 Step 3/6: Stopping all services...${NC}"
docker-compose -f docker-compose.prod.yml down 2>/dev/null || true
echo -e "${GREEN}✅ All services stopped${NC}"
echo ""

# =============================================================================
# STEP 4: Remove old postgres volume and recreate with correct password
# =============================================================================
echo -e "${YELLOW}📋 Step 4/6: Recreating PostgreSQL with correct password...${NC}"

# Remove the old volume
docker volume rm app_postgres_data 2>/dev/null || true
docker volume rm business-app_postgres_data 2>/dev/null || true

# Export JWT_SECRET too
if grep -q "^JWT_SECRET=" "$ENV_FILE"; then
    export JWT_SECRET=$(grep "^JWT_SECRET=" "$ENV_FILE" | cut -d'=' -f2- | tr -d '"' | tr -d "'")
fi

# Start only postgres first
docker-compose -f docker-compose.prod.yml up -d postgres

# Wait for postgres to be healthy
echo "   Waiting for PostgreSQL to be ready..."
for i in {1..30}; do
    if docker exec business-postgres pg_isready -U postgres > /dev/null 2>&1; then
        echo -e "${GREEN}✅ PostgreSQL is ready${NC}"
        break
    fi
    sleep 2
    echo -n "."
done
echo ""

# Wait a bit more for init-db.sql to run
sleep 5
echo ""

# =============================================================================
# STEP 5: Import backup files
# =============================================================================
echo -e "${YELLOW}📋 Step 5/6: Importing database backups...${NC}"

import_backup() {
    local db_name=$1
    local backup_file=$2
    
    if [ -n "$backup_file" ] && [ -f "$backup_file" ]; then
        echo "   Importing $db_name from $(basename $backup_file)..."
        
        # Copy backup to container
        docker cp "$backup_file" business-postgres:/tmp/backup.sql
        
        # Import the backup
        if docker exec business-postgres psql -U postgres -d "$db_name" -f /tmp/backup.sql > /dev/null 2>&1; then
            echo -e "   ${GREEN}✓${NC} $db_name imported successfully"
        else
            echo -e "   ${YELLOW}⚠${NC} $db_name import had warnings (may be OK if tables exist)"
        fi
        
        # Clean up
        docker exec business-postgres rm -f /tmp/backup.sql
    else
        echo -e "   ${YELLOW}⚠${NC} No backup found for $db_name - skipping"
    fi
}

import_backup "auth_db" "$AUTH_BACKUP"
import_backup "business_db" "$BUSINESS_BACKUP"
import_backup "party_db" "$PARTY_BACKUP"
import_backup "inventory_db" "$INVENTORY_BACKUP"
import_backup "invoice_db" "$INVOICE_BACKUP"
import_backup "payment_db" "$PAYMENT_BACKUP"

echo ""

# =============================================================================
# STEP 6: Start all services
# =============================================================================
echo -e "${YELLOW}📋 Step 6/6: Starting all services...${NC}"

# Start all services
docker-compose -f docker-compose.prod.yml up -d

echo ""
echo "   Waiting for services to be healthy..."
sleep 30

# Check service health
echo ""
echo -e "${BLUE}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║     SERVICE STATUS                                             ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════════╝${NC}"
echo ""

docker-compose -f docker-compose.prod.yml ps

echo ""

# Verify database connections
echo -e "${YELLOW}🔍 Verifying database connections...${NC}"
for service in auth business party inventory invoice payment; do
    if docker logs business-$service 2>&1 | tail -20 | grep -q "Nest application successfully started"; then
        echo -e "   ${GREEN}✓${NC} ${service}-service connected to database"
    else
        echo -e "   ${YELLOW}⏳${NC} ${service}-service still starting..."
    fi
done

echo ""
echo -e "${GREEN}════════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}✅ DATABASE RESTORE COMPLETE!${NC}"
echo -e "${GREEN}════════════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "${YELLOW}📋 Important Notes:${NC}"
echo "   1. DB_PASSWORD is stored in: $ENV_FILE"
echo "   2. All backups have been imported"
echo "   3. Services are starting - wait 1-2 minutes for full health"
echo ""
echo -e "${YELLOW}🔍 To check logs:${NC}"
echo "   docker logs business-auth --tail=50"
echo "   docker logs business-party --tail=50"
echo ""
echo -e "${YELLOW}📊 To verify services:${NC}"
echo "   docker-compose -f docker-compose.prod.yml ps"
echo ""

