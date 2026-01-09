#!/bin/bash
# =============================================================================
# SERVICE-BASED EC2 DEPLOYMENT SCRIPT
# =============================================================================
# Deploys specific services to EC2 instance by:
# 1. Fetching latest code from main branch
# 2. Rebuilding only changed services
# 3. Restarting services
# =============================================================================

set -e

# Configuration
REGION=${1:-ap-south-1}
KEY_NAME=${2:-business-app-key}
SERVICES=${3:-all}  # Comma-separated list of services or "all"
AWS_PROFILE=${AWS_PROFILE:-business-app}
INSTANCE_TAG=${4:-business-app-beta}

AWS_CMD="aws --profile $AWS_PROFILE"
export AWS_PROFILE

echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║     SERVICE-BASED EC2 DEPLOYMENT                               ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""
echo "📋 Configuration:"
echo "   Region: $REGION"
echo "   Key Name: $KEY_NAME"
echo "   Services: $SERVICES"
echo "   Instance Tag: $INSTANCE_TAG"
echo ""

# =============================================================================
# SECTION 1: FIND EC2 INSTANCE
# =============================================================================
echo "🔍 Step 1/4: Finding EC2 instance..."

INSTANCE_ID=$($AWS_CMD ec2 describe-instances \
    --region $REGION \
    --filters "Name=tag:Name,Values=$INSTANCE_TAG" "Name=instance-state-name,Values=running" \
    --query 'Reservations[0].Instances[0].InstanceId' \
    --output text)

if [ -z "$INSTANCE_ID" ] || [ "$INSTANCE_ID" == "None" ]; then
    echo "❌ No running EC2 instance found with tag: $INSTANCE_TAG"
    echo ""
    echo "Available instances:"
    $AWS_CMD ec2 describe-instances \
        --region $REGION \
        --filters "Name=instance-state-name,Values=running" \
        --query 'Reservations[*].Instances[*].[InstanceId,Tags[?Key==`Name`].Value|[0],PublicIpAddress]' \
        --output table
    exit 1
fi

PUBLIC_IP=$($AWS_CMD ec2 describe-instances \
    --region $REGION \
    --instance-ids $INSTANCE_ID \
    --query 'Reservations[0].Instances[0].PublicIpAddress' \
    --output text)

if [ -z "$PUBLIC_IP" ] || [ "$PUBLIC_IP" == "None" ]; then
    echo "⚠️  Public IP not available. Instance may be in a private subnet."
    echo "   Instance ID: $INSTANCE_ID"
    exit 1
fi

echo "✅ Found instance: $INSTANCE_ID"
echo "✅ Public IP: $PUBLIC_IP"
echo ""

# =============================================================================
# SECTION 2: VERIFY SSH KEY
# =============================================================================
echo "🔑 Step 2/4: Verifying SSH key..."

SSH_KEY_FILE="$HOME/.ssh/$KEY_NAME.pem"
if [ ! -f "$SSH_KEY_FILE" ]; then
    echo "❌ SSH key not found: $SSH_KEY_FILE"
    echo ""
    echo "Please ensure the SSH key exists at: $SSH_KEY_FILE"
    echo "Or download it from AWS:"
    echo "   aws ec2 describe-key-pairs --region $REGION --key-names $KEY_NAME"
    exit 1
fi

chmod 600 "$SSH_KEY_FILE"
echo "✅ SSH key: $SSH_KEY_FILE"
echo ""

# =============================================================================
# SECTION 3: DEPLOY SERVICES
# =============================================================================
echo "🚀 Step 3/4: Deploying services to EC2..."

# Test SSH connection first
echo "   Testing SSH connection..."
if ! ssh -i "$SSH_KEY_FILE" \
    -o StrictHostKeyChecking=no \
    -o ConnectTimeout=10 \
    -o UserKnownHostsFile=/dev/null \
    ec2-user@$PUBLIC_IP "echo 'SSH connection successful'" > /dev/null 2>&1; then
    echo "❌ Failed to connect to EC2 instance"
    echo "   Please verify:"
    echo "   1. Instance is running"
    echo "   2. Security group allows SSH (port 22)"
    echo "   3. SSH key is correct"
    exit 1
fi

echo "   ✅ SSH connection successful"
echo ""

# Deploy services
ssh -i "$SSH_KEY_FILE" \
    -o StrictHostKeyChecking=no \
    -o UserKnownHostsFile=/dev/null \
    ec2-user@$PUBLIC_IP << DEPLOY_SCRIPT
set -e

echo "📦 Fetching latest code from main branch..."
cd /opt/business-app

# Check if git repo exists
if [ ! -d .git ]; then
    echo "❌ Git repository not found. Initializing..."
    git init
    git remote add origin https://github.com/ashishnimrot/business.git || true
fi

# Fetch and reset to latest main
git fetch origin main
git reset --hard origin/main
git clean -fd

echo "✅ Code updated to latest main"
echo "   Current commit: \$(git rev-parse --short HEAD)"
echo ""

# Determine which services to rebuild
SERVICES_TO_REBUILD="$SERVICES"

