#!/bin/bash
set -e

# Configuration
REGION=${1:-ap-south-1}
KEY_NAME=${2:-business-app-key}
INSTANCE_TYPE=${3:-t3.medium}
GIT_REPO="https://github.com/ashishnimrot/business.git"

# AWS Profile support (can be set via environment variable or passed as 4th argument)
AWS_PROFILE=${AWS_PROFILE:-${4:-}}
AWS_CMD="aws"
if [ -n "$AWS_PROFILE" ]; then
    AWS_CMD="aws --profile $AWS_PROFILE"
    export AWS_PROFILE
fi

echo "🚀 Automated AWS Deployment for Business App"
echo "=============================================="
echo "Region: $REGION"
echo "Key Name: $KEY_NAME"
echo "Instance Type: $INSTANCE_TYPE"
if [ -n "$AWS_PROFILE" ]; then
    echo "AWS Profile: $AWS_PROFILE"
fi
echo "Git Repo: $GIT_REPO"
echo ""

# Step 1: Verify AWS credentials
echo "🔍 Step 1/8: Verifying AWS credentials..."
if ! $AWS_CMD sts get-caller-identity &>/dev/null; then
    echo "❌ AWS credentials not configured"
    if [ -n "$AWS_PROFILE" ]; then
        echo "Profile '$AWS_PROFILE' not found or invalid"
        echo "Run: aws configure --profile $AWS_PROFILE"
    else
        echo "Run: aws configure"
        echo "Or set AWS_PROFILE environment variable: export AWS_PROFILE=business-app"
    fi
    exit 1
fi
ACCOUNT_ID=$($AWS_CMD sts get-caller-identity --query Account --output text)
USER_ARN=$($AWS_CMD sts get-caller-identity --query Arn --output text)
echo "✅ AWS Account: $ACCOUNT_ID"
echo "✅ User: $USER_ARN"
echo ""

# Step 2: Setup IAM (if needed)
echo "🔐 Step 2/8: Setting up IAM user..."
IAM_USER_EXISTS=false
if $AWS_CMD iam get-user --user-name business-app-deployer &>/dev/null 2>&1; then
    IAM_USER_EXISTS=true
    echo "✅ IAM user 'business-app-deployer' already exists"
elif $AWS_CMD iam create-user --user-name business-app-deployer &>/dev/null 2>&1; then
    echo "✅ IAM user 'business-app-deployer' created"
    IAM_USER_EXISTS=true
    
    # Create and attach policy
    cat > /tmp/business-app-policy.json << 'POLICY_EOF'
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "ec2:*",
        "iam:GetUser",
        "iam:ListAttachedUserPolicies"
      ],
      "Resource": "*"
    }
  ]
}
POLICY_EOF
    
    # Try to create policy, or use existing one
    POLICY_ARN=$($AWS_CMD iam create-policy \
        --policy-name BusinessAppDeployPolicy \
        --policy-document file:///tmp/business-app-policy.json \
        --query 'Policy.Arn' --output text 2>/dev/null || \
        $AWS_CMD iam list-policies --query 'Policies[?PolicyName==`BusinessAppDeployPolicy`].Arn' --output text 2>/dev/null | head -1)
    
    if [ -n "$POLICY_ARN" ] && [ "$POLICY_ARN" != "None" ]; then
        $AWS_CMD iam attach-user-policy --user-name business-app-deployer --policy-arn "$POLICY_ARN" &>/dev/null 2>&1 || true
    fi
else
    echo "⚠️  Could not create IAM user (may already exist or insufficient permissions)"
    echo "   Continuing with existing credentials..."
fi
echo ""

# Step 3: Create/Check Key Pair
echo "🔑 Step 3/8: Setting up Key Pair..."
if ! $AWS_CMD ec2 describe-key-pairs --region $REGION --key-names $KEY_NAME &>/dev/null; then
    echo "Creating key pair..."
    mkdir -p ~/.ssh
    $AWS_CMD ec2 create-key-pair --region $REGION --key-name $KEY_NAME --query 'KeyMaterial' --output text > ~/.ssh/$KEY_NAME.pem
    chmod 400 ~/.ssh/$KEY_NAME.pem
    echo "✅ Key pair created: ~/.ssh/$KEY_NAME.pem"
