# Unified AWS Deployment - Single Command

## 🎯 Overview

The unified deployment script (`deploy-aws-unified.sh`) provides a **single command** for end-to-end AWS deployment. It consolidates all deployment functionality, fixes, and edge case handling into one comprehensive script.

## 🚀 Quick Start

### Single Command Deployment

```bash
# Interactive mode (with prompts)
make deploy-aws

# Quick deploy (all defaults, no prompts)
make deploy-aws-quick

# Direct script call
bash scripts/deploy-aws-unified.sh [region] [key-name] [instance-type] [aws-profile]
```

### Examples

```bash
# Default deployment
make deploy-aws

# With AWS profile
AWS_PROFILE=business-app make deploy-aws

# Custom instance type
bash scripts/deploy-aws-unified.sh ap-south-1 business-app-key t3.large business-app

# Quick deploy with profile
AWS_PROFILE=business-app make deploy-aws-quick
```

## ✅ What It Does (End-to-End)

### 1. AWS Infrastructure Setup
- ✅ Verifies AWS credentials
- ✅ Creates/checks IAM user (`business-app-deployer`)
- ✅ Creates/checks key pair (`business-app-key`)
- ✅ Creates/checks security group (ports 22, 80, 443)
- ✅ Detects VPC and subnet
- ✅ Finds latest AMI (Amazon Linux 2023)

### 2. EC2 Instance Launch
- ✅ Launches EC2 instance with user-data script
- ✅ Handles Free Tier restrictions
- ✅ Waits for instance to be running
- ✅ Gets public IP address

### 3. Instance Setup (via user-data)
- ✅ System updates
- ✅ Docker installation
- ✅ Docker Compose installation
- ✅ Docker Buildx installation (v0.17.0)
- ✅ Nginx installation
- ✅ Node.js 20 installation
- ✅ Git installation
- ✅ Docker permissions setup

### 4. Application Deployment
- ✅ Repository cloning (with retry logic)
- ✅ Environment variable generation:
  - `DB_PASSWORD` (secure random)
  - `JWT_SECRET` (secure random)
  - `JWT_REFRESH_SECRET` (secure random)
  - `ENABLE_SYNC=true`
  - `ENABLE_FAKE_OTP=true`
- ✅ Docker build (with retry logic)
- ✅ Docker Compose up
- ✅ Port mapping verification (3002-3007)

### 5. Database Setup
- ✅ PostgreSQL container health check
- ✅ Database initialization wait
- ✅ Table creation verification (TypeORM synchronize)
- ✅ All 6 databases verified

### 6. Nginx Configuration
- ✅ Complete Nginx config with all routes:
  - Web app (`/`)
  - Auth service (`/api/v1/auth`)
  - Business service (`/api/v1/businesses`)
  - Party service (`/api/v1/parties`)
  - Inventory service (`/api/v1/items`)
  - Stock endpoints (`/api/v1/stock`)
  - Invoice service (`/api/v1/invoices`)
  - Payment service (`/api/v1/payments`)
- ✅ Nginx config test
- ✅ Nginx restart and enable
- ✅ Backend connectivity verification

### 7. Backup Setup
- ✅ Backup script creation (`/home/ec2-user/backup.sh`)
- ✅ Cron job setup (daily at 2 AM)
- ✅ Backup retention (7 days)

### 8. Verification
- ✅ Verification script creation (`/home/ec2-user/verify-deployment.sh`)
- ✅ Service health checks
- ✅ Deployment monitoring
- ✅ Final status report

## 🔧 Features

### Error Handling
- ✅ Free Tier restriction detection
- ✅ Network retry logic (npm, git clone)
- ✅ Docker Buildx permission fixes
- ✅ Environment variable parsing (special characters)
- ✅ Docker permission fixes
- ✅ Package conflict handling (curl-minimal)
- ✅ Base64 encoding (macOS vs Linux)
- ✅ Public IP assignment wait
- ✅ Service startup wait with retries

### Edge Cases Handled
- ✅ Existing IAM user
- ✅ Existing key pair
- ✅ Existing security group
- ✅ Docker permission issues
- ✅ Build failures (retry without --no-cache)
- ✅ Network connectivity issues
- ✅ Service startup delays

## 📋 Deployment Output

After successful deployment, you'll see:

