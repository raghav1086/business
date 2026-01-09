#!/bin/bash
# =============================================================================
# UNIFIED AWS DEPLOYMENT SCRIPT
# =============================================================================
# Single command end-to-end deployment for Business App
# Consolidates all deployment functionality including fixes and edge cases
# =============================================================================

set -e

# Configuration with defaults
REGION=${1:-ap-south-1}
KEY_NAME=${2:-business-app-key}
# Instance type will be prompted if not provided
INSTANCE_TYPE=${3:-}
GIT_REPO="https://github.com/ashishnimrot/business.git"

# AWS Profile support (can be set via environment variable or passed as 4th argument)
# Default to 'business-app' if not provided
AWS_PROFILE=${AWS_PROFILE:-${4:-business-app}}
DOMAIN=${5:-}
EMAIL=${6:-}

AWS_CMD="aws --profile $AWS_PROFILE"
export AWS_PROFILE

echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║     BUSINESS APP - UNIFIED AWS DEPLOYMENT                      ║"
echo "║     Single Command End-to-End Deployment                      ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""

# Prompt for instance type if not provided
if [ -z "$INSTANCE_TYPE" ]; then
    echo "📋 Instance Type Selection"
    echo "─────────────────────────────────────────────────────────────"
    echo "Please select an instance type:"
    echo ""
    echo "  1. t3.micro  (Free Tier, 1 GB RAM - may have performance issues)"
    echo "  2. t3.small  (2 GB RAM - good for testing)"
    echo "  3. t3.medium (4 GB RAM - recommended for production)"
    echo "  4. t3.large (8 GB RAM - high performance)"
    echo "  5. Custom    (Enter your own instance type)"
    echo ""
    read -p "Choose option (1/2/3/4/5): " -n 1 -r
    echo ""
    
    if [[ $REPLY =~ ^[1]$ ]]; then
        INSTANCE_TYPE="t3.micro"
        echo "✅ Selected: t3.micro (Free Tier)"
    elif [[ $REPLY =~ ^[2]$ ]]; then
        INSTANCE_TYPE="t3.small"
        echo "✅ Selected: t3.small"
    elif [[ $REPLY =~ ^[3]$ ]]; then
        INSTANCE_TYPE="t3.medium"
        echo "✅ Selected: t3.medium (Recommended)"
    elif [[ $REPLY =~ ^[4]$ ]]; then
        INSTANCE_TYPE="t3.large"
        echo "✅ Selected: t3.large"
    elif [[ $REPLY =~ ^[5]$ ]]; then
        read -p "Enter instance type (e.g., t3.xlarge, m5.large): " INSTANCE_TYPE
        if [ -z "$INSTANCE_TYPE" ]; then
            echo "❌ No instance type provided. Using default: t3.medium"
            INSTANCE_TYPE="t3.medium"
        else
            echo "✅ Selected: $INSTANCE_TYPE"
        fi
    else
        echo "⚠️  Invalid option. Using default: t3.medium"
        INSTANCE_TYPE="t3.medium"
    fi
    echo ""
fi

echo "📋 Configuration:"
echo "   Region: $REGION"
echo "   Key Name: $KEY_NAME"
echo "   Instance Type: $INSTANCE_TYPE"
echo "   AWS Profile: $AWS_PROFILE"
if [ -n "$DOMAIN" ]; then
    echo "   Domain: $DOMAIN"
    if [ -n "$EMAIL" ]; then
        echo "   Email: $EMAIL"
    else
        echo "   Email: admin@$DOMAIN (default)"
    fi
fi
echo "   Git Repo: $GIT_REPO"
echo ""

# =============================================================================
# SECTION 1: AWS CREDENTIALS & VALIDATION
# =============================================================================
echo "🔍 Step 1/10: Verifying AWS credentials..."
if ! $AWS_CMD sts get-caller-identity &>/dev/null; then
    echo "❌ AWS credentials not configured"
    echo "Profile '$AWS_PROFILE' not found or invalid"
    echo ""
    echo "Please configure AWS credentials:"
    echo "   aws configure --profile $AWS_PROFILE"
    echo ""
    echo "Or use a different profile:"
    echo "   AWS_PROFILE=your-profile make deploy-aws"
    exit 1
fi
ACCOUNT_ID=$($AWS_CMD sts get-caller-identity --query Account --output text)
USER_ARN=$($AWS_CMD sts get-caller-identity --query Arn --output text)
echo "✅ AWS Account: $ACCOUNT_ID"
echo "✅ User: $USER_ARN"
echo ""

# =============================================================================
# SECTION 2: IAM SETUP
# =============================================================================
echo "🔐 Step 2/10: Setting up IAM user..."
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

# =============================================================================
# SECTION 3: KEY PAIR SETUP
# =============================================================================
echo "🔑 Step 3/10: Setting up Key Pair..."
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

