# Local Migration Testing Guide

This guide helps you test database migrations locally using Docker before deploying to EC2.

## Quick Start

### Single Command Test

```bash
cd app/scripts
./test-migrations-local.sh
```

This script will:
1. ✅ Check Docker installation
2. ✅ Start PostgreSQL container
3. ✅ Wait for database to be ready
4. ✅ Run all migrations
5. ✅ Show verification report

## Prerequisites

### 1. Install Docker

**macOS:**
```bash
# Install Docker Desktop from https://www.docker.com/products/docker-desktop
```

**Linux:**
```bash
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install docker.io docker-compose -y
sudo systemctl start docker
sudo systemctl enable docker

# Add user to docker group (optional, to run without sudo)
sudo usermod -aG docker $USER
```

**Windows:**
- Install Docker Desktop from https://www.docker.com/products/docker-desktop

### 2. Verify Docker Installation

```bash
docker --version
docker-compose --version
# OR (for Docker Compose v2)
docker compose version
```

## Step-by-Step Testing

### Option 1: Automated Test Script (Recommended)

```bash
# Navigate to scripts directory
cd app/scripts

# Run the test script
./test-migrations-local.sh
```

### Option 2: Manual Testing

#### Step 1: Start Docker Container

```bash
cd app
docker-compose up -d
```

#### Step 2: Wait for Database

```bash
# Check if database is ready
docker exec business_db pg_isready -U postgres
```

#### Step 3: Run Migrations

```bash
cd scripts
./setup-migrations.sh localhost 5432 business_db postgres postgres
```

#### Step 4: Verify

```bash
# Connect to database
docker exec -it business_db psql -U postgres -d business_db

# Check tables
\dt

# Check users
SELECT COUNT(*) FROM users WHERE is_superadmin = FALSE;
SELECT COUNT(*) FROM users WHERE is_superadmin = TRUE;

# Check business_users
SELECT COUNT(*) FROM business_users WHERE role = 'owner';

# Exit
\q
```

## Docker Compose Configuration

The script uses this default configuration:

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    container_name: business_db
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: business_db
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

## Common Commands

### Start Containers
```bash
cd app
docker-compose up -d
```

### Stop Containers
```bash
cd app
docker-compose down
```

### View Logs
```bash
docker logs business_db
docker logs -f business_db  # Follow logs
```

### Connect to Database
```bash
docker exec -it business_db psql -U postgres -d business_db
```

### Reset Database (⚠️ Deletes all data)
```bash
cd app
docker-compose down -v  # Removes volumes
docker-compose up -d
cd scripts
./setup-migrations.sh localhost 5432 business_db postgres postgres
```

### Check Container Status
```bash
docker ps
docker ps -a  # All containers
```

## Troubleshooting

### Error: Docker not running
```bash
# Start Docker service
sudo systemctl start docker  # Linux
# OR start Docker Desktop (macOS/Windows)
```

### Error: Port 5432 already in use
```bash
# Find process using port 5432
lsof -i :5432  # macOS/Linux
netstat -ano | findstr :5432  # Windows

# Stop the process or change port in docker-compose.yml
```

### Error: Container name already exists
```bash
# Remove existing container
docker rm -f business_db

# Or use different name in docker-compose.yml
```

### Error: Permission denied
```bash
# Make script executable
chmod +x app/scripts/test-migrations-local.sh
chmod +x app/scripts/setup-migrations.sh
```

### Error: psql not found in container
```bash
# The container should have psql, but if not:
docker exec business_db which psql
docker exec business_db pg_isready -U postgres
```

## Verification Checklist

After running migrations, verify:

- [ ] Docker container is running: `docker ps | grep business_db`
- [ ] Database is accessible: `docker exec business_db pg_isready -U postgres`
- [ ] Tables exist: `docker exec business_db psql -U postgres -d business_db -c "\dt"`
- [ ] `business_users` table exists
- [ ] `audit_logs` table exists
- [ ] `users.is_superadmin` column exists
- [ ] All existing users have `is_superadmin = FALSE`
- [ ] Superadmin user exists (phone: 9175760649)
- [ ] Migration script shows success

## Testing Application Connection

After migrations, test your application:

```bash
# Set environment variables
export DB_HOST=localhost
export DB_PORT=5432
export DB_NAME=business_db
export DB_USER=postgres
export DB_PASSWORD=postgres

# Run your application
# (your application startup command)
```

## Next Steps

Once local testing is successful:

1. ✅ Verify all migrations run without errors
2. ✅ Check that existing users can log in
3. ✅ Test superadmin functionality
4. ✅ Verify business owners have access
5. ✅ Deploy to EC2 using the same script

## Cleanup

To remove everything:

```bash
cd app
docker-compose down -v  # Removes containers and volumes
```

## Support

If you encounter issues:
1. Check Docker logs: `docker logs business_db`
2. Verify container is running: `docker ps`
3. Test database connection: `docker exec business_db pg_isready -U postgres`
4. Review migration logs in script output

