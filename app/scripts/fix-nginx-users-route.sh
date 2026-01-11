#!/bin/bash
# Fix Nginx routing to add /api/v1/users endpoint
# This routes user endpoints to auth-service

set -e

echo "🔧 Adding /api/v1/users route to Nginx"
echo "======================================="
echo ""

# Check if nginx config exists
if [ ! -f "/etc/nginx/conf.d/business-app.conf" ]; then
    echo "❌ Nginx config file not found: /etc/nginx/conf.d/business-app.conf"
    echo "   Please run the main nginx setup script first"
    exit 1
fi

# Backup current config
echo "📦 Backing up current nginx config..."
sudo cp /etc/nginx/conf.d/business-app.conf /etc/nginx/conf.d/business-app.conf.backup.$(date +%Y%m%d_%H%M%S)
echo "✅ Backup created"

# Check if /api/v1/users route already exists
if grep -q "location /api/v1/users" /etc/nginx/conf.d/business-app.conf; then
    echo "⚠️  /api/v1/users route already exists in nginx config"
    echo "   Skipping addition..."
else
    echo "📝 Adding /api/v1/users route..."
    
    # Create temp file with the new location block
    TEMP_FILE=$(mktemp)
    
    # Read current config and insert the new route after /api/v1/auth
    awk '
    /location \/api\/v1\/auth/ {
        print
        getline
        while (/proxy_set_header|proxy_pass|^[[:space:]]*}/) {
            print
            getline
        }
        # Insert new /api/v1/users location block
        print ""
        print "    # User endpoints (auth service) - preserve full path /api/v1/users/*"
        print "    location /api/v1/users {"
        print "        proxy_pass http://auth_service;"
        print "        proxy_set_header Host $host;"
        print "        proxy_set_header X-Real-IP $remote_addr;"
        print "        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;"
        print "        proxy_set_header X-Forwarded-Proto $scheme;"
        print "    }"
        print ""
    }
    { print }
    ' /etc/nginx/conf.d/business-app.conf > "$TEMP_FILE"
    
    # Replace original with updated config
    sudo mv "$TEMP_FILE" /etc/nginx/conf.d/business-app.conf
    sudo chmod 644 /etc/nginx/conf.d/business-app.conf
    
    echo "✅ /api/v1/users route added"
fi

# Test configuration
echo ""
echo "🧪 Testing Nginx configuration..."
if sudo nginx -t; then
    echo "✅ Configuration is valid"
else
    echo "❌ Configuration test failed"
    echo "   Restoring backup..."
    sudo cp /etc/nginx/conf.d/business-app.conf.backup.* /etc/nginx/conf.d/business-app.conf 2>/dev/null || true
    sudo nginx -t
    exit 1
fi

# Reload Nginx
echo ""
echo "🔄 Reloading Nginx..."
if sudo systemctl reload nginx; then
    echo "✅ Nginx reloaded successfully"
else
    echo "❌ Failed to reload Nginx"
    sudo systemctl status nginx
    exit 1
fi

# Wait a moment
sleep 2

# Check status
if sudo systemctl is-active --quiet nginx; then
    echo "✅ Nginx is running"
else
    echo "❌ Nginx is not running"
    sudo journalctl -u nginx -n 20
    exit 1
fi

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "✅ Nginx routing updated!"
echo ""
echo "📋 Added route:"
echo "   /api/v1/users → auth-service (port 3002)"
echo ""
echo "🔍 To verify:"
echo "   curl -I http://localhost/api/v1/users/profile"
echo "   sudo tail -f /var/log/nginx/access.log"
echo ""
echo "💡 Note: Make sure auth-service is running and has the updated"
echo "   route ordering (profile/passcode before profile)"
echo ""