# =============================================================================
# SECTION 4: VPC & SUBNET DETECTION
# =============================================================================
echo "🌐 Step 4/10: Finding VPC and Subnet..."
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

# =============================================================================
# SECTION 5: SECURITY GROUP SETUP
# =============================================================================
echo "🔒 Step 5/10: Creating Security Group..."

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

# =============================================================================
# SECTION 6: AMI DETECTION
# =============================================================================
echo "🖼️  Step 6/10: Finding latest AMI..."
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

# =============================================================================
# SECTION 7: USER DATA SCRIPT GENERATION
# =============================================================================
echo "📝 Step 7/10: Preparing deployment script..."
USER_DATA=$(cat <<'USERDATA_EOF'
#!/bin/bash
exec > >(tee /var/log/user-data.log|logger -t user-data -s 2>/dev/console) 2>&1
set -e
echo "Starting deployment..."
yum update -y -q
yum install -y docker git curl --allowerasing || yum install -y docker git curl
systemctl start docker && systemctl enable docker
usermod -a -G docker ec2-user

curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose
yum install -y nginx && systemctl enable nginx
curl -fsSL https://rpm.nodesource.com/setup_20.x | bash - >/dev/null 2>&1
yum install -y nodejs >/dev/null 2>&1
mkdir -p /opt/business-app && chown ec2-user:ec2-user /opt/business-app
cd /opt/business-app
for i in {1..3}; do
    sudo -u ec2-user git clone https://github.com/ashishnimrot/business.git . 2>/dev/null && break
    [ $i -lt 3 ] && sleep 10 || exit 1
done

DB_PASSWORD="Admin112233"
JWT_SECRET=$(openssl rand -base64 64|tr -d "=+/"|cut -c1-64)
JWT_REFRESH_SECRET=$(openssl rand -base64 64|tr -d "=+/"|cut -c1-64)
cd /opt/business-app/app
sudo -u ec2-user bash -c "printf 'DB_PASSWORD=%s\nJWT_SECRET=%s\nJWT_REFRESH_SECRET=%s\nENABLE_SYNC=true\nENABLE_FAKE_OTP=true\n' \"${DB_PASSWORD}\" \"${JWT_SECRET}\" \"${JWT_REFRESH_SECRET}\" > .env.production"
sudo -u ec2-user cp .env.production .env && chown ec2-user:ec2-user .env .env.production

cd /opt/business-app/app
for i in {1..30}; do
    docker ps &>/dev/null && chmod 666 /var/run/docker.sock 2>/dev/null && sudo -u ec2-user docker ps &>/dev/null && break
    sleep 2
done
[ ! -f .env ] && sudo -u ec2-user cp .env.production .env && chown ec2-user:ec2-user .env
mkdir -p /root/.docker/cli-plugins /home/ec2-user/.docker/cli-plugins
chown -R ec2-user:ec2-user /home/ec2-user/.docker
curl -L "https://github.com/docker/buildx/releases/download/v0.17.0/buildx-v0.17.0.linux-amd64" -o /tmp/docker-buildx 2>/dev/null || curl -L "https://github.com/docker/buildx/releases/latest/download/buildx-linux-amd64" -o /tmp/docker-buildx 2>/dev/null || true
[ -f /tmp/docker-buildx ] && chmod +x /tmp/docker-buildx && cp /tmp/docker-buildx /root/.docker/cli-plugins/docker-buildx && cp /tmp/docker-buildx /home/ec2-user/.docker/cli-plugins/docker-buildx && chmod +x /root/.docker/cli-plugins/docker-buildx /home/ec2-user/.docker/cli-plugins/docker-buildx && chown ec2-user:ec2-user /home/ec2-user/.docker/cli-plugins/docker-buildx

sudo -u ec2-user bash -c 'cd /opt/business-app/app && eval $(awk -F"=" "{if(NF>=2&&\$1!~/^[[:space:]]*#/&&\$1!~/^[[:space:]]*$/){k=\$1;gsub(/^[[:space:]]+|[[:space:]]+\$/,\"\",k);v=substr(\$0,index(\$0,\"=\")+1);gsub(/^[[:space:]]+|[[:space:]]+\$/,\"\",v);gsub(/^[\"'\''\"]|[\"'\''\"]\$/,\"\",v);printf \"export %s=\\\"%s\\\"\\n\",k,v}}" .env.production) && docker-compose -f docker-compose.prod.yml build --no-cache || docker-compose -f docker-compose.prod.yml build'
sudo -u ec2-user bash -c 'cd /opt/business-app/app && eval $(awk -F"=" "{if(NF>=2&&\$1!~/^[[:space:]]*#/&&\$1!~/^[[:space:]]*$/){k=\$1;gsub(/^[[:space:]]+|[[:space:]]+\$/,\"\",k);v=substr(\$0,index(\$0,\"=\")+1);gsub(/^[[:space:]]+|[[:space:]]+\$/,\"\",v);gsub(/^[\"'\''\"]|[\"'\''\"]\$/,\"\",v);printf \"export %s=\\\"%s\\\"\\n\",k,v}}" .env.production) && docker-compose -f docker-compose.prod.yml up -d'

