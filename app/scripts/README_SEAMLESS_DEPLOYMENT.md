# Seamless Deployment Guide

## Overview

The seamless deployment system intelligently detects which services have changed and deploys only those services without impacting others. This ensures:

- ✅ **Zero downtime** for unchanged services
- ✅ **Faster deployments** by only rebuilding what's needed
- ✅ **Automatic dependency handling** - dependent services are started if needed
- ✅ **Rollback capability** - automatic backups before each deployment
- ✅ **Health verification** - ensures services are healthy after deployment

## Quick Start

### Auto-detect and deploy changed services
```bash
make deploy-smart
# or
./scripts/deploy-seamless.sh
```

### Deploy specific service
```bash
make deploy-smart-service SERVICE=auth-service
# or
./scripts/deploy-seamless.sh --service auth-service
```

### Force deploy all services
```bash
make deploy-smart-all
# or
./scripts/deploy-seamless.sh --all
```

### Rollback last deployment
```bash
make deploy-rollback
# or
./scripts/deploy-seamless.sh --rollback
```

## How It Works

### 1. Change Detection

The script uses git to detect changed files:
- Compares current HEAD with previous commit
- Maps file changes to services
- Detects shared library changes (triggers full rebuild)

### 2. Service Mapping

File paths are mapped to services:
- `apps/auth-service/**` → `auth-service`
- `apps/business-service/**` → `business-service`
- `libs/shared/**` → All services (shared dependency)
- `package.json`, `nx.json`, `Dockerfile` → All services

### 3. Dependency Resolution

Services have dependencies:
- `auth-service` → No dependencies
- `business-service` → Depends on `auth-service`
- `gst-service` → Depends on `auth-service`, `business-service`, `invoice-service`, `party-service`

Dependencies are automatically started if needed.

### 4. Rolling Updates

For running services:
1. Build new image
2. Start new container alongside old one
3. Wait for health check
4. Stop old container
5. Scale back to 1 instance

This ensures zero downtime.

### 5. Health Checks

Each service is verified:
- HTTP health endpoint check (`/health`)
- Container status check
- Configurable timeout (default: 60 seconds)

### 6. Automatic Backups

Before each deployment:
- Current container states saved
- Image tags recorded
- Last 5 backups kept for rollback

## Examples

### Example 1: Changed only auth-service
```bash
$ git diff --name-only HEAD~1
apps/auth-service/src/controllers/auth.controller.ts
apps/auth-service/src/services/auth.service.ts

$ make deploy-smart
# Detects: auth-service
# Deploys: auth-service only
# Other services: Continue running unchanged
```

### Example 2: Changed shared library
```bash
$ git diff --name-only HEAD~1
libs/shared/dto/src/auth.dto.ts

$ make deploy-smart
# Detects: Shared library change
# Deploys: All services (shared dependency)
```

### Example 3: Changed multiple services
```bash
$ git diff --name-only HEAD~1
apps/auth-service/src/controllers/user.controller.ts
apps/business-service/src/services/business.service.ts
apps/business-service/src/controllers/business.controller.ts

$ make deploy-smart
# Detects: auth-service, business-service
# Deploys: auth-service, business-service
# Dependencies: Starts auth-service first (business-service depends on it)
```

## Service Dependencies

| Service | Dependencies |
|---------|-------------|
| auth-service | None |
| business-service | auth-service |
| party-service | auth-service |
| inventory-service | auth-service |
| invoice-service | auth-service |
| payment-service | auth-service |
| gst-service | auth-service, business-service, invoice-service, party-service |
| web-app | auth-service, business-service |

## Configuration

### Environment Variables

- `COMPOSE_FILE` - Docker compose file (default: `docker-compose.prod.yml`)
- `HEALTH_CHECK_TIMEOUT` - Health check timeout in seconds (default: 60)
- `HEALTH_CHECK_INTERVAL` - Health check interval in seconds (default: 5)

### Service Ports

Services are health-checked on these ports:
- auth-service: 3002
- business-service: 3003
- party-service: 3004
- inventory-service: 3005
- invoice-service: 3006
- payment-service: 3007
- gst-service: 3008
- web-app: 3000

## Troubleshooting

### Service fails health check

1. Check logs: `docker-compose -f docker-compose.prod.yml logs <service>`
2. Verify service is running: `docker-compose -f docker-compose.prod.yml ps`
3. Check health endpoint manually: `curl http://localhost:<port>/health`
4. Rollback if needed: `make deploy-rollback`

### Deployment fails

1. Check which service failed in the summary
2. Review logs for that service
3. Fix the issue
4. Retry deployment: `make deploy-smart-service SERVICE=<service-name>`

### Rollback doesn't work

1. Check available backups: `ls -la .deployment/rollback/`
2. Manual rollback: Restart services manually
3. Check backup file contents: `cat .deployment/rollback/deployment_*.json`

## Best Practices

1. **Always test locally first** before deploying to production
2. **Review changes** with `--dry-run` before actual deployment
3. **Monitor health** after deployment
4. **Keep backups** - automatic backups are created, but verify they exist
5. **Deploy during low-traffic periods** for critical changes
6. **Use specific service deployment** when you know what changed
7. **Use full deployment** (`--all`) when shared libraries change

## Advanced Usage

### Dry Run
```bash
./scripts/deploy-seamless.sh --dry-run
# Shows what would be deployed without actually deploying
```

### Custom Compose File
```bash
COMPOSE_FILE=docker-compose.yml ./scripts/deploy-seamless.sh
```

### Production Deployment
```bash
# On production server
cd /path/to/project
git pull origin main
make deploy-smart
```

## Integration with CI/CD

The seamless deployment script can be integrated into CI/CD pipelines:

```yaml
# Example GitHub Actions
- name: Deploy changed services
  run: |
    cd app
    make deploy-smart
```

## Monitoring

After deployment, verify services:
```bash
make health
# or
docker-compose -f docker-compose.prod.yml ps
```

## Support

For issues or questions:
1. Check deployment logs in `.deployment/` directory
2. Review service logs: `docker-compose -f docker-compose.prod.yml logs <service>`
3. Verify git changes: `git diff HEAD~1`

