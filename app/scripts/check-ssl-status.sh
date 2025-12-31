#!/bin/bash
# Check SSL/HTTPS status on EC2
# Usage: sudo bash scripts/check-ssl-status.sh

set -e

echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║     SSL/HTTPS STATUS CHECK                                     ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo "⚠️  Run with sudo: sudo bash $0"
    exit 1
fi

DOMAIN="samriddhi.buzz"

echo "🔍 Checking SSL/HTTPS Status..."
echo ""

# 1. Check if SSL certificate exists
echo "1️⃣ Checking SSL certificate..."
if [ -d /etc/letsencrypt/live/$DOMAIN ]; then
    echo "✅ SSL certificate found"
    echo "   Location: /etc/letsencrypt/live/$DOMAIN"
    
    # Check certificate expiry
    if [ -f /etc/letsencrypt/live/$DOMAIN/cert.pem ]; then
        EXPIRY=$(openssl x509 -enddate -noout -in /etc/letsencrypt/live/$DOMAIN/cert.pem | cut -d= -f2)
        echo "   Expires: $EXPIRY"
    fi
else
    echo "❌ SSL certificate NOT found"
    echo "   Run: sudo bash scripts/setup-ssl-ec2.sh"
fi
echo ""

# 2. Check Nginx SSL configuration
echo "2️⃣ Checking Nginx SSL configuration..."
if grep -q "listen 443" /etc/nginx/conf.d/business-app.conf 2>/dev/null; then
    echo "✅ Nginx configured for HTTPS (port 443)"
else
    echo "❌ Nginx NOT configured for HTTPS"
    echo "   Need to run SSL setup"
fi
echo ""

# 3. Check if port 443 is listening
echo "3️⃣ Checking if port 443 is listening..."
if netstat -tuln 2>/dev/null | grep -q ":443 " || ss -tuln 2>/dev/null | grep -q ":443 "; then
    echo "✅ Port 443 is listening"
else
    echo "⚠️  Port 443 is NOT listening"
    echo "   This is normal if SSL certificate hasn't been obtained yet"
fi
echo ""

# 4. Check Nginx status
echo "4️⃣ Checking Nginx status..."
if systemctl is-active --quiet nginx; then
    echo "✅ Nginx is running"
else
    echo "❌ Nginx is NOT running"
    echo "   Run: sudo systemctl start nginx"
fi
echo ""

# 5. Test HTTPS connectivity
echo "5️⃣ Testing HTTPS connectivity..."
if curl -s -k -f -m 5 "https://$DOMAIN" > /dev/null 2>&1; then
    echo "✅ HTTPS is working!"
elif curl -s -k -f -m 5 "https://localhost" > /dev/null 2>&1; then
    echo "⚠️  HTTPS works locally but may not be accessible externally"
    echo "   Check security group allows port 443"
else
    echo "❌ HTTPS is NOT working"
    echo "   Need to setup SSL certificate"
fi
echo ""

# 6. Check security group (if AWS CLI available)
echo "6️⃣ Checking security group configuration..."
if command -v aws &> /dev/null; then
    INSTANCE_ID=$(curl -s http://169.254.169.254/latest/meta-data/instance-id 2>/dev/null || echo "")
    if [ -n "$INSTANCE_ID" ]; then
        REGION=$(curl -s http://169.254.169.254/latest/meta-data/placement/region 2>/dev/null || echo "ap-south-1")
        SG_ID=$(aws ec2 describe-instances --region $REGION --instance-ids $INSTANCE_ID --query 'Reservations[0].Instances[0].SecurityGroups[0].GroupId' --output text 2>/dev/null || echo "")
        
        if [ -n "$SG_ID" ] && [ "$SG_ID" != "None" ]; then
            HTTPS_RULE=$(aws ec2 describe-security-groups --region $REGION --group-ids $SG_ID --query 'SecurityGroups[0].IpPermissions[?FromPort==`443`]' --output text 2>/dev/null || echo "")
            
            if [ -n "$HTTPS_RULE" ]; then
                echo "✅ Security group allows port 443 (HTTPS)"
            else
                echo "❌ Security group does NOT allow port 443"
                echo "   Run: aws ec2 authorize-security-group-ingress --region $REGION --group-id $SG_ID --protocol tcp --port 443 --cidr 0.0.0.0/0"
            fi
        else
            echo "⚠️  Could not determine security group"
        fi
    else
        echo "⚠️  Could not determine instance ID"
    fi
else
    echo "⚠️  AWS CLI not available, cannot check security group"
    echo "   Manually check: EC2 Console → Security Groups → Your SG → Inbound Rules"
    echo "   Should have: Port 443, Protocol TCP, Source 0.0.0.0/0"
fi
echo ""

echo "═══════════════════════════════════════════════════════════════"
echo "📋 SUMMARY"
echo "═══════════════════════════════════════════════════════════════"
echo ""

# Determine what needs to be done
if [ ! -d /etc/letsencrypt/live/$DOMAIN ]; then
    echo "❌ SSL certificate not found"
    echo ""
    echo "📋 Next Steps:"
    echo "   1. Ensure port 443 is open in security group"
    echo "   2. Run: sudo bash scripts/setup-ssl-ec2.sh"
    echo ""
elif ! grep -q "listen 443" /etc/nginx/conf.d/business-app.conf 2>/dev/null; then
    echo "⚠️  SSL certificate exists but Nginx not configured"
    echo ""
    echo "📋 Next Steps:"
    echo "   1. Run: sudo certbot --nginx -d samriddhi.buzz -d www.samriddhi.buzz --redirect"
    echo ""
else
    echo "✅ SSL appears to be configured"
    echo ""
    echo "📋 If HTTPS still not working:"
    echo "   1. Check security group allows port 443"
    echo "   2. Check DNS propagation"
    echo "   3. Wait a few minutes for changes to take effect"
    echo ""
fi

