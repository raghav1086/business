#!/bin/bash

# Upload Database Backups to S3
# Uploads all backup files from the backup directory to AWS S3
# Usage: ./upload-backup-to-s3.sh [S3_BUCKET] [BACKUP_DIR] [KEEP_LOCAL] [UPLOAD_ONLY_LATEST]
#   S3_BUCKET: S3 bucket name (default: from AWS_S3_BACKUP_BUCKET env var or prompt)
#   BACKUP_DIR: Directory containing backups (default: ./backups)
#   KEEP_LOCAL: Keep local files after upload (default: true, set to "false" to delete)
#   UPLOAD_ONLY_LATEST: Upload only latest backup per database (default: false, set to "true" to enable)

# Don't exit on error immediately - we'll handle errors explicitly
set +e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
S3_BUCKET="${1:-${AWS_S3_BACKUP_BUCKET}}"
BACKUP_DIR="${2:-${BACKUP_DIR:-./backups}}"
KEEP_LOCAL="${3:-true}"
UPLOAD_ONLY_LATEST="${4:-false}"  # If true, only upload the latest backup for each database
S3_PREFIX="${S3_PREFIX:-database-backups}"
AWS_REGION="${AWS_REGION:-ap-south-1}"

# Validate AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo -e "${RED}✗ AWS CLI is not installed${NC}"
    echo -e "${YELLOW}  For EC2 (Amazon Linux/CentOS/RHEL):${NC}"
    echo -e "${BLUE}    sudo ./install-aws-cli-ec2.sh v2${NC}"
    echo -e "${BLUE}    OR: sudo yum install -y aws-cli${NC}"
    echo -e "${YELLOW}  For macOS:${NC}"
    echo -e "${BLUE}    brew install awscli${NC}"
    echo -e "${YELLOW}  For other systems:${NC}"
    echo -e "${BLUE}    See: scripts/AWS_CLI_INSTALLATION.md${NC}"
    exit 1
fi

# Validate AWS credentials
if ! aws sts get-caller-identity &> /dev/null; then
    echo -e "${RED}✗ AWS credentials not configured${NC}"
    echo -e "${YELLOW}  Run: aws configure${NC}"
    echo -e "${YELLOW}  Or set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY environment variables${NC}"
    exit 1
fi

# Get S3 bucket if not provided
if [ -z "$S3_BUCKET" ]; then
    echo -e "${BLUE}Enter S3 bucket name for backups:${NC}"
    read -r S3_BUCKET
    if [ -z "$S3_BUCKET" ]; then
        echo -e "${RED}✗ S3 bucket name is required${NC}"
        exit 1
    fi
fi

# Validate bucket name format (S3 naming rules)
if ! echo "$S3_BUCKET" | grep -qE '^[a-z0-9][a-z0-9-]*[a-z0-9]$|^[a-z0-9]$'; then
    echo -e "${RED}✗ Invalid bucket name: $S3_BUCKET${NC}"
    echo -e "${YELLOW}  Bucket names must:${NC}"
    echo -e "${YELLOW}    - Be 3-63 characters long${NC}"
    echo -e "${YELLOW}    - Contain only lowercase letters, numbers, and hyphens${NC}"
    echo -e "${YELLOW}    - Start and end with a letter or number${NC}"
    exit 1
fi

