#!/bin/bash
# Quick script to add /api/v1/users route to existing nginx config
# This routes user endpoints to auth-service

set -e

echo "🔧 Adding /api/v1/users route to Nginx"
echo "======================================="
echo ""

CONFIG_FILE="/etc/nginx/conf.d/business-app.conf"

# Check if nginx config exists
if [ ! -f "$CONFIG_FILE" ]; then
    echo "❌ Nginx config file not found: $CONFIG_FILE"
    exit 1
fi

# Check if route already exists
if grep -q "location /api/v1/users" "$CONFIG_FILE"; then
    echo "✅ /api/v1/users route already exists"
    echo "   Reloading nginx to ensure it's active..."
    sudo nginx -t && sudo systemctl reload nginx
    exit 0
fi

# Backup
echo "📦 Creating backup..."
BACKUP_FILE="${CONFIG_FILE}.backup.$(date +%Y%m%d_%H%M%S)"
sudo cp "$CONFIG_FILE" "$BACKUP_FILE"
echo "✅ Backup created: $BACKUP_FILE"

# Create temp file with the new route
TEMP_FILE=$(mktemp)

# Read config and insert new route after /api/v1/auth block
awk '
    /location \/api\/v1\/auth/ {
        # Print the auth location block
        print
        # Read until we find the closing brace
        while (getline > 0) {
            print
            if (/^[[:space:]]*}/) {
                # After closing brace, add the users route
                print ""
                print "    # User endpoints (auth service) - preserve full path /api/v1/users/*"
                print "    location /api/v1/users {"
                print "        proxy_pass http://auth_service;"
                print "        proxy_set_header Host $host;"
                print "        proxy_set_header X-Real-IP $remote_addr;"
                print "        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;"
                print "        proxy_set_header X-Forwarded-Proto $scheme;"
                print "    }"
                break
            }
        }
        next
    }
    { print }
' "$CONFIG_FILE" > "$TEMP_FILE"

# Replace original with updated config
sudo mv "$TEMP_FILE" "$CONFIG_FILE"
sudo chmod 644 "$CONFIG_FILE"

echo "✅ /api/v1/users route added to config"

# Test configuration
echo ""
echo "🧪 Testing Nginx configuration..."
if sudo nginx -t; then
    echo "✅ Configuration is valid"
else
    echo "❌ Configuration test failed - restoring backup"
    sudo cp "$BACKUP_FILE" "$CONFIG_FILE"
    sudo nginx -t
    exit 1
fi

# Reload Nginx
echo ""
echo "🔄 Reloading Nginx..."
if sudo systemctl reload nginx; then
    echo "✅ Nginx reloaded successfully"
else
    echo "❌ Failed to reload Nginx - restoring backup"
    sudo cp "$BACKUP_FILE" "$CONFIG_FILE"
    sudo systemctl reload nginx
    exit 1
fi

# Wait a moment
sleep 1

# Check status
if sudo systemctl is-active --quiet nginx; then
    echo "✅ Nginx is running"
else
    echo "❌ Nginx is not running - restoring backup"
    sudo cp "$BACKUP_FILE" "$CONFIG_FILE"
    sudo systemctl reload nginx
    exit 1
fi

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "✅ Success! /api/v1/users route added and nginx reloaded"
echo ""
echo "📋 What was added:"
echo "   /api/v1/users → auth-service (port 3002)"
echo ""
echo "🔍 To verify the endpoint works:"
echo "   curl -X PATCH https://samriddhi.buzz/api/v1/users/profile/passcode \\"
echo "     -H 'Authorization: Bearer YOUR_TOKEN' \\"
echo "     -H 'Content-Type: application/json' \\"
echo "     -d '{\"current_passcode\":\"123456\",\"new_passcode\":\"654321\"}'"
echo ""
echo "💡 Note: Make sure auth-service is deployed with the route fix"
echo "   (profile/passcode route must come before profile route)"
echo ""
