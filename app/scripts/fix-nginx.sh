#!/bin/bash
# Quick fix script to configure and start Nginx

set -e

echo "🔧 Fixing Nginx Configuration"
echo "=============================="
echo ""

# Check if config file exists
if [ ! -f "/etc/nginx/conf.d/business-app.conf" ]; then
    echo "📝 Creating Nginx configuration..."
    
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
    
    location /api/v1/auth/ {
        proxy_pass http://auth_service/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    location /api/v1/business/ {
        proxy_pass http://business_service/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    location /api/v1/party/ {
        proxy_pass http://party_service/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    location /api/v1/inventory/ {
        proxy_pass http://inventory_service/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    location /api/v1/invoice/ {
        proxy_pass http://invoice_service/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    location /api/v1/payment/ {
        proxy_pass http://payment_service/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
NGINX_EOF
    
    echo "✅ Configuration file created"
else
    echo "✅ Configuration file exists"
fi

echo ""
echo "🧪 Testing Nginx configuration..."
if sudo nginx -t; then
    echo "✅ Configuration is valid"
else
    echo "❌ Configuration test failed"
    exit 1
fi

echo ""
echo "🚀 Starting Nginx..."
sudo systemctl start nginx
sudo systemctl enable nginx

echo ""
echo "📊 Checking Nginx status..."
if sudo systemctl is-active --quiet nginx; then
    echo "✅ Nginx is running"
else
    echo "❌ Nginx failed to start"
    echo "Check logs: sudo journalctl -u nginx -n 50"
    exit 1
fi

echo ""
echo "🔍 Testing web-app connectivity..."
if curl -s -f -m 5 http://localhost:3000 > /dev/null; then
    echo "✅ Web-app is accessible on port 3000"
else
    echo "⚠️  Web-app not responding on port 3000"
    echo "   Check: docker ps | grep web-app"
fi

echo ""
echo "🔍 Testing Nginx proxy..."
if curl -s -f -m 5 http://localhost > /dev/null; then
    echo "✅ Nginx proxy is working"
else
    echo "⚠️  Nginx proxy not responding"
    echo "   Check: sudo nginx -t"
    echo "   Check: sudo systemctl status nginx"
fi

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "✅ Nginx setup complete!"
echo ""
echo "🌐 Your application should now be accessible at:"
echo "   http://$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4 2>/dev/null || echo 'YOUR_EC2_IP')"
echo ""
echo "📋 To check status:"
echo "   sudo systemctl status nginx"
echo "   curl -I http://localhost"
echo ""

