#!/bin/bash
# Quick fix script to run on the EC2 instance to fix deployment issues

set -e

echo "🔧 Fixing deployment issues on EC2 instance..."
echo ""

# Fix 1: Recreate .env.production with proper format
echo "1. Fixing .env.production file..."
cd /opt/business-app/app

# Read existing values or generate new ones
if [ -f .env.production ]; then
    # Extract existing values
    DB_PASSWORD=$(grep "^DB_PASSWORD=" .env.production | cut -d'=' -f2- || openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)
    JWT_SECRET=$(grep "^JWT_SECRET=" .env.production | cut -d'=' -f2- || openssl rand -base64 64 | tr -d "=+/" | cut -c1-64)
    JWT_REFRESH_SECRET=$(grep "^JWT_REFRESH_SECRET=" .env.production | cut -d'=' -f2- || openssl rand -base64 64 | tr -d "=+/" | cut -c1-64)
else
    # Generate new values
    DB_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)
    JWT_SECRET=$(openssl rand -base64 64 | tr -d "=+/" | cut -c1-64)
    JWT_REFRESH_SECRET=$(openssl rand -base64 64 | tr -d "=+/" | cut -c1-64)
fi

# Create properly formatted .env.production
cat > .env.production <<EOF
DB_PASSWORD=${DB_PASSWORD}
JWT_SECRET=${JWT_SECRET}
JWT_REFRESH_SECRET=${JWT_REFRESH_SECRET}
ENABLE_SYNC=true
ENABLE_FAKE_OTP=true
EOF

# Also create .env
cp .env.production .env
chown ec2-user:ec2-user .env .env.production
echo "✅ .env.production fixed"

# Fix 2: Fix Docker Buildx permissions
echo ""
echo "2. Fixing Docker Buildx permissions..."
sudo mkdir -p /home/ec2-user/.docker/cli-plugins
sudo chown -R ec2-user:ec2-user /home/ec2-user/.docker

# Download and install Buildx if not present
if [ ! -f /home/ec2-user/.docker/cli-plugins/docker-buildx ]; then
    BUILDX_VERSION="v0.17.0"
    curl -L "https://github.com/docker/buildx/releases/download/${BUILDX_VERSION}/buildx-${BUILDX_VERSION}.linux-amd64" -o /tmp/docker-buildx 2>/dev/null || {
        curl -L "https://github.com/docker/buildx/releases/latest/download/buildx-linux-amd64" -o /tmp/docker-buildx 2>/dev/null || true
    }
    
    if [ -f /tmp/docker-buildx ]; then
        chmod +x /tmp/docker-buildx
        sudo cp /tmp/docker-buildx /home/ec2-user/.docker/cli-plugins/docker-buildx
        sudo chmod +x /home/ec2-user/.docker/cli-plugins/docker-buildx
        sudo chown ec2-user:ec2-user /home/ec2-user/.docker/cli-plugins/docker-buildx
        echo "✅ Docker Buildx installed"
    fi
else
    echo "✅ Docker Buildx already installed"
fi

# Fix 3: Ensure Docker permissions
echo ""
echo "3. Fixing Docker permissions..."
sudo chmod 666 /var/run/docker.sock 2>/dev/null || true
sudo usermod -a -G docker ec2-user 2>/dev/null || true

# Fix 4: Rebuild and start services
echo ""
echo "4. Rebuilding and starting services..."
cd /opt/business-app/app

# Load environment variables safely
export $(grep -v '^#' .env.production | xargs)

# Stop any running containers
docker-compose -f docker-compose.prod.yml down 2>/dev/null || true

# Build images
echo "🔨 Building Docker images..."
docker-compose -f docker-compose.prod.yml build

# Start services
echo "🚀 Starting services..."
docker-compose -f docker-compose.prod.yml up -d

echo ""
echo "✅ Fix complete!"
echo ""
echo "⏳ Waiting for services to start (30 seconds)..."
sleep 30

echo ""
echo "📊 Service status:"
docker-compose -f docker-compose.prod.yml ps

echo ""
echo "✅ Deployment fixed! Check services with: docker ps"

