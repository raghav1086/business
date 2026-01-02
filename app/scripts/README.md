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
| `backup-db.sh` | Create backups of all databases | `./backup-db.sh [DB_HOST] [DB_PORT] [DB_USER] [DB_PASSWORD]` |
| `upload-backup-to-s3.sh` | Upload backup files to S3 | `./upload-backup-to-s3.sh [S3_BUCKET] [BACKUP_DIR] [KEEP_LOCAL]` |
| `backup-and-upload-to-s3.sh` | Backup databases and upload to S3 | `./backup-and-upload-to-s3.sh [DB_HOST] [DB_PORT] [DB_USER] [DB_PASSWORD] [S3_BUCKET] [KEEP_LOCAL]` |

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

## 💾 Database Backups

### Quick Backup and Upload to S3

```bash
cd app/scripts

# Option 1: Backup and upload in one command
./backup-and-upload-to-s3.sh

# Option 2: Backup first, then upload separately
./backup-db.sh
./upload-backup-to-s3.sh my-backup-bucket

# Option 3: Upload existing backups
./upload-backup-to-s3.sh my-backup-bucket ./backups false  # false = delete local after upload
```

### Environment Variables

You can set these environment variables to avoid passing arguments:

```bash
export AWS_S3_BACKUP_BUCKET="my-backup-bucket"
export BACKUP_DIR="./backups"
export AWS_REGION="ap-south-1"
export S3_PREFIX="database-backups"  # Optional: S3 folder prefix
```

### Prerequisites

1. **AWS CLI installed**: `aws --version`
   - **For EC2**: See [AWS_CLI_INSTALLATION.md](./AWS_CLI_INSTALLATION.md) or run `sudo ./install-aws-cli-ec2.sh v2`
2. **AWS credentials configured**: `aws configure` or set `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY`
3. **S3 bucket created** (or the script will attempt to create it)

### Backup Scripts Details

- **`backup-db.sh`**: Creates backups of all databases (auth_db, business_db, party_db, inventory_db, invoice_db, payment_db) in the `./backups` directory
- **`upload-backup-to-s3.sh`**: Uploads all `.sql` and `.sql.gz` files from the backup directory to S3
- **`backup-and-upload-to-s3.sh`**: Combines both operations in a single command

## 🔧 Troubleshooting

See [LOCAL_TESTING.md](./LOCAL_TESTING.md) for troubleshooting guide.

