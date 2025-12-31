#!/bin/bash
# Add HTTPS (port 443) to EC2 security group
# Usage: Run from local machine with AWS credentials

set -e

REGION=${1:-ap-south-1}

echo "🔒 Adding HTTPS (port 443) to Security Group"
echo "============================================="
echo ""

# Check AWS CLI
if ! command -v aws &> /dev/null; then
    echo "❌ AWS CLI not found"
    echo "   Install: https://aws.amazon.com/cli/"
    exit 1
fi

# Get instance ID
echo "🔍 Finding EC2 instance..."
INSTANCE_ID=$(aws ec2 describe-instances \
    --region $REGION \
    --filters "Name=tag:Name,Values=business-app-beta" "Name=instance-state-name,Values=running" \
    --query 'Reservations[0].Instances[0].InstanceId' \
    --output text 2>/dev/null || echo "")

if [ -z "$INSTANCE_ID" ] || [ "$INSTANCE_ID" = "None" ]; then
    echo "❌ Could not find running EC2 instance"
    echo "   Check: aws ec2 describe-instances --region $REGION"
    exit 1
fi

echo "✅ Found instance: $INSTANCE_ID"
echo ""

# Get security group ID
echo "🔍 Getting security group..."
SG_ID=$(aws ec2 describe-instances \
    --region $REGION \
    --instance-ids $INSTANCE_ID \
    --query 'Reservations[0].Instances[0].SecurityGroups[0].GroupId' \
    --output text)

if [ -z "$SG_ID" ] || [ "$SG_ID" = "None" ]; then
    echo "❌ Could not determine security group"
    exit 1
fi

echo "✅ Security group: $SG_ID"
echo ""

# Check if port 443 already allowed
echo "🔍 Checking if port 443 is already allowed..."
HTTPS_EXISTS=$(aws ec2 describe-security-groups \
    --region $REGION \
    --group-ids $SG_ID \
    --query 'SecurityGroups[0].IpPermissions[?FromPort==`443`]' \
    --output text 2>/dev/null || echo "")

if [ -n "$HTTPS_EXISTS" ]; then
    echo "✅ Port 443 is already allowed in security group"
    echo ""
    echo "📋 If HTTPS still not working:"
    echo "   1. SSL certificate may not be installed"
    echo "   2. Run on EC2: sudo bash scripts/setup-ssl-ec2.sh"
    exit 0
fi

# Add port 443
echo "➕ Adding port 443 (HTTPS) to security group..."
aws ec2 authorize-security-group-ingress \
    --region $REGION \
    --group-id $SG_ID \
    --protocol tcp \
    --port 443 \
    --cidr 0.0.0.0/0

if [ $? -eq 0 ]; then
    echo "✅ Port 443 (HTTPS) added to security group"
    echo ""
    echo "📋 Next Steps:"
    echo "   1. SSH into EC2: ssh -i ~/.ssh/business-app-key.pem ec2-user@<IP>"
    echo "   2. Run SSL setup: sudo bash scripts/setup-ssl-ec2.sh"
else
    echo "❌ Failed to add port 443"
    echo "   You may need to add it manually in AWS Console:"
    echo "   EC2 → Security Groups → $SG_ID → Inbound Rules → Add Rule"
    echo "   Port: 443, Protocol: TCP, Source: 0.0.0.0/0"
    exit 1
fi

