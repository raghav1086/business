#!/bin/bash
# Cleanup old instance and redeploy with new configuration

set -e

AWS_PROFILE=${AWS_PROFILE:-business-app}
REGION=${REGION:-ap-south-1}
KEY_NAME=${KEY_NAME:-business-app-key}
NEW_INSTANCE_TYPE=${NEW_INSTANCE_TYPE:-t3.medium}

echo "🧹 Cleanup and Redeploy Script"
echo "================================"
echo "AWS Profile: $AWS_PROFILE"
echo "Region: $REGION"
echo "New Instance Type: $NEW_INSTANCE_TYPE"
echo ""

# Step 1: Find current instance
echo "1. Finding current instance..."
INSTANCE_ID=$(aws --profile $AWS_PROFILE ec2 describe-instances \
  --region $REGION \
  --filters "Name=tag:Name,Values=business-app-beta" \
  --query 'Reservations[0].Instances[0].InstanceId' \
  --output text 2>/dev/null || echo "None")

if [ -z "$INSTANCE_ID" ] || [ "$INSTANCE_ID" = "None" ]; then
    echo "   ℹ️  No existing instance found"
    SKIP_TERMINATION=true
else
    STATE=$(aws --profile $AWS_PROFILE ec2 describe-instances \
      --region $REGION \
      --instance-ids $INSTANCE_ID \
      --query 'Reservations[0].Instances[0].State.Name' \
      --output text)
    
    echo "   Found instance: $INSTANCE_ID (State: $STATE)"
    
    if [ "$STATE" = "terminated" ] || [ "$STATE" = "shutting-down" ]; then
        echo "   ℹ️  Instance already terminated or terminating"
        SKIP_TERMINATION=true
    else
        SKIP_TERMINATION=false
    fi
fi

# Step 2: Terminate old instance
if [ "$SKIP_TERMINATION" = false ]; then
    echo ""
    echo "2. Terminating old instance..."
    aws --profile $AWS_PROFILE ec2 terminate-instances \
      --region $REGION \
      --instance-ids $INSTANCE_ID > /dev/null
    
    echo "   Waiting for termination (this may take 1-2 minutes)..."
    aws --profile $AWS_PROFILE ec2 wait instance-terminated \
      --region $REGION \
      --instance-ids $INSTANCE_ID
    
    echo "   ✅ Instance terminated"
    
    # Wait a bit more to ensure cleanup
    echo "   Waiting for cleanup..."
    sleep 10
else
    echo ""
    echo "2. Skipping termination (no instance to terminate)"
fi

# Step 3: Deploy new instance
echo ""
echo "3. Deploying new instance with $NEW_INSTANCE_TYPE..."
echo "=================================================="
echo ""

# Call the deployment script
cd "$(dirname "$0")/.."
export AWS_PROFILE
bash scripts/deploy-aws-auto.sh $REGION $KEY_NAME $NEW_INSTANCE_TYPE $AWS_PROFILE

echo ""
echo "✅ Cleanup and redeploy complete!"