if [ ${#S3_BUCKET} -lt 3 ] || [ ${#S3_BUCKET} -gt 63 ]; then
    echo -e "${RED}✗ Bucket name must be 3-63 characters long${NC}"
    exit 1
fi

# Validate backup directory exists
if [ ! -d "$BACKUP_DIR" ]; then
    echo -e "${RED}✗ Backup directory does not exist: $BACKUP_DIR${NC}"
    echo ""
    
    # Check for backups in common locations
    COMMON_LOCATIONS=("/opt/backups" "$HOME/backups" "/var/backups" "./backups")
    FOUND_BACKUPS=false
    
    echo -e "${YELLOW}Checking common backup locations...${NC}"
    for location in "${COMMON_LOCATIONS[@]}"; do
        if [ -d "$location" ] && [ -n "$(find "$location" -maxdepth 1 -name "*.sql" -o -name "*.sql.gz" 2>/dev/null)" ]; then
            echo -e "${GREEN}  ✓ Found backups in: $location${NC}"
            FOUND_BACKUPS=true
        fi
    done
    
    if [ "$FOUND_BACKUPS" = true ]; then
        echo ""
        echo -e "${YELLOW}You can upload from one of these locations:${NC}"
        for location in "${COMMON_LOCATIONS[@]}"; do
            if [ -d "$location" ] && [ -n "$(find "$location" -maxdepth 1 -name "*.sql" -o -name "*.sql.gz" 2>/dev/null)" ]; then
                echo -e "${BLUE}    ./upload-backup-to-s3.sh $S3_BUCKET $location${NC}"
            fi
        done
        echo ""
    fi
    
    echo -e "${YELLOW}Options:${NC}"
    echo -e "${BLUE}  1. Create backups first:${NC}"
    echo -e "${BLUE}     ./backup-db.sh${NC}"
    echo -e "${BLUE}     OR${NC}"
    echo -e "${BLUE}     ./backup-and-upload-to-s3.sh${NC}"
    echo ""
    echo -e "${BLUE}  2. Specify a different backup directory:${NC}"
    echo -e "${BLUE}     ./upload-backup-to-s3.sh $S3_BUCKET /path/to/backups${NC}"
    echo ""
    echo -e "${BLUE}  3. Create empty directory (if you have backups elsewhere):${NC}"
    echo -e "${BLUE}     mkdir -p $BACKUP_DIR${NC}"
    echo ""
    exit 1
fi

# Function to create and configure S3 bucket
# Returns: 0 on success, 1 on failure
# Sets global DETECTED_REGION if bucket exists in different region
create_s3_bucket() {
    local bucket_name=$1
    local region=$2
    
    echo -e "${YELLOW}  Creating bucket '$bucket_name' in region '$region'...${NC}"
    
    # Create bucket
    CREATE_CMD="aws s3 mb s3://$bucket_name --region $region"
    
    # Try to create bucket and capture output
    CREATE_OUTPUT=$(eval "$CREATE_CMD" 2>&1)
    CREATE_EXIT_CODE=$?
    
    if [ $CREATE_EXIT_CODE -ne 0 ]; then
        # Check if bucket already exists in a different region
        BUCKET_LOCATION_JSON=$(aws s3api get-bucket-location --bucket "$bucket_name" 2>/dev/null || echo "")
        if [ -n "$BUCKET_LOCATION_JSON" ]; then
            BUCKET_REGION=$(echo "$BUCKET_LOCATION_JSON" | grep -o '"LocationConstraint"[[:space:]]*:[[:space:]]*"[^"]*"' | cut -d'"' -f4 || echo "")
            if [ "$BUCKET_REGION" = "null" ] || [ -z "$BUCKET_REGION" ]; then
                BUCKET_REGION="us-east-1"
            fi
            if [ -n "$BUCKET_REGION" ]; then
                echo -e "${YELLOW}  ⚠️  Bucket exists in region: $BUCKET_REGION (requested: $region)${NC}"
                if [ "$BUCKET_REGION" != "$region" ]; then
                    echo -e "${YELLOW}  Using existing bucket in region: $BUCKET_REGION${NC}"
                    # Set global variable for region
                    export DETECTED_REGION="$BUCKET_REGION"
                    return 0
                fi
            fi
        fi
        
        # Check for common errors
        if echo "$CREATE_OUTPUT" | grep -q "BucketAlreadyExists"; then
            echo -e "${YELLOW}  ⚠️  Bucket name is already taken (must be globally unique)${NC}"
            echo -e "${YELLOW}  Please choose a different bucket name${NC}"
        elif echo "$CREATE_OUTPUT" | grep -q "AccessDenied\|Forbidden"; then
            echo -e "${RED}  ✗ Access denied. Check IAM permissions (s3:CreateBucket)${NC}"
        else
            echo -e "${RED}  ✗ Failed to create bucket${NC}"
            echo -e "${RED}    Error: $CREATE_OUTPUT${NC}"
        fi
        return 1
    fi
    
    echo -e "${GREEN}  ✓ Bucket created${NC}"
    
    # Configure bucket settings
    echo -e "${BLUE}  Configuring bucket settings...${NC}"
    
    # Block public access
    aws s3api put-public-access-block \
        --bucket "$bucket_name" \
        --public-access-block-configuration \
        "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true" \
        2>/dev/null && echo -e "${GREEN}    ✓ Public access blocked${NC}" || echo -e "${YELLOW}    ⚠️  Could not block public access${NC}"
    
    # Enable versioning
    aws s3api put-bucket-versioning \
        --bucket "$bucket_name" \
        --versioning-configuration Status=Enabled \
        2>/dev/null && echo -e "${GREEN}    ✓ Versioning enabled${NC}" || echo -e "${YELLOW}    ⚠️  Could not enable versioning${NC}"
    
    # Enable encryption
    aws s3api put-bucket-encryption \
        --bucket "$bucket_name" \
        --server-side-encryption-configuration '{
            "Rules": [{
                "ApplyServerSideEncryptionByDefault": {
                    "SSEAlgorithm": "AES256"
                }
            }]
        }' \
        2>/dev/null && echo -e "${GREEN}    ✓ Encryption enabled${NC}" || echo -e "${YELLOW}    ⚠️  Could not enable encryption${NC}"
    
    # Set lifecycle policy to delete old backups (optional - 90 days)
    LIFECYCLE_POLICY='{
        "Rules": [{
            "Id": "DeleteOldBackups",
            "Status": "Enabled",
            "Prefix": "'"$S3_PREFIX"'/",
            "Expiration": {
                "Days": 90
            }
        }]
    }'
    
    echo "$LIFECYCLE_POLICY" > /tmp/lifecycle-policy.json
    aws s3api put-bucket-lifecycle-configuration \
        --bucket "$bucket_name" \
        --lifecycle-configuration file:///tmp/lifecycle-policy.json \
        2>/dev/null && echo -e "${GREEN}    ✓ Lifecycle policy set (auto-delete after 90 days)${NC}" || echo -e "${YELLOW}    ⚠️  Could not set lifecycle policy${NC}"
    rm -f /tmp/lifecycle-policy.json
    
    return 0
}

