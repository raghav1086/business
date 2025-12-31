# SSL/HTTPS Setup Guide for samriddhi.buzz

## Quick Fix for Current Error

**The error you're seeing is because HTTPS is not configured yet.**

### Immediate Solution: Use HTTP

For now, use **HTTP** instead of HTTPS:

```
✅ http://samriddhi.buzz
✅ http://www.samriddhi.buzz

❌ https://samriddhi.buzz (not configured yet)
```

## Setup HTTPS/SSL (Recommended)

### Option 1: Automated Setup (Recommended)

Run the SSL setup script on your EC2 instance:

```bash
# SSH into EC2
ssh -i ~/.ssh/business-app-key.pem ec2-user@<YOUR_EC2_IP>

# Navigate to app directory
cd /opt/business-app/app

# Pull latest code (if script is in repo)
git pull origin main

# Run SSL setup script
sudo bash scripts/setup-ssl-ec2.sh
```

### Option 2: Manual Setup

```bash
# SSH into EC2
ssh -i ~/.ssh/business-app-key.pem ec2-user@<YOUR_EC2_IP>

# Install Certbot
sudo yum install -y certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx \
  -d samriddhi.buzz \
  -d www.samriddhi.buzz \
  --non-interactive \
  --agree-tos \
  --email your-email@example.com \
  --redirect
```

## Prerequisites

Before setting up SSL, ensure:

1. ✅ Domain DNS is pointing to EC2 (A record in GoDaddy)
2. ✅ HTTP is working: `http://samriddhi.buzz`
3. ✅ Nginx is configured for domain (run `setup-domain-ec2.sh` first)
4. ✅ Security group allows port 443 (HTTPS)

## Security Group Configuration

Make sure your EC2 security group allows:

- **Port 80** (HTTP) - Inbound from 0.0.0.0/0
- **Port 443** (HTTPS) - Inbound from 0.0.0.0/0

```bash
# Add HTTPS rule to security group
aws ec2 authorize-security-group-ingress \
  --region ap-south-1 \
  --group-id <YOUR_SECURITY_GROUP_ID> \
  --protocol tcp \
  --port 443 \
  --cidr 0.0.0.0/0
```

## Troubleshooting

### Error: Domain not resolving
```bash
# Check DNS
nslookup samriddhi.buzz
dig samriddhi.buzz

# Should show your EC2 IP
```

### Error: Port 443 not accessible
```bash
# Check security group
aws ec2 describe-security-groups \
  --region ap-south-1 \
  --group-ids <YOUR_SECURITY_GROUP_ID>

# Add port 443 if missing
```

### Error: HTTP not working
```bash
# First run domain setup
sudo bash scripts/setup-domain-ec2.sh

# Then try SSL setup
sudo bash scripts/setup-ssl-ec2.sh
```

## After SSL Setup

1. ✅ Test HTTPS: `https://samriddhi.buzz`
2. ✅ HTTP will automatically redirect to HTTPS
3. ✅ Certificate auto-renews every 90 days
4. ✅ Update app URLs to use HTTPS

## Quick Checklist

- [ ] Domain DNS configured (GoDaddy A record)
- [ ] HTTP working: `http://samriddhi.buzz`
- [ ] Security group allows port 443
- [ ] Domain setup script run: `setup-domain-ec2.sh`
- [ ] SSL setup script run: `setup-ssl-ec2.sh`
- [ ] HTTPS working: `https://samriddhi.buzz`

---

**For now, use HTTP: http://samriddhi.buzz**  
**Then setup HTTPS using the script above!** 🔒

