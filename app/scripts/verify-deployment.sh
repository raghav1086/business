#!/bin/bash
# Post-deployment verification script
# Run this on EC2 instance to verify everything is working

set -e

echo "🔍 Verifying Business App Deployment"
echo "====================================="
echo ""

# Check Docker services
echo "📦 Checking Docker services..."
SERVICES=("business-postgres" "business-redis" "business-auth" "business-business" "business-party" "business-inventory" "business-invoice" "business-payment" "business-web-app")

ALL_RUNNING=true
for service in "${SERVICES[@]}"; do
    if docker ps --format '{{.Names}}' | grep -q "^${service}$"; then
        STATUS=$(docker inspect --format='{{.State.Status}}' $service 2>/dev/null || echo "unknown")
        if [ "$STATUS" = "running" ]; then
            echo "✅ $service: Running"
        else
            echo "⚠️  $service: $STATUS"
            ALL_RUNNING=false
        fi
    else
        echo "❌ $service: Not found"
        ALL_RUNNING=false
    fi
done

if [ "$ALL_RUNNING" = false ]; then
    echo ""
    echo "⚠️  Some services are not running. Check logs:"
    echo "   docker-compose -f docker-compose.prod.yml logs"
    exit 1
fi

echo ""
echo "✅ All Docker services are running"
echo ""

# Check PostgreSQL databases
echo "🗄️  Checking PostgreSQL databases..."
DB_LIST=$(docker exec business-postgres psql -U postgres -t -c "SELECT datname FROM pg_database WHERE datname LIKE '%_db';" 2>/dev/null | tr -d ' ' || echo "")

EXPECTED_DBS=("auth_db" "business_db" "party_db" "inventory_db" "invoice_db" "payment_db")
ALL_DBS_EXIST=true

for db in "${EXPECTED_DBS[@]}"; do
    if echo "$DB_LIST" | grep -q "^${db}$"; then
        echo "✅ Database $db exists"
    else
        echo "❌ Database $db not found"
        ALL_DBS_EXIST=false
    fi
done

if [ "$ALL_DBS_EXIST" = false ]; then
    echo ""
    echo "⚠️  Some databases are missing. Check init-db.sql"
    exit 1
fi

echo ""
echo "✅ All databases exist"
echo ""

# Check database tables
echo "📊 Checking database tables..."
for db in "${EXPECTED_DBS[@]}"; do
    TABLE_COUNT=$(docker exec business-postgres psql -U postgres -d $db -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" 2>/dev/null | tr -d ' ' || echo "0")
    if [ "$TABLE_COUNT" != "0" ] && [ -n "$TABLE_COUNT" ]; then
        echo "✅ $db: $TABLE_COUNT tables"
    else
        echo "⚠️  $db: No tables found (may still be creating)"
    fi
done

echo ""

# Check service health endpoints
echo "🏥 Checking service health..."
HEALTH_ENDPOINTS=(
    "http://localhost:3002/health:Auth Service"
    "http://localhost:3003/health:Business Service"
    "http://localhost:3004/health:Party Service"
    "http://localhost:3005/health:Inventory Service"
    "http://localhost:3006/health:Invoice Service"
    "http://localhost:3007/health:Payment Service"
)

ALL_HEALTHY=true
for endpoint_info in "${HEALTH_ENDPOINTS[@]}"; do
    IFS=':' read -r endpoint name <<< "$endpoint_info"
    if curl -s -f -m 5 "$endpoint" > /dev/null 2>&1; then
        echo "✅ $name: Healthy"
    else
        echo "⚠️  $name: Not responding"
        ALL_HEALTHY=false
    fi
done

echo ""

# Check Nginx
echo "🌐 Checking Nginx..."
if systemctl is-active --quiet nginx; then
    echo "✅ Nginx: Running"
    if curl -s -f -m 5 "http://localhost" > /dev/null 2>&1; then
        echo "✅ Web App: Accessible via Nginx"
    else
        echo "⚠️  Web App: Not accessible via Nginx"
    fi
else
    echo "❌ Nginx: Not running"
    echo "   Run: sudo systemctl start nginx"
fi

echo ""
echo "═══════════════════════════════════════════════════════════════"
if [ "$ALL_RUNNING" = true ] && [ "$ALL_DBS_EXIST" = true ] && [ "$ALL_HEALTHY" = true ]; then
    echo "✅ DEPLOYMENT VERIFICATION: SUCCESS"
    echo "═══════════════════════════════════════════════════════════════"
    echo ""
    echo "🌐 Your application should be accessible at:"
    PUBLIC_IP=$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4 2>/dev/null || echo "localhost")
    echo "   http://$PUBLIC_IP"
    echo ""
    exit 0
else
    echo "⚠️  DEPLOYMENT VERIFICATION: SOME ISSUES DETECTED"
    echo "═══════════════════════════════════════════════════════════════"
    echo ""
    echo "📋 Troubleshooting:"
    echo "   1. Check service logs: docker-compose -f docker-compose.prod.yml logs"
    echo "   2. Check specific service: docker logs <service-name>"
    echo "   3. Restart services: docker-compose -f docker-compose.prod.yml restart"
    echo ""
    exit 1
fi

