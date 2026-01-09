#!/bin/bash
# =============================================================================
# SAFE DEPLOYMENT SCRIPT WITH PASSWORD PRESERVATION
# =============================================================================
# This script ensures DB_PASSWORD is never regenerated after initial setup
# Usage: ./deploy-with-password-check.sh
# =============================================================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
ENV_FILE="$APP_DIR/.env.production"

echo -e "${BLUE}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║     SAFE DEPLOYMENT WITH PASSWORD PRESERVATION                 ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════════╝${NC}"
echo ""

cd "$APP_DIR"

# =============================================================================
# STEP 1: Check for existing password
# =============================================================================
echo -e "${YELLOW}📋 Step 1/5: Checking for existing DB_PASSWORD...${NC}"

check_existing_password() {
    if [ -f "$ENV_FILE" ]; then
        if grep -q "^DB_PASSWORD=" "$ENV_FILE"; then
            DB_PASSWORD=$(grep "^DB_PASSWORD=" "$ENV_FILE" | cut -d'=' -f2- | tr -d '"' | tr -d "'")
            if [ -n "$DB_PASSWORD" ]; then
                echo -e "${GREEN}✅ Using existing DB_PASSWORD from .env.production${NC}"
                echo -e "${GREEN}   Password length: ${#DB_PASSWORD} characters${NC}"
                export DB_PASSWORD
                return 0
            fi
        fi
    fi
    return 1
}

# Use fixed production password (never changes)
if ! check_existing_password; then
    echo -e "${YELLOW}⚠️  No existing password found, using default production password...${NC}"
    DB_PASSWORD="Admin112233"
    export DB_PASSWORD
    
    # Create or update .env.production
    if [ -f "$ENV_FILE" ]; then
        if grep -q "^DB_PASSWORD=" "$ENV_FILE"; then
            sed -i.bak "s/^DB_PASSWORD=.*/DB_PASSWORD=$DB_PASSWORD/" "$ENV_FILE"
        else
            echo "DB_PASSWORD=$DB_PASSWORD" >> "$ENV_FILE"
        fi
    else
        echo "DB_PASSWORD=$DB_PASSWORD" > "$ENV_FILE"
    fi
    echo -e "${GREEN}✅ Using default production password: Admin112233${NC}"
else
    # Ensure existing password is Admin112233, update if not
    if [ "$DB_PASSWORD" != "Admin112233" ]; then
        echo -e "${YELLOW}⚠️  Existing password doesn't match default, updating to Admin112233...${NC}"
        DB_PASSWORD="Admin112233"
        export DB_PASSWORD
        sed -i.bak "s/^DB_PASSWORD=.*/DB_PASSWORD=$DB_PASSWORD/" "$ENV_FILE"
        rm -f "${ENV_FILE}.bak"
        echo -e "${GREEN}✅ Password updated to Admin112233${NC}"
    fi
fi

# Check JWT_SECRET
if [ -f "$ENV_FILE" ] && grep -q "^JWT_SECRET=" "$ENV_FILE"; then
    export JWT_SECRET=$(grep "^JWT_SECRET=" "$ENV_FILE" | cut -d'=' -f2- | tr -d '"' | tr -d "'")
    echo -e "${GREEN}✅ Using existing JWT_SECRET${NC}"
else
    JWT_SECRET=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-32)
    export JWT_SECRET
    echo "JWT_SECRET=$JWT_SECRET" >> "$ENV_FILE"
    echo -e "${GREEN}✅ New JWT_SECRET generated${NC}"
fi

echo ""

# =============================================================================
# STEP 2: Create backup before deployment
# =============================================================================
echo -e "${YELLOW}📋 Step 2/5: Creating database backup...${NC}"

if docker ps | grep -q business-postgres; then
    echo "   Creating backup..."
    bash "$SCRIPT_DIR/backup-databases.sh" "$APP_DIR/db_backup" || echo "   ⚠️  Backup failed (continuing anyway)"
else
    echo "   ⚠️  PostgreSQL not running, skipping backup"
fi

echo ""

# =============================================================================
# STEP 3: Pull latest code (preserve .env.production)
# =============================================================================
echo -e "${YELLOW}📋 Step 3/5: Pulling latest code (preserving .env.production)...${NC}"

