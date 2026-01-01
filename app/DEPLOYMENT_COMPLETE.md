# Complete End-to-End AWS Deployment Guide

## 🎯 Overview

The deployment system now supports **complete end-to-end deployment** including domain and SSL/HTTPS setup in a single command. Everything from infrastructure creation to HTTPS configuration is automated.

## 🚀 Quick Start

### Option 1: Interactive Deployment (Recommended)

```bash
cd app
make deploy-aws
```

This will prompt you for:
- AWS Region (default: ap-south-1)
- Key Pair Name (default: business-app-key)
- Instance Type (default: t3.medium)
- AWS Profile (default: business-app)
- **Domain name (optional)** - If provided, will setup domain and SSL
- **Email for SSL (optional)** - Defaults to admin@domain

### Option 2: Quick Deployment (No Domain/SSL)

```bash
cd app
make deploy-aws-quick
```

Deploys with all defaults, no prompts, no domain/SSL setup.

### Option 3: Full Deployment with Domain & SSL

```bash
cd app
make deploy-aws-full DOMAIN=samriddhi.buzz EMAIL=admin@samriddhi.buzz
```

Or with default email:

```bash
make deploy-aws-full DOMAIN=samriddhi.buzz
```

## 📋 What Gets Deployed

### 1. AWS Infrastructure
- ✅ IAM user (`business-app-deployer`)
- ✅ Key pair (`business-app-key`)
- ✅ Security group (ports 22, 80, 443)
- ✅ EC2 instance (t3.medium by default)

### 2. Application Deployment
- ✅ Docker, Docker Compose, Nginx, Node.js installation
- ✅ Repository cloning from GitHub
- ✅ All services built and deployed
- ✅ Nginx reverse proxy configuration
- ✅ Automatic backups setup

### 3. Domain & SSL Setup (if domain provided)
- ✅ DNS configuration instructions
- ✅ DNS propagation check (optional wait)
- ✅ Domain setup on EC2 (Nginx configuration)
- ✅ Port 443 added to security group
- ✅ SSL certificate from Let's Encrypt
- ✅ HTTPS configuration and HTTP→HTTPS redirect
- ✅ Automatic certificate renewal

## 🔧 Usage Examples

### Basic Deployment (No Domain)

```bash
# Interactive
make deploy-aws
# When prompted for domain, press Enter to skip

# Quick (no prompts)
make deploy-aws-quick
```

### Full Deployment with Domain

```bash
# Interactive - will prompt for domain
make deploy-aws
# Enter domain when prompted: samriddhi.buzz
# Enter email when prompted: admin@samriddhi.buzz

# Direct command
make deploy-aws-full DOMAIN=samriddhi.buzz EMAIL=admin@samriddhi.buzz
```

### With Custom AWS Profile

By default, the script uses `business-app` as the AWS profile. To use a different profile:

```bash
# Interactive
AWS_PROFILE=your-profile make deploy-aws

# Quick
AWS_PROFILE=your-profile make deploy-aws-quick

# Full
AWS_PROFILE=your-profile make deploy-aws-full DOMAIN=samriddhi.buzz
```

**Note:** If you don't specify a profile, `business-app` will be used by default.

## 📝 Domain & SSL Setup Process

When you provide a domain name, the deployment script will:

1. **Display DNS Configuration Instructions**
   - Shows exactly what A record to add in GoDaddy (or your DNS provider)
   - Prompts for confirmation that DNS is configured

2. **Wait for DNS Propagation** (optional)
   - Checks every 30 seconds for up to 10 minutes
   - Verifies domain resolves to EC2 IP
   - Can skip if DNS not ready yet

3. **Setup Domain on EC2**
   - Updates Nginx configuration to recognize domain
   - Configures Let's Encrypt validation path
   - Restarts Nginx

4. **Add HTTPS Port to Security Group**
   - Automatically adds port 443 (HTTPS) to security group
   - Allows traffic from 0.0.0.0/0

5. **Setup SSL/HTTPS**
   - Installs Certbot (Let's Encrypt client)
   - Obtains SSL certificate for domain and www subdomain
   - Configures Nginx for HTTPS
   - Enables HTTP to HTTPS redirect
   - Sets up automatic certificate renewal

## 🌐 DNS Configuration

Before domain/SSL setup, you need to configure DNS:

### GoDaddy Example

1. Log into GoDaddy
2. Go to DNS Management
3. Add A Record:
   - Type: `A`
   - Name: `@`
   - Value: `<YOUR_EC2_IP>` (shown in deployment output)
   - TTL: `600`
4. Add CNAME (optional):
   - Type: `CNAME`
   - Name: `www`
   - Value: `@`
5. **Remove any "Parked" or conflicting A records**

### Other DNS Providers

Same process - add A record pointing `@` to your EC2 public IP.

## ✅ Verification

After deployment completes:

### Check Application
```bash
# HTTP (if no domain)
curl http://<EC2_IP>

# HTTPS (if domain configured)
curl https://samriddhi.buzz
```

### Check Services
```bash
ssh -i ~/.ssh/business-app-key.pem ec2-user@<EC2_IP>
docker ps
```

### Check SSL Certificate
```bash
ssh -i ~/.ssh/business-app-key.pem ec2-user@<EC2_IP>
sudo certbot certificates
```

## 🔄 Manual Domain/SSL Setup (If Skipped)

If you skipped domain/SSL during deployment, you can run it later:

```bash
# SSH into EC2
ssh -i ~/.ssh/business-app-key.pem ec2-user@<EC2_IP>

# Navigate to app directory
cd /opt/business-app/app

# Pull latest code
git pull origin main

# Setup domain
sudo bash scripts/setup-domain-ec2.sh samriddhi.buzz

# Setup SSL
sudo bash scripts/setup-ssl-ec2.sh samriddhi.buzz admin@samriddhi.buzz
```

## 🛠️ Troubleshooting

### DNS Not Resolving

1. Wait 10-30 minutes for DNS propagation
2. Check DNS: `dig samriddhi.buzz +short`
3. Verify A record in DNS provider
4. Remove any conflicting records

### SSL Certificate Failed

1. Ensure DNS is pointing to EC2 IP
2. Ensure port 80 is accessible (for validation)
3. Check Nginx is running: `sudo systemctl status nginx`
4. Check validation path: `curl http://samriddhi.buzz/.well-known/acme-challenge/test`
5. View logs: `sudo tail -f /var/log/letsencrypt/letsencrypt.log`

### Port 443 Not Accessible

1. Check security group allows port 443
2. Run: `bash scripts/add-https-port.sh ap-south-1` (from local machine)
3. Or add manually in AWS Console

## 📚 Related Documentation

- **AWS_DEPLOYMENT.md** - Basic deployment guide
- **DEPLOYMENT_UNIFIED.md** - Unified deployment details
- **SSL_SETUP_GUIDE.md** - SSL/HTTPS setup guide
- **DOMAIN_SETUP_GUIDE.md** - Domain configuration guide

## 🎉 Summary

You now have **three deployment options**:

1. **`make deploy-aws`** - Interactive, optional domain/SSL
2. **`make deploy-aws-quick`** - Quick, no domain/SSL
3. **`make deploy-aws-full DOMAIN=...`** - Full deployment with domain/SSL

All options provide complete end-to-end deployment in a single command! 🚀

