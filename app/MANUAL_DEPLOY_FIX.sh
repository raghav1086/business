#!/bin/bash
# Manual deployment fix script
# Run this on the EC2 instance to complete the deployment

set -e

echo "🔧 Manual Deployment Fix"
echo "========================"
echo ""

# Fix package installation
echo "1. Installing required packages..."
sudo yum update -y -q
sudo yum install -y docker git --allowerasing || sudo yum install -y docker git
sudo yum install -y curl --allowerasing || sudo yum install -y curl

# Start Docker
echo "2. Starting Docker..."
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -a -G docker ec2-user

# Install Docker Compose
echo "3. Installing Docker Compose..."
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Install Nginx
echo "4. Installing Nginx..."
sudo yum install -y nginx
sudo systemctl enable nginx

# Install Node.js
echo "5. Installing Node.js..."
curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash - >/dev/null 2>&1
sudo yum install -y nodejs >/dev/null 2>&1

# Create app directory
echo "6. Setting up application directory..."
sudo mkdir -p /opt/business-app
sudo chown ec2-user:ec2-user /opt/business-app
cd /opt/business-app

# Clone repository
echo "7. Cloning repository..."
for attempt in {1..3}; do
    if sudo -u ec2-user git clone https://github.com/ashishnimrot/business.git . 2>/dev/null; then
        echo "✅ Repository cloned successfully"
        break
    fi
    if [ $attempt -lt 3 ]; then
        echo "⚠️  Clone attempt $attempt failed, retrying in 10 seconds..."
        sleep 10
    else
        echo "❌ Failed to clone repository after 3 attempts"
        exit 1
    fi
done

# Use fixed production password (never changes)
echo "8. Setting up production password..."
DB_PASSWORD="Admin112233"
JWT_SECRET=$(openssl rand -base64 64 | tr -d "=+/" | cut -c1-64)
JWT_REFRESH_SECRET=$(openssl rand -base64 64 | tr -d "=+/" | cut -c1-64)

# Create production environment file
echo "9. Creating environment configuration..."
cd /opt/business-app/app
sudo -u ec2-user cat > .env.production <<ENV_EOF
DB_PASSWORD=${DB_PASSWORD}
JWT_SECRET=${JWT_SECRET}
JWT_REFRESH_SECRET=${JWT_REFRESH_SECRET}
ENABLE_SYNC=true
ENV_EOF

# Wait for Docker to be ready
echo "10. Waiting for Docker to be ready..."
for i in {1..30}; do
    if sudo docker ps &>/dev/null; then
        break
    fi
    sleep 2
done

# Build services
echo "11. Building Docker images (this may take 10-15 minutes)..."
cd /opt/business-app/app
sudo -u ec2-user docker-compose -f docker-compose.prod.yml build --no-cache || {
    echo "⚠️  Build failed, retrying..."
    sleep 10
    sudo -u ec2-user docker-compose -f docker-compose.prod.yml build --no-cache
}

# Start services
echo "12. Starting services..."
sudo -u ec2-user docker-compose -f docker-compose.prod.yml up -d

# Wait for services
echo "13. Waiting for services to start..."
sleep 60

# Setup Nginx
echo "14. Configuring Nginx..."
PUBLIC_IP=$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4)

sudo tee /etc/nginx/conf.d/business-app.conf <<NGINX_EOF
upstream auth_service { server localhost:3002; }
upstream business_service { server localhost:3003; }
upstream party_service { server localhost:3004; }
upstream inventory_service { server localhost:3005; }
upstream invoice_service { server localhost:3006; }
upstream payment_service { server localhost:3007; }
upstream web_app { server localhost:3000; }

server {
    listen 80;
    server_name _;
    
    location / {
        proxy_pass http://web_app;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
    
    location /api/v1/auth/ {
        proxy_pass http://auth_service;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
    
    location /api/v1/business/ {
        proxy_pass http://business_service;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
    
    location /api/v1/party/ {
        proxy_pass http://party_service;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
    
    location /api/v1/inventory/ {
        proxy_pass http://inventory_service;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
    
    location /api/v1/invoice/ {
        proxy_pass http://invoice_service;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
    
    location /api/v1/payment/ {
        proxy_pass http://payment_service;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
NGINX_EOF

# Test and restart Nginx
if sudo nginx -t; then
    sudo systemctl restart nginx
    echo "✅ Nginx configured and started"
else
    echo "⚠️  Nginx configuration test failed"
fi

echo ""
echo "✅ Deployment complete!"
echo "🌐 Application should be available at: http://$PUBLIC_IP"
echo ""
echo "Check status:"
echo "  docker ps"
echo "  sudo systemctl status nginx"

