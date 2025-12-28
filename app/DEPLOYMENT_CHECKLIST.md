# Complete Deployment Checklist

## ✅ What We've Covered

### 1. Fake OTP Implementation
- ✅ Implemented in `app/apps/auth-service/src/services/otp.service.ts`
- ✅ Uses last 6 digits of phone number
- ✅ Enabled via `ENABLE_FAKE_OTP=true` environment variable
- ✅ Example: Phone `9175760649` → OTP `760649`
- ✅ Configured in `docker-compose.prod.yml`

### 2. AWS Infrastructure Setup
- ✅ IAM user creation (`business-app-deployer`)
- ✅ IAM policy with EC2 permissions
- ✅ Key pair creation (`business-app-key`)
- ✅ Security group configuration (ports 22, 80, 443 only)
- ✅ VPC and subnet detection
- ✅ EC2 instance launch (t3.small)

### 3. Docker Configuration
- ✅ Production Docker Compose (`docker-compose.prod.yml`)
- ✅ All 6 backend services configured
- ✅ Web app service configured
- ✅ PostgreSQL and Redis containers
- ✅ Health checks for all services
- ✅ Proper service dependencies
- ✅ Network configuration

### 4. Web App Deployment
- ✅ Web app Dockerfile with multi-stage build
- ✅ Next.js production build
- ✅ Environment variables configured
- ✅ Health check configured
- ✅ .dockerignore for optimized builds
- ✅ Proper file copying

### 5. Nginx Reverse Proxy
- ✅ Nginx installation and configuration
- ✅ Reverse proxy for web app (port 3000)
- ✅ API routing for all backend services
- ✅ Proper proxy headers
- ✅ Web app exposed publicly
- ✅ Backend services internal only

### 6. Automated Deployment Script
- ✅ Fully automated deployment (`deploy-aws-auto.sh`)
- ✅ IAM setup automation
- ✅ Key pair creation
- ✅ EC2 instance launch
- ✅ Repository cloning from GitHub
- ✅ Automatic password generation
- ✅ Service deployment
- ✅ Nginx configuration
- ✅ Backup setup
- ✅ Deployment monitoring

### 7. Security
- ✅ Only web app exposed publicly
- ✅ Backend services internal only
- ✅ Secure password generation
- ✅ Non-root Docker users
- ✅ Security group restrictions
- ✅ Automatic backups

### 8. Documentation
- ✅ AWS Deployment Guide (`AWS_DEPLOYMENT.md`)
- ✅ Deployment Checklist (this file)
- ✅ Makefile targets for easy deployment

## 📋 Pre-Deployment Checklist

Before running `make deploy-aws`, ensure:

- [ ] AWS CLI installed (`aws --version`)
- [ ] AWS credentials configured (`aws configure`)
- [ ] AWS credentials verified (`aws sts get-caller-identity`)
- [ ] Sufficient AWS permissions (EC2, IAM)
- [ ] SSH directory exists (`~/.ssh/`)
- [ ] Internet connection available

## 🚀 Deployment Steps

### Single Command Deployment

```bash
cd app
make deploy-aws
```

Or quick deploy with defaults:

```bash
make deploy-aws-quick
```

### What Happens Automatically

1. ✅ Verifies AWS credentials
2. ✅ Creates IAM user if needed
3. ✅ Creates key pair if needed
4. ✅ Finds VPC and subnet
5. ✅ Creates security group
6. ✅ Launches EC2 instance
7. ✅ Installs Docker, Docker Compose, Nginx, Node.js
8. ✅ Clones repository from GitHub
9. ✅ Generates secure passwords
10. ✅ Builds all Docker images
11. ✅ Starts all services
12. ✅ Configures Nginx
13. ✅ Sets up automatic backups
14. ✅ Returns application URL

## 🔍 Post-Deployment Verification

After deployment, verify:

```bash
# Get instance IP from deployment output
INSTANCE_IP="<from-deployment-output>"

# Check services
ssh -i ~/.ssh/business-app-key.pem ec2-user@$INSTANCE_IP 'docker ps'

# Check web app
curl http://$INSTANCE_IP

# Check API
curl http://$INSTANCE_IP/api/v1/auth/health

# Check logs
ssh -i ~/.ssh/business-app-key.pem ec2-user@$INSTANCE_IP 'docker-compose -f /opt/business-app/app/docker-compose.prod.yml logs --tail=50'
```

