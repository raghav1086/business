#!/bin/bash
# Script to retry Docker build on EC2 instance after network failures

set -e

echo "🔄 Retrying Docker build with network retry logic..."
echo ""

cd /opt/business-app/app

# Ensure .env files exist and are properly formatted
if [ ! -f .env.production ] || ! grep -q "^DB_PASSWORD=" .env.production 2>/dev/null; then
    echo "⚠️  .env.production not found or invalid, creating..."
    DB_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)
    JWT_SECRET=$(openssl rand -base64 64 | tr -d "=+/" | cut -c1-64)
    JWT_REFRESH_SECRET=$(openssl rand -base64 64 | tr -d "=+/" | cut -c1-64)
    
    printf "DB_PASSWORD=%s\nJWT_SECRET=%s\nJWT_REFRESH_SECRET=%s\nENABLE_SYNC=true\nENABLE_FAKE_OTP=true\n" \
      "$DB_PASSWORD" "$JWT_SECRET" "$JWT_REFRESH_SECRET" > .env.production
    cp .env.production .env
    echo "✅ Created new .env.production"
else
    echo "✅ Using existing .env.production"
    # Validate and fix format if needed
    if grep -q "^[^=]*$" .env.production | grep -v "^#" | grep -v "^$"; then
        echo "⚠️  Found malformed lines in .env.production, fixing..."
        # Extract valid key=value pairs only
        grep "^[A-Z_]*=" .env.production > .env.production.tmp
        mv .env.production.tmp .env.production
    fi
fi

# Load environment variables safely - use a simple approach that docker-compose can also use
# Read each line and export if it's a valid KEY=VALUE format
while IFS= read -r line || [ -n "$line" ]; do
    # Skip empty lines and comments
    [[ -z "$line" || "$line" =~ ^[[:space:]]*# ]] && continue
    # Only process lines with KEY=VALUE format
    if [[ "$line" =~ ^[A-Z_][A-Z0-9_]*= ]]; then
        # Extract key and value
        key="${line%%=*}"
        value="${line#*=}"
        # Remove leading/trailing whitespace
        key=$(echo "$key" | xargs)
        value=$(echo "$value" | xargs)
        # Remove quotes if present
        value=$(echo "$value" | sed "s/^['\"]//; s/['\"]\$//")
        # Export the variable
        export "$key=$value"
    fi
done < .env.production

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