for i in {1..60}; do docker ps|grep -q business-postgres && docker ps|grep -q business-auth && break; sleep 3; done
sleep 90
for i in {1..40}; do docker exec business-postgres psql -U postgres -d auth_db -c "\dt" 2>/dev/null|grep -q users && break; sleep 3; done
sleep 30

PUBLIC_IP=$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4)
tee /etc/nginx/conf.d/business-app.conf <<'NGINX_EOF'
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
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
    
    # Auth service - preserve full path
    location /api/v1/auth {
        proxy_pass http://auth_service;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # Business service
    location /api/v1/businesses {
        proxy_pass http://business_service;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # Party service
    location /api/v1/parties {
        proxy_pass http://party_service;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # Inventory service
    location /api/v1/items {
        proxy_pass http://inventory_service;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # Stock endpoints
    location /api/v1/stock {
        proxy_pass http://inventory_service;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # Invoice service
    location /api/v1/invoices {
        proxy_pass http://invoice_service;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # Payment service
    location /api/v1/payments {
        proxy_pass http://payment_service;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
NGINX_EOF

nginx -t && systemctl restart nginx && systemctl enable nginx || systemctl start nginx

mkdir -p /opt/backups
echo '#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
docker exec business-postgres pg_dumpall -U postgres|gzip >/opt/backups/db_backup_$DATE.sql.gz
find /opt/backups -name "*.sql.gz" -mtime +7 -delete' >/home/ec2-user/backup.sh
chmod +x /home/ec2-user/backup.sh
(crontab -l 2>/dev/null;echo "0 2 * * * /home/ec2-user/backup.sh")|crontab -
echo '#!/bin/bash
cd /opt/business-app/app && bash scripts/verify-deployment.sh' >/home/ec2-user/verify-deployment.sh
chmod +x /home/ec2-user/verify-deployment.sh
USERDATA_EOF
)

# Encode user data (handle both Linux and macOS)
if [[ "$OSTYPE" == "darwin"* ]]; then
    USER_DATA_ENCODED=$(echo "$USER_DATA" | base64)
else
    USER_DATA_ENCODED=$(echo "$USER_DATA" | base64 -w 0)
fi

# Check user data size (AWS limit is 16,384 bytes for base64 encoded)
USER_DATA_SIZE=${#USER_DATA_ENCODED}
if [ $USER_DATA_SIZE -gt 16384 ]; then
    echo ""
    echo "⚠️  WARNING: User data size ($USER_DATA_SIZE bytes) exceeds AWS limit (16,384 bytes)"
    echo "   The script has been optimized, but may still be too large."
    echo "   Consider using a bootstrap script approach or further optimization."
    echo ""
    echo "📋 Options:"
    echo "   1. Continue anyway (may fail)"
    echo "   2. Exit and further optimize"
    echo ""
    read -p "Choose option (1/2): " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[1]$ ]]; then
        echo "❌ Deployment cancelled. User-data script needs further optimization."
        exit 1
    fi
    echo "⚠️  Continuing with oversized user-data (may fail at launch)..."
    echo ""
elif [ $USER_DATA_SIZE -gt 15000 ]; then
    echo "⚠️  User data size is close to limit: $USER_DATA_SIZE / 16384 bytes"
    echo ""
fi

# =============================================================================
# SECTION 8: CHECK FOR EXISTING INSTANCE
# =============================================================================
echo "🔍 Checking for existing instances..."
EXISTING_INSTANCE=$($AWS_CMD ec2 describe-instances \
    --region $REGION \
    --filters "Name=tag:Name,Values=business-app-beta" "Name=instance-state-name,Values=running,stopped,stopping" \
    --query 'Reservations[0].Instances[0].InstanceId' \
    --output text 2>/dev/null || echo "")

if [ -n "$EXISTING_INSTANCE" ] && [ "$EXISTING_INSTANCE" != "None" ]; then
    EXISTING_STATE=$($AWS_CMD ec2 describe-instances \
        --region $REGION \
        --instance-ids $EXISTING_INSTANCE \
        --query 'Reservations[0].Instances[0].State.Name' \
        --output text)
    
    echo "⚠️  Found existing instance: $EXISTING_INSTANCE (State: $EXISTING_STATE)"
    echo ""
    echo "Options:"
    echo "  1. Terminate existing instance and deploy new one"
    echo "  2. Skip deployment (keep existing instance)"
    echo "  3. Exit"
    echo "  4. Deploy new instance (keep existing instance running)"
    echo ""
    read -p "Choose option (1/2/3/4): " -n 1 -r
    echo ""
    
    if [[ $REPLY =~ ^[1]$ ]]; then
        echo "🗑️  Terminating existing instance..."
        $AWS_CMD ec2 terminate-instances --region $REGION --instance-ids $EXISTING_INSTANCE > /dev/null
        echo "⏳ Waiting for termination..."
        $AWS_CMD ec2 wait instance-terminated --region $REGION --instance-ids $EXISTING_INSTANCE 2>/dev/null || true
        sleep 5
        echo "✅ Existing instance terminated"
        echo ""
        INSTANCE_NAME="business-app-beta"
    elif [[ $REPLY =~ ^[2]$ ]]; then
        echo "⏸️  Skipping deployment. Keeping existing instance."
        exit 0
    elif [[ $REPLY =~ ^[3]$ ]]; then
        echo "❌ Deployment cancelled"
        exit 1
    elif [[ $REPLY =~ ^[4]$ ]]; then
        echo "🆕 Deploying new instance alongside existing one..."
        # Find next available instance number
        EXISTING_COUNT=$($AWS_CMD ec2 describe-instances \
            --region $REGION \
            --filters "Name=tag:Name,Values=business-app-beta*" "Name=instance-state-name,Values=running,stopped,stopping,pending" \
            --query 'length(Reservations[*].Instances[*])' \
            --output text 2>/dev/null || echo "0")
        
        if [ "$EXISTING_COUNT" = "0" ] || [ -z "$EXISTING_COUNT" ]; then
            INSTANCE_NAME="business-app-beta-2"
        else
            # Find the highest number
            MAX_NUM=1
            for i in {2..20}; do
                CHECK_NAME="business-app-beta-$i"
                EXISTS=$($AWS_CMD ec2 describe-instances \
                    --region $REGION \
                    --filters "Name=tag:Name,Values=$CHECK_NAME" "Name=instance-state-name,Values=running,stopped,stopping,pending" \
                    --query 'length(Reservations[*].Instances[*])' \
                    --output text 2>/dev/null || echo "0")
                if [ "$EXISTS" != "0" ] && [ -n "$EXISTS" ]; then
                    MAX_NUM=$i
                fi
            done
            INSTANCE_NAME="business-app-beta-$((MAX_NUM + 1))"
        fi
        echo "   New instance will be named: $INSTANCE_NAME"
        echo ""
    else
        echo "❌ Invalid option. Deployment cancelled"
        exit 1
    fi
else
    echo "✅ No existing instance found"
    echo ""
    INSTANCE_NAME="business-app-beta"
fi

# =============================================================================
# SECTION 9: EC2 INSTANCE LAUNCH
# =============================================================================
echo "🚀 Step 8/10: Launching EC2 instance..."

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
    --tag-specifications "ResourceType=instance,Tags=[{Key=Name,Value=${INSTANCE_NAME}},{Key=Environment,Value=beta}]" \
    --block-device-mappings '[{"DeviceName":"/dev/xvda","Ebs":{"VolumeSize":30,"VolumeType":"gp3"}}]' \
    --query 'Instances[0].InstanceId' --output text 2>&1)
LAUNCH_EXIT_CODE=$?
set -e

# Check if error is about Free Tier or any other error
if [ $LAUNCH_EXIT_CODE -ne 0 ] || echo "$LAUNCH_OUTPUT" | grep -qi "free-tier\|Free Tier\|not eligible for Free Tier\|error\|Error"; then
    echo ""
    
    # Check for user data size limit error
    if echo "$LAUNCH_OUTPUT" | grep -qi "User data is limited\|16384\|user.*data.*limit"; then
        echo "═══════════════════════════════════════════════════════════════"
        echo "⚠️  USER DATA SIZE LIMIT EXCEEDED"
        echo "═══════════════════════════════════════════════════════════════"
        echo ""
        echo "Error: User data script exceeds AWS limit of 16,384 bytes"
        echo ""
        echo "📋 Choose an instance type to retry:"
        echo ""
        echo "  1. t3.micro (Free Tier, 1 GB RAM - may have issues)"
        echo "  2. t3.small (2 GB RAM - better performance)"
        echo "  3. t3.medium (4 GB RAM - recommended)"
        echo "  4. t3.large (8 GB RAM - high performance)"
        echo "  5. Exit and optimize user-data script"
        echo ""
        read -p "Choose option (1/2/3/4/5): " -n 1 -r
        echo ""
        
        if [[ $REPLY =~ ^[1]$ ]]; then
            INSTANCE_TYPE="t3.micro"
            echo "🔄 Retrying with t3.micro..."
        elif [[ $REPLY =~ ^[2]$ ]]; then
            INSTANCE_TYPE="t3.small"
            echo "🔄 Retrying with t3.small..."
        elif [[ $REPLY =~ ^[3]$ ]]; then
            INSTANCE_TYPE="t3.medium"
            echo "🔄 Retrying with t3.medium..."
        elif [[ $REPLY =~ ^[4]$ ]]; then
            INSTANCE_TYPE="t3.large"
            echo "🔄 Retrying with t3.large..."
        else
            echo "❌ Deployment cancelled. Please optimize user-data script."
            exit 1
        fi
        
        # Retry launch with selected instance type
        set +e
        LAUNCH_OUTPUT=$($AWS_CMD ec2 run-instances \
            --region $REGION \
            --image-id $AMI_ID \
            --instance-type $INSTANCE_TYPE \
            --key-name $KEY_NAME \
            --security-group-ids $SG_ID \
            --subnet-id $SUBNET_ID \
            --user-data "$USER_DATA_ENCODED" \
            --tag-specifications "ResourceType=instance,Tags=[{Key=Name,Value=${INSTANCE_NAME}},{Key=Environment,Value=beta}]" \
            --block-device-mappings '[{"DeviceName":"/dev/xvda","Ebs":{"VolumeSize":30,"VolumeType":"gp3"}}]' \
            --query 'Instances[0].InstanceId' --output text 2>&1)
        LAUNCH_EXIT_CODE=$?
        set -e
        
        if [ $LAUNCH_EXIT_CODE -ne 0 ]; then
            echo "❌ Retry with $INSTANCE_TYPE also failed"
            echo "   Error: $LAUNCH_OUTPUT"
            echo ""
            echo "⚠️  The user-data script may be too large for any instance type"
            echo "   Please optimize the user-data script or contact support"
            exit 1
        fi
        echo "✅ Instance launched with $INSTANCE_TYPE"
    # Check for Free Tier restriction
    elif echo "$LAUNCH_OUTPUT" | grep -qi "free-tier\|Free Tier\|not eligible for Free Tier"; then
        echo "═══════════════════════════════════════════════════════════════"
        echo "⚠️  FREE TIER RESTRICTION DETECTED"
        echo "═══════════════════════════════════════════════════════════════"
        echo ""
        echo "Your AWS account is using Free Tier benefits."
        echo "Free Tier only allows: t2.micro or t3.micro"
        echo ""
        echo "You requested: $INSTANCE_TYPE"
        echo ""
        echo "📋 Choose an instance type:"
        echo ""
        echo "  1. t3.micro (Free Tier eligible, 1 GB RAM)"
        echo "  2. t3.small (Paid, 2 GB RAM)"
        echo "  3. t3.medium (Paid, 4 GB RAM - recommended)"
        echo "  4. t3.large (Paid, 8 GB RAM)"
        echo "  5. Exit"
        echo ""
        read -p "Choose option (1/2/3/4/5): " -n 1 -r
        echo ""
        
        if [[ $REPLY =~ ^[1]$ ]]; then
            INSTANCE_TYPE="t3.micro"
            echo "🔄 Retrying with t3.micro (Free Tier)..."
        elif [[ $REPLY =~ ^[2]$ ]]; then
            INSTANCE_TYPE="t3.small"
            echo "🔄 Retrying with t3.small (Paid)..."
        elif [[ $REPLY =~ ^[3]$ ]]; then
            INSTANCE_TYPE="t3.medium"
            echo "🔄 Retrying with t3.medium (Paid)..."
        elif [[ $REPLY =~ ^[4]$ ]]; then
            INSTANCE_TYPE="t3.large"
            echo "🔄 Retrying with t3.large (Paid)..."
        else
            echo "❌ Deployment cancelled"
            exit 1
        fi
        
        # Retry launch with selected instance type
        set +e
        LAUNCH_OUTPUT=$($AWS_CMD ec2 run-instances \
            --region $REGION \
            --image-id $AMI_ID \
            --instance-type $INSTANCE_TYPE \
            --key-name $KEY_NAME \
            --security-group-ids $SG_ID \
            --subnet-id $SUBNET_ID \
            --user-data "$USER_DATA_ENCODED" \
            --tag-specifications "ResourceType=instance,Tags=[{Key=Name,Value=${INSTANCE_NAME}},{Key=Environment,Value=beta}]" \
            --block-device-mappings '[{"DeviceName":"/dev/xvda","Ebs":{"VolumeSize":30,"VolumeType":"gp3"}}]' \
            --query 'Instances[0].InstanceId' --output text 2>&1)
        LAUNCH_EXIT_CODE=$?
        set -e
        
        if [ $LAUNCH_EXIT_CODE -ne 0 ]; then
            echo "❌ Retry with $INSTANCE_TYPE failed"
            echo "   Error: $LAUNCH_OUTPUT"
            echo ""
            if [[ "$INSTANCE_TYPE" != "t3.micro" ]]; then
                echo "⚠️  You may need to contact AWS Support to enable paid instances"
            fi
            exit 1
        fi
        echo "✅ Instance launched with $INSTANCE_TYPE"
    else
        # Generic error handling
        echo "═══════════════════════════════════════════════════════════════"
        echo "❌ DEPLOYMENT ERROR"
        echo "═══════════════════════════════════════════════════════════════"
        echo ""
        echo "Error: $LAUNCH_OUTPUT"
        echo ""
        echo "📋 Would you like to try a different instance type?"
        echo ""
        echo "  1. t3.micro (Free Tier, 1 GB RAM)"
        echo "  2. t3.small (2 GB RAM)"
        echo "  3. t3.medium (4 GB RAM)"
        echo "  4. t3.large (8 GB RAM)"
        echo "  5. Exit"
        echo ""
        read -p "Choose option (1/2/3/4/5): " -n 1 -r
        echo ""
        
        if [[ $REPLY =~ ^[1]$ ]]; then
            INSTANCE_TYPE="t3.micro"
            echo "🔄 Retrying with t3.micro..."
        elif [[ $REPLY =~ ^[2]$ ]]; then
            INSTANCE_TYPE="t3.small"
            echo "🔄 Retrying with t3.small..."
        elif [[ $REPLY =~ ^[3]$ ]]; then
            INSTANCE_TYPE="t3.medium"
            echo "🔄 Retrying with t3.medium..."
        elif [[ $REPLY =~ ^[4]$ ]]; then
            INSTANCE_TYPE="t3.large"
            echo "🔄 Retrying with t3.large..."
        else
            echo "❌ Deployment cancelled"
            exit 1
        fi
        
        # Retry launch with selected instance type
        set +e
        LAUNCH_OUTPUT=$($AWS_CMD ec2 run-instances \
            --region $REGION \
            --image-id $AMI_ID \
            --instance-type $INSTANCE_TYPE \
            --key-name $KEY_NAME \
            --security-group-ids $SG_ID \
            --subnet-id $SUBNET_ID \
            --user-data "$USER_DATA_ENCODED" \
            --tag-specifications "ResourceType=instance,Tags=[{Key=Name,Value=${INSTANCE_NAME}},{Key=Environment,Value=beta}]" \
            --block-device-mappings '[{"DeviceName":"/dev/xvda","Ebs":{"VolumeSize":30,"VolumeType":"gp3"}}]' \
            --query 'Instances[0].InstanceId' --output text 2>&1)
        LAUNCH_EXIT_CODE=$?
        set -e
        
        if [ $LAUNCH_EXIT_CODE -ne 0 ]; then
            echo "❌ Retry with $INSTANCE_TYPE also failed"
            echo "   Error: $LAUNCH_OUTPUT"
            exit 1
        fi
        echo "✅ Instance launched with $INSTANCE_TYPE"
    fi
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
        echo "      AWS_PROFILE=business-app bash scripts/deploy-aws-unified.sh ap-south-1 business-app-key t3.micro"
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
    echo "💾 Automatic backups are configured (daily at 2 AM)"
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

# =============================================================================
# SECTION 10: DOMAIN & SSL SETUP (OPTIONAL)
# =============================================================================

# Validate domain format if provided
if [ -n "$DOMAIN" ]; then
    if [[ ! "$DOMAIN" =~ ^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]?\.[a-zA-Z]{2,}$ ]]; then
        echo "❌ Invalid domain format: $DOMAIN"
        echo "   Domain should be in format: example.com"
        exit 1
    fi
    
    # Validate email format if provided
    if [ -n "$EMAIL" ]; then
        if [[ ! "$EMAIL" =~ ^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$ ]]; then
            echo "❌ Invalid email format: $EMAIL"
            echo "   Email should be in format: user@example.com"
            exit 1
        fi
    fi
fi

if [ -n "$DOMAIN" ] && [ -n "$PUBLIC_IP" ] && [ "$PUBLIC_IP" != "None" ]; then
    echo ""
    echo "═══════════════════════════════════════════════════════════════"
    echo "🌐 DOMAIN & SSL SETUP"
    echo "═══════════════════════════════════════════════════════════════"
    echo ""
    echo "Domain: $DOMAIN"
    echo "EC2 IP: $PUBLIC_IP"
    echo ""
    
    # Step 1: DNS Configuration Instructions
    echo "📋 Step 1: Configure DNS"
    echo "─────────────────────────────────────────────────────────────"
    echo "Please configure DNS in your domain provider (GoDaddy, etc.):"
    echo ""
    echo "1. Add A Record:"
    echo "   Type: A"
    echo "   Name: @"
    echo "   Value: $PUBLIC_IP"
    echo "   TTL: 600"
    echo ""
    echo "2. Add CNAME (optional):"
    echo "   Type: CNAME"
    echo "   Name: www"
    echo "   Value: @"
    echo ""
    echo "⚠️  Important: Remove any 'Parked' or conflicting A records"
    echo ""
    read -p "Have you configured DNS? (y/n) " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo ""
        echo "⏸️  Skipping domain/SSL setup. You can run it later:"
        echo "   ssh -i ~/.ssh/$KEY_NAME.pem ec2-user@$PUBLIC_IP"
        echo "   cd /opt/business-app/app"
        echo "   sudo bash scripts/setup-domain-ec2.sh $DOMAIN"
        if [ -n "$EMAIL" ]; then
            echo "   sudo bash scripts/setup-ssl-ec2.sh $DOMAIN $EMAIL"
        else
            echo "   sudo bash scripts/setup-ssl-ec2.sh $DOMAIN"
        fi
        echo ""
        exit 0
    fi
    
    # Step 2: Wait for DNS propagation (optional)
    echo ""
    echo "⏳ Step 2: Waiting for DNS propagation..."
    
    # Check if dig is available
    if ! command -v dig &> /dev/null; then
        echo "⚠️  'dig' command not found. Installing bind-utils..."
        if [[ "$OSTYPE" == "darwin"* ]]; then
            echo "   Please install bind-utils manually: brew install bind"
            echo "   Or skip DNS check and continue"
            read -p "Continue without DNS check? (y/n) " -n 1 -r
            echo ""
            if [[ ! $REPLY =~ ^[Yy]$ ]]; then
                exit 1
            fi
            DNS_READY=false
        else
            # On Linux, we can't install here, but we'll try to use nslookup or skip
            echo "   Will use alternative method for DNS check"
            DNS_READY=false
        fi
    else
        echo "   This may take 10-30 minutes. Checking every 30 seconds..."
        DNS_READY=false
        for i in {1..20}; do
            sleep 30
            RESOLVED_IP=$(dig +short $DOMAIN 2>/dev/null | head -1 || echo "")
            if [ "$RESOLVED_IP" = "$PUBLIC_IP" ]; then
                echo "✅ DNS is resolving correctly!"
                DNS_READY=true
                break
            fi
            if [ $((i % 5)) -eq 0 ]; then
                echo "   Attempt $i/20: DNS not ready yet (resolved: $RESOLVED_IP, expected: $PUBLIC_IP)"
            fi
        done
    fi
    
    if [ "$DNS_READY" = false ]; then
        echo ""
        echo "⚠️  DNS may not be fully propagated yet"
        read -p "Continue with domain setup anyway? (y/n) " -n 1 -r
        echo ""
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            echo ""
            echo "⏸️  Skipping domain/SSL setup. Run manually later:"
            echo "   ssh -i ~/.ssh/$KEY_NAME.pem ec2-user@$PUBLIC_IP"
            echo "   cd /opt/business-app/app"
            echo "   sudo bash scripts/setup-domain-ec2.sh $DOMAIN"
            if [ -n "$EMAIL" ]; then
                echo "   sudo bash scripts/setup-ssl-ec2.sh $DOMAIN $EMAIL"
            else
                echo "   sudo bash scripts/setup-ssl-ec2.sh $DOMAIN"
            fi
            echo ""
            exit 0
        fi
    fi
    
    # Step 3: Add HTTPS port to security group (before domain/SSL setup)
    echo ""
    echo "🔒 Step 3: Ensuring HTTPS port (443) is open in security group..."
    HTTPS_EXISTS=$($AWS_CMD ec2 describe-security-groups \
        --region $REGION \
        --group-ids $SG_ID \
        --query 'SecurityGroups[0].IpPermissions[?FromPort==`443`]' \
        --output text 2>/dev/null || echo "")
    
    if [ -z "$HTTPS_EXISTS" ] || [ "$HTTPS_EXISTS" = "None" ]; then
        $AWS_CMD ec2 authorize-security-group-ingress \
            --region $REGION \
            --group-id $SG_ID \
            --protocol tcp \
            --port 443 \
            --cidr 0.0.0.0/0 2>/dev/null || true
        echo "✅ Port 443 added to security group"
    else
        echo "✅ Port 443 already allowed"
    fi
    
    # Step 4: Setup domain and SSL/HTTPS using comprehensive fix script
    echo ""
    echo "🔐 Step 4: Setting up domain and SSL/HTTPS (comprehensive fix)..."
    SSH_KEY_FILE="$HOME/.ssh/$KEY_NAME.pem"
    if [ ! -f "$SSH_KEY_FILE" ]; then
        echo "❌ SSH key not found: $SSH_KEY_FILE"
        echo "   Cannot setup domain/SSL automatically"
        echo "   Please run manually:"
        echo "   ssh -i ~/.ssh/$KEY_NAME.pem ec2-user@$PUBLIC_IP"
        echo "   cd /opt/business-app/app"
        echo "   sudo bash scripts/fix-https-complete.sh $DOMAIN $EMAIL"
        exit 1
    fi
    
    if [ -z "$EMAIL" ]; then
        EMAIL="admin@$DOMAIN"
    fi
    
    echo "   Connecting to EC2 and running comprehensive HTTPS fix..."
    echo "   This will setup domain, SSL certificate, and configure HTTPS..."
    echo "   (This may take 5-10 minutes)"
    echo ""
    
    ssh -i "$SSH_KEY_FILE" -o StrictHostKeyChecking=no -o ConnectTimeout=10 ec2-user@$PUBLIC_IP <<SSH_EOF
set -e
cd /opt/business-app/app

# Pull latest code to ensure fix-https-complete.sh is available
echo "📥 Pulling latest code..."
git pull origin main || echo "⚠️  Git pull failed, continuing with existing code..."

# Make sure the script is executable
chmod +x scripts/fix-https-complete.sh 2>/dev/null || true

# Run comprehensive HTTPS fix (handles domain setup, SSL, and all configurations)
echo "🔧 Running comprehensive HTTPS fix..."
sudo bash scripts/fix-https-complete.sh "$DOMAIN" "$EMAIL"
SSH_EOF
    
    HTTPS_EXIT_CODE=$?
    
    if [ $HTTPS_EXIT_CODE -eq 0 ]; then
        echo ""
        echo "🔍 Step 5: Verifying HTTPS..."
        sleep 5  # Give Nginx time to reload
        
        # Test HTTPS connectivity
        if curl -s -f -m 10 "https://$DOMAIN" > /dev/null 2>&1; then
            echo "✅ HTTPS is working: https://$DOMAIN"
        else
            echo "⚠️  HTTPS test failed, but setup may still be in progress"
            echo "   This can happen if:"
            echo "   - DNS is still propagating (wait 10-30 minutes)"
            echo "   - Certificate was just issued (wait 1-2 minutes)"
            echo "   - Nginx is still reloading"
            echo ""
            echo "   Test manually: curl -I https://$DOMAIN"
        fi
        
        # Verify certificate renewal is set up
        echo ""
        echo "🔍 Verifying certificate renewal setup..."
        ssh -i "$SSH_KEY_FILE" -o StrictHostKeyChecking=no -o ConnectTimeout=10 ec2-user@$PUBLIC_IP <<SSH_EOF
if systemctl is-active --quiet certbot-renew.timer 2>/dev/null || systemctl list-timers | grep -q certbot 2>/dev/null; then
    echo "✅ Certificate auto-renewal is configured"
else
    echo "⚠️  Certificate renewal timer not found (may be using cron instead)"
    echo "   Certbot typically sets up auto-renewal automatically"
fi
SSH_EOF
        
        echo ""
        echo "═══════════════════════════════════════════════════════════════"
        echo "🎉 DOMAIN & SSL SETUP COMPLETE!"
        echo "═══════════════════════════════════════════════════════════════"
        echo ""
        echo "🌐 Your application is now accessible via HTTPS:"
        echo "   ✅ https://$DOMAIN"
        echo "   ✅ https://www.$DOMAIN"
        echo ""
        echo "✅ HTTP automatically redirects to HTTPS"
        echo "✅ SSL certificate auto-renews every 90 days"
        echo ""
        echo "📋 Access Information:"
        echo "   - HTTPS: https://$DOMAIN"
        echo "   - HTTP: http://$DOMAIN (redirects to HTTPS)"
        echo "   - API: https://$DOMAIN/api/v1/*"
        echo "   - SSH: ssh -i ~/.ssh/$KEY_NAME.pem ec2-user@$PUBLIC_IP"
        echo ""
        echo "🧪 Test HTTPS:"
        echo "   curl -I https://$DOMAIN"
    else
        echo ""
        echo "❌ HTTPS setup failed (exit code: $HTTPS_EXIT_CODE)"
        echo ""
        echo "⚠️  Troubleshooting:"
        echo "   1. Check logs on EC2:"
        echo "      ssh -i ~/.ssh/$KEY_NAME.pem ec2-user@$PUBLIC_IP"
        echo "      sudo tail -f /var/log/letsencrypt/letsencrypt.log"
        echo "      sudo tail -f /var/log/nginx/error.log"
        echo ""
        echo "   2. Run fix manually:"
        echo "      ssh -i ~/.ssh/$KEY_NAME.pem ec2-user@$PUBLIC_IP"
        echo "      cd /opt/business-app/app"
        echo "      sudo bash scripts/fix-https-complete.sh $DOMAIN $EMAIL"
        echo ""
        echo "   3. Check prerequisites:"
        echo "      - DNS must point to EC2 IP: dig $DOMAIN +short"
        echo "      - Security group must allow ports 80 and 443"
        echo "      - Services must be running: docker ps"
        echo ""
        echo "⚠️  Deployment completed but HTTPS setup failed"
        echo "   Application is accessible via HTTP: http://$PUBLIC_IP"
        exit 1
    fi
elif [ -n "$DOMAIN" ]; then
    echo ""
    echo "⚠️  Domain provided but public IP not available yet"
    echo "   Once instance has public IP, run:"
    echo "   ssh -i ~/.ssh/$KEY_NAME.pem ec2-user@<PUBLIC_IP>"
    echo "   cd /opt/business-app/app"
    if [ -n "$EMAIL" ]; then
        echo "   sudo bash scripts/fix-https-complete.sh $DOMAIN $EMAIL"
    else
        echo "   sudo bash scripts/fix-https-complete.sh $DOMAIN"
    fi
fi

