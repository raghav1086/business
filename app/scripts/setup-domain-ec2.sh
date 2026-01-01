#!/bin/bash
# Setup Domain on EC2 Instance
# Updates Nginx configuration to recognize the domain name
# Usage: sudo bash scripts/setup-domain-ec2.sh [domain]
# Example: sudo bash scripts/setup-domain-ec2.sh samriddhi.buzz

set -e

DOMAIN=${1:-samriddhi.buzz}
DOMAIN_WWW="www.$DOMAIN"

echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║     DOMAIN SETUP FOR EC2 INSTANCE                              ║"
echo "║     Domain: $DOMAIN                                            ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""

# Check if running as root or with sudo
if [ "$EUID" -ne 0 ]; then 
    echo "⚠️  This script needs sudo privileges"
    echo "   Run: sudo bash $0"
    exit 1
fi

# Step 1: Backup current Nginx config
echo "📋 Step 1/5: Backing up current Nginx configuration..."
if [ -f /etc/nginx/conf.d/business-app.conf ]; then
    cp /etc/nginx/conf.d/business-app.conf /etc/nginx/conf.d/business-app.conf.backup.$(date +%Y%m%d_%H%M%S)
    echo "✅ Backup created"
else
    echo "⚠️  No existing config found, will create new one"
fi
echo ""

# Step 2: Update Nginx configuration
echo "🔧 Step 2/5: Updating Nginx configuration for domain: $DOMAIN..."

# Create/update Nginx config
cat > /etc/nginx/conf.d/business-app.conf <<NGINX_EOF
upstream auth_service { server localhost:3002; }
upstream business_service { server localhost:3003; }
upstream party_service { server localhost:3004; }
upstream inventory_service { server localhost:3005; }
upstream invoice_service { server localhost:3006; }
upstream payment_service { server localhost:3007; }
upstream web_app { server localhost:3000; }

server {
    listen 80;
    server_name $DOMAIN $DOMAIN_WWW;
    
    # CRITICAL: Allow Let's Encrypt validation
    # This MUST come BEFORE location / to prevent redirects
    location /.well-known/acme-challenge/ {
        root /var/www/html;
        try_files \$uri =404;
    }
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    
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
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }
    
    # Auth service - preserve full path
    location /api/v1/auth {
        proxy_pass http://auth_service;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }
    
    # Business service
    location /api/v1/businesses {
        proxy_pass http://business_service;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }
    
    # Party service
    location /api/v1/parties {
        proxy_pass http://party_service;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }
    
    # Inventory service
    location /api/v1/items {
        proxy_pass http://inventory_service;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }
    
    # Stock endpoints
    location /api/v1/stock {
        proxy_pass http://inventory_service;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }
    
    # Invoice service
    location /api/v1/invoices {
        proxy_pass http://invoice_service;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }
    
    # Payment service
    location /api/v1/payments {
        proxy_pass http://payment_service;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }
    
    # Health check endpoint
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
}
NGINX_EOF

echo "✅ Nginx configuration updated"
echo ""

# Step 4: Test Nginx configuration
echo "🧪 Step 4/6: Testing Nginx configuration..."
if nginx -t; then
    echo "✅ Nginx configuration is valid"
else
    echo "❌ Nginx configuration test failed!"
    echo "   Check the error above"
    exit 1
fi
echo ""

# Step 5: Restart Nginx
echo "🔄 Step 5/6: Restarting Nginx..."
systemctl restart nginx
sleep 2

if systemctl is-active --quiet nginx; then
    echo "✅ Nginx is running"
else
    echo "❌ Nginx failed to start"
    systemctl status nginx
    exit 1
fi
echo ""

# Step 6: Verify setup
echo "🔍 Step 6/6: Verifying domain setup..."
echo ""

# Get public IP
PUBLIC_IP=$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4 2>/dev/null || echo "Unable to fetch")

echo "📊 Domain Configuration Summary:"
echo "─────────────────────────────────────────────────────────────"
echo "Domain: $DOMAIN"
echo "WWW Domain: $DOMAIN_WWW"
echo "EC2 Public IP: $PUBLIC_IP"
echo "Nginx Status: $(systemctl is-active nginx)"
echo "─────────────────────────────────────────────────────────────"
echo ""

# Test local connectivity
echo "🧪 Testing local connectivity..."
if curl -s -f -m 5 http://localhost > /dev/null 2>&1; then
    echo "✅ Web app responding on localhost"
else
    echo "⚠️  Web app not responding on localhost (may still be starting)"
fi

if curl -s -f -m 5 http://localhost/api/v1/auth/health > /dev/null 2>&1; then
    echo "✅ Auth API responding"
else
    echo "⚠️  Auth API not responding (may still be starting)"
fi
echo ""

# Check if services are running
echo "📦 Checking Docker services..."
if docker ps | grep -q business-web-app; then
    echo "✅ Web app container: Running"
else
    echo "⚠️  Web app container: Not running"
fi

if docker ps | grep -q business-auth; then
    echo "✅ Auth service container: Running"
else
    echo "⚠️  Auth service container: Not running"
fi
echo ""

echo "═══════════════════════════════════════════════════════════════"
echo "✅ DOMAIN SETUP COMPLETE!"
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo "🌐 Your application should be accessible at:"
echo "   http://$DOMAIN"
echo "   http://$DOMAIN_WWW"
echo ""
echo "⏳ DNS Propagation:"
echo "   DNS changes may take 10-30 minutes to propagate globally"
echo "   Check propagation: https://www.whatsmydns.net"
echo ""
echo "🧪 Test your domain:"
echo "   curl -I http://$DOMAIN"
echo "   curl -I http://$DOMAIN/api/v1/auth/health"
echo ""
# Test Let's Encrypt validation path
echo "🧪 Testing Let's Encrypt validation path..."
TEST_FILE="/var/www/html/.well-known/acme-challenge/test"
echo "test-content" > $TEST_FILE
chmod 644 $TEST_FILE
if curl -s -f "http://$DOMAIN/.well-known/acme-challenge/test" | grep -q "test-content" 2>/dev/null; then
    echo "✅ Let's Encrypt validation path is accessible"
    rm -f $TEST_FILE
else
    echo "⚠️  Validation path test inconclusive (may need DNS propagation)"
    rm -f $TEST_FILE
fi
echo ""

echo "📋 Next Steps:"
echo "   1. Wait for DNS propagation (10-30 minutes)"
echo "   2. Test: http://$DOMAIN in your browser"
echo "   3. Setup SSL/HTTPS: sudo bash scripts/setup-ssl-ec2.sh"
echo ""
echo "💡 Troubleshooting:"
echo "   - If domain not working, check DNS: nslookup $DOMAIN"
echo "   - Check Nginx logs: sudo tail -f /var/log/nginx/error.log"
echo "   - Check service logs: docker logs business-web-app"
echo ""

