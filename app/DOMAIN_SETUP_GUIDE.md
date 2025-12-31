# Domain Setup Guide - samriddhi.buzz

## Quick Setup

### Step 1: Run the setup script on EC2

```bash
# SSH into your EC2 instance
ssh -i ~/.ssh/business-app-key.pem ec2-user@<YOUR_EC2_IP>

# Download and run the setup script
cd /opt/business-app/app
sudo bash scripts/setup-domain-ec2.sh
```

### Step 2: Verify DNS is pointing correctly

```bash
# From your local machine
nslookup samriddhi.buzz
# Should show your EC2 IP address
```

### Step 3: Test the domain

```bash
# Wait 10-30 minutes for DNS propagation, then:
curl -I http://samriddhi.buzz
```

## What the Script Does

1. ✅ Backs up current Nginx configuration
2. ✅ Updates Nginx to recognize `samriddhi.buzz` and `www.samriddhi.buzz`
3. ✅ Tests Nginx configuration
4. ✅ Restarts Nginx service
5. ✅ Verifies all services are running
6. ✅ Provides summary and next steps

## Manual Setup (Alternative)

If you prefer to do it manually:

```bash
# SSH into EC2
ssh -i ~/.ssh/business-app-key.pem ec2-user@<YOUR_EC2_IP>

# Edit Nginx config
sudo nano /etc/nginx/conf.d/business-app.conf

# Change this line:
# server_name _;
# To:
# server_name samriddhi.buzz www.samriddhi.buzz;

# Test and restart
sudo nginx -t
sudo systemctl restart nginx
```

## DNS Configuration in GoDaddy

Make sure you have these A records in GoDaddy:

| Type | Name | Value | TTL |
|------|------|-------|-----|
| A | @ | Your EC2 IP | 600 |
| A | www | Your EC2 IP | 600 |

## Troubleshooting

### Domain not resolving
```bash
# Check DNS
nslookup samriddhi.buzz
dig samriddhi.buzz

# Verify it points to your EC2 IP
```

### Nginx not responding
```bash
# Check Nginx status
sudo systemctl status nginx

# Check Nginx config
sudo nginx -t

# Check logs
sudo tail -f /var/log/nginx/error.log
```

### Services not running
```bash
# Check Docker services
docker ps

# Restart services if needed
cd /opt/business-app/app
docker-compose -f docker-compose.prod.yml restart
```

## Next Steps (Optional)

1. **Setup SSL/HTTPS** - Use Let's Encrypt for `https://samriddhi.buzz`
2. **Elastic IP** - Allocate Elastic IP to prevent IP changes
3. **Email** - Configure email records if needed

## Verification Checklist

- [ ] DNS A record added in GoDaddy
- [ ] Setup script run on EC2
- [ ] Nginx configuration updated
- [ ] Nginx restarted successfully
- [ ] DNS propagation complete (10-30 minutes)
- [ ] Domain accessible: http://samriddhi.buzz
- [ ] API endpoints working: http://samriddhi.buzz/api/v1/*

---

**Your domain is ready!** 🎉

