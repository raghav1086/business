#!/bin/bash
# Fix SSL validation issue by ensuring Let's Encrypt can access validation files
# This script updates Nginx to allow Let's Encrypt validation

set -e

DOMAIN="samriddhi.buzz"
DOMAIN_WWW="www.samriddhi.buzz"

echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║     FIX SSL VALIDATION - Allow Let's Encrypt Access            ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""

if [ "$EUID" -ne 0 ]; then 
    echo "❌ This script needs sudo privileges"
    echo "   Run: sudo bash $0"
    exit 1
fi

# Backup current config
echo "📋 Backing up current Nginx configuration..."
cp /etc/nginx/conf.d/business-app.conf /etc/nginx/conf.d/business-app.conf.backup.$(date +%Y%m%d_%H%M%S)
echo "✅ Backup created"
echo ""

# Update Nginx config to allow Let's Encrypt validation
echo "🔧 Updating Nginx configuration for SSL validation..."

cat > /etc/nginx/conf.d/business-app.conf <<'NGINX_EOF'
upstream auth_service { server localhost:3002; }
upstream business_service { server localhost:3003; }
upstream party_service { server localhost:3004; }
upstream inventory_service { server localhost:3005; }
upstream invoice_service { server localhost:3006; }
upstream payment_service { server localhost:3007; }
upstream web_app { server localhost:3000; }

server {
    listen 80;
    server_name samriddhi.buzz www.samriddhi.buzz;
    
    # CRITICAL: Allow Let's Encrypt validation
    # This must come BEFORE the location / block
    location /.well-known/acme-challenge/ {
        root /var/www/html;
        try_files $uri =404;
    }
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    
    location / {
        proxy_pass http://web_app;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }
    
    # Auth service - preserve full path
    location /api/v1/auth {
        proxy_pass http://auth_service;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }
    
    # Business service
    location /api/v1/businesses {
        proxy_pass http://business_service;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }
    
    # Party service
    location /api/v1/parties {
        proxy_pass http://party_service;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }
    
    # Inventory service
    location /api/v1/items {
        proxy_pass http://inventory_service;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }
    
    # Stock endpoints
    location /api/v1/stock {
        proxy_pass http://inventory_service;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }
    
    # Invoice service
    location /api/v1/invoices {
        proxy_pass http://invoice_service;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }
    
    # Payment service
    location /api/v1/payments {
        proxy_pass http://payment_service;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
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

# Create directory for Let's Encrypt validation
echo "📁 Creating directory for Let's Encrypt validation..."
mkdir -p /var/www/html/.well-known/acme-challenge
chown -R nginx:nginx /var/www/html
chmod -R 755 /var/www/html
echo "✅ Directory created"
echo ""

# Test Nginx configuration
echo "🧪 Testing Nginx configuration..."
if nginx -t; then
    echo "✅ Nginx configuration is valid"
else
    echo "❌ Nginx configuration test failed!"
    nginx -t
    exit 1
fi
echo ""

# Restart Nginx
echo "🔄 Restarting Nginx..."
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

# Test Let's Encrypt validation path
echo "🧪 Testing Let's Encrypt validation path..."
TEST_FILE="/var/www/html/.well-known/acme-challenge/test"
echo "test-content" > $TEST_FILE
chmod 644 $TEST_FILE

if curl -s -f "http://$DOMAIN/.well-known/acme-challenge/test" | grep -q "test-content"; then
    echo "✅ Let's Encrypt validation path is accessible"
    rm -f $TEST_FILE
else
    echo "⚠️  Validation path test failed, but continuing..."
    rm -f $TEST_FILE
fi
echo ""

echo "═══════════════════════════════════════════════════════════════"
echo "✅ SSL VALIDATION FIX COMPLETE!"
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo "📋 Next Steps:"
echo "   1. Run SSL setup again:"
echo "      sudo bash scripts/setup-ssl-ec2.sh"
echo ""
echo "   2. Or run Certbot manually:"
echo "      sudo certbot --nginx -d samriddhi.buzz -d www.samriddhi.buzz"
echo ""
echo "💡 The key fix: Added /.well-known/acme-challenge/ location"
echo "   This allows Let's Encrypt to validate your domain"
echo ""

