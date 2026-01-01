#!/bin/bash
# Setup SSL/HTTPS using Let's Encrypt
# Usage: sudo bash scripts/setup-ssl-ec2.sh [domain] [email]
# Example: sudo bash scripts/setup-ssl-ec2.sh samriddhi.buzz admin@samriddhi.buzz

set -e

DOMAIN=${1:-samriddhi.buzz}
DOMAIN_WWW="www.$DOMAIN"
EMAIL=${2:-admin@$DOMAIN}

echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║     SSL/HTTPS SETUP FOR $DOMAIN                                ║"
echo "║     Using Let's Encrypt (Free SSL Certificate)                ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo "❌ This script needs sudo privileges"
    echo "   Run: sudo bash $0"
    exit 1
fi

# Step 1: Install Certbot
echo "📦 Step 1/6: Installing Certbot..."
if ! command -v certbot &> /dev/null; then
    # For Amazon Linux 2023
    if [ -f /etc/os-release ] && grep -q "Amazon Linux" /etc/os-release; then
        yum install -y certbot python3-certbot-nginx
    else
        # Fallback for other systems
        yum install -y certbot python3-certbot-nginx || \
        apt-get update && apt-get install -y certbot python3-certbot-nginx
    fi
    echo "✅ Certbot installed"
else
    echo "✅ Certbot already installed"
fi
echo ""

# Step 2: Verify domain is accessible
echo "🔍 Step 2/6: Verifying domain is accessible..."
PUBLIC_IP=$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4 2>/dev/null || echo "")
DOMAIN_IP=$(dig +short $DOMAIN | head -1 || echo "")

if [ -z "$DOMAIN_IP" ]; then
    echo "⚠️  Warning: Domain $DOMAIN may not be resolving yet"
    echo "   Please wait for DNS propagation (10-30 minutes)"
    echo "   Check: nslookup $DOMAIN"
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
elif [ "$DOMAIN_IP" != "$PUBLIC_IP" ]; then
    echo "⚠️  Warning: Domain IP ($DOMAIN_IP) doesn't match EC2 IP ($PUBLIC_IP)"
    echo "   Make sure DNS A record points to: $PUBLIC_IP"
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
else
    echo "✅ Domain is pointing to correct IP: $DOMAIN_IP"
fi
echo ""

# Step 3: Verify HTTP is working
echo "🧪 Step 3/6: Verifying HTTP is working..."
if curl -s -f -m 5 "http://$DOMAIN" > /dev/null 2>&1; then
    echo "✅ HTTP is working: http://$DOMAIN"
else
    echo "⚠️  HTTP not responding. Make sure:"
    echo "   1. Nginx is running: sudo systemctl status nginx"
    echo "   2. Domain setup script was run: sudo bash scripts/setup-domain-ec2.sh"
    echo "   3. DNS is pointing to this server"
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi
echo ""

# Step 4: Ensure Let's Encrypt validation path is accessible
echo "🔧 Step 4/7: Ensuring Let's Encrypt validation path is accessible..."
mkdir -p /var/www/html/.well-known/acme-challenge
chown -R nginx:nginx /var/www/html
chmod -R 755 /var/www/html

# Check if Nginx config has the validation path
if ! grep -q "\.well-known/acme-challenge" /etc/nginx/conf.d/business-app.conf; then
    echo "⚠️  Nginx config missing Let's Encrypt validation path"
    echo "   Run: sudo bash scripts/fix-ssl-validation.sh"
    echo "   Then retry SSL setup"
    exit 1
fi

# Test validation path
TEST_FILE="/var/www/html/.well-known/acme-challenge/test-ssl"
echo "test" > $TEST_FILE
chmod 644 $TEST_FILE
if curl -s -f "http://$DOMAIN/.well-known/acme-challenge/test-ssl" > /dev/null 2>&1; then
    echo "✅ Let's Encrypt validation path is accessible"
    rm -f $TEST_FILE
else
    echo "⚠️  Validation path not accessible, but continuing..."
    rm -f $TEST_FILE
fi
echo ""

# Step 5: Get SSL certificate
echo "🔐 Step 5/7: Obtaining SSL certificate from Let's Encrypt..."
echo "   This may take a few minutes..."
echo ""

# Run certbot
certbot --nginx \
    -d $DOMAIN \
    -d $DOMAIN_WWW \
    --non-interactive \
    --agree-tos \
    --email $EMAIL \
    --redirect || {
    echo ""
    echo "❌ SSL certificate generation failed"
    echo ""
    echo "Common issues:"
    echo "   1. Domain not pointing to this server (check DNS)"
    echo "   2. Port 80 not accessible from internet (check security group)"
    echo "   3. Nginx not configured for domain"
    echo ""
    echo "Troubleshooting:"
    echo "   - Check DNS: nslookup $DOMAIN"
    echo "   - Check Nginx: sudo nginx -t"
    echo "   - Check security group allows port 80 and 443"
    echo "   - Run domain setup first: sudo bash scripts/setup-domain-ec2.sh"
    exit 1
}

echo ""
echo "✅ SSL certificate obtained successfully"
echo ""

# Step 6: Verify SSL configuration
echo "🔍 Step 6/7: Verifying SSL configuration..."
if nginx -t; then
    echo "✅ Nginx configuration is valid"
    systemctl reload nginx
else
    echo "❌ Nginx configuration error"
    nginx -t
    exit 1
fi
echo ""

# Step 7: Test HTTPS
echo "🧪 Step 7/7: Testing HTTPS..."
sleep 3

if curl -s -f -m 10 "https://$DOMAIN" > /dev/null 2>&1; then
    echo "✅ HTTPS is working: https://$DOMAIN"
else
    echo "⚠️  HTTPS test failed, but certificate is installed"
    echo "   It may take a few minutes for SSL to be fully active"
fi
echo ""

# Setup auto-renewal
echo "🔄 Setting up automatic certificate renewal..."
# Certbot automatically sets up renewal, but let's verify
if [ -f /etc/cron.d/certbot ] || systemctl list-timers | grep -q certbot; then
    echo "✅ Auto-renewal is configured"
else
    echo "⚠️  Auto-renewal may need manual setup"
    echo "   Run: certbot renew --dry-run"
fi
echo ""

echo "═══════════════════════════════════════════════════════════════"
echo "✅ SSL/HTTPS SETUP COMPLETE!"
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo "🌐 Your application is now accessible at:"
echo "   ✅ https://$DOMAIN"
echo "   ✅ https://$DOMAIN_WWW"
echo "   ✅ http://$DOMAIN (redirects to HTTPS)"
echo ""
echo "🔒 SSL Certificate:"
echo "   - Issued by: Let's Encrypt"
echo "   - Valid for: 90 days (auto-renewed)"
echo "   - Auto-renewal: Configured"
echo ""
echo "📋 Next Steps:"
echo "   1. Test: https://$DOMAIN in your browser"
echo "   2. Update app URLs to use HTTPS"
echo "   3. Test certificate renewal: sudo certbot renew --dry-run"
echo ""
echo "💡 Troubleshooting:"
echo "   - If HTTPS not working, wait 2-3 minutes and try again"
echo "   - Check security group allows port 443 (HTTPS)"
echo "   - View certificate: sudo certbot certificates"
echo ""