```
═══════════════════════════════════════════════════════════════
🎉 DEPLOYMENT SUCCESSFUL!
═══════════════════════════════════════════════════════════════

🌐 Your application is live at:
   http://<PUBLIC_IP>

📋 Access Information:
   - Web App: http://<PUBLIC_IP>
   - API: http://<PUBLIC_IP>/api/v1/*
   - SSH: ssh -i ~/.ssh/business-app-key.pem ec2-user@<PUBLIC_IP>

🔐 Security Notes:
   - Backend services are internal only (not exposed)
   - Only web app is accessible publicly
   - All API calls go through Nginx reverse proxy

📊 Check deployment status:
   ssh -i ~/.ssh/business-app-key.pem ec2-user@<PUBLIC_IP> 'docker ps'

🔍 Verify deployment (recommended):
   ssh -i ~/.ssh/business-app-key.pem ec2-user@<PUBLIC_IP> '/home/ec2-user/verify-deployment.sh'
```

## 🔍 Verification

After deployment, verify everything is working:

```bash
# SSH into instance
ssh -i ~/.ssh/business-app-key.pem ec2-user@<PUBLIC_IP>

# Run verification script
/home/ec2-user/verify-deployment.sh

# Check service status
docker ps

# Check logs
cd /opt/business-app/app
docker-compose -f docker-compose.prod.yml logs --tail=50
```

## 📝 Configuration Files

### Environment Variables (Auto-generated)
- `.env.production` - Production environment variables
- `.env` - Docker Compose environment file

### Scripts Created on Instance
- `/home/ec2-user/backup.sh` - Daily backup script
- `/home/ec2-user/verify-deployment.sh` - Verification script

### Nginx Configuration
- `/etc/nginx/conf.d/business-app.conf` - Complete Nginx config

## 🆚 Comparison with Old Scripts

### Before (Multiple Scripts)
- `deploy-aws-auto.sh` - Main deployment
- `fix-nginx.sh` - Nginx fixes
- `fix-nginx-routing.sh` - Routing fixes
- `fix-502-complete.sh` - 502 error fixes
- `fix-deployment-on-instance.sh` - Instance fixes
- `retry-build-on-instance.sh` - Build retries

### After (Unified Script)
- `deploy-aws-unified.sh` - **Single comprehensive script**
  - All functionality consolidated
  - All fixes included
  - All edge cases handled

## 🎯 Benefits

1. **Single Command**: `make deploy-aws` does everything
2. **No Manual Steps**: Fully automated end-to-end
3. **All Fixes Included**: No need for separate fix scripts
4. **Better Error Handling**: Comprehensive error detection and recovery
5. **Clear Output**: Progress indicators and final summary
6. **Verification Built-in**: Automatic health checks and verification

## 📚 Related Documentation

- `AWS_DEPLOYMENT.md` - Detailed AWS deployment guide
- `AWS_CREDENTIALS_SETUP.md` - AWS credentials configuration
- `DEPLOYMENT_CHECKLIST.md` - Pre-deployment checklist
- `verify-deployment.sh` - Post-deployment verification script

## 🐛 Troubleshooting

### Free Tier Restriction
If you see Free Tier restriction error:
```bash
# Use t3.micro (Free Tier eligible)
bash scripts/deploy-aws-unified.sh ap-south-1 business-app-key t3.micro
```

### Deployment Still in Progress
If deployment seems stuck:
```bash
# Check instance status
ssh -i ~/.ssh/business-app-key.pem ec2-user@<PUBLIC_IP> 'docker ps'

# Check logs
ssh -i ~/.ssh/business-app-key.pem ec2-user@<PUBLIC_IP> 'cd /opt/business-app/app && docker-compose -f docker-compose.prod.yml logs'
```

### Services Not Starting
```bash
# Check service logs
ssh -i ~/.ssh/business-app-key.pem ec2-user@<PUBLIC_IP> 'docker logs business-auth'
ssh -i ~/.ssh/business-app-key.pem ec2-user@<PUBLIC_IP> 'docker logs business-web-app'

# Restart services
ssh -i ~/.ssh/business-app-key.pem ec2-user@<PUBLIC_IP> 'cd /opt/business-app/app && docker-compose -f docker-compose.prod.yml restart'
```

## ✅ Success Criteria

Deployment is successful when:
- ✅ All Docker containers are running
- ✅ All databases have tables
- ✅ All health endpoints respond
- ✅ Nginx is running
- ✅ Web app is accessible at `http://<PUBLIC_IP>`
- ✅ API endpoints work via Nginx

---

**Ready to deploy?** Run `make deploy-aws` and everything will be set up automatically! 🚀

