# EC2 Instance Type Recommendations

## Current Setup Requirements

Your deployment includes:
- **6 Backend Microservices** (auth, business, party, inventory, invoice, payment)
- **1 Web Application** (Next.js)
- **PostgreSQL Database** (with 6 databases)
- **Redis Cache**
- **Nginx Reverse Proxy**

## Instance Type Comparison

### t3.small (Previous Default) ❌ Not Recommended
- **vCPU:** 2
- **RAM:** 2 GB
- **Network:** Up to 5 Gbps
- **Cost:** ~$15/month
- **Issue:** Too tight for all services, may cause OOM (Out of Memory) errors

### t3.medium (New Default) ✅ Recommended for Beta
- **vCPU:** 2
- **RAM:** 4 GB
- **Network:** Up to 5 Gbps
- **Cost:** ~$30/month
- **Why:** Better headroom for all services, comfortable for 5-10 beta users

### t3.large (For Growth) ✅ Recommended for Production
- **vCPU:** 2
- **RAM:** 8 GB
- **Network:** Up to 5 Gbps
- **Cost:** ~$60/month
- **Why:** More headroom, better performance, handles 20-50 users comfortably

### t3a.medium/t3a.large (Cost-Effective Alternative)
- Same specs as t3.medium/large
- **Cost:** 10% cheaper (AMD-based)
- **Why:** Same performance, lower cost

## Resource Usage Estimate

| Component | RAM Usage | Notes |
|-----------|-----------|-------|
| PostgreSQL | ~500 MB | Base + 6 databases |
| Redis | ~100 MB | Cache and sessions |
| 6 Backend Services | ~1.2 GB | ~200 MB each |
| Web App (Next.js) | ~300 MB | Production build |
| Nginx | ~50 MB | Reverse proxy |
| System/OS | ~500 MB | Amazon Linux |
| **Total** | **~2.65 GB** | **Minimum recommended: 4 GB** |

## Recommendations by Use Case

### Beta Testing (5-10 users)
**Recommended:** `t3.medium`
- 4 GB RAM provides comfortable headroom
- 2 vCPU handles concurrent requests
- Cost-effective at ~$30/month

### Production (20-50 users)
**Recommended:** `t3.large`
- 8 GB RAM for better performance
- Handles traffic spikes
- Cost: ~$60/month

### High Traffic (100+ users)
**Recommended:** `t3.xlarge` or consider separate services
- 16 GB RAM
- Better to separate database (RDS) and services
- Cost: ~$120/month

## Cost Comparison

| Instance Type | Monthly Cost | Annual Cost | Best For |
|---------------|--------------|-------------|----------|
| t3.small | ~$15 | ~$180 | Development only |
| t3.medium | ~$30 | ~$360 | **Beta (5-10 users)** |
| t3.large | ~$60 | ~$720 | Production (20-50 users) |
| t3.xlarge | ~$120 | ~$1,440 | High traffic |

## Updated Default

The deployment script now defaults to **`t3.medium`** which is the sweet spot for:
- ✅ All services running comfortably
- ✅ Room for growth
- ✅ Reasonable cost for beta
- ✅ No OOM errors

## How to Deploy with Different Instance Type

### Use Default (t3.medium)
```bash
cd app
AWS_PROFILE=business-app make deploy-aws-quick
```

### Specify Custom Instance Type
```bash
cd app
AWS_PROFILE=business-app bash scripts/deploy-aws-auto.sh ap-south-1 business-app-key t3.large
```

### Interactive (Choose Instance Type)
```bash
cd app
AWS_PROFILE=business-app make deploy-aws
# When prompted, enter: t3.large
```

## Monitoring Resource Usage

After deployment, monitor usage:

```bash
# SSH into instance
ssh -i ~/.ssh/business-app-key.pem ec2-user@<IP>

# Check memory usage
free -h

# Check CPU usage
top

# Check Docker container resource usage
docker stats
```

## When to Upgrade

Upgrade to `t3.large` if you see:
- Memory usage consistently > 80%
- CPU usage consistently > 70%
- Slow response times
- OOM errors in logs
- More than 20 concurrent users

## Summary

✅ **Default changed to `t3.medium`** - Better for your setup
✅ **4 GB RAM** - Comfortable for all services
✅ **~$30/month** - Reasonable for beta
✅ **Room to grow** - Can handle 10-20 users

The deployment will now use `t3.medium` by default, which is much better suited for your application stack!

