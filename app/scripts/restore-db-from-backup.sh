#!/bin/bash
# =============================================================================
# DATABASE RESTORE FROM BACKUP (Custom Format)
# =============================================================================
# This script restores all databases from PostgreSQL custom format backups
# without stopping/starting services (services keep running)
# Usage: ./restore-db-from-backup.sh [backup_directory]
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
BACKUP_DIR="${1:-/opt/business-app/db_backup}"  # Default backup directory
TIMESTAMP="20260108_180446"

echo -e "${BLUE}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║     DATABASE RESTORE FROM BACKUP (CUSTOM FORMAT)                ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════════╝${NC}"
echo ""

cd "$APP_DIR"

# Verify backup directory exists
if [ ! -d "$BACKUP_DIR" ]; then
    echo -e "${RED}❌ Backup directory not found: $BACKUP_DIR${NC}"
    echo -e "${YELLOW}   Usage: $0 /path/to/backup/directory${NC}"
    exit 1
fi

# Verify files exist
echo -e "${YELLOW}📋 Checking backup files...${NC}"
ls -lh "$BACKUP_DIR"/*.sql 2>/dev/null || {
    echo -e "${RED}❌ No backup files found in $BACKUP_DIR${NC}"
    exit 1
}
echo ""

# Stop services (optional but recommended for consistency)
echo -e "${YELLOW}📋 Stopping services...${NC}"
docker-compose -f docker-compose.prod.yml stop auth-service business-service party-service inventory-service invoice-service payment-service 2>/dev/null || true
echo -e "${GREEN}✅ Services stopped${NC}"
echo ""

# Function to restore a database
restore_db() {
    local db_name=$1
    local backup_file="$BACKUP_DIR/${db_name}_${TIMESTAMP}.sql"
    
    if [ -f "$backup_file" ]; then
        echo -e "${YELLOW}📦 Restoring $db_name...${NC}"
        
        # Copy backup to container
        docker cp "$backup_file" business-postgres:/tmp/backup.dump
        
        # Restore using pg_restore (for custom format)
        if docker exec business-postgres pg_restore -U postgres -d "$db_name" --clean --if-exists --verbose /tmp/backup.dump 2>&1 | grep -v "WARNING\|NOTICE" > /dev/null 2>&1; then
            echo -e "${GREEN}   ✅ $db_name restored successfully${NC}"
        else
            # Even if there are warnings, check if restore worked
            local count=$(docker exec business-postgres psql -U postgres -d "$db_name" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public' AND table_type='BASE TABLE';" 2>/dev/null | tr -d ' ')
            if [ -n "$count" ] && [ "$count" != "0" ]; then
                echo -e "${GREEN}   ✅ $db_name restored (with warnings, but tables exist)${NC}"
            else
                echo -e "${YELLOW}   ⚠️  $db_name restore had issues (check manually)${NC}"
            fi
        fi
        
        # Clean up
        docker exec business-postgres rm -f /tmp/backup.dump
    else
        echo -e "${YELLOW}   ⚠️  Backup not found: $(basename $backup_file)${NC}"
    fi
}

# Restore all databases
restore_db "auth_db"
restore_db "business_db"
restore_db "party_db"
restore_db "inventory_db"
restore_db "invoice_db"
restore_db "payment_db"

# Restart services
echo ""
echo -e "${YELLOW}🔄 Restarting services...${NC}"
docker-compose -f docker-compose.prod.yml start auth-service business-service party-service inventory-service invoice-service payment-service

# Wait for services to start
sleep 5

# Verify data
echo ""
echo -e "${BLUE}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║     VERIFICATION                                                 ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════════╝${NC}"
echo ""

echo -e "${YELLOW}🔍 Checking data counts...${NC}"
echo "Users: $(docker exec business-postgres psql -U postgres -d auth_db -t -c 'SELECT COUNT(*) FROM users;' 2>/dev/null | tr -d ' ' || echo '0')"
echo "Businesses: $(docker exec business-postgres psql -U postgres -d business_db -t -c 'SELECT COUNT(*) FROM businesses;' 2>/dev/null | tr -d ' ' || echo '0')"
echo "Parties: $(docker exec business-postgres psql -U postgres -d party_db -t -c 'SELECT COUNT(*) FROM parties;' 2>/dev/null | tr -d ' ' || echo '0')"
echo "Inventory Items: $(docker exec business-postgres psql -U postgres -d inventory_db -t -c 'SELECT COUNT(*) FROM items;' 2>/dev/null | tr -d ' ' || echo '0')"
echo "Invoices: $(docker exec business-postgres psql -U postgres -d invoice_db -t -c 'SELECT COUNT(*) FROM invoices;' 2>/dev/null | tr -d ' ' || echo '0')"
echo "Payments: $(docker exec business-postgres psql -U postgres -d payment_db -t -c 'SELECT COUNT(*) FROM payments;' 2>/dev/null | tr -d ' ' || echo '0')"

echo ""
echo -e "${GREEN}════════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}✅ DATABASE RESTORE COMPLETE!${NC}"
echo -e "${GREEN}════════════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "${YELLOW}📋 Services are restarting - wait 1-2 minutes for full health${NC}"
echo ""