echo "🔨 Rebuilding and restarting services: \$SERVICES_TO_REBUILD"
echo ""

cd /opt/business-app/app

# CRITICAL: Ensure .env.production exists with fixed password before loading
if [ ! -f .env.production ]; then
    echo "⚠️  .env.production not found, creating with default production password..."
    DB_PASSWORD="Admin112233"
    # Try to preserve JWT_SECRET if .env exists
    if [ -f .env ] && grep -q "^JWT_SECRET=" .env; then
        JWT_SECRET=$(grep "^JWT_SECRET=" .env | cut -d'=' -f2- | tr -d '"' | tr -d "'")
    else
        JWT_SECRET=$(openssl rand -base64 64 | tr -d "=+/" | cut -c1-64)
    fi
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
set -a
source .env.production
set +a
echo "✅ Loaded environment variables (DB_PASSWORD=Admin112233)"

# Function to rebuild and restart a service
rebuild_service() {
    local service=\$1
    echo "🔄 Rebuilding \$service..."
    docker-compose -f docker-compose.prod.yml build \$service || {
        echo "❌ Failed to build \$service"
        return 1
    }
    echo "🔄 Restarting \$service..."
    docker-compose -f docker-compose.prod.yml up -d \$service || {
        echo "❌ Failed to restart \$service"
        return 1
    }
    echo "✅ \$service rebuilt and restarted"
    echo ""
}

# Rebuild services based on what changed
if [ "\$SERVICES_TO_REBUILD" == "all" ] || echo "\$SERVICES_TO_REBUILD" | grep -q "shared"; then
    echo "🔄 Shared libraries or all services changed, rebuilding everything..."
    docker-compose -f docker-compose.prod.yml build
    docker-compose -f docker-compose.prod.yml up -d
    echo "✅ All services rebuilt and restarted"
else
    # Rebuild individual services
    if echo "\$SERVICES_TO_REBUILD" | grep -q "auth-service"; then
        rebuild_service auth-service
    fi
    
    if echo "\$SERVICES_TO_REBUILD" | grep -q "business-service"; then
        rebuild_service business-service
    fi
    
    if echo "\$SERVICES_TO_REBUILD" | grep -q "party-service"; then
        rebuild_service party-service
    fi
    
    if echo "\$SERVICES_TO_REBUILD" | grep -q "inventory-service"; then
        rebuild_service inventory-service
    fi
    
    if echo "\$SERVICES_TO_REBUILD" | grep -q "invoice-service"; then
        rebuild_service invoice-service
    fi
    
    if echo "\$SERVICES_TO_REBUILD" | grep -q "payment-service"; then
        rebuild_service payment-service
    fi
    
    if echo "\$SERVICES_TO_REBUILD" | grep -q "web-app"; then
        rebuild_service web-app
    fi
fi

echo "⏳ Waiting for services to be healthy..."
sleep 30

echo ""
echo "📊 Service status:"
docker-compose -f docker-compose.prod.yml ps

echo ""
echo "✅ Deployment complete!"

DEPLOY_SCRIPT

echo "✅ Services deployed successfully"
echo ""

# =============================================================================
# SECTION 4: VERIFY DEPLOYMENT
# =============================================================================
echo "🔍 Step 4/4: Verifying deployment..."

sleep 10

# Check service status
echo "   Checking service status..."
ssh -i "$SSH_KEY_FILE" \
    -o StrictHostKeyChecking=no \
    -o UserKnownHostsFile=/dev/null \
    ec2-user@$PUBLIC_IP \
    "cd /opt/business-app/app && docker-compose -f docker-compose.prod.yml ps" || true

echo ""

# Check if web app is accessible
echo "   Checking web app accessibility..."
if curl -f -s -m 10 "http://$PUBLIC_IP" > /dev/null 2>&1; then
    echo "✅ Web app is accessible at http://$PUBLIC_IP"
else
    echo "⚠️  Web app may not be fully ready yet"
    echo "   Check logs: ssh -i $SSH_KEY_FILE ec2-user@$PUBLIC_IP 'cd /opt/business-app/app && docker-compose -f docker-compose.prod.yml logs --tail=50'"
fi

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "🎉 DEPLOYMENT COMPLETE!"
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo "📋 Summary:"
echo "   Instance ID: $INSTANCE_ID"
echo "   Public IP: $PUBLIC_IP"
echo "   Services Deployed: $SERVICES"
echo ""
echo "🌐 Application URL: http://$PUBLIC_IP"
echo ""
echo "📊 Useful commands:"
echo "   Check status: ssh -i $SSH_KEY_FILE ec2-user@$PUBLIC_IP 'cd /opt/business-app/app && docker-compose -f docker-compose.prod.yml ps'"
echo "   View logs: ssh -i $SSH_KEY_FILE ec2-user@$PUBLIC_IP 'cd /opt/business-app/app && docker-compose -f docker-compose.prod.yml logs --tail=50'"
echo "   Restart service: ssh -i $SSH_KEY_FILE ec2-user@$PUBLIC_IP 'cd /opt/business-app/app && docker-compose -f docker-compose.prod.yml restart <service-name>'"
echo ""


