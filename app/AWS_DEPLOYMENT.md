# AWS Deployment Guide

## Quick Start

### Single Command Deployment

```bash
cd app
make deploy-aws
```

Or with all defaults (no prompts):

```bash
make deploy-aws-quick
```

## Prerequisites

1. **AWS CLI installed and configured:**
   ```bash
   # Configure default profile (business-app)
   aws configure --profile business-app
   # Enter your AWS Access Key ID, Secret Access Key, Region (ap-south-1), and output format (json)
   ```

2. **Verify AWS credentials:**
   ```bash
   aws sts get-caller-identity --profile business-app
   ```

**Note:** The deployment script uses `business-app` as the default AWS profile. You can override it by setting `AWS_PROFILE` environment variable.

## What the Deployment Does Automatically

The `deploy-aws` command automatically:

1. ✅ Verifies AWS credentials
2. ✅ Creates IAM user (`business-app-deployer`) if needed
3. ✅ Creates key pair (`business-app-key`) if needed
4. ✅ Finds VPC and subnet
5. ✅ Creates security group (ports 22, 80, 443 only)
6. ✅ Launches EC2 instance (t3.medium by default)
7. ✅ Installs Docker, Docker Compose, Nginx, Node.js
8. ✅ Clones repository from GitHub: `https://github.com/ashishnimrot/business.git`
9. ✅ Generates secure passwords automatically
10. ✅ Builds and deploys all services
11. ✅ Configures Nginx reverse proxy
12. ✅ Sets up automatic backups
13. ✅ Returns application URL

**Note:** Domain and SSL setup are done separately after deployment (see Domain & SSL Setup section below).

## Architecture

```
Internet
  ↓
EC2 Instance (t3.small)
  ├── Nginx (Port 80/443) - Public
  │   ├── Web App (Port 3000) - Public via Nginx
  │   └── Backend APIs (Ports 3002-3007) - Internal only, via Nginx
  ├── PostgreSQL (Container) - Internal
  └── Redis (Container) - Internal
```

## Security

- **Only ports 22 (SSH), 80 (HTTP), 443 (HTTPS) are public**
- Backend services (3002-3007) are **internal only**
- Web app exposed via Nginx reverse proxy
- Secure passwords auto-generated
- Automatic daily backups configured

## After Deployment

The script will output:
- Instance ID
- Public IP
- Application URL: `http://<PUBLIC_IP>`

### Access Your Application

- **Web App:** `http://<PUBLIC_IP>`
- **APIs:** `http://<PUBLIC_IP>/api/v1/*`

## Domain & SSL Setup (Optional but Recommended)

### Step 1: Configure Domain DNS

1. **Purchase/Configure Domain** (e.g., `samriddhi.buzz`)
2. **Add A Record in GoDaddy (or your DNS provider):**
   - Type: `A`
   - Name: `@` (root domain)
   - Value: Your EC2 Public IP (e.g., `13.203.216.163`)
   - TTL: `600`
3. **Add CNAME for www (optional):**
   - Type: `CNAME`
   - Name: `www`
   - Value: `@`
   - TTL: `3600`

**Important:** Remove any "Parked" or conflicting A records.

### Step 2: Setup Domain on EC2

```bash
# SSH into EC2
ssh -i ~/.ssh/business-app-key.pem ec2-user@<YOUR_EC2_IP>

# Navigate to app directory
cd /opt/business-app/app

# Pull latest code
git pull origin main

# Run domain setup script
sudo bash scripts/setup-domain-ec2.sh
```

This will:
- ✅ Update Nginx to recognize your domain
- ✅ Configure Let's Encrypt validation path
- ✅ Test and restart Nginx

### Step 3: Add HTTPS Port to Security Group

**From your local machine:**

```bash
cd app
bash scripts/add-https-port.sh ap-south-1
```

**Or manually in AWS Console:**
- EC2 → Security Groups → Your SG → Inbound Rules
- Add Rule: Port 443, Protocol TCP, Source 0.0.0.0/0

### Step 4: Setup SSL/HTTPS

```bash
# On EC2 instance
cd /opt/business-app/app

# Run SSL setup script
sudo bash scripts/setup-ssl-ec2.sh
```

