#!/bin/bash
# Script to retry Docker build on EC2 instance after network failures

set -e

echo "🔄 Retrying Docker build with network retry logic..."
echo ""

cd /opt/business-app/app

# Ensure .env files exist
if [ ! -f .env.production ]; then
    echo "⚠️  .env.production not found, creating..."
    DB_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)
    JWT_SECRET=$(openssl rand -base64 64 | tr -d "=+/" | cut -c1-64)
    JWT_REFRESH_SECRET=$(openssl rand -base64 64 | tr -d "=+/" | cut -c1-64)
    
    printf "DB_PASSWORD=%s\nJWT_SECRET=%s\nJWT_REFRESH_SECRET=%s\nENABLE_SYNC=true\nENABLE_FAKE_OTP=true\n" \
      "$DB_PASSWORD" "$JWT_SECRET" "$JWT_REFRESH_SECRET" > .env.production
    cp .env.production .env
fi

# Load environment variables
export $(grep -v '^#' .env.production | xargs)

# Stop any running containers
echo "🛑 Stopping existing containers..."
docker-compose -f docker-compose.prod.yml down 2>/dev/null || true

# Clean up failed builds
echo "🧹 Cleaning up failed builds..."
docker system prune -f

# Retry build with increased network timeout
echo "🔨 Building Docker images (with retry logic)..."
echo "   This may take 15-20 minutes..."
echo ""

# Build with retry - if it fails, wait and retry
MAX_RETRIES=3
RETRY_COUNT=0

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    echo "📦 Build attempt $((RETRY_COUNT + 1))/$MAX_RETRIES..."
    
    if docker-compose -f docker-compose.prod.yml build; then
        echo "✅ Build successful!"
        break
    else
        RETRY_COUNT=$((RETRY_COUNT + 1))
        if [ $RETRY_COUNT -lt $MAX_RETRIES ]; then
            echo "⚠️  Build failed, waiting 30 seconds before retry..."
            sleep 30
        else
            echo "❌ Build failed after $MAX_RETRIES attempts"
            echo ""
            echo "💡 Troubleshooting tips:"
            echo "   1. Check network connectivity: curl -I https://registry.npmjs.org"
            echo "   2. Check Docker logs: docker-compose -f docker-compose.prod.yml logs"
            echo "   3. Try building individual services: docker-compose -f docker-compose.prod.yml build auth-service"
            exit 1
        fi
    fi
done

# Start services
echo ""
echo "🚀 Starting services..."
docker-compose -f docker-compose.prod.yml up -d

echo ""
echo "⏳ Waiting for services to start (30 seconds)..."
sleep 30

echo ""
echo "📊 Service status:"
docker-compose -f docker-compose.prod.yml ps

echo ""
echo "✅ Build and deployment complete!"
echo ""
echo "🌐 Check services with: docker ps"
echo "📋 View logs with: docker-compose -f docker-compose.prod.yml logs -f"

