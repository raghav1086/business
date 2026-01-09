#!/bin/bash
# Quick script to complete the redeployment - start all application services

set -e

cd /opt/business-app/app

# Load environment variables
export DB_PASSWORD="Admin112233"
if [ -f .env.production ]; then
    while IFS= read -r line || [ -n "$line" ]; do
        [[ -z "$line" || "$line" =~ ^[[:space:]]*# ]] && continue
        if [[ "$line" =~ ^[A-Z_][A-Z0-9_]*= ]]; then
            key="${line%%=*}"
            value="${line#*=}"
            key=$(echo "$key" | xargs)
            value=$(echo "$value" | xargs)
            value=$(echo "$value" | sed "s/^['\"]//; s/['\"]\$//")
            if [ "$key" != "DB_PASSWORD" ]; then
                export "$key=$value"
            fi
        fi
    done < .env.production
fi

# Ensure DB_PASSWORD is set
export DB_PASSWORD="Admin112233"

echo "🚀 Starting all application services..."
echo "   Using password: Admin112233"
echo ""

# Start all services
docker-compose -f docker-compose.prod.yml up -d

echo ""
echo "⏳ Waiting for services to start (30 seconds)..."
sleep 30

echo ""
echo "📊 Service status:"
docker-compose -f docker-compose.prod.yml ps

echo ""
echo "✅ All services started!"
echo ""
echo "🔍 To check logs:"
echo "   docker-compose -f docker-compose.prod.yml logs -f <service-name>"

