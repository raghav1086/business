# CI/CD Setup Checklist

Quick checklist to set up and test your CI/CD pipeline.

## ✅ Step 1: Verify Prerequisites

Run the verification script:

```bash
bash scripts/verify-cicd-setup.sh
```

This will check:
- ✅ AWS credentials configured
- ✅ SSH key file exists
- ✅ EC2 instance found
- ✅ GitHub repository configured
- ✅ Workflow file exists

## ✅ Step 2: Get GitHub Secrets Values

Run the helper script to prepare secret values:

```bash
bash scripts/get-github-secrets-help.sh
```

This will help you:
- Get AWS Access Key ID
- Get AWS Secret Access Key  
- Get SSH Private Key contents

## ✅ Step 3: Add Secrets to GitHub

1. Go to: **GitHub Repository** → **Settings** → **Secrets and variables** → **Actions**

2. Add these 3 secrets:
   - `AWS_ACCESS_KEY_ID` - Your AWS Access Key ID
   - `AWS_SECRET_ACCESS_KEY` - Your AWS Secret Access Key
   - `EC2_SSH_PRIVATE_KEY` - Entire contents of your `.pem` file

## ✅ Step 4: Verify EC2 Instance Tag

Check your instance tag:

```bash
aws ec2 describe-instances \
  --region ap-south-1 \
  --filters "Name=instance-state-name,Values=running" \
  --query 'Reservations[*].Instances[*].[InstanceId,Tags[?Key==`Name`].Value|[0]]' \
  --output table
```

**Expected**: Instance with tag `Name=business-app-beta`

**If different**: Update `.github/workflows/deploy-services.yml`:
```yaml
env:
  INSTANCE_TAG: your-instance-tag-name
```

## ✅ Step 5: Test the Pipeline

Run the test script:

```bash
bash scripts/test-cicd-deployment.sh
```

This will:
1. Create a test file in a service
2. Commit the change
3. Push to main branch
4. Trigger the CI/CD pipeline

**Or manually**:
1. Make a small change to any service
2. Commit and push to `main`
3. Check GitHub Actions tab

## ✅ Step 6: Monitor Deployment

1. Go to **GitHub** → **Actions** tab
2. Click on **"Service-Based CI/CD Pipeline"** workflow
3. Watch the deployment progress:
   - ✅ Detect Changed Services
   - ✅ Deploy Services to EC2
   - ✅ Verify deployment

## ✅ Step 7: Verify on EC2

After deployment completes:

```bash
# SSH into instance
ssh -i ~/.ssh/business-app-key.pem ec2-user@<YOUR_EC2_IP>

# Check service status
cd /opt/business-app/app
docker-compose -f docker-compose.prod.yml ps

# Verify latest code
cd /opt/business-app
git log --oneline -1
```

## 📚 Documentation

- **Complete Setup Guide**: `CICD_SETUP_GUIDE.md`
- **Pipeline Documentation**: `docs/CICD_PIPELINE.md`
- **Quick Start**: `CICD_QUICK_START.md`

## 🆘 Troubleshooting

### Secrets not working?
- Verify secrets are added correctly in GitHub
- Check secret names match exactly (case-sensitive)
- Ensure SSH key includes BEGIN/END lines

### Instance not found?
- Verify instance tag matches workflow configuration
- Check instance is running
- Verify AWS credentials have EC2 permissions

### Deployment fails?
- Check GitHub Actions logs for specific errors
- Verify SSH key is correct
- Check EC2 security group allows SSH from GitHub IPs

## 🎉 Success!

Once everything works:
- ✅ Pipeline automatically deploys on push to `main`
- ✅ Only changed services are rebuilt
- ✅ Latest code always fetched from `main` branch
- ✅ Deployments visible in GitHub Actions

