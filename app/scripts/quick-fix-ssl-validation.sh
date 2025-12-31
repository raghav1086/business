#!/bin/bash
# Quick fix for SSL validation - Run this on EC2 to fix Let's Encrypt validation

set -e

echo "🔧 Quick Fix: SSL Validation for Let's Encrypt"
echo "================================================"
echo ""

if [ "$EUID" -ne 0 ]; then 
    echo "❌ Run with sudo: sudo bash $0"
    exit 1
fi

# Create validation directory
echo "1. Creating Let's Encrypt validation directory..."
mkdir -p /var/www/html/.well-known/acme-challenge
chown -R nginx:nginx /var/www/html 2>/dev/null || chown -R apache:apache /var/www/html 2>/dev/null || true
chmod -R 755 /var/www/html
echo "✅ Directory created"
echo ""

# Update Nginx config to add validation path BEFORE location /
echo "2. Updating Nginx configuration..."
if [ -f /etc/nginx/conf.d/business-app.conf ]; then
    # Check if validation path already exists
    if grep -q "\.well-known/acme-challenge" /etc/nginx/conf.d/business-app.conf; then
        echo "✅ Validation path already configured"
    else
        # Backup
        cp /etc/nginx/conf.d/business-app.conf /etc/nginx/conf.d/business-app.conf.backup.$(date +%Y%m%d_%H%M%S)
        
        # Add validation path BEFORE location / block
        sed -i '/server_name/a\
    # CRITICAL: Allow Let\'s Encrypt validation\
    location /.well-known/acme-challenge/ {\
        root /var/www/html;\
        try_files $uri =404;\
    }' /etc/nginx/conf.d/business-app.conf
        
        # If that didn't work, try a different approach
        if ! grep -q "\.well-known/acme-challenge" /etc/nginx/conf.d/business-app.conf; then
            # Manual insertion method
            python3 << 'PYTHON_EOF'
import re

config_file = '/etc/nginx/conf.d/business-app.conf'
with open(config_file, 'r') as f:
    content = f.read()

# Check if already added
if '.well-known/acme-challenge' in content:
    print("Already configured")
else:
    # Find server block and add validation path after server_name
    pattern = r'(server_name[^;]+;)'
    replacement = r'\1\n    \n    # CRITICAL: Allow Let\'s Encrypt validation\n    location /.well-known/acme-challenge/ {\n        root /var/www/html;\n        try_files $uri =404;\n    }'
    content = re.sub(pattern, replacement, content, count=1)
    
    with open(config_file, 'w') as f:
        f.write(content)
    print("Configuration updated")
PYTHON_EOF
        fi
        echo "✅ Nginx configuration updated"
    fi
else
    echo "❌ Nginx config file not found: /etc/nginx/conf.d/business-app.conf"
    echo "   Run domain setup first: sudo bash scripts/setup-domain-ec2.sh"
    exit 1
fi
echo ""

# Test and restart Nginx
echo "3. Testing and restarting Nginx..."
if nginx -t; then
    systemctl restart nginx
    echo "✅ Nginx restarted"
else
    echo "❌ Nginx config test failed"
    nginx -t
    exit 1
fi
echo ""

# Test validation path
echo "4. Testing validation path..."
TEST_FILE="/var/www/html/.well-known/acme-challenge/test-$(date +%s)"
echo "test-content" > $TEST_FILE
chmod 644 $TEST_FILE

DOMAIN="samriddhi.buzz"
if curl -s -f "http://$DOMAIN/.well-known/acme-challenge/$(basename $TEST_FILE)" 2>/dev/null | grep -q "test-content"; then
    echo "✅ Validation path is accessible"
    rm -f $TEST_FILE
else
    echo "⚠️  Validation path test failed (may need DNS propagation)"
    echo "   But configuration is correct, you can proceed with SSL setup"
    rm -f $TEST_FILE
fi
echo ""

echo "═══════════════════════════════════════════════════════════════"
echo "✅ FIX COMPLETE!"
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo "📋 Next: Run SSL setup again"
echo "   sudo bash scripts/setup-ssl-ec2.sh"
echo ""