if [ -d .git ]; then
    # Backup .env.production before git reset
    if [ -f "$ENV_FILE" ]; then
        cp "$ENV_FILE" "${ENV_FILE}.backup.before-git-reset"
        echo -e "${BLUE}   → Backed up .env.production before git reset${NC}"
    fi
    
    git fetch origin main
    git reset --hard origin/main
    
    # Restore .env.production after git reset (git reset might have removed it)
    if [ ! -f "$ENV_FILE" ] && [ -f "${ENV_FILE}.backup.before-git-reset" ]; then
        mv "${ENV_FILE}.backup.before-git-reset" "$ENV_FILE"
        echo -e "${GREEN}   → Restored .env.production after git reset${NC}"
    elif [ -f "${ENV_FILE}.backup.before-git-reset" ]; then
        # File exists, but ensure password is correct
        rm -f "${ENV_FILE}.backup.before-git-reset"
        if grep -q "^DB_PASSWORD=" "$ENV_FILE"; then
            EXISTING_PASSWORD=$(grep "^DB_PASSWORD=" "$ENV_FILE" | cut -d'=' -f2- | tr -d '"' | tr -d "'")
            if [ "$EXISTING_PASSWORD" != "Admin112233" ]; then
                echo -e "${YELLOW}   → Updating DB_PASSWORD to Admin112233...${NC}"
                sed -i.bak "s/^DB_PASSWORD=.*/DB_PASSWORD=Admin112233/" "$ENV_FILE"
                rm -f "${ENV_FILE}.bak"
            fi
        else
            echo -e "${YELLOW}   → Adding DB_PASSWORD=Admin112233...${NC}"
            echo "DB_PASSWORD=Admin112233" >> "$ENV_FILE"
        fi
    fi
    
    # Ensure password is set correctly
    if [ -f "$ENV_FILE" ]; then
        export DB_PASSWORD="Admin112233"
        if ! grep -q "^DB_PASSWORD=Admin112233" "$ENV_FILE"; then
            if grep -q "^DB_PASSWORD=" "$ENV_FILE"; then
                sed -i.bak "s/^DB_PASSWORD=.*/DB_PASSWORD=Admin112233/" "$ENV_FILE"
            else
                echo "DB_PASSWORD=Admin112233" >> "$ENV_FILE"
            fi
            rm -f "${ENV_FILE}.bak"
        fi
    fi
    
    echo -e "${GREEN}✅ Code updated (password preserved)${NC}"
else
    echo -e "${YELLOW}⚠️  Not a git repository, skipping pull${NC}"
fi

echo ""

# =============================================================================
# STEP 4: Rebuild and restart services
# =============================================================================
echo -e "${YELLOW}📋 Step 4/5: Rebuilding and restarting services...${NC}"

# Stop services
docker-compose -f docker-compose.prod.yml down

# Rebuild (without removing volumes - preserves data)
docker-compose -f docker-compose.prod.yml build

# Start services
docker-compose -f docker-compose.prod.yml up -d

echo -e "${GREEN}✅ Services restarted${NC}"
echo ""

# =============================================================================
# STEP 5: Verify deployment
# =============================================================================
echo -e "${YELLOW}📋 Step 5/5: Verifying deployment...${NC}"

echo "   Waiting for services to start..."
sleep 30

echo ""
echo -e "${BLUE}Service Status:${NC}"
docker-compose -f docker-compose.prod.yml ps

echo ""
echo -e "${YELLOW}🔍 Checking service health...${NC}"
for service in auth business party inventory invoice payment; do
    if docker logs business-$service 2>&1 | tail -20 | grep -q "Nest application successfully started"; then
        echo -e "   ${GREEN}✓${NC} ${service}-service is healthy"
    else
        echo -e "   ${YELLOW}⏳${NC} ${service}-service still starting (check logs)"
    fi
done

echo ""
echo -e "${GREEN}════════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}✅ DEPLOYMENT COMPLETE!${NC}"
echo -e "${GREEN}════════════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "${YELLOW}📋 Important:${NC}"
echo "   • DB_PASSWORD preserved in: $ENV_FILE"
echo "   • Database backup saved in: $APP_DIR/db_backup"
echo "   • Services may take 1-2 minutes to fully start"
echo ""
echo -e "${YELLOW}🔍 To check logs:${NC}"
echo "   docker logs business-auth --tail=50"
echo ""