## 🐛 Troubleshooting

### Services Not Starting

```bash
# Check Docker logs
ssh -i ~/.ssh/business-app-key.pem ec2-user@$INSTANCE_IP 'docker-compose -f /opt/business-app/app/docker-compose.prod.yml logs'

# Check specific service
ssh -i ~/.ssh/business-app-key.pem ec2-user@$INSTANCE_IP 'docker logs business-auth'
```

### Web App Not Accessible

```bash
# Check Nginx status
ssh -i ~/.ssh/business-app-key.pem ec2-user@$INSTANCE_IP 'sudo systemctl status nginx'

# Check Nginx config
ssh -i ~/.ssh/business-app-key.pem ec2-user@$INSTANCE_IP 'sudo nginx -t'

# Check web app container
ssh -i ~/.ssh/business-app-key.pem ec2-user@$INSTANCE_IP 'docker logs business-web-app'
```

### Database Issues

```bash
# Check PostgreSQL
ssh -i ~/.ssh/business-app-key.pem ec2-user@$INSTANCE_IP 'docker exec business-postgres psql -U postgres -c "SELECT version();"'

# Check database creation
ssh -i ~/.ssh/business-app-key.pem ec2-user@$INSTANCE_IP 'docker exec business-postgres psql -U postgres -c "\l"'
```

## 📊 Service Architecture

```
Internet
  ↓
EC2 Instance (t3.small)
  ├── Nginx (Port 80) - Public
  │   ├── Web App (Port 3000) - Public via Nginx
  │   └── Backend APIs (Ports 3002-3007) - Internal via Nginx
  ├── PostgreSQL (Container) - Internal
  └── Redis (Container) - Internal
```

## 🔐 Security Features

- ✅ Only ports 22 (SSH), 80 (HTTP), 443 (HTTPS) public
- ✅ Backend services (3002-3007) internal only
- ✅ Web app exposed via Nginx reverse proxy
- ✅ Secure passwords auto-generated
- ✅ Non-root Docker users
- ✅ Automatic daily backups
- ✅ Health checks for all services

## 💰 Cost Estimation

For 5 beta users:
- **EC2 t3.small:** ~$15/month
- **EBS Storage (30GB):** ~$3/month
- **Data Transfer:** ~$1-2/month
- **Total:** ~$20/month

## 📝 Environment Variables

Production environment variables (auto-generated):
- `DB_PASSWORD` - Secure database password
- `JWT_SECRET` - JWT signing secret
- `JWT_REFRESH_SECRET` - JWT refresh secret
- `ENABLE_FAKE_OTP=true` - Fake OTP enabled for beta

Web app environment variables:
- `NEXT_PUBLIC_AUTH_API_URL=http://localhost/api/v1/auth`
- `NEXT_PUBLIC_BUSINESS_API_URL=http://localhost/api/v1/business`
- `NEXT_PUBLIC_PARTY_API_URL=http://localhost/api/v1/party`
- `NEXT_PUBLIC_INVENTORY_API_URL=http://localhost/api/v1/inventory`
- `NEXT_PUBLIC_INVOICE_API_URL=http://localhost/api/v1/invoice`
- `NEXT_PUBLIC_PAYMENT_API_URL=http://localhost/api/v1/payment`

## 🔄 Update Deployment

To update the deployment:

```bash
# SSH into instance
ssh -i ~/.ssh/business-app-key.pem ec2-user@<INSTANCE_IP>

# Update code
cd /opt/business-app
git pull

# Rebuild and redeploy
cd app
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml build --no-cache
docker-compose -f docker-compose.prod.yml up -d

# Check status
docker-compose -f docker-compose.prod.yml ps
```

## ✅ Everything is Ready!

All components are in place:
- ✅ Fake OTP implementation
- ✅ AWS deployment automation
- ✅ Docker configuration
- ✅ Web app deployment
- ✅ Nginx configuration
- ✅ Security setup
- ✅ Backup configuration
- ✅ Documentation

**You're ready to deploy with a single command!**