# Check if bucket exists and is accessible
echo -e "${BLUE}Checking S3 bucket access...${NC}"
BUCKET_EXISTS=false
BUCKET_ACCESSIBLE=false

# Try to list bucket (this checks both existence and access)
if aws s3 ls "s3://$S3_BUCKET" &> /dev/null; then
    BUCKET_EXISTS=true
    BUCKET_ACCESSIBLE=true
    echo -e "${GREEN}  ✓ Bucket exists and is accessible${NC}"
    
    # Get bucket region
    BUCKET_LOCATION_JSON=$(aws s3api get-bucket-location --bucket "$S3_BUCKET" 2>/dev/null || echo "")
    if [ -n "$BUCKET_LOCATION_JSON" ]; then
        BUCKET_REGION=$(echo "$BUCKET_LOCATION_JSON" | grep -o '"LocationConstraint"[[:space:]]*:[[:space:]]*"[^"]*"' | cut -d'"' -f4 || echo "")
        if [ "$BUCKET_REGION" = "null" ] || [ -z "$BUCKET_REGION" ]; then
            BUCKET_REGION="us-east-1"
        fi
        if [ -n "$BUCKET_REGION" ] && [ "$BUCKET_REGION" != "$AWS_REGION" ]; then
            echo -e "${YELLOW}  ⚠️  Bucket is in region: $BUCKET_REGION (using this region)${NC}"
            AWS_REGION="$BUCKET_REGION"
        fi
    fi
