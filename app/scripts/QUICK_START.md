# Quick Start: Single Command Migration Setup

## 🚀 One-Line Command

```bash
cd app/scripts && ./setup-migrations.sh [DB_HOST] [DB_PORT] [DB_NAME] [DB_USER] [DB_PASSWORD]
```

## 📋 Examples

### Local Database
```bash
cd app/scripts && ./setup-migrations.sh localhost 5432 business_db postgres your_password
```

### RDS Database
```bash
cd app/scripts && ./setup-migrations.sh your-rds-endpoint.rds.amazonaws.com 5432 business_db postgres your_password
```

### Using Environment Variables
```bash
export DB_HOST=your-host
export DB_PORT=5432
export DB_NAME=business_db
export DB_USER=postgres
export DB_PASSWORD=your_password
cd app/scripts && ./setup-migrations.sh
```

## ✅ What It Does

1. Tests database connection
2. Runs all 6 migrations in order
3. Verifies setup
4. Shows verification report

## 📦 Prerequisites

```bash
# Install PostgreSQL client (if needed)
sudo yum install postgresql -y  # Amazon Linux
# OR
sudo apt-get install postgresql-client -y  # Ubuntu
```

## 🔍 Verification

After running, verify:
- All existing users can log in
- Business owners can access their businesses
- Superadmin works (phone: 9175760649, OTP: 760649)

## 📚 Full Documentation

See [EC2_SETUP.md](./EC2_SETUP.md) for detailed guide.