This will:
- ✅ Install Certbot (Let's Encrypt client)
- ✅ Obtain SSL certificate for your domain
- ✅ Configure Nginx for HTTPS
- ✅ Setup automatic certificate renewal
- ✅ Enable HTTP to HTTPS redirect

### Step 5: Verify HTTPS

After SSL setup completes:

```bash
# Test HTTPS
curl -I https://samriddhi.buzz

# Or open in browser
# https://samriddhi.buzz
```

**Expected Result:**
- ✅ `https://samriddhi.buzz` works
- ✅ `http://samriddhi.buzz` redirects to HTTPS
- ✅ Certificate valid for 90 days (auto-renews)

### Domain & SSL Troubleshooting

**Check SSL Status:**
```bash
# On EC2
sudo bash scripts/check-ssl-status.sh
```

**Common Issues:**

1. **DNS not resolving:**
   ```bash
   dig samriddhi.buzz +short
   # Should show your EC2 IP
   ```

2. **Port 443 not accessible:**
   - Run: `bash scripts/add-https-port.sh ap-south-1`
   - Or add manually in AWS Console

3. **SSL validation fails:**
   - Ensure domain setup script was run first
   - Check DNS propagation (wait 10-30 minutes)
   - Verify no "Parked" A records in DNS

4. **Certificate not obtained:**
   - Check validation path: `curl http://samriddhi.buzz/.well-known/acme-challenge/test`
   - Ensure port 80 is accessible from internet
   - Check Nginx config: `sudo nginx -t`

For detailed SSL setup guide, see: `SSL_SETUP_GUIDE.md`

### SSH Access

```bash
ssh -i ~/.ssh/business-app-key.pem ec2-user@<PUBLIC_IP>
```

### Check Deployment Status

```bash
ssh -i ~/.ssh/business-app-key.pem ec2-user@<PUBLIC_IP> 'docker ps'
```

### View Logs

```bash
ssh -i ~/.ssh/business-app-key.pem ec2-user@<PUBLIC_IP> 'docker-compose -f /opt/business-app/app/docker-compose.prod.yml logs'
```

## Manual Deployment Steps (if needed)

If you need to manually deploy or update:

```bash
# SSH into instance
ssh -i ~/.ssh/business-app-key.pem ec2-user@<PUBLIC_IP>

# Navigate to app directory
cd /opt/business-app/app

# Update code
git pull

# Rebuild and redeploy
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml build --no-cache
docker-compose -f docker-compose.prod.yml up -d

# Check status
docker-compose -f docker-compose.prod.yml ps
```

## Environment Variables

Production environment variables are automatically generated and stored in:
- `/opt/business-app/app/.env.production`

Variables include:
- `DB_PASSWORD` - Auto-generated secure password
- `JWT_SECRET` - Auto-generated secure secret
- `JWT_REFRESH_SECRET` - Auto-generated secure secret

## Cost Estimation

For 5 beta users:
- **EC2 t3.small:** ~$15/month
- **EBS Storage (30GB):** ~$3/month
- **Data Transfer:** ~$1-2/month
- **Total:** ~$20/month

## Troubleshooting

### Deployment takes longer than expected
- Normal deployment takes 5-10 minutes
- Check logs: `ssh ... 'tail -f /var/log/user-data.log'`

### Services not starting
- Check Docker logs: `docker-compose -f docker-compose.prod.yml logs`
- Verify environment file exists: `cat .env.production`

### Web app not accessible
- Check Nginx status: `sudo systemctl status nginx`
- Check Nginx config: `sudo nginx -t`
- Verify services are running: `docker ps`

### Need to restart services
```bash
ssh -i ~/.ssh/business-app-key.pem ec2-user@<PUBLIC_IP>
cd /opt/business-app/app
docker-compose -f docker-compose.prod.yml restart
```

## Cleanup

To remove the deployment:

```bash
# Get instance ID
aws ec2 describe-instances --filters "Name=tag:Name,Values=business-app-beta" --query 'Reservations[0].Instances[0].InstanceId' --output text

# Terminate instance
aws ec2 terminate-instances --instance-ids <INSTANCE_ID>

# Delete security group (after instance is terminated)
aws ec2 delete-security-group --group-id <SECURITY_GROUP_ID>
```

## Support

For issues or questions, check:
- Deployment logs: `/var/log/user-data.log` on EC2 instance
- Docker logs: `docker-compose logs` on EC2 instance
- AWS CloudWatch logs (if configured)