else
    # Bucket doesn't exist or not accessible
    ERROR_OUTPUT=$(aws s3 ls "s3://$S3_BUCKET" 2>&1 || true)
    
    if echo "$ERROR_OUTPUT" | grep -q "NoSuchBucket"; then
        echo -e "${YELLOW}  ⚠️  Bucket '$S3_BUCKET' does not exist${NC}"
        echo -e "${YELLOW}  Creating bucket...${NC}"
        
        DETECTED_REGION=""
        if create_s3_bucket "$S3_BUCKET" "$AWS_REGION"; then
            # If bucket was found in different region, use that
            if [ -n "$DETECTED_REGION" ]; then
                AWS_REGION="$DETECTED_REGION"
            fi
            BUCKET_EXISTS=true
            BUCKET_ACCESSIBLE=true
        else
            echo -e "${RED}✗ Failed to create bucket${NC}"
            echo -e "${YELLOW}  You can create it manually with:${NC}"
            echo -e "${BLUE}    aws s3 mb s3://$S3_BUCKET --region $AWS_REGION${NC}"
            exit 1
        fi
    elif echo "$ERROR_OUTPUT" | grep -q "AccessDenied\|Forbidden"; then
        echo -e "${RED}✗ Access denied to bucket '$S3_BUCKET'${NC}"
        echo -e "${YELLOW}  Check your IAM permissions (s3:ListBucket, s3:GetObject, s3:PutObject)${NC}"
        exit 1
    else
        echo -e "${RED}✗ Cannot access bucket '$S3_BUCKET'${NC}"
        echo -e "${YELLOW}  Error: $ERROR_OUTPUT${NC}"
        exit 1
    fi
fi

