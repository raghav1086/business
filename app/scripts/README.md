# Migration Scripts

Quick reference for running database migrations locally and on EC2.

## 🚀 Quick Start

### Local Testing (Docker)

```bash
cd app/scripts
./test-migrations-local.sh
```

This will:
1. Start Docker PostgreSQL container
2. Create `business_db` database if needed
3. Run all migrations
4. Show verification report

### EC2 Deployment

```bash
cd app/scripts
./setup-migrations.sh [DB_HOST] [DB_PORT] [DB_NAME] [DB_USER] [DB_PASSWORD]
```

## 📚 Documentation

- **[LOCAL_TESTING.md](./LOCAL_TESTING.md)** - Detailed local testing guide
- **[EC2_SETUP.md](./EC2_SETUP.md)** - EC2 deployment guide
- **[QUICK_START.md](./QUICK_START.md)** - Quick reference
- **[migrations/README_MIGRATIONS.md](./migrations/README_MIGRATIONS.md)** - Migration details
- **[migrations/BACKWARD_COMPATIBILITY.md](./migrations/BACKWARD_COMPATIBILITY.md)** - Compatibility guarantees

## 📋 Scripts

| Script | Purpose | Usage |
|--------|---------|-------|
| `test-migrations-local.sh` | Test migrations locally with Docker | `./test-migrations-local.sh` |
| `setup-migrations.sh` | Run migrations on EC2/production | `./setup-migrations.sh [args]` |
| `run-migrations.sh` | Legacy migration runner | `./run-migrations.sh` |

## ✅ Verification

After running migrations:

```bash
# Connect to database
docker exec -it business-postgres psql -U postgres -d business_db

# Check tables
\dt

# Verify data
SELECT COUNT(*) FROM users WHERE is_superadmin = FALSE;
SELECT COUNT(*) FROM business_users WHERE role = 'owner';
```

## 🔧 Troubleshooting

See [LOCAL_TESTING.md](./LOCAL_TESTING.md) for troubleshooting guide.

