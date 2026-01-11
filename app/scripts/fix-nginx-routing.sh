#!/bin/bash
# Fix Nginx routing for API endpoints
# This ensures proper path forwarding to backend services

set -e

echo "🔧 Fixing Nginx API Routing"
echo "============================"
echo ""

# The issue: Nginx needs to preserve the full path for backend services
# Backend controllers expect: /api/v1/auth/send-otp, /api/v1/parties, etc.

sudo tee /etc/nginx/conf.d/business-app.conf <<'NGINX_EOF'
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
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
    
    # Auth service - preserve full path /api/v1/auth/*
    location /api/v1/auth {
        proxy_pass http://auth_service;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # User endpoints (auth service) - preserve full path /api/v1/users/*
    location /api/v1/users {
        proxy_pass http://auth_service;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # Business service - preserve full path /api/v1/businesses/*
    location /api/v1/businesses {
        proxy_pass http://business_service;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # Party service - preserve full path /api/v1/parties/*
    location /api/v1/parties {
        proxy_pass http://party_service;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # Inventory service - preserve full path /api/v1/items/*
    location /api/v1/items {
        proxy_pass http://inventory_service;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # Invoice service - preserve full path /api/v1/invoices/*
    location /api/v1/invoices {
        proxy_pass http://invoice_service;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # Payment service - preserve full path /api/v1/payments/*
    location /api/v1/payments {
        proxy_pass http://payment_service;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # Stock endpoints (inventory service)
    location /api/v1/stock {
        proxy_pass http://inventory_service;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
NGINX_EOF

echo "✅ Nginx configuration updated"
echo ""

# Test configuration
echo "🧪 Testing Nginx configuration..."
if sudo nginx -t; then
    echo "✅ Configuration is valid"
else
    echo "❌ Configuration test failed"
    sudo nginx -t
    exit 1
fi

# Restart Nginx
echo ""
echo "🔄 Restarting Nginx..."
sudo systemctl restart nginx

# Wait a moment
sleep 2

# Check status
if sudo systemctl is-active --quiet nginx; then
    echo "✅ Nginx is running"
else
    echo "❌ Nginx failed to start"
    sudo journalctl -u nginx -n 20
    exit 1
fi

echo ""
echo "🔍 Testing backend connectivity..."
echo ""

# Test auth service directly
if curl -s -f -m 5 http://localhost:3002/health > /dev/null 2>&1; then
    echo "✅ Auth service (port 3002): Accessible"
else
    echo "❌ Auth service (port 3002): Not accessible"
    echo "   Check: docker ps | grep auth"
fi

# Test via Nginx
if curl -s -f -m 5 http://localhost/api/v1/auth/send-otp -X POST -H "Content-Type: application/json" -d '{}' > /dev/null 2>&1; then
    echo "✅ Auth API via Nginx: Accessible"
else
    echo "⚠️  Auth API via Nginx: May need service check (expected 400/401, not 502)"
fi

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "✅ Nginx routing fixed!"
echo ""
echo "📋 Key changes:"
echo "   - Removed trailing slashes from location blocks"
echo "   - Changed proxy_pass to preserve full paths"
echo "   - Updated location paths to match actual endpoints"
echo ""
echo "🔍 To verify:"
echo "   curl -I http://localhost/api/v1/auth/send-otp"
echo "   sudo tail -f /var/log/nginx/error.log"
echo ""