# Find all backup files
BACKUP_FILES=()
# Use nullglob to handle cases where no files match
shopt -s nullglob
BACKUP_FILES+=("$BACKUP_DIR"/*.sql)
BACKUP_FILES+=("$BACKUP_DIR"/*.sql.gz)
shopt -u nullglob

if [ ${#BACKUP_FILES[@]} -eq 0 ]; then
    echo -e "${YELLOW}⚠️  No backup files found in $BACKUP_DIR${NC}"
    exit 0
fi

# Filter out non-existent files (from glob expansion)
VALID_FILES=()
for file in "${BACKUP_FILES[@]}"; do
    if [ -f "$file" ]; then
        VALID_FILES+=("$file")
    fi
done

if [ ${#VALID_FILES[@]} -eq 0 ]; then
    echo -e "${YELLOW}⚠️  No valid backup files found in $BACKUP_DIR${NC}"
    exit 0
fi

# If UPLOAD_ONLY_LATEST is true, filter to only the latest backup for each database
if [ "$UPLOAD_ONLY_LATEST" = "true" ]; then
    echo -e "${BLUE}Filtering to latest backups only...${NC}"
    
    # Group files by database name and keep only the latest (most recent) for each
    declare -A LATEST_FILES
    for file in "${VALID_FILES[@]}"; do
        filename=$(basename "$file")
        # Extract database name (e.g., "auth_db" from "auth_db_20260102_115534.sql")
        db_name=$(echo "$filename" | sed -E 's/^([^_]+_[^_]+)_.*\.(sql|sql\.gz)$/\1/')
        
        if [ -z "$db_name" ] || [ "$db_name" = "$filename" ]; then
            # If we can't extract DB name, include the file anyway
            LATEST_FILES["$filename"]="$file"
        else
            # Check if we already have a file for this database
            existing_file="${LATEST_FILES[$db_name]}"
            if [ -z "$existing_file" ]; then
                LATEST_FILES["$db_name"]="$file"
            else
                # Compare modification times - keep the newer one
                if [ "$file" -nt "$existing_file" ]; then
                    LATEST_FILES["$db_name"]="$file"
                fi
            fi
        fi
    done
    
    # Convert associative array back to regular array
    VALID_FILES=()
    for key in "${!LATEST_FILES[@]}"; do
        VALID_FILES+=("${LATEST_FILES[$key]}")
    done
    
    echo -e "${GREEN}  ✓ Filtered to ${#VALID_FILES[@]} latest backup file(s)${NC}"
    echo ""
fi

# Check which files already exist in S3 and skip them (optional - can be disabled)
FILES_TO_UPLOAD=()
FILES_SKIPPED=0

if [ ${#VALID_FILES[@]} -gt 0 ]; then
    echo -e "${BLUE}Checking which files need to be uploaded...${NC}"
    
    # Get list of existing files in S3
    S3_EXISTING_FILES=$(aws s3 ls "s3://$S3_BUCKET/$S3_PREFIX/" --region "$AWS_REGION" 2>/dev/null | awk '{print $4}' || echo "")
    
    for file in "${VALID_FILES[@]}"; do
        filename=$(basename "$file")
        
        # Check if file exists in S3
        if echo "$S3_EXISTING_FILES" | grep -qFx "$filename"; then
            # File already exists in S3, skip it to avoid duplicates
            ((FILES_SKIPPED++))
            continue
        fi
        
        FILES_TO_UPLOAD+=("$file")
    done
    
    if [ $FILES_SKIPPED -gt 0 ]; then
        echo -e "${YELLOW}  ⚠️  Skipping $FILES_SKIPPED file(s) that already exist in S3${NC}"
    fi
    
    VALID_FILES=("${FILES_TO_UPLOAD[@]}")
    
    if [ ${#VALID_FILES[@]} -eq 0 ]; then
        echo -e "${GREEN}✓ All backup files already exist in S3${NC}"
        echo -e "${BLUE}  No new files to upload${NC}"
        exit 0
    fi
    
    echo -e "${GREEN}  ✓ ${#VALID_FILES[@]} new file(s) to upload${NC}"
    echo ""
fi

echo -e "${BLUE}Uploading ${#VALID_FILES[@]} backup file(s) to S3...${NC}"
echo -e "${BLUE}  Bucket: s3://$S3_BUCKET/$S3_PREFIX${NC}"
echo ""

# Debug: List files to upload
if [ ${#VALID_FILES[@]} -gt 0 ]; then
    echo -e "${BLUE}Files to upload:${NC}"
    for f in "${VALID_FILES[@]}"; do
        echo -e "${BLUE}  - $(basename "$f")${NC}"
    done
    echo ""
fi

UPLOAD_SUCCESS=0
UPLOAD_FAILED=0

# Upload each backup file
for backup_file in "${VALID_FILES[@]}"; do
    # Verify file still exists before uploading
    if [ ! -f "$backup_file" ]; then
        echo -e "${YELLOW}  ⚠️  File no longer exists: $backup_file${NC}"
        ((UPLOAD_FAILED++))
        continue
    fi
    filename=$(basename "$backup_file")
    s3_path="s3://$S3_BUCKET/$S3_PREFIX/$filename"
    
    echo -e "${YELLOW}  → Uploading $filename...${NC}"
    
    # Get file size for progress indication
    file_size=$(du -h "$backup_file" | cut -f1)
    echo -e "${BLUE}    Size: $file_size${NC}"
    
    # Upload to S3 (capture output to show errors)
    UPLOAD_OUTPUT=$(aws s3 cp "$backup_file" "$s3_path" --region "$AWS_REGION" 2>&1)
    UPLOAD_EXIT_CODE=$?
    
    if [ $UPLOAD_EXIT_CODE -eq 0 ]; then
        echo -e "${GREEN}    ✓ Uploaded to $s3_path${NC}"
        ((UPLOAD_SUCCESS++))
        
        # Optionally delete local file
        if [ "$KEEP_LOCAL" = "false" ]; then
            if rm "$backup_file" 2>/dev/null; then
                echo -e "${BLUE}    ✓ Local file deleted${NC}"
            else
                echo -e "${YELLOW}    ⚠️  Failed to delete local file${NC}"
            fi
        fi
    else
        echo -e "${RED}    ✗ Upload failed${NC}"
        echo -e "${RED}      Error: $UPLOAD_OUTPUT${NC}"
        ((UPLOAD_FAILED++))
    fi
    echo ""
done

# Summary
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
if [ $UPLOAD_SUCCESS -gt 0 ]; then
    echo -e "${GREEN}✓ Upload complete: $UPLOAD_SUCCESS file(s) uploaded${NC}"
    echo -e "${BLUE}  S3 Location: s3://$S3_BUCKET/$S3_PREFIX/${NC}"
fi

if [ $UPLOAD_FAILED -gt 0 ]; then
    echo -e "${RED}✗ Failed: $UPLOAD_FAILED file(s) failed to upload${NC}"
    exit 1
fi

if [ $UPLOAD_SUCCESS -eq 0 ]; then
    echo -e "${YELLOW}⚠️  No files were uploaded${NC}"
    exit 0
fi

# List uploaded files
echo ""
echo -e "${BLUE}Uploaded files:${NC}"
aws s3 ls "s3://$S3_BUCKET/$S3_PREFIX/" --region "$AWS_REGION" --human-readable --summarize | tail -n +2 | head -n -1 || true

exit 0