else
    echo "✅ Key pair exists"
fi
echo ""

# Step 4: Get VPC and Subnet
echo "🌐 Step 4/8: Finding VPC and Subnet..."
VPC_ID=$($AWS_CMD ec2 describe-vpcs --region $REGION --filters "Name=isDefault,Values=true" --query 'Vpcs[0].VpcId' --output text)
if [ "$VPC_ID" = "None" ] || [ -z "$VPC_ID" ]; then
    VPC_ID=$($AWS_CMD ec2 describe-vpcs --region $REGION --query 'Vpcs[0].VpcId' --output text)
fi

if [ "$VPC_ID" = "None" ] || [ -z "$VPC_ID" ]; then
    echo "❌ No VPC found in region $REGION"
    exit 1
fi

SUBNET_ID=$($AWS_CMD ec2 describe-subnets --region $REGION --filters "Name=vpc-id,Values=$VPC_ID" --query 'Subnets[0].SubnetId' --output text)
if [ "$SUBNET_ID" = "None" ] || [ -z "$SUBNET_ID" ]; then
    echo "❌ No subnet found in VPC $VPC_ID"
    exit 1
fi
echo "✅ VPC: $VPC_ID, Subnet: $SUBNET_ID"
echo ""

# Step 5: Create Security Group
echo "🔒 Step 5/8: Creating Security Group..."

# First check if security group already exists
SG_ID=$($AWS_CMD ec2 describe-security-groups --region $REGION \
    --filters "Name=group-name,Values=business-app-beta-sg" "Name=vpc-id,Values=$VPC_ID" \
    --query 'SecurityGroups[0].GroupId' --output text 2>/dev/null)

if [ -z "$SG_ID" ] || [ "$SG_ID" = "None" ]; then
    echo "Creating new security group..."
    SG_ID=$($AWS_CMD ec2 create-security-group \
        --region $REGION \
        --group-name business-app-beta-sg \
        --description "Business App Beta - Web App Public" \
        --vpc-id $VPC_ID \
        --query 'GroupId' --output text 2>/dev/null)
    
    if [ -z "$SG_ID" ] || [ "$SG_ID" = "None" ]; then
        echo "❌ Failed to create security group"
        exit 1
    fi
    echo "✅ Security group created: $SG_ID"
else
    echo "✅ Security group already exists: $SG_ID"
fi

# Configure security group rules
$AWS_CMD ec2 authorize-security-group-ingress --region $REGION --group-id $SG_ID --protocol tcp --port 22 --cidr 0.0.0.0/0 2>/dev/null || true
$AWS_CMD ec2 authorize-security-group-ingress --region $REGION --group-id $SG_ID --protocol tcp --port 80 --cidr 0.0.0.0/0 2>/dev/null || true
$AWS_CMD ec2 authorize-security-group-ingress --region $REGION --group-id $SG_ID --protocol tcp --port 443 --cidr 0.0.0.0/0 2>/dev/null || true
echo "✅ Security Group: $SG_ID"
echo ""

# Step 6: Get AMI
echo "🖼️  Step 6/8: Finding latest AMI..."
AMI_ID=$($AWS_CMD ec2 describe-images \
    --region $REGION \
    --owners amazon \
    --filters "Name=name,Values=al2023-ami-*-x86_64" "Name=state,Values=available" \
    --query 'Images | sort_by(@, &CreationDate) | [-1].ImageId' --output text)

if [ "$AMI_ID" = "None" ] || [ -z "$AMI_ID" ]; then
    AMI_ID=$($AWS_CMD ec2 describe-images \
        --region $REGION \
        --owners amazon \
        --filters "Name=name,Values=amzn2-ami-hvm-*-x86_64-gp2" "Name=state,Values=available" \
        --query 'Images | sort_by(@, &CreationDate) | [-1].ImageId' --output text)
fi

if [ "$AMI_ID" = "None" ] || [ -z "$AMI_ID" ]; then
    echo "❌ No suitable AMI found in region $REGION"
    exit 1
