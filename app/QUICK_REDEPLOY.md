# Quick Redeploy - Delete Old and Create New

## One-Command Solution

To delete the old instance and deploy a new one with `t3.large`:

```bash
cd app
AWS_PROFILE=business-app NEW_INSTANCE_TYPE=t3.large bash scripts/cleanup-and-redeploy.sh
```

Or manually:

```bash
cd app
AWS_PROFILE=business-app bash scripts/cleanup-and-redeploy.sh
```

## Manual Steps (if you prefer)

### Step 1: Find and Terminate Old Instance

```bash
# Find instance ID
INSTANCE_ID=$(AWS_PROFILE=business-app aws ec2 describe-instances \
  --region ap-south-1 \
  --filters "Name=tag:Name,Values=business-app-beta" \
  --query 'Reservations[0].Instances[0].InstanceId' \
  --output text)

echo "Instance ID: $INSTANCE_ID"

# Terminate it
AWS_PROFILE=business-app aws ec2 terminate-instances \
  --region ap-south-1 \
  --instance-ids $INSTANCE_ID

# Wait for termination
AWS_PROFILE=business-app aws ec2 wait instance-terminated \
  --region ap-south-1 \
  --instance-ids $INSTANCE_ID

echo "✅ Instance terminated"
```

### Step 2: Deploy New Instance

```bash
cd app
AWS_PROFILE=business-app bash scripts/deploy-aws-auto.sh ap-south-1 business-app-key t3.large
```

## What the Script Does

1. ✅ Finds existing instance (if any)
2. ✅ Terminates old instance
3. ✅ Waits for termination to complete
4. ✅ Deploys new instance with t3.large
5. ✅ Returns new application URL

## Instance Type Options

- `t3.medium` - 4 GB RAM, ~$30/month (beta)
- `t3.large` - 8 GB RAM, ~$60/month (production) ✅ Recommended
- `t3.xlarge` - 16 GB RAM, ~$120/month (high traffic)

## Quick Command

```bash
cd app && AWS_PROFILE=business-app NEW_INSTANCE_TYPE=t3.large bash scripts/cleanup-and-redeploy.sh
```

This will:
- Delete old instance
- Deploy new one with t3.large
- Take ~25-30 minutes total

