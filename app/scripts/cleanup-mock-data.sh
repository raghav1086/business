#!/bin/bash

# Cleanup Script - Remove Old Mock Data
# This script removes all data created with the mock business ID
# that was used before proper JWT authentication was implemented.
#
# WARNING: This will permanently delete data!
# Usage: ./scripts/cleanup-mock-data.sh

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
MOCK_BUSINESS_ID='00000000-0000-0000-0000-000000000001'
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_USERNAME="${DB_USERNAME:-postgres}"
DB_PASSWORD="${DB_PASSWORD:-postgres}"

# Export password for psql
export PGPASSWORD="$DB_PASSWORD"

echo -e "${YELLOW}🧹 Starting cleanup of mock data...${NC}"
echo -e "${YELLOW}📋 Mock Business ID: ${MOCK_BUSINESS_ID}${NC}"
echo -e "${YELLOW}⚠️  WARNING: This will permanently delete data!${NC}"
echo ""
read -p "Are you sure you want to continue? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo -e "${RED}✗ Cleanup cancelled${NC}"
    exit 0
fi

echo ""

# Function to cleanup a database
cleanup_database() {
    local db_name=$1
    local table_name=$2
    
    echo -e "${GREEN}Cleaning ${db_name}.${table_name}...${NC}"
    
    psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USERNAME" -d "$db_name" -c "
        DELETE FROM ${table_name} WHERE business_id = '${MOCK_BUSINESS_ID}';
        SELECT 'Deleted ' || COUNT(*) || ' rows' FROM ${table_name} WHERE business_id = '${MOCK_BUSINESS_ID}';
    " 2>/dev/null || echo -e "${YELLOW}  ⚠️  Table ${table_name} not found or already clean${NC}"
}

# Cleanup Party Database
echo -e "${GREEN}📊 Cleaning party_db...${NC}"
cleanup_database "party_db" "parties"
echo ""

# Cleanup Inventory Database
echo -e "${GREEN}📊 Cleaning inventory_db...${NC}"
cleanup_database "inventory_db" "stock_adjustments"
cleanup_database "inventory_db" "items"
echo ""

# Cleanup Invoice Database
echo -e "${GREEN}📊 Cleaning invoice_db...${NC}"
# Delete invoice items first (foreign key constraint)
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USERNAME" -d "invoice_db" -c "
    DELETE FROM invoice_items 
    WHERE invoice_id IN (
        SELECT id FROM invoices WHERE business_id = '${MOCK_BUSINESS_ID}'
    );
" 2>/dev/null || echo -e "${YELLOW}  ⚠️  Invoice items already clean${NC}"

cleanup_database "invoice_db" "invoices"
echo ""

# Cleanup Payment Database
echo -e "${GREEN}📊 Cleaning payment_db...${NC}"
cleanup_database "payment_db" "transactions"
echo ""

echo -e "${GREEN}✅ Cleanup complete!${NC}"
echo -e "${GREEN}All mock data has been removed from all databases.${NC}"