fi
echo "✅ AMI: $AMI_ID"
echo ""

# Step 7: Create User Data Script
echo "📝 Step 7/8: Preparing deployment script..."
USER_DATA=$(cat <<'USERDATA_EOF'
#!/bin/bash
exec > >(tee /var/log/user-data.log|logger -t user-data -s 2>/dev/console) 2>&1

# Error handling function
error_exit() {
    echo "❌ Error: $1" >&2
    exit 1
}

# Set error handling for critical sections
set -e

echo "🚀 Starting automated Business App deployment..."

# Update system
sudo yum update -y -q

# Install Docker
echo "📦 Installing Docker..."
# Fix curl package conflict by using --allowerasing or installing separately
sudo yum install -y docker git --allowerasing || sudo yum install -y docker git
sudo yum install -y curl --allowerasing || sudo yum install -y curl
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -a -G docker ec2-user

# Install Docker Compose
echo "📦 Installing Docker Compose..."
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Install Nginx
echo "📦 Installing Nginx..."
sudo yum install -y nginx
sudo systemctl enable nginx

# Install Node.js
echo "📦 Installing Node.js..."
curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash - >/dev/null 2>&1
sudo yum install -y nodejs >/dev/null 2>&1

# Create app directory
echo "📁 Setting up application directory..."
sudo mkdir -p /opt/business-app
sudo chown ec2-user:ec2-user /opt/business-app
cd /opt/business-app

# Clone repository
echo "📥 Cloning repository..."
for attempt in {1..3}; do
    if sudo -u ec2-user git clone https://github.com/ashishnimrot/business.git . 2>/dev/null; then
        echo "✅ Repository cloned successfully"
        break
    fi
    if [ $attempt -lt 3 ]; then
        echo "⚠️  Clone attempt $attempt failed, retrying in 10 seconds..."
        sleep 10
    else
        echo "❌ Failed to clone repository after 3 attempts"
        exit 1
    fi
done

# Use fixed production password (never changes)
DB_PASSWORD="Admin112233"
JWT_SECRET=$(openssl rand -base64 64 | tr -d "=+/" | cut -c1-64)
JWT_REFRESH_SECRET=$(openssl rand -base64 64 | tr -d "=+/" | cut -c1-64)

# Create production environment file
echo "⚙️  Creating environment configuration..."
cd /opt/business-app/app
# Use printf to avoid issues with special characters in passwords
sudo -u ec2-user bash -c "printf 'DB_PASSWORD=%s\nJWT_SECRET=%s\nJWT_REFRESH_SECRET=%s\nENABLE_SYNC=true\nENABLE_FAKE_OTP=true\n' \"${DB_PASSWORD}\" \"${JWT_SECRET}\" \"${JWT_REFRESH_SECRET}\" > .env.production"

# Also create .env file (docker-compose reads .env by default)
sudo -u ec2-user cp .env.production .env
sudo chown ec2-user:ec2-user .env .env.production

# Build and deploy
echo "🔨 Building and deploying services..."
cd /opt/business-app/app

# Wait for Docker to be ready and ensure ec2-user can use it
echo "⏳ Waiting for Docker to be ready..."
for i in {1..30}; do
    if sudo docker ps &>/dev/null; then
        # Ensure ec2-user can access docker
        sudo chmod 666 /var/run/docker.sock 2>/dev/null || true
        # Test if ec2-user can use docker
        if sudo -u ec2-user docker ps &>/dev/null 2>&1; then
            break
        fi
    fi
    sleep 2
done

# Final check and fix permissions
if ! sudo -u ec2-user docker ps &>/dev/null 2>&1; then
    echo "⚠️  Fixing Docker permissions for ec2-user..."
    sudo chmod 666 /var/run/docker.sock 2>/dev/null || true
    sudo newgrp docker <<EOF
exit
EOF
fi

# Install Docker Buildx if needed (for both root and ec2-user)
echo "🔧 Installing Docker Buildx..."
BUILDX_VERSION="v0.17.0"

# Create directories with proper permissions
sudo mkdir -p /root/.docker/cli-plugins
sudo mkdir -p /home/ec2-user/.docker/cli-plugins
sudo chown -R ec2-user:ec2-user /home/ec2-user/.docker

# Download buildx
curl -L "https://github.com/docker/buildx/releases/download/${BUILDX_VERSION}/buildx-${BUILDX_VERSION}.linux-amd64" -o /tmp/docker-buildx 2>/dev/null || {
    echo "⚠️  Buildx download failed, trying alternative method..."
    curl -L "https://github.com/docker/buildx/releases/latest/download/buildx-linux-amd64" -o /tmp/docker-buildx 2>/dev/null || true
}

if [ -f /tmp/docker-buildx ]; then
    chmod +x /tmp/docker-buildx
    sudo cp /tmp/docker-buildx /root/.docker/cli-plugins/docker-buildx
    sudo cp /tmp/docker-buildx /home/ec2-user/.docker/cli-plugins/docker-buildx
    sudo chmod +x /root/.docker/cli-plugins/docker-buildx
    sudo chmod +x /home/ec2-user/.docker/cli-plugins/docker-buildx
    sudo chown ec2-user:ec2-user /home/ec2-user/.docker/cli-plugins/docker-buildx
    echo "✅ Docker Buildx installed"
else
    echo "⚠️  Could not install Buildx, continuing without it..."
fi

# Build services with environment variables
echo "🔨 Building Docker images (this may take 10-15 minutes)..."
cd /opt/business-app/app

# Ensure .env file exists (docker-compose reads .env by default)
if [ ! -f .env ]; then
    sudo -u ec2-user cp .env.production .env
    sudo chown ec2-user:ec2-user .env
fi

# Build with environment variables loaded using heredoc to avoid escaping issues
sudo -u ec2-user bash <<'BUILD_EOF'
cd /opt/business-app/app
# Load environment variables safely using awk
eval \$(awk -F'=' '{ 
    if (NF >= 2 && \$1 !~ /^[[:space:]]*#/ && \$1 !~ /^[[:space:]]*\$/) {
        key=\$1
        gsub(/^[[:space:]]+|[[:space:]]+\$/, "", key)
        value=substr(\$0, index(\$0, "=")+1)
        gsub(/^[[:space:]]+|[[:space:]]+\$/, "", value)
        gsub(/^["'\'']|["'\'']\$/, "", value)
        printf "export %s=\\"%s\\"\\n", key, value
    }
}' .env.production)
# Build images
docker-compose -f docker-compose.prod.yml build --no-cache
BUILD_EOF

# If build failed, retry without --no-cache
BUILD_EXIT_CODE=$?
if [ $BUILD_EXIT_CODE -ne 0 ]; then
    echo "⚠️  Build failed, retrying without --no-cache..."
    sleep 10
    sudo -u ec2-user bash <<'BUILD_EOF'
cd /opt/business-app/app
# Load environment variables safely using awk
eval \$(awk -F'=' '{ 
    if (NF >= 2 && \$1 !~ /^[[:space:]]*#/ && \$1 !~ /^[[:space:]]*\$/) {
        key=\$1
        gsub(/^[[:space:]]+|[[:space:]]+\$/, "", key)
        value=substr(\$0, index(\$0, "=")+1)
        gsub(/^[[:space:]]+|[[:space:]]+\$/, "", value)
        gsub(/^["'\'']|["'\'']\$/, "", value)
        printf "export %s=\\"%s\\"\\n", key, value
    }
}' .env.production)
docker-compose -f docker-compose.prod.yml build
BUILD_EOF
fi

# Start services with environment variables
echo "🚀 Starting services..."
sudo -u ec2-user bash <<'START_EOF'
cd /opt/business-app/app
# Load environment variables safely using awk
eval \$(awk -F'=' '{ 
    if (NF >= 2 && \$1 !~ /^[[:space:]]*#/ && \$1 !~ /^[[:space:]]*\$/) {
        key=\$1
        gsub(/^[[:space:]]+|[[:space:]]+\$/, "", key)
        value=substr(\$0, index(\$0, "=")+1)
        gsub(/^[[:space:]]+|[[:space:]]+\$/, "", value)
        gsub(/^["'\'']|["'\'']\$/, "", value)
        printf "export %s=\\"%s\\"\\n", key, value
    }
}' .env.production)
docker-compose -f docker-compose.prod.yml up -d
START_EOF

# Wait for services to be ready
echo "⏳ Waiting for services to start (this may take 2-3 minutes)..."
for i in {1..60}; do
    if sudo docker ps | grep -q business-postgres && sudo docker ps | grep -q business-auth; then
        echo "✅ Core services are starting..."
        break
    fi
    sleep 3
done

# Wait additional time for all services
sleep 60

# Verify database tables are created
echo "🔍 Verifying database setup..."
echo "⏳ Waiting for services to create database tables (this may take 1-2 minutes)..."

# Wait for services to initialize and create tables
for i in {1..40}; do
    # Check if auth service has created users table
    if sudo docker exec business-postgres psql -U postgres -d auth_db -c "\dt" 2>/dev/null | grep -q "users"; then
        echo "✅ Database tables are being created..."
        break
    fi
    sleep 3
done

# Final wait for all tables
sleep 30

# Verify all databases have tables
echo "🔍 Verifying all databases..."
for db in auth_db business_db party_db inventory_db invoice_db payment_db; do
    TABLE_COUNT=$(sudo docker exec business-postgres psql -U postgres -d $db -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" 2>/dev/null | tr -d ' ' || echo "0")
    if [ "$TABLE_COUNT" != "0" ]; then
        echo "✅ $db: $TABLE_COUNT tables created"
    else
        echo "⚠️  $db: Tables may still be creating..."
    fi
done

# Setup Nginx
echo "🔧 Configuring Nginx..."
PUBLIC_IP=$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4)

sudo tee /etc/nginx/conf.d/business-app.conf <<NGINX_EOF
upstream auth_service { server localhost:3002; }
upstream business_service { server localhost:3003; }
upstream party_service { server localhost:3004; }
upstream inventory_service { server localhost:3005; }
upstream invoice_service { server localhost:3006; }
upstream payment_service { server localhost:3007; }
upstream web_app { server localhost:3000; }

server {
    listen 80;
    server_name _;
    
    location / {
        proxy_pass http://web_app;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
    
    # Auth service - preserve full path /api/v1/auth/*
    location /api/v1/auth {
        proxy_pass http://auth_service;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
    
    # User endpoints (auth service) - preserve full path /api/v1/users/*
    location /api/v1/users {
        proxy_pass http://auth_service;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
    
    # Business service - preserve full path /api/v1/businesses/*
    location /api/v1/businesses {
        proxy_pass http://business_service;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
    
    # Party service - preserve full path /api/v1/parties/*
    location /api/v1/parties {
        proxy_pass http://party_service;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
    
    # Inventory service - preserve full path /api/v1/items/*
    location /api/v1/items {
        proxy_pass http://inventory_service;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
    
    # Stock endpoints (inventory service)
    location /api/v1/stock {
        proxy_pass http://inventory_service;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
    
    # Invoice service - preserve full path /api/v1/invoices/*
    location /api/v1/invoices {
        proxy_pass http://invoice_service;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
    
    # Payment service - preserve full path /api/v1/payments/*
    location /api/v1/payments {
        proxy_pass http://payment_service;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
NGINX_EOF

# Test and restart Nginx
if sudo nginx -t; then
    sudo systemctl restart nginx
    echo "✅ Nginx configured and started"
else
    echo "⚠️  Nginx configuration test failed, but continuing..."
fi

# Setup automatic backups
echo "💾 Setting up backups..."
sudo mkdir -p /opt/backups
sudo tee /home/ec2-user/backup.sh <<BACKUP_EOF
#!/bin/bash
DATE=\$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/opt/backups"
mkdir -p \$BACKUP_DIR
docker exec business-postgres pg_dumpall -U postgres | gzip > \$BACKUP_DIR/db_backup_\$DATE.sql.gz
find \$BACKUP_DIR -name "*.sql.gz" -mtime +7 -delete
BACKUP_EOF

sudo chmod +x /home/ec2-user/backup.sh
(crontab -l 2>/dev/null; echo "0 2 * * * /home/ec2-user/backup.sh") | crontab -

# Create verification script
echo "📝 Creating verification script..."
sudo tee /home/ec2-user/verify-deployment.sh <<VERIFY_EOF
#!/bin/bash
cd /opt/business-app/app
bash scripts/verify-deployment.sh
VERIFY_EOF

sudo chmod +x /home/ec2-user/verify-deployment.sh

echo "✅ Deployment complete!"
echo "🌐 Application will be available at: http://\${PUBLIC_IP}"
echo ""
echo "📋 To verify deployment, run:"
echo "   /home/ec2-user/verify-deployment.sh"
USERDATA_EOF
)

# Encode user data (handle both Linux and macOS)
if [[ "$OSTYPE" == "darwin"* ]]; then
    USER_DATA_ENCODED=$(echo "$USER_DATA" | base64)
else
    USER_DATA_ENCODED=$(echo "$USER_DATA" | base64 -w 0)
fi

# Step 8: Launch EC2 Instance
echo "🚀 Step 8/8: Launching EC2 instance..."

# Try to launch instance (temporarily disable exit on error to capture output)
set +e
LAUNCH_OUTPUT=$($AWS_CMD ec2 run-instances \
    --region $REGION \
    --image-id $AMI_ID \
    --instance-type $INSTANCE_TYPE \
    --key-name $KEY_NAME \
    --security-group-ids $SG_ID \
    --subnet-id $SUBNET_ID \
    --user-data "$USER_DATA_ENCODED" \
    --tag-specifications "ResourceType=instance,Tags=[{Key=Name,Value=business-app-beta},{Key=Environment,Value=beta}]" \
    --block-device-mappings '[{"DeviceName":"/dev/xvda","Ebs":{"VolumeSize":30,"VolumeType":"gp3"}}]' \
    --query 'Instances[0].InstanceId' --output text 2>&1)
LAUNCH_EXIT_CODE=$?
set -e

# Check if error is about Free Tier or any other error
if [ $LAUNCH_EXIT_CODE -ne 0 ] || echo "$LAUNCH_OUTPUT" | grep -qi "free-tier\|Free Tier\|not eligible for Free Tier\|error\|Error"; then
    echo ""
    echo "═══════════════════════════════════════════════════════════════"
    echo "⚠️  FREE TIER RESTRICTION DETECTED"
    echo "═══════════════════════════════════════════════════════════════"
    echo ""
    echo "Your AWS account is using Free Tier benefits."
    echo "Free Tier only allows: t2.micro or t3.micro"
    echo ""
    echo "You requested: $INSTANCE_TYPE"
    echo ""
    echo "Error: $LAUNCH_OUTPUT"
    echo ""
    echo "📋 Solutions:"
    echo ""
    echo "Option 1: Use t3.micro (Free Tier eligible, but very limited)"
    echo "   ⚠️  Warning: Only 1 GB RAM - may cause OOM errors"
    echo "   Run:"
    echo "   AWS_PROFILE=business-app bash scripts/deploy-aws-auto.sh ap-south-1 business-app-key t3.micro"
    echo ""
    echo "Option 2: Accept charges and use t3.medium/t3.large (Recommended)"
    echo "   Your account will be charged for the instance"
    echo "   Free Tier restrictions only apply if you want FREE usage"
    echo "   If you're okay paying, you may need to:"
    echo "   - Contact AWS Support to enable paid instances"
    echo "   - Or wait for Free Tier period to end"
    echo ""
    echo "Option 3: Wait for Free Tier to expire (12 months from account creation)"
    echo ""
    echo "Option 4: Use a different AWS account without Free Tier"
    echo ""
    echo "═══════════════════════════════════════════════════════════════"
    exit 1
fi

# Extract instance ID (should be in the output)
INSTANCE_ID="$LAUNCH_OUTPUT"

# Validate instance ID format
if [[ ! "$INSTANCE_ID" =~ ^i-[0-9a-f]{17}$ ]]; then
    echo ""
    echo "❌ Failed to launch EC2 instance"
    echo "   Error: $LAUNCH_OUTPUT"
    echo ""
    
    # Provide helpful error messages
    if echo "$LAUNCH_OUTPUT" | grep -qi "free-tier\|Free Tier"; then
        echo "   ⚠️  Free Tier Restriction Detected"
        echo "   Free Tier only allows: t2.micro or t3.micro"
        echo ""
        echo "   Solutions:"
        echo "   1. Use t3.micro (Free Tier):"
        echo "      AWS_PROFILE=business-app bash scripts/deploy-aws-auto.sh ap-south-1 business-app-key t3.micro"
        echo ""
        echo "   2. Accept charges for t3.medium (contact AWS Support if needed)"
    else
        echo "   Check the error message above for details."
    fi
    exit 1
fi

if [ -z "$INSTANCE_ID" ] || [ "$INSTANCE_ID" = "None" ]; then
    echo "❌ Failed to launch EC2 instance"
    echo "   No instance ID returned"
    echo "   Output: $LAUNCH_OUTPUT"
    exit 1
fi

echo "✅ Instance launched: $INSTANCE_ID"
echo ""

# Wait for instance
echo "⏳ Waiting for instance to be running..."
$AWS_CMD ec2 wait instance-running --region $REGION --instance-ids $INSTANCE_ID

# Get public IP
PUBLIC_IP=$($AWS_CMD ec2 describe-instances \
    --region $REGION \
    --instance-ids $INSTANCE_ID \
    --query 'Reservations[0].Instances[0].PublicIpAddress' --output text)

# Wait for public IP if not immediately available
if [ -z "$PUBLIC_IP" ] || [ "$PUBLIC_IP" = "None" ]; then
    echo "⏳ Waiting for public IP assignment..."
    for i in {1..30}; do
        sleep 5
        PUBLIC_IP=$($AWS_CMD ec2 describe-instances \
            --region $REGION \
            --instance-ids $INSTANCE_ID \
            --query 'Reservations[0].Instances[0].PublicIpAddress' --output text)
        if [ -n "$PUBLIC_IP" ] && [ "$PUBLIC_IP" != "None" ]; then
            break
        fi
    done
fi

if [ -z "$PUBLIC_IP" ] || [ "$PUBLIC_IP" = "None" ]; then
    echo "⚠️  Public IP not yet assigned. Instance may be in a private subnet."
    echo "   Instance ID: $INSTANCE_ID"
    echo "   Check AWS Console for IP address"
fi

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "✅ DEPLOYMENT INITIATED!"
echo "═══════════════════════════════════════════════════════════════"
echo "Instance ID: $INSTANCE_ID"
echo "Public IP: $PUBLIC_IP"
echo ""
echo "⏳ Waiting for application to deploy (this may take 5-10 minutes)..."
echo "   The instance is:"
echo "   1. Installing Docker and dependencies"
echo "   2. Cloning repository from GitHub"
echo "   3. Building and deploying all services"
echo "   4. Configuring Nginx"
echo ""

# Monitor deployment
echo "📊 Monitoring deployment progress..."
SSH_KEY_FILE="$HOME/.ssh/$KEY_NAME.pem"
if [ ! -f "$SSH_KEY_FILE" ]; then
    echo "⚠️  SSH key file not found: $SSH_KEY_FILE"
    echo "   Skipping SSH-based monitoring. Please check instance manually."
    echo "   Instance IP: $PUBLIC_IP"
elif [ -z "$PUBLIC_IP" ] || [ "$PUBLIC_IP" = "None" ]; then
    echo "⚠️  Public IP not available yet. Skipping SSH monitoring."
    echo "   Check AWS Console for instance status."
else
    for i in {1..60}; do
        sleep 10
        if ssh -i "$SSH_KEY_FILE" -o StrictHostKeyChecking=no -o ConnectTimeout=5 -o UserKnownHostsFile=/dev/null ec2-user@$PUBLIC_IP "docker ps | grep -q business-web-app" 2>/dev/null; then
            echo ""
            echo "✅ Services are running!"
            break
        fi
        if [ $((i % 6)) -eq 0 ]; then
            echo "   Still deploying... ($((i*10)) seconds elapsed)"
        fi
    done
fi

# Final check
echo ""
echo "🔍 Verifying deployment..."
sleep 10

if [ -n "$PUBLIC_IP" ] && [ "$PUBLIC_IP" != "None" ] && curl -s -f -m 5 "http://$PUBLIC_IP" > /dev/null 2>&1; then
    echo ""
    echo "═══════════════════════════════════════════════════════════════"
    echo "🎉 DEPLOYMENT SUCCESSFUL!"
    echo "═══════════════════════════════════════════════════════════════"
    echo ""
    if [ -n "$PUBLIC_IP" ] && [ "$PUBLIC_IP" != "None" ]; then
        echo "🌐 Your application is live at:"
        echo "   http://$PUBLIC_IP"
        echo ""
        echo "📋 Access Information:"
        echo "   - Web App: http://$PUBLIC_IP"
        echo "   - API: http://$PUBLIC_IP/api/v1/*"
        echo "   - SSH: ssh -i ~/.ssh/$KEY_NAME.pem ec2-user@$PUBLIC_IP"
    else
        echo "🌐 Instance is running but public IP not yet assigned."
        echo "   Check AWS Console for the IP address."
        echo "   Instance ID: $INSTANCE_ID"
    fi
    echo ""
    echo "🔐 Security Notes:"
    echo "   - Backend services are internal only (not exposed)"
    echo "   - Only web app is accessible publicly"
    echo "   - All API calls go through Nginx reverse proxy"
    echo ""
    if [ -n "$PUBLIC_IP" ] && [ "$PUBLIC_IP" != "None" ]; then
        echo "📊 Check deployment status:"
        echo "   ssh -i ~/.ssh/$KEY_NAME.pem ec2-user@$PUBLIC_IP 'docker ps'"
        echo ""
        echo "🔍 Verify deployment (recommended):"
        echo "   ssh -i ~/.ssh/$KEY_NAME.pem ec2-user@$PUBLIC_IP '/home/ec2-user/verify-deployment.sh'"
        echo ""
        echo "📋 View logs:"
        echo "   ssh -i ~/.ssh/$KEY_NAME.pem ec2-user@$PUBLIC_IP 'cd /opt/business-app/app && docker-compose -f docker-compose.prod.yml logs --tail=50'"
    else
        echo "📊 Check deployment status in AWS Console:"
        echo "   Instance ID: $INSTANCE_ID"
        echo "   Once public IP is assigned, use SSH commands above"
    fi
    echo ""
    echo "💡 Database tables are auto-created on service startup"
    echo "   All services use ENABLE_SYNC=true for automatic table creation"
    echo ""
    echo "═══════════════════════════════════════════════════════════════"
else
    echo ""
    echo "⚠️  Deployment may still be in progress..."
    if [ -n "$PUBLIC_IP" ] && [ "$PUBLIC_IP" != "None" ]; then
        echo "   Check status: ssh -i ~/.ssh/$KEY_NAME.pem ec2-user@$PUBLIC_IP 'docker ps'"
        echo "   View logs: ssh -i ~/.ssh/$KEY_NAME.pem ec2-user@$PUBLIC_IP 'cd /opt/business-app/app && docker-compose -f docker-compose.prod.yml logs'"
        echo "   Verify: ssh -i ~/.ssh/$KEY_NAME.pem ec2-user@$PUBLIC_IP '/home/ec2-user/verify-deployment.sh'"
        echo ""
        echo "🌐 Application URL: http://$PUBLIC_IP"
        echo "   (May take a few more minutes to be fully ready)"
    else
        echo "   Instance ID: $INSTANCE_ID"
        echo "   Public IP not yet assigned. Check AWS Console for IP address."
        echo "   Once IP is available, use SSH commands to check deployment status."
    fi
    echo ""
    echo "💡 Note: Database tables are auto-created on first service start"
    echo "   Services will create tables automatically with ENABLE_SYNC=true"
fi

