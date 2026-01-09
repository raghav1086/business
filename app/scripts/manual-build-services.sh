#!/bin/bash
# Manual service build script - Build services one by one
# This helps identify which service has issues and allows retrying individual services

set -e

echo "🔨 Manual Service Build Script"
echo "==============================="
echo ""
echo "This script will build each service individually"
echo "You can stop and retry any service if it fails"
echo ""

cd /opt/business-app/app

# CRITICAL: Ensure .env.production exists with fixed password before loading
if [ ! -f .env.production ]; then
    echo "⚠️  .env.production not found, creating with default production password..."
    DB_PASSWORD="Admin112233"
    JWT_SECRET=$(openssl rand -base64 64 | tr -d "=+/" | cut -c1-64)
    printf "DB_PASSWORD=%s\nJWT_SECRET=%s\nENABLE_SYNC=true\nENABLE_FAKE_OTP=true\n" \
      "$DB_PASSWORD" "$JWT_SECRET" > .env.production
    echo "✅ Created .env.production with production password: Admin112233"
else
    # Ensure DB_PASSWORD is Admin112233 (update if different)
    if grep -q "^DB_PASSWORD=" .env.production; then
        EXISTING_PASSWORD=$(grep "^DB_PASSWORD=" .env.production | cut -d'=' -f2- | tr -d '"' | tr -d "'")
        if [ "$EXISTING_PASSWORD" != "Admin112233" ]; then
            echo "⚠️  DB_PASSWORD doesn't match production default, updating to Admin112233..."
            sed -i.bak "s/^DB_PASSWORD=.*/DB_PASSWORD=Admin112233/" .env.production
            rm -f .env.production.bak
            echo "✅ Updated DB_PASSWORD to Admin112233"
        fi
    else
        echo "⚠️  DB_PASSWORD not found in .env.production, adding..."
        echo "DB_PASSWORD=Admin112233" >> .env.production
        echo "✅ Added DB_PASSWORD=Admin112233"
    fi
fi

# Load environment variables
echo "📋 Loading environment variables..."
while IFS= read -r line || [ -n "$line" ]; do
    [[ -z "$line" || "$line" =~ ^[[:space:]]*# ]] && continue
    if [[ "$line" =~ ^[A-Z_][A-Z0-9_]*= ]]; then
        key="${line%%=*}"
        value="${line#*=}"
        key=$(echo "$key" | xargs)
        value=$(echo "$value" | xargs)
        value=$(echo "$value" | sed "s/^['\"]//; s/['\"]\$//")
        export "$key=$value"
    fi
done < .env.production
echo "✅ Environment variables loaded (DB_PASSWORD=Admin112233)"
echo ""

# List of services to build
SERVICES=(
    "auth-service"
    "business-service"
    "party-service"
    "inventory-service"
    "invoice-service"
    "payment-service"
    "web-app"
)

# Function to build a single service
build_service() {
    local service=$1
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "🔨 Building: $service"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    
    # Build with retry logic
    MAX_ATTEMPTS=3
    ATTEMPT=1
    
    while [ $ATTEMPT -le $MAX_ATTEMPTS ]; do
        echo "📦 Attempt $ATTEMPT/$MAX_ATTEMPTS for $service..."
        
        if docker-compose -f docker-compose.prod.yml build "$service"; then
            echo ""
            echo "✅ $service built successfully!"
            return 0
        else
            if [ $ATTEMPT -lt $MAX_ATTEMPTS ]; then
                echo ""
                echo "⚠️  Build failed, waiting 30 seconds before retry..."
                sleep 30
                ATTEMPT=$((ATTEMPT + 1))
            else
                echo ""
                echo "❌ $service failed after $MAX_ATTEMPTS attempts"
                echo ""
                echo "💡 You can:"
                echo "   1. Try building this service again manually:"
                echo "      docker-compose -f docker-compose.prod.yml build $service"
                echo ""
                echo "   2. Skip this service and continue with others"
                echo ""
                echo "   3. Check the error above for details"
                echo ""
                read -p "Continue with next service? (y/n): " continue_choice
                if [[ ! "$continue_choice" =~ ^[Yy]$ ]]; then
                    echo "Build process stopped by user"
                    exit 1
                fi
                return 1
            fi
        fi
    done
}

# Ask user if they want to build all or select specific services
echo "Build options:"
echo "  1. Build all services (one by one)"
echo "  2. Build specific services"
echo ""
read -p "Choose option (1 or 2): " build_option

if [ "$build_option" = "2" ]; then
    echo ""
    echo "Available services:"
    for i in "${!SERVICES[@]}"; do
        echo "  $((i+1)). ${SERVICES[$i]}"
    done
    echo ""
    read -p "Enter service numbers (comma-separated, e.g., 1,2,3): " selected
    
    # Parse selected services
    IFS=',' read -ra SELECTED_NUMS <<< "$selected"
    SELECTED_SERVICES=()
    for num in "${SELECTED_NUMS[@]}"; do
        num=$(echo "$num" | xargs) # trim whitespace
        if [ "$num" -ge 1 ] && [ "$num" -le "${#SERVICES[@]}" ]; then
            SELECTED_SERVICES+=("${SERVICES[$((num-1))]}")
        fi
    done
    
    if [ ${#SELECTED_SERVICES[@]} -eq 0 ]; then
        echo "❌ No valid services selected"
        exit 1
    fi
    
    SERVICES=("${SELECTED_SERVICES[@]}")
fi

# Build each service
echo ""
echo "🚀 Starting manual build process..."
echo "   Total services: ${#SERVICES[@]}"
echo ""

SUCCESSFUL=()
FAILED=()

for service in "${SERVICES[@]}"; do
    if build_service "$service"; then
        SUCCESSFUL+=("$service")
    else
        FAILED+=("$service")
    fi
done

# Summary
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 Build Summary"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "✅ Successfully built (${#SUCCESSFUL[@]}):"
for service in "${SUCCESSFUL[@]}"; do
    echo "   - $service"
done

if [ ${#FAILED[@]} -gt 0 ]; then
    echo ""
    echo "❌ Failed (${#FAILED[@]}):"
    for service in "${FAILED[@]}"; do
        echo "   - $service"
    done
    echo ""
    echo "💡 To retry failed services:"
    echo "   docker-compose -f docker-compose.prod.yml build <service-name>"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Ask if user wants to start services
if [ ${#FAILED[@]} -eq 0 ]; then
    echo "✅ All services built successfully!"
    read -p "Start all services now? (y/n): " start_services
    if [[ "$start_services" =~ ^[Yy]$ ]]; then
        echo ""
        echo "🚀 Starting all services..."
        docker-compose -f docker-compose.prod.yml up -d
        echo ""
        echo "⏳ Waiting 30 seconds for services to start..."
        sleep 30
        echo ""
        echo "📊 Service status:"
        docker-compose -f docker-compose.prod.yml ps
    fi
else
    echo "⚠️  Some services failed to build"
    echo "   You can start the successfully built services manually:"
    echo "   docker-compose -f docker-compose.prod.yml up -d"
fi

echo ""
echo "✅ Manual build process complete!"

